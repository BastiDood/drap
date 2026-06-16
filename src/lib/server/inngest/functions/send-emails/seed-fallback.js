import { NonRetriableError } from 'inngest';

import { assertSingle } from '$lib/server/assert';
import {
  createEmailMessage,
  isRetryableGmailStatus,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import { EmailBatchEvent, EmailSeedFallbackEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import { getRefreshedCredentials } from '$lib/server/inngest/functions/send-emails/auth';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { lockGmailThreadsById, seedGmailThreadById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-emails.seed-fallback';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const sendSeedEmailFallback = inngest.createFunction(
  {
    id: 'send-seed-email-fallback',
    name: 'Send Seed Email Fallback',
    triggers: EmailSeedFallbackEvent,
  },
  async ({ event, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    const route = await step.run(
      { id: 'load-seed-fallback-thread', name: 'Load Seed Fallback Thread' },
      async () =>
        await tracer.asyncSpan(
          'load-seed-fallback-thread',
          async () =>
            await db.transaction(
              async tx => {
                const row = assertSingle(
                  await lockGmailThreadsById(tx, [BigInt(event.data.gmailThreadRowId)]),
                );
                return row.gmailThreadId === null
                  ? { sendRoot: true, followups: [] }
                  : {
                      sendRoot: false,
                      followups: [event.data.seed, ...event.data.followers].map(email => ({
                        gmailThreadRowId: event.data.gmailThreadRowId,
                        email,
                        attempt: event.data.attempt,
                      })),
                    };
              },
              { isolationLevel: 'read committed' },
            ),
        ),
    );

    const sent = await step.run(
      { id: 'send-seed-fallback-email', name: 'Send Seed Fallback Email' },
      async () =>
        await tracer.asyncSpan('send-seed-fallback-email', async () => {
          if (!route.sendRoot) return null;
          const { client, sender } = await getRefreshedCredentials();
          const { message } = await createEmailMessage(event.data.seed, sender);
          try {
            const result = await client.sendEmail(message);
            logger.info('gmail root seed fallback email sent successfully', {
              'email.attempt': event.data.attempt,
              'email.message.id': result.id,
              'email.message.thread_id': result.threadId,
              'email.message.internal_date': result.internalDate,
              'email.message.label_ids': result.labelIds,
            });
            return {
              gmailMessageId: result.id,
              gmailThreadId: result.threadId,
            };
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
              throw new NonRetriableError('gmail seed fallback failed with non-retryable status', {
                cause,
              });
            throw cause;
          }
        }),
    );

    const followups = await step.run(
      { id: 'persist-seed-fallback-thread', name: 'Persist Seed Fallback Thread' },
      async () =>
        await tracer.asyncSpan('persist-seed-fallback-thread', async () => {
          if (sent === null) return route.followups;

          const { client } = await getRefreshedCredentials();
          const gmailMessageIdHeader = await client.getMessageIdHeader(sent.gmailMessageId);
          await db.transaction(
            async tx => {
              await seedGmailThreadById(
                tx,
                BigInt(event.data.gmailThreadRowId),
                sent.gmailThreadId,
                [gmailMessageIdHeader],
              );
            },
            { isolationLevel: 'read committed' },
          );
          return event.data.followers.map(email => ({
            gmailThreadRowId: event.data.gmailThreadRowId,
            email,
            attempt: 0,
          }));
        }),
    );

    if (followups.length > 0)
      await step.sendEvent(
        'dispatch-seed-fallback-followups',
        followups.map(data => EmailBatchEvent.create(data)),
      );
    return followups.length;
  },
);

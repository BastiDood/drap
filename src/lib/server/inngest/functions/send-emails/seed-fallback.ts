import { NonRetriableError } from 'inngest';

import { assertSingle } from '$lib/server/assert';
import {
  createEmailMessage,
  getGmailThreadKey,
  getGmailThreadKeyString,
} from '$lib/server/inngest/functions/send-emails/event';
import { db } from '$lib/server/database';
import { EmailBatchEvent, EmailSeedFallbackEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import {
  getRefreshedCredentials,
  type RefreshedCredentials,
} from '$lib/server/inngest/functions/send-emails/auth';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { lockGmailThreads, seedGmailThreadById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import { GmailDeliveryAttempt } from './retry';
import { ManualMetadataReconciliationRequiredError } from './errors';

const SERVICE_NAME = 'inngest.functions.send-emails.seed-fallback';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const sendSeedEmailFallback = inngest.createFunction(
  {
    id: 'send-seed-email-fallback',
    name: 'Send Seed Email Fallback',
    concurrency: {
      limit: 1,
      scope: 'env',
      key: '"gmail-designated-sender"',
    },
    throttle: {
      limit: 2,
      period: '1m',
      burst: 1,
    },
    retries: 0,
    triggers: EmailSeedFallbackEvent,
  },
  async ({ event, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

    const followups = await step.run(
      { id: 'seed-fallback-email-thread', name: 'Seed Fallback Email Thread' },
      async () => {
        const credentials = await getRefreshedCredentials();
        return await seedFallbackEmailThread(event.data, credentials);
      },
    );

    if (followups.length > 0)
      await step.sendEvent(
        'dispatch-seed-fallback-followups',
        followups.map(data => EmailBatchEvent.create(data)),
      );
    return followups.length;
  },
);

async function seedFallbackEmailThread(
  event: EmailSeedFallbackEvent,
  credentials: RefreshedCredentials,
) {
  return await tracer.asyncSpan('seed-fallback-email-thread', async span => {
    const key = getGmailThreadKey(event.seed);
    span.setAttributes({
      'email.seed.follower.count': event.followers.length,
      'email.gmail_thread.logical_key': getGmailThreadKeyString(key),
    });

    return await db.transaction(
      async tx => {
        const row = assertSingle(await lockGmailThreads(tx, [key]));
        if (row.gmailThreadId !== null)
          return [event.seed, ...event.followers].map(email => ({
            email,
            batchAttempt: 0,
          }));

        const { message } = await createEmailMessage(event.seed, credentials.sender);

        let result: Awaited<ReturnType<typeof credentials.client.sendEmail>>;
        try {
          result = await credentials.client.sendEmail(message);
        } catch (cause) {
          if (cause instanceof GmailScopeError)
            throw new NonRetriableError('missing gmail scopes', { cause });
          if (cause instanceof GmailError)
            throw new NonRetriableError('gmail seed email exhausted delivery attempts', {
              cause,
            });
          throw cause;
        }

        logger.info('gmail root seed fallback email sent successfully', {
          'email.message.id': result.id,
          'email.message.thread_id': result.threadId,
        });

        // Keep Gmail metadata lookup in this transaction so seeded threads only become visible
        // after their Gmail thread ID and first `Message-ID` header can be persisted together.
        let gmailMessageId: string;
        try {
          gmailMessageId = await credentials.client.getMessageIdHeader(result.id);
        } catch (cause) {
          span.setAttributes({
            'email.reconciliation.required': true,
            'email.reconciliation.stage': 'gmail-metadata',
            'email.reconciliation.message.count': 1,
            'email.delivery.transport': 'single-fallback',
            'email.delivery.attempt': GmailDeliveryAttempt.SingleFallback,
          });
          if (cause instanceof Error)
            logger.fatal('gmail seed fallback requires manual metadata reconciliation', cause, {
              'email.gmail_thread.row_id': String(row.id),
              'email.message.id': result.id,
              'email.message.thread_id': result.threadId,
            });
          throw new ManualMetadataReconciliationRequiredError({ cause });
        }

        await seedGmailThreadById(tx, row.id, result.threadId, [gmailMessageId]);

        return event.followers.map(email => ({ email, batchAttempt: 0 }));
      },
      { isolationLevel: 'read committed' },
    );
  });
}

import { NonRetriableError } from 'inngest';

import { db } from '$lib/server/database';
import {
  DraftConcludedFallbackEmailEvent,
  DraftFinalizationFallbackEmailEvent,
  LotteryInterventionFallbackEmailEvent,
  RoundStartedFallbackEmailEvent,
  RoundSubmittedFallbackEmailEvent,
  UserAssignedFallbackEmailEvent,
} from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { upsertEmailThread } from '$lib/server/database/drizzle';

import { createEmailMessage, getRefreshedCredentials, isRetryableGmailStatus } from './shared';

const SERVICE_NAME = 'inngest.functions.send-email.fallback';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const sendEmailFallback = inngest.createFunction(
  {
    id: 'send-email-fallback',
    name: 'Send Email Fallback',
    triggers: [
      RoundStartedFallbackEmailEvent,
      RoundSubmittedFallbackEmailEvent,
      LotteryInterventionFallbackEmailEvent,
      DraftConcludedFallbackEmailEvent,
      DraftFinalizationFallbackEmailEvent,
      UserAssignedFallbackEmailEvent,
    ],
  },
  async ({ event, step }) => {
    if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');
    await step.run(
      { id: 'send-email-fallback', name: 'Send Email Fallback' },
      async () =>
        await tracer.asyncSpan('send-email-fallback', async span => {
          switch (event.name) {
            case 'draft/round.started.email.fallback':
            case 'draft/round.submitted.email.fallback':
            case 'draft/lottery.intervened.email.fallback':
            case 'draft/draft.concluded.email.fallback':
            case 'draft/draft.finalization.email.fallback':
            case 'draft/user.assigned.email.fallback':
              break;
            default:
              throw new NonRetriableError(`unexpected event type: ${event.name}`);
          }

          span.setAttribute('email.original_event.id', event.data.id);

          const { client, sender } = await getRefreshedCredentials();
          const { message, emailThreadId } = await createEmailMessage(event, sender);

          try {
            const result = await client.sendEmail(message, emailThreadId);
            logger.info('gmail single-send email sent successfully', {
              'email.message.id': result.id,
              'email.message.thread_id': result.threadId,
              'email.message.internal_date': result.internalDate,
              'email.message.label_ids': result.labelIds,
            });

            // Create/update the email thread
            try {
              if ('draftId' in event.data) {
                const messageIdHeader = message.getHeader('Message-ID');

                if (typeof messageIdHeader !== 'undefined') {
                  const recipients = message.getRecipients();

                  if (typeof recipients !== 'undefined') {
                    const subject = message.getSubject();

                    if (typeof subject !== 'undefined') {
                      const messageId = messageIdHeader.toString();
                      const iterableRecipients = Array.isArray(recipients)
                        ? recipients
                        : [recipients];

                      for (const recipient of iterableRecipients) 
                        await upsertEmailThread(
                          db,
                          result.threadId,
                          messageId,
                          BigInt(event.data.draftId),
                          subject,
                          recipient.addr,
                        );
                      
                    }
                  }
                }
              }
            } catch (error) {
              if (error instanceof Error) logger.error('failed to update email thread', error);
            }

            return result;
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
              throw new NonRetriableError('gmail single-send failed with non-retryable status', {
                cause,
              });
            throw cause;
          }
        }),
    );
  },
);

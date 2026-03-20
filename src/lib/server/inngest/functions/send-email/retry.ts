import { NonRetriableError } from 'inngest';

import {
  DraftFinalizedFallbackEmailEvent,
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

import { createEmailMessage, getRefreshedCredentials, isRetryableGmailStatus } from './shared';

const SERVICE_NAME = 'inngest.functions.send-email';
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
      DraftFinalizedFallbackEmailEvent,
      UserAssignedFallbackEmailEvent,
    ],
  },
  async ({ event, step }) =>
    await step.run(
      { id: 'send-email-fallback', name: 'Send Email Fallback' },
      async () =>
        await tracer.asyncSpan('send-email-fallback', async span => {
          if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

          switch (event.name) {
            case 'draft/round.started.email.fallback':
            case 'draft/round.submitted.email.fallback':
            case 'draft/lottery.intervened.email.fallback':
            case 'draft/draft.finalized.email.fallback':
            case 'draft/user.assigned.email.fallback':
              break;
            default:
              throw new NonRetriableError(`unexpected event type: ${event.name}`);
          }

          span.setAttribute('email.original_event.id', event.data.id);

          const { client, sender } = await getRefreshedCredentials();
          const message = await createEmailMessage(event, sender);

          try {
            const result = await client.sendEmail(message);
            logger.info('gmail single-send email sent successfully', {
              'email.message.id': result.id,
              'email.message.thread_id': result.threadId,
              'email.message.internal_date': result.internalDate,
              'email.message.label_ids': result.labelIds,
            });
            return result;
          } catch (cause) {
            logger.error(
              'gmail single-send email failed',
              cause instanceof Error ? cause : void 0,
              {},
            );

            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            if (cause instanceof GmailError && !isRetryableGmailStatus(cause.status))
              throw new NonRetriableError('gmail single-send failed with non-retryable status', {
                cause,
              });
            throw cause;
          }
        }),
    ),
);

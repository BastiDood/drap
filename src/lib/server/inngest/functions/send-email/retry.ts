import { NonRetriableError } from 'inngest';

import { EmailSingleSendRequestedEvent } from '$lib/server/inngest/schema';
import { ENABLE_EMAILS } from '$lib/server/env/drap/email';
import { GmailError, GmailScopeError } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import { createEmailMessage, getRefreshedCredentials, isRetryableGmailStatus } from './shared';

const SERVICE_NAME = 'inngest.functions.send-email';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const retryEmail = inngest.createFunction(
  {
    id: 'send-email-retry',
    name: 'Send Email Retry',
    triggers: [EmailSingleSendRequestedEvent],
  },
  async ({ event, step }) =>
    await step.run(
      { id: 'send-email-single', name: 'Send Email Single' },
      async () =>
        await tracer.asyncSpan('send-email-single', async span => {
          if (!ENABLE_EMAILS) throw new NonRetriableError('emails disabled during dry run');

          span.setAttribute('email.original_event.id', event.data.id);

          const { client, sender } = await getRefreshedCredentials();
          const message = await createEmailMessage(event.data, sender);

          try {
            const result = await client.sendEmail(message);
            logger.info('gmail single-send email sent successfully', {
              'email.message.id': result.id,
              'email.message.thread_id': result.threadId,
              'email.message.internal_date': result.internalDate,
              'email.message.label_ids': result.labelIds,
            });
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

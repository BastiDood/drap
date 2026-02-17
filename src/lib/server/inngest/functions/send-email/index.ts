import Renderer, { toPlainText } from 'better-svelte-email/render';
import type { ComponentProps } from 'svelte';
import { createMimeMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';

import { db } from '$lib/server/database';
import {
  type DrizzleTransaction,
  getDesignatedSenderCredentialsForUpdate,
  type schema,
  updateCandidateSender,
} from '$lib/server/database/drizzle';
import { ENABLE_EMAILS } from '$lib/server/env/drap';
import { GmailScopeError, GoogleOAuthClient } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import DraftConcluded from './draft-concluded.svelte';
import LotteryIntervened from './lottery-intervened.svelte';
import RoundStarted from './round-started.svelte';
import RoundSubmitted from './round-submitted.svelte';
import UserAssigned from './user-assigned.svelte';

const SERVICE_NAME = 'inngest.functions.send-email';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

// Resolved hex equivalents of the oklch design tokens from `app.css` :root.
const renderer = new Renderer({
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#087542', foreground: '#f2fdf0' },
        secondary: { DEFAULT: '#96ceae', foreground: '#0d332b' },
        foreground: '#121815',
        muted: { DEFAULT: '#c2c9ce', foreground: '#444f47' },
        card: { DEFAULT: '#e9eff3', foreground: '#36413a' },
      },
    },
  },
});

export const sendEmail = inngest.createFunction(
  { id: 'send-email', name: 'Send Email', batchEvents: { maxSize: 100, timeout: '10s' } },
  [
    { event: 'draft/round.started' },
    { event: 'draft/round.submitted' },
    { event: 'draft/lottery.intervened' },
    { event: 'draft/draft.concluded' },
    { event: 'draft/user.assigned' },
  ],
  async ({ events, step }) =>
    await step.run(
      'send-emails',
      async () =>
        await tracer.asyncSpan('send-emails', async () => {
          // Always obtain the freshest credentials per retry.
          const { client, sender } = await db.transaction(
            async db => await RefreshedCredentials.fromTransaction(db),
            { isolationLevel: 'read uncommitted' },
          );

          const messages = await Promise.all(
            events.map(async event => {
              /* eslint-disable @typescript-eslint/init-declarations */
              let recipient: string;
              let subject: string;
              let html: string;
              /* eslint-enable @typescript-eslint/init-declarations */

              switch (event.name) {
                case 'draft/round.started':
                  recipient = event.data.recipientEmail;
                  subject =
                    event.data.round === null
                      ? `[DRAP] Lottery Round for Draft #${event.data.draftId} has begun!`
                      : `[DRAP] Round #${event.data.round} for Draft #${event.data.draftId} has begun!`;
                  html = await renderer.render(RoundStarted, {
                    props: {
                      draftId: event.data.draftId,
                      round: event.data.round,
                    } satisfies ComponentProps<typeof RoundStarted>,
                  });
                  break;
                case 'draft/round.submitted':
                  recipient = event.data.recipientEmail;
                  subject = `[DRAP] Acknowledgement from ${event.data.labId.toUpperCase()} for Round #${event.data.round} of Draft #${event.data.draftId}`;
                  html = await renderer.render(RoundSubmitted, {
                    props: {
                      labName: event.data.labName,
                      round: event.data.round,
                      draftId: event.data.draftId,
                    } satisfies ComponentProps<typeof RoundSubmitted>,
                  });
                  break;
                case 'draft/lottery.intervened':
                  recipient = event.data.recipientEmail;
                  subject = `[DRAP] Lottery Intervention for ${event.data.labId.toUpperCase()} in Draft #${event.data.draftId}`;
                  html = await renderer.render(LotteryIntervened, {
                    props: {
                      studentName: event.data.studentName,
                      studentEmail: event.data.studentEmail,
                      labName: event.data.labName,
                      draftId: event.data.draftId,
                    } satisfies ComponentProps<typeof LotteryIntervened>,
                  });
                  break;
                case 'draft/draft.concluded':
                  recipient = event.data.recipientEmail;
                  subject = `[DRAP] Draft #${event.data.draftId} Concluded`;
                  html = await renderer.render(DraftConcluded, {
                    props: {
                      draftId: event.data.draftId,
                      lotteryAssignments: event.data.lotteryAssignments,
                    } satisfies ComponentProps<typeof DraftConcluded>,
                  });
                  break;
                case 'draft/user.assigned':
                  recipient = event.data.userEmail;
                  subject = `[DRAP] Assigned to ${event.data.labId.toUpperCase()}`;
                  html = await renderer.render(UserAssigned, {
                    props: {
                      userName: event.data.userName,
                      labName: event.data.labName,
                    } satisfies ComponentProps<typeof UserAssigned>,
                  });
                  break;
                default: {
                  const error = new NonRetriableError('unknown event type');
                  logger.error('unknown event type', error);
                  throw error;
                }
              }

              const mime = createMimeMessage();
              mime.setSender({
                name: `[DRAP] ${sender.givenName} ${sender.familyName}`,
                addr: sender.email,
              });
              mime.setRecipient(recipient);
              mime.setSubject(subject);
              mime.addMessage({
                contentType: 'text/plain',
                encoding: 'base64',
                data: Buffer.from(toPlainText(html), 'utf-8').toString('base64'),
              });
              mime.addMessage({
                contentType: 'text/html',
                encoding: 'base64',
                data: Buffer.from(html, 'utf-8').toString('base64'),
              });
              return mime;
            }),
          );

          if (ENABLE_EMAILS) {
            logger.debug('sending email...');
            try {
              await client.sendEmails(messages);
            } catch (cause) {
              if (cause instanceof GmailScopeError)
                throw new NonRetriableError('missing gmail scopes', { cause });
              throw cause;
            }
          } else {
            logger.warn('emails disabled during dry run');
          }

          // TODO: Log the result of the bulk operation.
        }),
    ),
);

class RefreshedCredentials {
  private constructor(
    public readonly client: GoogleOAuthClient,
    public readonly sender: Pick<schema.User, 'email' | 'givenName' | 'familyName'>,
  ) {}

  static async fromTransaction(db: DrizzleTransaction) {
    return await tracer.asyncSpan('refresh-sender-credentials', async () => {
      logger.trace('getting designated sender credentials...');
      const sender = await getDesignatedSenderCredentialsForUpdate(db);
      if (typeof sender === 'undefined') {
        const error = new NonRetriableError('no designated sender configured');
        logger.error('no designated sender configured', error);
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/init-declarations
      let client: GoogleOAuthClient;
      if (sender.isValid) {
        client = new GoogleOAuthClient(sender.accessToken, sender.scopes);
      } else {
        logger.debug('refreshing OAuth token...');
        const refreshed = await GoogleOAuthClient.fromRefreshToken(sender.refreshToken);
        ({ client } = refreshed);

        logger.debug('updating candidate sender...');
        await updateCandidateSender(
          db,
          sender.id,
          refreshed.token.expiresIn,
          client.scopes,
          client.accessToken,
          sender.refreshToken,
        );
      }

      return new RefreshedCredentials(client, sender);
    });
  }
}

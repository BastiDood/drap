import { createMimeMessage } from 'mimetext/node';
import { NonRetriableError } from 'inngest';

import {
  type DrizzleTransaction,
  db,
  getDesignatedSenderCredentialsForUpdate,
  type schema,
  updateCandidateSender,
} from '$lib/server/database';
import { GmailScopeError, GoogleOAuthClient } from '$lib/server/google';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.send-email';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

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
      'refresh-sender-credentials',
      async () =>
        await tracer.asyncSpan('refresh-sender-credentials', async () => {
          // Always obtain the freshest credentials per retry.
          const { client, sender } = await db.transaction(
            async db => await RefreshedCredentials.fromTransaction(db),
            { isolationLevel: 'read uncommitted' },
          );

          const messages = events.map(event => {
            // eslint-disable-next-line @typescript-eslint/init-declarations
            let recipient: string;
            // eslint-disable-next-line @typescript-eslint/init-declarations
            let subject: string;
            // eslint-disable-next-line @typescript-eslint/init-declarations
            let body: string;

            switch (event.name) {
              case 'draft/round.started':
                recipient = event.data.recipientEmail;
                if (event.data.round === null) {
                  subject = `[DRAP] Lottery Round for Draft #${event.data.draftId} has begun!`;
                  body = `The lottery round for Draft #${event.data.draftId} has begun. For lab heads, kindly coordinate with the draft administrators for the next steps.`;
                } else {
                  subject = `[DRAP] Round #${event.data.round} for Draft #${event.data.draftId} has begun!`;
                  body = `Round #${event.data.round} for Draft #${event.data.draftId} has begun. For lab heads, kindly check the students module to see the list of students who have chosen your lab.`;
                }
                break;
              case 'draft/round.submitted':
                recipient = event.data.recipientEmail;
                subject = `[DRAP] Acknowledgement from ${event.data.labId.toUpperCase()} for Round #${event.data.round} of Draft #${event.data.draftId}`;
                body = `The ${event.data.labName} has submitted their student preferences for Round #${event.data.round} of Draft #${event.data.draftId}.`;
                break;
              case 'draft/lottery.intervened': {
                recipient = event.data.recipientEmail;
                subject = `[DRAP] Lottery Intervention for ${event.data.labId.toUpperCase()} in Draft #${event.data.draftId}`;
                body = `${event.data.studentName} <${event.data.studentEmail}> has been manually assigned to ${event.data.labName} during the lottery round of Draft #${event.data.draftId}.`;
                break;
              }
              case 'draft/draft.concluded':
                recipient = event.data.recipientEmail;
                subject = `[DRAP] Draft #${event.data.draftId} Concluded`;
                body = `Draft #${event.data.draftId} has just concluded. See the new roster of researchers using the lab module.`;
                break;
              case 'draft/user.assigned':
                recipient = event.data.userEmail;
                subject = `[DRAP] Assigned to ${event.data.labId.toUpperCase()}`;
                body = `Hello, ${event.data.userName}! Kindly note that you have been assigned to the ${event.data.labName}.`;
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
              data: Buffer.from(body, 'utf-8').toString('base64'),
            });
            return mime;
          });

          logger.debug('sending email...');
          try {
            await client.sendEmails(messages);
          } catch (cause) {
            if (cause instanceof GmailScopeError)
              throw new NonRetriableError('missing gmail scopes', { cause });
            throw cause;
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
  }
}

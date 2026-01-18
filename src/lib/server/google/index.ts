import type { MIMEMessage } from 'mimetext/node';
import { parse } from 'valibot';

import { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } from '$lib/server/env/google';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

import { GmailMessageSendResult, TokenResponse } from './schema';

const SERVICE_NAME = 'lib.server.google';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export class GoogleOAuthClient {
  constructor(
    public readonly accessToken: string,
    public readonly scopes: string[],
  ) {}

  static async fromRefreshToken(refreshToken: string) {
    return await tracer.asyncSpan('google-oauth-client-from-refresh-token', async () => {
      logger.trace('refreshing OAuth token...');
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: OAUTH_CLIENT_ID,
          client_secret: OAUTH_CLIENT_SECRET,
          grant_type: 'refresh_token',
        }),
      });

      logger.debug('reading token response...');
      const json = await response.json();
      const token = parse(TokenResponse, json);

      // Reuse the old token in case we're expected to reuse it.
      const newRefreshToken = token.refresh_token ?? refreshToken;
      return new RefreshedGoogleOAuth(
        new GoogleOAuthClient(token.access_token, token.scope),
        new GoogleOAuthToken(newRefreshToken, token.expires_in),
      );
    });
  }

  async sendEmail(message: MIMEMessage) {
    return await tracer.asyncSpan('google-oauth-client-send-email', async span => {
      let subjectLength = 0;
      const subject = message.getSubject();
      if (typeof subject !== 'undefined') subjectLength = subject.length;

      let recipientCount = 0;
      const recipients = message.getRecipients();
      if (Array.isArray(recipients)) recipientCount = recipients.length;
      else if (typeof recipients !== 'undefined') recipientCount = 1;

      const raw = message.asEncoded();
      span.setAttributes({
        'email.send.to.count': recipientCount,
        'email.send.subject.length': subjectLength,
        'email.send.encoded_body.length': raw.length,
      });

      logger.trace('sending email request to gmail api...');
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      logger.trace('reading response...');
      switch (response.status) {
        case 200: {
          const json = await response.json();
          const result = parse(GmailMessageSendResult, json);
          logger.info('received successful response from gmail api', {
            'email.message.id': result.id,
            'email.message.thread_id': result.threadId,
            'email.message.label_ids': result.labelIds,
          });
          return result;
        }
        case 429:
        // TODO: Handle rate limits.
        default: {
          const body = await response.text();
          return GmailError.throwNew(response.status, body);
        }
      }
    });
  }
}

export class GoogleOAuthToken {
  constructor(
    public readonly refreshToken: string,
    /** Expressed in seconds from now. */
    public readonly expiresIn: number,
  ) {}
}

export class RefreshedGoogleOAuth {
  constructor(
    public readonly client: GoogleOAuthClient,
    public readonly token: GoogleOAuthToken,
  ) {}
}

export class GmailError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`upstream gmail api returned status ${status}: ${body}`);
    this.name = 'UpstreamGmailError';
  }

  static throwNew(status: number, body: string): never {
    const error = new GmailError(status, body);
    logger.error('gmail api error message', error, {
      'gmail.response.status': status,
      'gmail.response.body': body,
    });
    throw error;
  }
}

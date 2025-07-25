import { fail } from 'node:assert/strict';

import { isFuture, sub } from 'date-fns';
import { parse, pick } from 'valibot';
import type { Job } from 'bullmq';
import type { Logger } from 'pino';
import { createMimeMessage } from 'mimetext/node';
import { jwtVerify } from 'jose';

import * as GOOGLE from '$lib/server/env/google';
import { Database, type schema } from '$lib/server/database';
import type { DraftNotification, UserNotification } from '$lib/server/models/notification';
import { IdToken, TokenResponse } from '$lib/server/models/oauth';
import { GmailMessageSendResult } from '$lib/server/models/email';
import { logError } from '$lib/server/logger';

import { fetchJwks } from './jwks';

export type EmailAddress = schema.User['email'];

export class UpstreamGmailError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`upstream gmail api returned status ${status}: ${body}`);
    this.name = 'UpstreamGmailError';
  }
}

export class Emailer {
  #db: Database;
  #clientId: string;
  #clientSecret: string;

  constructor(db: Database, id: string, secret: string) {
    this.#db = db;
    this.#clientId = id;
    this.#clientSecret = secret;
  }

  get db() {
    return this.#db;
  }

  /** Must be called within a transaction context for correctness. */
  async #getLatestCredentials() {
    this.#db.logger.info('fetching latest credentials');
    const creds = await this.#db.getDesignatedSenderCredentials();

    if (typeof creds === 'undefined') {
      this.#db.logger.warn('no credentials found');
      return;
    }

    if (isFuture(sub(creds.expiration, { minutes: 10 }))) {
      this.#db.logger.info('using existing credentials');
      return creds;
    }

    this.#db.logger.info(
      { designatedSenderId: creds.id, expiration: creds.expiration },
      'refreshing credentials',
    );

    // Refresh the access token if necessary
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: creds.refreshToken,
        client_id: this.#clientId,
        client_secret: this.#clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    this.#db.logger.info('reading token response');
    const json = await res.json();
    const { id_token, access_token } = parse(TokenResponse, json);
    creds.accessToken = access_token; // overwritten credentials

    this.#db.logger.info('verifying id token');
    const { payload } = await jwtVerify(id_token, fetchJwks, {
      issuer: 'https://accounts.google.com',
      audience: this.#clientId,
    });

    this.#db.logger.info('upserting candidate sender with new verified token');
    const token = parse(pick(IdToken, ['exp']), payload);
    await this.#db.upsertCandidateSender(creds.id, token.exp, creds.accessToken);
    return creds;
  }

  /** Must be called within a transaction context for correctness. */
  async send(to: EmailAddress[], subject: string, body: string) {
    this.#db.logger.info('sending email');

    const creds = await this.#getLatestCredentials();
    if (typeof creds === 'undefined') {
      this.#db.logger.warn('no credentials found for sending email');
      return null;
    }

    const message = createMimeMessage();
    message.setSender({ name: `[DRAP] ${creds.givenName} ${creds.familyName}`, addr: creds.email });
    message.setRecipient(to);
    message.setSubject(subject);
    message.addMessage({
      contentType: 'text/plain',
      encoding: 'base64',
      data: Buffer.from(body, 'utf-8').toString('base64'),
    });

    this.#db.logger.info('sending email request to gmail api');
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: message.asEncoded() }),
    });

    // TODO: Handle rate limits.
    if (response.status !== 200) {
      this.#db.logger.error({ status: response.status }, 'unexpected status code from gmail api');
      const body = await response.text();
      this.#db.logger.error({ body }, 'gmail api error message');
      throw new UpstreamGmailError(response.status, body);
    }

    this.#db.logger.info('receiving successful response from gmail api');
    const json = await response.json();
    return parse(GmailMessageSendResult, json);
  }
}

export class UnknownNotificationError extends Error {
  constructor() {
    super('unknown notification');
    this.name = 'UnknownNotificationError';
  }
}

export class MissingDesignatedSender extends Error {
  constructor() {
    super('no designated sender configured');
    this.name = 'MissingDesignatedSender';
  }
}

async function processDraftNotification(
  db: Database,
  emailer: Emailer,
  notification: DraftNotification,
) {
  // eslint-disable-next-line @typescript-eslint/init-declarations
  let emails: EmailAddress[];
  // eslint-disable-next-line @typescript-eslint/init-declarations
  let subject: string;
  // eslint-disable-next-line @typescript-eslint/init-declarations
  let message: string;
  switch (notification.type) {
    case 'RoundStart': {
      const facultyAndStaff = await db.getFacultyAndStaff();
      emails = facultyAndStaff.map(({ email }) => email);
      if (notification.round === null) {
        subject = `[DRAP] Lottery Round for Draft #${notification.draftId} has begun!`;
        message = `The lottery round for Draft #${notification.draftId} has begun. For lab heads, kindly coordinate with the draft administrators for the next steps.`;
      } else {
        subject = `[DRAP] Round #${notification.round} for Draft #${notification.draftId} has begun!`;
        message = `Round #${notification.round} for Draft #${notification.draftId} has begun. For lab heads, kindly check the students module to see the list of students who have chosen your lab.`;
      }
      break;
    }
    case 'RoundSubmit': {
      const [staffEmails, { name }] = await Promise.all([
        db.getValidStaffEmails(),
        db.getLabById(notification.labId),
      ]);
      emails = staffEmails;
      subject = `[DRAP] Acknowledgement from ${notification.labId.toUpperCase()} for Round #${notification.round} of Draft #${notification.draftId}`;
      message = `The ${name} has submitted their student preferences for Round #${notification.round} of Draft #${notification.draftId}.`;
      break;
    }
    case 'LotteryIntervention': {
      const [facultyAndStaff, { name }, { givenName, familyName, email }] = await Promise.all([
        db.getFacultyAndStaff(),
        db.getLabById(notification.labId),
        db.getUserById(notification.userId),
      ]);
      emails = facultyAndStaff.map(({ email }) => email);
      subject = `[DRAP] Lottery Intervention for ${notification.labId.toUpperCase()} in Draft #${notification.draftId}`;
      message = `${givenName} ${familyName} <${email}> has been manually assigned to ${name} during the lottery round of Draft #${notification.draftId}.`;
      break;
    }
    case 'Concluded': {
      const facultyAndStaff = await db.getFacultyAndStaff();
      emails = facultyAndStaff.map(({ email }) => email);
      subject = `[DRAP] Draft #${notification.draftId} Concluded`;
      message = `Draft #${notification.draftId} has just concluded. See the new roster of researchers using the lab module.`;
      break;
    }
    default:
      return null;
  }
  return await emailer.send(emails, subject, message);
}

async function processUserNotification(
  db: Database,
  emailer: Emailer,
  notification: UserNotification,
) {
  const [{ name }, { email, givenName, familyName }] = await Promise.all([
    db.getLabById(notification.labId),
    db.getUserById(notification.userId),
  ]);
  return await emailer.send(
    [email],
    `[DRAP] Assigned to ${notification.labId.toUpperCase()}`,
    `Hello, ${givenName} ${familyName}! Kindly note that you have been assigned to the ${name}.`,
  );
}

export function initializeProcessor(parent: Logger) {
  return async function processor({ id }: Pick<Job<unknown>, 'id'>) {
    const logger = parent.child({ notificationId: id });
    try {
      const db = Database.withLogger(logger);
      const emailer = new Emailer(db, GOOGLE.OAUTH_CLIENT_ID, GOOGLE.OAUTH_CLIENT_SECRET);

      logger.info('processing notification');
      if (typeof id === 'undefined') {
        logger.warn('attempted to process notification with no id');
        return;
      }

      await emailer.db.begin(async db => {
        const notification = await db.getNotification(id);
        if (typeof notification === 'undefined') {
          logger.warn('attempted to process nonexistent notification');
          throw new UnknownNotificationError();
        }

        const { data, deliveredAt } = notification;
        if (deliveredAt !== null) {
          logger.warn({ deliveredAt }, 'attempted to process delivered notification');
          return; // ACK to remove from the queue...
        }

        logger.info(data, 'processing notification');

        // eslint-disable-next-line @typescript-eslint/init-declarations
        let result: GmailMessageSendResult | null;
        switch (data.target) {
          case 'Draft':
            result = await processDraftNotification(db, emailer, data);
            break;
          case 'User':
            result = await processUserNotification(db, emailer, data);
            break;
          default:
            fail('unreachable');
        }

        if (result === null) {
          logger.error('no designated sender configured');
          throw new MissingDesignatedSender();
        }

        logger.info(result, 'email sent');
        await db.markNotificationDelivered(id);
      });

      logger.info('notification processed');
    } catch (error) {
      logError(logger, error);
      throw error;
    }
  };
}

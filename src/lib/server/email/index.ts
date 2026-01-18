import { fail } from 'node:assert/strict';

import { createMimeMessage } from 'mimetext/node';

import { GoogleOAuthClient } from '$lib/server/google';

import * as GOOGLE from '$lib/server/env/google';
import {
  begin,
  type DbConnection,
  db,
  getDesignatedSenderCredentialsForUpdate,
  getFacultyAndStaff,
  getLabById,
  getNotification,
  getUserById,
  getValidStaffEmails,
  markNotificationDelivered,
  type schema,
  upsertCandidateSender,
  type DrizzleTransaction,
  updateCandidateSender,
} from '$lib/server/database';
import type { DraftNotification, UserNotification } from '$lib/server/models/notification';
import { GmailMessageSendResult } from '$lib/server/models/email';
import { IdToken, TokenResponse } from '$lib/server/models/oauth';
import { Logger } from '$lib/server/telemetry/logger';

import { fetchJwks } from './jwks';

const SERVICE_NAME = 'email';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

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
  #db: DbConnection;
  #clientId: string;
  #clientSecret: string;

  constructor(db: DbConnection, id: string, secret: string) {
    this.#db = db;
    this.#clientId = id;
    this.#clientSecret = secret;
  }

  get db() {
    return this.#db;
  }

  /** Must be called within a transaction context for correctness. */
  async #getLatestCredentials() {
    logger.debug('fetching latest credentials');
    const creds = await getDesignatedSenderCredentialsForUpdate(this.#db);

    if (typeof creds === 'undefined') {
      logger.warn('no credentials found');
      return;
    }

    if (isFuture(sub(creds.expiration, { minutes: 10 }))) {
      logger.debug('using existing credentials');
      return creds;
    }

    logger.debug('refreshing credentials', {
      'email.sender.id': creds.id,
      'email.token.expiration': creds.expiration.toISOString(),
    });

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

    logger.debug('reading token response');
    const json = await res.json();
    const { id_token, access_token } = parse(TokenResponse, json);
    creds.accessToken = access_token; // overwritten credentials

    logger.debug('verifying id token');
    const { payload } = await jwtVerify(id_token, fetchJwks, {
      issuer: 'https://accounts.google.com',
      audience: this.#clientId,
    });

    logger.debug('upserting candidate sender with new verified token');
    const token = parse(pick(IdToken, ['exp']), payload);
    await upsertCandidateSender(this.#db, creds.id, token.exp, creds.accessToken);
    return creds;
  }

  /** Must be called within a transaction context for correctness. */
  async send(to: EmailAddress[], subject: string, body: string) {
    logger.debug('fetching latest credentials');
    const creds = await this.#getLatestCredentials();
    if (typeof creds === 'undefined') {
      logger.warn('no credentials found for sending email');
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

    logger.debug('sending email request to gmail api');
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
      logger.error('unexpected status code from gmail api', void 0, {
        'gmail.response.status': response.status,
      });
      const body = await response.text();
      logger.error('gmail api error message', void 0, { 'gmail.response.body': body });
      throw new UpstreamGmailError(response.status, body);
    }

    logger.debug('receiving successful response from gmail api');
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

  static throwNew(): never {
    const error = new MissingDesignatedSender();
    logger.error('no designated sender configured', error);
    throw error;
  }
}

async function processDraftNotification(db: DbConnection, notification: DraftNotification) {
  return await tracer.asyncSpan('process-draft-notification', async () => {
    // eslint-disable-next-line @typescript-eslint/init-declarations
    let emails: EmailAddress[];
    // eslint-disable-next-line @typescript-eslint/init-declarations
    let subject: string;
    // eslint-disable-next-line @typescript-eslint/init-declarations
    let message: string;
    switch (notification.type) {
      case 'RoundStart': {
        const facultyAndStaff = await getFacultyAndStaff(db);
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
          getValidStaffEmails(db),
          getLabById(db, notification.labId),
        ]);
        emails = staffEmails;
        subject = `[DRAP] Acknowledgement from ${notification.labId.toUpperCase()} for Round #${notification.round} of Draft #${notification.draftId}`;
        message = `The ${name} has submitted their student preferences for Round #${notification.round} of Draft #${notification.draftId}.`;
        break;
      }
      case 'LotteryIntervention': {
        const [facultyAndStaff, { name }, { givenName, familyName, email }] = await Promise.all([
          getFacultyAndStaff(db),
          getLabById(db, notification.labId),
          getUserById(db, notification.userId),
        ]);
        emails = facultyAndStaff.map(({ email }) => email);
        subject = `[DRAP] Lottery Intervention for ${notification.labId.toUpperCase()} in Draft #${notification.draftId}`;
        message = `${givenName} ${familyName} <${email}> has been manually assigned to ${name} during the lottery round of Draft #${notification.draftId}.`;
        break;
      }
      case 'Concluded': {
        const facultyAndStaff = await getFacultyAndStaff(db);
        emails = facultyAndStaff.map(({ email }) => email);
        subject = `[DRAP] Draft #${notification.draftId} Concluded`;
        message = `Draft #${notification.draftId} has just concluded. See the new roster of researchers using the lab module.`;
        break;
      }
      default:
        return null;
    }

    // Upsert transactions should be short-lived to keep the row lock critical section short.
    const { client, sender } = await db.transaction(obtainRefreshedCredentials);

    const mime = createMimeMessage();
    mime.setSender({
      name: `[DRAP] ${sender.givenName} ${sender.familyName}`,
      addr: sender.email,
    });
    mime.setRecipient(emails);
    mime.setSubject(subject);
    mime.addMessage({
      contentType: 'text/plain',
      encoding: 'base64',
      data: Buffer.from(message, 'utf-8').toString('base64'),
    });

    logger.debug('sending email...');
    return await client.sendEmail(mime);
  });
}

async function obtainRefreshedCredentials(db: DrizzleTransaction) {
  logger.trace('getting designated sender credentials...');
  const sender = await getDesignatedSenderCredentialsForUpdate(db);
  if (typeof sender === 'undefined') MissingDesignatedSender.throwNew();

  // eslint-disable-next-line @typescript-eslint/init-declarations
  let client: GoogleOAuthClient;
  if (sender.isValid) {
    // TODO: Retrieve the OAuth scopes from the database.
    client = new GoogleOAuthClient(sender.accessToken, []);
  } else {
    // TODO: Persist the new OAuth scopes to the database.
    logger.debug('refreshing candidate sender credentials...');
    const refreshed = await GoogleOAuthClient.fromRefreshToken(sender.refreshToken);
    ({ client } = refreshed);
    logger.debug('updating candidate sender credentials...');
    await updateCandidateSender(
      db,
      sender.id,
      refreshed.token.expiresIn,
      client.accessToken,
      sender.refreshToken,
    );
  }

  return new ObtainedRefreshedCredentials(client, sender);
}

class ObtainedRefreshedCredentials {
  constructor(
    public readonly client: GoogleOAuthClient,
    public readonly sender: Pick<schema.User, 'email' | 'givenName' | 'familyName'>,
  ) {}
}

async function processUserNotification(
  db: DbConnection,
  emailer: Emailer,
  notification: UserNotification,
) {
  const [{ name }, { email, givenName, familyName }] = await Promise.all([
    getLabById(db, notification.labId),
    getUserById(db, notification.userId),
  ]);
  return await emailer.send(
    [email],
    `[DRAP] Assigned to ${notification.labId.toUpperCase()}`,
    `Hello, ${givenName} ${familyName}! Kindly note that you have been assigned to the ${name}.`,
  );
}

export function initializeProcessor() {
  return async function processor({ id }: Pick<Job<unknown>, 'id'>) {
    try {
      logger.info('processing notification', { 'notification.id': id });
      if (typeof id === 'undefined') {
        logger.warn('attempted to process notification with no id');
        return;
      }

      await begin(db, async db => {
        const notification = await getNotification(db, id);
        if (typeof notification === 'undefined') {
          logger.warn('attempted to process nonexistent notification');
          throw new UnknownNotificationError();
        }

        const { data, deliveredAt } = notification;
        if (deliveredAt !== null) {
          logger.warn('attempted to process delivered notification', {
            'notification.delivered_at': deliveredAt.toISOString(),
          });
          return; // ACK to remove from the queue...
        }

        logger.debug('processing notification data', {
          'notification.target': data.target,
          'notification.type': 'type' in data ? data.type : 'User',
        });
        const emailer = new Emailer(db, GOOGLE.OAUTH_CLIENT_ID, GOOGLE.OAUTH_CLIENT_SECRET);

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

        logger.info('email sent', {
          'email.message.id': result.id,
          'email.message.thread_id': result.threadId,
        });
        await markNotificationDelivered(db, id);
      });

      logger.info('notification processed');
    } catch (error) {
      if (error instanceof Error) logger.error('failed to process notification', error);
      else logger.error('failed to process notification with unknown error');
      throw error;
    }
  };
}

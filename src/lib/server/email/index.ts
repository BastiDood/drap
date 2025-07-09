import type { Database, schema } from '$lib/server/database';
import { EmailSendRequest, GmailMessageSendResult } from '$lib/server/models/email';
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } from '$env/static/private';
import { IdToken, TokenResponse } from '$lib/server/models/oauth';
import assert, { strictEqual } from 'node:assert/strict';
import { isFuture, sub } from 'date-fns';
import { parse, pick } from 'valibot';
import type { Job } from 'bullmq';
import type { Notification } from '$lib/server/models/notification';
import { createMimeMessage } from 'mimetext/node';
import { fetchJwks } from './jwks';
import { jwtVerify } from 'jose';

export type EmailAddress = schema.User['email'];

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
    const creds = await this.#db.getDesignatedSenderCredentials();
    if (typeof creds === 'undefined') return;
    if (isFuture(sub(creds.expiration, { minutes: 10 }))) return creds;

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

    const json = await res.json();
    const { id_token, access_token } = parse(TokenResponse, json);
    creds.accessToken = access_token; // overwritten credentials

    const { payload } = await jwtVerify(id_token, fetchJwks, {
      issuer: 'https://accounts.google.com',
      audience: this.#clientId,
    });

    const token = parse(pick(IdToken, ['exp']), payload);
    await this.#db.upsertCandidateSender(creds.email, token.exp, creds.accessToken);
    return creds;
  }

  /** Must be called within a transaction context for correctness. */
  async send(to: EmailAddress[], subject: string, data: string) {
    const creds = await this.#getLatestCredentials();
    if (typeof creds === 'undefined') return;

    const message = createMimeMessage();
    message.setSender({ name: `[DRAP] ${creds.givenName} ${creds.familyName}`, addr: creds.email });
    message.setRecipient(to);
    message.setSubject(subject);
    message.addMessage({ contentType: 'text/plain', data });

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: message.asEncoded() }),
    });

    // TODO: Handle rate limits.
    assert(response.ok);
    strictEqual(response.status, 200);

    const json = await response.json();
    return parse(GmailMessageSendResult, json);
  }
}

export function initializeProcessor(db: Database) {
  const emailer = new Emailer(db, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);

  async function processDraftNotification(notifRequest: Notification, txn: Database, emailer: Emailer) {
    assert(notifRequest.target === 'Draft');
    const meta = (() => {
        switch (notifRequest.type) {
          case 'RoundStart': {
            const body = notifRequest.round === null 
              ? {
                  subject: `[DRAP] Lottery Round for Draft #${notifRequest.draftId} has begun!`,
                  message: `The lottery round for Draft #${notifRequest.draftId} has begun. For lab heads, kindly coordinate with the draft administrators for the next steps.`
                }
              : {
                  subject: `[DRAP] Round #${notifRequest.round} for Draft #${notifRequest.draftId} has begun!`,
                  message: `Round #${notifRequest.round} for Draft #${notifRequest.draftId} has begun. For lab heads, kindly check the students module to see the list of students who have chosen your lab.`,
                }
            const facultyAndStaffEmails = txn.getFacultyAndStaff().then(
              (result) => result.map(({ email }) => email)
            );
            return { emails: facultyAndStaffEmails, ...body }
          }
          case 'RoundSubmit': 
            return {
              emails: txn.getValidStaffEmails(),
              subject: `[DRAP] Acknowledgement from ${notifRequest.labId.toUpperCase()} for Round #${notifRequest.round} of Draft #${notifRequest.draftId}`,
              message: `The ${notifRequest.labName} has submitted their student preferences for Round #${notifRequest.round} of Draft #${notifRequest.draftId}.`,
            };
          case 'LotteryIntervention': {
            const facultyAndStaffEmails = txn.getFacultyAndStaff().then(
              (result) => result.map(({ email }) => email)
            );

            return {
              emails: facultyAndStaffEmails,
              subject: `[DRAP] Lottery Intervention for ${notifRequest.labId.toUpperCase()} in Draft #${notifRequest.draftId}`,
              message: `${notifRequest.givenName} ${notifRequest.familyName} <${notifRequest.email}> has been manually assigned to ${notifRequest.labName} during the lottery round of Draft #${notifRequest.draftId}.`,
            };
          }
          case 'Concluded': {
            const facultyAndStaffEmails = txn.getFacultyAndStaff().then(
              (result) => result.map(({ email }) => email)
            );

            return {
                emails: facultyAndStaffEmails,
                subject: `[DRAP] Draft #${notifRequest.draftId} Concluded`,
                message: `Draft #${notifRequest.draftId} has just concluded. See the new roster of researchers using the lab module.`,
            };
          }
          default: 
            return null;
        }
      })();
      assert(meta !== null);

      const email = await emailer.send(await meta.emails, meta.subject, meta.message);

      return email;
    }

  function processUserNotification(notifRequest: Notification, emailer: Emailer) {
    assert(notifRequest.target === 'User');

    const email = emailer.send(
      [notifRequest.email],
      `[DRAP] Assigned to ${notifRequest.labId.toUpperCase()}`,
       `Hello, ${notifRequest.givenName} ${notifRequest.familyName}! Kindly note that you have been assigned to the ${notifRequest.labName}.`
    );

    return email;
  }

  return async function processor(job: Job<EmailSendRequest>) {
    const { to, subject, data } = job.data;
    return await emailer.send(to, subject, data);
  }
}
import type { Database, schema } from '$lib/server/database';
import { IdToken, TokenResponse } from '$lib/server/models/oauth';
import assert, { strictEqual } from 'node:assert/strict';
import { isFuture, sub } from 'date-fns';
import { parse, pick } from 'valibot';
import { GmailMessageSendResult } from '$lib/server/models/email';
import { createMimeMessage } from 'mimetext/node';
import { fetchJwks } from './jwks';
import { jwtVerify } from 'jose';

export type Email = schema.User['email'];

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
  async send(to: Email[], subject: string, data: string) {
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

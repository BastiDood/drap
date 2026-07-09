import assert from 'node:assert/strict';

import HttpRawRequest from 'http-raw-request';
import { Component, Multipart } from 'multipart-ts';
import type { MIMEMessage } from 'mimetext/node';
import { parse } from 'valibot';

import { GMAIL_METADATA_SCOPE, GMAIL_SEND_SCOPE } from '$lib/server/models/oauth';
import { Logger } from '$lib/server/telemetry/logger';
import { OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET } from '$lib/server/env/google';
import { Tracer } from '$lib/server/telemetry/tracer';

import { GmailMessageMetadataResult, GmailMessageSendResult, TokenResponse } from './schema';
import { parseBatchMetadataResponse, parseBatchSendResponse } from './http';

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

  async sendEmail(message: MIMEMessage, gmailThreadId?: string) {
    return await tracer.asyncSpan('google-oauth-client-send-email', async span => {
      if (!this.scopes.includes(GMAIL_SEND_SCOPE)) GmailScopeError.throwNew(this.scopes);

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
        body:
          typeof gmailThreadId === 'undefined'
            ? JSON.stringify({ raw })
            : JSON.stringify({ raw, threadId: gmailThreadId }),
      });

      logger.trace('reading response...');
      switch (response.status) {
        case 200: {
          const json = await response.json();
          const result = parse(GmailMessageSendResult, json);
          logger.info('received successful response from gmail api', {
            'email.message.id': result.id,
            'email.message.thread_id': result.threadId,
          });

          return result;
        }
        case 429:
        // TODO: Handle rate limits.
        // falls through
        default: {
          const body = await response.text();
          return GmailError.throwNew(response.status, body);
        }
      }
    });
  }

  /** Bulk version of {@linkcode sendEmail}. */
  async sendEmails(
    messages: ReadonlyMap<string, { message: MIMEMessage; gmailThreadId?: string }>,
  ) {
    return await tracer.asyncSpan('google-oauth-client-send-emails', async span => {
      if (!this.scopes.includes(GMAIL_SEND_SCOPE)) GmailScopeError.throwNew(this.scopes);
      if (messages.size > 100) BatchError.throwNew(messages.size);
      span.setAttribute('messages.count', messages.size);

      const multipart = new Multipart(
        Array.from(messages.entries(), ([contentId, { message, gmailThreadId }]) => {
          const encoder = new TextEncoder();
          const body = encoder.encode(
            HttpRawRequest.toString(
              {
                httpVersion: '1.1',
                method: 'POST',
                url: '/gmail/v1/users/me/messages/send',
              },
              { 'Content-Type': 'application/json' },
              JSON.stringify({
                ...(typeof gmailThreadId !== 'undefined' && { threadId: gmailThreadId }),
                raw: message.asEncoded(),
              }),
            ),
          );
          return new Component(
            { 'Content-ID': `<${contentId}>`, 'Content-Type': 'application/http' },
            body,
          );
        }),
      );

      const contentType = multipart.headers.get('Content-Type');
      assert(contentType !== null, 'missing content type when sending multipart request');

      const response = await fetch('https://www.googleapis.com/batch/gmail/v1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': contentType,
        },
        body: multipart.bytes(),
      });

      if (response.status !== 200)
        throw GmailError.throwNew(response.status, await response.text());

      return await parseBatchSendResponse(response);
    });
  }

  async getMessageIdHeader(messageId: string) {
    return await tracer.asyncSpan('google-oauth-client-get-message-id-header', async span => {
      if (!this.scopes.includes(GMAIL_METADATA_SCOPE)) GmailScopeError.throwNew(this.scopes);
      span.setAttribute('email.message.id', messageId);

      const url = new URL(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}`,
      );
      url.searchParams.set('format', 'metadata');
      url.searchParams.append('metadataHeaders', 'Message-ID');

      logger.trace('fetching gmail message metadata...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      switch (response.status) {
        case 200: {
          const json = await response.json();
          const result = parse(GmailMessageMetadataResult, json);
          const messageIdHeader = getMessageIdHeaderValue(result, messageId);
          logger.info('received gmail message metadata', {
            'email.message.id': result.id,
            'email.message.thread_id': result.threadId,
            'email.message_id_header.length': messageIdHeader.length,
          });
          return messageIdHeader;
        }
        case 429:
        // TODO: Handle rate limits.
        // falls through
        default: {
          const body = await response.text();
          return GmailError.throwNew(response.status, body);
        }
      }
    });
  }

  async getMessageIdHeaders(messageIds: string[]) {
    return await tracer.asyncSpan('google-oauth-client-get-message-id-headers', async span => {
      if (!this.scopes.includes(GMAIL_METADATA_SCOPE)) GmailScopeError.throwNew(this.scopes);
      if (messageIds.length > 100) BatchError.throwNew(messageIds.length);
      span.setAttribute('messages.count', messageIds.length);

      const multipart = new Multipart(
        messageIds.map(messageId => {
          const url = new URL(
            `/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}`,
            'https://gmail.googleapis.com',
          );
          url.searchParams.set('format', 'metadata');
          url.searchParams.append('metadataHeaders', 'Message-ID');

          const encoder = new TextEncoder();
          const body = encoder.encode(
            HttpRawRequest.toString(
              {
                httpVersion: '1.1',
                method: 'GET',
                url: `${url.pathname}${url.search}`,
              },
              {},
              '',
            ),
          );
          return new Component(
            { 'Content-ID': `<${messageId}>`, 'Content-Type': 'application/http' },
            body,
          );
        }),
      );

      const contentType = multipart.headers.get('Content-Type');
      assert(contentType !== null, 'missing content type when sending multipart request');

      const response = await fetch('https://www.googleapis.com/batch/gmail/v1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': contentType,
        },
        body: multipart.bytes(),
      });

      if (response.status !== 200)
        throw GmailError.throwNew(response.status, await response.text());

      const metadataResults = await parseBatchMetadataResponse(response);
      const results = new Map<string, GmailBatchMessageIdHeaderResult>();
      for (const [messageId, result] of metadataResults)
        if (result.ok)
          results.set(messageId, {
            ok: true,
            value: getMessageIdHeaderValue(result.value, messageId),
          });
        else results.set(messageId, result);

      return results;
    });
  }
}

export interface GmailBatchMessageIdHeaderSuccess {
  ok: true;
  value: string;
}

export interface GmailBatchMessageIdHeaderFailure {
  ok: false;
  status: number;
  body: string;
}

export type GmailBatchMessageIdHeaderResult =
  GmailBatchMessageIdHeaderSuccess | GmailBatchMessageIdHeaderFailure;

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
      'error.gmail.response.status': status,
      'error.gmail.response.body': body,
    });
    throw error;
  }
}

export class BatchError extends Error {
  constructor(public readonly length: number) {
    super(`too many requests in batch: ${length}`);
    this.name = 'BatchError';
  }

  static throwNew(length: number): never {
    const error = new BatchError(length);
    logger.error('too many requests in batch', error, { 'error.length': length });
    throw error;
  }
}

export class GmailScopeError extends Error {
  constructor(public readonly scopes: string[]) {
    super(`missing required gmail scope; available: ${scopes.join(', ')}`);
    this.name = 'GmailScopeError';
  }

  static throwNew(scopes: string[]): never {
    const error = new GmailScopeError(scopes);
    logger.error('missing required gmail scope', error, { 'error.scopes': scopes });
    throw error;
  }
}

export class MissingGmailMessageIdHeaderError extends Error {
  constructor(public readonly messageId: string) {
    super(`gmail message metadata is missing Message-ID header: ${messageId}`);
    this.name = 'MissingGmailMessageIdHeaderError';
  }

  static throwNew(messageId: string): never {
    const error = new MissingGmailMessageIdHeaderError(messageId);
    logger.error('gmail message metadata is missing Message-ID header', error, {
      'email.message.id': messageId,
    });
    throw error;
  }
}

function getMessageIdHeaderValue(metadata: GmailMessageMetadataResult, messageId: string) {
  const header = metadata.payload.headers.find(
    header => header.name.localeCompare('Message-ID', void 0, { sensitivity: 'base' }) === 0,
  );
  if (typeof header === 'undefined') MissingGmailMessageIdHeaderError.throwNew(messageId);
  return header.value;
}

import assert from 'node:assert/strict';

import { HTTPParser } from 'http-parser-js';
import { Multipart } from 'multipart-ts';
import { parse } from 'valibot';

import { Logger } from '$lib/server/telemetry/logger';
import { stripPrefix } from '$lib/strings';
import { Tracer } from '$lib/server/telemetry/tracer';

import { GmailMessageSendResult } from './schema';

const SERVICE_NAME = 'lib.server.google.http';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export function parseBatchSendResponse(response: Response) {
  return tracer.asyncSpan('parse-batch-send-response', async () => {
    const contentType = response.headers.get('Content-Type');
    assert(contentType !== null, 'missing content type when reading multipart response');

    const body = new Uint8Array(await response.arrayBuffer());
    const multipart = await Multipart.blob(new Blob([body], { type: contentType }));

    const results = new Map<string, GmailBatchSendResult>();
    for (const part of multipart.parts) {
      const [contentId, result] = parseBatchSendPart(part);
      const existing = results.get(contentId);
      if (typeof existing === 'undefined') results.set(contentId, result);
      else DuplicateBatchContentIdError.throwNew(contentId);
    }

    return results;
  });
}

export class DuplicateBatchContentIdError extends Error {
  constructor(public readonly contentId: string) {
    super(`duplicate gmail batch response content id: ${contentId}`);
    this.name = 'DuplicateBatchContentIdError';
  }

  static throwNew(contentId: string): never {
    const error = new DuplicateBatchContentIdError(contentId);
    logger.error('duplicate gmail batch response content id', error, {
      'error.content_id': contentId,
    });
    throw error;
  }
}

function parseBatchSendPart(part: Multipart['parts'][number]): [string, GmailBatchSendResult] {
  return tracer.span('parse-batch-send-part', span => {
    span.setAttribute('http.part.size', part.body.byteLength);
    const contentType = part.headers.get('Content-Type');
    assert(contentType !== null, 'gmail batch part is missing its content type');
    if (!contentType.toLowerCase().startsWith('application/http'))
      NonHttpBatchPartError.throwNew(contentType);

    const partContentId = part.headers.get('Content-ID');
    assert(partContentId !== null, 'gmail batch part is missing its content id');

    const contentId = normalizeBatchContentId(partContentId);
    const { status, body } = parseApplicationHttpResponse(Buffer.from(part.body));

    if (status >= 200 && status < 300) {
      logger.debug('successfully parsed gmail batch part', { 'http.part.content_id': contentId });
      const value = parse(GmailMessageSendResult, JSON.parse(body));
      return [contentId, { ok: true, value }];
    }

    logger.warn('failed to parse gmail batch part', { 'http.part.status': status });
    return [contentId, { ok: false, status, body }];
  });
}

export interface GmailBatchSendSuccess {
  ok: true;
  value: GmailMessageSendResult;
}

export interface GmailBatchSendFailure {
  ok: false;
  status: number;
  body: string;
}

export type GmailBatchSendResult = GmailBatchSendSuccess | GmailBatchSendFailure;

export class NonHttpBatchPartError extends Error {
  constructor(public readonly contentType: string) {
    super(`unexpected gmail batch part content type: ${contentType}`);
    this.name = 'NonHttpBatchPartError';
  }

  static throwNew(contentType: string): never {
    const error = new NonHttpBatchPartError(contentType);
    logger.error('unexpected gmail batch part content type', error, {
      'error.content_type': contentType,
    });
    throw error;
  }
}

function parseApplicationHttpResponse(data: Buffer) {
  return tracer.span('parse-application-http-response', span => {
    span.setAttribute('http.response.data.size', data.length);
    const parser = new HTTPParser(HTTPParser.RESPONSE);

    // eslint-disable-next-line @typescript-eslint/init-declarations
    let status: number | undefined;
    const bodyChunks: Buffer[] = [];

    parser.onHeadersComplete = ({ statusCode }) =>
      tracer.span('parse-application-http-response-headers-complete', span => {
        span.setAttribute('http.response.status', statusCode);
        status = statusCode;
      });
    parser.onBody = (chunk, offset, length) =>
      tracer.span('parse-application-http-response-body', span => {
        span.setAttributes({
          'http.response.body.chunk.offset': offset,
          'http.response.body.chunk.length': length,
        });
        bodyChunks.push(chunk.subarray(offset, offset + length));
      });

    const executeResult = parser.execute(data);
    if (executeResult instanceof Error) throw executeResult;
    logger.trace('parsed http', { 'http.response.size': executeResult });

    const finishResult = parser.finish();
    if (finishResult instanceof Error) throw finishResult;

    assert(typeof status !== 'undefined', 'missing status code when parsing gmail batch part');
    return { status, body: Buffer.concat(bodyChunks).toString('utf-8') };
  });
}

function normalizeBatchContentId(contentId: string) {
  return tracer.span('normalize-batch-content-id', span => {
    span.setAttribute('content_id', contentId);

    let normalized = contentId.trim();
    if (normalized.startsWith('<') && normalized.endsWith('>')) {
      normalized = normalized.slice(1, -1);
      logger.trace('trimmed angle brackets', { content_id: normalized });
    }

    const strippedResponse = stripPrefix(normalized, 'response-');
    if (typeof strippedResponse !== 'undefined') {
      normalized = strippedResponse;
      logger.trace('stripped response prefix', { content_id: normalized });
    }

    return normalized;
  });
}

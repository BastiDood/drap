import assert, { strictEqual } from 'node:assert/strict';
import { MIMEType } from 'node:util';

import * as v from 'valibot';
import { chunked } from 'itertools';
import { Component, Multipart } from 'multipart-ts';
import { HTTPParser } from 'http-parser-js';

import { Logger } from '$lib/server/telemetry/logger';
import { stripPrefix } from '$lib/strings';
import { Tracer } from '$lib/server/telemetry/tracer';

import { type GmailFailure, parseGmailFailure } from './failure';
import { GmailMessageMetadataResult, GmailMessageSendResult } from './schema';

const SERVICE_NAME = 'lib.server.google.http';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function parseBatchSendResponse(response: Response) {
  return await parseBatchResponse(GmailMessageSendResult, response);
}

export async function parseBatchMetadataResponse(response: Response) {
  return await parseBatchResponse(GmailMessageMetadataResult, response);
}

function parseBatchResponse<const TSchema extends v.GenericSchema>(
  schema: TSchema,
  response: Response,
) {
  return tracer.asyncSpan('parse-batch-response', async span => {
    const contentType = response.headers.get('Content-Type');
    if (contentType === null) MissingBatchContentTypeError.throwNew();
    span.setAttribute('response.content_type', contentType);

    let mimeType: MIMEType;
    try {
      mimeType = new MIMEType(contentType);
    } catch (cause) {
      InvalidBatchContentTypeError.throwNew(contentType, cause);
    }

    if (mimeType.essence !== 'multipart/mixed' || !mimeType.params.has('boundary'))
      InvalidBatchContentTypeError.throwNew(contentType);

    const body = await response.arrayBuffer();
    const multipart = Multipart.part(new Component({ 'Content-Type': contentType }, body));

    const results = new Map<string, GmailBatchResult<v.InferOutput<TSchema>>>();
    for (const part of multipart.parts) {
      const [contentId, result] = parseBatchPart(part, schema);
      const existing = results.get(contentId);
      if (typeof existing === 'undefined') results.set(contentId, result);
      else DuplicateBatchContentIdError.throwNew(contentId);
    }

    return results;
  });
}

function parseBatchPart<const TSchema extends v.GenericSchema>(
  part: Multipart['parts'][number],
  schema: TSchema,
): [string, GmailBatchResult<v.InferOutput<TSchema>>] {
  return tracer.span('parse-batch-part', span => {
    span.setAttribute('multipart.size', part.body.byteLength);
    const contentType = part.headers.get('Content-Type');
    if (contentType === null) MissingBatchPartContentTypeError.throwNew();
    span.setAttribute('multipart.content_type', contentType);

    let mimeType: MIMEType;
    try {
      mimeType = new MIMEType(contentType);
    } catch (cause) {
      NonHttpBatchPartError.throwNew(contentType, cause);
    }

    if (mimeType.essence !== 'application/http') NonHttpBatchPartError.throwNew(contentType);

    const partContentId = part.headers.get('Content-ID');
    if (partContentId === null) MissingBatchPartContentIdError.throwNew();
    span.setAttribute('multipart.content_id', partContentId);

    const contentId = normalizeBatchContentId(partContentId);
    const { status, headers, body } = parseApplicationHttpResponse(Buffer.from(part.body));

    if (status >= 200 && status < 300) {
      logger.debug('successfully parsed gmail batch part', { 'http.part.content_id': contentId });
      const value = v.parse(schema, JSON.parse(body));
      return [contentId, { ok: true, value }];
    }

    logger.warn('failed to parse gmail batch part', { 'http.part.status': status });
    return [contentId, { ok: false, failure: parseGmailFailure(status, headers, body) }];
  });
}

function parseApplicationHttpResponse(data: Buffer) {
  return tracer.span('parse-application-http-response', span => {
    span.setAttribute('http.response.data.size', data.length);
    const parser = new HTTPParser(HTTPParser.RESPONSE);

    let status: number | undefined;
    let headers = new Headers();
    const bodyChunks: Buffer[] = [];

    parser.onHeadersComplete = ({ statusCode, headers: rawHeaders }) =>
      tracer.span('parse-application-http-response-headers-complete', span => {
        span.setAttribute('http.response.status', statusCode);
        status = statusCode;
        headers = headersFromRawPairs(rawHeaders);
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
    if (typeof finishResult !== 'undefined') {
      logger.fatal('failed to parse http response', finishResult);
      throw finishResult;
    }

    if (typeof status === 'undefined') MissingBatchPartStatusError.throwNew();

    return {
      status,
      headers,
      body: Buffer.concat(bodyChunks).toString('utf-8'),
    };
  });
}

function headersFromRawPairs(pairs: string[]) {
  const headers = new Headers();
  for (const [name, value, ...rest] of chunked(pairs, 2)) {
    strictEqual(rest.length, 0, 'expected http header name/value pair');
    assert(typeof value !== 'undefined', 'expected http header value');
    assert(typeof name !== 'undefined', 'expected http header name');
    headers.append(name, value);
  }
  return headers;
}

function normalizeBatchContentId(contentId: string) {
  return tracer.span('normalize-batch-content-id', span => {
    span.setAttribute('input.content_id', contentId);

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

    if (normalized.startsWith('<') && normalized.endsWith('>')) {
      normalized = normalized.slice(1, -1);
      logger.trace('trimmed angle brackets', { content_id: normalized });
    }

    span.setAttribute('output.content_id', normalized);
    return normalized;
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

export class MissingBatchContentTypeError extends Error {
  constructor() {
    super('missing content type when reading multipart response');
    this.name = 'MissingBatchContentTypeError';
  }

  static throwNew(): never {
    const error = new MissingBatchContentTypeError();
    logger.error('missing content type when reading multipart response', error);
    throw error;
  }
}

export class InvalidBatchContentTypeError extends Error {
  constructor(
    public readonly contentType: string,
    cause?: unknown,
  ) {
    super(`unexpected content type when reading multipart response: ${contentType}`);
    this.name = 'InvalidBatchContentTypeError';
    this.cause = cause;
  }

  static throwNew(contentType: string, cause?: unknown): never {
    const error = new InvalidBatchContentTypeError(contentType, cause);
    logger.error('unexpected content type when reading multipart response', error, {
      'error.content_type': contentType,
    });
    throw error;
  }
}

export interface GmailBatchSuccess<TValue> {
  ok: true;
  value: TValue;
}

export interface GmailBatchFailure {
  ok: false;
  failure: GmailFailure;
}

export type GmailBatchResult<TValue> = GmailBatchSuccess<TValue> | GmailBatchFailure;
export type GmailBatchSendResult = GmailBatchResult<GmailMessageSendResult>;
export type GmailBatchMetadataResult = GmailBatchResult<GmailMessageMetadataResult>;

export class NonHttpBatchPartError extends Error {
  constructor(
    public readonly contentType: string,
    cause?: unknown,
  ) {
    super(`unexpected gmail batch part content type: ${contentType}`);
    this.name = 'NonHttpBatchPartError';
    this.cause = cause;
  }

  static throwNew(contentType: string, cause?: unknown): never {
    const error = new NonHttpBatchPartError(contentType, cause);
    logger.error('unexpected gmail batch part content type', error, {
      'error.content_type': contentType,
    });
    throw error;
  }
}

export class MissingBatchPartContentTypeError extends Error {
  constructor() {
    super('gmail batch part is missing its content type');
    this.name = 'MissingBatchPartContentTypeError';
  }

  static throwNew(): never {
    const error = new MissingBatchPartContentTypeError();
    logger.error('gmail batch part is missing its content type', error);
    throw error;
  }
}

export class MissingBatchPartContentIdError extends Error {
  constructor() {
    super('gmail batch part is missing its content id');
    this.name = 'MissingBatchPartContentIdError';
  }

  static throwNew(): never {
    const error = new MissingBatchPartContentIdError();
    logger.error('gmail batch part is missing its content id', error);
    throw error;
  }
}

export class MissingBatchPartStatusError extends Error {
  constructor() {
    super('missing status code when parsing gmail batch part');
    this.name = 'MissingBatchPartStatusError';
  }

  static throwNew(): never {
    const error = new MissingBatchPartStatusError();
    logger.error('missing status code when parsing gmail batch part', error);
    throw error;
  }
}

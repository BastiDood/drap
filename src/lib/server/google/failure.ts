import * as v from 'valibot';
import type { Attributes, Span } from '@opentelemetry/api';

import { Logger } from '$lib/server/telemetry/logger';

const logger = Logger.byName('lib.server.google.failure');

const GmailErrorDetail = v.object({
  domain: v.string(),
  reason: v.string(),
  message: v.string(),
  location: v.optional(v.string()),
  locationType: v.optional(v.string()),
});

const GoogleErrorResponse = v.object({
  error: v.object({
    code: v.pipe(v.number(), v.safeInteger()),
    message: v.string(),
    errors: v.array(GmailErrorDetail),
  }),
});
type GoogleErrorResponse = v.InferOutput<typeof GoogleErrorResponse>;

export const GmailFailure = v.object({
  status: v.pipe(v.number(), v.safeInteger()),
  code: v.optional(v.pipe(v.number(), v.safeInteger())),
  message: v.optional(v.string()),
  details: v.array(GmailErrorDetail),
  retryDelayMs: v.nullable(v.pipe(v.number(), v.safeInteger(), v.minValue(0))),
});
export type GmailFailure = v.InferOutput<typeof GmailFailure>;

export function logGmailFailure(span: Span, failure: GmailFailure) {
  const failureAttributes: Attributes = { 'error.gmail.response.status': failure.status };
  if (typeof failure.code !== 'undefined')
    failureAttributes['error.gmail.response.code'] = failure.code;
  if (typeof failure.message !== 'undefined')
    failureAttributes['error.gmail.response.message'] = failure.message;
  failureAttributes['error.gmail.response.details.count'] = failure.details.length;
  if (failure.retryDelayMs !== null)
    failureAttributes['error.gmail.response.retry_delay_ms'] = failure.retryDelayMs;
  span.setAttributes(failureAttributes);
  for (const error of failure.details) {
    const errorAttributes: Attributes = {
      'error.gmail.response.detail.domain': error.domain,
      'error.gmail.response.detail.reason': error.reason,
      'error.gmail.response.detail.message': error.message,
    };
    if (typeof error.location !== 'undefined')
      errorAttributes['error.gmail.response.detail.location'] = error.location;
    if (typeof error.locationType !== 'undefined')
      errorAttributes['error.gmail.response.detail.location_type'] = error.locationType;
    logger.error('gmail api error detail', void 0, errorAttributes);
  }
}

const DIGITS_REGEX = /^\d+$/u;
export function parseGmailFailure(status: number, headers: Headers, body: string) {
  const retryAfter = headers.get('Retry-After');
  let retryDelayMs: number | null = null;
  if (retryAfter !== null)
    if (DIGITS_REGEX.test(retryAfter)) {
      const seconds = Number.parseInt(retryAfter, 10);
      if (seconds <= Math.floor(Number.MAX_SAFE_INTEGER / 1_000)) retryDelayMs = seconds * 1_000;
    } else {
      const date = Date.parse(retryAfter);
      if (!Number.isNaN(date)) retryDelayMs = Math.max(0, date - Date.now());
    }

  let response: unknown;
  try {
    response = JSON.parse(body);
  } catch (error) {
    logger.error(
      'unable to parse gmail error response',
      error instanceof Error ? error : new Error('gmail error response was not an Error'),
      {
        'http.response.status': status,
        'http.response.body.length': body.length,
      },
    );
  }

  if (typeof response === 'undefined') {
    logger.warn('gmail error response was missing');
    return { status, details: [], retryDelayMs };
  }

  try {
    const {
      error: { code, message, errors },
    } = v.parse(GoogleErrorResponse, response);
    return { status, code, message, details: errors, retryDelayMs };
  } catch (error) {
    logger.error(
      'gmail error response did not match the documented schema',
      error instanceof Error ? error : new Error('gmail error response was not an Error'),
      {
        'http.response.status': status,
        'http.response.body.length': body.length,
      },
    );
    return { status, details: [], retryDelayMs };
  }
}

export function isRetryableGmailFailure(failure: GmailFailure) {
  switch (failure.status) {
    case 403:
      return (
        failure.details.length > 0 &&
        failure.details.every(detail => {
          switch (detail.reason) {
            case 'rateLimitExceeded':
            case 'userRateLimitExceeded':
              return true;
            default:
              return false;
          }
        })
      );
    case 429:
    case 500:
    case 502:
    case 503:
    case 504:
      return true;
    default:
      return false;
  }
}

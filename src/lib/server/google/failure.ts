import * as v from 'valibot';
import type { AnyValueMap } from '@opentelemetry/api-logs';

import { Logger } from '$lib/server/telemetry/logger';

const logger = Logger.byName('lib.server.google.failure');

const GmailErrorDetail = v.object({
  domain: v.string(),
  reason: v.string(),
});

const GoogleErrorResponse = v.object({
  error: v.object({
    errors: v.array(GmailErrorDetail),
  }),
});
type GoogleErrorResponse = v.InferOutput<typeof GoogleErrorResponse>;

export const GmailFailure = v.object({
  status: v.pipe(v.number(), v.safeInteger()),
  details: v.array(GmailErrorDetail),
  retryDelayMs: v.nullable(v.pipe(v.number(), v.safeInteger(), v.minValue(0))),
});
export type GmailFailure = v.InferOutput<typeof GmailFailure>;

export function deriveOtelAttributesFromGmailFailure(failure: GmailFailure) {
  const attributes: AnyValueMap = { 'error.gmail.response.status': failure.status };
  if (failure.details.length > 0) {
    attributes['error.gmail.response.domains'] = failure.details
      .map(detail => detail.domain)
      .join(',');
    attributes['error.gmail.response.reasons'] = failure.details
      .map(detail => detail.reason)
      .join(',');
  }
  if (failure.retryDelayMs !== null)
    attributes['error.gmail.response.retry_delay_ms'] = failure.retryDelayMs;
  return attributes;
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

  let response: object;
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
    return { status, details: [], retryDelayMs };
  }

  let parsed: GoogleErrorResponse;
  try {
    parsed = v.parse(GoogleErrorResponse, response);
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

  return { status, details: parsed.error.errors, retryDelayMs };
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

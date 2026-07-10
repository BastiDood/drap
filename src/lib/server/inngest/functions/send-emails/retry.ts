import { type GmailFailure, isRetryableGmailFailure } from '$lib/server/google/failure';

export const enum GmailDeliveryAttempt {
  InitialBatch = 0,
  FirstBatchRetry = 1,
  SecondBatchRetry = 2,
  SingleFallback = 3,
}

export const enum GmailRetryKind {
  Batch = 'batch',
  Fallback = 'fallback',
  Terminal = 'terminal',
  Exhausted = 'exhausted',
}

interface GmailRetryPlanBatch {
  kind: GmailRetryKind.Batch;
  attempt: GmailDeliveryAttempt.FirstBatchRetry | GmailDeliveryAttempt.SecondBatchRetry;
}

interface GmailRetryPlanFallback {
  kind: GmailRetryKind.Fallback;
  attempt: GmailDeliveryAttempt.SingleFallback;
}

interface GmailRetryPlanTerminal {
  kind: GmailRetryKind.Terminal;
}

interface GmailRetryPlanExhausted {
  kind: GmailRetryKind.Exhausted;
}

type GmailRetryPlan =
  GmailRetryPlanBatch | GmailRetryPlanFallback | GmailRetryPlanTerminal | GmailRetryPlanExhausted;

export function planGmailRetry(attempt: number, failure: GmailFailure): GmailRetryPlan {
  if (!isRetryableGmailFailure(failure)) return { kind: GmailRetryKind.Terminal };
  switch (attempt) {
    case GmailDeliveryAttempt.InitialBatch:
      return { kind: GmailRetryKind.Batch, attempt: GmailDeliveryAttempt.FirstBatchRetry };
    case GmailDeliveryAttempt.FirstBatchRetry:
      return { kind: GmailRetryKind.Batch, attempt: GmailDeliveryAttempt.SecondBatchRetry };
    case GmailDeliveryAttempt.SecondBatchRetry:
      return { kind: GmailRetryKind.Fallback, attempt: GmailDeliveryAttempt.SingleFallback };
    default:
      return { kind: GmailRetryKind.Exhausted };
  }
}

export function getGmailRetryTimestamp(attempt: number, failure: GmailFailure) {
  let minimumDelayMs: number;
  switch (attempt) {
    case GmailDeliveryAttempt.FirstBatchRetry:
      minimumDelayMs = 30_000;
      break;
    case GmailDeliveryAttempt.SecondBatchRetry:
      minimumDelayMs = 60_000;
      break;
    case GmailDeliveryAttempt.SingleFallback:
      minimumDelayMs = 120_000;
      break;
    default:
      throw new RangeError(`invalid Gmail retry attempt: ${attempt}`);
  }
  const now = Date.now();
  const delayMs = Math.max(minimumDelayMs, failure.retryDelayMs ?? 0);
  return now + Math.min(delayMs, Number.MAX_SAFE_INTEGER - now);
}

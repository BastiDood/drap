import { cleanupSessions } from '$lib/server/inngest/functions/cleanup-sessions';
import {
  sendBatchedEmails,
  sendBatchEmailFallback,
  sendSeedEmailFallback,
  sendSeedEmails,
} from '$lib/server/inngest/functions/send-emails';

export const functions = [
  sendSeedEmails,
  sendBatchedEmails,
  sendSeedEmailFallback,
  sendBatchEmailFallback,
  cleanupSessions,
];

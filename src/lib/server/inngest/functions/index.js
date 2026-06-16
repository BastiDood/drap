import { cleanupSessions } from '$lib/server/inngest/functions/cleanup-sessions';
import {
  routeEmails,
  sendBatchedEmails,
  sendBatchEmailFallback,
  sendSeedEmailFallback,
  sendSeedEmails,
} from '$lib/server/inngest/functions/send-emails';

export const functions = [
  routeEmails,
  sendSeedEmails,
  sendBatchedEmails,
  sendSeedEmailFallback,
  sendBatchEmailFallback,
  cleanupSessions,
];

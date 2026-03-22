import { cleanupSessions } from '$lib/server/inngest/functions/cleanup-sessions';
import { sendBatchedEmails, sendEmailFallback } from '$lib/server/inngest/functions/send-email';

export const functions = [sendBatchedEmails, sendEmailFallback, cleanupSessions];

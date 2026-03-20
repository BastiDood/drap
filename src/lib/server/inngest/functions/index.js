import { cleanupSessions } from '$lib/server/inngest/functions/cleanup-sessions';
import { retryEmail, sendEmails } from '$lib/server/inngest/functions/send-email';

export const functions = [sendEmails, retryEmail, cleanupSessions];

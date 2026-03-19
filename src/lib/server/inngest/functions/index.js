import { cleanupSessions } from '$lib/server/inngest/functions/cleanup-sessions';
import { sendEmail } from '$lib/server/inngest/functions/send-email';

export const functions = [sendEmail, cleanupSessions];

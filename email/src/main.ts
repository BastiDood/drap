import { Database } from 'drap-database';
import { Emailer } from './email';
import assert from 'node:assert/strict';
import pino from 'pino';
import postgres from 'postgres';

const { POSTGRES_URL, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } = process.env;
assert(typeof POSTGRES_URL !== 'undefined', 'empty database url');
assert(typeof GOOGLE_OAUTH_CLIENT_ID !== 'undefined', 'empty google oauth client id');
assert(typeof GOOGLE_OAUTH_CLIENT_SECRET !== 'undefined', 'empty google oauth client secret');

const logger = pino();
const sql = postgres(POSTGRES_URL, { ssl: 'prefer', types: { bigint: postgres.BigInt } });
const db = new Database(sql, logger);
const emailer = new Emailer(db, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);

const controller = new AbortController();
process.on('SIGINT', () => controller.abort());

async function listenForDraftNotifications(emailer: Emailer, signal: AbortSignal) {
    for await (const payload of emailer.db.listen('notify:draft', signal)) {
        const email = await emailer.db.begin(async db => {
            const notif = await db.getOneDraftNotification();
            if (notif === null) return null;

            const meta = (() => {
                switch (notif.ty) {
                    case 'DraftRoundStarted':
                        return {
                            emails: db.getValidFacultyAndStaffEmails(),
                            subject: `[DRAP] Round #${notif.round} for Draft #${notif.draft_id} has begun!`,
                            message: `Round #${notif.round} for Draft #${notif.draft_id} has begun. For lab heads, kindly check the students module to see the list of students who have chosen your lab.`,
                        };
                    case 'DraftRoundSubmitted':
                        return {
                            emails: db.getValidStaffEmails(),
                            subject: `[DRAP] Acknowledgement from ${notif.lab_id.toUpperCase()} for Round #${notif.round} of Draft #${notif.draft_id}`,
                            message: `${notif.given_name} ${notif.family_name} has submitted their student preferences on behalf of the ${notif.lab_name} for Round #${notif.round} of Draft #${notif.draft_id}.`,
                        };
                    case 'LotteryIntervention':
                        return {
                            emails: db.getValidFacultyAndStaffEmails(),
                            subject: `[DRAP] Lottery Intervention for ${notif.lab_id.toUpperCase()} in Draft #${notif.draft_id}`,
                            message: ``,
                        };
                    default:
                        return null;
                }
            })();

            assert(meta !== null, 'notify:draft => unexpected notification type');
            const email = await emailer.send(await meta.emails, meta.subject, meta.message);
            assert(await db.dropDraftNotification(notif.notif_id), 'cannot drop non-existent notification');
            return email;
        });

        const logger = emailer.db.logger.child({ payload });
        if (email === null) logger.warn({ email });
        else logger.info({ email });
    }
}

async function listenForUserNotifications(emailer: Emailer, signal: AbortSignal) {
    for await (const payload of emailer.db.listen('notify:user', signal)) {
        const email = await emailer.db.begin(async db => {
            const notif = await db.getOneUserNotification();
            if (notif === null) return null;
            const email = await emailer.send(
                [notif.email],
                `[DRAP] Assigned to ${notif.lab_id.toUpperCase()}`,
                `Hello, ${notif.given_name} ${notif.given_name}! Kindly note that you have been assigned to the ${notif.lab_name}.`,
            );
            assert(await db.dropUserNotification(notif.notif_id), 'cannot drop non-existent notification');
            return email;
        });
        const logger = emailer.db.logger.child({ payload });
        if (email === null) logger.warn({ email });
        else logger.info({ email });
    }
}

// Main event loop of the email worker
await Promise.all([
    listenForDraftNotifications(emailer, controller.signal),
    listenForUserNotifications(emailer, controller.signal),
]);
db.logger.warn('email workers shut down');
await db.end();
db.logger.warn('database connection shut down');

import { Database } from 'drap-database';
import { Emailer } from './email';
import assert from 'node:assert/strict';
import pino from 'pino';
import postgres from 'postgres';

const { DATABASE_URL, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } = process.env;
assert(typeof DATABASE_URL !== 'undefined', 'empty database url');
assert(typeof GOOGLE_OAUTH_CLIENT_ID !== 'undefined', 'empty google oauth client id');
assert(typeof GOOGLE_OAUTH_CLIENT_SECRET !== 'undefined', 'empty google oauth client secret');

const logger = pino();
const sql = postgres(DATABASE_URL, { types: { bigint: postgres.BigInt } });
const db = new Database(sql, logger);
const emailer = new Emailer(db, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET);

const controller = new AbortController();
process.on('SIGINT', () => controller.abort());

async function listenForDraftNotifications(emailer: Emailer, signal: AbortSignal) {
    for await (const payload of emailer.db.listen('notify:draft', signal))
        while (true) {
            const email = await emailer.db.begin(async db => {
                const notif = await db.getOneDraftNotification();
                if (notif === null) return null;

                const meta = (() => {
                    switch (notif.ty) {
                        case 'DraftRoundStarted': {
                            const body =
                                notif.round === null
                                    ? {
                                          subject: `[DRAP] Lottery Round for Draft #${notif.draft_id} has begun!`,
                                          message: `The lottery round for Draft #${notif.draft_id} has begun. For lab heads, kindly coordinate with the draft administrators for the next steps.`,
                                      }
                                    : {
                                          subject: `[DRAP] Round #${notif.round} for Draft #${notif.draft_id} has begun!`,
                                          message: `Round #${notif.round} for Draft #${notif.draft_id} has begun. For lab heads, kindly check the students module to see the list of students who have chosen your lab.`,
                                      };
                            return { emails: db.getValidFacultyAndStaffEmails(), ...body };
                        }
                        case 'DraftRoundSubmitted':
                            return {
                                emails: db.getValidStaffEmails(),
                                subject: `[DRAP] Acknowledgement from ${notif.lab_id.toUpperCase()} for Round #${notif.round} of Draft #${notif.draft_id}`,
                                message: `The ${notif.lab_name} has submitted their student preferences for Round #${notif.round} of Draft #${notif.draft_id}.`,
                            };
                        case 'LotteryIntervention':
                            return {
                                emails: db.getValidFacultyAndStaffEmails(),
                                subject: `[DRAP] Lottery Intervention for ${notif.lab_id.toUpperCase()} in Draft #${notif.draft_id}`,
                                message: `${notif.given_name} ${notif.family_name} <${notif.email}> has been manually assigned to ${notif.lab_name} during the lottery round of Draft #${notif.draft_id}.`,
                            };
                        case 'DraftConcluded':
                            return {
                                emails: db.getValidFacultyAndStaffEmails(),
                                subject: `[DRAP] Draft #${notif.draft_id} Concluded`,
                                message: `Draft #${notif.draft_id} has just concluded. See the new roster of researchers using the lab module.`,
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

            if (email === null) break;
            emailer.db.logger.info({ payload, email });
        }
}

async function listenForUserNotifications(emailer: Emailer, signal: AbortSignal) {
    for await (const payload of emailer.db.listen('notify:user', signal))
        while (true) {
            const email = await emailer.db.begin(async db => {
                const notif = await db.getOneUserNotification();
                if (notif === null) return null;

                const email = await emailer.send(
                    [notif.email],
                    `[DRAP] Assigned to ${notif.lab_id.toUpperCase()}`,
                    `Hello, ${notif.given_name} ${notif.family_name}! Kindly note that you have been assigned to the ${notif.lab_name}.`,
                );

                assert(await db.dropUserNotification(notif.notif_id), 'cannot drop non-existent notification');
                return email;
            });

            if (email === null) break;
            emailer.db.logger.info({ payload, email });
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

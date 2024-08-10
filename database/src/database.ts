import { type InferOutput, array, bigint, boolean, nullable, object, parse, pick } from 'valibot';
import { type Loggable, timed } from './decorators';
import { fail, strictEqual } from 'node:assert/strict';
import type { Logger } from 'pino';
import postgres from 'postgres';

import {
    DraftNotification,
    DraftNotificationWithDetails,
    type DraftRoundStarted,
    type DraftRoundSubmitted,
    type LotteryIntervention,
    UserNotification,
    UserNotificationWithDetails,
} from 'drap-model/notification';
import { FacultyChoice, FacultyChoiceEmail } from 'drap-model/faculty-choice';
import { Pending, Session } from 'drap-model/session';
import { CandidateSender } from 'drap-model/email';
import { Draft } from 'drap-model/draft';
import { Lab } from 'drap-model/lab';
import { StudentRank } from 'drap-model/student-rank';
import { User } from 'drap-model/user';

const AvailableLabs = array(pick(Lab, ['lab_id', 'lab_name']));
const BooleanResult = object({ result: boolean() });
const ChoiceRecords = array(
    object({
        ...pick(FacultyChoice, ['created_at', 'lab_id', 'round', 'draft_id']).entries,
        faculty_email: nullable(User.entries.email),
        student_email: nullable(User.entries.email),
    }),
);
const CountResult = object({ count: bigint() });
const CreatedLab = pick(Lab, ['lab_id']);
const CreatedDraft = pick(Draft, ['draft_id', 'active_period_start']);
const CreatedUserNotification = pick(UserNotification, ['notif_id']);
const CreatedUserNotifications = array(CreatedUserNotification);
const DeletedPendingSession = pick(Pending, ['nonce', 'expiration', 'has_extended_scope']);
const DeletedValidSession = pick(Session, ['email', 'expiration']);
const DesignatedSenderCredentials = object({
    ...CandidateSender.entries,
    ...pick(User, ['given_name', 'family_name']).entries,
});
const Drafts = array(Draft);
const DraftEvents = array(
    object({
        ...pick(FacultyChoice, ['created_at', 'round', 'lab_id']).entries,
        is_system: boolean(),
    }),
);
const DraftMaxRounds = pick(Draft, ['max_rounds']);
const IncrementedDraftRound = pick(Draft, ['curr_round', 'max_rounds']);
const LabName = pick(Lab, ['lab_name']);
const LabQuota = pick(Lab, ['quota']);
const LatestDraft = pick(Draft, ['draft_id', 'curr_round', 'max_rounds', 'active_period_start']);
const QueriedCandidateSenders = array(
    object({
        ...pick(User, ['email', 'given_name', 'family_name', 'avatar']).entries,
        is_active: boolean(),
    }),
);
const QueriedDraft = pick(Draft, ['curr_round', 'max_rounds', 'active_period_start', 'active_period_end']);
const QueriedFaculty = array(
    object({
        ...pick(User, ['email', 'given_name', 'family_name', 'avatar', 'user_id']).entries,
        lab_name: nullable(Lab.entries.lab_name),
    }),
);
const QueriedLab = pick(Lab, ['lab_name', 'quota']);
const QueriedLabMembers = array(pick(User, ['email', 'given_name', 'family_name', 'avatar', 'student_number']));
const QueriedStudentRank = object({
    ...pick(StudentRank, ['created_at']).entries,
    labs: array(Lab.entries.lab_name),
});
const RegisteredLabs = array(Lab);
const TaggedStudentsWithLabs = array(
    object({
        ...pick(User, ['email', 'given_name', 'family_name', 'avatar', 'student_number']).entries,
        ...pick(StudentRank, ['labs']).entries,
        lab_id: nullable(FacultyChoiceEmail.entries.lab_id),
    }),
);
const UpsertedOpenIdUser = pick(User, ['is_admin', 'lab_id']);
const UserEmails = array(pick(User, ['email']));

export type AvailableLabs = InferOutput<typeof AvailableLabs>;
export type ChoiceRecords = InferOutput<typeof ChoiceRecords>;
export type QueriedCandidateSenders = InferOutput<typeof QueriedCandidateSenders>;
export type QueriedFaculty = InferOutput<typeof QueriedFaculty>;
export type RegisteredLabs = InferOutput<typeof RegisteredLabs>;
export type QueriedLabMembers = InferOutput<typeof QueriedLabMembers>;
export type TaggedStudentsWithLabs = InferOutput<typeof TaggedStudentsWithLabs>;

export type Sql = postgres.Sql<{ bigint: bigint }>;

export class Database implements Loggable {
    #sql: Sql;
    #logger: Logger;

    constructor(sql: Sql, logger: Logger) {
        this.#sql = sql;
        this.#logger = logger;
    }

    get logger() {
        return this.#logger;
    }

    /** Begins a transaction. */
    begin<T>(fn: (db: Database) => Promise<T>) {
        return this.#sql.begin('ISOLATION LEVEL SERIALIZABLE', sql => fn(new Database(sql, this.#logger)));
    }

    /** Closes the database connection. */
    async end() {
        await this.#sql.end();
    }

    @timed async generatePendingSession(hasExtendedScope: boolean) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.pendings (has_extended_scope) VALUES (${hasExtendedScope}) RETURNING session_id, expiration, nonce, has_extended_scope`;
        strictEqual(rest.length, 0);
        return parse(Pending, first);
    }

    @timed async deletePendingSession(sid: Pending['session_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`DELETE FROM drap.pendings WHERE session_id = ${sid} RETURNING expiration, nonce, has_extended_scope`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(DeletedPendingSession, first);
    }

    @timed async insertValidSession(
        sid: Pending['session_id'],
        email: Session['email'],
        expiration: Session['expiration'],
    ) {
        const sql = this.#sql;
        const { count } =
            await sql`INSERT INTO drap.sessions (session_id, email, expiration) VALUES (${sid}, ${email}, ${expiration})`;
        return count;
    }

    @timed async getUserFromValidSession(sid: Session['session_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT u.* FROM drap.sessions JOIN drap.users u USING (email) WHERE session_id = ${sid}`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(User, first);
    }

    @timed async deleteValidSession(sid: Session['session_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`DELETE FROM drap.sessions WHERE session_id = ${sid} RETURNING email, expiration`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(DeletedValidSession, first);
    }

    @timed async initUser(email: User['email']) {
        const sql = this.#sql;
        const { count } =
            await sql`INSERT INTO drap.users (email) VALUES (${email}) ON CONFLICT ON CONSTRAINT users_pkey DO NOTHING RETURNING student_number, lab_id`;
        return count;
    }

    @timed async upsertOpenIdUser(
        email: User['email'],
        uid: NonNullable<User['user_id']>,
        given: User['given_name'],
        family: User['family_name'],
        avatar: User['avatar'],
    ) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.users AS u (email, user_id, given_name, family_name, avatar) VALUES (${email}, ${uid}, ${given}, ${family}, ${avatar}) ON CONFLICT ON CONSTRAINT users_pkey DO UPDATE SET user_id = EXCLUDED.user_id, given_name = coalesce(nullif(trim(u.given_name), ''), EXCLUDED.given_name), family_name = coalesce(nullif(trim(u.family_name), ''), EXCLUDED.family_name), avatar = EXCLUDED.avatar RETURNING is_admin, lab_id`;
        strictEqual(rest.length, 0);
        return parse(UpsertedOpenIdUser, first);
    }

    @timed async updateProfileBySession(
        sid: Session['session_id'],
        studentNumber: User['student_number'],
        given: User['given_name'],
        family: User['family_name'],
    ) {
        const sql = this.#sql;
        const { count } =
            await sql`UPDATE drap.users AS u SET student_number = coalesce(u.student_number, ${studentNumber}), given_name = ${given}, family_name = ${family} FROM drap.sessions s WHERE session_id = ${sid} AND s.email = u.email`;
        return count;
    }

    @timed async insertNewLab(id: Lab['lab_id'], name: Lab['lab_name']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.labs (lab_id, lab_name) VALUES (${id}, ${name}) RETURNING lab_id`;
        strictEqual(rest.length, 0);
        return parse(CreatedLab, first).lab_id;
    }

    @timed async getLabRegistry() {
        const sql = this.#sql;
        const labs = await sql`SELECT lab_id, lab_name, quota FROM drap.labs ORDER BY lab_name`;
        return parse(RegisteredLabs, labs);
    }

    @timed async isValidTotalLabQuota() {
        const sql = this.#sql;
        const [first, ...rest] = await sql`SELECT bool_or(quota > 0) result FROM drap.labs`;
        strictEqual(rest.length, 0);
        return parse(BooleanResult, first).result;
    }

    @timed async getLabCountAndStudentCount(draft: Draft['draft_id']) {
        const [[labCount, ...labRest], [studentCount, ...studentRest]] = await this.#sql.begin(
            sql =>
                [
                    sql`SELECT count(lab_id) FROM drap.labs`,
                    sql`SELECT count(email) FROM drap.student_ranks WHERE draft_id = ${draft}`,
                ] as const,
        );
        strictEqual(labRest.length, 0);
        strictEqual(studentRest.length, 0);
        return { labCount: parse(CountResult, labCount).count, studentCount: parse(CountResult, studentCount).count };
    }

    @timed async updateLabQuotas(quota: Iterable<readonly [Lab['lab_id'], Lab['quota']]>) {
        const sql = this.#sql;
        const values = sql(Array.from(quota));
        const { count } =
            await sql`UPDATE drap.labs l SET quota = d.quota::SMALLINT FROM (VALUES ${values}) d (lab_id, quota) WHERE l.lab_id = d.lab_id`;
        return count;
    }

    @timed async getFacultyAndStaff() {
        const sql = this.#sql;
        const users =
            await sql`SELECT email, given_name, family_name, avatar, user_id, lab_name FROM drap.users LEFT JOIN drap.labs USING (lab_id) WHERE is_admin`;
        return parse(QueriedFaculty, users);
    }

    @timed async getValidStaffEmails() {
        const sql = this.#sql;
        const users = await sql`SELECT email FROM drap.users WHERE is_admin AND lab_id IS NULL AND user_id IS NOT NULL`;
        return parse(UserEmails, users).map(({ email }) => email);
    }

    @timed async getValidFacultyAndStaffEmails() {
        const sql = this.#sql;
        const users = await sql`SELECT email FROM drap.users WHERE is_admin AND user_id IS NOT NULL`;
        return parse(UserEmails, users).map(({ email }) => email);
    }

    @timed async getLabMembers(lab: Lab['lab_id']) {
        const [[labName, ...labRest], heads, members] = await this.#sql.begin(
            sql =>
                [
                    sql`SELECT lab_name FROM drap.labs WHERE lab_id = ${lab}`,
                    sql`SELECT email, given_name, family_name, avatar, student_number FROM drap.users WHERE user_id IS NOT NULL AND lab_id = ${lab} AND is_admin ORDER BY family_name`,
                    sql`SELECT email, given_name, family_name, avatar, student_number FROM drap.users WHERE user_id IS NOT NULL AND lab_id = ${lab} AND NOT is_admin ORDER BY family_name`,
                ] as const,
        );
        strictEqual(labRest.length, 0);
        return {
            lab: parse(LabName, labName).lab_name,
            heads: parse(QueriedLabMembers, heads),
            members: parse(QueriedLabMembers, members),
        };
    }

    @timed async getDrafts() {
        const sql = this.#sql;
        const drafts =
            await sql`SELECT draft_id, curr_round, max_rounds, lower(active_period) active_period_start, upper(active_period) active_period_end FROM drap.drafts ORDER BY active_period_end DESC NULLS FIRST`;
        return parse(Drafts, drafts);
    }

    @timed async getDraftById(id: Draft['draft_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT curr_round, max_rounds, lower(active_period) active_period_start, upper(active_period) active_period_end FROM drap.drafts WHERE draft_id = ${id}`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(QueriedDraft, first);
    }

    @timed async getActiveDraft() {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT draft_id, curr_round, max_rounds, lower(active_period) active_period_start, upper(active_period) active_period_end FROM drap.drafts WHERE upper_inf(active_period)`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(LatestDraft, first);
    }

    @timed async getMaxRoundInDraft(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const [first, ...rest] = await sql`SELECT max_rounds FROM drap.drafts WHERE draft_id = ${draft}`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(DraftMaxRounds, first).max_rounds;
    }

    @timed async getStudentsInDraftTaggedByLab(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const students =
            await sql`SELECT email, given_name, family_name, avatar, student_number, labs, fce.lab_id FROM drap.student_ranks sr JOIN drap.users u USING (email) LEFT JOIN drap.faculty_choices_emails fce ON (sr.draft_id, email) = (fce.draft_id, student_email) WHERE sr.draft_id = ${draft} ORDER BY family_name`;
        return parse(TaggedStudentsWithLabs, students);
    }

    @timed async getLabAndRemainingStudentsInDraftWithLabPreference(
        draft: Draft['draft_id'],
        lab: StudentRank['labs'][number],
    ) {
        const [[labs, ...labsRest], available, selected, [isDone, ...doneRest]] = await this.#sql.begin(
            'ISOLATION LEVEL REPEATABLE READ',
            sql =>
                [
                    sql`SELECT lab_name, quota FROM drap.labs WHERE lab_id = ${lab}`,
                    sql`SELECT email, given_name, family_name, avatar, student_number FROM drap.student_ranks sr JOIN drap.drafts USING (draft_id) LEFT JOIN drap.faculty_choices_emails fce ON (sr.draft_id, email) = (fce.draft_id, student_email) JOIN drap.users USING (email) WHERE sr.draft_id = ${draft} AND student_email IS NULL AND labs[curr_round] = ${lab}`,
                    sql`SELECT email, given_name, family_name, avatar, student_number FROM drap.faculty_choices_emails fce JOIN drap.users ON student_email = email WHERE draft_id = ${draft} AND fce.lab_id = ${lab}`,
                    sql`SELECT EXISTS(SELECT choice_id FROM drap.faculty_choices fc JOIN drap.drafts d ON (fc.draft_id, round) = (d.draft_id, curr_round) WHERE fc.draft_id = ${draft} AND lab_id = ${lab}) result`,
                ] as const,
        );
        strictEqual(labsRest.length, 0);
        strictEqual(doneRest.length, 0);
        return {
            lab: typeof labs === 'undefined' ? null : parse(QueriedLab, labs),
            students: parse(QueriedLabMembers, available),
            researchers: parse(QueriedLabMembers, selected),
            isDone: parse(BooleanResult, isDone).result,
        };
    }

    /**
     * For a lab to be auto-acknowledged:
     * 1. The lab has exhausted their entire quota (i.e., no remaining quota).
     * 2. The lab must not be preferred by anyone in the current draft round.
     */
    @timed async autoAcknowledgeLabsWithoutPreferences(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const d = sql`SELECT draft_id, curr_round FROM drap.drafts WHERE draft_id = ${draft}`;
        const drafted = sql`SELECT lab_id, count(student_email) draftees FROM d JOIN drap.faculty_choices_emails USING (draft_id) GROUP BY lab_id`;
        const preferred = sql`SELECT lab_id, count(DISTINCT email) preferrers FROM (SELECT labs[curr_round] lab_id, email FROM d JOIN drap.student_ranks USING (draft_id) LEFT JOIN drap.faculty_choices_emails fce ON (d.draft_id, email) = (fce.draft_id, student_email) WHERE student_email IS NULL) _ GROUP BY lab_id`;
        const values = sql`WITH d AS (${d}), drafted AS (${drafted}), preferred AS (${preferred}) SELECT draft_id, curr_round, lab_id FROM d, drap.labs LEFT JOIN drafted USING (lab_id) LEFT JOIN preferred USING (lab_id) WHERE coalesce(draftees, 0) >= quota OR coalesce(preferrers, 0) = 0`;
        const { count } = await sql`INSERT INTO drap.faculty_choices (draft_id, round, lab_id) ${values}`;
        return count;
    }

    @timed async getLabQuotaAndSelectedStudentCountInDraft(draft: Draft['draft_id'], lab: StudentRank['labs'][number]) {
        const [[quota, ...quotaRest], [selected, ...selectedRest]] = await this.#sql.begin(
            'ISOLATION LEVEL REPEATABLE READ',
            sql =>
                [
                    sql`SELECT quota FROM drap.labs WHERE lab_id = ${lab}`,
                    sql`SELECT count(student_email) FROM drap.faculty_choices_emails fce WHERE draft_id = ${draft} AND fce.lab_id = ${lab}`,
                ] as const,
        );
        strictEqual(quotaRest.length, 0);
        strictEqual(selectedRest.length, 0);
        return {
            quota: typeof quota === 'undefined' ? null : parse(LabQuota, quota).quota,
            selected: parse(CountResult, selected).count,
        };
    }

    @timed async initDraft(rounds: Draft['max_rounds']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.drafts (max_rounds) VALUES (${rounds}) RETURNING draft_id, lower(active_period) active_period_start`;
        strictEqual(rest.length, 0);
        return parse(CreatedDraft, first);
    }

    @timed async incrementDraftRound(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`UPDATE drap.drafts SET curr_round = CASE WHEN curr_round < max_rounds THEN curr_round + 1 ELSE NULL END WHERE draft_id = ${draft} RETURNING curr_round, max_rounds`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(IncrementedDraftRound, first);
    }

    @timed async randomizeRemainingStudents(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const emails =
            await sql`SELECT email FROM drap.student_ranks sr LEFT JOIN drap.faculty_choices_emails fce ON (sr.draft_id, email) = (fce.draft_id, student_email) WHERE sr.draft_id = ${draft} AND student_email IS NULL ORDER BY random()`;
        return parse(UserEmails, emails).map(({ email }) => email);
    }

    @timed async concludeDraft(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const { count } =
            await sql`UPDATE drap.drafts d SET active_period = tstzrange(lower(d.active_period), coalesce(upper(d.active_period), now()), '[)') WHERE draft_id = ${draft} RETURNING upper(active_period) active_period_end`;
        switch (count) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                fail(`concludeDraft => unexpected update count ${count}`);
        }
    }

    @timed async syncDraftResultsToUsersWithNotification(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const results = sql`UPDATE drap.users u SET lab_id = fce.lab_id FROM drap.faculty_choices_emails fce WHERE draft_id = ${draft} AND email = student_email RETURNING email, u.lab_id`;
        const notifs =
            await sql`WITH results AS (${results}) INSERT INTO drap.user_notifications (email, lab_id) SELECT email, lab_id FROM results RETURNING notif_id`;
        return parse(CreatedUserNotifications, notifs).map(({ notif_id }) => notif_id);
    }

    @timed async insertStudentRanking(draft: Draft['draft_id'], email: User['email'], labs: StudentRank['labs']) {
        const sql = this.#sql;
        const { count } =
            await sql`INSERT INTO drap.student_ranks (draft_id, email, labs) VALUES (${draft}, ${email}, ${labs}) ON CONFLICT ON CONSTRAINT student_ranks_pkey DO NOTHING`;
        switch (count) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                fail(`insertStudentRanking => unexpected insertion count ${count}`);
        }
    }

    @timed async getStudentRankings(draft: StudentRank['draft_id'], email: StudentRank['email']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT created_at, array_agg(lab_name ORDER BY idx) labs FROM (SELECT generate_subscripts(labs, 1) idx, created_at, unnest(labs) lab_id FROM drap.student_ranks WHERE draft_id = ${draft} AND email = ${email}) _ JOIN drap.labs USING (lab_id) GROUP BY created_at`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(QueriedStudentRank, first);
    }

    @timed async getCandidateSenders() {
        const sql = this.#sql;
        const users =
            await sql`SELECT cs.email, given_name, family_name, avatar, (ds.email IS NOT NULL) is_active FROM drap.candidate_senders cs JOIN drap.users USING (email) LEFT JOIN drap.designated_sender ds ON cs.email = ds.email WHERE user_id IS NOT NULL AND is_admin AND lab_id IS NULL ORDER BY family_name`;
        return parse(QueriedCandidateSenders, users);
    }

    /**
     * A designated sender is an admin (i.e., `is_admin=True` and `lab_id=NULL`) with valid
     * OAuth 2.0 credentials * such that the access token will not expire in the next five minutes.
     */
    @timed async getDesignatedSenderCredentials() {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT email, given_name, family_name, access_token, refresh_token, expiration FROM drap.designated_sender JOIN drap.candidate_senders cs USING (email) JOIN drap.users USING (email) WHERE user_id IS NOT NULL AND is_admin AND lab_id IS NULL FOR UPDATE OF cs`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(DesignatedSenderCredentials, first);
    }

    @timed async upsertCandidateSender(
        email: CandidateSender['email'],
        expiration: CandidateSender['expiration'],
        accessToken: CandidateSender['access_token'],
        refreshToken?: CandidateSender['refresh_token'],
    ) {
        const sql = this.#sql;
        const query =
            typeof refreshToken === 'undefined'
                ? sql`UPDATE drap.candidate_senders SET expiration = ${expiration}, access_token = ${accessToken} WHERE email = ${email}`
                : sql`INSERT INTO drap.candidate_senders (email, expiration, access_token, refresh_token) VALUES (${email}, ${expiration}, ${accessToken}, ${refreshToken}) ON CONFLICT ON CONSTRAINT candidate_senders_pkey DO UPDATE SET expiration = EXCLUDED.expiration, access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token`;
        const { count } = await query;
        strictEqual(count, 1);
    }

    @timed async deleteCandidateSender(email: CandidateSender['email']) {
        const sql = this.#sql;
        const { count } = await sql`DELETE FROM drap.candidate_senders WHERE email = ${email}`;
        switch (count) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                fail(`deleteCandidateSender => unexpected delete count ${count}`);
        }
    }

    @timed async deleteDesignatedSender(email: CandidateSender['email']) {
        const sql = this.#sql;
        const { count } = await sql`DELETE FROM drap.designated_sender WHERE email = ${email}`;
        switch (count) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                fail(`deleteDesignatedSender => unexpected delete count ${count}`);
        }
    }

    @timed async upsertDesignatedSender(email: CandidateSender['email']) {
        const sql = this.#sql;
        const { count } =
            await sql`INSERT INTO drap.designated_sender (email) VALUES (${email}) ON CONFLICT ON CONSTRAINT designated_sender_pkey DO NOTHING`;
        return count;
    }

    /**
     * The operation of inserting a faculty choice must necessarily occur
     * with the updating of a student_rank entry's chosen_by field; note
     * the two return values for this function.
     */
    @timed async insertFacultyChoice(
        draft: StudentRank['draft_id'],
        lab: FacultyChoice['lab_id'],
        faculty: FacultyChoice['faculty_email'],
        students: StudentRank['email'][],
    ) {
        const sql = this.#sql;
        const fc = sql`INSERT INTO drap.faculty_choices (draft_id, round, lab_id, faculty_email) SELECT draft_id, curr_round, ${lab}, ${faculty} FROM drap.drafts WHERE draft_id = ${draft} RETURNING draft_id, round, lab_id`;
        if (students.length === 0) {
            const { count } = await fc;
            strictEqual(count, 1);
        } else {
            const emails = students.map(email => [email] as const);
            const { count } =
                await sql`WITH fc AS (${fc}) INSERT INTO drap.faculty_choices_emails (draft_id, round, lab_id, student_email) SELECT draft_id, round, lab_id, email FROM fc, (VALUES ${sql(emails)}) _ (email)`;
            strictEqual(students.length, count);
        }
    }

    @timed async insertLotteryChoices(
        draft: Draft['draft_id'],
        admin: FacultyChoice['faculty_email'],
        batch: (readonly [StudentRank['email'], FacultyChoice['lab_id']])[],
    ) {
        const sql = this.#sql;
        const labs = Array.from(new Set(batch.map(([_, lab]) => lab)), lab => [lab] as const);
        const { count } =
            await sql`WITH fc AS (INSERT INTO drap.faculty_choices (draft_id, round, lab_id, faculty_email) SELECT draft_id, curr_round, lab_id, ${admin} FROM drap.drafts, (VALUES ${sql(labs)}) labs (lab_id) WHERE draft_id = ${draft} ON CONFLICT ON CONSTRAINT faculty_choices_pkey DO UPDATE SET faculty_email = EXCLUDED.faculty_email RETURNING draft_id, round, lab_id) INSERT INTO drap.faculty_choices_emails (draft_id, round, lab_id, student_email) SELECT draft_id, round, lab_id, email FROM fc JOIN (VALUES ${sql(batch)}) batch (email, lab_id) USING (lab_id)`;
        strictEqual(batch.length, count);
    }

    @timed async getPendingLabCountInDraft(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const fc = sql`SELECT choice_id, lab_id FROM drap.faculty_choices fc JOIN drap.drafts d ON (fc.draft_id, round) = (d.draft_id, curr_round) WHERE fc.draft_id = ${draft}`;
        const [first, ...rest] =
            await sql`SELECT count(lab_id) FROM drap.labs l LEFT JOIN (${fc}) fc USING (lab_id) WHERE choice_id IS NULL`;
        strictEqual(rest.length, 0);
        return parse(CountResult, first).count;
    }

    @timed async getFacultyChoiceRecords(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const choices =
            await sql`SELECT fc.draft_id, fc.round, fc.lab_id, fc.created_at, fc.faculty_email, fce.student_email FROM drap.faculty_choices fc LEFT JOIN drap.faculty_choices_emails fce ON (fc.draft_id, fc.round, fc.lab_id) = (fce.draft_id, fce.round, fce.lab_id) WHERE fc.draft_id = ${draft} ORDER BY fc.round`;
        return parse(ChoiceRecords, choices);
    }

    @timed async getDraftEvents(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const events =
            await sql`SELECT created_at, round, lab_id, (faculty_email IS NULL) is_system FROM drap.faculty_choices WHERE draft_id = ${draft} ORDER BY created_at DESC`;
        return parse(DraftEvents, events);
    }

    @timed async inviteNewFacultyOrStaff(email: User['email'], lab: User['lab_id']) {
        const sql = this.#sql;
        const { count } =
            await sql`INSERT INTO drap.users (email, lab_id, is_admin) VALUES (${email}, ${lab}, TRUE) ON CONFLICT ON CONSTRAINT users_pkey DO NOTHING`;
        switch (count) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                fail(`inviteNewUser => unexpected insertion count ${count}`);
        }
    }

    @timed async notifyDraftChannel(payload = '') {
        await this.#sql.notify('notify:draft', payload);
    }

    @timed async postDraftRoundStartedNotification(
        draft: DraftNotification['draft_id'],
        round: DraftRoundStarted['round'],
    ) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.draft_notifications (ty, draft_id, round) VALUES ('DraftRoundStarted', ${draft}, ${round}) RETURNING notif_id`;
        strictEqual(rest.length, 0);
        return parse(CreatedUserNotification, first).notif_id;
    }

    @timed async postDraftRoundSubmittedNotification(
        draft: DraftNotification['draft_id'],
        lab: DraftRoundSubmitted['lab_id'],
    ) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.draft_notifications (ty, draft_id, round, lab_id) SELECT 'DraftRoundSubmitted', draft_id, curr_round, ${lab} FROM drap.drafts WHERE draft_id = ${draft} RETURNING notif_id`;
        strictEqual(rest.length, 0);
        return parse(CreatedUserNotification, first).notif_id;
    }

    @timed async postLotteryInterventionNotifications(
        draft: DraftNotification['draft_id'],
        rows: (readonly [LotteryIntervention['email'], LotteryIntervention['lab_id']])[],
    ) {
        const sql = this.#sql;
        const notifs =
            await sql`INSERT INTO drap.draft_notifications (ty, draft_id, lab_id, email) SELECT 'LotteryIntervention', ${draft}, lab, email FROM (VALUES ${sql(rows)}) _ (email, lab) RETURNING notif_id`;
        return parse(CreatedUserNotifications, notifs).map(({ notif_id }) => notif_id);
    }

    @timed async postDraftConcluded(draft: DraftNotification['draft_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.draft_notifications (ty, draft_id) VALUES ('DraftConcluded', ${draft}) RETURNING notif_id`;
        strictEqual(rest.length, 0);
        return parse(CreatedUserNotification, first).notif_id;
    }

    @timed async postUserNotification(lab: UserNotification['lab_id'], email: UserNotification['email']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.user_notifications (lab_id, email) VALUES (${lab}, ${email}) RETURNING notif_id`;
        strictEqual(rest.length, 0);
        return parse(CreatedUserNotification, first).notif_id;
    }

    @timed async notifyUserChannel(payload = '') {
        await this.#sql.notify('notify:user', payload);
    }

    @timed async getOneDraftNotification() {
        const sql = this.#sql;
        const [notif, ...rest] =
            await sql`SELECT notif_id, draft_id, ty, round, dn.lab_id, lab_name, u.email, given_name, family_name FROM drap.draft_notifications dn LEFT JOIN drap.labs USING (lab_id) LEFT JOIN drap.users u USING (email) ORDER BY notif_id LIMIT 1 FOR UPDATE OF dn SKIP LOCKED`;
        strictEqual(rest.length, 0);
        return typeof notif === 'undefined' ? null : parse(DraftNotificationWithDetails, notif);
    }

    @timed async getOneUserNotification() {
        const sql = this.#sql;
        const [notif, ...rest] =
            await sql`SELECT notif_id, dn.lab_id, lab_name, email, given_name, family_name FROM drap.user_notifications dn JOIN drap.labs USING (lab_id) JOIN drap.users USING (email) ORDER BY notif_id LIMIT 1 FOR UPDATE OF dn SKIP LOCKED`;
        strictEqual(rest.length, 0);
        return typeof notif === 'undefined' ? null : parse(UserNotificationWithDetails, notif);
    }

    @timed async dropDraftNotification(notif: DraftNotification['notif_id']) {
        const sql = this.#sql;
        const { count } = await sql`DELETE FROM drap.draft_notifications WHERE notif_id = ${notif}`;
        switch (count) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                fail(`dropDraftNotification => unexpected delete count ${count}`);
        }
    }

    @timed async dropUserNotification(notif: UserNotification['notif_id']) {
        const sql = this.#sql;
        const { count } = await sql`DELETE FROM drap.user_notifications WHERE notif_id = ${notif}`;
        switch (count) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                fail(`dropUserNotification => unexpected delete count ${count}`);
        }
    }

    async *listen(channel: string, signal: AbortSignal) {
        let resolver = Promise.withResolvers<string>();

        // eslint-disable-next-line func-style
        const aborter = () => resolver.reject();
        signal.addEventListener('abort', aborter);

        const listener = await this.#sql.listen(
            channel,
            payload => resolver.resolve(payload),
            () => resolver.resolve(''),
        );

        try {
            while (true) {
                const payload = await resolver.promise;
                // eslint-disable-next-line require-atomic-updates
                resolver = Promise.withResolvers();
                yield payload;
            }
        } catch {
            // NOTE: Intentionally empty. Abort signal invoked.
        } finally {
            signal.removeEventListener('abort', aborter);
            await listener.unlisten();
        }
    }
}

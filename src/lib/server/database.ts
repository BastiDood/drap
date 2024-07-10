import { type InferOutput, array, nullable, object, parse, pick, pipe, transform } from 'valibot';
import { type Loggable, timed } from '$lib/decorators';
import { fail, strictEqual } from 'node:assert/strict';
import type { Logger } from 'pino';
import postgres from 'postgres';

import { Pending, Session } from '$lib/server/models/session';
import { Draft } from '$lib/models/draft';
import { FacultyChoice } from '$lib/models/faculty-choice';
import { Lab } from '$lib/models/lab';
import { StudentRank } from '$lib/models/student-rank';
import { User } from '$lib/models/user';

const AvailableLabs = array(pick(Lab, ['lab_id', 'lab_name']));
const CreatedLab = pick(Lab, ['lab_id']);
const CreatedDraft = pick(Draft, ['draft_id', 'active_period_start']);
const CreatedFacultyChoice = pick(FacultyChoice, ['choice_id', 'created_at']);
const DeletedPendingSession = pick(Pending, ['nonce', 'expiration']);
const DeletedValidSession = pick(Session, ['email', 'expiration']);
const Emails = array(
    pipe(
        pick(User, ['email']),
        transform(({ email }) => email),
    ),
);
const IncrementedDraftRound = pick(Draft, ['curr_round']);
const LatestDraft = pick(Draft, ['draft_id', 'curr_round', 'max_rounds', 'active_period_start']);
const QueriedDraft = pick(Draft, ['curr_round', 'max_rounds', 'active_period_start', 'active_period_end']);
const QueriedFaculty = array(
    object({
        ...pick(User, ['email', 'given_name', 'family_name', 'avatar', 'user_id']).entries,
        lab_name: nullable(Lab.entries.lab_name),
    }),
);
const QueriedStudentRank = object({
    ...pick(StudentRank, ['chosen_by', 'created_at']).entries,
    labs: array(Lab.entries.lab_name),
});
const RegisteredLabs = array(Lab);
const StudentChosen = pick(StudentRank, ['chosen_by']);
const StudentsWithLabPreference = array(pick(User, ['email', 'given_name', 'family_name', 'avatar', 'student_number']));
const StudentsWithLabs = array(
    object({
        ...pick(User, ['email', 'given_name', 'family_name', 'avatar', 'student_number']).entries,
        ...pick(StudentRank, ['labs']).entries,
    }),
);

export type AvailableLabs = InferOutput<typeof AvailableLabs>;
export type QueriedFaculty = InferOutput<typeof QueriedFaculty>;

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
        return this.#sql.begin('ISOLATION LEVEL REPEATABLE READ', sql => fn(new Database(sql, this.#logger)));
    }

    @timed async generatePendingSession() {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.pendings DEFAULT VALUES RETURNING session_id, expiration, nonce`;
        strictEqual(rest.length, 0);
        return parse(Pending, first);
    }

    @timed async deletePendingSession(sid: Pending['session_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`DELETE FROM drap.pendings WHERE session_id = ${sid} RETURNING expiration, nonce`;
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
        const { count } =
            await sql`INSERT INTO drap.users AS u (email, user_id, given_name, family_name, avatar) VALUES (${email}, ${uid}, ${given}, ${family}, ${avatar}) ON CONFLICT ON CONSTRAINT users_pkey DO UPDATE SET user_id = ${uid}, given_name = coalesce(nullif(trim(u.given_name), ''), ${given}), family_name = coalesce(nullif(trim(u.family_name), ''), ${family}), avatar = ${avatar}`;
        return count;
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

    @timed async getAvailableLabs() {
        const sql = this.#sql;
        const labs = await sql`SELECT lab_id, lab_name FROM drap.labs WHERE quota > 0 ORDER BY lab_name`;
        return parse(AvailableLabs, labs);
    }

    @timed async getLabRegistry() {
        const sql = this.#sql;
        const labs = await sql`SELECT lab_id, lab_name, quota FROM drap.labs ORDER BY lab_name`;
        return parse(RegisteredLabs, labs);
    }

    @timed async updateLabQuotas(quota: Iterable<[Lab['lab_id'], Lab['quota']]>) {
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

    @timed async getDraftById(id: Draft['draft_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT curr_round, max_rounds, lower(active_period) active_period_start, CASE WHEN upper_inf(active_period) THEN NULL ELSE upper(active_period) END active_period_end FROM drap.drafts WHERE draft_id = ${id}`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(QueriedDraft, first);
    }

    @timed async getLatestDraft() {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT draft_id, curr_round, max_rounds, lower(active_period) active_period_start, CASE WHEN upper_inf(active_period) THEN NULL ELSE upper(active_period) END active_period_end FROM drap.drafts WHERE upper_inf(active_period)`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(LatestDraft, first);
    }

    @timed async getStudentsInLatestDraft(draft: Draft['draft_id']) {
        const sql = this.#sql;
        const users =
            await sql`SELECT email, given_name, family_name, avatar, student_number, labs FROM drap.student_ranks JOIN drap.drafts USING (draft_id) JOIN drap.users USING (email) WHERE draft_id = ${draft}`;
        return parse(StudentsWithLabs, users);
    }

    @timed async getStudentsInLatestDraftWithLabPreference(draft: Draft['draft_id'], lab: StudentRank['labs'][number]) {
        const sql = this.#sql;
        const users =
            await sql`SELECT email, given_name, family_name, avatar, student_number FROM drap.student_ranks JOIN drap.drafts USING (draft_id) JOIN drap.users USING (email) WHERE draft_id = ${draft} AND labs[curr_round] = ${lab}`;
        return parse(StudentsWithLabPreference, users);
    }

    @timed async initDraft(rounds: Draft['max_rounds']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`INSERT INTO drap.drafts (max_rounds) VALUES (${rounds}) RETURNING draft_id, lower(active_period) active_period_start`;
        strictEqual(rest.length, 0);
        return parse(CreatedDraft, first);
    }

    @timed async incrementDraftRound(draft_id: Draft['draft_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`UPDATE drap.drafts SET curr_round = curr_round + 1 WHERE draft_id = ${draft_id} RETURNING curr_round`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(IncrementedDraftRound, first).curr_round;
    }

    @timed async getUndraftedStudents(draft_id: Draft['draft_id']) {
        const sql = this.#sql;
        const ranks =
            await sql`SELECT email FROM drap.student_ranks WHERE draft_id = ${draft_id} AND chosen_by IS NULL`;
        return parse(Emails, ranks);
    }

    @timed async insertStudentRanking(id: Draft['draft_id'], email: User['email'], labs: StudentRank['labs']) {
        const sql = this.#sql;
        const { count } =
            await sql`INSERT INTO drap.student_ranks (draft_id, email, labs) VALUES (${id}, ${email}, ${labs}) ON CONFLICT ON CONSTRAINT student_ranks_pkey DO NOTHING`;
        switch (count) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                fail('insertStudentRanking => unexpected insertion count');
        }
    }

    @timed async getStudentRankings(id: StudentRank['draft_id'], email: StudentRank['email']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT chosen_by, created_at, array_agg(lab_name) labs FROM drap.labs JOIN (SELECT chosen_by, created_at, unnest(labs) lab_id FROM drap.student_ranks WHERE draft_id = ${id} AND email = ${email}) ranks USING (lab_id) GROUP BY chosen_by, created_at`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(QueriedStudentRank, first);
    }

    /**
     * The operation of inserting a faculty choice must necessarily occur
     * with the updating of a student_rank entry's chosen_by field; note
     * the two return values for this function.
     */
    @timed async insertFacultyChoice(
        draftId: StudentRank['draft_id'],
        labId: FacultyChoice['lab_id'],
        round: FacultyChoice['round'],
        facultyEmail: FacultyChoice['faculty_email'],
        studentEmail: StudentRank['email'],
    ) {
        const sql = this.#sql;
        const [choice, ...choices] =
            await sql`INSERT INTO drap.faculty_choices (round, faculty_email, lab_id) VALUES (${round}, ${facultyEmail}, ${labId}) RETURNING choice_id, created_at`;
        strictEqual(choices.length, 0);

        const { choice_id: choiceId, created_at: createdAt } = parse(CreatedFacultyChoice, choice);
        const [rank, ...ranks] =
            await sql`UPDATE drap.student_ranks r SET chosen_by = coalesce(r.chosen_by, ${choiceId}) WHERE email = ${studentEmail} AND draft_id = ${draftId} RETURNING chosen_by`;
        strictEqual(ranks.length, 0);
        if (typeof rank === 'undefined') return null;

        const { chosen_by } = parse(StudentChosen, rank);
        strictEqual(chosen_by, choiceId, 'student was already previously chosen');
        return { choiceId, createdAt };
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
                fail('inviteNewUser => unexpected insertion count');
        }
    }
}

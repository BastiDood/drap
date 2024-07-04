import { type Loggable, timed } from '$lib/decorators';
import { array, date, parse, pick } from 'valibot';
import type { Logger } from 'pino';
import postgres from 'postgres';
import { strictEqual } from 'node:assert/strict';

import { Pending, Session } from '$lib/server/models/session';
import { Draft } from '$lib/models/draft';
import type { FacultyChoice } from '$lib/models/faculty-choice';
import { Lab } from '$lib/models/lab';
import type { StudentRank } from '$lib/models/student-rank';
import { User } from '$lib/models/user';

const DeletedPendingSession = pick(Pending, ['nonce', 'expiration']);
const DeletedValidSession = pick(Session, ['email', 'expiration']);
const RegisteredLabs = array(pick(Lab, ['lab_id', 'lab_name']));

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
        return this.#sql.begin(sql => fn(new Database(sql, this.#logger)));
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
            await sql`INSERT INTO drap.users (email) VALUES (${email}) ON CONFLICT (email) DO NOTHING RETURNING student_number, lab_id`;
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
            await sql`INSERT INTO drap.users AS u (email, user_id, given_name, family_name, avatar) VALUES (${email}, ${uid}, ${given}, ${family}, ${avatar}) ON CONFLICT (email) DO UPDATE SET user_id = ${uid}, given_name = coalesce(nullif(trim(u.given_name), ''), ${given}), family_name = coalesce(nullif(trim(u.family_name), ''), ${family}), avatar = ${avatar}`;
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

    @timed async getLabRegistry() {
        const sql = this.#sql;
        const labs = await sql`SELECT lab_id, lab_name FROM drap.labs ORDER BY lab_name`;
        return parse(RegisteredLabs, labs);
    }

    @timed async getLatestDraft() {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT max(draft_id), curr_round, max_rounds, created_at FROM drap.drafts GROUP BY draft_id`;
        strictEqual(rest.length, 0);
        return typeof first === 'undefined' ? null : parse(Draft, first);
    }

    @timed async initDraft(
        draft_id: Draft['draft_id'],
        max_rounds: Draft['max_rounds'],
        created_at: Draft['created_at']
    ) {
        const sql = this.#sql;
        const { count } = 
            await sql`INSERT INTO drap.drafts AS d (draft_id, curr_round, max_rounds, created_at) VALUES (${draft_id}, 0, ${max_rounds}, ${created_at})`;
        return count;
    }

    @timed async updateDraftRound(
        draft_id: Draft['draft_id'],
        curr_round: Draft['curr_round']
    ) {
        const sql = this.#sql;
        const { count } = 
            await sql`UPDATE drap.drafts AS d SET curr_round = ${curr_round}`;
        return count;
    }

    @timed async upsertStudentRanking(
        draft_id: Draft['draft_id'],
        chosen_by: StudentRank['chosen_by'],
        created_at: StudentRank['created_at'],
        email: User['email'],
        labs: StudentRank['labs'],
    ) {
        const sql = this.#sql;
        const { count } = 
            await sql`INSERT INTO drap.student_ranks AS u (draft_id, chosen_by, created_at, email, labs) VALUES (${draft_id}, ${chosen_by}, ${created_at}, ${email}, ${labs}) ON CONFLICT (email) DO UPDATE SET labs = ${labs}`;
        return count;
    }

    // the operation of inserting a faculty choice must necessarily occur with the updating of a student_rank entry's chosen_by field; note the two return values for this function
    @timed async insertFacultyChoice(
        choice_id: FacultyChoice['choice_id'],
        created_at: FacultyChoice['created_at'],
        round: FacultyChoice['round'],
        faculty_email: FacultyChoice['faculty_email'],
        lab_id: FacultyChoice['lab_id'],
        draft_id: StudentRank['draft_id'],
        target_email: StudentRank['email']
    ) {
        const sql = this.#sql;
        const { count: count1 } = 
            await sql`INSERT INTO drap.faculty_choices AS c (choice_id, created_at, round, faculty_email, lab_id) VALUES (${choice_id}, ${created_at}, ${round}, ${faculty_email}, ${lab_id})`;
        const { count: count2 } = 
            await sql`UPDATE drap.student_ranks AS u SET chosen_by = ${choice_id} WHERE email = ${target_email} AND draft_id = ${draft_id}`

        return [count1, count2]
    }
}
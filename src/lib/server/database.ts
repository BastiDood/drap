import { type Loggable, timed } from '$lib/decorators';
import { array, parse, pick } from 'valibot';
import type { Logger } from 'pino';
import postgres from 'postgres';
import { strictEqual } from 'node:assert/strict';

import { Pending, Session } from '$lib/server/models/session';
import { Draft } from '$lib/models/draft';
import { Lab } from '$lib/models/lab';
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
}

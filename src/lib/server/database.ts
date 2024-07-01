import { type Loggable, timed } from '$lib/decorators';
import { Pending, Session } from '$lib/server/models/session';
import { parse, pick } from 'valibot';
import type { Logger } from 'pino';
import { User } from '$lib/models/user';
import assert from 'node:assert/strict';
import postgres from 'postgres';

const DeletedPendingSession = pick(Pending, ['nonce', 'expiration']);
const DeletedValidSession = pick(Session, ['user_id', 'expiration']);

export class Database implements Loggable {
    #sql: postgres.Sql;
    #logger: Logger;

    constructor(sql: postgres.Sql, logger: Logger) {
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
        const [first, ...rest] = await sql`INSERT INTO drap.pendings DEFAULT VALUES RETURNING session_id, expiration, nonce`;
        assert(rest.length === 0);
        return parse(Pending, first);
    }

    @timed async deletePendingSession(sid: Pending['session_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`DELETE FROM drap.pendings WHERE session_id = ${sid} RETURNING expiration, nonce`;
        assert(rest.length === 0);
        return typeof first === 'undefined' ? null : parse(DeletedPendingSession, first);
    }

    @timed async insertValidSession(
        sid: Pending['session_id'],
        uid: Session['user_id'],
        expiration: Session['expiration'],
    ) {
        const sql = this.#sql;
        const { count } =
            await sql`INSERT INTO drap.sessions (session_id, user_id, expiration) VALUES (${sid}, ${uid}, ${expiration})`;
        return count;
    }

    @timed async getUserFromValidSession(sid: Session['session_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`SELECT u.* FROM drap.sessions JOIN drap.users u USING (user_id) WHERE session_id = ${sid}`;
        assert(rest.length === 0);
        return typeof first === 'undefined' ? null : parse(User, first);
    }

    @timed async deleteValidSession(sid: Session['session_id']) {
        const sql = this.#sql;
        const [first, ...rest] =
            await sql`DELETE FROM drap.sessions WHERE session_id = ${sid} RETURNING session_id, expiration, user_login`;
        assert(rest.length === 0);
        return typeof first === 'undefined' ? null : parse(DeletedValidSession, first);
    }

    @timed async upsertUser(
        uid: User['user_id'],
        email: User['email'],
        given: User['given_name'],
        family: User['family_name'],
        avatar: User['avatar'],
    ) {
        const sql = this.#sql;
        const { count } =
            await sql`INSERT INTO drap.users (user_id, email, given_name, family_name, avatar) VALUES (${uid}, ${email}, ${given}, ${family}, ${avatar}) ON CONFLICT (user_id) DO UPDATE SET email = ${email}, avatar = ${avatar}`;
        return count;
    }
}

import { type Loggable, timed } from '$lib/decorators';
import { Pending, Session } from '$lib/server/models/session';
import { parse, pick } from 'valibot';
import type { Logger } from 'pino';
import type { User } from '$lib/models/user';
import assert from 'node:assert/strict';
import postgres from 'postgres';

const DeletedPendingSession = pick(Pending, ['nonce', 'expiration']);
const DeletedValidSession = pick(Session, ['user_id', 'expiration']);

export class Database implements Loggable {
    sql: postgres.Sql;
    #logger: Logger;

    constructor(sql: postgres.Sql, logger: Logger) {
        this.sql = sql;
        this.#logger = logger;
    }

    get logger() {
        return this.#logger;
    }

    begin<T>(fn: (db: Database) => Promise<T>) {
        return this.sql.begin(sql => fn(new Database(sql, this.#logger)));
    }

    // eslint-disable-next-line class-methods-use-this
    @timed async generatePendingSession() {
        const [first, ...rest] = await this.sql`INSERT INTO pendings DEFAULT VALUES RETURNING session_id`;
        assert(rest.length === 0);
        return parse(Pending, first);
    }

    @timed async deletePendingSession(sid: Pending['session_id']) {
        const [first, ...rest] = await this
            .sql`DELETE FROM pendings WHERE session_id = ${sid} RETURNING expiration, nonce`;
        assert(rest.length === 0);
        return typeof first === 'undefined' ? null : parse(DeletedPendingSession, first);
    }

    // eslint-disable-next-line class-methods-use-this
    @timed async insertValidSession(
        sid: Pending['session_id'],
        uid: Session['user_id'],
        expiration: Session['expiration'],
    ) {
        const { count } = await this
            .sql`INSERT INTO sessions (session_id, user_id, expiration) VALUES (${sid}, ${uid}, ${expiration})`;
        return count;
    }

    // eslint-disable-next-line class-methods-use-this
    @timed async deleteValidSession(sid: Session['session_id']) {
        const [first, ...rest] = await this
            .sql`DELETE FROM sessions WHERE session_id = ${sid} RETURNING session_id, expiration`;
        assert(rest.length === 0);
        return typeof first === 'undefined' ? null : parse(DeletedValidSession, first);
    }

    // eslint-disable-next-line class-methods-use-this
    @timed async upsertOpenIdUser(
        uid: User['user_id'],
        email: User['email'],
        given: User['given_name'],
        family: User['family_name'],
        avatar: User['avatar'],
    ) {
        const { count } = await this
            .sql`INSERT INTO users (user_id, email, given_name, family_name, avatar) VALUES (${uid}, ${email}, ${given}, ${family}, ${avatar}) ON CONFLICT (user_id) DO UPDATE SET email = ${email}, given_name = ${given}, family_name = ${family}, avatar = ${avatar}`;
        return count;
    }
}

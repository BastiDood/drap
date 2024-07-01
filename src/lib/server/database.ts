import { type Loggable, timed } from '$lib/decorators';
import { Pending, Session } from '$lib/server/models/session';
import { parse, pick } from 'valibot';
import type { Logger } from 'pino';
import type { User } from '$lib/models/user';
import assert from 'node:assert/strict';
import { env } from '$env/dynamic/private';
import postgres from 'postgres';

const sql = postgres(env.POSTGRES_URL, { ssl: 'prefer' });
process.once('sveltekit:shutdown', () => sql.end());

const DeletedSession = pick(Session, ['user_id', 'expiration']);

export class Database implements Loggable {
    #logger: Logger;

    constructor(logger: Logger) {
        this.#logger = logger;
    }

    get logger() {
        return this.#logger;
    }

    // eslint-disable-next-line class-methods-use-this
    @timed async generatePendingSession() {
        const [first, ...rest] = await sql`INSERT INTO pendings DEFAULT VALUES RETURNING session_id`;
        assert(rest.length === 0);
        return parse(Pending, first);
    }

    // eslint-disable-next-line class-methods-use-this
    @timed async upgradePendingSession(
        sid: Pending['session_id'],
        uid: Session['user_id'],
        expiration: Session['expiration'],
    ) {
        const [first, ...rest] =
            await sql`INSERT INTO sessions (session_id, user_id, expiration) DELETE FROM pendings WHERE session_id = ${sid} RETURNING session_id, ${uid}, ${expiration}`;
        assert(rest.length === 0);
        return typeof first === 'undefined' ? null : parse(Pending, first);
    }

    // eslint-disable-next-line class-methods-use-this
    @timed async upsertOpenIdUser(
        uid: User['user_id'],
        email: User['email'],
        given: User['given_name'],
        family: User['family_name'],
        avatar: User['avatar'],
    ) {
        const { count } =
            await sql`INSERT INTO users (user_id, email, given_name, family_name, avatar) VALUES (${uid}, ${email}, ${given}, ${family}, ${avatar}) ON CONFLICT (user_id) DO UPDATE SET email = ${email}, given_name = ${given}, family_name = ${family}, avatar = ${avatar}`;
        return count;
    }

    // eslint-disable-next-line class-methods-use-this
    @timed async deleteSession(sid: Session['session_id']) {
        const [first, ...rest] =
            await sql`DELETE FROM sessions WHERE session_id = ${sid} RETURNING session_id, expiration`;
        assert(rest.length === 0);
        return typeof first === 'undefined' ? null : parse(DeletedSession, first);
    }
}

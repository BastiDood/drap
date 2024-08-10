import { Database } from 'drap-database';
import POSTGRES from '$lib/server/env/postgres';
import pino from 'pino';
import postgres from 'postgres';
import process from 'node:process';

const logger = pino();

const sql = postgres(POSTGRES.URL, { types: { bigint: postgres.BigInt } });
process.once('sveltekit:shutdown', () => sql.end());

export async function handle({ event, resolve }) {
    const { method, url } = event.request;
    event.locals.db = new Database(sql, logger.child({ method, url }));
    const start = performance.now();
    try {
        const response = await resolve(event);
        event.locals.db.logger.info({ status: response.status, response_time: performance.now() - start });
        return response;
    } catch (error) {
        event.locals.db.logger.error({ error, response_time: performance.now() - start });
        throw error;
    }
}

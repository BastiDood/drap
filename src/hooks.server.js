import { Database } from '$lib/server/database';
import { env } from '$env/dynamic/private';
import pino from 'pino';
import postgres from 'postgres';
import process from 'node:process';

const logger = pino();

const sql = postgres(env.POSTGRES_URL, { ssl: 'prefer' });
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

import pino from 'pino';

const logger = pino();

export async function handle({ event, resolve }) {
    const { method, url } = event.request;
    event.locals.logger = logger.child({ method, url });
    const start = performance.now();
    try {
        const response = await resolve(event);
        event.locals.logger.info({ status: response.status, response_time: performance.now() - start });
        return response;
    } catch (error) {
        event.locals.logger.error({ error, response_time: performance.now() - start });
        throw error;
    }
}

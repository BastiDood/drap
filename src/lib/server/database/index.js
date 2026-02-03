import * as POSTGRES from '$lib/server/env/postgres';

import { init } from './drizzle';

export const db = init(POSTGRES.URL);

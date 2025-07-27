import assert from 'node:assert/strict';
import { env, loadEnvFile } from 'node:process';

import { defineConfig } from 'drizzle-kit';

loadEnvFile();
assert(env.POSTGRES_URL, 'POSTGRES_URL must be set');

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/server/database/schema/index.js',
  dialect: 'postgresql',
  dbCredentials: { url: env.POSTGRES_URL },
});

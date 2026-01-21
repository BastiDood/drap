import { serve } from 'inngest/sveltekit';

import { BASE_URL } from '$lib/server/env/inngest/api';
import { SIGNING_KEY } from '$lib/server/env/inngest/signing';

import { functions } from './functions';
import { inngest } from './client';

export const { GET, POST, PUT } = serve({
  client: inngest,
  baseUrl: BASE_URL,
  signingKey: SIGNING_KEY,
  functions,
});

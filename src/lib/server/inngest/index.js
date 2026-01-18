import { serve } from 'inngest/sveltekit';

import { SIGNING_KEY } from '$lib/server/env/inngest/signing';

import { functions } from './functions';
import { inngest } from './client';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey: SIGNING_KEY,
});

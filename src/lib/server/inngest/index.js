import { serve } from 'inngest/sveltekit';

import { functions } from './functions';
import { inngest as client } from './client';

export const { GET, POST, PUT } = serve({ client, functions });

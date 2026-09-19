import { serve } from 'inngest/sveltekit';

import { inngest as client } from './client';
import { functions } from './functions';

export const { GET, POST, PUT } = serve({ client, functions });

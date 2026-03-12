import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

import { env } from '$env/dynamic/private';

const encryptionKey = env.DRAP_ENCRYPTION_KEY;
assert(typeof encryptionKey !== 'undefined', 'DRAP_ENCRYPTION_KEY must be defined');

export const ENCRYPTION_KEY = await crypto.subtle.importKey(
  'raw',
  Buffer.from(encryptionKey, 'base64url'),
  'AES-GCM',
  false,
  ['encrypt', 'decrypt'],
);

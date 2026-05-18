import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

import { building } from '$app/environment';
import { env } from '$env/dynamic/private';

let buffer: Buffer<ArrayBuffer>;
if (building) {
  // A mock key for builds is fine for now.
  buffer = Buffer.alloc(32);
} else {
  assert(typeof env.DRAP_ENCRYPTION_KEY !== 'undefined');
  buffer = Buffer.from(env.DRAP_ENCRYPTION_KEY, 'base64url');
}

export const ENCRYPTION_KEY = await crypto.subtle.importKey('raw', buffer, 'AES-GCM', false, [
  'encrypt',
  'decrypt',
]);

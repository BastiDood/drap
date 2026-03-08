import { Buffer } from 'node:buffer';

import { ENCRYPTION_KEY } from '$lib/server/env/drap/crypto';

const TEXT_DECODER = new TextDecoder();
const TEXT_ENCODER = new TextEncoder();

export async function encryptOAuthSecret(secret: string) {
  const iv = Buffer.from(crypto.getRandomValues(new Uint8Array(12))); // 96 Bits
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    ENCRYPTION_KEY,
    TEXT_ENCODER.encode(secret),
  );
  return { iv, cipher: Buffer.from(cipher) };
}

export async function decryptOAuthSecret(iv: BufferSource, cipher: BufferSource) {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, ENCRYPTION_KEY, cipher);
  return TEXT_DECODER.decode(plaintext);
}

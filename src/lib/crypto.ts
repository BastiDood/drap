import { Buffer } from 'node:buffer';

const TEXT_DECODER = new TextDecoder();
const TEXT_ENCODER = new TextEncoder();

export async function encryptSecret(key: CryptoKey, payload: string) {
  const iv = Buffer.from(crypto.getRandomValues(new Uint8Array(12))); // 96 Bits
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    TEXT_ENCODER.encode(payload),
  );
  return { iv, cipher: Buffer.from(cipher) };
}

export async function decryptSecret(key: CryptoKey, iv: BufferSource, cipher: BufferSource) {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return TEXT_DECODER.decode(plaintext);
}

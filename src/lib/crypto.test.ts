import { expect, test as base } from 'vitest';

import { decryptSecret, encryptSecret } from './crypto';

const test = base.extend<{ cryptoKey: CryptoKey }>({
  // eslint-disable-next-line no-empty-pattern
  async cryptoKey({}, use) {
    const cryptoKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
      'encrypt',
      'decrypt',
    ]);
    await use(cryptoKey);
  },
});

test('encryptSecret returns a 96-bit iv and ciphertext', async ({ cryptoKey }) => {
  const encrypted = await encryptSecret(cryptoKey, 'top secret');

  expect(encrypted.iv).toHaveLength(12);
  expect(encrypted.cipher).not.toHaveLength(0);
});

test('decryptSecret round-trips plaintext with the run-scoped key', async ({ cryptoKey }) => {
  const plaintext = 'round-trip payload';
  const encrypted = await encryptSecret(cryptoKey, plaintext);

  await expect(decryptSecret(cryptoKey, encrypted.iv, encrypted.cipher)).resolves.toBe(plaintext);
});

test('encryptSecret uses a fresh iv for repeated encryptions', async ({ cryptoKey }) => {
  const [first, second] = await Promise.all([
    encryptSecret(cryptoKey, 'same payload'),
    encryptSecret(cryptoKey, 'same payload'),
  ]);

  expect(first.iv.equals(second.iv)).toBe(false);
});

import { parseArgs } from 'node:util';
import { randomBytes } from 'node:crypto';
import { strictEqual } from 'node:assert';

const {
  positionals: [size, ...args],
} = parseArgs({ allowPositionals: true });
strictEqual(args.length, 0, 'too many arguments provided');

if (typeof size === 'undefined') throw new Error('missing <bytes> argument');

const bytes = Number.parseInt(size, 10);
if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new Error('invalid <bytes> argument');

const random = randomBytes(bytes);

// eslint-disable-next-line no-console
console.log({
  hex: random.toString('hex'),
  base64url: random.toString('base64url'),
});

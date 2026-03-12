import { Buffer } from 'node:buffer';

// AES-256-GCM requires a 32-byte key.
const bytes = crypto.getRandomValues(Buffer.alloc(32));

// eslint-disable-next-line no-console
console.log(bytes.toString('base64url'));

import { createRemoteJWKSet } from 'jose';
export const fetchJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

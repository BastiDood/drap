import { type InferOutput, object, pipe, string, url } from 'valibot';

export const DiscoveryDocument = object({
  issuer: pipe(string(), url()),
  authorization_endpoint: pipe(string(), url()),
  token_endpoint: pipe(string(), url()),
  userinfo_endpoint: pipe(string(), url()),
  revocation_endpoint: pipe(string(), url()),
  jwks_uri: pipe(string(), url()),
});

export type DiscoveryDocument = InferOutput<typeof DiscoveryDocument>;

import * as v from 'valibot';

export const RegistrationTimestamps = v.array(v.pipe(v.string(), v.isoTimestamp()));
export type RegistrationTimestamps = v.InferOutput<typeof RegistrationTimestamps>;

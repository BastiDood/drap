import { type InferOutput, boolean, date, instance, object, pipe, string, uuid } from 'valibot';
import { User } from './user';

const CommonSchema = object({
  session_id: pipe(string(), uuid()),
  expiration: date(),
});

export const Pending = object({
  ...CommonSchema.entries,
  nonce: instance(Uint8Array),
  has_extended_scope: boolean(),
});

export const Session = object({ ...CommonSchema.entries, email: User.entries.email });

export type Pending = InferOutput<typeof Pending>;
export type Session = InferOutput<typeof Session>;

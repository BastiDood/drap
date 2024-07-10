import { type InferOutput, boolean, date, instance, object, pipe, string, uuid } from 'valibot';
import { User } from '$lib/models/user';

const CommonSchema = object({
    session_id: pipe(string(), uuid()),
    expiration: date(),
});

export const Pending = object({ ...CommonSchema.entries, nonce: instance(Uint8Array), is_new_sender: boolean() });
export type Pending = InferOutput<typeof Pending>;

export const Session = object({ ...CommonSchema.entries, email: User.entries.email });
export type Session = InferOutput<typeof Session>;

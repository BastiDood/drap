import { type InferOutput, instance, number, object, pipe, string, transform, union, uuid } from 'valibot';
import { User } from '$lib/models/user';

const CommonSchema = object({
    session_id: pipe(string(), uuid()),
    expiration: pipe(
        union([number(), string()]),
        transform(input => new Date(input)),
    ),
});

export const Pending = object({ ...CommonSchema.entries, nonce: instance(Uint8Array) });
export type Pending = InferOutput<typeof Pending>;

export const Session = object({ ...CommonSchema.entries, user_id: User.entries.user_id });
export type Session = InferOutput<typeof Session>;

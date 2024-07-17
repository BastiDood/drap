import { type InferOutput, date, maxLength, object, pipe, string } from 'valibot';
import { User } from '$lib/models/user';

export const CandidateSender = object({
    expiration: date(),
    email: User.entries.email,
    access_token: pipe(string(), maxLength(2048)),
    refresh_token: pipe(string(), maxLength(512)),
});

export type CandidateSender = InferOutput<typeof CandidateSender>;

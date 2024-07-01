import {
    type InferOutput,
    bigint,
    maxLength,
    minLength,
    nullable,
    object,
    pipe,
    string,
    transform,
    unknown,
    url,
} from 'valibot';

export const User = object({
    student_number: nullable(bigint()),
    is_admin: pipe(unknown(), transform(Boolean)),
    email: string(),
    user_id: pipe(string(), minLength(1), maxLength(255)),
    given_name: string(),
    family_name: string(),
    avatar: pipe(string(), url()),
});

export type User = InferOutput<typeof User>;

import { type InferOutput, date, nullable, object, string } from "valibot";


export const DesignatedSender = object({
    expiration: date(),
    email: string(),
    access_token: string(),
    refresh_token: nullable(string()),
});

export const EmailerCredentails = object({
    user_id: string(),
    email: string(),
    access_token: string(),
    refresh_token: nullable(string()),
});

export type DesignatedSender = InferOutput<typeof DesignatedSender>;
export type EmailerCredentials = InferOutput<typeof EmailerCredentails>;
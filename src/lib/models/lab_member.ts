import { type InferOutput, minLength, number, object, pipe, string } from "valibot";

export const LabMember = object({
    lab_id: number(),
    member_id: pipe(string(), minLength(1), minLength(255)),
})

export type LabMember = InferOutput<typeof LabMember>
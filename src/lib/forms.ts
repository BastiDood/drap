import { email, pipe, safeParse, string } from 'valibot';
import { error } from '@sveltejs/kit';

export function validateString(param: FormDataEntryValue | null) {
  if (param === null || param instanceof File || param.length === 0)
    error(400, 'Expected string paramater.');
  return param;
}

export function validateMaybeEmptyString(param: FormDataEntryValue | null) {
  if (param === null || param instanceof File) error(400, 'Expected string paramater.');
  return param;
}

const emailString = pipe(string(), email());
export function validateEmail(param: FormDataEntryValue | null) {
  const email = validateString(param);
  const result = safeParse(emailString, email);
  if (result.success) return result.output;
  error(400, 'Expected email parameter.');
}

export function maybeValidateBigInt(param: FormDataEntryValue | null) {
  if (param instanceof File) error(400, 'Expected BigInt parameter.');
  if (param === null || param.length === 0) return null;
  return BigInt(param);
}

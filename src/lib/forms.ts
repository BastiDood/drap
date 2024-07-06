import { error } from '@sveltejs/kit';

export function validateString(param: FormDataEntryValue | null) {
    if (param === null || param instanceof File) error(400);
    return param;
}

export function maybeValidateBigInt(param: FormDataEntryValue | null) {
    if (param instanceof File) error(400);
    if (param === null || param.length === 0) return null;
    return BigInt(param);
}

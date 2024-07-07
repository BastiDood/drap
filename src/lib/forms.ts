import { error } from '@sveltejs/kit';

export function validateString(param: FormDataEntryValue | null) {
    if (param === null || param instanceof File || param.length === 0) error(400, 'expected string paramater');
    return param;
}

export function maybeValidateBigInt(param: FormDataEntryValue | null) {
    if (param instanceof File) error(400, 'expected bigint parameter');
    if (param === null || param.length === 0) return null;
    return BigInt(param);
}

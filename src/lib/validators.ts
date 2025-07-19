export function validateBigInt(text: string) {
  try {
    return BigInt(text);
  } catch (err) {
    if (err instanceof SyntaxError) return null;
    throw err;
  }
}

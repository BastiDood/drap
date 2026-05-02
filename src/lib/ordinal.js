export class UnexpectedOrdinalSuffixError extends Error {
  constructor() {
    super('unexpected plural category for en-US ordinal');
    this.name = 'UnexpectedOrdinalSuffixError';
  }
}

const ORDINAL_RULES = new Intl.PluralRules('en-US', { type: 'ordinal' });

/**
 * @see https://en.wikipedia.org/wiki/Ordinal_indicator#English
 * @param {number} ordinal
 */
export function getOrdinalSuffix(ordinal) {
  switch (ORDINAL_RULES.select(ordinal)) {
    case 'one':
      return 'st';
    case 'two':
      return 'nd';
    case 'few':
      return 'rd';
    case 'other':
      return 'th';
    default:
      throw new UnexpectedOrdinalSuffixError();
  }
}

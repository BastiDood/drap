/**
 * @see https://en.wikipedia.org/wiki/Ordinal_indicator#English
 * @param {number} ordinal
 */
export function getOrdinalSuffix(ordinal) {
  switch (ordinal % 100) {
    case 11:
    case 12:
    case 13:
      return 'th';
    default:
      break;
  }
  switch (ordinal % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

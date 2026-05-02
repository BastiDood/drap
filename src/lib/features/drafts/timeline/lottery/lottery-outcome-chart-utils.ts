/**
 * Converts a preference rank (or null for "Not Preferred") into a CSS-identifier-safe
 * chart config key. Chart config keys flow directly into CSS custom property names via
 * `chart-style.svelte` as `--color-${key}`, so they must never contain whitespace or
 * other characters that are invalid in CSS custom property names.
 */
export function keyForRank(rank: number | null): string {
  return rank === null ? 'not-preferred' : `rank-${rank}`;
}

/** Formats a diopter value with an explicit sign and 2 decimal places, e.g. "+1.50", "-0.75". */
export function formatDiopter(value: number): string {
  const clean = Object.is(value, -0) ? 0 : value;
  const sign = clean < 0 ? '' : '+';
  return `${sign}${clean.toFixed(2)}`;
}

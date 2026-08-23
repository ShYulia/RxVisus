/** Formats a prism-diopter magnitude, e.g. "1.50Δ". Base direction (BI/BO/BU/BD) is appended by the caller. */
export function formatPrismDiopters(value: number): string {
  return `${value.toFixed(2)}Δ`;
}

/** Formats a decentration magnitude in mm, e.g. "2.0 mm". Direction (IN/OUT/UP/DOWN) is appended by the caller. */
export function formatDecentrationMm(value: number): string {
  return `${value.toFixed(1)} mm`;
}

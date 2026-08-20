export interface Prescription {
  sphere: number;
  cylinder: number;
  /** 1-180, standard optical notation */
  axis: number;
}

function normalizeAxis(axis: number): number {
  const wrapped = axis % 180;
  return wrapped <= 0 ? wrapped + 180 : wrapped;
}

/** Fixes float noise (e.g. 0.1 + 0.2) without imposing a clinical rounding rule. */
function cleanFloat(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** Converts a prescription between plus-cylinder and minus-cylinder form. */
export function transpose(rx: Prescription): Prescription {
  return {
    sphere: cleanFloat(rx.sphere + rx.cylinder),
    cylinder: cleanFloat(-rx.cylinder),
    axis: normalizeAxis(rx.axis + 90),
  };
}

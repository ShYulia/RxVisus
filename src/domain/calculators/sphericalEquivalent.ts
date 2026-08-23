export interface SphericalEquivalentInput {
  sphere: number;
  cylinder: number;
}

/**
 * Spherical equivalent: SE = SPH + (CYL / 2). Axis is irrelevant — it doesn't
 * affect the equivalent sphere power, only where the cylinder's power sits.
 */
export function calculateSphericalEquivalent(input: SphericalEquivalentInput): number {
  return input.sphere + input.cylinder / 2;
}

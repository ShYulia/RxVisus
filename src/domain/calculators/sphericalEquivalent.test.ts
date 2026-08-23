import { describe, expect, it } from 'vitest';
import { calculateSphericalEquivalent } from './sphericalEquivalent';

describe('calculateSphericalEquivalent', () => {
  it('computes the worked example: SPH -4.00, CYL -1.50 -> -4.75', () => {
    expect(calculateSphericalEquivalent({ sphere: -4.0, cylinder: -1.5 })).toBeCloseTo(-4.75);
  });

  it('is unaffected by axis (axis is not part of the input at all)', () => {
    // Nothing to assert beyond the type signature — SphericalEquivalentInput has no axis field.
    expect(calculateSphericalEquivalent({ sphere: -2, cylinder: -1 })).toBeCloseTo(-2.5);
  });

  it('returns the sphere unchanged for a spherical-only Rx (cylinder = 0)', () => {
    expect(calculateSphericalEquivalent({ sphere: -3.25, cylinder: 0 })).toBeCloseTo(-3.25);
  });

  it('handles a plus-cylinder Rx', () => {
    expect(calculateSphericalEquivalent({ sphere: -5, cylinder: 2 })).toBeCloseTo(-4);
  });

  it('handles plano sphere with a cylinder', () => {
    expect(calculateSphericalEquivalent({ sphere: 0, cylinder: -1 })).toBeCloseTo(-0.5);
  });
});

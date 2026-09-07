import { describe, expect, it } from 'vitest';
import { checkHorizontalDirectionConsistency } from './consistencyChecks';
import type { PrismMeasurement } from './prismMeasurement';

describe('checkHorizontalDirectionConsistency', () => {
  it('flags eso measured as BI', () => {
    const measurement: PrismMeasurement = { horizontal: { amount: 6, base: 'BI', eye: 'OD' } };
    const warning = checkHorizontalDirectionConsistency('eso', measurement);
    expect(warning).not.toBeNull();
    expect(warning?.findingLabel).toBe('Eso');
    expect(warning?.measuredLabel).toBe('6.00Δ BI');
  });

  it('flags exo measured as BO', () => {
    const measurement: PrismMeasurement = { horizontal: { amount: 4, base: 'BO', eye: 'OD' } };
    const warning = checkHorizontalDirectionConsistency('exo', measurement);
    expect(warning).not.toBeNull();
    expect(warning?.findingLabel).toBe('Exo');
  });

  it('does not flag eso measured as BO (matches)', () => {
    const measurement: PrismMeasurement = { horizontal: { amount: 6, base: 'BO', eye: 'OD' } };
    expect(checkHorizontalDirectionConsistency('eso', measurement)).toBeNull();
  });

  it('does not flag exo measured as BI (matches)', () => {
    const measurement: PrismMeasurement = { horizontal: { amount: 4, base: 'BI', eye: 'OD' } };
    expect(checkHorizontalDirectionConsistency('exo', measurement)).toBeNull();
  });

  it('is case-insensitive on the direction finding', () => {
    const measurement: PrismMeasurement = { horizontal: { amount: 6, base: 'BI', eye: 'OD' } };
    expect(checkHorizontalDirectionConsistency('Eso', measurement)).not.toBeNull();
  });

  it('returns null when there is no direction finding recorded', () => {
    const measurement: PrismMeasurement = { horizontal: { amount: 6, base: 'BI', eye: 'OD' } };
    expect(checkHorizontalDirectionConsistency(undefined, measurement)).toBeNull();
  });

  it('returns null when the direction is not eso/exo (e.g. vertical/combined)', () => {
    const measurement: PrismMeasurement = { horizontal: { amount: 6, base: 'BI', eye: 'OD' } };
    expect(checkHorizontalDirectionConsistency('vertical', measurement)).toBeNull();
  });

  it('returns null when the measurement has no horizontal component', () => {
    const measurement: PrismMeasurement = { vertical: { amount: 2, base: 'BU', eye: 'OD' } };
    expect(checkHorizontalDirectionConsistency('eso', measurement)).toBeNull();
  });
});

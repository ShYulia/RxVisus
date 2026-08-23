import { describe, expect, it } from 'vitest';
import { formatPrismMeasurement, isMeasurementEmpty, splitPrismEqually, type PrismMeasurement } from './prismMeasurement';

describe('isMeasurementEmpty', () => {
  it('is true when neither component is set', () => {
    expect(isMeasurementEmpty({})).toBe(true);
  });

  it('is false when either component is set', () => {
    expect(isMeasurementEmpty({ horizontal: { amount: 6, base: 'BO' } })).toBe(false);
    expect(isMeasurementEmpty({ vertical: { amount: 2, base: 'BU', eye: 'OD' } })).toBe(false);
  });
});

describe('formatPrismMeasurement', () => {
  it('formats a horizontal-only measurement', () => {
    const m: PrismMeasurement = { horizontal: { amount: 6, base: 'BO' } };
    expect(formatPrismMeasurement(m)).toBe('6.00Δ BO');
  });

  it('formats a vertical-only measurement with eye', () => {
    const m: PrismMeasurement = { vertical: { amount: 2, base: 'BU', eye: 'OD' } };
    expect(formatPrismMeasurement(m)).toBe('2.00Δ BU OD');
  });

  it('formats a combined horizontal + vertical measurement', () => {
    const m: PrismMeasurement = { horizontal: { amount: 6, base: 'BO' }, vertical: { amount: 2, base: 'BD', eye: 'OS' } };
    expect(formatPrismMeasurement(m)).toBe('6.00Δ BO / 2.00Δ BD OS');
  });

  it('returns an empty string for an empty measurement', () => {
    expect(formatPrismMeasurement({})).toBe('');
  });
});

describe('splitPrismEqually', () => {
  it('splits horizontal evenly with the same base in both eyes', () => {
    const result = splitPrismEqually({ horizontal: { amount: 6, base: 'BO' } });
    expect(result.od.horizontal).toEqual({ amount: 3, base: 'BO' });
    expect(result.os.horizontal).toEqual({ amount: 3, base: 'BO' });
  });

  it('splits vertical evenly with opposite bases, measured eye keeps its base', () => {
    // 6Δ BU OS -> 3Δ BD OD + 3Δ BU OS
    const result = splitPrismEqually({ vertical: { amount: 6, base: 'BU', eye: 'OS' } });
    expect(result.os.vertical).toEqual({ amount: 3, base: 'BU' });
    expect(result.od.vertical).toEqual({ amount: 3, base: 'BD' });
  });

  it('splits vertical measured over OD symmetrically', () => {
    const result = splitPrismEqually({ vertical: { amount: 4, base: 'BD', eye: 'OD' } });
    expect(result.od.vertical).toEqual({ amount: 2, base: 'BD' });
    expect(result.os.vertical).toEqual({ amount: 2, base: 'BU' });
  });

  it('splits a combined horizontal + vertical measurement independently', () => {
    const result = splitPrismEqually({ horizontal: { amount: 6, base: 'BO' }, vertical: { amount: 6, base: 'BU', eye: 'OS' } });
    expect(result.od).toEqual({ horizontal: { amount: 3, base: 'BO' }, vertical: { amount: 3, base: 'BD' } });
    expect(result.os).toEqual({ horizontal: { amount: 3, base: 'BO' }, vertical: { amount: 3, base: 'BU' } });
  });

  it('omits a component from both eyes when not measured', () => {
    const result = splitPrismEqually({ horizontal: { amount: 6, base: 'BI' } });
    expect(result.od.vertical).toBeUndefined();
    expect(result.os.vertical).toBeUndefined();
  });
});

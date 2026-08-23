import { describe, expect, it } from 'vitest';
import { formatPrismMeasurement, isMeasurementEmpty, type PrismMeasurement } from './prismMeasurement';

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

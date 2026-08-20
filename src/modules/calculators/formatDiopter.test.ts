import { describe, expect, it } from 'vitest';
import { formatDiopter, formatRx, formatSphere, parseSphereInput } from './formatDiopter';

describe('parseSphereInput', () => {
  it('parses "Pln" (any case) as 0', () => {
    expect(parseSphereInput('Pln')).toBe(0);
    expect(parseSphereInput('pln')).toBe(0);
    expect(parseSphereInput('PLN')).toBe(0);
    expect(parseSphereInput('  Pln  ')).toBe(0);
  });

  it('falls back to numeric parsing for everything else', () => {
    expect(parseSphereInput('-4.00')).toBe(-4);
    expect(parseSphereInput('+1.50')).toBe(1.5);
    expect(Number.isNaN(parseSphereInput(''))).toBe(true);
    expect(Number.isNaN(parseSphereInput('plano'))).toBe(true);
  });
});

describe('formatSphere', () => {
  it('shows "Pln" for a zero sphere', () => {
    expect(formatSphere(0)).toBe('Pln');
    expect(formatSphere(-0)).toBe('Pln');
  });

  it('formats non-zero spheres normally', () => {
    expect(formatSphere(-4)).toBe('-4.00');
    expect(formatSphere(1.5)).toBe('+1.50');
  });
});

describe('formatRx', () => {
  it('uses "Pln" for a plano sphere but keeps normal cylinder formatting', () => {
    expect(formatRx({ sphere: 0, cylinder: -1.5, axis: 90 })).toBe('Pln / -1.50 x 90');
  });

  it('omits the "/ CYL x AXIS" tail for a spherical-only Rx (cylinder = 0)', () => {
    expect(formatRx({ sphere: -4, cylinder: 0, axis: 180 })).toBe('-4.00');
  });

  it('omits the tail for a plano, spherical-only Rx too', () => {
    expect(formatRx({ sphere: 0, cylinder: 0, axis: 90 })).toBe('Pln');
  });
});

describe('formatDiopter', () => {
  it('keeps "+0.00" for a generic (non-sphere-labeled) zero value', () => {
    expect(formatDiopter(0)).toBe('+0.00');
  });
});

import { describe, expect, it } from 'vitest';
import { isValidVisualAcuity } from './visualAcuity';

describe('isValidVisualAcuity', () => {
  it('accepts metric Snellen fractions', () => {
    expect(isValidVisualAcuity('6/6')).toBe(true);
    expect(isValidVisualAcuity('6/7.5')).toBe(true);
    expect(isValidVisualAcuity('6/9')).toBe(true);
    expect(isValidVisualAcuity('6/12')).toBe(true);
    expect(isValidVisualAcuity('6/60')).toBe(true);
  });

  it('accepts imperial Snellen fractions too — not a metric-only whitelist', () => {
    expect(isValidVisualAcuity('20/20')).toBe(true);
    expect(isValidVisualAcuity('20/40')).toBe(true);
  });

  it('accepts a Snellen denominator outside the standard chart-line set — validates notation, not a fixed whitelist', () => {
    expect(isValidVisualAcuity('6/11')).toBe(true);
    expect(isValidVisualAcuity('6/1000')).toBe(true);
  });

  it('tolerates whitespace around the slash', () => {
    expect(isValidVisualAcuity('6 / 6')).toBe(true);
  });

  it('accepts decimal VA', () => {
    expect(isValidVisualAcuity('1.0')).toBe(true);
    expect(isValidVisualAcuity('0.8')).toBe(true);
    expect(isValidVisualAcuity('0.5')).toBe(true);
    expect(isValidVisualAcuity('0.05')).toBe(true);
  });

  it('accepts low-vision notation, case-insensitively', () => {
    expect(isValidVisualAcuity('CF')).toBe(true);
    expect(isValidVisualAcuity('cf')).toBe(true);
    expect(isValidVisualAcuity('HM')).toBe(true);
    expect(isValidVisualAcuity('LP')).toBe(true);
    expect(isValidVisualAcuity('NLP')).toBe(true);
    expect(isValidVisualAcuity('nlp')).toBe(true);
  });

  it('accepts low-vision notation with a trailing qualifier', () => {
    expect(isValidVisualAcuity('CF at 1m')).toBe(true);
    expect(isValidVisualAcuity('HM 2ft')).toBe(true);
  });

  it('rejects a negative value — the known "-2" bug', () => {
    expect(isValidVisualAcuity('-2')).toBe(false);
  });

  it('rejects a negative Snellen fraction', () => {
    expect(isValidVisualAcuity('-6/6')).toBe(false);
    expect(isValidVisualAcuity('6/-6')).toBe(false);
  });

  it('rejects a zero Snellen numerator or denominator — not a real fraction', () => {
    expect(isValidVisualAcuity('0/6')).toBe(false);
    expect(isValidVisualAcuity('6/0')).toBe(false);
  });

  it('rejects zero decimal VA', () => {
    expect(isValidVisualAcuity('0')).toBe(false);
    expect(isValidVisualAcuity('0.0')).toBe(false);
  });

  it('rejects malformed/unrelated free text', () => {
    expect(isValidVisualAcuity('abc')).toBe(false);
    expect(isValidVisualAcuity('normal')).toBe(false);
    expect(isValidVisualAcuity('6/6/6')).toBe(false);
    expect(isValidVisualAcuity('6.0.0')).toBe(false);
    expect(isValidVisualAcuity('CFat1m')).toBe(false); // no word boundary after CF — rejected rather than guessed
  });

  it('rejects a blank/whitespace-only string — blank is a separate required-field concern, not valid notation', () => {
    expect(isValidVisualAcuity('')).toBe(false);
    expect(isValidVisualAcuity('   ')).toBe(false);
  });

  it('rejects non-finite results (e.g. an absurdly long digit string that would overflow to Infinity)', () => {
    expect(isValidVisualAcuity('1'.repeat(400))).toBe(false);
    expect(isValidVisualAcuity(`6/${'9'.repeat(400)}`)).toBe(false);
  });
});

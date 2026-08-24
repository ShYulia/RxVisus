import { describe, expect, it } from 'vitest';
import { evaluateSheardFor } from './binocularSheard';

describe('evaluateSheardFor', () => {
  it('is not applicable when phoria is ortho', () => {
    expect(evaluateSheardFor({ type: 'ortho' }, { bo: { break: 20 } }).applicable).toBe(false);
  });

  it('is not applicable when the compensating vergence direction was not measured', () => {
    expect(evaluateSheardFor({ type: 'exo', amount: 6 }, { bi: { break: 10 } }).applicable).toBe(false);
    expect(evaluateSheardFor({ type: 'exo', amount: 6 }, undefined).applicable).toBe(false);
  });

  it('uses BO as the compensating direction for exophoria, BI for esophoria', () => {
    expect(evaluateSheardFor({ type: 'exo', amount: 6 }, { bo: { break: 20 } }).compensatingDirection).toBe('bo');
    expect(evaluateSheardFor({ type: 'eso', amount: 6 }, { bi: { break: 20 } }).compensatingDirection).toBe('bi');
  });

  it('prefers blur over break when both are recorded', () => {
    const result = evaluateSheardFor({ type: 'exo', amount: 6 }, { bo: { blur: 14, break: 20 } });
    expect(result.reserveSource).toBe('blur');
    expect(result.reserveUsed).toBe(14);
  });

  it('falls back to break when blur was not recorded', () => {
    const result = evaluateSheardFor({ type: 'exo', amount: 6 }, { bo: { break: 20 } });
    expect(result.reserveSource).toBe('break');
    expect(result.reserveUsed).toBe(20);
  });

  it('passes when reserve is at least 2x the phoria', () => {
    const result = evaluateSheardFor({ type: 'exo', amount: 6 }, { bo: { break: 12 } });
    expect(result.pass).toBe(true);
  });

  it('fails when reserve is below 2x the phoria', () => {
    const result = evaluateSheardFor({ type: 'exo', amount: 6 }, { bo: { break: 10 } });
    expect(result.pass).toBe(false);
  });
});

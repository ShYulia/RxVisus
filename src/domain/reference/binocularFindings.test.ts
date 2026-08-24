import { describe, expect, it } from 'vitest';
import { parseBinocularFindings } from './binocularFindings';

describe('parseBinocularFindings', () => {
  it('returns an empty-ish shape for no data', () => {
    const data = parseBinocularFindings({});
    expect(data.symptoms.size).toBe(0);
    expect(data.distancePhoria).toBeUndefined();
    expect(data.nearPhoria).toBeUndefined();
    expect(data.npcBreakCm).toBeUndefined();
  });

  it('parses symptoms from a comma-joined list', () => {
    const data = parseBinocularFindings({ symptoms: 'nearStrain,headache' });
    expect(data.symptoms.has('nearStrain')).toBe(true);
    expect(data.symptoms.has('headache')).toBe(true);
    expect(data.symptoms.has('diplopia')).toBe(false);
  });

  it('parses a phoria with amount', () => {
    const data = parseBinocularFindings({ 'nearPhoria.type': 'exo', 'nearPhoria.amount': '10' });
    expect(data.nearPhoria).toEqual({ type: 'exo', amount: 10 });
  });

  it('treats ortho as having no amount even if one was somehow recorded', () => {
    const data = parseBinocularFindings({ 'nearPhoria.type': 'ortho', 'nearPhoria.amount': '2' });
    expect(data.nearPhoria).toEqual({ type: 'ortho', amount: undefined });
  });

  it('parses NPC break/recovery', () => {
    const data = parseBinocularFindings({ 'npc.break': '8', 'npc.recovery': '12' });
    expect(data.npcBreakCm).toBe(8);
    expect(data.npcRecoveryCm).toBe(12);
  });

  it('parses MAF with OD/OS/difficulty', () => {
    const data = parseBinocularFindings({ 'maf.OD': '5', 'maf.OS': '6', 'maf.difficulty': 'minus' });
    expect(data.maf).toEqual({ od: 5, os: 6, difficulty: 'minus' });
  });

  it('parses grouped fusional vergence fields', () => {
    const data = parseBinocularFindings({
      'nearVergence.bi.break': '10',
      'nearVergence.bo.blur': '14',
      'nearVergence.bo.break': '20',
      'nearVergence.bo.recovery': '10',
    });
    expect(data.nearVergence?.bi).toEqual({ blur: undefined, blurAbsent: false, break: 10, recovery: undefined });
    expect(data.nearVergence?.bo).toEqual({ blur: 14, blurAbsent: false, break: 20, recovery: 10 });
  });

  it('marks blur as explicitly absent (e.g. "No blur" entered) without treating it as missing data', () => {
    const data = parseBinocularFindings({
      'nearVergence.bi.blur': 'none',
      'nearVergence.bi.break': '18',
      'nearVergence.bi.recovery': '12',
    });
    expect(data.nearVergence?.bi).toEqual({ blur: undefined, blurAbsent: true, break: 18, recovery: 12 });
  });

  it('leaves vergence undefined when no fields are present', () => {
    const data = parseBinocularFindings({});
    expect(data.nearVergence).toBeUndefined();
    expect(data.distanceVergence).toBeUndefined();
  });

  it('parses entryMode and diplopiaNew', () => {
    expect(parseBinocularFindings({ entryMode: 'quick' }).entryMode).toBe('quick');
    expect(parseBinocularFindings({ diplopiaNew: 'yes' }).diplopiaNew).toBe(true);
    expect(parseBinocularFindings({ diplopiaNew: 'no' }).diplopiaNew).toBe(false);
    expect(parseBinocularFindings({}).diplopiaNew).toBeUndefined();
  });

  it('ignores blank strings as if the field were never entered', () => {
    const data = parseBinocularFindings({ 'age.value': '', 'npc.break': '  ' });
    expect(data.age).toBeUndefined();
    expect(data.npcBreakCm).toBeUndefined();
  });
});

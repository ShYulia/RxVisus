import { describe, expect, it } from 'vitest';
import { EXCEEDS_RANGE_VALUE, parseBinocularFindings, parseStrictNumber } from './binocularFindings';

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
    expect(data.nearVergence?.bi).toEqual({ blur: undefined, blurAbsent: false, break: 10, breakExceedsRange: false, recovery: undefined, recoveryExceedsRange: false });
    expect(data.nearVergence?.bo).toEqual({ blur: 14, blurAbsent: false, break: 20, breakExceedsRange: false, recovery: 10, recoveryExceedsRange: false });
  });

  it('marks blur as explicitly absent (e.g. "No blur" entered) without treating it as missing data', () => {
    const data = parseBinocularFindings({
      'nearVergence.bi.blur': 'none',
      'nearVergence.bi.break': '18',
      'nearVergence.bi.recovery': '12',
    });
    expect(data.nearVergence?.bi).toEqual({
      blur: undefined,
      blurAbsent: true,
      break: 18,
      breakExceedsRange: false,
      recovery: 12,
      recoveryExceedsRange: false,
    });
  });

  it('marks break/recovery as explicitly exceeding the testable range (e.g. ">40Δ" on a prism bar) without treating it as missing data or a number', () => {
    const data = parseBinocularFindings({
      'nearVergence.bi.blur': '12',
      'nearVergence.bi.break': EXCEEDS_RANGE_VALUE,
      'nearVergence.bi.recovery': EXCEEDS_RANGE_VALUE,
    });
    expect(data.nearVergence?.bi).toEqual({
      blur: 12,
      blurAbsent: false,
      break: undefined,
      breakExceedsRange: true,
      recovery: undefined,
      recoveryExceedsRange: true,
    });
  });

  it('records a vergence finding as present when only an exceeds-range Break was entered (no blur/recovery)', () => {
    const data = parseBinocularFindings({ 'nearVergence.bo.break': EXCEEDS_RANGE_VALUE });
    expect(data.nearVergence?.bo).toEqual({
      blur: undefined,
      blurAbsent: false,
      break: undefined,
      breakExceedsRange: true,
      recovery: undefined,
      recoveryExceedsRange: false,
    });
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

  it('parses MEM/Nott as structured signed per-eye diopters, not free text', () => {
    const data = parseBinocularFindings({ 'memNott.OD': '0.50', 'memNott.OS': '-0.25' });
    expect(data.memNott).toEqual({ od: 0.5, os: -0.25 });
  });

  it('leaves MEM/Nott undefined when neither eye was recorded, and allows one eye alone', () => {
    expect(parseBinocularFindings({}).memNott).toBeUndefined();
    expect(parseBinocularFindings({ 'memNott.OD': '0.50' }).memNott).toEqual({ od: 0.5, os: undefined });
  });

  it('ignores blank strings as if the field were never entered', () => {
    const data = parseBinocularFindings({ 'age.value': '', 'npc.break': '  ' });
    expect(data.age).toBeUndefined();
    expect(data.npcBreakCm).toBeUndefined();
  });
});

describe('parseStrictNumber', () => {
  it('parses a clean number', () => {
    expect(parseStrictNumber('6')).toBe(6);
    expect(parseStrictNumber('-1.5')).toBe(-1.5);
    expect(parseStrictNumber('  8  ')).toBe(8);
  });

  it('returns undefined for blank/whitespace-only input, never 0', () => {
    expect(parseStrictNumber('')).toBeUndefined();
    expect(parseStrictNumber('   ')).toBeUndefined();
  });

  it('rejects trailing garbage that parseFloat would silently accept, unlike a lenient parse', () => {
    // parseFloat('6cm') === 6 — this must NOT happen here, since entered-but-unparseable text
    // must never be silently misread as a clean value.
    expect(parseStrictNumber('6cm')).toBeUndefined();
    expect(parseStrictNumber('TTN')).toBeUndefined();
    expect(parseStrictNumber('>40')).toBeUndefined();
    expect(parseStrictNumber('12/20')).toBeUndefined();
  });
});

describe('parseBinocularFindings — entered-but-unparseable text is never silently reinterpreted as a clean value', () => {
  it('a non-numeric NPC break is treated the same as missing, not as a parsed number (defense in depth — the entry form itself now blocks this text before it can reach here)', () => {
    const data = parseBinocularFindings({ 'npc.break': '6cm' });
    expect(data.npcBreakCm).toBeUndefined();
  });
});

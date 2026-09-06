import { describe, expect, it } from 'vitest';
import { parseBinocularFindings } from './binocularFindings';
import { evaluateBinocularPatterns } from './binocularPatterns';
import { evaluateQuickScreen } from './binocularQuickScreen';
import { evaluateNearSheard } from './binocularSheard';

/**
 * The seven CTS regression cases from the clinical-logic review sessions. Each encodes a full
 * patient's recordedFindings (the exact key scheme binocularFindings.ts expects) and checks both
 * Quick Screen (must never diagnose) and Full Assessment's suggested patterns together. Full
 * Assessment suggests patterns transparently — no confidence tier, no "primary"/"mixed" pick
 * between simultaneous suggestions — so these cases assert which patterns are suggested and
 * which specific findings support each, not a synthesized confidence label.
 */

const CASE_1_NORMAL = {
  'age.value': '25',
  symptoms: 'none',
  'distancePhoria.type': 'ortho',
  'nearPhoria.type': 'exo',
  'nearPhoria.amount': '4',
  'npc.break': '6',
  'npc.recovery': '10',
  'maf.OD': '12',
  'maf.OS': '12',
  'maf.difficulty': 'neither',
  'nearVergence.bi.blur': '12',
  'nearVergence.bi.break': '18',
  'nearVergence.bi.recovery': '12',
  'nearVergence.bo.blur': '18',
  'nearVergence.bo.break': '24',
  'nearVergence.bo.recovery': '16',
  'aa.OD': '12',
  'aa.OS': '12',
  'baf.cyclesPerMin': '12',
  'baf.difficulty': 'neither',
};

const CASE_2_CI = {
  'age.value': '24',
  symptoms: 'nearStrain,headache,readingDifficulty',
  'distancePhoria.type': 'exo',
  'distancePhoria.amount': '2',
  'nearPhoria.type': 'exo',
  'nearPhoria.amount': '12',
  'npc.break': '12',
  'npc.recovery': '16',
  'maf.OD': '12',
  'maf.OS': '12',
  'maf.difficulty': 'neither',
  'nearVergence.bi.blur': '10',
  'nearVergence.bi.break': '16',
  'nearVergence.bi.recovery': '10',
  'nearVergence.bo.blur': '8',
  'nearVergence.bo.break': '12',
  'nearVergence.bo.recovery': '6',
  'aa.OD': '12',
  'aa.OS': '12',
  'baf.cyclesPerMin': '12',
  'baf.difficulty': 'neither',
};

const CASE_3_AI = {
  'age.value': '24',
  symptoms: 'nearBlur,nearStrain,slowRefocusNearToDistance',
  'distancePhoria.type': 'exo',
  'distancePhoria.amount': '1',
  'nearPhoria.type': 'exo',
  'nearPhoria.amount': '3',
  'npc.break': '5',
  'npc.recovery': '7',
  'maf.OD': '5',
  'maf.OS': '5',
  'maf.difficulty': 'minus',
  'nearVergence.bi.blur': '12',
  'nearVergence.bi.break': '18',
  'nearVergence.bi.recovery': '12',
  'nearVergence.bo.blur': '18',
  'nearVergence.bo.break': '24',
  'nearVergence.bo.recovery': '16',
  'aa.OD': '7',
  'aa.OS': '7',
  'baf.cyclesPerMin': '5',
  'baf.difficulty': 'minus',
};

const CASE_4_CE = {
  'age.value': '26',
  symptoms: 'nearStrain,headache,readingDifficulty',
  'distancePhoria.type': 'eso',
  'distancePhoria.amount': '1',
  'nearPhoria.type': 'eso',
  'nearPhoria.amount': '10',
  'npc.break': '4',
  'npc.recovery': '6',
  'maf.OD': '12',
  'maf.OS': '12',
  'maf.difficulty': 'neither',
  'nearVergence.bi.blur': '4',
  'nearVergence.bi.break': '8',
  'nearVergence.bi.recovery': '4',
  'nearVergence.bo.blur': '18',
  'nearVergence.bo.break': '24',
  'nearVergence.bo.recovery': '16',
  'aa.OD': '11',
  'aa.OS': '11',
  'baf.cyclesPerMin': '12',
  'baf.difficulty': 'neither',
};

const CASE_5_AE = {
  'age.value': '23',
  symptoms: 'nearBlur,nearStrain,slowRefocusNearToDistance',
  'distancePhoria.type': 'exo',
  'distancePhoria.amount': '1',
  'nearPhoria.type': 'exo',
  'nearPhoria.amount': '2',
  'npc.break': '5',
  'npc.recovery': '7',
  'maf.OD': '5',
  'maf.OS': '5',
  'maf.difficulty': 'plus',
  'nearVergence.bi.blur': '12',
  'nearVergence.bi.break': '18',
  'nearVergence.bi.recovery': '12',
  'nearVergence.bo.blur': '18',
  'nearVergence.bo.break': '24',
  'nearVergence.bo.recovery': '16',
  'aa.OD': '11',
  'aa.OS': '11',
  'baf.cyclesPerMin': '5',
  'baf.difficulty': 'plus',
};

// 19-year-old patient reviewed during the AI-confidence CTS follow-up: bilateral reduced AA
// with normal MAF/BAF does NOT by itself suggest Accommodative Insufficiency — a second,
// independent corroborating sign is required (see checkAccommodativeInsufficiency) — while the
// independently-supported Convergence Insufficiency finding is still reported normally.
const CASE_6_CI_WITH_AI = {
  'age.value': '19',
  symptoms: 'nearBlur,headache',
  'distancePhoria.type': 'exo',
  'distancePhoria.amount': '6',
  'nearPhoria.type': 'exo',
  'nearPhoria.amount': '12',
  'npc.break': '6',
  'npc.recovery': '9',
  'nearVergence.bi.blur': '12',
  'nearVergence.bi.break': '18',
  'nearVergence.bi.recovery': '12',
  'nearVergence.bo.blur': '12',
  'nearVergence.bo.break': '18',
  'nearVergence.bo.recovery': '12',
  'aa.OD': '8',
  'aa.OS': '8',
  'maf.OD': '12',
  'maf.OS': '12',
  'maf.difficulty': 'neither',
  'baf.cyclesPerMin': '12',
  'baf.difficulty': 'neither',
};

// Isolated case (no vergence finding at all) proving bilateral reduced AA plus an independent
// accommodative corroborator (minus-side MAF difficulty) is what actually triggers the
// suggestion — contrast with Case 6, where the same AA finding alone did not.
const CASE_7_AI_WITH_FACILITY_CORROBORATION = {
  'age.value': '20',
  'distancePhoria.type': 'ortho',
  'nearPhoria.type': 'ortho',
  'aa.OD': '5',
  'aa.OS': '5',
  'maf.OD': '5',
  'maf.OS': '5',
  'maf.difficulty': 'minus',
};

describe('CTS regression — Case 1: normal / well-compensated', () => {
  const data = parseBinocularFindings(CASE_1_NORMAL);

  it('Quick Screen does not recommend further assessment and never mentions CI', () => {
    const screen = evaluateQuickScreen(data);
    expect(screen.recommendFullAssessment).toBe(false);
    expect(screen.objectiveReasons).toEqual([]);
    expect(screen.symptomReasons).toEqual([]);
  });

  it('Full Assessment suggests no pattern', () => {
    expect(evaluateBinocularPatterns(data)).toEqual([]);
  });
});

describe('CTS regression — Case 2: Convergence Insufficiency', () => {
  const data = parseBinocularFindings(CASE_2_CI);

  it('Quick Screen recommends further assessment with reasons, without diagnosing CI', () => {
    const screen = evaluateQuickScreen(data);
    expect(screen.recommendFullAssessment).toBe(true);
    expect(screen.objectiveReasons.join(' ')).not.toMatch(/convergence insufficiency/i);
  });

  it('Full Assessment suggests Convergence Insufficiency, with the right supporting findings, and nothing else', () => {
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.map((p) => p.id)).toEqual(['ci']);
    const ci = patterns.find((p) => p.id === 'ci');
    expect(ci?.supportingFindings.some((f) => /near exophoria.*greater than distance/i.test(f))).toBe(true);
    expect(ci?.supportingFindings.some((f) => /receded NPC/i.test(f))).toBe(true);
    expect(ci?.supportingFindings.some((f) => /Sheard.*failed.*BO/i.test(f))).toBe(true);
  });

  it('near Sheard uses BO as the compensating reserve for exophoria', () => {
    const sheard = evaluateNearSheard(data);
    expect(sheard.compensatingDirection).toBe('bo');
    expect(sheard.pass).toBe(false);
  });
});

describe('CTS regression — Case 3: Accommodative Insufficiency', () => {
  const data = parseBinocularFindings(CASE_3_AI);

  it('Full Assessment suggests Accommodative Insufficiency with AA, MAF, and BAF all as supporting findings, and nothing else', () => {
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.map((p) => p.id)).toEqual(['ai']);
    const ai = patterns.find((p) => p.id === 'ai');
    expect(ai?.supportingFindings.some((f) => /AA OD.*below age-expected/i.test(f))).toBe(true);
    expect(ai?.supportingFindings.some((f) => /AA OS.*below age-expected/i.test(f))).toBe(true);
    expect(ai?.supportingFindings.some((f) => /MAF/.test(f) && /−2\.00/.test(f))).toBe(true);
    expect(ai?.supportingFindings.some((f) => /BAF/.test(f) && /−2\.00/.test(f))).toBe(true);
  });
});

describe('CTS regression — Case 4: Convergence Excess', () => {
  const data = parseBinocularFindings(CASE_4_CE);

  it('Full Assessment suggests Convergence Excess, using BI (not BO) for Sheard, and nothing else', () => {
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.map((p) => p.id)).toEqual(['ce']);
    const ce = patterns.find((p) => p.id === 'ce');
    expect(ce?.supportingFindings.some((f) => /near esophoria.*greater than distance/i.test(f))).toBe(true);
    expect(ce?.supportingFindings.some((f) => /Sheard.*failed.*BI/i.test(f))).toBe(true);
    expect(ce?.supportingFindings.some((f) => /BO/.test(f))).toBe(false);
  });

  it('distance/near Sheard uses BI as the compensating reserve for esophoria', () => {
    const sheard = evaluateNearSheard(data);
    expect(sheard.compensatingDirection).toBe('bi');
    expect(sheard.pass).toBe(false);
  });
});

describe('CTS regression — Case 5: Accommodative Excess', () => {
  const data = parseBinocularFindings(CASE_5_AE);

  it('Full Assessment suggests Accommodative Excess with MAF and BAF plus-difficulty as supporting findings, normal AA not flagged, and nothing else', () => {
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.map((p) => p.id)).toEqual(['ae']);
    const ae = patterns.find((p) => p.id === 'ae');
    expect(ae?.supportingFindings.some((f) => /MAF/.test(f) && /\+2\.00/.test(f))).toBe(true);
    expect(ae?.supportingFindings.some((f) => /BAF/.test(f) && /\+2\.00/.test(f))).toBe(true);
  });
});

describe('CTS regression — Case 6: Convergence Insufficiency present, Accommodative Insufficiency NOT suggested without corroboration', () => {
  const data = parseBinocularFindings(CASE_6_CI_WITH_AI);

  it('reports CI only — bilateral reduced AA with normal MAF/BAF is not enough on its own to suggest Accommodative Insufficiency', () => {
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.map((p) => p.id)).toEqual(['ci']);
    expect(patterns.find((p) => p.id === 'ai')).toBeUndefined();
  });

  it('CI itself: phoria-delta and failed near Sheard\'s findings, NPC not receded so not mentioned', () => {
    const ci = evaluateBinocularPatterns(data).find((p) => p.id === 'ci');
    expect(ci?.supportingFindings.some((f) => /near exophoria.*greater than distance/i.test(f))).toBe(true);
    expect(ci?.supportingFindings.some((f) => /Sheard.*failed.*BO/i.test(f))).toBe(true);
    expect(ci?.supportingFindings.some((f) => /NPC/i.test(f))).toBe(false);
  });
});

describe('CTS regression — Case 7: bilateral reduced AA with MAF facility corroboration', () => {
  it('Accommodative Insufficiency is suggested once MAF corroboration is actually found', () => {
    const data = parseBinocularFindings(CASE_7_AI_WITH_FACILITY_CORROBORATION);
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.map((p) => p.id)).toEqual(['ai']);
    const ai = patterns.find((p) => p.id === 'ai');
    expect(ai?.supportingFindings.some((f) => /MAF/.test(f) && /−2\.00/.test(f))).toBe(true);
  });
});

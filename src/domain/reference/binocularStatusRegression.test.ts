import { describe, expect, it } from 'vitest';
import { parseBinocularFindings } from './binocularFindings';
import { interpretBinocularAssessment } from './binocularPatterns';
import { evaluateQuickScreen } from './binocularQuickScreen';
import { evaluateNearSheard } from './binocularSheard';

/**
 * The five CTS regression cases from the clinical-logic review session. Each encodes a full
 * patient's recordedFindings (the exact key scheme binocularFindings.ts expects) and checks
 * both Quick Screen (must never diagnose) and the Full Assessment interpretation together.
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

describe('CTS regression — Case 1: normal / well-compensated', () => {
  const data = parseBinocularFindings(CASE_1_NORMAL);

  it('Quick Screen does not recommend further assessment and never mentions CI', () => {
    const screen = evaluateQuickScreen(data);
    expect(screen.recommendFullAssessment).toBe(false);
    expect(screen.objectiveReasons).toEqual([]);
    expect(screen.symptomReasons).toEqual([]);
  });

  it('Full Assessment finds no pattern, with the short (no-symptoms) headline', () => {
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('no-pattern');
    expect(result.headline).toBe('No significant binocular or accommodative dysfunction demonstrated.');
    expect(result.patterns.find((p) => p.id === 'ci')).toBeUndefined();
    expect(result.patterns.find((p) => p.id === 'basic-exo')).toBeUndefined();
  });
});

describe('CTS regression — Case 2: Convergence Insufficiency', () => {
  const data = parseBinocularFindings(CASE_2_CI);

  it('Quick Screen recommends further assessment with reasons, without diagnosing CI', () => {
    const screen = evaluateQuickScreen(data);
    expect(screen.recommendFullAssessment).toBe(true);
    expect(screen.objectiveReasons.join(' ')).not.toMatch(/convergence insufficiency/i);
  });

  it('Full Assessment finds Convergence Insufficiency, consistent, with the right supporting findings', () => {
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('pattern');
    const ci = result.patterns.find((p) => p.id === 'ci');
    expect(ci).toBeDefined();
    expect(ci?.confidence).toBe('consistent');
    expect(ci?.supportingFindings.some((f) => /near exophoria.*greater than distance/i.test(f))).toBe(true);
    expect(ci?.supportingFindings.some((f) => /receded NPC/i.test(f))).toBe(true);
    expect(ci?.supportingFindings.some((f) => /Sheard.*failed.*BO/i.test(f))).toBe(true);
    expect(result.patterns.find((p) => p.id === 'basic-exo')).toBeUndefined();
    expect(result.patterns.find((p) => p.id === 'ai' || p.id === 'ae' || p.id === 'ainfac')).toBeUndefined();
  });

  it('near Sheard uses BO as the compensating reserve for exophoria', () => {
    const sheard = evaluateNearSheard(data);
    expect(sheard.compensatingDirection).toBe('bo');
    expect(sheard.pass).toBe(false);
  });
});

describe('CTS regression — Case 3: Accommodative Insufficiency', () => {
  const data = parseBinocularFindings(CASE_3_AI);

  it('Full Assessment finds Accommodative Insufficiency with AA, MAF, and BAF all as supporting evidence', () => {
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('pattern');
    const ai = result.patterns.find((p) => p.id === 'ai');
    expect(ai).toBeDefined();
    expect(ai?.confidence).toBe('consistent');
    expect(ai?.supportingFindings.some((f) => /AA OD.*below age-expected/i.test(f))).toBe(true);
    expect(ai?.supportingFindings.some((f) => /AA OS.*below age-expected/i.test(f))).toBe(true);
    expect(ai?.supportingFindings.some((f) => /MAF/.test(f) && /−2\.00/.test(f))).toBe(true);
    expect(ai?.supportingFindings.some((f) => /BAF/.test(f) && /−2\.00/.test(f))).toBe(true);
  });

  it('does not classify Basic Exophoria or Mixed', () => {
    const result = interpretBinocularAssessment(data);
    expect(result.category).not.toBe('mixed');
    expect(result.patterns.find((p) => p.id === 'basic-exo')).toBeUndefined();
  });
});

describe('CTS regression — Case 4: Convergence Excess', () => {
  const data = parseBinocularFindings(CASE_4_CE);

  it('Full Assessment finds Convergence Excess, consistent, using BI (not BO) for Sheard', () => {
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('pattern');
    const ce = result.patterns.find((p) => p.id === 'ce');
    expect(ce).toBeDefined();
    expect(ce?.confidence).toBe('consistent');
    expect(ce?.supportingFindings.some((f) => /near esophoria.*greater than distance/i.test(f))).toBe(true);
    expect(ce?.supportingFindings.some((f) => /Sheard.*failed.*BI/i.test(f))).toBe(true);
    expect(ce?.supportingFindings.some((f) => /BO/.test(f))).toBe(false);
    expect(result.patterns.find((p) => p.id === 'basic-eso')).toBeUndefined();
    expect(result.patterns.find((p) => p.id === 'ai' || p.id === 'ae' || p.id === 'ainfac')).toBeUndefined();
    expect(result.category).not.toBe('mixed');
  });

  it('distance/near Sheard uses BI as the compensating reserve for esophoria', () => {
    const sheard = evaluateNearSheard(data);
    expect(sheard.compensatingDirection).toBe('bi');
    expect(sheard.pass).toBe(false);
  });
});

describe('CTS regression — Case 5: Accommodative Excess', () => {
  const data = parseBinocularFindings(CASE_5_AE);

  it('Full Assessment finds Accommodative Excess with MAF and BAF plus-difficulty as supporting evidence, normal AA not flagged', () => {
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('pattern');
    const ae = result.patterns.find((p) => p.id === 'ae');
    expect(ae).toBeDefined();
    expect(ae?.confidence).toBe('consistent');
    expect(ae?.supportingFindings.some((f) => /MAF/.test(f) && /\+2\.00/.test(f))).toBe(true);
    expect(ae?.supportingFindings.some((f) => /BAF/.test(f) && /\+2\.00/.test(f))).toBe(true);
    expect(result.patterns.find((p) => p.id === 'ai')).toBeUndefined();
    expect(result.patterns.find((p) => p.id === 'basic-exo')).toBeUndefined();
    expect(result.category).not.toBe('mixed');
  });
});

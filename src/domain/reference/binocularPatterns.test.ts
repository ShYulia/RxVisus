import { describe, expect, it } from 'vitest';
import { evaluateBinocularPatterns, hasCoreBinocularData } from './binocularPatterns';
import { parseBinocularFindings } from './binocularFindings';

describe('evaluateBinocularPatterns', () => {
  it('reports insufficient data when no core data was entered at all', () => {
    const data = parseBinocularFindings({});
    expect(hasCoreBinocularData(data)).toBe(false);
    expect(evaluateBinocularPatterns(data)).toEqual([]);
  });

  it('does not create a pattern from a single abnormal value alone', () => {
    // Only NPC is receded; nothing else recorded (no phoria data at all) — should not
    // fabricate a Convergence Insufficiency claim from this one finding.
    const data = parseBinocularFindings({ 'npc.break': '15' });
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.find((p) => p.id === 'ci')).toBeUndefined();
  });

  it('Convergence Insufficiency requires the near>distance exophoria condition, not just a receded NPC', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
      'npc.break': '12',
      'nearVergence.bo.break': '10',
    });
    const patterns = evaluateBinocularPatterns(data);
    const ci = patterns.find((p) => p.id === 'ci');
    expect(ci).toBeDefined();
    expect(ci?.supportingFindings.some((f) => f.includes('NPC'))).toBe(true);
    expect(ci?.supportingFindings.some((f) => f.includes('Sheard'))).toBe(true);
  });

  it('suppresses the Convergence Insufficiency suggestion when NPC is normal and near Sheard\'s clearly passes, even though the base phoria gap is met', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
      'npc.break': '5', // normal
      'nearVergence.bo.break': '30', // comfortably passes Sheard's
    });
    const patterns = evaluateBinocularPatterns(data);
    // Normal NPC and a passing Sheard's both argue against it -> suppressed entirely.
    expect(patterns.find((p) => p.id === 'ci')).toBeUndefined();
  });

  it('a near/distance exophoria within the similarity margin is Basic Exophoria when the magnitude is clinically notable, not Convergence Insufficiency', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'exo',
      'distancePhoria.amount': '9',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
    });
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.find((p) => p.id === 'basic-exo')).toBeDefined();
    expect(patterns.find((p) => p.id === 'ci')).toBeUndefined();
  });

  it('does NOT suggest Basic Exophoria for a small, well-compensated phoria merely because the patient is symptomatic', () => {
    // 1Δ exo distance + 2-3Δ exo near + normal NPC + good BO reserve + Sheard PASS must not
    // become "Basic Exophoria" just because near symptoms are reported.
    const data = parseBinocularFindings({
      symptoms: 'nearStrain',
      'distancePhoria.type': 'exo',
      'distancePhoria.amount': '1',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '2',
      'npc.break': '5',
      'nearVergence.bo.blur': '18',
      'nearVergence.bo.break': '24',
    });
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.find((p) => p.id === 'basic-exo')).toBeUndefined();
  });

  it('Divergence Insufficiency requires distance eso greater than near', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'eso',
      'distancePhoria.amount': '8',
      'nearPhoria.type': 'ortho',
      'distanceVergence.bi.break': '6',
    });
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.find((p) => p.id === 'di')).toBeDefined();
  });

  it('Fusional Vergence Dysfunction requires near-ortho alignment plus reduced reserves in BOTH directions, not phoria alone', () => {
    const orthoOnly = parseBinocularFindings({ 'nearPhoria.type': 'ortho', 'distancePhoria.type': 'ortho' });
    expect(evaluateBinocularPatterns(orthoOnly).find((p) => p.id === 'fvd')).toBeUndefined();

    const withReducedReserve = parseBinocularFindings({
      'nearPhoria.type': 'ortho',
      'distancePhoria.type': 'ortho',
      'nearVergence.bi.break': '6',
      'nearVergence.bo.break': '10',
    });
    const fvd = evaluateBinocularPatterns(withReducedReserve).find((p) => p.id === 'fvd');
    expect(fvd).toBeDefined();
    expect(fvd?.supportingFindings.some((f) => f.includes('BI'))).toBe(true);
    expect(fvd?.supportingFindings.some((f) => f.includes('BO'))).toBe(true);
  });

  it('Fusional Vergence Dysfunction does NOT trigger from a reduced BI or BO reserve alone — both directions must be reduced', () => {
    const biOnly = parseBinocularFindings({ 'nearPhoria.type': 'ortho', 'distancePhoria.type': 'ortho', 'nearVergence.bi.break': '6' });
    expect(evaluateBinocularPatterns(biOnly).find((p) => p.id === 'fvd')).toBeUndefined();

    const boOnly = parseBinocularFindings({ 'nearPhoria.type': 'ortho', 'distancePhoria.type': 'ortho', 'nearVergence.bo.break': '10' });
    expect(evaluateBinocularPatterns(boOnly).find((p) => p.id === 'fvd')).toBeUndefined();
  });

  it('Accommodative Insufficiency needs age to apply the age-expected minimum, and a second corroborating sign to trigger', () => {
    const withoutAge = parseBinocularFindings({ 'aa.OD': '4', 'aa.OS': '4' });
    expect(evaluateBinocularPatterns(withoutAge).find((p) => p.id === 'ai')).toBeUndefined();

    const withAge = parseBinocularFindings({
      'age.value': '20',
      'aa.OD': '4',
      'aa.OS': '4',
      'distancePhoria.type': 'ortho',
      'maf.difficulty': 'minus',
    });
    expect(evaluateBinocularPatterns(withAge).find((p) => p.id === 'ai')).toBeDefined();
  });

  it('Accommodative Insufficiency triggers off a single low eye plus corroboration, and only reports the eye(s) that were actually low', () => {
    const data = parseBinocularFindings({
      'age.value': '20',
      'aa.OD': '4', // low
      'aa.OS': '12', // normal
      'distancePhoria.type': 'ortho',
      'maf.difficulty': 'minus',
    });
    const ai = evaluateBinocularPatterns(data).find((p) => p.id === 'ai');
    expect(ai).toBeDefined();
    expect(ai?.supportingFindings.some((f) => f.includes('AA OD'))).toBe(true);
    expect(ai?.supportingFindings.some((f) => f.includes('AA OS'))).toBe(false);
  });

  it('Accommodative Insufficiency does NOT trigger from reduced amplitude alone — a second, independent abnormal sign (MAF or BAF) is required', () => {
    const noCorroboration = parseBinocularFindings({
      'age.value': '20',
      'aa.OD': '4',
      'aa.OS': '4',
      'distancePhoria.type': 'ortho',
      'maf.OD': '12',
      'maf.OS': '12',
      'maf.difficulty': 'neither',
      'baf.cyclesPerMin': '12',
      'baf.difficulty': 'neither',
    });
    expect(evaluateBinocularPatterns(noCorroboration).find((p) => p.id === 'ai')).toBeUndefined();

    const withBafOnly = parseBinocularFindings({ 'age.value': '20', 'aa.OD': '4', 'aa.OS': '4', 'distancePhoria.type': 'ortho', 'baf.difficulty': 'both' });
    expect(evaluateBinocularPatterns(withBafOnly).find((p) => p.id === 'ai')).toBeDefined();
  });

  it('Accommodative Excess requires plus-side difficulty on BOTH MAF and BAF — either alone does not trigger', () => {
    const mafOnly = parseBinocularFindings({ symptoms: 'nearBlur,headache', 'distancePhoria.type': 'ortho', 'maf.difficulty': 'plus' });
    expect(evaluateBinocularPatterns(mafOnly).find((p) => p.id === 'ae')).toBeUndefined();

    const both = parseBinocularFindings({ 'distancePhoria.type': 'ortho', 'maf.difficulty': 'plus', 'baf.difficulty': 'plus' });
    const ae = evaluateBinocularPatterns(both).find((p) => p.id === 'ae');
    expect(ae).toBeDefined();
    expect(ae?.supportingFindings.some((f) => f.includes('MAF'))).toBe(true);
    expect(ae?.supportingFindings.some((f) => f.includes('BAF'))).toBe(true);
  });

  it('Accommodative Infacility requires both-direction difficulty on BOTH MAF and BAF — a single test alone does not trigger', () => {
    const mafOnly = parseBinocularFindings({ 'maf.difficulty': 'both', 'distancePhoria.type': 'ortho' });
    expect(evaluateBinocularPatterns(mafOnly).find((p) => p.id === 'ainfac')).toBeUndefined();

    const oneSided = parseBinocularFindings({ 'maf.difficulty': 'minus' });
    expect(evaluateBinocularPatterns(oneSided).find((p) => p.id === 'ainfac')).toBeUndefined();

    const both = parseBinocularFindings({ 'maf.difficulty': 'both', 'baf.difficulty': 'both', 'distancePhoria.type': 'ortho' });
    const ainfac = evaluateBinocularPatterns(both).find((p) => p.id === 'ainfac');
    expect(ainfac).toBeDefined();
    expect(ainfac?.supportingFindings.some((f) => f.includes('MAF'))).toBe(true);
    expect(ainfac?.supportingFindings.some((f) => f.includes('BAF'))).toBe(true);
  });

  it('Convergence Excess: near-specific symptoms are shown as a finding without gating the suggestion', () => {
    const data = parseBinocularFindings({
      symptoms: 'headache,nearBlur',
      'distancePhoria.type': 'eso',
      'distancePhoria.amount': '1',
      'nearPhoria.type': 'eso',
      'nearPhoria.amount': '10',
    });
    const ce = evaluateBinocularPatterns(data).find((p) => p.id === 'ce');
    expect(ce).toBeDefined();
    expect(ce?.supportingFindings.some((f) => /symptoms/i.test(f))).toBe(true);
  });

  it('Convergence Excess: a failed near Sheard\'s (BI) is shown as a finding', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'eso',
      'distancePhoria.amount': '1',
      'nearPhoria.type': 'eso',
      'nearPhoria.amount': '10',
      'nearVergence.bi.break': '8',
    });
    const ce = evaluateBinocularPatterns(data).find((p) => p.id === 'ce');
    expect(ce?.supportingFindings.some((f) => f.includes('Sheard'))).toBe(true);
  });

  it('Convergence Excess: an elevated Gradient AC/A is shown as a finding', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'eso',
      'distancePhoria.amount': '1',
      'nearPhoria.type': 'eso',
      'nearPhoria.amount': '10',
      'acaGradient.value': '8',
    });
    const ce = evaluateBinocularPatterns(data).find((p) => p.id === 'ce');
    expect(ce?.supportingFindings.some((f) => f.includes('AC/A'))).toBe(true);
  });

  it('Basic Exophoria: notable magnitude alone is enough to trigger; a generic symptom is shown but never required', () => {
    const data = parseBinocularFindings({
      symptoms: 'nearStrain',
      'distancePhoria.type': 'exo',
      'distancePhoria.amount': '9',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
    });
    const basicExo = evaluateBinocularPatterns(data).find((p) => p.id === 'basic-exo');
    expect(basicExo).toBeDefined();
    expect(basicExo?.supportingFindings).toContain('Symptomatic');
  });

  it('combines a vergence pattern and an accommodative pattern independently — both appear, neither is picked as primary', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
      'npc.break': '12',
      'age.value': '20',
      'aa.OD': '4',
      'aa.OS': '4',
      'maf.difficulty': 'minus',
    });
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.map((p) => p.id)).toEqual(['ci', 'ai']);
  });

  it('returns every triggered pattern in a fixed order (vergence patterns before accommodative), never reordered by how well-supported each is', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'exo',
      'distancePhoria.amount': '8',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '9',
      'age.value': '20',
      'aa.OD': '4',
      'aa.OS': '4',
      'maf.difficulty': 'minus',
    });
    const patterns = evaluateBinocularPatterns(data);
    expect(patterns.map((p) => p.id)).toEqual(['basic-exo', 'ai']);
  });

  it('returns an empty list when core data is present but nothing meets any pattern\'s trigger', () => {
    const data = parseBinocularFindings({
      symptoms: 'nearStrain',
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'ortho',
      'npc.break': '5',
      'npc.recovery': '8',
      'nearVergence.bi.break': '14',
      'nearVergence.bo.break': '22',
    });
    expect(hasCoreBinocularData(data)).toBe(true);
    expect(evaluateBinocularPatterns(data)).toEqual([]);
  });
});

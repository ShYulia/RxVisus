import { describe, expect, it } from 'vitest';
import { interpretBinocularAssessment } from './binocularPatterns';
import { parseBinocularFindings } from './binocularFindings';

describe('interpretBinocularAssessment', () => {
  it('reports insufficient data when no core data was entered at all', () => {
    const result = interpretBinocularAssessment(parseBinocularFindings({}));
    expect(result.category).toBe('insufficient-data');
  });

  it('does not create a pattern from a single abnormal value alone', () => {
    // Only NPC is receded; nothing else recorded (no phoria data at all) — should not
    // fabricate a Convergence Insufficiency claim from this one finding.
    const data = parseBinocularFindings({ 'npc.break': '15' });
    const result = interpretBinocularAssessment(data);
    expect(result.patterns.find((p) => p.id === 'ci')).toBeUndefined();
  });

  it('Convergence Insufficiency requires the near>distance exophoria condition, not just a receded NPC', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
      'npc.break': '12',
      'nearVergence.bo.break': '10',
    });
    const result = interpretBinocularAssessment(data);
    const ci = result.patterns.find((p) => p.id === 'ci');
    expect(ci).toBeDefined();
    expect(ci?.confidence).toBe('consistent');
    expect(ci?.supportingFindings.some((f) => f.includes('NPC'))).toBe(true);
    expect(ci?.supportingFindings.some((f) => f.includes('Sheard'))).toBe(true);
  });

  it('reports Convergence Insufficiency as only "possible" when the required condition is met but nothing corroborates it', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
      'npc.break': '5', // normal
      'nearVergence.bo.break': '30', // comfortably passes Sheard's
    });
    const result = interpretBinocularAssessment(data);
    const ci = result.patterns.find((p) => p.id === 'ci');
    // Normal NPC and a passing Sheard's both argue against it -> should be suppressed entirely.
    expect(ci).toBeUndefined();
  });

  it('a near/distance exophoria within the similarity margin is Basic Exophoria when the magnitude is clinically notable, not Convergence Insufficiency', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'exo',
      'distancePhoria.amount': '9',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
    });
    const result = interpretBinocularAssessment(data);
    expect(result.patterns.find((p) => p.id === 'basic-exo')).toBeDefined();
    expect(result.patterns.find((p) => p.id === 'ci')).toBeUndefined();
  });

  it('does NOT classify a small, well-compensated phoria as Basic Exophoria merely because the patient is symptomatic', () => {
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
    const result = interpretBinocularAssessment(data);
    expect(result.patterns.find((p) => p.id === 'basic-exo')).toBeUndefined();
  });

  it('Divergence Insufficiency requires distance eso greater than near', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'eso',
      'distancePhoria.amount': '8',
      'nearPhoria.type': 'ortho',
      'distanceVergence.bi.break': '6',
    });
    const result = interpretBinocularAssessment(data);
    expect(result.patterns.find((p) => p.id === 'di')).toBeDefined();
  });

  it('Fusional Vergence Dysfunction requires near-ortho alignment plus a reduced reserve, not phoria alone', () => {
    const orthoOnly = parseBinocularFindings({ 'nearPhoria.type': 'ortho', 'distancePhoria.type': 'ortho' });
    expect(interpretBinocularAssessment(orthoOnly).patterns.find((p) => p.id === 'fvd')).toBeUndefined();

    const withReducedReserve = parseBinocularFindings({
      'nearPhoria.type': 'ortho',
      'distancePhoria.type': 'ortho',
      'nearVergence.bi.break': '6',
      'nearVergence.bo.break': '10',
    });
    const result = interpretBinocularAssessment(withReducedReserve);
    const fvd = result.patterns.find((p) => p.id === 'fvd');
    expect(fvd).toBeDefined();
    expect(fvd?.confidence).toBe('consistent');
  });

  it('Accommodative Insufficiency needs age to apply the age-expected minimum', () => {
    const withoutAge = parseBinocularFindings({ 'aa.OD': '4', 'aa.OS': '4' });
    expect(interpretBinocularAssessment(withoutAge).patterns.find((p) => p.id === 'ai')).toBeUndefined();

    const withAge = parseBinocularFindings({ 'age.value': '20', 'aa.OD': '4', 'aa.OS': '4', 'distancePhoria.type': 'ortho' });
    const result = interpretBinocularAssessment(withAge);
    expect(result.patterns.find((p) => p.id === 'ai')).toBeDefined();
  });

  it('Accommodative Infacility requires difficulty on BOTH plus and minus, not just one side', () => {
    const oneSided = parseBinocularFindings({ 'maf.difficulty': 'minus' });
    expect(interpretBinocularAssessment(oneSided).patterns.find((p) => p.id === 'ainfac')).toBeUndefined();

    const bothSides = parseBinocularFindings({ 'maf.difficulty': 'both', 'distancePhoria.type': 'ortho' });
    expect(interpretBinocularAssessment(bothSides).patterns.find((p) => p.id === 'ainfac')).toBeDefined();
  });

  it('combines a vergence pattern and an accommodative pattern as "mixed"', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
      'npc.break': '12',
      'age.value': '20',
      'aa.OD': '4',
      'aa.OS': '4',
    });
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('mixed');
    expect(result.patterns.length).toBe(2);
  });

  it('does NOT call it "mixed" when only one side is independently well-supported — prefers the single primary pattern', () => {
    // Genuine (consistent) Accommodative Insufficiency, plus a same-type distance/near
    // exophoria that only barely clears the Basic Exophoria gate (possible, single supporting
    // finding) — the weak vergence match should not demote a well-supported accommodative
    // finding to "mixed".
    const data = parseBinocularFindings({
      'distancePhoria.type': 'exo',
      'distancePhoria.amount': '8',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '9',
      'age.value': '20',
      'aa.OD': '4',
      'aa.OS': '4',
    });
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('pattern');
    expect(result.patterns.length).toBe(1);
    expect(result.patterns[0].id).toBe('ai');
  });

  it('stops with the short "no significant dysfunction" message (no symptoms sentence) when there are no reported symptoms', () => {
    const data = parseBinocularFindings({
      symptoms: 'none',
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'ortho',
      'npc.break': '5',
      'npc.recovery': '8',
      'nearVergence.bi.break': '14',
      'nearVergence.bo.break': '22',
    });
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('no-pattern');
    expect(result.headline).toBe('No significant binocular or accommodative dysfunction demonstrated.');
    expect(result.patterns).toEqual([]);
  });

  it('appends the "does not explain the reported symptoms" sentence only when symptoms were actually reported', () => {
    const data = parseBinocularFindings({
      symptoms: 'nearStrain',
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'ortho',
      'npc.break': '5',
      'npc.recovery': '8',
      'nearVergence.bi.break': '14',
      'nearVergence.bo.break': '22',
    });
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('no-pattern');
    expect(result.headline).toBe('No significant binocular or accommodative dysfunction demonstrated. Current findings do not explain the reported symptoms.');
  });

  it('never produces a "Diagnosis:" style headline', () => {
    const data = parseBinocularFindings({ 'nearPhoria.type': 'exo', 'nearPhoria.amount': '10', 'npc.break': '12' });
    const result = interpretBinocularAssessment(data);
    expect(result.headline.toLowerCase()).not.toContain('diagnosis');
  });
});

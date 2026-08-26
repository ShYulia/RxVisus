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

  it('combines a vergence pattern and an accommodative pattern as "mixed" (AI needs facility corroboration, not just bilateral AA, to be genuinely consistent)', () => {
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
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('mixed');
    expect(result.patterns.length).toBe(2);
  });

  it('does NOT call it "mixed" when only one side is independently well-supported — prefers the single primary pattern, retaining the weaker match as a secondary finding', () => {
    // Genuine (consistent) Accommodative Insufficiency — bilateral reduced AA plus MAF
    // corroboration — alongside a same-type distance/near exophoria that only barely clears the
    // Basic Exophoria gate (possible, single supporting finding). The weak vergence match must
    // not demote the well-supported accommodative finding to "mixed", but it also must not be
    // dropped entirely — it stays visible as a secondary finding behind the primary.
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
    const result = interpretBinocularAssessment(data);
    expect(result.category).toBe('pattern');
    expect(result.patterns.length).toBe(2);
    expect(result.patterns[0].id).toBe('ai');
    expect(result.patterns[0].confidence).toBe('consistent');
    expect(result.patterns[1].id).toBe('basic-exo');
    expect(result.patterns[1].confidence).toBe('possible');
  });

  describe('Accommodative Insufficiency confidence — bilateral AA is the required finding, not two independent corroborators', () => {
    it('bilateral reduced AA alone (no MAF/BAF corroboration) is only "possible", with a note explaining why', () => {
      const data = parseBinocularFindings({ 'age.value': '20', 'aa.OD': '4', 'aa.OS': '4', 'distancePhoria.type': 'ortho' });
      const ai = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ai');
      expect(ai?.confidence).toBe('possible');
      expect(ai?.note).toMatch(/MAF\/BAF provide no additional corroborating/i);
    });

    it('bilateral reduced AA + MAF minus/both difficulty upgrades to "consistent"', () => {
      const data = parseBinocularFindings({
        'age.value': '20',
        'aa.OD': '4',
        'aa.OS': '4',
        'distancePhoria.type': 'ortho',
        'maf.difficulty': 'minus',
      });
      const ai = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ai');
      expect(ai?.confidence).toBe('consistent');
      expect(ai?.note).toBeUndefined();
    });

    it('bilateral reduced AA + BAF minus/both difficulty also upgrades to "consistent"', () => {
      const data = parseBinocularFindings({
        'age.value': '20',
        'aa.OD': '4',
        'aa.OS': '4',
        'distancePhoria.type': 'ortho',
        'baf.difficulty': 'both',
      });
      const ai = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ai');
      expect(ai?.confidence).toBe('consistent');
    });

    it('normal MAF/BAF does not exclude AI — the pattern still matches, just stays "possible"', () => {
      const data = parseBinocularFindings({
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
      const ai = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ai');
      expect(ai).toBeDefined();
      expect(ai?.confidence).toBe('possible');
    });

    it('unilateral reduced AA stays "possible" even with facility corroboration (bilaterality is still required)', () => {
      const data = parseBinocularFindings({
        'age.value': '20',
        'aa.OD': '4',
        'aa.OS': '12',
        'distancePhoria.type': 'ortho',
        'maf.difficulty': 'minus',
      });
      const ai = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ai');
      expect(ai?.confidence).toBe('possible');
    });
  });

  describe('Convergence Excess confidence — nonspecific near symptoms do not independently corroborate (audit fix, mirrors CI/AI standard)', () => {
    it('near esophoria greater than distance, with only near symptoms and no objective corroboration, stays "possible"', () => {
      const data = parseBinocularFindings({
        symptoms: 'headache,nearBlur',
        'distancePhoria.type': 'eso',
        'distancePhoria.amount': '1',
        'nearPhoria.type': 'eso',
        'nearPhoria.amount': '10',
      });
      const ce = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ce');
      expect(ce).toBeDefined();
      expect(ce?.confidence).toBe('possible');
      expect(ce?.supportingFindings.some((f) => /symptoms/i.test(f))).toBe(true);
    });

    it('near esophoria + a failed near Sheard\'s (BI) reaches "consistent" without needing symptoms', () => {
      const data = parseBinocularFindings({
        'distancePhoria.type': 'eso',
        'distancePhoria.amount': '1',
        'nearPhoria.type': 'eso',
        'nearPhoria.amount': '10',
        'nearVergence.bi.break': '8',
      });
      const ce = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ce');
      expect(ce?.confidence).toBe('consistent');
    });

    it('near esophoria + an elevated Gradient AC/A reaches "consistent"', () => {
      const data = parseBinocularFindings({
        'distancePhoria.type': 'eso',
        'distancePhoria.amount': '1',
        'nearPhoria.type': 'eso',
        'nearPhoria.amount': '10',
        'acaGradient.value': '8',
      });
      const ce = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ce');
      expect(ce?.confidence).toBe('consistent');
    });
  });

  describe('Accommodative Excess confidence — needs MAF and BAF concordance (two different tests), not symptoms alone', () => {
    it('plus-side difficulty on only one of MAF/BAF, even with symptoms, stays "possible" with an explanatory note', () => {
      const data = parseBinocularFindings({ symptoms: 'nearBlur,headache', 'distancePhoria.type': 'ortho', 'maf.difficulty': 'plus' });
      const ae = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ae');
      expect(ae).toBeDefined();
      expect(ae?.confidence).toBe('possible');
      expect(ae?.note).toMatch(/symptoms alone do not independently corroborate/i);
    });

    it('plus-side difficulty on BOTH MAF and BAF reaches "consistent"', () => {
      const data = parseBinocularFindings({ 'distancePhoria.type': 'ortho', 'maf.difficulty': 'plus', 'baf.difficulty': 'plus' });
      const ae = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ae');
      expect(ae?.confidence).toBe('consistent');
      expect(ae?.note).toBeUndefined();
    });
  });

  describe('Accommodative Infacility confidence — needs MAF and BAF concordance, not symptoms or the MAF cpm figures alone', () => {
    it('both-direction difficulty on only MAF, even with slow-refocus symptoms, stays "possible"', () => {
      const data = parseBinocularFindings({ symptoms: 'slowRefocusNearToDistance', 'distancePhoria.type': 'ortho', 'maf.difficulty': 'both' });
      const ainfac = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ainfac');
      expect(ainfac).toBeDefined();
      expect(ainfac?.confidence).toBe('possible');
    });

    it('both-direction difficulty on BOTH MAF and BAF reaches "consistent"', () => {
      const data = parseBinocularFindings({ 'distancePhoria.type': 'ortho', 'maf.difficulty': 'both', 'baf.difficulty': 'both' });
      const ainfac = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'ainfac');
      expect(ainfac?.confidence).toBe('consistent');
    });
  });

  describe('Basic Exophoria confidence — a generic symptom does not substitute for the second objective corroborator', () => {
    it('notable magnitude alone, even with symptoms, stays "possible"', () => {
      const data = parseBinocularFindings({
        symptoms: 'nearStrain',
        'distancePhoria.type': 'exo',
        'distancePhoria.amount': '9',
        'nearPhoria.type': 'exo',
        'nearPhoria.amount': '10',
      });
      const basicExo = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'basic-exo');
      expect(basicExo).toBeDefined();
      expect(basicExo?.confidence).toBe('possible');
      expect(basicExo?.supportingFindings).toContain('Symptomatic');
    });

    it('notable magnitude + a failed Sheard\'s together (no symptoms needed) reach "consistent"', () => {
      const data = parseBinocularFindings({
        'distancePhoria.type': 'exo',
        'distancePhoria.amount': '9',
        'nearPhoria.type': 'exo',
        'nearPhoria.amount': '10',
        'nearVergence.bo.break': '12',
      });
      const basicExo = interpretBinocularAssessment(data).patterns.find((p) => p.id === 'basic-exo');
      expect(basicExo?.confidence).toBe('consistent');
    });
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

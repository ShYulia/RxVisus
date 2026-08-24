import { describe, expect, it } from 'vitest';
import { evaluateQuickScreen } from './binocularQuickScreen';
import { parseBinocularFindings } from './binocularFindings';

describe('evaluateQuickScreen', () => {
  it('no symptoms + normal screening -> screen clear (no recommendation)', () => {
    const data = parseBinocularFindings({
      symptoms: 'none',
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'ortho',
      'npc.break': '5',
      'maf.OD': '10',
      'maf.OS': '10',
      'maf.difficulty': 'neither',
    });
    const result = evaluateQuickScreen(data);
    expect(result.recommendFullAssessment).toBe(false);
    expect(result.symptomReasons).toEqual([]);
    expect(result.objectiveReasons).toEqual([]);
  });

  it('relevant symptoms + normal screening -> Full Assessment recommended, reasons explain why', () => {
    const data = parseBinocularFindings({
      symptoms: 'nearStrain,headache',
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'ortho',
      'npc.break': '5',
      'maf.OD': '10',
      'maf.OS': '10',
      'maf.difficulty': 'neither',
    });
    const result = evaluateQuickScreen(data);
    expect(result.recommendFullAssessment).toBe(true);
    expect(result.symptomReasons.length).toBe(2);
    expect(result.objectiveReasons).toEqual([]);
  });

  it('no symptoms + a notable objective finding -> Full Assessment recommended', () => {
    const data = parseBinocularFindings({
      symptoms: 'none',
      'distancePhoria.type': 'ortho',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '10',
      'npc.break': '5',
    });
    const result = evaluateQuickScreen(data);
    expect(result.recommendFullAssessment).toBe(true);
    expect(result.symptomReasons).toEqual([]);
    expect(result.objectiveReasons.length).toBeGreaterThan(0);
  });

  it('symptoms + notable objective findings -> Full Assessment recommended', () => {
    const data = parseBinocularFindings({
      symptoms: 'readingDifficulty',
      'npc.break': '9',
    });
    const result = evaluateQuickScreen(data);
    expect(result.recommendFullAssessment).toBe(true);
    expect(result.symptomReasons.length).toBe(1);
    expect(result.objectiveReasons.length).toBeGreaterThan(0);
  });

  it("a single mild/borderline finding alone does not silently create a stronger claim than 'recommend further assessment'", () => {
    // one MAF difficulty flag, nothing else notable — should recommend, but reasons list stays short/explicit, not an inflated multi-finding claim.
    const data = parseBinocularFindings({ symptoms: 'none', 'maf.difficulty': 'minus' });
    const result = evaluateQuickScreen(data);
    expect(result.recommendFullAssessment).toBe(true);
    expect(result.objectiveReasons).toEqual(['Difficulty clearing MAF flipper']);
  });
});

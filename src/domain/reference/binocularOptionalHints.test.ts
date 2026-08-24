import { describe, expect, it } from 'vitest';
import { suggestOptionalTests } from './binocularOptionalHints';
import { parseBinocularFindings } from './binocularFindings';

describe('suggestOptionalTests', () => {
  it('returns no hints when there is nothing notable', () => {
    const data = parseBinocularFindings({ symptoms: 'none', 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho' });
    expect(suggestOptionalTests(data)).toEqual([]);
  });

  it('suggests Gradient AC/A when distance and near phoria differ in direction', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'eso',
      'distancePhoria.amount': '2',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '6',
    });
    expect(suggestOptionalTests(data).some((h) => h.includes('AC/A'))).toBe(true);
  });

  it('suggests additional vergence testing when symptomatic but core findings do not explain it', () => {
    const data = parseBinocularFindings({ symptoms: 'nearStrain', 'npc.break': '5' });
    expect(suggestOptionalTests(data).some((h) => h.includes('vergence testing'))).toBe(true);
  });

  it('does not suggest additional vergence testing when core findings already explain the symptoms', () => {
    const data = parseBinocularFindings({ symptoms: 'nearStrain', 'npc.break': '12' });
    expect(suggestOptionalTests(data).some((h) => h.includes('vergence testing'))).toBe(false);
  });

  it('suggests NRA/PRA and MEM/Nott when MAF shows difficulty', () => {
    const data = parseBinocularFindings({ 'maf.difficulty': 'plus' });
    expect(suggestOptionalTests(data).some((h) => h.includes('MEM/Nott'))).toBe(true);
  });
});

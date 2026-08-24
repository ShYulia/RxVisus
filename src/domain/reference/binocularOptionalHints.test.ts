import { describe, expect, it } from 'vitest';
import { getGuidedNextSteps } from './binocularOptionalHints';
import { parseBinocularFindings } from './binocularFindings';

describe('getGuidedNextSteps', () => {
  it('recommends nothing when there is nothing notable — no additional targeted testing indicated', () => {
    const data = parseBinocularFindings({ symptoms: 'none', 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho' });
    expect(getGuidedNextSteps(data)).toEqual([]);
  });

  it('does not recommend a test just because a value is missing — only when a specific finding points to it', () => {
    // Ortho at both distance and near, no symptoms: nothing here points to any specific
    // targeted test, even though every optional field is technically "unrecorded".
    const data = parseBinocularFindings({ 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho', 'npc.break': '5' });
    expect(getGuidedNextSteps(data)).toEqual([]);
  });

  it('recommends Gradient AC/A when distance and near phoria differ in direction', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'eso',
      'distancePhoria.amount': '2',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '6',
    });
    const recs = getGuidedNextSteps(data);
    expect(recs.some((r) => r.stepId === 'aca-gradient')).toBe(true);
  });

  it('does not recommend Gradient AC/A when it has already been measured', () => {
    const data = parseBinocularFindings({
      'distancePhoria.type': 'eso',
      'distancePhoria.amount': '2',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '6',
      'acaGradient.value': '5',
    });
    expect(getGuidedNextSteps(data).some((r) => r.stepId === 'aca-gradient')).toBe(false);
  });

  it('recommends Vergence Facility when symptomatic but core findings do not explain it', () => {
    const data = parseBinocularFindings({ symptoms: 'nearStrain', 'npc.break': '5' });
    expect(getGuidedNextSteps(data).some((r) => r.stepId === 'vergence-facility-gate')).toBe(true);
  });

  it('does not recommend Vergence Facility when core findings already explain the symptoms (e.g. receded NPC)', () => {
    const data = parseBinocularFindings({ symptoms: 'nearStrain', 'npc.break': '12' });
    expect(getGuidedNextSteps(data).some((r) => r.stepId === 'vergence-facility-gate')).toBe(false);
  });

  it('recommends NRA/PRA and MEM/Nott when accommodative facility difficulty was noted', () => {
    const data = parseBinocularFindings({ 'maf.difficulty': 'plus' });
    const recs = getGuidedNextSteps(data);
    expect(recs.some((r) => r.stepId === 'nra-pra')).toBe(true);
    expect(recs.some((r) => r.stepId === 'mem-nott')).toBe(true);
  });

  it('does not recommend NRA/PRA again once it has already been recorded', () => {
    const data = parseBinocularFindings({ 'maf.difficulty': 'plus', 'nra.value': '2', 'pra.value': '3' });
    expect(getGuidedNextSteps(data).some((r) => r.stepId === 'nra-pra')).toBe(false);
  });

  it('recommends Distance Fusional Vergence for a predominantly distance-related deviation', () => {
    const data = parseBinocularFindings({ 'distancePhoria.type': 'eso', 'distancePhoria.amount': '8', 'nearPhoria.type': 'ortho' });
    expect(getGuidedNextSteps(data).some((r) => r.stepId === 'distance-vergence')).toBe(true);
  });

  it('does NOT recommend Distance Fusional Vergence for a near-predominant (CI-type) picture — distance must be the larger finding', () => {
    // Classic CI shape: near exophoria far exceeds distance — this is a near problem, not a
    // distance one, so Distance Fusional Vergence would be the wrong targeted test to suggest.
    const data = parseBinocularFindings({
      'distancePhoria.type': 'exo',
      'distancePhoria.amount': '2',
      'nearPhoria.type': 'exo',
      'nearPhoria.amount': '12',
    });
    expect(getGuidedNextSteps(data).some((r) => r.stepId === 'distance-vergence')).toBe(false);
  });

  it('recommends Stereoacuity when there is a motor finding not yet sensorially characterized', () => {
    const data = parseBinocularFindings({ 'distancePhoria.type': 'exo', 'distancePhoria.amount': '8', 'nearPhoria.type': 'ortho' });
    expect(getGuidedNextSteps(data).some((r) => r.stepId === 'stereoacuity')).toBe(true);
  });

  it('every recommendation includes a one-sentence reason', () => {
    const data = parseBinocularFindings({ 'maf.difficulty': 'both', symptoms: 'nearStrain' });
    for (const rec of getGuidedNextSteps(data)) {
      expect(rec.reason.length).toBeGreaterThan(10);
    }
  });
});

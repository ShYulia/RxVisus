import { describe, expect, it } from 'vitest';
import { EXCEEDS_RANGE_VALUE } from './binocularFindings';
import { clinicalPathways, getPathwayNode, PERSISTENT_DIPLOPIA_CONSIDERATIONS, type TextEntryField } from './clinicalPathways';
import { getClinicalTest } from './clinicalTests';
import { getGlossaryTerm } from './glossary';

function allTextEntryFields(): { nodeId: string; stepId: string; field: TextEntryField }[] {
  return clinicalPathways.flatMap((node) =>
    (node.steps ?? []).flatMap((step) => (step.kind === 'text-entry' ? step.fields.map((field) => ({ nodeId: node.id, stepId: step.id, field })) : [])),
  );
}

describe('getPathwayNode', () => {
  it('finds a known node by id', () => {
    expect(getPathwayNode('diplopia')?.title).toBe('Diplopia');
  });

  it('returns undefined for an unknown id', () => {
    expect(getPathwayNode('not-a-real-node')).toBeUndefined();
  });
});

describe('clinicalPathways referential integrity', () => {
  it('every branch child id resolves to a real node', () => {
    for (const node of clinicalPathways) {
      for (const childId of node.children ?? []) {
        expect(getPathwayNode(childId), `${node.id} -> child "${childId}"`).toBeDefined();
      }
    }
  });

  it('every leaf testId resolves to a real canonical test', () => {
    for (const node of clinicalPathways) {
      for (const testId of node.testIds ?? []) {
        expect(getClinicalTest(testId), `${node.id} -> test "${testId}"`).toBeDefined();
      }
    }
  });

  it('every question-step and outcome testId resolves to a real canonical test', () => {
    for (const node of clinicalPathways) {
      for (const step of node.steps ?? []) {
        if (step.kind !== 'question') continue;
        for (const testId of step.testIds ?? []) {
          expect(getClinicalTest(testId), `${node.id} -> step "${step.id}" -> test "${testId}"`).toBeDefined();
        }
        for (const outcome of step.outcomes) {
          for (const testId of outcome.testIds ?? []) {
            expect(getClinicalTest(testId), `${node.id} -> outcome "${outcome.label}" -> test "${testId}"`).toBeDefined();
          }
        }
      }
    }
  });

  it('every text-entry step testId resolves to a real canonical test', () => {
    for (const node of clinicalPathways) {
      for (const step of node.steps ?? []) {
        if (step.kind !== 'text-entry') continue;
        for (const testId of step.testIds ?? []) {
          expect(getClinicalTest(testId), `${node.id} -> step "${step.id}" -> test "${testId}"`).toBeDefined();
        }
      }
    }
  });

  it('every step id is unique within its node', () => {
    for (const node of clinicalPathways) {
      const ids = (node.steps ?? []).map((step) => step.id);
      expect(new Set(ids).size, `${node.id} has duplicate step ids`).toBe(ids.length);
    }
  });

  it('every next target resolves to a real step id within the same node', () => {
    for (const node of clinicalPathways) {
      const stepIds = new Set((node.steps ?? []).map((step) => step.id));
      for (const step of node.steps ?? []) {
        if (step.kind === 'measurement' || step.kind === 'text-entry' || step.kind === 'rx-entry') {
          expect(stepIds.has(step.next), `${node.id} -> ${step.kind} step "${step.id}" -> next "${step.next}"`).toBe(true);
          continue;
        }
        if (step.kind === 'symptom-select') {
          expect(stepIds.has(step.next), `${node.id} -> symptom-select step "${step.id}" -> next "${step.next}"`).toBe(true);
          if (step.branchOnKey) {
            expect(stepIds.has(step.branchOnKey.next), `${node.id} -> symptom-select step "${step.id}" -> branchOnKey.next "${step.branchOnKey.next}"`).toBe(true);
          }
          continue;
        }
        if (step.kind === 'quick-screen-result') {
          expect(stepIds.has(step.continueNext), `${node.id} -> quick-screen-result step "${step.id}" -> continueNext "${step.continueNext}"`).toBe(true);
          expect(stepIds.has(step.finishNext), `${node.id} -> quick-screen-result step "${step.id}" -> finishNext "${step.finishNext}"`).toBe(true);
          continue;
        }
        if (step.kind === 'optional-tests-menu') {
          expect(stepIds.has(step.skipNext), `${node.id} -> optional-tests-menu step "${step.id}" -> skipNext "${step.skipNext}"`).toBe(true);
          for (const option of step.options) {
            expect(stepIds.has(option.stepId), `${node.id} -> optional-tests-menu step "${step.id}" -> option "${option.label}" -> stepId "${option.stepId}"`).toBe(true);
          }
          continue;
        }
        if (step.kind === 'final-rx' || step.kind === 'binocular-summary' || step.kind === 'prism-unsuccessful') continue;
        if (step.skipWhen) {
          expect(stepIds.has(step.skipWhen.next), `${node.id} -> step "${step.id}" -> skipWhen.next "${step.skipWhen.next}"`).toBe(true);
        }
        for (const outcome of step.outcomes) {
          if (outcome.next) {
            expect(stepIds.has(outcome.next), `${node.id} -> step "${step.id}" -> outcome "${outcome.label}" -> next "${outcome.next}"`).toBe(true);
          }
        }
      }
    }
  });

  it('every measurement consistencyCheck.recheckStepId resolves to a real step id within the same node', () => {
    for (const node of clinicalPathways) {
      const stepIds = new Set((node.steps ?? []).map((step) => step.id));
      for (const step of node.steps ?? []) {
        if (step.kind !== 'measurement' || !step.consistencyCheck) continue;
        expect(
          stepIds.has(step.consistencyCheck.recheckStepId),
          `${node.id} -> step "${step.id}" -> consistencyCheck.recheckStepId "${step.consistencyCheck.recheckStepId}"`,
        ).toBe(true);
      }
    }
  });

  it('every outcome.infoTerm resolves to a real glossary entry', () => {
    for (const node of clinicalPathways) {
      for (const step of node.steps ?? []) {
        if (step.kind !== 'question') continue;
        for (const outcome of step.outcomes) {
          if (outcome.infoTerm) {
            expect(getGlossaryTerm(outcome.infoTerm), `${node.id} -> step "${step.id}" -> outcome "${outcome.label}" -> infoTerm "${outcome.infoTerm}"`).toBeDefined();
          }
        }
      }
    }
  });

  it('every seeAlso id (node-level and outcome-level) resolves to a real pathway node', () => {
    for (const node of clinicalPathways) {
      for (const seeAlsoId of node.seeAlso ?? []) {
        expect(getPathwayNode(seeAlsoId), `${node.id} -> seeAlso "${seeAlsoId}"`).toBeDefined();
      }
      for (const step of node.steps ?? []) {
        if (step.kind !== 'question') continue;
        for (const outcome of step.outcomes) {
          for (const seeAlsoId of outcome.seeAlso ?? []) {
            expect(getPathwayNode(seeAlsoId), `${node.id} -> outcome "${outcome.label}" -> seeAlso "${seeAlsoId}"`).toBeDefined();
          }
        }
      }
    }
  });

  it('Diplopia and Strabismus reuse the exact same Measure -> Trial -> Prescribe step objects, not copies', () => {
    const diplopia = getPathwayNode('diplopia-binocular');
    const strabismus = getPathwayNode('strabismus');
    for (const id of ['best-correction', 'measure', 'record-measurement', 'trial', 'final-rx']) {
      const diplopiaStep = diplopia?.steps?.find((step) => step.id === id);
      const strabismusStep = strabismus?.steps?.find((step) => step.id === id);
      expect(diplopiaStep, `diplopia-binocular -> step "${id}"`).toBeDefined();
      expect(strabismusStep, `strabismus -> step "${id}"`).toBeDefined();
      expect(strabismusStep, `step "${id}" should be the same shared object, not a duplicate`).toBe(diplopiaStep);
    }
  });

  it('every measurement consistencyCheck.findingKey has a matching recordAs producer in the same node', () => {
    for (const node of clinicalPathways) {
      const recordedKeys = new Set(
        (node.steps ?? []).flatMap((step) => (step.kind === 'question' ? step.outcomes.flatMap((o) => (o.recordAs ? [o.recordAs.key] : [])) : [])),
      );
      for (const step of node.steps ?? []) {
        if (step.kind !== 'measurement' || !step.consistencyCheck) continue;
        expect(recordedKeys.has(step.consistencyCheck.findingKey), `${node.id} -> step "${step.id}" -> consistencyCheck.findingKey "${step.consistencyCheck.findingKey}" has no recordAs producer`).toBe(true);
      }
    }
  });

  it('every question step\'s skipWhen.key has a matching recordAs producer in the same node — an already-known finding must actually be recordable, or the skip could never fire', () => {
    for (const node of clinicalPathways) {
      const recordedKeys = new Set(
        (node.steps ?? []).flatMap((step) => (step.kind === 'question' ? step.outcomes.flatMap((o) => (o.recordAs ? [o.recordAs.key] : [])) : [])),
      );
      for (const step of node.steps ?? []) {
        if (step.kind !== 'question' || !step.skipWhen) continue;
        expect(recordedKeys.has(step.skipWhen.key), `${node.id} -> step "${step.id}" -> skipWhen.key "${step.skipWhen.key}" has no recordAs producer`).toBe(true);
      }
    }
  });

  it('every numeric clinical measurement field is marked `numeric` — VA and Stereoacuity stay free text on purpose', () => {
    const fields = allTextEntryFields();

    const numericKeys = [
      'age.value',
      'distancePhoria.amount',
      'nearPhoria.amount',
      'npc.break',
      'npc.recovery',
      'maf.OD',
      'maf.OS',
      'nearVergence.bi.blur',
      'nearVergence.bi.break',
      'nearVergence.bi.recovery',
      'nearVergence.bo.blur',
      'nearVergence.bo.break',
      'nearVergence.bo.recovery',
      'aa.OD',
      'aa.OS',
      'baf.cyclesPerMin',
      'distanceVergence.bi.blur',
      'distanceVergence.bi.break',
      'distanceVergence.bi.recovery',
      'distanceVergence.bo.blur',
      'distanceVergence.bo.break',
      'distanceVergence.bo.recovery',
      'acaGradient.value',
      'nra.value',
      'pra.value',
      'vergenceFacility.cyclesPerMin',
      'memNott.OD',
      'memNott.OS',
    ];
    for (const key of numericKeys) {
      const match = fields.find((f) => f.field.key === key);
      expect(match, `expected a text-entry field for key "${key}"`).toBeDefined();
      expect(match!.field.numeric, `field "${key}" should be marked numeric`).toBeDefined();
    }

    const freeTextKeys = ['OD', 'OS', 'stereoacuity.value']; // Strabismus VA (OD/OS) and Stereoacuity — notation varies, never parsed as a number.
    for (const key of freeTextKeys) {
      const match = fields.find((f) => f.field.key === key);
      expect(match, `expected a text-entry field for key "${key}"`).toBeDefined();
      expect(match!.field.numeric, `field "${key}" should stay free text`).toBeUndefined();
    }
  });

  it('MEM/Nott allows a negative (signed lag/lead) value; every other numeric field is a non-negative magnitude', () => {
    const fields = allTextEntryFields();
    const memNott = fields.filter((f) => f.field.key === 'memNott.OD' || f.field.key === 'memNott.OS');
    expect(memNott.length).toBe(2);
    for (const f of memNott) expect(f.field.numeric?.allowNegative).toBe(true);

    const others = fields.filter((f) => f.field.numeric && f.field.key !== 'memNott.OD' && f.field.key !== 'memNott.OS');
    expect(others.length).toBeGreaterThan(0);
    for (const f of others) expect(f.field.numeric?.allowNegative).toBeFalsy();
  });

  it('every Break/Recovery fusional-vergence field offers "Exceeds range", distinct from Blur\'s "No blur"', () => {
    const fields = allTextEntryFields();
    for (const prefix of ['nearVergence', 'distanceVergence']) {
      for (const side of ['bi', 'bo']) {
        for (const measure of ['break', 'recovery']) {
          const field = fields.find((f) => f.field.key === `${prefix}.${side}.${measure}`)!.field;
          expect(field.absentOption, `${prefix}.${side}.${measure} should offer an "Exceeds range" toggle`).toEqual({ label: 'Exceeds range', value: EXCEEDS_RANGE_VALUE });
        }
        const blurField = fields.find((f) => f.field.key === `${prefix}.${side}.blur`)!.field;
        expect(blurField.absentOption?.label).toBe('No blur');
      }
    }
  });

  it('branch nodes have children and no testIds/steps; leaf nodes have no children', () => {
    for (const node of clinicalPathways) {
      if (node.kind === 'branch') {
        expect(node.children?.length ?? 0).toBeGreaterThan(0);
        expect(node.testIds).toBeUndefined();
        expect(node.steps).toBeUndefined();
      } else {
        expect(node.children).toBeUndefined();
      }
    }
  });

  it('every prism-unsuccessful step shares the same concise, 3-point Clinical Considerations list — kept short on purpose for a final result screen', () => {
    expect(PERSISTENT_DIPLOPIA_CONSIDERATIONS).toHaveLength(3);
    for (const node of clinicalPathways) {
      for (const step of node.steps ?? []) {
        if (step.kind !== 'prism-unsuccessful') continue;
        expect(step.guidance, `${node.id} -> step "${step.id}" -> guidance`).toBe(PERSISTENT_DIPLOPIA_CONSIDERATIONS);
      }
    }
  });
});

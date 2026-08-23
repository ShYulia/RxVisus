import { describe, expect, it } from 'vitest';
import { clinicalPathways, getPathwayNode } from './clinicalPathways';
import { getClinicalTest } from './clinicalTests';
import { getGlossaryTerm } from './glossary';

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
        if (step.kind === 'final-rx') continue;
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

  it('does not link specialist/non-chairside tests (e.g. Hess/Lancaster) as an actionable pathway step', () => {
    const SPECIALIST_ONLY_TEST_IDS = ['hess-lancaster'];
    for (const node of clinicalPathways) {
      for (const testId of node.testIds ?? []) {
        expect(SPECIALIST_ONLY_TEST_IDS, `${node.id} -> test "${testId}"`).not.toContain(testId);
      }
      for (const step of node.steps ?? []) {
        if (step.kind !== 'question') continue;
        for (const testId of step.testIds ?? []) {
          expect(SPECIALIST_ONLY_TEST_IDS, `${node.id} -> step "${step.id}" -> test "${testId}"`).not.toContain(testId);
        }
        for (const outcome of step.outcomes) {
          for (const testId of outcome.testIds ?? []) {
            expect(SPECIALIST_ONLY_TEST_IDS, `${node.id} -> outcome "${outcome.label}" -> test "${testId}"`).not.toContain(testId);
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
});

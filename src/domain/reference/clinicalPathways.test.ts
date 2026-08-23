import { describe, expect, it } from 'vitest';
import { clinicalPathways, getPathwayNode } from './clinicalPathways';
import { getClinicalTest } from './clinicalTests';

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

  it('every step and outcome testId resolves to a real canonical test', () => {
    for (const node of clinicalPathways) {
      for (const step of node.steps ?? []) {
        for (const testId of step.testIds ?? []) {
          expect(getClinicalTest(testId), `${node.id} -> step "${step.question}" -> test "${testId}"`).toBeDefined();
        }
        for (const outcome of step.outcomes) {
          for (const testId of outcome.testIds ?? []) {
            expect(getClinicalTest(testId), `${node.id} -> outcome "${outcome.label}" -> test "${testId}"`).toBeDefined();
          }
        }
      }
    }
  });

  it('every seeAlso id resolves to a real pathway node', () => {
    for (const node of clinicalPathways) {
      for (const seeAlsoId of node.seeAlso ?? []) {
        expect(getPathwayNode(seeAlsoId), `${node.id} -> seeAlso "${seeAlsoId}"`).toBeDefined();
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
        for (const testId of step.testIds ?? []) {
          expect(SPECIALIST_ONLY_TEST_IDS, `${node.id} -> step "${step.question}" -> test "${testId}"`).not.toContain(testId);
        }
        for (const outcome of step.outcomes) {
          for (const testId of outcome.testIds ?? []) {
            expect(SPECIALIST_ONLY_TEST_IDS, `${node.id} -> outcome "${outcome.label}" -> test "${testId}"`).not.toContain(testId);
          }
        }
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

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

  it('branch nodes have children and no testIds; leaf nodes have no children', () => {
    for (const node of clinicalPathways) {
      if (node.kind === 'branch') {
        expect(node.children?.length ?? 0).toBeGreaterThan(0);
        expect(node.testIds).toBeUndefined();
      } else {
        expect(node.children).toBeUndefined();
      }
    }
  });
});

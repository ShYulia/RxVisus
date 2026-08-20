import type { FavoriteRef } from '../../store/favoritesStore';
import { calculatorDefinitions } from '../calculators/calculatorRegistry';
import { getClinicalTest } from '../../domain/reference/clinicalTests';
import { getPathwayNode } from '../../domain/reference/clinicalPathways';

export interface ResolvedFavorite extends FavoriteRef {
  title: string;
  desc: string;
  route: string;
}

/**
 * Resolves a stored favorite pointer to display info, pulling from whichever
 * registry actually owns that content. Returns null if the referenced item
 * no longer exists (e.g. content was renamed/removed) — callers should skip it.
 */
export function resolveFavorite(ref: FavoriteRef): ResolvedFavorite | null {
  if (ref.type === 'calculator') {
    const def = calculatorDefinitions.find((d) => d.id === ref.id);
    if (!def) return null;
    return { ...ref, title: def.title, desc: def.subtitle, route: def.path };
  }

  if (ref.type === 'test') {
    const test = getClinicalTest(ref.id);
    if (!test) return null;
    return { ...ref, title: test.title, desc: test.purpose, route: `/guide/tests/${test.id}` };
  }

  const node = getPathwayNode(ref.id);
  if (!node) return null;
  return { ...ref, title: node.title, desc: node.overview ?? '', route: `/guide/pathway/${node.id}` };
}

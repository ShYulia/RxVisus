import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';

const FAVORITES_KEY = 'rxvisus.favorites';

/**
 * A favorite is a pointer, never a copy — it references an existing id in
 * whichever registry owns that content (calculatorRegistry.ts,
 * domain/reference/clinicalTests.ts, domain/reference/clinicalPathways.ts).
 */
export interface FavoriteRef {
  type: 'calculator' | 'test' | 'pathway';
  id: string;
}

interface FavoritesState {
  favorites: FavoriteRef[];
  hydrated: boolean;
  hydrate: () => void;
  isFavorite: (ref: FavoriteRef) => boolean;
  toggleFavorite: (ref: FavoriteRef) => void;
}

function sameRef(a: FavoriteRef, b: FavoriteRef): boolean {
  return a.type === b.type && a.id === b.id;
}

function persist(favorites: FavoriteRef[]): void {
  void Preferences.set({ key: FAVORITES_KEY, value: JSON.stringify(favorites) });
}

/** Local-only favorites list (cross-module shortcuts). No accounts, no backend. */
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  hydrated: false,
  hydrate: () => {
    void Preferences.get({ key: FAVORITES_KEY }).then(({ value }) => {
      if (!value) {
        set({ hydrated: true });
        return;
      }
      try {
        const parsed = JSON.parse(value) as unknown;
        set({ favorites: Array.isArray(parsed) ? (parsed as FavoriteRef[]) : [], hydrated: true });
      } catch {
        set({ hydrated: true });
      }
    });
  },
  isFavorite: (ref) => get().favorites.some((f) => sameRef(f, ref)),
  toggleFavorite: (ref) => {
    const current = get().favorites;
    const next = current.some((f) => sameRef(f, ref))
      ? current.filter((f) => !sameRef(f, ref))
      : [...current, ref];
    set({ favorites: next });
    persist(next);
  },
}));

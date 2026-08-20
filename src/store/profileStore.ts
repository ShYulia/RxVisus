import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';

const DISPLAY_NAME_KEY = 'rxvisus.displayName';

interface ProfileState {
  /** Empty string means no name has been set — greetings render without one. */
  displayName: string;
  hydrated: boolean;
  hydrate: () => void;
  setDisplayName: (name: string) => void;
}

/** Local-only display-name preference (Home greeting). No accounts, no backend. */
export const useProfileStore = create<ProfileState>((set) => ({
  displayName: '',
  hydrated: false,
  hydrate: () => {
    void Preferences.get({ key: DISPLAY_NAME_KEY }).then(({ value }) => {
      set({ displayName: value ?? '', hydrated: true });
    });
  },
  setDisplayName: (name: string) => {
    const trimmed = name.trim();
    set({ displayName: trimmed });
    void Preferences.set({ key: DISPLAY_NAME_KEY, value: trimmed });
  },
}));

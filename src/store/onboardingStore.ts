import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import pkg from '../../package.json';

const ACKNOWLEDGED_KEY = 'rxvisus.firstLaunchAcknowledged';

/**
 * Bump this when the acknowledgment text materially changes — a stored record from an older
 * version no longer counts as current, so the modal is shown again. Not tied to `appVersion`
 * (an ordinary release with no wording change shouldn't force re-acknowledgment).
 */
export const ACKNOWLEDGMENT_VERSION = '1.0';

/** What's actually persisted locally — see hydrate()/acknowledge() below. Never transmitted anywhere. */
export interface AcknowledgmentRecord {
  acknowledged: true;
  /** ISO 8601 timestamp of when the user tapped "I understand". */
  acknowledgedAt: string;
  acknowledgmentVersion: string;
  /** RxKit's package.json version at the time of acknowledgment, if available. */
  appVersion?: string;
}

interface OnboardingState {
  /** True only when a stored record exists AND matches the current ACKNOWLEDGMENT_VERSION. */
  acknowledged: boolean;
  hydrated: boolean;
  hydrate: () => void;
  acknowledge: () => void;
}

function isCurrentAcknowledgment(value: string | null): boolean {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value) as Partial<AcknowledgmentRecord>;
    return parsed.acknowledged === true && parsed.acknowledgmentVersion === ACKNOWLEDGMENT_VERSION;
  } catch {
    return false;
  }
}

/**
 * First-launch clinical-use acknowledgment — local-only, shown once per ACKNOWLEDGMENT_VERSION.
 * A record from a prior version (including the plain "true" string this store used before
 * versioning existed) doesn't parse as current, so it's safely treated as not-yet-acknowledged
 * rather than silently trusted.
 */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  acknowledged: false,
  hydrated: false,
  hydrate: () => {
    void Preferences.get({ key: ACKNOWLEDGED_KEY }).then(({ value }) => {
      set({ acknowledged: isCurrentAcknowledgment(value), hydrated: true });
    });
  },
  acknowledge: () => {
    const record: AcknowledgmentRecord = {
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
      acknowledgmentVersion: ACKNOWLEDGMENT_VERSION,
      appVersion: pkg.version,
    };
    set({ acknowledged: true });
    void Preferences.set({ key: ACKNOWLEDGED_KEY, value: JSON.stringify(record) });
  },
}));

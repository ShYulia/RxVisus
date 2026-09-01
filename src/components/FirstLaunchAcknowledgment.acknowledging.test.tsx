import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import FirstLaunchAcknowledgment from './FirstLaunchAcknowledgment';
import { ACKNOWLEDGMENT_VERSION, useOnboardingStore, type AcknowledgmentRecord } from '../store/onboardingStore';
import pkg from '../../package.json';

// See FirstLaunchAcknowledgment.notYetAcknowledged.test.tsx for why this is its own file rather
// than a shared describe block.
vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: vi.fn(), set: vi.fn() },
}));

describe('FirstLaunchAcknowledgment', () => {
  it('tapping "I understand" persists the acknowledgment and records it in the store', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: null });
    render(<FirstLaunchAcknowledgment />);

    // fireEvent, not userEvent: ion-modal's entering-transition state in jsdom (no real CSS
    // transitions/animation-end) makes userEvent's pointer-events visibility check treat the
    // button as unclickable, even though it's genuinely clickable — verified directly in Chrome.
    const button = await screen.findByText('I understand');
    fireEvent.click(button);

    await waitFor(() => expect(useOnboardingStore.getState().acknowledged).toBe(true));

    expect(Preferences.set).toHaveBeenCalledTimes(1);
    const [{ key, value }] = vi.mocked(Preferences.set).mock.calls[0];
    expect(key).toBe('rxvisus.firstLaunchAcknowledged');
    const record = JSON.parse(value) as AcknowledgmentRecord;
    expect(record.acknowledged).toBe(true);
    expect(record.acknowledgmentVersion).toBe(ACKNOWLEDGMENT_VERSION);
    expect(record.appVersion).toBe(pkg.version);
    expect(new Date(record.acknowledgedAt).toISOString()).toBe(record.acknowledgedAt);
  });
});

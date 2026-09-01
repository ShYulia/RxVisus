import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import FirstLaunchAcknowledgment from './FirstLaunchAcknowledgment';
import { ACKNOWLEDGMENT_VERSION } from '../store/onboardingStore';

// See FirstLaunchAcknowledgment.notYetAcknowledged.test.tsx for why this is its own file rather
// than a shared describe block.
vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: vi.fn(), set: vi.fn() },
}));

describe('FirstLaunchAcknowledgment', () => {
  it('does not show once already acknowledged, at the current version, on a prior launch', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({ acknowledged: true, acknowledgedAt: '2026-01-01T00:00:00.000Z', acknowledgmentVersion: ACKNOWLEDGMENT_VERSION, appVersion: '0.0.1' }),
    });
    render(<FirstLaunchAcknowledgment />);

    await waitFor(() => expect(Preferences.get).toHaveBeenCalled());
    expect(screen.queryByText('I understand')).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import FirstLaunchAcknowledgment from './FirstLaunchAcknowledgment';

// See FirstLaunchAcknowledgment.notYetAcknowledged.test.tsx for why this is its own file rather
// than sharing a file with another test that also presents a real, open modal.
vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: vi.fn(), set: vi.fn() },
}));

describe('FirstLaunchAcknowledgment', () => {
  it('shows again when the stored record is from an older acknowledgment version', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({
      value: JSON.stringify({ acknowledged: true, acknowledgedAt: '2026-01-01T00:00:00.000Z', acknowledgmentVersion: '0.9', appVersion: '0.0.1' }),
    });
    const { unmount } = render(<FirstLaunchAcknowledgment />);

    expect(await screen.findByText('I understand')).toBeInTheDocument();

    // See FirstLaunchAcknowledgment.notYetAcknowledged.test.tsx for why this unmount + settle
    // is needed whenever a test leaves the modal genuinely open.
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});

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
  it('shows again for a pre-versioning plain "true" record left over from before this store was versioned', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: 'true' });
    const { unmount } = render(<FirstLaunchAcknowledgment />);

    expect(await screen.findByText('I understand')).toBeInTheDocument();

    // See FirstLaunchAcknowledgment.notYetAcknowledged.test.tsx for why this unmount + settle
    // is needed whenever a test leaves the modal genuinely open.
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});

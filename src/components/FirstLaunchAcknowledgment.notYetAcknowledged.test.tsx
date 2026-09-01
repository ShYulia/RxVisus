import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import FirstLaunchAcknowledgment from './FirstLaunchAcknowledgment';

// Each of this component's three behaviors lives in its own file (not one describe block) —
// Ionic's overlay controller keeps global module-scoped state for presented ion-modals that
// outlives a React unmount, so mounting a real, open modal more than once in the same test file
// corrupts later tests' overlay bookkeeping. A fresh Vitest file gets a fresh module registry,
// which sidesteps that entirely.
vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: vi.fn(), set: vi.fn() },
}));

describe('FirstLaunchAcknowledgment', () => {
  it('shows all four required statements and "I understand" when not yet acknowledged', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: null });
    const { unmount } = render(<FirstLaunchAcknowledgment />);

    expect(await screen.findByText('I understand')).toBeInTheDocument();
    expect(screen.getByText(/qualified eye-care professionals/)).toBeInTheDocument();
    expect(screen.getByText(/not a diagnostic device/)).toBeInTheDocument();
    expect(screen.getByText(/independently verified/)).toBeInTheDocument();
    expect(screen.getByText(/remain responsible for diagnosis, management, and treatment decisions/)).toBeInTheDocument();

    // This test leaves the modal genuinely open (never acknowledged) — unmount explicitly, then
    // give Ionic's overlay controller a moment to finish its own async cleanup chain (triggered
    // by the unmount) while jsdom's `document` still exists, rather than having it reject after
    // this file's environment has already torn down.
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});

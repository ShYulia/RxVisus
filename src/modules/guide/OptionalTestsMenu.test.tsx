import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import OptionalTestsMenu, { type OptionalTestsMenuProps } from './OptionalTestsMenu';

function renderMenu(props: OptionalTestsMenuProps) {
  return render(
    <MemoryRouter>
      <OptionalTestsMenu {...props} />
    </MemoryRouter>,
  );
}

const RECOMMENDING_FINDINGS = {
  'distancePhoria.type': 'eso',
  'distancePhoria.amount': '2',
  'nearPhoria.type': 'exo',
  'nearPhoria.amount': '6',
  'stereoacuity.value': '40 arc sec',
};

const OPTIONS = [
  { label: 'Distance Fusional Vergence', stepId: 'distance-vergence' },
  { label: 'Gradient AC/A', stepId: 'aca-gradient' },
  { label: 'NRA / PRA', stepId: 'nra-pra' },
  { label: 'Vergence Facility', stepId: 'vergence-facility-gate' },
  { label: 'MEM / Nott Retinoscopy', stepId: 'mem-nott' },
  { label: 'Stereoacuity', stepId: 'stereoacuity' },
];

describe('OptionalTestsMenu', () => {
  it('shows "no additional targeted testing indicated" when nothing points to a specific test', () => {
    renderMenu({ options: OPTIONS, findings: { symptoms: 'none' }, onSelect: () => {}, onSkip: () => {} });
    expect(screen.getByText('No additional targeted testing indicated')).toBeInTheDocument();
  });

  it('recommends a specific test with a one-sentence reason and a Perform action, when findings point to it', () => {
    renderMenu({ options: OPTIONS, findings: RECOMMENDING_FINDINGS, onSelect: () => {}, onSkip: () => {} });
    expect(screen.getByText('Targeted testing may help')).toBeInTheDocument();
    expect(screen.getByText('Gradient AC/A')).toBeInTheDocument();
    expect(screen.getByText(/help characterize the accommodative contribution/)).toBeInTheDocument();
    expect(screen.getByText('Perform Gradient AC/A')).toBeInTheDocument();
  });

  it('selecting the recommended test navigates to its step', async () => {
    const onSelect = vi.fn();
    renderMenu({ options: OPTIONS, findings: RECOMMENDING_FINDINGS, onSelect, onSkip: () => {} });
    await userEvent.click(screen.getByText('Perform Gradient AC/A'));
    expect(onSelect).toHaveBeenCalledWith(OPTIONS.find((o) => o.stepId === 'aca-gradient'));
  });

  it('Continue to Summary is always available and skippable', async () => {
    const onSkip = vi.fn();
    renderMenu({ options: OPTIONS, findings: {}, onSelect: () => {}, onSkip });
    await userEvent.click(screen.getByText('Continue to Summary'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('keeps every non-recommended test reachable behind "Other / additional tests"', () => {
    renderMenu({ options: OPTIONS, findings: RECOMMENDING_FINDINGS, onSelect: () => {}, onSkip: () => {} });
    expect(screen.getByText('Other / additional tests')).toBeInTheDocument();
    // The recommended test (Gradient AC/A) should not also appear in the "other" list.
    const otherSection = screen.getByText('Other / additional tests').closest('details')!;
    expect(otherSection.textContent).not.toContain('Gradient AC/A');
    expect(otherSection.textContent).toContain('NRA / PRA');
  });

  it('does not recommend extra testing just because a value is missing, when core findings already form a clear picture', () => {
    renderMenu({ options: OPTIONS, findings: { symptoms: 'none', 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho' }, onSelect: () => {}, onSkip: () => {} });
    expect(screen.getByText('No additional targeted testing indicated')).toBeInTheDocument();
    expect(screen.queryByText('Targeted testing may help')).not.toBeInTheDocument();
  });
});

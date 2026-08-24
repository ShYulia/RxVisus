import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import OptionalTestsMenu from './OptionalTestsMenu';

const OPTIONS = [
  { label: 'Distance Fusional Vergence', stepId: 'distance-vergence' },
  { label: 'Gradient AC/A', stepId: 'aca-gradient' },
];

describe('OptionalTestsMenu', () => {
  it('is skippable straight to the Summary without picking any test', async () => {
    const onSkip = vi.fn();
    render(<OptionalTestsMenu options={OPTIONS} findings={{}} onSelect={() => {}} onSkip={onSkip} />);
    await userEvent.click(screen.getByText('Skip to Summary'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('navigates to the chosen optional test', async () => {
    const onSelect = vi.fn();
    render(<OptionalTestsMenu options={OPTIONS} findings={{}} onSelect={onSelect} onSkip={() => {}} />);
    await userEvent.click(screen.getByText('Gradient AC/A'));
    expect(onSelect).toHaveBeenCalledWith(OPTIONS[1]);
  });

  it('shows a context-aware hint when symptoms are unexplained by core findings', () => {
    render(<OptionalTestsMenu options={OPTIONS} findings={{ symptoms: 'nearStrain', 'npc.break': '5' }} onSelect={() => {}} onSkip={() => {}} />);
    expect(screen.getByText(/additional vergence testing/)).toBeInTheDocument();
  });

  it('shows no hints when nothing is notable', () => {
    render(<OptionalTestsMenu options={OPTIONS} findings={{ symptoms: 'none' }} onSelect={() => {}} onSkip={() => {}} />);
    expect(screen.queryByText(/additional vergence testing/)).not.toBeInTheDocument();
  });
});

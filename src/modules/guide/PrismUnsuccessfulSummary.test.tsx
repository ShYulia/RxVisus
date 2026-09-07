import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { BestCorrection, PrismMeasurement } from '../../domain/reference/prismMeasurement';
import PrismUnsuccessfulSummary from './PrismUnsuccessfulSummary';

const BEST_CORRECTION: BestCorrection = {
  od: { sphere: -2, cylinder: -1, axis: 90 },
  os: { sphere: -1.5, cylinder: 0, axis: NaN },
};

function renderSummary(measurement: PrismMeasurement, extra: Partial<React.ComponentProps<typeof PrismUnsuccessfulSummary>> = {}) {
  return render(
    <PrismUnsuccessfulSummary
      title="Trial prism provided partial relief"
      message="Trial prism improved symptoms but did not provide comfortable single vision."
      guidance={[
        'Reassess ocular alignment and motility, including comitancy.',
        'Consider further ophthalmic or neuro-ophthalmic evaluation when clinically indicated. Follow the urgent-referral pathway if red flags are present.',
      ]}
      measurement={measurement}
      bestCorrection={BEST_CORRECTION}
      trialOutcomeLabel="Improved but not fully comfortable"
      {...extra}
    />,
  );
}

describe('PrismUnsuccessfulSummary', () => {
  it('shows the title, message, status, Best Correction, and Trial Prism immediately — nothing hidden', () => {
    renderSummary({ horizontal: { amount: 6, base: 'BO', eye: 'OD' } });

    expect(screen.getByText('Trial prism provided partial relief')).toBeInTheDocument();
    expect(screen.getByText('Trial prism improved symptoms but did not provide comfortable single vision.')).toBeInTheDocument();
    expect(screen.getByText('Prism prescription not finalized')).toBeInTheDocument();
    expect(screen.getByText('Best Correction')).toBeInTheDocument();
    expect(screen.getByText('-2.00 / -1.00 x 90')).toBeInTheDocument();
    expect(screen.getByText('-1.50')).toBeInTheDocument();
    expect(screen.getByText('Trial Prism')).toBeInTheDocument();
    expect(screen.getByText('6.00Δ BO')).toBeInTheDocument();
  });

  it('shows "No prism trialled" for an eye with no recorded component', () => {
    renderSummary({ horizontal: { amount: 6, base: 'BO', eye: 'OD' } });
    expect(screen.getByText('No prism trialled')).toBeInTheDocument();
  });

  it('groups both horizontal and vertical chips under the same eye when both were measured there', () => {
    renderSummary({ horizontal: { amount: 6, base: 'BO', eye: 'OD' }, vertical: { amount: 2, base: 'BU', eye: 'OD' } });
    expect(screen.getByText('6.00Δ BO')).toBeInTheDocument();
    expect(screen.getByText('2.00Δ BU')).toBeInTheDocument();
    expect(screen.getByText('No prism trialled')).toBeInTheDocument(); // OS has neither
  });

  it('Clinical Considerations and All Measurements are both collapsed by default — the clinician sees measurements only after tapping "All Measurements"', () => {
    renderSummary({ horizontal: { amount: 6, base: 'BO', eye: 'OD' } });

    expect(screen.queryByText('Reassess ocular alignment and motility, including comitancy.')).not.toBeInTheDocument();
    expect(screen.queryByText('Measured/trialled:')).not.toBeInTheDocument();
    expect(screen.queryByText('Outcome:')).not.toBeInTheDocument();
    expect(screen.getByText('Clinical Considerations')).toBeInTheDocument();
    expect(screen.getByText('All Measurements')).toBeInTheDocument();
  });

  it('expands Clinical Considerations on tap to reveal next-step guidance, as a bullet list', async () => {
    renderSummary({ horizontal: { amount: 6, base: 'BO', eye: 'OD' } });
    await userEvent.click(screen.getByText('Clinical Considerations'));
    expect(screen.getByText('Reassess ocular alignment and motility, including comitancy.')).toBeInTheDocument();
    expect(
      screen.getByText('Consider further ophthalmic or neuro-ophthalmic evaluation when clinically indicated. Follow the urgent-referral pathway if red flags are present.'),
    ).toBeInTheDocument();
  });

  it('never repeats or paraphrases the outcome statement inside Clinical Considerations — the outcome stays in the primary card only', async () => {
    renderSummary({ horizontal: { amount: 6, base: 'BO', eye: 'OD' } });
    const trigger = screen.getByText('Clinical Considerations');
    await userEvent.click(trigger);
    const disclosure = trigger.closest('.rx-summary-compact')!;
    expect(within(disclosure as HTMLElement).queryByText('Trial prism improved symptoms but did not provide comfortable single vision.')).not.toBeInTheDocument();
    expect(within(disclosure as HTMLElement).queryByText(/partial but incomplete symptom relief/i)).not.toBeInTheDocument();
    expect(within(disclosure as HTMLElement).queryByText(/did not provide meaningful symptomatic relief/i)).not.toBeInTheDocument();
  });

  it('expands All Measurements on tap to reveal measured/trialled detail and the trial outcome', async () => {
    renderSummary({ horizontal: { amount: 6, base: 'BO', eye: 'OD' } });
    await userEvent.click(screen.getByText('All Measurements'));
    expect(screen.getByText('6.00Δ BO OD')).toBeInTheDocument();
    expect(screen.getByText('Improved but not fully comfortable')).toBeInTheDocument();
  });
});

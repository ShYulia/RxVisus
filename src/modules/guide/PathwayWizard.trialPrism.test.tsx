import { fireEvent, render, screen, within } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { sharedPrismSteps, type ClinicalPathwayNode } from '../../domain/reference/clinicalPathways';
import PathwayWizard from './PathwayWizard';

/**
 * Exercises the shared Measure -> Trial Prism -> Final Rx flow directly (the same step objects
 * Diplopia and Strabismus both reuse — see clinicalPathways.test.ts's identity check) instead of
 * re-walking either pathway's full history/exam question tree, which is irrelevant to what's
 * under test here: the trial-outcome branching itself.
 */
const TEST_NODE: ClinicalPathwayNode = { id: 'test-trial-prism', title: 'Test Trial Prism', kind: 'leaf', steps: sharedPrismSteps };

function renderWizard() {
  return render(
    <IonApp>
      <IonReactRouter>
        <PathwayWizard node={TEST_NODE} />
      </IonReactRouter>
    </IonApp>,
  );
}

/** Clicks a choice button in the current question step, scoped there to avoid matching the same label in the breadcrumb trail. */
async function clickChoice(label: string) {
  const choices = document.querySelector('.rx-wizard-choices');
  await userEvent.click(within(choices as HTMLElement).getByText(label));
}

/** Sets the `index`-th ion-input labeled `label` via its custom `ionInput` event, bypassing shadow-DOM keystroke simulation. */
function setValueAt(label: string, index: number, value: string) {
  const fieldBox = screen.getAllByText(label)[index].closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent(ionInput, new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }));
}

/** Walks best-correction (a plano-ish Rx is enough to unblock Continue) -> measure -> record-measurement -> submits a 6Δ BO OD horizontal measurement, landing on the 'trial' step. */
async function reachTrialStep() {
  setValueAt('SPH', 0, '-2.00'); // OD
  setValueAt('SPH', 1, '-2.00'); // OS
  await userEvent.click(screen.getByText('Continue')); // best-correction -> measure

  await clickChoice('Enter measurement'); // measure -> record-measurement

  setValueAt('Amount', 0, '6'); // horizontal amount
  await userEvent.click(screen.getByText('BO')); // horizontal base (BI/BO only appears for horizontal)
  await userEvent.click(screen.getAllByText('OD')[0]); // horizontal eye (first Eye selector in the DOM)
  await userEvent.click(screen.getByText('Continue')); // record-measurement -> trial
}

describe('PathwayWizard — trial-prism outcome (no forced reassessment loop)', () => {
  it('"Improved but not fully comfortable" hands the decision to the clinician instead of auto-routing back to Record Measurement', async () => {
    renderWizard();
    await reachTrialStep();

    await clickChoice('Improved but not fully comfortable');

    // The clinician lands on an explicit choice step, not directly back on the measurement form.
    expect(screen.getByText('Trial prism gave partial but incomplete symptom relief. What would you like to do?')).toBeTruthy();
    expect(screen.queryByText('Horizontal')).toBeNull();
    expect(screen.getByText('Reassess / adjust trial prism')).toBeTruthy();
    expect(screen.getByText('Finish assessment')).toBeTruthy();
  });

  it('"Reassess / adjust trial prism" is the only path back to Record Measurement, and it is clinician-initiated', async () => {
    renderWizard();
    await reachTrialStep();
    await clickChoice('Improved but not fully comfortable');

    await clickChoice('Reassess / adjust trial prism');

    // Back on the measurement form — reached only because the clinician chose it.
    expect(screen.getByText('Horizontal')).toBeTruthy();
    expect(screen.getByText('Vertical')).toBeTruthy();
  });

  it('re-submitting a measurement after Reassess returns to the trial step (not back into the partial-improvement choice) — one-way flow, no loop', async () => {
    renderWizard();
    await reachTrialStep();
    await clickChoice('Improved but not fully comfortable');
    await clickChoice('Reassess / adjust trial prism');

    setValueAt('Amount', 0, '4');
    await userEvent.click(screen.getByText('BI'));
    await userEvent.click(screen.getAllByText('OS')[0]);
    await userEvent.click(screen.getByText('Continue'));

    expect(screen.getByText('With best correction + trial prism:')).toBeTruthy();
    expect(screen.queryByText('Trial prism gave partial but incomplete symptom relief. What would you like to do?')).toBeNull();
  });

  it('"Finish assessment" ends the flow on the unsuccessful-trial card, without requiring another measurement', async () => {
    renderWizard();
    await reachTrialStep();
    await clickChoice('Improved but not fully comfortable');

    await clickChoice('Finish assessment');

    expect(screen.getByText('Trial prism provided partial relief')).toBeTruthy();
    expect(screen.getByText('Trial prism improved symptoms but did not provide comfortable single vision.')).toBeTruthy();
    expect(screen.getByText('Prism prescription not finalized')).toBeTruthy();
    expect(screen.queryByText('Horizontal')).toBeNull();
    // Next-step guidance is present, but only inside the closed-by-default disclosure — and it
    // never repeats the outcome statement already shown above in the primary card.
    expect(screen.queryByText('Reassess ocular alignment and motility, including comitancy.')).toBeNull();
    await userEvent.click(screen.getByText('Clinical Considerations'));
    expect(screen.getByText('Reassess ocular alignment and motility, including comitancy.')).toBeTruthy();
    expect(
      screen.getByText('Consider further ophthalmic or neuro-ophthalmic evaluation when clinically indicated. Follow the urgent-referral pathway if red flags are present.'),
    ).toBeTruthy();
    expect(screen.queryByText(/partial but incomplete symptom relief/i)).toBeNull();
  });

  it('"No meaningful improvement" ends the flow immediately on the unsuccessful-trial card — no forced measurement loop', async () => {
    renderWizard();
    await reachTrialStep();

    await clickChoice('No meaningful improvement');

    expect(screen.getByText('Trial prism did not provide meaningful benefit')).toBeTruthy();
    expect(screen.getByText('Trial prism did not improve symptoms or provide comfortable single vision.')).toBeTruthy();
    expect(screen.getByText('Prism prescription not finalized')).toBeTruthy();
    expect(screen.queryByText('Horizontal')).toBeNull();
    expect(screen.queryByText('Trial prism gave partial but incomplete symptom relief. What would you like to do?')).toBeNull();
    expect(screen.queryByText('Reassess ocular alignment and motility, including comitancy.')).toBeNull();
    await userEvent.click(screen.getByText('Clinical Considerations'));
    expect(screen.getByText('Reassess ocular alignment and motility, including comitancy.')).toBeTruthy();
    expect(
      screen.getByText('Consider further ophthalmic or neuro-ophthalmic evaluation when clinically indicated. Follow the urgent-referral pathway if red flags are present.'),
    ).toBeTruthy();
    expect(screen.queryByText(/did not provide meaningful symptomatic relief — reassess/i)).toBeNull();
  });

  it('"Single comfortable vision" is unaffected by the partial-improvement change and still reaches Final Rx directly', async () => {
    renderWizard();
    await reachTrialStep();

    await clickChoice('Single comfortable vision');

    expect(screen.getByText('Final Rx')).toBeTruthy();
  });
});

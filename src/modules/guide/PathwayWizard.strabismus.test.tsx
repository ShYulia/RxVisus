import { fireEvent, render, screen, within } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getPathwayNode } from '../../domain/reference/clinicalPathways';
import PathwayWizard from './PathwayWizard';

/**
 * Regression coverage for the Strabismus pathway restructuring: known findings persist and are
 * reused instead of being re-asked, existing prism is tracked separately from the trial prism,
 * incomitancy is a card-based choice instead of a passive Continue-only screen, and Worth 4 Dot
 * is skippable. Walks the real 'strabismus' node (not a synthetic stand-in), since the whole
 * point here is the actual step graph and its state wiring in PathwayWizard.
 */
function renderStrabismus() {
  const node = getPathwayNode('strabismus')!;
  return render(
    <IonApp>
      <IonReactRouter>
        <PathwayWizard node={node} />
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

/**
 * Walks onset(Long-standing, never red-flagged either way) -> diplopia -> VA (skipped, not
 * required) -> which-eye(OD) -> prior-prism -> [prior-prism-measurement/comfort, if given] ->
 * cover-test(Eso), landing right before the gaze-dependence question.
 */
async function reachGazeDependence(diplopia: 'Yes' | 'Sometimes' | 'No', priorPrism?: { amount: string; base: string; eye: 'OD' | 'OS' }) {
  await clickChoice('Long-standing');
  await clickChoice(diplopia);
  await userEvent.click(screen.getByText('Continue')); // Best-corrected VA — no required fields
  await clickChoice('OD'); // which-eye

  if (priorPrism) {
    await clickChoice('Yes'); // prior-prism
    setValueAt('Amount', 0, priorPrism.amount);
    await userEvent.click(screen.getByText(priorPrism.base));
    await userEvent.click(screen.getAllByText(priorPrism.eye)[0]);
    await userEvent.click(screen.getByText('Continue')); // submit existing-prism MeasurementForm
    await clickChoice('No'); // prior-prism-comfort
  } else {
    await clickChoice('No'); // prior-prism: none
  }

  await clickChoice('Eso'); // cover-test
}

/** Continues from gaze-dependence through a comitant finding, Worth 4 Dot (Fusion), landing on whatever comes next (either 'symptom-check' or, if diplopia is already known, straight through to 'best-correction'). */
async function reachAfterSensoryCheck(diplopia: 'Yes' | 'Sometimes' | 'No', priorPrism?: { amount: string; base: string; eye: 'OD' | 'OS' }) {
  await reachGazeDependence(diplopia, priorPrism);
  await clickChoice('No'); // gaze-dependence: comitant
  await clickChoice('Fusion'); // sensory-check (Worth 4 Dot)
}

describe('Strabismus pathway — known findings are reused, not re-asked', () => {
  it('diplopia already "Yes" at intake: "symptom-check" is skipped entirely, landing straight on Best Refractive Correction', async () => {
    renderStrabismus();
    await reachAfterSensoryCheck('Yes');

    expect(screen.getByText('Best Refractive Correction')).toBeInTheDocument();
    expect(screen.queryByText('Diplopia was not reported at intake — has testing elicited or revealed diplopia (e.g. on cover test or sensory testing)?')).not.toBeInTheDocument();
  });

  it('diplopia already "Sometimes" at intake also skips the redundant re-ask', async () => {
    renderStrabismus();
    await reachAfterSensoryCheck('Sometimes');
    expect(screen.getByText('Best Refractive Correction')).toBeInTheDocument();
  });

  it('diplopia "No" at intake: the re-ask is shown, but reworded as a testing-elicited question, not a repeat of the intake question', async () => {
    renderStrabismus();
    await reachAfterSensoryCheck('No');

    expect(screen.getByText('Diplopia was not reported at intake — has testing elicited or revealed diplopia (e.g. on cover test or sensory testing)?')).toBeInTheDocument();
    expect(screen.queryByText('Does the patient currently experience diplopia?')).not.toBeInTheDocument();
  });

  it('answering "Yes" to the reworded testing-elicited question still proceeds to Best Refractive Correction', async () => {
    renderStrabismus();
    await reachAfterSensoryCheck('No');
    await clickChoice('Yes');
    expect(screen.getByText('Best Refractive Correction')).toBeInTheDocument();
  });

  it('answering "No" to the reworded question ends the assessment without forcing a prism trial', async () => {
    renderStrabismus();
    await reachAfterSensoryCheck('No');
    await clickChoice('No');
    expect(
      screen.getByText('No diplopia reported or elicited — prism is not indicated based on findings so far. Continue routine management; reassess if symptoms change.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Best Refractive Correction')).not.toBeInTheDocument();
  });
});

describe('Strabismus pathway — Best-corrected VA and Best Refractive Correction stay distinct', () => {
  it('Best-corrected VA is asked once, unchanged, with OD/OS free-text fields', async () => {
    renderStrabismus();
    await clickChoice('Long-standing');
    await clickChoice('Yes');
    expect(screen.getByText('Best-corrected VA')).toBeInTheDocument();
    expect(screen.getAllByText('OD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('OS').length).toBeGreaterThan(0);
  });

  it('Best Refractive Correction is a separate, later step with its own clarifying helper text', async () => {
    renderStrabismus();
    await reachAfterSensoryCheck('Yes');
    expect(screen.getByText('Best Refractive Correction')).toBeInTheDocument();
    expect(screen.getByText('Enter the refractive correction used for binocular testing and prism trial.')).toBeInTheDocument();
    expect(screen.queryByText("Patient's best correction")).not.toBeInTheDocument();
  });
});

describe('Strabismus pathway — existing prism persists separately from the trial prism', () => {
  it('an existing prism recorded at intake is shown as context on the Trial step, distinct from the newly measured/proposed prism', async () => {
    renderStrabismus();
    await reachAfterSensoryCheck('Yes', { amount: '3', base: 'BI', eye: 'OD' });

    // Best Refractive Correction
    setValueAt('SPH', 0, '-2.00');
    setValueAt('SPH', 1, '-2.00');
    await userEvent.click(screen.getByText('Continue'));

    // Measure -> record a NEW, different deviation
    const measureChoice = document.querySelector('.rx-wizard-choices') as HTMLElement;
    await userEvent.click(within(measureChoice).getByText('Enter measurement'));
    setValueAt('Amount', 0, '4');
    await userEvent.click(screen.getByText('BO'));
    await userEvent.click(screen.getAllByText('OS')[0]);
    await userEvent.click(screen.getByText('Continue'));

    expect(screen.getByText('Currently wearing: 3.00Δ BI OD')).toBeInTheDocument();
    expect(screen.getByText('Proposed prism: 4.00Δ BO OS')).toBeInTheDocument();
  });

  it('measuring a new trial prism never overwrites the existing prism value', async () => {
    renderStrabismus();
    await reachAfterSensoryCheck('Yes', { amount: '3', base: 'BI', eye: 'OD' });
    setValueAt('SPH', 0, '-2.00');
    setValueAt('SPH', 1, '-2.00');
    await userEvent.click(screen.getByText('Continue'));
    const measureChoice = document.querySelector('.rx-wizard-choices') as HTMLElement;
    await userEvent.click(within(measureChoice).getByText('Enter measurement'));
    setValueAt('Amount', 0, '4');
    await userEvent.click(screen.getByText('BO'));
    await userEvent.click(screen.getAllByText('OS')[0]);
    await userEvent.click(screen.getByText('Continue'));

    // Still both present and distinct — the existing 3Δ BI OD was never replaced by the new 4Δ BO OS.
    expect(screen.getByText('Currently wearing: 3.00Δ BI OD')).toBeInTheDocument();
    expect(screen.getByText('Proposed prism: 4.00Δ BO OS')).toBeInTheDocument();
  });

  it('no existing prism recorded at all: the Trial step shows only the proposed prism, with no stray "Currently wearing" line', async () => {
    renderStrabismus();
    await reachAfterSensoryCheck('Yes');
    setValueAt('SPH', 0, '-2.00');
    setValueAt('SPH', 1, '-2.00');
    await userEvent.click(screen.getByText('Continue'));
    const measureChoice = document.querySelector('.rx-wizard-choices') as HTMLElement;
    await userEvent.click(within(measureChoice).getByText('Enter measurement'));
    setValueAt('Amount', 0, '4');
    await userEvent.click(screen.getByText('BO'));
    await userEvent.click(screen.getAllByText('OS')[0]);
    await userEvent.click(screen.getByText('Continue'));

    expect(screen.queryByText(/Currently wearing/)).not.toBeInTheDocument();
    expect(screen.getByText('Proposed prism: 4.00Δ BO OS')).toBeInTheDocument();
  });
});

describe('Strabismus pathway — incomitancy is a card-based choice, not a passive Continue-only screen', () => {
  it('an incomitant finding shows an inline warning card with two real choices', async () => {
    renderStrabismus();
    await reachGazeDependence('Yes');
    await clickChoice('Yes'); // gaze-dependence: incomitant

    expect(screen.getByText('Incomitant deviation')).toBeInTheDocument();
    expect(
      screen.getByText('The deviation varies with gaze direction — a single fixed prism may not provide comfortable single vision in every gaze position.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Continue prism trial')).toBeInTheDocument();
    expect(screen.getByText('Finish / further evaluation')).toBeInTheDocument();
  });

  it('"Continue prism trial" proceeds into the normal exam flow (Worth 4 Dot) without forcing anything extra', async () => {
    renderStrabismus();
    await reachGazeDependence('Yes');
    await clickChoice('Yes');
    await clickChoice('Continue prism trial');
    expect(screen.getByText('Worth 4 Dot result?')).toBeInTheDocument();
  });

  it('"Finish / further evaluation" ends the assessment with a general recommendation — no auto-diagnosis, no forced neurology referral, no prism trial', async () => {
    renderStrabismus();
    await reachGazeDependence('Yes');
    await clickChoice('Yes');
    await clickChoice('Finish / further evaluation');

    expect(screen.getByText('Consider further evaluation of ocular motility and the underlying cause of incomitancy, based on the clinical findings.')).toBeInTheDocument();
    expect(screen.queryByText(/neurolog/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Best Refractive Correction')).not.toBeInTheDocument();
  });

  it('existing red-flag logic still takes priority and is unaffected by the incomitancy restructuring', async () => {
    renderStrabismus();
    await clickChoice('New/recent'); // onset
    await clickChoice('Yes'); // diplopia-check-new: red flag
    expect(screen.getByText('Urgent assessment may be indicated')).toBeInTheDocument();
    expect(screen.getByText('New/recent strabismus with diplopia — consider urgent medical/neuro-ophthalmic assessment.')).toBeInTheDocument();
  });
});

describe('Strabismus pathway — Worth 4 Dot is skippable, and optional supporting tests never block progression', () => {
  it('Worth 4 Dot offers a Skip option, which proceeds without recording a sensory finding', async () => {
    renderStrabismus();
    await reachGazeDependence('Yes');
    await clickChoice('No'); // comitant
    expect(screen.getByText('Worth 4 Dot result?')).toBeInTheDocument();
    await clickChoice('Skip');
    // Diplopia already known ('Yes') -> skips straight through to Best Refractive Correction.
    expect(screen.getByText('Best Refractive Correction')).toBeInTheDocument();
  });

  it('Double Maddox Rod is offered as a non-blocking reference chip on the incomitancy card, never a mandatory step', async () => {
    renderStrabismus();
    await reachGazeDependence('Yes');
    await clickChoice('Yes'); // incomitant
    expect(screen.getByText('Double Maddox Rod')).toBeInTheDocument();
    // The chip doesn't prevent proceeding via either real choice.
    await clickChoice('Continue prism trial');
    expect(screen.getByText('Worth 4 Dot result?')).toBeInTheDocument();
  });
});

describe('Strabismus pathway — the validated prism trial outcomes still work end to end', () => {
  async function reachTrial() {
    await reachAfterSensoryCheck('Yes');
    setValueAt('SPH', 0, '-2.00');
    setValueAt('SPH', 1, '-2.00');
    await userEvent.click(screen.getByText('Continue')); // best-correction -> measure
    const measureChoice = document.querySelector('.rx-wizard-choices') as HTMLElement;
    await userEvent.click(within(measureChoice).getByText('Enter measurement'));
    setValueAt('Amount', 0, '6');
    await userEvent.click(screen.getByText('BO'));
    await userEvent.click(screen.getAllByText('OD')[0]);
    await userEvent.click(screen.getByText('Continue')); // record-measurement -> trial
  }

  it('"Single comfortable vision" still reaches the successful Final Rx screen', async () => {
    renderStrabismus();
    await reachTrial();
    await clickChoice('Single comfortable vision');
    expect(screen.getByText('Final Rx')).toBeInTheDocument();
  });

  it('"Improved but not fully comfortable" -> "Finish assessment" still reaches the partial-relief endpoint', async () => {
    renderStrabismus();
    await reachTrial();
    await clickChoice('Improved but not fully comfortable');
    await clickChoice('Finish assessment');
    expect(screen.getByText('Trial prism provided partial relief')).toBeInTheDocument();
  });

  it('"No meaningful improvement" still reaches the unsuccessful endpoint', async () => {
    renderStrabismus();
    await reachTrial();
    await clickChoice('No meaningful improvement');
    expect(screen.getByText('Trial prism did not provide meaningful benefit')).toBeInTheDocument();
  });

  it('no entered clinical data is silently lost by the time Final Rx is reached: best correction and the trial prism both appear correctly', async () => {
    renderStrabismus();
    await reachTrial();
    await clickChoice('Single comfortable vision');

    expect(screen.getAllByText('-2.00')).toHaveLength(2); // OD/OS best correction sphere, both -2.00
    expect(screen.getAllByText('3.00Δ BO')).toHaveLength(2); // half of the measured 6Δ BO, split evenly to both eyes
  });

  it('no undefined/NaN values appear anywhere on the Final Rx or unsuccessful-trial screens', async () => {
    renderStrabismus();
    await reachTrial();
    await clickChoice('Single comfortable vision');
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('no undefined/NaN values appear on the unsuccessful (no-improvement) screen either', async () => {
    renderStrabismus();
    await reachTrial();
    await clickChoice('No meaningful improvement');
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});

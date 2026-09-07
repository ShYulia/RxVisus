import { fireEvent, render, screen, within } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { sharedPrismSteps, type ClinicalPathwayNode } from '../../domain/reference/clinicalPathways';
import PathwayWizard from './PathwayWizard';

/**
 * Assessment History must always render last — below the current step's own content and its
 * primary action/Continue button — never above or between them, on every step kind in the
 * flow (intermediate question/form steps and terminal steps alike). Reuses the same shared
 * Measure -> Trial Prism -> Final Rx steps Diplopia and Strabismus both walk (see
 * clinicalPathways.test.ts's identity check), so this exercises the real production steps.
 */
const TEST_NODE: ClinicalPathwayNode = { id: 'test-history-placement', title: 'Test History Placement', kind: 'leaf', steps: sharedPrismSteps };

function renderWizard() {
  return render(
    <IonApp>
      <IonReactRouter>
        <PathwayWizard node={TEST_NODE} />
      </IonReactRouter>
    </IonApp>,
  );
}

function setValueAt(label: string, index: number, value: string) {
  const fieldBox = screen.getAllByText(label)[index].closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent(ionInput, new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }));
}

/** Asserts `earlier` appears before `later` in document order (i.e. rendered visually above it in normal flow). */
function expectAppearsBefore(earlier: Element, later: Element) {
  // eslint-disable-next-line no-bitwise
  expect(Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
}

async function reachTrialStep() {
  setValueAt('SPH', 0, '-2.00');
  setValueAt('SPH', 1, '-2.00');
  await userEvent.click(screen.getByText('Continue')); // best-correction -> measure

  const measureChoice = document.querySelector('.rx-wizard-choices')!;
  await userEvent.click(measureChoice.querySelector('button')!); // measure -> record-measurement

  setValueAt('Amount', 0, '6');
  await userEvent.click(screen.getByText('BO'));
  await userEvent.click(screen.getAllByText('OD')[0]);
  await userEvent.click(screen.getByText('Continue')); // record-measurement -> trial
}

describe('PathwayWizard — Assessment History placement', () => {
  it('on an intermediate question step, the breadcrumb trail renders after the step content and its choice buttons, never before or between them', async () => {
    renderWizard();
    await reachTrialStep();

    const question = screen.getByText('With best correction + trial prism:');
    const choices = document.querySelector('.rx-wizard-choices')!;
    const trail = document.querySelector('.rx-wizard-trail')!;

    expect(trail).toBeTruthy();
    expectAppearsBefore(question, trail);
    expectAppearsBefore(choices, trail);
  });

  it('on the record-measurement step, the breadcrumb trail renders after the measurement form and its Continue button', async () => {
    renderWizard();
    setValueAt('SPH', 0, '-2.00');
    setValueAt('SPH', 1, '-2.00');
    await userEvent.click(screen.getByText('Continue'));
    const measureChoice = document.querySelector('.rx-wizard-choices')!;
    await userEvent.click(measureChoice.querySelector('button')!);

    const measurementForm = document.querySelector('.rx-measurement-form')!;
    const continueButton = screen.getByText('Continue');
    const trail = document.querySelector('.rx-wizard-trail')!;

    expect(trail).toBeTruthy();
    expectAppearsBefore(measurementForm, trail);
    expectAppearsBefore(continueButton, trail);
  });

  it('on the terminal Final Rx step, the collapsed Assessment History disclosure renders after the Final Rx card and the New Patient / Back to Clinical Guide actions', async () => {
    renderWizard();
    await reachTrialStep();
    const choices = document.querySelector('.rx-wizard-choices') as HTMLElement;
    await userEvent.click(within(choices).getByText('Single comfortable vision'));

    const finalRxCard = document.querySelector('.rx-summary-result-card')!;
    const terminalActions = document.querySelector('.rx-terminal-actions')!;
    const trail = document.querySelector('.rx-wizard-trail-collapsed')!;

    expect(finalRxCard).toBeTruthy();
    expect(terminalActions).toBeTruthy();
    expect(trail).toBeTruthy();
    expectAppearsBefore(finalRxCard, trail);
    expectAppearsBefore(terminalActions, trail);
  });
});

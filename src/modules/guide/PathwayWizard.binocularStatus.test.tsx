import { fireEvent, render, screen, within } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getPathwayNode } from '../../domain/reference/clinicalPathways';
import PathwayWizard from './PathwayWizard';

function renderWizard() {
  const node = getPathwayNode('binocular-status')!;
  return render(
    <IonApp>
      <IonReactRouter>
        <PathwayWizard node={node} />
      </IonReactRouter>
    </IonApp>,
  );
}

/** Clicks a choice button in the current question/menu step's choice list, scoped there to avoid matching the same label in the breadcrumb trail. */
async function clickChoice(label: string) {
  const choices = document.querySelector('.rx-wizard-choices');
  await userEvent.click(within(choices as HTMLElement).getByText(label));
}

/** Clicks Continue on the current text-entry step without filling in any field — only valid for steps with no required fields (e.g. age). */
async function skipTextEntry() {
  await userEvent.click(screen.getByText('Continue'));
}

/** Sets an ion-input's value directly via its custom `ionInput` event, bypassing shadow-DOM keystroke simulation. Scoped by the field's label text. */
function setValue(label: string, value: string) {
  const fieldBox = screen.getByText(label).closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent(ionInput, new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }));
}

/** Fills the NPC step's Break (cm) / Recovery (cm) fields — both required. */
async function fillNpc(breakValue: string, recoveryValue: string) {
  setValue('Break (cm)', breakValue);
  setValue('Recovery (cm)', recoveryValue);
}

/** Fills the near/distance fusional vergence step's six BI/BO fields (all required; blur can be "No blur" instead). */
async function fillVergenceRanges() {
  const breaks = screen.getAllByText('Break');
  const recoveries = screen.getAllByText('Recovery');
  const blurs = screen.getAllByText('Blur');
  fireEvent(blurs[0].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '12' }, bubbles: true, composed: true }));
  fireEvent(breaks[0].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '18' }, bubbles: true, composed: true }));
  fireEvent(recoveries[0].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '12' }, bubbles: true, composed: true }));
  fireEvent(blurs[1].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '18' }, bubbles: true, composed: true }));
  fireEvent(breaks[1].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '24' }, bubbles: true, composed: true }));
  fireEvent(recoveries[1].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '16' }, bubbles: true, composed: true }));
}

/** Walks entry -> age -> symptoms -> distance/near phoria (all Ortho) -> NPC -> MAF, i.e. every core screening step shared by both entry paths. */
async function completeCoreScreening(entry: 'Quick Screen' | 'Full Assessment', symptomChoice: 'No symptoms' | 'Headache with visual work') {
  await clickChoice(entry);
  await skipTextEntry(); // age (context field, never required)

  await clickChoice(symptomChoice);
  await userEvent.click(screen.getByText('Continue'));

  await clickChoice('Ortho'); // distance phoria
  await clickChoice('Ortho'); // near phoria

  await fillNpc('6', '10'); // npc
  await userEvent.click(screen.getByText('Continue'));

  setValue('OD (cycles/min)', '10');
  setValue('OS (cycles/min)', '10');
  await userEvent.click(screen.getByText('Continue')); // maf cycles
  await clickChoice('Neither'); // maf difficulty
}

/** Completes the Full Assessment steps beyond the Quick Screen checkpoint: near-vergence, AA, BAF. */
async function completeFullAssessmentCore() {
  await fillVergenceRanges(); // near-vergence
  await userEvent.click(screen.getByText('Continue'));

  setValue('OD (D)', '12');
  setValue('OS (D)', '12');
  await userEvent.click(screen.getByText('Continue')); // aa

  setValue('Cycles/min', '12');
  await userEvent.click(screen.getByText('Continue')); // baf cycles
  await clickChoice('Neither'); // baf difficulty
}

describe('PathwayWizard — Binocular Status', () => {
  it('Quick Screen: no symptoms + normal screening reaches the checkpoint showing "screen clear"', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Quick Screen', 'No symptoms');
    expect(await screen.findByText(/Screen clear/)).toBeInTheDocument();
  });

  it('Quick Screen: symptoms present recommends Full Assessment at the checkpoint', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Quick Screen', 'Headache with visual work');
    expect(await screen.findByText('Further assessment recommended')).toBeInTheDocument();
  });

  it('Quick Screen -> Continue to Full Assessment persists previously-entered data through to the Summary', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Quick Screen', 'No symptoms');
    await userEvent.click(screen.getByText('Continue to Full Assessment'));

    await completeFullAssessmentCore();
    await userEvent.click(screen.getByText('Continue to Summary'));

    // the ortho phoria entered during Quick Screen must still be reflected in the Summary —
    // now inside the compact, collapsed-by-default "Key measurements" card.
    const keyMeasurementsBtn = (await screen.findByText('Key measurements')).closest('button')!;
    fireEvent.click(keyMeasurementsBtn);
    expect((await screen.findAllByText('Ortho')).length).toBeGreaterThan(0);
  });

  it('Full Assessment entered directly skips the Quick Screen checkpoint transparently (no history entry for it)', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Full Assessment', 'No symptoms');

    // should land directly on the near-vergence step, never showing the checkpoint
    expect(screen.queryByText(/Screen clear/)).not.toBeInTheDocument();
    expect(screen.queryByText('Further assessment recommended')).not.toBeInTheDocument();
    expect(await screen.findByText('Near Fusional Vergence Ranges')).toBeInTheDocument();

    // and the breadcrumb trail must not contain a step for the checkpoint
    expect(screen.queryByText('Continue to Full Assessment')).not.toBeInTheDocument();
  });

  it('Back steps back exactly one step within the assessment', async () => {
    renderWizard();
    await waitForIonicReact();
    await clickChoice('Quick Screen');
    await skipTextEntry(); // age -> now on symptoms

    await userEvent.click(screen.getByLabelText('Back'));
    expect(await screen.findByText('Patient age')).toBeInTheDocument();
  });

  it('a breadcrumb entry can be tapped to jump back and re-answer that step', async () => {
    renderWizard();
    await waitForIonicReact();
    await clickChoice('Quick Screen');
    await skipTextEntry(); // age
    await clickChoice('No symptoms');
    await userEvent.click(screen.getByText('Continue'));
    // now on distance-phoria-type; jump back to the symptoms breadcrumb entry
    await userEvent.click(screen.getByText('No symptoms', { selector: 'button.rx-wizard-trail-btn' }));
    expect(await screen.findByText('Symptoms (select all that apply)')).toBeInTheDocument();
  });

  it('optional-tests menu is skippable straight to the Summary without picking a targeted test', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Full Assessment', 'No symptoms');
    await completeFullAssessmentCore();
    expect(await screen.findByText('No additional targeted testing indicated')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue to Summary'));
    expect(await screen.findByText('No pattern from this list was suggested by the findings entered.')).toBeInTheDocument();
  });

  it('an optional targeted test blocks Continue until its required fields are filled, and Skip test bypasses it without recording anything', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Full Assessment', 'No symptoms');
    await completeFullAssessmentCore();
    // this fixture (Ortho/Ortho, no symptoms) doesn't trigger a Gradient AC/A recommendation, so it's under "Other".
    await userEvent.click(screen.getByText('Other / additional tests'));
    await userEvent.click(screen.getByText('Gradient AC/A'));

    expect(await screen.findByText('Ratio (Δ/D)')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(await screen.findByText('Required')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Skip test'));
    // back at the optional-tests menu, nothing recorded
    expect(await screen.findByText('No additional targeted testing indicated')).toBeInTheDocument();
  });

  it('required core fields block progression: Continue on NPC does nothing until Break/Recovery are filled', async () => {
    renderWizard();
    await waitForIonicReact();
    await clickChoice('Quick Screen');
    await skipTextEntry(); // age
    await clickChoice('No symptoms');
    await userEvent.click(screen.getByText('Continue'));
    await clickChoice('Ortho'); // distance phoria
    await clickChoice('Ortho'); // near phoria

    // now on NPC — Continue with nothing filled must not advance
    await userEvent.click(screen.getByText('Continue'));
    expect(screen.getAllByText('Required').length).toBeGreaterThan(0);
    expect(screen.getByText('Near Point of Convergence')).toBeInTheDocument();
  });

  it('non-numeric text in a core numeric field (NPC Break) is rejected with a visible error and never silently accepted', async () => {
    renderWizard();
    await waitForIonicReact();
    await clickChoice('Quick Screen');
    await skipTextEntry(); // age
    await clickChoice('No symptoms');
    await userEvent.click(screen.getByText('Continue'));
    await clickChoice('Ortho'); // distance phoria
    await clickChoice('Ortho'); // near phoria

    setValue('Break (cm)', 'TTN');
    expect(await screen.findByText('Enter a valid number.')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Continue'));
    // blocked — never advances to MAF with unparseable text silently accepted
    expect(screen.getByText('Near Point of Convergence')).toBeInTheDocument();
    expect(screen.queryByText('Monocular Accommodative Facility')).not.toBeInTheDocument();

    setValue('Break (cm)', '6');
    expect(screen.queryByText('Enter a valid number.')).not.toBeInTheDocument();
  });

  it('a fusional-vergence Break can be recorded as "Exceeds range" instead of a fabricated in-range number, and it reaches the Summary distinctly', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Full Assessment', 'No symptoms');

    // near-vergence step: BI group filled normally, BO's Break marked "Exceeds range" instead of a number.
    const biSection = screen.getByText('BI').closest('div')!;
    const boSection = screen.getByText('BO').closest('div')!;
    const setInGroup = (section: HTMLElement, label: string, value: string) => {
      const fieldBox = within(section).getByText(label).closest('.rx-fieldbox')!;
      fireEvent(fieldBox.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }));
    };
    setInGroup(biSection, 'Blur', '12');
    setInGroup(biSection, 'Break', '18');
    setInGroup(biSection, 'Recovery', '12');
    setInGroup(boSection, 'Blur', '18');
    const boBreakField = within(boSection).getByText('Break').closest('.rx-textentry-field')!;
    await userEvent.click(within(boBreakField as HTMLElement).getByText('Exceeds range'));
    setInGroup(boSection, 'Recovery', '16');
    await userEvent.click(screen.getByText('Continue'));

    setValue('OD (D)', '12');
    setValue('OS (D)', '12');
    await userEvent.click(screen.getByText('Continue')); // aa
    setValue('Cycles/min', '12');
    await userEvent.click(screen.getByText('Continue')); // baf cycles
    await clickChoice('Neither'); // baf difficulty
    await userEvent.click(screen.getByText('Continue to Summary'));

    // Near/distance vergence only appears in "All measurements", collapsed by default.
    const allMeasurementsBtn = (await screen.findByText('All measurements')).closest('button')!;
    fireEvent.click(allMeasurementsBtn);
    expect(await screen.findByText(/break exceeds range/)).toBeInTheDocument();
  });

  it('REGRESSION: a value recorded via an absentOption toggle (e.g. "No blur") survives later text-entry steps of the same kind, instead of being silently overwritten by stale leftover form state from the earlier step', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Full Assessment', 'No symptoms');

    // near-vergence: BI marked "No blur" instead of a number; BO filled normally.
    await userEvent.click(screen.getAllByText('No blur')[0]);
    const breaks = screen.getAllByText('Break');
    fireEvent(breaks[0].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '18' }, bubbles: true, composed: true }));
    const recoveries = screen.getAllByText('Recovery');
    fireEvent(recoveries[0].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '12' }, bubbles: true, composed: true }));
    fireEvent(screen.getAllByText('Blur')[1].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '18' }, bubbles: true, composed: true }));
    fireEvent(breaks[1].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '24' }, bubbles: true, composed: true }));
    fireEvent(recoveries[1].closest('.rx-fieldbox')!.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: '16' }, bubbles: true, composed: true }));
    await userEvent.click(screen.getByText('Continue')); // near-vergence -> aa

    // aa and baf-cycles are further text-entry steps right after near-vergence — reusing the
    // same mounted TextEntryForm instance without a per-step remount would let near-vergence's
    // own leftover (pre-substitution, empty-string) state resurface and overwrite "no blur".
    setValue('OD (D)', '12');
    setValue('OS (D)', '12');
    await userEvent.click(screen.getByText('Continue')); // aa -> baf-cycles
    setValue('Cycles/min', '12');
    await userEvent.click(screen.getByText('Continue')); // baf cycles -> baf difficulty
    await clickChoice('Neither');
    await userEvent.click(screen.getByText('Continue to Summary'));

    // Near/distance vergence only appears in "All measurements", collapsed by default.
    const allMeasurementsBtn = (await screen.findByText('All measurements')).closest('button')!;
    fireEvent.click(allMeasurementsBtn);
    expect(await screen.findByText(/no blur/)).toBeInTheDocument();
  });

  it('"New Patient" is not shown persistently during an active assessment — only "Back to Clinical Guide" is', async () => {
    renderWizard();
    await waitForIonicReact();
    await clickChoice('Quick Screen');
    await skipTextEntry(); // age -> now on symptoms, history.length === 1

    expect(screen.queryByText('New Patient')).not.toBeInTheDocument();
    expect(screen.queryByText('Exit')).not.toBeInTheDocument();
    expect(screen.getByText('Back to Clinical Guide')).toBeInTheDocument();
  });

  it('Assessment History lists steps only — no "New Patient" or other action lives there', async () => {
    renderWizard();
    await waitForIonicReact();
    await clickChoice('Quick Screen');
    await skipTextEntry(); // age
    await clickChoice('No symptoms');
    await userEvent.click(screen.getByText('Continue'));

    const trail = document.querySelector('.rx-wizard-trail')!;
    expect(within(trail as HTMLElement).queryByText('New Patient')).not.toBeInTheDocument();
  });

  it('at the completed Summary, "New Patient" is the primary action and "Back to Clinical Guide" is secondary; New Patient clears everything back to the first step', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Full Assessment', 'No symptoms');
    await completeFullAssessmentCore();
    await userEvent.click(screen.getByText('Continue to Summary'));

    expect(await screen.findByText('No pattern from this list was suggested by the findings entered.')).toBeInTheDocument();
    const newPatientBtn = screen.getByText('New Patient');
    const backToGuideBtn = screen.getByText('Back to Clinical Guide');
    expect(newPatientBtn.closest('ion-button')).toHaveClass('rx-btn-solid');
    expect(backToGuideBtn.closest('ion-button')).not.toHaveClass('rx-btn-solid');

    // the header's own "Back to Clinical Guide" link is not duplicated once at the terminal step
    expect(screen.getAllByText('Back to Clinical Guide')).toHaveLength(1);

    await userEvent.click(newPatientBtn);
    expect(await screen.findByText('How would you like to proceed?')).toBeInTheDocument();
    expect(screen.queryByText('Quick Screen', { selector: 'button.rx-wizard-trail-btn' })).not.toBeInTheDocument();
  });
});

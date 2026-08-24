import { render, screen, within } from '@testing-library/react';
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

/** Clicks Continue on the current text-entry step without filling in any field — always valid, since these are context fields, never gating. */
async function skipTextEntry() {
  await userEvent.click(screen.getByText('Continue'));
}

/** Walks entry -> age -> symptoms -> distance/near phoria (all Ortho) -> NPC -> MAF, i.e. every core screening step shared by both entry paths. */
async function completeCoreScreening(entry: 'Quick Screen' | 'Full Assessment', symptomChoice: 'No symptoms' | 'Headache with visual work') {
  await clickChoice(entry);
  await skipTextEntry(); // age

  await clickChoice(symptomChoice);
  await userEvent.click(screen.getByText('Continue'));

  await clickChoice('Ortho'); // distance phoria
  await clickChoice('Ortho'); // near phoria
  await skipTextEntry(); // npc
  await skipTextEntry(); // maf cycles
  await clickChoice('Neither'); // maf difficulty
}

describe('PathwayWizard — Binocular Status', () => {
  it('Quick Screen: no symptoms + normal screening reaches the checkpoint showing "screen clear"', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Quick Screen', 'No symptoms');
    expect(await screen.findByText(/unremarkable/)).toBeInTheDocument();
  });

  it('Quick Screen: symptoms present recommends Full Assessment at the checkpoint', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Quick Screen', 'Headache with visual work');
    expect(await screen.findByText('Full Assessment suggested.')).toBeInTheDocument();
  });

  it('Quick Screen -> Continue to Full Assessment persists previously-entered data through to the Summary', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Quick Screen', 'No symptoms');
    await userEvent.click(screen.getByText('Continue to Full Assessment'));

    // now inside Full Assessment (near-vergence) — skip through to the optional menu, then Skip to Summary
    await skipTextEntry(); // near-vergence
    await skipTextEntry(); // aa
    await skipTextEntry(); // baf-cycles
    await clickChoice('Neither'); // baf difficulty
    await userEvent.click(screen.getByText('Skip to Summary'));

    // the ortho phoria entered during Quick Screen must still be reflected in the Summary
    expect((await screen.findAllByText('Ortho')).length).toBeGreaterThan(0);
  });

  it('Full Assessment entered directly skips the Quick Screen checkpoint transparently (no history entry for it)', async () => {
    renderWizard();
    await waitForIonicReact();
    await completeCoreScreening('Full Assessment', 'No symptoms');

    // should land directly on the near-vergence step, never showing the checkpoint
    expect(screen.queryByText(/unremarkable/)).not.toBeInTheDocument();
    expect(screen.queryByText('Full Assessment suggested.')).not.toBeInTheDocument();
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
    await skipTextEntry(); // near-vergence
    await skipTextEntry(); // aa
    await skipTextEntry(); // baf-cycles
    await clickChoice('Neither'); // baf difficulty
    expect(await screen.findByText('Optional / targeted tests')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Skip to Summary'));
    expect(await screen.findByText(/No significant binocular or accommodative dysfunction demonstrated/)).toBeInTheDocument();
  });
});

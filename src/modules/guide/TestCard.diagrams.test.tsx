import { render, screen } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import TestCard from './TestCard';

function renderTestCard(testId: string) {
  window.history.pushState({}, '', `/guide/tests/${testId}`);
  return render(
    <IonApp>
      <IonReactRouter>
        <Route exact path="/guide/tests/:testId">
          <TestCard />
        </Route>
      </IonReactRouter>
    </IonApp>,
  );
}

describe('TestCard supplementary diagrams', () => {
  it('shows the convergence diagram on the NPC card', async () => {
    renderTestCard('npc-test');
    await waitForIonicReact();
    expect(screen.getByRole('img', { name: /target moving toward the eyes/i })).toBeInTheDocument();
  });

  it('shows the prism gauge diagram on the Fusional Vergence card', async () => {
    renderTestCard('fusional-vergence-test');
    await waitForIonicReact();
    expect(screen.getByRole('img', { name: /as prism increases the target blurs/i })).toBeInTheDocument();
  });

  it('shows the stereo depth diagram on the Stereoacuity card', async () => {
    renderTestCard('stereoacuity-test');
    await waitForIonicReact();
    expect(screen.getByRole('img', { name: /coarse targets have a larger offset/i })).toBeInTheDocument();
  });

  it('does not show a diagram on a test that has none (e.g. Cover Test)', async () => {
    renderTestCard('cover-test');
    await waitForIonicReact();
    expect(document.querySelector('.rx-testcard-diagram')).not.toBeInTheDocument();
  });

  it('the removed Hess/Lancaster test no longer exists', async () => {
    renderTestCard('hess-lancaster');
    await waitForIonicReact();
    expect(screen.getByText(/doesn.t exist/i)).toBeInTheDocument();
  });
});

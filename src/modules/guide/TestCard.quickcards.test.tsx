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

describe('TestCard: Cover Test and Parks 3-Step integration', () => {
  it('Cover Test still shows the generic Equipment section above its bespoke quick card', async () => {
    renderTestCard('cover-test');
    await waitForIonicReact();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Occluder (paddle or card)')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Cover–Uncover' })).toBeInTheDocument();
  });

  it('Cover Test More / Interpretation renders labeled moreSections, not the flat moreDetails list', async () => {
    renderTestCard('cover-test');
    await waitForIonicReact();
    expect(screen.getByText('What is this test?')).toBeInTheDocument();
    expect(screen.getByText('Common mistakes & limitations')).toBeInTheDocument();
  });

  it('Parks 3-Step shows Step 1 of the interactive selector and the isolated-palsy caution', async () => {
    renderTestCard('parks-3-step');
    await waitForIonicReact();
    expect(screen.getByText(/Step 1 — Which eye is hypertropic/)).toBeInTheDocument();
    expect(screen.getByText(/Valid only for a single, isolated cyclovertical muscle palsy/)).toBeInTheDocument();
  });
});

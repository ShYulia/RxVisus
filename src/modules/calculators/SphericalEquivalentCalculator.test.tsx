import { fireEvent, render, screen } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import { IonApp } from '@ionic/react';
import { describe, expect, it } from 'vitest';
import SphericalEquivalentCalculator from './SphericalEquivalentCalculator';

function renderCalculator() {
  return render(
    <IonApp>
      <SphericalEquivalentCalculator />
    </IonApp>,
  );
}

function setValue(label: string, value: string) {
  const fieldBox = screen.getByText(label).closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent(ionInput, new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }));
}

function pasteValue(label: string, text: string) {
  const fieldBox = screen.getByText(label).closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent.paste(ionInput, { clipboardData: { getData: () => text } });
}

describe('SphericalEquivalentCalculator — smart Rx paste', () => {
  it('pasting a full Rx string into CYL fills both SPH and CYL (axis is discarded — SE never uses it)', async () => {
    renderCalculator();
    await waitForIonicReact();
    pasteValue('CYL', '-4.00 / -2.00 x 90');
    // SE = sphere + cylinder/2 = -4.00 + -1.00 = -5.00.
    expect(await screen.findByText('-5.00 D')).toBeInTheDocument();
  });

  it('accepts the space-separated shorthand too, pasted into SPH', async () => {
    renderCalculator();
    await waitForIonicReact();
    pasteValue('SPH', '-4.00 -2.00 × 90');
    expect(await screen.findByText('-5.00 D')).toBeInTheDocument();
  });

  it('a bare single-value paste (no confident full-Rx match) never populates CYL', async () => {
    renderCalculator();
    await waitForIonicReact();
    setValue('SPH', '-4.00');
    pasteValue('CYL', '-2.00');
    // If the bare "-2.00" had been (mis)treated as a full Rx, CYL would now be -2.00 and the
    // result would be -4.00 + -1.00 = -5.00 D. It must instead stay untouched (CYL blank ⇒
    // treated as 0), leaving the result exactly the sphere alone.
    expect(await screen.findByText('-4.00 D')).toBeInTheDocument();
    expect(screen.queryByText('-5.00 D')).not.toBeInTheDocument();
  });
});

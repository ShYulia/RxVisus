import { fireEvent, render, screen } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import { IonApp } from '@ionic/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MeasurementForm from './MeasurementForm';

function renderForm(extra: Partial<React.ComponentProps<typeof MeasurementForm>> = {}) {
  const onSubmit = vi.fn();
  const utils = render(
    <IonApp>
      <MeasurementForm onSubmit={onSubmit} {...extra} />
    </IonApp>,
  );
  return { onSubmit, ...utils };
}

/**
 * Sets the `index`-th "Amount" ion-input (0 = Horizontal, 1 = Vertical — both sections render
 * an "Amount" label at once, so a plain getByText would be ambiguous) via its custom `ionInput`
 * event, bypassing shadow-DOM keystroke simulation.
 */
function setAmount(index: 0 | 1, value: string) {
  const fieldBox = screen.getAllByText('Amount')[index].closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent(ionInput, new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }));
}

/** Clicks the `index`-th Eye option (0 = Horizontal's selector, 1 = Vertical's). */
async function clickEye(index: 0 | 1, value: 'OD' | 'OS') {
  await userEvent.click(screen.getAllByText(value)[index]);
}

describe('MeasurementForm input validation', () => {
  it('blocks Continue when the form is entirely blank — this step requires at least one component', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Enter at least one component (Horizontal or Vertical) to continue.')).toBeInTheDocument();
  });

  it('accepts a horizontal-only measurement with Base and Eye selected — valid input still submits normally', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setAmount(0, '6');
    await userEvent.click(screen.getByText('BO'));
    await clickEye(0, 'OD');
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({ horizontal: { amount: 6, base: 'BO', eye: 'OD' } });
  });

  it('rejects a negative amount, e.g. -6, with an inline error, and never silently drops or renormalizes it', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setAmount(0, '-6');
    await userEvent.click(screen.getByText('BO'));
    await clickEye(0, 'OD');
    expect(await screen.findByText('Enter a number greater than 0.')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a zero amount — a 0Δ "measurement" is not a real recorded deviation', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setAmount(0, '0');
    await userEvent.click(screen.getByText('BO'));
    await clickEye(0, 'OD');
    expect(await screen.findByText('Enter a number greater than 0.')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects malformed numeric text (e.g. "abc") instead of silently coercing it', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setAmount(0, 'abc');
    await userEvent.click(screen.getByText('BO'));
    await clickEye(0, 'OD');
    expect(await screen.findByText('Enter a valid number.')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks Continue and flags the missing Base when Amount + Eye are filled but Base is not — a partially entered component is never silently dropped', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setAmount(0, '6');
    await clickEye(0, 'OD');
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findAllByText('Required')).toHaveLength(1);
  });

  it('blocks Continue and flags the missing Eye when Amount + Base are filled but Eye is not', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setAmount(0, '6');
    await userEvent.click(screen.getByText('BO'));
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findAllByText('Required')).toHaveLength(1);
  });

  it('a partially-entered, invalid horizontal component blocks submission even when vertical alone is fully valid — it must never be silently dropped from the submitted measurement', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setAmount(0, '4'); // horizontal: amount only, no base/eye — "in progress"
    setAmount(1, '4'); // vertical: fully valid
    await userEvent.click(screen.getByText('BU'));
    await clickEye(1, 'OS');
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('independent eye selectors: horizontal and vertical can be measured over different eyes and both are preserved', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setAmount(0, '6');
    await userEvent.click(screen.getByText('BO'));
    await clickEye(0, 'OD'); // horizontal eye
    setAmount(1, '2');
    await userEvent.click(screen.getByText('BU'));
    await clickEye(1, 'OS'); // vertical eye — different from horizontal's
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({
      horizontal: { amount: 6, base: 'BO', eye: 'OD' },
      vertical: { amount: 2, base: 'BU', eye: 'OS' },
    });
  });
});

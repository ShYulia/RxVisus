import { fireEvent, render, screen } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import { IonApp } from '@ionic/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TextEntryForm, { type TextEntryFieldDef } from './TextEntryForm';

function renderForm(fields: TextEntryFieldDef[], extra: Partial<React.ComponentProps<typeof TextEntryForm>> = {}) {
  const onSubmit = vi.fn();
  const utils = render(
    <IonApp>
      <TextEntryForm fields={fields} onSubmit={onSubmit} {...extra} />
    </IonApp>,
  );
  return { onSubmit, ...utils };
}

/** Sets an ion-input's value directly via its custom `ionInput` event, bypassing shadow-DOM keystroke simulation. */
function setValue(label: string, value: string) {
  const fieldBox = screen.getByText(label).closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent(ionInput, new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }));
}

describe('TextEntryForm', () => {
  it('submits freely when no field is required — context fields are never gated', async () => {
    const { onSubmit } = renderForm([{ key: 'note', label: 'Note' }]);
    await waitForIonicReact();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it('blocks Continue and shows an inline "Required" message when a required field is left blank', async () => {
    const { onSubmit } = renderForm([{ key: 'break', label: 'Break', required: true }]);
    await waitForIonicReact();
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Required')).toBeInTheDocument();
  });

  it('proceeds once the required field is filled in', async () => {
    const { onSubmit } = renderForm([{ key: 'break', label: 'Break', required: true }]);
    await waitForIonicReact();
    await userEvent.click(screen.getByText('Continue'));
    await screen.findByText('Required');

    setValue('Break', '12');
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({ break: '12' });
  });

  it('numeric 0 is a valid entered value, not treated as missing', async () => {
    const { onSubmit } = renderForm([{ key: 'aca', label: 'Ratio', required: true }]);
    await waitForIonicReact();
    setValue('Ratio', '0');
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({ aca: '0' });
  });

  it('an absentOption toggle (e.g. "No blur") satisfies a required field without a numeric value', async () => {
    const { onSubmit } = renderForm([{ key: 'blur', label: 'Blur', required: true, absentOption: { label: 'No blur', value: 'none' } }]);
    await waitForIonicReact();

    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Required')).toBeInTheDocument();

    await userEvent.click(screen.getByText('No blur'));
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({ blur: 'none' });
  });

  it('a numeric field rejects non-numeric text with a visible error and does not submit it', async () => {
    const { onSubmit } = renderForm([{ key: 'break', label: 'Break (cm)', required: true, numeric: {} }]);
    await waitForIonicReact();

    setValue('Break (cm)', '6cm');
    expect(await screen.findByText('Enter a valid number.')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
    // The numeric error is shown instead of "Required" — never both at once for the same field.
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
  });

  it('a numeric error clears once the text is corrected, and Continue then submits the clean value', async () => {
    const { onSubmit } = renderForm([{ key: 'break', label: 'Break (cm)', required: true, numeric: {} }]);
    await waitForIonicReact();

    setValue('Break (cm)', 'abc');
    expect(await screen.findByText('Enter a valid number.')).toBeInTheDocument();

    setValue('Break (cm)', '12');
    expect(screen.queryByText('Enter a valid number.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({ break: '12' });
  });

  it('a numeric field rejects a negative value by default ("use the base toggle instead" convention)', async () => {
    const { onSubmit } = renderForm([{ key: 'cpm', label: 'Cycles/min', required: true, numeric: {} }]);
    await waitForIonicReact();

    setValue('Cycles/min', '-5');
    expect(await screen.findByText('Enter a non-negative number.')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('a numeric field with allowNegative accepts a signed value (e.g. MEM/Nott lag/lead)', async () => {
    const { onSubmit } = renderForm([{ key: 'memNott', label: 'OD (D)', numeric: { allowNegative: true } }]);
    await waitForIonicReact();

    setValue('OD (D)', '-0.25');
    expect(screen.queryByText('Enter a non-negative number.')).not.toBeInTheDocument();
    expect(screen.queryByText('Enter a valid number.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({ memNott: '-0.25' });
  });

  it('a blank numeric field that is not required submits freely — emptiness is not a numeric error', async () => {
    const { onSubmit } = renderForm([{ key: 'age', label: 'Age (years)', numeric: {} }]);
    await waitForIonicReact();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it('an "Exceeds range" absentOption satisfies a required numeric field without a fabricated in-range number', async () => {
    const { onSubmit } = renderForm([
      { key: 'break', label: 'Break', required: true, numeric: {}, absentOption: { label: 'Exceeds range', value: 'exceeds-range' } },
    ]);
    await waitForIonicReact();

    await userEvent.click(screen.getByText('Continue'));
    expect(await screen.findByText('Required')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Exceeds range'));
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({ break: 'exceeds-range' });
  });

  it('a visualAcuity field rejects a negative value (e.g. "-2") with a visible error and does not submit it', async () => {
    const { onSubmit } = renderForm([{ key: 'OD', label: 'OD', visualAcuity: true }]);
    await waitForIonicReact();

    setValue('OD', '-2');
    expect(await screen.findByText('Enter Snellen (e.g. 6/6), decimal (e.g. 0.8), or CF/HM/LP/NLP.')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
    // The VA-format error is shown instead of "Required" — never both at once for the same field.
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
  });

  it('a visualAcuity field rejects unrelated/malformed text', async () => {
    const { onSubmit } = renderForm([{ key: 'OD', label: 'OD', visualAcuity: true }]);
    await waitForIonicReact();

    setValue('OD', 'abc');
    expect(await screen.findByText('Enter Snellen (e.g. 6/6), decimal (e.g. 0.8), or CF/HM/LP/NLP.')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(['6/6', '6/7.5', '6/12', '1.0', '0.8', 'CF', 'HM', 'LP', 'NLP'])('a visualAcuity field accepts the valid VA notation "%s" and submits it', async (value) => {
    const { onSubmit } = renderForm([{ key: 'OD', label: 'OD', visualAcuity: true }]);
    await waitForIonicReact();

    setValue('OD', value);
    expect(screen.queryByText('Enter Snellen (e.g. 6/6), decimal (e.g. 0.8), or CF/HM/LP/NLP.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({ OD: value });
  });

  it('a visualAcuity error clears once the text is corrected, and Continue then submits the clean value', async () => {
    const { onSubmit } = renderForm([{ key: 'OD', label: 'OD', visualAcuity: true }]);
    await waitForIonicReact();

    setValue('OD', 'normal');
    expect(await screen.findByText('Enter Snellen (e.g. 6/6), decimal (e.g. 0.8), or CF/HM/LP/NLP.')).toBeInTheDocument();

    setValue('OD', '6/6');
    expect(screen.queryByText('Enter Snellen (e.g. 6/6), decimal (e.g. 0.8), or CF/HM/LP/NLP.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({ OD: '6/6' });
  });

  it('a blank visualAcuity field that is not required submits freely — emptiness is not a VA-format error', async () => {
    const { onSubmit } = renderForm([{ key: 'OD', label: 'OD', visualAcuity: true }]);
    await waitForIonicReact();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it('shows a Skip test action only when onSkip is provided, and it discards entry without validating', async () => {
    const onSkip = vi.fn();
    const { onSubmit, rerender } = renderForm([{ key: 'value', label: 'Finding', required: true }]);
    await waitForIonicReact();
    expect(screen.queryByText('Skip test')).not.toBeInTheDocument();

    rerender(
      <IonApp>
        <TextEntryForm fields={[{ key: 'value', label: 'Finding', required: true }]} onSubmit={onSubmit} onSkip={onSkip} />
      </IonApp>,
    );
    await userEvent.click(screen.getByText('Skip test'));
    expect(onSkip).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

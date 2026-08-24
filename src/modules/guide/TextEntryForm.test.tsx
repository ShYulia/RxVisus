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

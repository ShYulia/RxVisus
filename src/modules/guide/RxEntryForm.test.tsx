import { fireEvent, render, screen } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import { IonApp } from '@ionic/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RxEntryForm from './RxEntryForm';

function renderForm(extra: Partial<React.ComponentProps<typeof RxEntryForm>> = {}) {
  const onSubmit = vi.fn();
  const utils = render(
    <IonApp>
      <RxEntryForm onSubmit={onSubmit} {...extra} />
    </IonApp>,
  );
  return { onSubmit, ...utils };
}

/** Sets the `index`-th ion-input labeled `label` (0 = OD's block, 1 = OS's — both eyes render the same SPH/CYL/AXIS labels). */
function setValue(label: string, index: 0 | 1, value: string) {
  const fieldBox = screen.getAllByText(label)[index].closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent(ionInput, new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }));
}

describe('RxEntryForm input validation', () => {
  it('blocks Continue while SPH is blank for either eye', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setValue('SPH', 0, '-2.00');
    // OS SPH left blank.
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts Pln (plano) as a valid zero sphere for either eye', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setValue('SPH', 0, 'Pln');
    setValue('SPH', 1, 'Pln');
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({
      od: { sphere: 0, cylinder: 0, axis: NaN },
      os: { sphere: 0, cylinder: 0, axis: NaN },
    });
  });

  it('treats a blank CYL as spherical (0), not a missing/invalid value', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setValue('SPH', 0, '-2.00');
    setValue('SPH', 1, '-2.00');
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({
      od: { sphere: -2, cylinder: 0, axis: NaN },
      os: { sphere: -2, cylinder: 0, axis: NaN },
    });
  });

  it('rejects malformed CYL text (e.g. "abc") with an inline error instead of silently treating it as 0', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setValue('SPH', 0, '-2.00');
    setValue('SPH', 1, '-2.00');
    setValue('CYL', 0, 'abc');
    expect(await screen.findByText('Enter a valid number.')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires AXIS once CYL is a real non-zero cylinder, and blocks Continue while it is blank', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setValue('SPH', 0, '-2.00');
    setValue('SPH', 1, '-2.00');
    setValue('CYL', 0, '-1.00');
    // AXIS left blank for OD.
    expect(await screen.findByText('Required — enter 1–180°.')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range AXIS (e.g. 0 or 181) even though the field is non-blank', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setValue('SPH', 0, '-2.00');
    setValue('SPH', 1, '-2.00');
    setValue('CYL', 0, '-1.00');
    setValue('AXIS (1–180°)', 0, '181');
    expect(await screen.findByText('Required — enter 1–180°.')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('never lets a NaN axis reach onSubmit — AXIS stays NaN internally only when CYL is 0, and is otherwise fully validated', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setValue('SPH', 0, '-2.00');
    setValue('SPH', 1, '-2.00');
    setValue('CYL', 0, '-1.00');
    setValue('AXIS (1–180°)', 0, '90');
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({
      od: { sphere: -2, cylinder: -1, axis: 90 },
      os: { sphere: -2, cylinder: 0, axis: NaN },
    });
    const [[value]] = onSubmit.mock.calls;
    expect(Number.isNaN(value.od.axis)).toBe(false);
  });

  it('a fully valid toric Rx for both eyes submits normally', async () => {
    const { onSubmit } = renderForm();
    await waitForIonicReact();
    setValue('SPH', 0, '-2.00');
    setValue('CYL', 0, '-1.00');
    setValue('AXIS (1–180°)', 0, '90');
    setValue('SPH', 1, '-1.50');
    setValue('CYL', 1, '-0.50');
    setValue('AXIS (1–180°)', 1, '180');
    await userEvent.click(screen.getByText('Continue'));
    expect(onSubmit).toHaveBeenCalledWith({
      od: { sphere: -2, cylinder: -1, axis: 90 },
      os: { sphere: -1.5, cylinder: -0.5, axis: 180 },
    });
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import { IonApp } from '@ionic/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VertexDistanceCalculator from './VertexDistanceCalculator';

function renderCalculator() {
  return render(
    <IonApp>
      <VertexDistanceCalculator />
    </IonApp>,
  );
}

/** Sets the ion-input labeled `label` inside the Rx (SPH/CYL/AXIS) row. */
function setRxValue(label: string, value: string) {
  const fieldBox = screen.getByText(label).closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent(ionInput, new CustomEvent('ionInput', { detail: { value }, bubbles: true, composed: true }));
}

/** Pastes `text` into the ion-input labeled `label` inside the Rx row. */
function pasteRxValue(label: string, text: string) {
  const fieldBox = screen.getByText(label).closest('.rx-fieldbox')!;
  const ionInput = fieldBox.querySelector('ion-input')!;
  fireEvent.paste(ionInput, { clipboardData: { getData: () => text } });
}

describe('VertexDistanceCalculator — Vertex-Corrected Rx vs Common Stock Parameters', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it('shows both sections with the correct (renamed) headings and distinct copy actions', async () => {
    renderCalculator();
    await waitForIonicReact();
    setRxValue('SPH', '-6.00');
    setRxValue('CYL', '-1.00');
    setRxValue('AXIS (1–180°)', '85');

    expect(await screen.findByText('Vertex-Corrected Rx')).toBeInTheDocument();
    expect(await screen.findByText('Common Stock Parameters')).toBeInTheDocument();
    expect(screen.getByText('Copy Corrected Rx')).toBeInTheDocument();
    expect(screen.getByText('Copy Stock Parameters')).toBeInTheDocument();
    // Superseded labels/copy must not linger.
    expect(screen.queryByText('Exact Optical Conversion')).not.toBeInTheDocument();
    expect(screen.queryByText('Nearest Common Stock Parameters')).not.toBeInTheDocument();
  });

  it('"Copy Corrected Rx" copies the exact mathematical result, unrounded by stock availability', async () => {
    renderCalculator();
    await waitForIonicReact();
    setRxValue('SPH', '-6.00');
    setRxValue('CYL', '-1.00');
    setRxValue('AXIS (1–180°)', '85');

    const button = await screen.findByText('Copy Corrected Rx');
    fireEvent.click(button);
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const text = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;

    // Axis is unaffected by vertex conversion, so it stays exactly 85 — the stock panel would
    // round this to 90; the corrected-Rx copy must not.
    expect(text).toContain('x 85');
  });

  it('"Copy Stock Parameters" copies the rounded/constrained stock text, not the exact result', async () => {
    renderCalculator();
    await waitForIonicReact();
    setRxValue('SPH', '-6.00');
    setRxValue('CYL', '-1.00');
    setRxValue('AXIS (1–180°)', '85');

    const button = await screen.findByText('Copy Stock Parameters');
    fireEvent.click(button);
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const text = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;

    expect(text).not.toContain('x 85');
    expect(text).toContain('x 90');
    expect(text).toContain('-0.75');
  });

  it('renders the Vertex-Corrected Rx and Common Stock Parameters values unchanged from the validated calculation', async () => {
    renderCalculator();
    await waitForIonicReact();
    setRxValue('SPH', '-6.00');
    setRxValue('CYL', '-1.00');
    setRxValue('AXIS (1–180°)', '85');
    await waitForIonicReact();

    // Same numbers verified in the copy-text tests above: exact result keeps axis 85, stock
    // parameters round axis to 90 and cylinder to -0.75 — i.e. the two panels' displayed
    // values, not just their copied text, must differ and must match the validated calculation.
    const correctedPanel = screen.getByText('Vertex-Corrected Rx').closest('.rx-result')!;
    const stockPanel = screen.getByText('Common Stock Parameters').closest('.rx-result')!;
    expect(correctedPanel).toHaveTextContent('x 85');
    expect(stockPanel).toHaveTextContent('x 90');
    expect(stockPanel).toHaveTextContent('-0.75');
  });

  it('shows neither copy button before a valid Rx is entered — no result yet to copy', async () => {
    renderCalculator();
    await waitForIonicReact();
    expect(screen.queryByText('Copy Corrected Rx')).not.toBeInTheDocument();
    expect(screen.queryByText('Copy Stock Parameters')).not.toBeInTheDocument();
  });

  it('shows no duplicate SPH/CYL/AXIS result boxes — the stock Rx appears exactly once, as one line', async () => {
    renderCalculator();
    await waitForIonicReact();
    setRxValue('SPH', '-6.00');
    setRxValue('CYL', '-1.00');
    setRxValue('AXIS (1–180°)', '85');
    await screen.findByText('Common Stock Parameters');

    // The old boxed SPH/CYL/AXIS breakdown under the stock panel is gone entirely.
    expect(screen.queryAllByText('SPH')).toHaveLength(1); // only the input field's own label
    expect(screen.queryAllByText('CYL')).toHaveLength(1);
    expect(document.querySelectorAll('.rx-fieldbox-static')).toHaveLength(0);
  });

  it('removes the permanent explanatory captions', async () => {
    renderCalculator();
    await waitForIonicReact();
    setRxValue('SPH', '-3.00');
    setRxValue('CYL', '-0.75');
    setRxValue('AXIS (1–180°)', '90');
    await screen.findByText('Common Stock Parameters');

    expect(
      screen.queryByText('Exact mathematical result — independent of any particular lens availability.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Generic toric availability/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Nearest common stock option only — not a recommended lens or a final prescription.'),
    ).not.toBeInTheDocument();
  });
});

describe('VertexDistanceCalculator — Outside common stock range notice', () => {
  it('shows the notice when the exact cylinder exceeds the largest stocked cylinder (an availability constraint, not rounding)', async () => {
    renderCalculator();
    await waitForIonicReact();
    // -6.00 exact cylinder is far beyond the generic profile's largest stocked cylinder (-2.75).
    setRxValue('SPH', '0.00');
    setRxValue('CYL', '-6.00');
    setRxValue('AXIS (1–180°)', '90');

    expect(await screen.findByText('Outside common stock range')).toBeInTheDocument();
    expect(screen.getByText(/Consider custom-made lens options/)).toBeInTheDocument();
  });

  it('never implies a recommended lens or a finalized custom prescription', async () => {
    renderCalculator();
    await waitForIonicReact();
    setRxValue('SPH', '0.00');
    setRxValue('CYL', '-6.00');
    setRxValue('AXIS (1–180°)', '90');
    await screen.findByText('Outside common stock range');

    expect(screen.queryByText(/Recommended Lens/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Custom Lens Prescription/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recommended Custom Lens/i)).not.toBeInTheDocument();
  });

  it('does not show the notice for a cylinder within the common stock range', async () => {
    renderCalculator();
    await waitForIonicReact();
    setRxValue('SPH', '0.00');
    setRxValue('CYL', '-1.00');
    setRxValue('AXIS (1–180°)', '90');

    expect(await screen.findByText('Common Stock Parameters')).toBeInTheDocument();
    expect(screen.queryByText('Outside common stock range')).not.toBeInTheDocument();
  });

  it('does not show the notice when the cylinder is below the smallest stocked cylinder (a spherical simplification, not a supply gap)', async () => {
    renderCalculator();
    await waitForIonicReact();
    setRxValue('SPH', '0.00');
    setRxValue('CYL', '-0.30');
    setRxValue('AXIS (1–180°)', '90');

    expect(await screen.findByText('Common Stock Parameters')).toBeInTheDocument();
    expect(screen.queryByText('Outside common stock range')).not.toBeInTheDocument();
  });
});

describe('VertexDistanceCalculator — smart Rx paste', () => {
  it('pasting a full Rx string into the CYL field fills SPH/CYL/AXIS together', async () => {
    renderCalculator();
    await waitForIonicReact();
    pasteRxValue('CYL', '-6.00 / -1.00 x 85');
    expect(await screen.findByText('Vertex-Corrected Rx')).toBeInTheDocument();
    // The exact on-screen result reflects all three pasted fields having landed (SPH -6.00,
    // CYL -1.00, AXIS 85) and being converted — not just CYL alone.
    expect(screen.getByText(/x 85/)).toBeInTheDocument();
  });

  it('accepts the space-separated shorthand too', async () => {
    renderCalculator();
    await waitForIonicReact();
    pasteRxValue('SPH', '-6.00 -1.00 × 85');
    expect(await screen.findByText('Vertex-Corrected Rx')).toBeInTheDocument();
    expect(screen.getByText(/x 85/)).toBeInTheDocument();
  });
});

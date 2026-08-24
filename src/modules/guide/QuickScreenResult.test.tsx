import { render, screen } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import QuickScreenResult from './QuickScreenResult';

describe('QuickScreenResult', () => {
  it('no symptoms + normal screening -> screen clear, no recommendation', async () => {
    render(
      <QuickScreenResult
        findings={{ symptoms: 'none', 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho', 'npc.break': '5' }}
        onContinue={() => {}}
        onFinish={() => {}}
      />,
    );
    await waitForIonicReact();
    expect(screen.getByText(/unremarkable/)).toBeInTheDocument();
  });

  it('symptoms present + normal screening -> Full Assessment suggested, with reasons', async () => {
    render(
      <QuickScreenResult
        findings={{ symptoms: 'nearStrain,headache', 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho', 'npc.break': '5' }}
        onContinue={() => {}}
        onFinish={() => {}}
      />,
    );
    await waitForIonicReact();
    expect(screen.getByText('Full Assessment suggested.')).toBeInTheDocument();
    expect(screen.getByText('Near eye strain / fatigue')).toBeInTheDocument();
    expect(screen.getByText('Headache with visual work')).toBeInTheDocument();
  });

  it('calls onContinue / onFinish', async () => {
    const onContinue = vi.fn();
    const onFinish = vi.fn();
    render(<QuickScreenResult findings={{ symptoms: 'none' }} onContinue={onContinue} onFinish={onFinish} />);
    await waitForIonicReact();
    await userEvent.click(screen.getByText('Continue to Full Assessment'));
    expect(onContinue).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText('Finish here'));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

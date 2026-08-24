import { render, screen } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import QuickScreenResult from './QuickScreenResult';

describe('QuickScreenResult', () => {
  it('no symptoms + normal screening -> "Screen clear", never a diagnosis, Finish is the primary action', async () => {
    render(
      <QuickScreenResult
        findings={{ symptoms: 'none', 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho', 'npc.break': '5' }}
        onContinue={() => {}}
        onFinish={() => {}}
      />,
    );
    await waitForIonicReact();
    expect(screen.getByText(/Screen clear/)).toBeInTheDocument();
    expect(screen.queryByText(/convergence insufficiency/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/possible/i)).not.toBeInTheDocument();

    expect(screen.getByText('Finish here').className).toContain('rx-btn-solid');
  });

  it('symptoms present + normal screening -> "Further assessment recommended", with reasons under a "Why:" label, Continue is the primary action', async () => {
    render(
      <QuickScreenResult
        findings={{ symptoms: 'nearStrain,headache', 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho', 'npc.break': '5' }}
        onContinue={() => {}}
        onFinish={() => {}}
      />,
    );
    await waitForIonicReact();
    expect(screen.getByText('Further assessment recommended')).toBeInTheDocument();
    expect(screen.getByText('Why:')).toBeInTheDocument();
    expect(screen.getByText('Near eye strain / fatigue')).toBeInTheDocument();
    expect(screen.getByText('Headache with visual work')).toBeInTheDocument();

    expect(screen.getByText('Continue to Full Assessment').className).toContain('rx-btn-solid');
  });

  it('shows explicit MAF lens reasons, not a generic "flipper" mention', async () => {
    render(<QuickScreenResult findings={{ symptoms: 'none', 'maf.difficulty': 'minus' }} onContinue={() => {}} onFinish={() => {}} />);
    await waitForIonicReact();
    expect(screen.getByText('Difficulty clearing −2.00 D (MAF)')).toBeInTheDocument();
  });

  it('calls onContinue / onFinish', async () => {
    const onContinue = vi.fn();
    const onFinish = vi.fn();
    render(<QuickScreenResult findings={{ symptoms: 'nearStrain' }} onContinue={onContinue} onFinish={onFinish} />);
    await waitForIonicReact();
    await userEvent.click(screen.getByText('Continue to Full Assessment'));
    expect(onContinue).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText('Finish here'));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

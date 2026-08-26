import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MaddoxRodQuickCard from './MaddoxRodQuickCard';

describe('MaddoxRodQuickCard', () => {
  it('documents rod over OD (streak) and fixation light over OS', () => {
    render(<MaddoxRodQuickCard />);
    expect(screen.getByText('OD', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('OS', { selector: 'strong' })).toBeInTheDocument();
  });

  it('shows an explicit ASK question and RECORD instruction, not just the neutralization step', () => {
    render(<MaddoxRodQuickCard />);
    expect(screen.getByText(/is the light on the line, or to one side/i)).toBeInTheDocument();
    expect(screen.getByText(/the prism amount and base direction/i)).toBeInTheDocument();
  });

  it('maps horizontal streak-right to esophoria/BO and streak-left to exophoria/BI', () => {
    render(<MaddoxRodQuickCard />);
    expect(screen.getByText('Eso')).toBeInTheDocument();
    expect(screen.getByText('BO')).toBeInTheDocument();
    expect(screen.getByText('Exo')).toBeInTheDocument();
    expect(screen.getByText('BI')).toBeInTheDocument();
  });
});

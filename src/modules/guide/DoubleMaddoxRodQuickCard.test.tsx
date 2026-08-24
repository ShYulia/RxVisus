import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DoubleMaddoxRodQuickCard from './DoubleMaddoxRodQuickCard';

describe('DoubleMaddoxRodQuickCard', () => {
  it('shows the explicit rotate-until-parallel endpoint instruction', () => {
    render(<DoubleMaddoxRodQuickCard />);
    expect(screen.getByText(/streaks now parallel — stop/i)).toBeInTheDocument();
  });

  it('shows both the parallel (no torsion) and tilted (torsion) percepts', () => {
    render(<DoubleMaddoxRodQuickCard />);
    expect(screen.getByText('No significant torsion')).toBeInTheDocument();
    expect(screen.getByText(/Torsion present/)).toBeInTheDocument();
  });
});

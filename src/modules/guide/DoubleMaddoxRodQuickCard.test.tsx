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

  it('documents red rod over OD and white/clear rod over OS', () => {
    render(<DoubleMaddoxRodQuickCard />);
    expect(screen.getByText('Red rod')).toBeInTheDocument();
    expect(screen.getByText(/White\/clear rod/)).toBeInTheDocument();
    expect(screen.getByText('OD', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('OS', { selector: 'strong' })).toBeInTheDocument();
  });

  it('states the excyclo=temporal / incyclo=nasal reading rule explicitly', () => {
    render(<DoubleMaddoxRodQuickCard />);
    expect(screen.getByText(/rotated temporally.*excyclotorsion/)).toBeInTheDocument();
  });

  it('shows the BEFORE / ADJUST / ENDPOINT sequence diagram', () => {
    render(<DoubleMaddoxRodQuickCard />);
    expect(screen.getByText('BEFORE')).toBeInTheDocument();
    expect(screen.getByText('ADJUST')).toBeInTheDocument();
    expect(screen.getByText('ENDPOINT')).toBeInTheDocument();
  });
});

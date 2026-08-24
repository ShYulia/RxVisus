import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BAFQuickCard, MAFQuickCard, VergenceFacilityQuickCard } from './FacilityQuickCards';

describe('MAFQuickCard', () => {
  it('names the equipment explicitly, without an unexplained abbreviation', () => {
    render(<MAFQuickCard />);
    expect(screen.getByText('USE ±2.00 D ACCOMMODATIVE FLIPPERS')).toBeInTheDocument();
  });

  it('spells out every action in the flow — never bare "CPM"', () => {
    render(<MAFQuickCard />);
    expect(screen.getByText('+2.00 lens')).toBeInTheDocument();
    expect(screen.getAllByText('WAIT UNTIL CLEAR').length).toBe(2);
    expect(screen.getByText('FLIP')).toBeInTheDocument();
    expect(screen.getByText('−2.00 lens')).toBeInTheDocument();
    expect(screen.getByText('FLIP & REPEAT FOR 60 SEC')).toBeInTheDocument();
    expect(screen.queryByText(/\bcpm\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/must/i)).not.toBeInTheDocument();
  });

  it('asks explicit record/what-to-note questions instead of a cryptic tag list', () => {
    render(<MAFQuickCard />);
    expect(screen.getByText('How many full cycles in 60 seconds?')).toBeInTheDocument();
    expect(screen.getByText('Which lens was difficult to clear?')).toBeInTheDocument();
    expect(screen.getByText('+2.00')).toBeInTheDocument();
    expect(screen.getByText('−2.00')).toBeInTheDocument();
    expect(screen.getByText('Both')).toBeInTheDocument();
    expect(screen.getByText('Neither')).toBeInTheDocument();
  });

  it('covers one eye then repeats with the other', () => {
    render(<MAFQuickCard />);
    expect(screen.getByText('Cover one eye.')).toBeInTheDocument();
    expect(screen.getByText('Then repeat with the other eye.')).toBeInTheDocument();
  });
});

describe('BAFQuickCard', () => {
  it('uses the same lens flow as MAF but both eyes together, no per-eye repeat', () => {
    render(<BAFQuickCard />);
    expect(screen.getByText('+2.00 lens')).toBeInTheDocument();
    expect(screen.getByText('Both eyes open.')).toBeInTheDocument();
    expect(screen.queryByText('Then repeat with the other eye.')).not.toBeInTheDocument();
    expect(screen.getByText(/diplopia or suppression/)).toBeInTheDocument();
  });
});

describe('VergenceFacilityQuickCard', () => {
  it('names the prism flipper explicitly and spells out the BI/BO flow', () => {
    render(<VergenceFacilityQuickCard />);
    expect(screen.getByText('USE A 3Δ BASE-IN / 12Δ BASE-OUT PRISM FLIPPER')).toBeInTheDocument();
    expect(screen.getByText('Base-in (BI) prism')).toBeInTheDocument();
    expect(screen.getByText('Base-out (BO) prism')).toBeInTheDocument();
    expect(screen.getAllByText('WAIT UNTIL SINGLE, CLEAR').length).toBe(2);
  });
});

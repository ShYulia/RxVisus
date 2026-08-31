import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VonGraefeQuickCard from './VonGraefeQuickCard';

describe('VonGraefeQuickCard', () => {
  it('documents the base prism setting: 12Δ BI over OD, 6Δ BU over OS', () => {
    render(<VonGraefeQuickCard />);
    expect(screen.getByText('OD', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('OS', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/^12Δ BI/)).toBeInTheDocument();
    expect(screen.getByText(/^6Δ BU/)).toBeInTheDocument();
  });

  it('shows an explicit ASK question and RECORD instruction, not just the neutralization step', () => {
    render(<VonGraefeQuickCard />);
    expect(screen.getByText(/keep the target clear/i)).toBeInTheDocument();
    expect(screen.getByText(/the OD prism amount and base direction/i)).toBeInTheDocument();
  });

  it('maps horizontal block-right to esophoria/BO and block-left to exophoria/BI, both on the OD prism', () => {
    render(<VonGraefeQuickCard />);
    expect(screen.getByText('Eso')).toBeInTheDocument();
    expect(screen.getByText('BO OD')).toBeInTheDocument();
    expect(screen.getByText('Exo')).toBeInTheDocument();
    expect(screen.getByText('BI OD')).toBeInTheDocument();
  });

  it('vertical axis varies the OS prism, and maps OD hyper/hypo to BU/BD over OS', () => {
    render(<VonGraefeQuickCard />);
    fireEvent.click(screen.getByRole('tab', { name: 'Vertical' }));
    expect(screen.getByText(/Vary the OS prism/)).toBeInTheDocument();
    expect(screen.getByText('OD hyper')).toBeInTheDocument();
    expect(screen.getByText('BU OS (or BD OD)')).toBeInTheDocument();
    expect(screen.getByText('OD hypo')).toBeInTheDocument();
    expect(screen.getByText('BD OS (or BU OD)')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BinocularSummary from './BinocularSummary';

describe('BinocularSummary', () => {
  it('shows the exact no-pattern stop message and the actual recorded measurements, not just a label', () => {
    render(
      <BinocularSummary
        findings={{
          'distancePhoria.type': 'ortho',
          'nearPhoria.type': 'ortho',
          'npc.break': '5',
          'npc.recovery': '8',
          'nearVergence.bi.break': '14',
          'nearVergence.bo.break': '22',
        }}
      />,
    );

    expect(
      screen.getByText('No significant binocular or accommodative dysfunction demonstrated. Current findings do not explain the reported symptoms.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/break 5cm/)).toBeInTheDocument();
    expect(screen.getByText(/BI break 14/)).toBeInTheDocument();
  });

  it('does not fabricate a pattern from a single recorded value', () => {
    render(<BinocularSummary findings={{ 'npc.break': '15' }} />);
    expect(screen.queryByText(/Convergence Insufficiency/)).not.toBeInTheDocument();
  });

  it('shows the actual measurements alongside a matched pattern, not just its label', () => {
    render(
      <BinocularSummary
        findings={{
          'distancePhoria.type': 'ortho',
          'nearPhoria.type': 'exo',
          'nearPhoria.amount': '10',
          'npc.break': '12',
          'nearVergence.bo.break': '10',
        }}
      />,
    );
    expect(screen.getAllByText(/Convergence Insufficiency/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Near phoria/)).toBeInTheDocument();
    expect(screen.getByText(/10Δ exo/)).toBeInTheDocument();
  });
});

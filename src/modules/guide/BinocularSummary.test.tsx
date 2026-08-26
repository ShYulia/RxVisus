import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BinocularSummary from './BinocularSummary';

describe('BinocularSummary', () => {
  it('shows the short no-pattern message (no symptoms sentence) when no symptoms were reported', () => {
    render(
      <BinocularSummary
        findings={{
          symptoms: 'none',
          'distancePhoria.type': 'ortho',
          'nearPhoria.type': 'ortho',
          'npc.break': '5',
          'npc.recovery': '8',
          'nearVergence.bi.break': '14',
          'nearVergence.bo.break': '22',
        }}
      />,
    );

    expect(screen.getByText('No significant binocular or accommodative dysfunction demonstrated.')).toBeInTheDocument();
    expect(screen.queryByText(/does not explain the reported symptoms/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/break 5cm/).length).toBeGreaterThan(0);
  });

  it('appends the "does not explain the reported symptoms" sentence when symptoms actually were reported', () => {
    render(
      <BinocularSummary
        findings={{
          symptoms: 'nearStrain',
          'distancePhoria.type': 'ortho',
          'nearPhoria.type': 'ortho',
          'npc.break': '5',
        }}
      />,
    );
    expect(
      screen.getByText('No significant binocular or accommodative dysfunction demonstrated. Current findings do not explain the reported symptoms.'),
    ).toBeInTheDocument();
  });

  it('renders human-readable symptom labels, never a raw recordedFindings key like "nearStrain"', () => {
    render(<BinocularSummary findings={{ symptoms: 'nearStrain,slowRefocusNearToDistance', 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho' }} />);
    expect(screen.getAllByText(/Near eye strain \/ fatigue/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Slow refocusing near/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/nearStrain/)).not.toBeInTheDocument();
    expect(screen.queryByText(/slowRefocusNearToDistance/)).not.toBeInTheDocument();
  });

  it('does not fabricate a pattern from a single recorded value', () => {
    render(<BinocularSummary findings={{ 'npc.break': '15' }} />);
    expect(screen.queryByText(/Convergence Insufficiency/)).not.toBeInTheDocument();
  });

  it('shows the actual measurements alongside a matched pattern, not just its label, and a "What next?" section', () => {
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
    expect(screen.getAllByText(/Near phoria/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10Δ exo/).length).toBeGreaterThan(0);
    expect(screen.getByText('What next?')).toBeInTheDocument();
    expect(screen.getAllByText(/therapy/).length).toBeGreaterThan(0);
    expect(screen.getByText('How to manage →')).toBeInTheDocument();
  });

  it('shows a reassurance line for a single accommodative pattern, and vice versa for a single vergence pattern', () => {
    render(<BinocularSummary findings={{ 'age.value': '20', 'aa.OD': '4', 'aa.OS': '4', 'distancePhoria.type': 'ortho' }} />);
    expect(screen.getByText('No significant associated vergence dysfunction demonstrated.')).toBeInTheDocument();
  });

  it('shows a consistent primary pattern with a possible secondary finding retained (visually distinct), not Mixed', () => {
    const { container } = render(
      <BinocularSummary
        findings={{
          'age.value': '19',
          symptoms: 'nearBlur,headache',
          'distancePhoria.type': 'exo',
          'distancePhoria.amount': '6',
          'nearPhoria.type': 'exo',
          'nearPhoria.amount': '12',
          'npc.break': '6',
          'npc.recovery': '9',
          'nearVergence.bi.blur': '12',
          'nearVergence.bi.break': '18',
          'nearVergence.bi.recovery': '12',
          'nearVergence.bo.blur': '12',
          'nearVergence.bo.break': '18',
          'nearVergence.bo.recovery': '12',
          'aa.OD': '8',
          'aa.OS': '8',
          'maf.OD': '12',
          'maf.OS': '12',
          'maf.difficulty': 'neither',
          'baf.cyclesPerMin': '12',
          'baf.difficulty': 'neither',
        }}
      />,
    );

    expect(screen.getByText('Findings consistent with Convergence Insufficiency pattern')).toBeInTheDocument();
    expect(screen.getAllByText(/Accommodative Insufficiency/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Confirmation recommended if clinically indicated/)).toBeInTheDocument();
    expect(container.querySelector('.rx-summary-pattern-possible')).not.toBeNull();
  });

  it('splits measurements into a compact "Key measurements" view and a collapsed "All measurements"', () => {
    render(
      <BinocularSummary
        findings={{
          'distancePhoria.type': 'ortho',
          'nearPhoria.type': 'ortho',
          'aa.OD': '12',
          'aa.OS': '12',
        }}
      />,
    );
    expect(screen.getByText('Key measurements')).toBeInTheDocument();
    expect(screen.getByText('All measurements')).toBeInTheDocument();
  });
});

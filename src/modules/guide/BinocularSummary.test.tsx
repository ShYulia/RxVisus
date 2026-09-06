import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BinocularSummary from './BinocularSummary';

/** Compact cards are buttons that reveal a sibling content block on click — open it, then query. */
function openCompactCard(label: string) {
  const trigger = screen.getByText(label).closest('button')!;
  fireEvent.click(trigger);
  return trigger.closest('.rx-summary-compact')!;
}

describe('BinocularSummary', () => {
  it('shows a neutral message, not a diagnostic claim, when no pattern is suggested', () => {
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

    expect(screen.getByText('No pattern from this list was suggested by the findings entered.')).toBeInTheDocument();
    expect(screen.queryByText(/dysfunction demonstrated/i)).not.toBeInTheDocument();

    const keyMeasurements = openCompactCard('Key measurements');
    expect(keyMeasurements.textContent).toContain('break 5cm');
  });

  it('shows the insufficient-data prompt when no core data was entered at all', () => {
    render(<BinocularSummary findings={{}} />);
    expect(screen.getByText('Insufficient data to interpret — complete the core Alignment/Convergence steps first.')).toBeInTheDocument();
  });

  it('renders human-readable symptom labels, never a raw recordedFindings key like "nearStrain"', () => {
    render(<BinocularSummary findings={{ symptoms: 'nearStrain,slowRefocusNearToDistance', 'distancePhoria.type': 'ortho', 'nearPhoria.type': 'ortho' }} />);
    const keyMeasurements = openCompactCard('Key measurements');
    expect(keyMeasurements.textContent).toMatch(/Near eye strain \/ fatigue/);
    expect(keyMeasurements.textContent).toMatch(/Slow refocusing near/);
    expect(keyMeasurements.textContent).not.toMatch(/nearStrain/);
    expect(keyMeasurements.textContent).not.toMatch(/slowRefocusNearToDistance/);
  });

  it('does not fabricate a pattern from a single recorded value', () => {
    render(<BinocularSummary findings={{ 'npc.break': '15' }} />);
    expect(screen.queryByText(/Convergence Insufficiency/)).not.toBeInTheDocument();
  });

  it('shows the large result card (label + pattern name), the always-expanded why card, and the compact Clinical Source / Clinical considerations cards', () => {
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
    expect(screen.getByText('Findings suggest')).toBeInTheDocument();
    expect(screen.getByText('a Convergence Insufficiency pattern')).toBeInTheDocument();
    expect(screen.getByText('Why this pattern was suggested')).toBeInTheDocument();
    expect(screen.getByText(/Near exophoria \(10Δ\) greater than distance/)).toBeInTheDocument();

    const source = openCompactCard('Clinical Source');
    expect(source.textContent).toContain('CITT Investigator Group');

    const considerations = openCompactCard('Clinical considerations');
    expect(considerations.textContent).toMatch(/therapy/);
  });

  it('shows the decision-support disclaimer inline inside the result card, always visible, never behind a toggle', () => {
    const { container } = render(
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
    const disclaimer = screen.getByText('Decision support only — confirm clinically. You remain responsible for diagnosis and management.');
    expect(disclaimer.closest('.rx-summary-result-card')).not.toBeNull();
    // No expand/collapse control around it — no <details>, no button wrapping it.
    expect(disclaimer.closest('details')).toBeNull();
    expect(disclaimer.closest('button')).toBeNull();
    expect(container.querySelector('.rx-summary-result-disclaimer')).not.toBeNull();
  });

  it('never shows a "consistent"/"possible" confidence label anywhere', () => {
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
    expect(screen.queryByText(/\(consistent\)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(possible\)/)).not.toBeInTheDocument();
  });

  it('does NOT suggest Accommodative Insufficiency from reduced amplitude alone — a second corroborating sign is required', () => {
    render(<BinocularSummary findings={{ 'age.value': '20', 'aa.OD': '4', 'aa.OS': '4', 'distancePhoria.type': 'ortho' }} />);
    expect(screen.queryByText(/Accommodative Insufficiency pattern/)).not.toBeInTheDocument();
  });

  it('suggests Accommodative Insufficiency, with its Clinical Source, once a corroborating facility finding is present', () => {
    render(<BinocularSummary findings={{ 'age.value': '20', 'aa.OD': '4', 'aa.OS': '4', 'distancePhoria.type': 'ortho', 'maf.difficulty': 'minus' }} />);
    expect(screen.getByText('an Accommodative Insufficiency pattern')).toBeInTheDocument();
    const source = openCompactCard('Clinical Source');
    expect(source.textContent).toContain('StatPearls: Accommodative Insufficiency');
  });

  it('shows two simultaneously-suggested patterns independently, in a fixed order, each with its own result card, findings, and management — never merged, never a single primary', () => {
    render(
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
          'maf.difficulty': 'minus',
        }}
      />,
    );

    expect(screen.getByText('a Convergence Insufficiency pattern')).toBeInTheDocument();
    expect(screen.getByText('an Accommodative Insufficiency pattern')).toBeInTheDocument();

    // Two result cards, two "Findings suggest" labels, in that fixed order.
    const findingsLabels = screen.getAllByText('Findings suggest');
    expect(findingsLabels).toHaveLength(2);
    const values = screen.getAllByText(/^(a|an) .+ pattern$/);
    expect(values.map((el) => el.textContent)).toEqual(['a Convergence Insufficiency pattern', 'an Accommodative Insufficiency pattern']);
  });

  it('shows Key measurements and All measurements as separate compact cards, collapsed by default, each expanding independently on click', () => {
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
    const keyTrigger = screen.getByText('Key measurements').closest('button')!;
    const allTrigger = screen.getByText('All measurements').closest('button')!;
    expect(keyTrigger).not.toBe(allTrigger);
    expect(keyTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(allTrigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(keyTrigger);
    expect(keyTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(allTrigger.getAttribute('aria-expanded')).toBe('false');
  });
});

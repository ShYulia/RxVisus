import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CoverTestQuickCard from './CoverTestQuickCard';

describe('CoverTestQuickCard', () => {
  it('defaults to Cover-Uncover mode: detects a manifest deviation, shows both refixation and recovery findings', () => {
    render(<CoverTestQuickCard />);
    expect(screen.getByText(/Detects a/)).toHaveTextContent('manifest');
    expect(screen.getByText(/Refixation movement of the uncovered eye/)).toBeInTheDocument();
    expect(screen.getByText(/Recovery movement of the just-uncovered eye/)).toBeInTheDocument();
  });

  it('switching to Alternate Cover shows the total-deviation framing and the explicit direction-to-prism rows', () => {
    render(<CoverTestQuickCard />);
    fireEvent.click(screen.getByRole('tab', { name: 'Alternate Cover' }));
    expect(screen.getByText(/Dissociates fusion completely/)).toHaveTextContent('total');
    expect(screen.getByText(/never leave both eyes uncovered together/)).toBeInTheDocument();
  });

  it('Alternate Cover neutralization is explicit, not ambiguous "opposite the shift" phrasing — eye moves OUT -> BO, eye moves IN -> BI', () => {
    render(<CoverTestQuickCard />);
    fireEvent.click(screen.getByRole('tab', { name: 'Alternate Cover' }));
    expect(screen.getByText('Eye moves OUT (temporal)')).toBeInTheDocument();
    expect(screen.getByText('Eye moves IN (nasal)')).toBeInTheDocument();
    expect(screen.getByText('BO')).toBeInTheDocument();
    expect(screen.getByText('BI')).toBeInTheDocument();
    expect(screen.queryByText(/base opposite the shift/)).not.toBeInTheDocument();
  });

  it('shows the comitant vs incomitant reminder', () => {
    render(<CoverTestQuickCard />);
    expect(screen.getByText(/Same finding in every gaze position is comitant/)).toBeInTheDocument();
  });
});

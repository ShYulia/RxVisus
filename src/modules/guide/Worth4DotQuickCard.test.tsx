import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Worth4DotQuickCard from './Worth4DotQuickCard';

describe('Worth4DotQuickCard', () => {
  it('documents red lens over OD and green lens over OS', () => {
    render(<Worth4DotQuickCard />);
    expect(screen.getByText('OD', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('OS', { selector: 'strong' })).toBeInTheDocument();
  });

  it('maps 2 red dots to suppression of OS and 3 green dots to suppression of OD — not reversed', () => {
    render(<Worth4DotQuickCard />);
    expect(screen.getByText('2 red dots only')).toBeInTheDocument();
    expect(screen.getByText(/Suppression of OS/)).toBeInTheDocument();
    expect(screen.getByText('3 green dots only')).toBeInTheDocument();
    expect(screen.getByText(/Suppression of OD/)).toBeInTheDocument();
  });

  it('shows the normal-fusion and diplopia percepts', () => {
    render(<Worth4DotQuickCard />);
    expect(screen.getByText('Normal fusion')).toBeInTheDocument();
    expect(screen.getByText('Diplopia')).toBeInTheDocument();
  });
});

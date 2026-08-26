import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Parks3StepSelector from './Parks3StepSelector';

describe('Parks3StepSelector', () => {
  it('reveals steps 2 and 3 progressively, only after the previous step is answered', () => {
    render(<Parks3StepSelector />);
    expect(screen.getByText(/Step 1/)).toBeInTheDocument();
    expect(screen.queryByText(/Step 2/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Step 3/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'OD (right)' }));
    expect(screen.getByText(/Step 2/)).toBeInTheDocument();
    expect(screen.queryByText(/Step 3/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Left gaze' }));
    expect(screen.getByText(/Step 3/)).toBeInTheDocument();
  });

  it('localizes the classic right superior oblique palsy pattern (RHT, worse left gaze, worse right tilt)', () => {
    render(<Parks3StepSelector />);
    fireEvent.click(screen.getByRole('tab', { name: 'OD (right)' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Left gaze' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Right tilt' }));
    expect(screen.getByText('Right superior oblique')).toBeInTheDocument();
    expect(screen.getByText('Localized paretic muscle')).toBeInTheDocument();
  });

  it('Start over clears all three answers and hides the result', () => {
    render(<Parks3StepSelector />);
    fireEvent.click(screen.getByRole('tab', { name: 'OD (right)' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Left gaze' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Right tilt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(screen.queryByText('Right superior oblique')).not.toBeInTheDocument();
    expect(screen.queryByText(/Step 2/)).not.toBeInTheDocument();
  });

  it('shows the isolated-palsy limitation caution', () => {
    render(<Parks3StepSelector />);
    expect(screen.getByText(/Valid only for a single, isolated cyclovertical muscle palsy/)).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { ClipboardEvent } from 'react';
import { handleRxRowPaste } from './rxRowPaste';

function pasteEvent(text: string | undefined): { event: ClipboardEvent<HTMLDivElement>; preventDefault: ReturnType<typeof vi.fn> } {
  const preventDefault = vi.fn();
  const event = {
    preventDefault,
    clipboardData: text === undefined ? undefined : { getData: () => text },
  } as unknown as ClipboardEvent<HTMLDivElement>;
  return { event, preventDefault };
}

describe('handleRxRowPaste', () => {
  it('applies parsed SPH/CYL/AXIS text and prevents default on a confident full-Rx match', () => {
    const { event, preventDefault } = pasteEvent('-4.72 / -1.74 x 83');
    const apply = vi.fn();
    handleRxRowPaste(event, apply);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith({ sphere: '-4.72', cylinder: '-1.74', axis: '83' });
  });

  it('formats the plano sphere as "Pln"', () => {
    const { event } = pasteEvent('Pln / -1.50 x 90');
    const apply = vi.fn();
    handleRxRowPaste(event, apply);
    expect(apply).toHaveBeenCalledWith({ sphere: 'Pln', cylinder: '-1.50', axis: '90' });
  });

  it('does nothing and does not prevent default for a bare single value (normal single-field paste)', () => {
    const { event, preventDefault } = pasteEvent('-2.00');
    const apply = vi.fn();
    handleRxRowPaste(event, apply);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });

  it('does nothing for malformed/ambiguous text', () => {
    const { event, preventDefault } = pasteEvent('not an rx at all');
    const apply = vi.fn();
    handleRxRowPaste(event, apply);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });

  it('does nothing when clipboard data is unavailable', () => {
    const { event, preventDefault } = pasteEvent(undefined);
    const apply = vi.fn();
    handleRxRowPaste(event, apply);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });

  it('does nothing for an empty clipboard string', () => {
    const { event, preventDefault } = pasteEvent('');
    const apply = vi.fn();
    handleRxRowPaste(event, apply);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });
});

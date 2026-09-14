import type { ClipboardEvent } from 'react';
import { formatDiopter, formatSphere, parseFullRxText } from './formatDiopter';

export interface ParsedRxFieldText {
  sphere: string;
  cylinder: string;
  axis: string;
}

/**
 * Paste handler for a full SPH/CYL/AXIS row (Transposition, Vertex Distance, RxEntryForm,
 * Prism & Decentration's OD/OS rows) — attach to the row's wrapping FieldBoxGrid via
 * `onPaste`. Only acts when the pasted text is a confident, unambiguous match for RxKit's
 * Copy Result grammar (see parseFullRxText's doc comment for exactly what qualifies);
 * anything else is left alone, so the browser's default paste still lands in just the
 * focused field — same as any ordinary single-value paste.
 *
 * Hands the parsed field text to `apply` in one call rather than setting SPH/CYL/AXIS itself,
 * so each call site can merge it into its own state shape correctly — some rows hold three
 * independent useState values (safe to set separately), others (RxEntryForm) hold one combined
 * object behind a single setter, where three separate stale-closure calls would clobber each
 * other.
 */
export function handleRxRowPaste(event: ClipboardEvent<HTMLDivElement>, apply: (fields: ParsedRxFieldText) => void): void {
  const text = event.clipboardData?.getData('text');
  if (!text) return;

  const parsed = parseFullRxText(text);
  if (!parsed) return;

  event.preventDefault();
  apply({
    sphere: formatSphere(parsed.sphere),
    cylinder: formatDiopter(parsed.cylinder),
    axis: String(parsed.axis),
  });
}

import { describe, expect, it } from 'vitest';
import { decentrationCautionLines, LARGE_DECENTRATION_MM } from './decentrationWarnings';
import { calculateBinocularRequiredDecentration } from '../../domain/calculators/prism';

// ---------------------------------------------------------------------------
// decentrationCautionLines — the UI-layer "large OC decentration" heuristic.
// Per the audit: this is NOT an evidence-based manufacturing limit, is
// evaluated independently per axis (never combined via Pythagoras), and uses
// the same magnitude threshold regardless of direction (IN/OUT, UP/DOWN).
// ---------------------------------------------------------------------------

describe('decentrationCautionLines', () => {
  it('LARGE_DECENTRATION_MM is 10, matching the audited threshold', () => {
    expect(LARGE_DECENTRATION_MM).toBe(10);
  });

  it('horizontal exactly 10.0 mm does not trigger the warning', () => {
    const lines = decentrationCautionLines({ mm: 10.0, direction: 'OUT' }, undefined);
    expect(lines).toBeUndefined();
  });

  it('horizontal 10.1 mm triggers a horizontal-specific warning', () => {
    const lines = decentrationCautionLines({ mm: 10.1, direction: 'OUT' }, undefined);
    expect(lines).toBeDefined();
    expect(lines!.some((l) => l.includes('Large horizontal OC decentration: 10.1 mm OUT.'))).toBe(true);
    expect(lines!.some((l) => l.includes('Large vertical'))).toBe(false);
  });

  it('vertical exactly 10.0 mm does not trigger the warning', () => {
    const lines = decentrationCautionLines(undefined, { mm: 10.0, direction: 'DOWN' });
    expect(lines).toBeUndefined();
  });

  it('vertical 10.1 mm triggers a vertical-specific warning', () => {
    const lines = decentrationCautionLines(undefined, { mm: 10.1, direction: 'DOWN' });
    expect(lines).toBeDefined();
    expect(lines!.some((l) => l.includes('Large vertical OC decentration: 10.1 mm DOWN.'))).toBe(true);
    expect(lines!.some((l) => l.includes('Large horizontal'))).toBe(false);
  });

  it('REGRESSION: 8mm horizontal + 8mm vertical does NOT trigger the warning, even though the resultant (~11.3mm) would exceed 10mm', () => {
    const lines = decentrationCautionLines({ mm: 8, direction: 'OUT' }, { mm: 8, direction: 'DOWN' });
    expect(lines).toBeUndefined();
  });

  it('12mm horizontal + 8mm vertical triggers only the horizontal warning', () => {
    const lines = decentrationCautionLines({ mm: 12, direction: 'OUT' }, { mm: 8, direction: 'DOWN' });
    expect(lines).toBeDefined();
    expect(lines!.some((l) => l.includes('Large horizontal OC decentration: 12.0 mm OUT.'))).toBe(true);
    expect(lines!.some((l) => l.includes('Large vertical'))).toBe(false);
  });

  it('5mm horizontal + 11mm vertical triggers only the vertical warning', () => {
    const lines = decentrationCautionLines({ mm: 5, direction: 'OUT' }, { mm: 11, direction: 'DOWN' });
    expect(lines).toBeDefined();
    expect(lines!.some((l) => l.includes('Large horizontal'))).toBe(false);
    expect(lines!.some((l) => l.includes('Large vertical OC decentration: 11.0 mm DOWN.'))).toBe(true);
  });

  it('12mm horizontal + 11mm vertical identifies both components, with only one shared feasibility line', () => {
    const lines = decentrationCautionLines({ mm: 12, direction: 'IN' }, { mm: 11, direction: 'UP' });
    expect(lines).toBeDefined();
    expect(lines!.some((l) => l.includes('Large horizontal OC decentration: 12.0 mm IN.'))).toBe(true);
    expect(lines!.some((l) => l.includes('Large vertical OC decentration: 11.0 mm UP.'))).toBe(true);
    // Exactly one feasibility line, not duplicated per axis.
    const feasibilityLines = lines!.filter((l) => l.includes('Verify feasibility for the selected frame and lens blank'));
    expect(feasibilityLines).toHaveLength(1);
    expect(lines).toHaveLength(3);
  });

  it('IN and OUT use the identical magnitude threshold', () => {
    const out = decentrationCautionLines({ mm: 10.1, direction: 'OUT' }, undefined);
    const inward = decentrationCautionLines({ mm: 10.1, direction: 'IN' }, undefined);
    expect(out).toBeDefined();
    expect(inward).toBeDefined();
    const belowOut = decentrationCautionLines({ mm: 9.9, direction: 'OUT' }, undefined);
    const belowIn = decentrationCautionLines({ mm: 9.9, direction: 'IN' }, undefined);
    expect(belowOut).toBeUndefined();
    expect(belowIn).toBeUndefined();
  });

  it('UP and DOWN use the identical magnitude threshold', () => {
    const up = decentrationCautionLines(undefined, { mm: 10.1, direction: 'UP' });
    const down = decentrationCautionLines(undefined, { mm: 10.1, direction: 'DOWN' });
    expect(up).toBeDefined();
    expect(down).toBeDefined();
    const belowUp = decentrationCautionLines(undefined, { mm: 9.9, direction: 'UP' });
    const belowDown = decentrationCautionLines(undefined, { mm: 9.9, direction: 'DOWN' });
    expect(belowUp).toBeUndefined();
    expect(belowDown).toBeUndefined();
  });

  it('the general feasibility wording never claims impossibility, an absolute limit, or an out-of-tolerance condition', () => {
    const lines = decentrationCautionLines({ mm: 15, direction: 'OUT' }, undefined);
    const joined = lines!.join(' ').toLowerCase();
    expect(joined).not.toContain('impossible');
    expect(joined).not.toContain('cannot be made');
    expect(joined).not.toContain('out of tolerance');
    expect(joined).not.toContain('definitely exceeds');
  });

  it('neither axis present (both undefined) does not trigger the warning', () => {
    expect(decentrationCautionLines(undefined, undefined)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The high-prism (domain, Δ-based) and large-decentration (UI, mm-based)
// cautions are two intentionally independent mechanisms — one may fire
// without the other.
// ---------------------------------------------------------------------------

describe('high-prism caution and large-decentration caution are independent', () => {
  it('a large mm displacement with a modest (<=10D) prism target triggers only the decentration caution, not the high-prism caution', () => {
    // A weak lens needs a large physical shift for a small prism target.
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -0.5, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -0.5, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: 1, base: 'BI' }, os: { diopters: 0, base: 'BI' } },
    });
    expect(result.od.horizontal.kind).toBe('defined');
    if (result.od.horizontal.kind !== 'defined') return;
    expect(result.od.horizontal.mm).toBeGreaterThan(10);
    // Domain-level high-prism caution should NOT fire (1D is well under 10D).
    expect(result.od.caution).toBeUndefined();
    // UI-level decentration caution SHOULD fire, independently.
    const lines = decentrationCautionLines(result.od.horizontal, undefined);
    expect(lines).toBeDefined();
  });

  it('a high (>10D) prism target with a small resulting mm displacement triggers only the high-prism caution, not the decentration caution', () => {
    // A strong lens needs only a small physical shift for a large prism target.
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -20, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -20, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: 12, base: 'BI' }, os: { diopters: 0, base: 'BI' } },
    });
    expect(result.od.horizontal.kind).toBe('defined');
    if (result.od.horizontal.kind !== 'defined') return;
    expect(result.od.horizontal.mm).toBeLessThanOrEqual(10);
    // Domain-level high-prism caution SHOULD fire (12D > 10D).
    expect(result.od.caution).toBeDefined();
    // UI-level decentration caution should NOT fire (mm is within the heuristic threshold).
    const lines = decentrationCautionLines(result.od.horizontal, undefined);
    expect(lines).toBeUndefined();
  });
});

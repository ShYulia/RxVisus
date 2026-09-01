import type { HorizontalDecentrationDirection, VerticalDecentrationDirection } from '../../domain/calculators/prism';
import { formatDecentrationMm } from './formatPrism';

/**
 * Above this OC displacement (mm) on a given axis, a "large required decentration" caution is
 * shown for that axis. This is NOT an evidence-based hard manufacturing limit — no authoritative
 * source ties a specific mm figure to feasibility, because real feasibility depends on frame
 * geometry, blank size, lens design, and material, none of which this calculator collects. It's
 * a conservative practical heuristic: a nudge to go check the actual frame/blank, not a claim
 * that the displacement is impossible or out of tolerance. One named constant so the threshold
 * can be tuned later without hunting through the render logic.
 *
 * Evaluated independently per axis (never combined via Pythagoras): an 8mm horizontal + 8mm
 * vertical decentration (resultant ~11.3mm) does NOT warrant this caution, because neither axis
 * individually requires an unusual amount of blank — the resultant-vector magnitude isn't what a
 * lab actually runs out of room on. A single axis exceeding the threshold is what matters.
 */
export const LARGE_DECENTRATION_MM = 10;

const FEASIBILITY_NOTE =
  'Verify feasibility for the selected frame and lens blank. Actual feasibility depends on frame geometry, blank size, lens design, and material.';

/**
 * Builds the axis-specific "large decentration" caution lines for one eye, or undefined when
 * neither axis exceeds LARGE_DECENTRATION_MM. Each triggered axis gets its own line naming the
 * actual mm/direction; the shared feasibility note is appended once, even when both axes trigger.
 */
export function decentrationCautionLines(
  horizontal: { mm: number; direction: HorizontalDecentrationDirection } | undefined,
  vertical: { mm: number; direction: VerticalDecentrationDirection } | undefined,
): string[] | undefined {
  const horizontalLarge = Boolean(horizontal) && horizontal!.mm > LARGE_DECENTRATION_MM;
  const verticalLarge = Boolean(vertical) && vertical!.mm > LARGE_DECENTRATION_MM;
  if (!horizontalLarge && !verticalLarge) return undefined;

  const lines: string[] = [];
  if (horizontalLarge) lines.push(`Large horizontal OC decentration: ${formatDecentrationMm(horizontal!.mm)} ${horizontal!.direction}.`);
  if (verticalLarge) lines.push(`Large vertical OC decentration: ${formatDecentrationMm(vertical!.mm)} ${vertical!.direction}.`);
  lines.push(FEASIBILITY_NOTE);
  return lines;
}

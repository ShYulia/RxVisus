import type { HorizontalDecentrationDirection, VerticalDecentrationDirection } from '../../domain/calculators/prism';

export interface EyeOcDisplacement {
  /** Undefined when no horizontal decentration was calculated for this eye — no OC marker is drawn for that axis. */
  horizontal?: { mm: number; direction: HorizontalDecentrationDirection };
  /** Undefined when no vertical decentration was calculated for this eye. */
  vertical?: { mm: number; direction: VerticalDecentrationDirection };
}

interface OcPlacementDiagramProps {
  od: EyeOcDisplacement;
  os: EyeOcDisplacement;
}

const VIEWBOX_W = 340;
const VIEWBOX_H = 215;
const CY = 90;
const OD_CX = 90;
const OS_CX = 250;
const LENS_RX = 78;
const LENS_RY = 64;

/** Half-width/height of the eye almond — deliberately a large fraction of the lens (not a small icon floating in it), since the eye is the anatomical anchor the whole illustration reads from. */
const EYE_RX = 50;
const EYE_RY = 25;
const PUPIL_R = 9;

/**
 * How far the OC marker can travel from the pupil, in SVG units — never reached exactly (see
 * symbolicOffset), so it always stays inside the frame no matter how large the real mm value is.
 * Physical scale would make an ordinary 15mm decentration unusable on a small diagram.
 */
const MAX_OFFSET = 46;
/** The real mm value at which the symbolic offset reaches half of MAX_OFFSET — 1mm reads visibly smaller than 5mm, which reads smaller than 15mm, but all three stay inside the frame. */
const SOFT_SCALE_MM = 8;

function symbolicOffset(mm: number): number {
  if (mm <= 0) return 0;
  return MAX_OFFSET * (mm / (mm + SOFT_SCALE_MM));
}

/**
 * Signed pixel offset of the OC marker from the fixed pupil, for one eye. OD's lens sits on the
 * left of this front-facing illustration and OS's on the right (the same "examiner facing the
 * patient" convention used by CoverOccluderDiagram elsewhere in the app) — so OUT (temporal, away
 * from the nose/bridge) is leftward for OD and rightward for OS: bilateral OUT decentration
 * visibly pulls both OC markers apart, away from the bridge, and bilateral IN pulls them both
 * toward it. This is the one piece of sign logic in the component; everything else is layout.
 * Vertical is unaffected by which eye it is: UP is always up on screen.
 */
function eyeOffset(eye: 'OD' | 'OS', data: EyeOcDisplacement): { dx: number; dy: number } {
  let dx = 0;
  if (data.horizontal && data.horizontal.mm > 0) {
    const awayFromBridge = eye === 'OD' ? -1 : 1;
    dx = symbolicOffset(data.horizontal.mm) * awayFromBridge * (data.horizontal.direction === 'OUT' ? 1 : -1);
  }
  let dy = 0;
  if (data.vertical && data.vertical.mm > 0) {
    dy = data.vertical.direction === 'UP' ? -symbolicOffset(data.vertical.mm) : symbolicOffset(data.vertical.mm);
  }
  return { dx, dy };
}

/**
 * The anatomical reference point: a large almond eye (occupying most of the lens, not a tiny
 * icon) with a single solid dark pupil. No iris ring — kept to the two elements that matter,
 * pupil vs. OC. This point never moves; only the OC marker on the lens in front of it does.
 */
const Eye: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g>
    <path
      d={`M ${cx - EYE_RX},${cy} Q ${cx},${cy - EYE_RY} ${cx + EYE_RX},${cy} Q ${cx},${cy + EYE_RY} ${cx - EYE_RX},${cy} Z`}
      fill="none"
      stroke="var(--rx-text-tertiary)"
      strokeWidth={1.75}
    />
    <circle cx={cx} cy={cy} r={PUPIL_R} fill="var(--rx-text-secondary)" />
  </g>
);

/**
 * The optical point: a small purple crosshair on the lens plane — deliberately smaller and
 * structurally unlike the solid round pupil (a thin gapped cross vs. a solid disc) so the two
 * are never read as the same kind of thing, even when they nearly coincide.
 */
const OcMarker: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g stroke="var(--rx-iris)" strokeWidth={2} strokeLinecap="round">
    <line x1={x - 7} y1={y} x2={x - 2.5} y2={y} />
    <line x1={x + 2.5} y1={y} x2={x + 7} y2={y} />
    <line x1={x} y1={y - 7} x2={x} y2={y - 2.5} />
    <line x1={x} y1={y + 2.5} x2={x} y2={y + 7} />
  </g>
);

const EyeGroup: React.FC<{ eye: 'OD' | 'OS'; cx: number; data: EyeOcDisplacement }> = ({ eye, cx, data }) => {
  const { dx, dy } = eyeOffset(eye, data);
  const ocX = cx + dx;
  const ocY = CY + dy;
  const hasOffset = dx !== 0 || dy !== 0;
  const hasResult = Boolean(data.horizontal || data.vertical);

  const parts: string[] = [];
  if (data.horizontal && data.horizontal.mm > 0) parts.push(`${data.horizontal.mm.toFixed(1)} mm ${data.horizontal.direction}`);
  if (data.vertical && data.vertical.mm > 0) parts.push(`${data.vertical.mm.toFixed(1)} mm ${data.vertical.direction}`);

  // Eye/value block lives entirely below the frame — the lens interior stays clear for the pupil and OC marker alone.
  const labelTopY = CY + LENS_RY + 24;

  return (
    <g aria-label={`${eye}: pupil fixed at the lens center${hasResult ? `, optical center ${parts.join(', ') || 'at the pupil'}` : ''}`}>
      {/* rimless lens outline */}
      <ellipse cx={cx} cy={CY} rx={LENS_RX} ry={LENS_RY} fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={2} />
      {/* thin temple stub, consistent with a rimless frame's light build */}
      <line
        x1={cx + (eye === 'OD' ? -LENS_RX : LENS_RX)}
        y1={CY - 2}
        x2={cx + (eye === 'OD' ? -LENS_RX - 14 : LENS_RX + 14)}
        y2={CY - 6}
        stroke="var(--rx-text-tertiary)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      <Eye cx={cx} cy={CY} />

      {hasResult && (
        <>
          {hasOffset && <line x1={cx} y1={CY} x2={ocX} y2={ocY} stroke="var(--rx-text-tertiary)" strokeWidth={1.25} strokeDasharray="2 3" />}
          <OcMarker x={ocX} y={ocY} />
        </>
      )}

      <text x={cx} y={labelTopY} fontSize={14} fontWeight={800} textAnchor="middle" fill="var(--rx-text-secondary)">
        {eye}
      </text>
      {parts.map((part, i) => (
        <text key={part} x={cx} y={labelTopY + 16 + i * 14} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--rx-iris-deep)">
          {part}
        </text>
      ))}
    </g>
  );
};

/**
 * Front-view "patient wearing glasses" illustration — the clinical-dispensing alternative to an
 * abstract coordinate diagram. Each pupil is drawn fixed at its lens's geometric center (matching
 * the calculation's own frame of reference, where decentration is always described relative to
 * the fixed pupil), and a small purple crosshair marks where the calculated optical center
 * actually sits, joined to the pupil by a thin line when the two differ. The rimless lenses are
 * drawn close enough that their inner edges nearly meet in a shallow pinch — the bridge/nasal
 * side is legible from that geometry alone, with no "NOSE" label needed. Showing both eyes
 * together is deliberate: it's the only way to see that OUT reads as "away from the nose" and IN
 * as "toward the nose" for BOTH eyes at once, correctly mirrored, which is the geometry a
 * clinician most needs to recognize at a glance rather than re-derive from a direction label.
 */
const OcPlacementDiagram: React.FC<OcPlacementDiagramProps> = ({ od, os }) => (
  <svg
    viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
    role="img"
    aria-label="Front-view illustration of a patient wearing glasses: each pupil stays fixed at its lens center, and a small purple crosshair marks where the manufactured optical center actually sits relative to that fixed pupil."
    style={{ width: '100%', height: 'auto', display: 'block' }}
  >
    <path
      d={`M ${OD_CX + LENS_RX - 6},${CY - 18} Q ${(OD_CX + OS_CX) / 2},${CY - 4} ${OS_CX - LENS_RX + 6},${CY - 18}`}
      fill="none"
      stroke="var(--rx-text-tertiary)"
      strokeWidth={2}
    />

    <EyeGroup eye="OD" cx={OD_CX} data={od} />
    <EyeGroup eye="OS" cx={OS_CX} data={os} />
  </svg>
);

export default OcPlacementDiagram;

export type WorthDotMode = 'target' | 'fusion' | 'suppression-od' | 'suppression-os' | 'diplopia';

const RED = '#e5484d';
const GREEN = '#2fa84f';
const FUSED = '#c76f96';
const FADED = 0.15;

const TOP = { x: 40, y: 14 };
const LEFT = { x: 14, y: 42 };
const RIGHT = { x: 66, y: 42 };
const BOTTOM = { x: 40, y: 70 };
const R = 8;

const ARIA_LABEL: Record<WorthDotMode, string> = {
  target: 'Worth 4 Dot target: one red light on top, two green lights on the sides, one white light on the bottom',
  fusion: 'Patient reports four dots — normal fusion',
  'suppression-od': 'Patient reports three green dots only — suppression of the right eye',
  'suppression-os': 'Patient reports two red dots only — suppression of the left eye',
  diplopia: 'Patient reports five dots, or dots that swap — diplopia',
};

/**
 * The Worth 4 Dot target and each of the four sensory-status percepts. Red lens over OD sees
 * only the red light plus the white light (read as red); green lens over OS sees the two green
 * lights plus the white light (read as green) — the bottom light is the one both eyes compete
 * for, which is why it's the dot that reveals fusion/suppression/diplopia. 'target' shows the
 * physical (unfiltered) projector target for recognition; the other modes show what the
 * patient reports through the glasses.
 */
const WorthDotDiagram: React.FC<{ mode: WorthDotMode; size?: number }> = ({ mode, size = 76 }) => {
  if (mode === 'diplopia') {
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={ARIA_LABEL[mode]}>
        <g transform="translate(-8,0)" opacity={0.9}>
          <circle cx={LEFT.x} cy={LEFT.y} r={R} fill={GREEN} />
          <circle cx={RIGHT.x} cy={RIGHT.y} r={R} fill={GREEN} />
          <circle cx={BOTTOM.x} cy={BOTTOM.y} r={R} fill={GREEN} />
        </g>
        <g transform="translate(8,0)" opacity={0.9}>
          <circle cx={TOP.x} cy={TOP.y} r={R} fill={RED} />
          <circle cx={BOTTOM.x} cy={BOTTOM.y} r={R} fill={RED} />
        </g>
      </svg>
    );
  }

  const bottomFill = mode === 'target' ? '#ffffff' : mode === 'suppression-od' ? GREEN : mode === 'suppression-os' ? RED : FUSED;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={ARIA_LABEL[mode]}>
      <circle cx={TOP.x} cy={TOP.y} r={R} fill={RED} opacity={mode === 'suppression-od' ? FADED : 1} />
      <circle cx={LEFT.x} cy={LEFT.y} r={R} fill={GREEN} opacity={mode === 'suppression-os' ? FADED : 1} />
      <circle cx={RIGHT.x} cy={RIGHT.y} r={R} fill={GREEN} opacity={mode === 'suppression-os' ? FADED : 1} />
      <circle cx={BOTTOM.x} cy={BOTTOM.y} r={R} fill={bottomFill} stroke={mode === 'target' ? 'var(--rx-text-tertiary)' : 'none'} strokeWidth={1.5} />
    </svg>
  );
};

export default WorthDotDiagram;

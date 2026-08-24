export type TorsionMode = 'parallel' | 'tilted';

const ARIA_LABEL: Record<TorsionMode, string> = {
  parallel: 'The two streaks are parallel',
  tilted: 'The two streaks are tilted relative to each other',
};

/** Double Maddox Rod patient view: the red-rod streak and the white-rod streak, parallel (no torsion) or tilted (torsion present). */
const TorsionLinesDiagram: React.FC<{ mode: TorsionMode; size?: number }> = ({ mode, size = 76 }) => {
  const tiltDeg = mode === 'tilted' ? 12 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={ARIA_LABEL[mode]}>
      <circle cx={40} cy={40} r={36} fill="none" stroke="var(--rx-border)" strokeWidth={1} />
      <line x1={16} y1={32} x2={64} y2={32} stroke="#e5484d" strokeWidth={3} strokeLinecap="round" />
      <line x1={16} y1={48} x2={64} y2={48} stroke="#333333" strokeWidth={3} strokeLinecap="round" transform={`rotate(${tiltDeg} 40 48)`} />
    </svg>
  );
};

export default TorsionLinesDiagram;

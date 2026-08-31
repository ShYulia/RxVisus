import { FINDING_LABEL, OFFSET, type StreakFinding } from './dissociatedFinding';

export interface LineLightDiagramProps {
  /** Which deviation this row illustrates — horizontal uses a vertical streak, vertical uses a horizontal streak. */
  axis: 'horizontal' | 'vertical';
  finding: StreakFinding;
  size?: number;
}

/** Maddox Rod patient view: the red streak (rod eye) relative to the white fixation light (fellow eye). */
const LineLightDiagram: React.FC<LineLightDiagramProps> = ({ axis, finding, size = 64 }) => {
  const offset = OFFSET[finding];
  const streakIsVertical = axis === 'horizontal';

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={`Streak seen ${FINDING_LABEL[finding]} the fixation light`}>
      <circle cx={40} cy={40} r={36} fill="none" stroke="var(--rx-border)" strokeWidth={1} />
      <circle cx={40} cy={40} r={4} fill="#f5c341" stroke="#8a6d1a" strokeWidth={1} />
      {streakIsVertical ? (
        <line x1={40 + offset} y1={14} x2={40 + offset} y2={66} stroke="#e5484d" strokeWidth={3} strokeLinecap="round" />
      ) : (
        <line x1={14} y1={40 + offset} x2={66} y2={40 + offset} stroke="#e5484d" strokeWidth={3} strokeLinecap="round" />
      )}
    </svg>
  );
};

export default LineLightDiagram;

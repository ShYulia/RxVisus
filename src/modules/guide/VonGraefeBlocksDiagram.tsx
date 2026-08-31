import { OFFSET, FINDING_LABEL, type StreakFinding } from './dissociatedFinding';

export interface VonGraefeBlocksDiagramProps {
  /** Horizontal testing stacks the two blocks vertically (dissociated by the fixed BU prism); vertical testing sets them side by side (dissociated by the fixed BI prism). */
  axis: 'horizontal' | 'vertical';
  finding: StreakFinding;
  size?: number;
}

/**
 * Von Graefe patient view: two letter blocks, no color coding (plain phoropter target, unlike
 * Maddox Rod/Schober's colored dissociation) — one fixed reference block, one offset per
 * finding, using the same offset/label vocabulary as LineLightDiagram so the three phoria
 * techniques stay visually consistent.
 */
const VonGraefeBlocksDiagram: React.FC<VonGraefeBlocksDiagramProps> = ({ axis, finding, size = 64 }) => {
  const offset = OFFSET[finding];
  const stacked = axis === 'horizontal';
  const refPos = stacked ? { x: 40, y: 22 } : { x: 22, y: 40 };
  const movingPos = stacked ? { x: 40 + offset, y: 58 } : { x: 58, y: 40 + offset };

  const block = (cx: number, cy: number, key: string) => (
    <g key={key} transform={`translate(${cx},${cy})`} stroke="var(--rx-text-secondary)" strokeWidth={1.5} strokeLinecap="round">
      <rect x={-13} y={-7} width={26} height={14} rx={2} fill="none" />
      <line x1={-8} y1={-2.5} x2={8} y2={-2.5} strokeWidth={1} />
      <line x1={-8} y1={2.5} x2={8} y2={2.5} strokeWidth={1} />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label={`Letter block seen ${FINDING_LABEL[finding]} the reference block`}
    >
      {block(refPos.x, refPos.y, 'ref')}
      {block(movingPos.x, movingPos.y, 'moving')}
    </svg>
  );
};

export default VonGraefeBlocksDiagram;

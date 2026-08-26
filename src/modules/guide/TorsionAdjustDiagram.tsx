import TorsionLinesDiagram from './TorsionLinesDiagram';

const RotateIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Rotate the rod axis">
    <path d="M10,20 A10,10 0 1 1 12,27" fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={2.5} markerEnd="url(#rx-rotate-arrow)" />
    <defs>
      <marker id="rx-rotate-arrow" markerWidth={7} markerHeight={7} refX={5} refY={3.5} orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--rx-text-tertiary)" />
      </marker>
    </defs>
  </svg>
);

/**
 * BEFORE (streaks tilted) -> ADJUST (rotate the rod axis) -> ENDPOINT (streaks parallel) —
 * the Double Maddox Rod procedure as a single glanceable sequence, reusing TorsionLinesDiagram
 * for the two streak states rather than duplicating that SVG.
 */
const TorsionAdjustDiagram: React.FC = () => (
  <div className="rx-torsion-sequence">
    <div className="rx-torsion-sequence-step">
      <TorsionLinesDiagram mode="tilted" size={64} />
      <p className="rx-torsion-sequence-label">BEFORE</p>
    </div>
    <span className="rx-torsion-sequence-arrow">&rarr;</span>
    <div className="rx-torsion-sequence-step">
      <RotateIcon />
      <p className="rx-torsion-sequence-label">ADJUST</p>
    </div>
    <span className="rx-torsion-sequence-arrow">&rarr;</span>
    <div className="rx-torsion-sequence-step">
      <TorsionLinesDiagram mode="parallel" size={64} />
      <p className="rx-torsion-sequence-label">ENDPOINT</p>
    </div>
  </div>
);

export default TorsionAdjustDiagram;

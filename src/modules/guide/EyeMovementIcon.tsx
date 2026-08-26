/** A single eye, either steady (no movement — orthophoria) or with a curved arrow above it (a refixation/recovery movement was observed). Generic on purpose: cover test movement direction is patient-specific, not a fixed left/right the way Schober/Maddox findings are. */
const EyeMovementIcon: React.FC<{ moved: boolean; size?: number }> = ({ moved, size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" role="img" aria-label={moved ? 'The eye shifts position' : 'The eye stays still'}>
    <circle cx={30} cy={36} r={14} fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={2} />
    <circle cx={30} cy={36} r={4} fill="var(--rx-text-tertiary)" />
    {moved && (
      <>
        <path d="M14,20 Q30,6 46,20" fill="none" stroke="#e5484d" strokeWidth={2} markerEnd="url(#rx-eyemove-arrow)" />
        <defs>
          <marker id="rx-eyemove-arrow" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#e5484d" />
          </marker>
        </defs>
      </>
    )}
  </svg>
);

export default EyeMovementIcon;

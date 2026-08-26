export type CoverDiagramMode = 'unilateral' | 'alternate';

const EYE_R = 15;
const OD = { x: 26, y: 40 };
const OS = { x: 74, y: 40 };

const Eye: React.FC<{ cx: number; cy: number; label: string }> = ({ cx, cy, label }) => (
  <g>
    <circle cx={cx} cy={cy} r={EYE_R} fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={2} />
    <circle cx={cx} cy={cy} r={5} fill="var(--rx-text-tertiary)" />
    <text x={cx} y={cy + EYE_R + 14} fontSize={10} fontWeight={700} textAnchor="middle" fill="var(--rx-text-secondary)">
      {label}
    </text>
  </g>
);

const Occluder: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <rect x={cx - EYE_R - 3} y={cy - EYE_R - 3} width={(EYE_R + 3) * 2} height={(EYE_R + 3) * 2} rx={4} fill="var(--rx-text-secondary)" opacity={0.85} />
);

const WatchRing: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <circle cx={cx} cy={cy} r={EYE_R + 6} fill="none" stroke="#2fa84f" strokeWidth={2} strokeDasharray="3 3" />
);

/**
 * Cover Test patient-facing diagram: which eye is covered vs which eye the clinician watches
 * (unilateral cover-uncover), or the occluder alternating between the two eyes with neither
 * ever left both-open (alternate cover). Eyes drawn OD-left / OS-right, matching the examiner's
 * view facing the patient — same layout convention as the Schober/Maddox quick cards' OD/OS
 * documentation.
 */
const CoverOccluderDiagram: React.FC<{ mode: CoverDiagramMode; coveredEye?: 'OD' | 'OS'; size?: number }> = ({ mode, coveredEye = 'OD', size = 200 }) => {
  const covered = coveredEye === 'OD' ? OD : OS;
  const watched = coveredEye === 'OD' ? OS : OD;
  const watchedLabel = coveredEye === 'OD' ? 'OS' : 'OD';

  if (mode === 'alternate') {
    return (
      <svg width={size} height={(size * 78) / 200} viewBox="0 0 100 78" role="img" aria-label="The occluder alternates between the two eyes — neither eye is ever left both uncovered at once">
        <Eye cx={OD.x} cy={OD.y} label="OD" />
        <Eye cx={OS.x} cy={OS.y} label="OS" />
        <rect x={OD.x - EYE_R - 3} y={OD.y - EYE_R - 3} width={(EYE_R + 3) * 2} height={(EYE_R + 3) * 2} rx={4} fill="var(--rx-text-secondary)" opacity={0.55} />
        <path d="M46,40 Q50,20 54,40" fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={1.5} markerEnd="url(#rx-cover-alt-arrow)" />
        <path d="M54,40 Q50,60 46,40" fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={1.5} markerEnd="url(#rx-cover-alt-arrow)" />
        <defs>
          <marker id="rx-cover-alt-arrow" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--rx-text-tertiary)" />
          </marker>
        </defs>
      </svg>
    );
  }

  return (
    <svg width={size} height={(size * 78) / 200} viewBox="0 0 100 78" role="img" aria-label={`${coveredEye} covered — watch ${watchedLabel} for a refixation movement`}>
      <Eye cx={OD.x} cy={OD.y} label="OD" />
      <Eye cx={OS.x} cy={OS.y} label="OS" />
      <Occluder cx={covered.x} cy={covered.y} />
      <WatchRing cx={watched.x} cy={watched.y} />
      <text x={watched.x} y={watched.y - EYE_R - 12} fontSize={9} fontWeight={700} textAnchor="middle" fill="#2fa84f">
        WATCH
      </text>
    </svg>
  );
};

export default CoverOccluderDiagram;

import { useId } from 'react';

/** Recognition image of the physical instrument — a red lens made of fine parallel cylindrical rods, in a trial-lens rim. */
const MaddoxRodIcon: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const clipId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Maddox rod — a red lens with fine parallel cylindrical ridges, in a trial-lens rim">
      <defs>
        <clipPath id={clipId}>
          <circle cx={40} cy={40} r={32} />
        </clipPath>
      </defs>
      <circle cx={40} cy={40} r={37} fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={2} />
      <circle cx={40} cy={40} r={32} fill="#c92a2a" />
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: 10 }, (_, i) => 6 + i * 7).map((x) => (
          <line key={x} x1={x} y1={2} x2={x} y2={78} stroke="#7a1414" strokeWidth={1.5} />
        ))}
      </g>
    </svg>
  );
};

export default MaddoxRodIcon;

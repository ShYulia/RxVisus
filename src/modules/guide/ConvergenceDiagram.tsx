/** NPC patient view: the target stays single until it breaks into two closer in, then single again farther out on the way back (recovery). */
const ConvergenceDiagram: React.FC<{ size?: number }> = ({ size = 220 }) => (
  <svg width={size} height={(size * 70) / 220} viewBox="0 0 220 70" role="img" aria-label="Target moving toward the eyes: single until it breaks into two closer in, single again farther out on the way back">
    <circle cx={200} cy={22} r={7} fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={2} />
    <circle cx={200} cy={48} r={7} fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={2} />
    <line x1={10} y1={35} x2={188} y2={35} stroke="var(--rx-border)" strokeWidth={2} />

    <circle cx={150} cy={31} r={6} fill="#e5484d" opacity={0.85} />
    <circle cx={150} cy={40} r={6} fill="#e5484d" opacity={0.5} />
    <text x={150} y={62} fontSize={10} fontWeight={700} textAnchor="middle" fill="var(--rx-text-secondary)">
      BREAK
    </text>

    <circle cx={85} cy={35} r={6} fill="#2fa84f" />
    <text x={85} y={62} fontSize={10} fontWeight={700} textAnchor="middle" fill="var(--rx-text-secondary)">
      RECOVERY
    </text>
  </svg>
);

export default ConvergenceDiagram;

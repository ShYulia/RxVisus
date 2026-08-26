/** Fusional vergence patient view: as prism increases, the target blurs, then breaks (doubles); reducing prism brings it back to single (recovery). */
const PrismGaugeDiagram: React.FC<{ size?: number }> = ({ size = 220 }) => (
  <svg width={size} height={(size * 60) / 220} viewBox="0 0 220 60" role="img" aria-label="As prism increases the target blurs, then breaks into two; reducing prism brings it back to single">
    <line x1={10} y1={15} x2={210} y2={15} stroke="var(--rx-border)" strokeWidth={3} />
    <text x={10} y={8} fontSize={9} fill="var(--rx-text-tertiary)">
      0Δ
    </text>
    <text x={205} y={8} fontSize={9} textAnchor="end" fill="var(--rx-text-tertiary)">
      increasing Δ
    </text>

    <circle cx={100} cy={15} r={6} fill="#f5c341" />
    <text x={100} y={32} fontSize={10} fontWeight={700} textAnchor="middle" fill="var(--rx-text-secondary)">
      BLUR
    </text>

    <circle cx={160} cy={15} r={6} fill="#e5484d" opacity={0.85} />
    <circle cx={160} cy={22} r={6} fill="#e5484d" opacity={0.5} />
    <text x={160} y={40} fontSize={10} fontWeight={700} textAnchor="middle" fill="var(--rx-text-secondary)">
      BREAK
    </text>

    <path d="M160,48 C 130,54 110,54 100,48" fill="none" stroke="var(--rx-text-tertiary)" strokeWidth={1.5} markerEnd="url(#rx-prism-gauge-arrow)" />
    <text x={130} y={58} fontSize={9} textAnchor="middle" fill="var(--rx-text-secondary)">
      reduce prism → RECOVERY
    </text>

    <defs>
      <marker id="rx-prism-gauge-arrow" markerWidth={6} markerHeight={6} refX={5} refY={3} orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="var(--rx-text-tertiary)" />
      </marker>
    </defs>
  </svg>
);

export default PrismGaugeDiagram;

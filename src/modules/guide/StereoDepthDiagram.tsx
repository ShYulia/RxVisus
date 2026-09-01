/** Illustrates the stereo-target concept: a larger red/cyan offset (coarse, easy) versus a smaller offset (fine, hard) — presented coarse to fine during the test. */
const StereoDepthDiagram: React.FC<{ size?: number }> = ({ size = 280 }) => (
  <svg width={size} height={(size * 70) / 220} viewBox="0 0 220 70" role="img" aria-label="Coarse targets have a larger offset between the two colored images and are easy to see in depth; fine targets have a smaller offset and are harder">
    <g transform="translate(45,35)">
      <circle cx={-6} cy={0} r={16} fill="#e5484d" opacity={0.6} />
      <circle cx={6} cy={0} r={16} fill="#2fa84f" opacity={0.6} />
    </g>
    <text x={45} y={64} fontSize={10} fontWeight={700} textAnchor="middle" fill="var(--rx-text-secondary)">
      COARSE (easy)
    </text>

    <g transform="translate(165,35)">
      <circle cx={-1.5} cy={0} r={16} fill="#e5484d" opacity={0.6} />
      <circle cx={1.5} cy={0} r={16} fill="#2fa84f" opacity={0.6} />
    </g>
    <text x={165} y={64} fontSize={10} fontWeight={700} textAnchor="middle" fill="var(--rx-text-secondary)">
      FINE (hard)
    </text>

    <text x={110} y={12} fontSize={12} textAnchor="middle" fill="var(--rx-text-tertiary)">
      &rarr;
    </text>
  </svg>
);

export default StereoDepthDiagram;

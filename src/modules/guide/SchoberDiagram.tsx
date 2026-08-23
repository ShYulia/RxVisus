const CROSS_ARM = 22;

const Cross: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g stroke="#e5484d" strokeWidth={3} strokeLinecap="round">
    <line x1={x} y1={y - CROSS_ARM} x2={x} y2={y + CROSS_ARM} />
    <line x1={x - CROSS_ARM} y1={y} x2={x + CROSS_ARM} y2={y} />
  </g>
);

const Circles: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g fill="none" stroke="#2fa84f" strokeWidth={3}>
    <circle cx={x} cy={y} r={40} />
    <circle cx={x} cy={y} r={25} />
  </g>
);

/** Schober target: green concentric circles with a red cross, centered (endpoint) vs. displaced (before neutralizing). */
const SchoberDiagram: React.FC = () => (
  <svg
    className="rx-schober-diagram"
    viewBox="0 0 240 120"
    role="img"
    aria-label="Schober target: red cross centered in green circles at endpoint, vs. displaced before neutralizing with prism"
  >
    <g transform="translate(55,55)">
      <Circles x={0} y={0} />
      <Cross x={0} y={0} />
      <text x={0} y={52} textAnchor="middle" fontSize="11" fill="currentColor">
        Centered — endpoint
      </text>
    </g>
    <g transform="translate(180,55)">
      <Circles x={0} y={0} />
      <Cross x={16} y={-14} />
      <text x={0} y={52} textAnchor="middle" fontSize="11" fill="currentColor">
        Displaced — add prism
      </text>
    </g>
  </svg>
);

export default SchoberDiagram;

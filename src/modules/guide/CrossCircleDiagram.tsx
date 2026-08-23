export type CrossPosition = 'center' | 'left' | 'right' | 'up' | 'down';

const OFFSETS: Record<CrossPosition, [number, number]> = {
  center: [0, 0],
  left: [-16, 0],
  right: [16, 0],
  up: [0, -16],
  down: [0, 16],
};

const POSITION_LABEL: Record<CrossPosition, string> = {
  center: 'centered',
  left: 'displaced left',
  right: 'displaced right',
  up: 'displaced up',
  down: 'displaced down',
};

/** Schober target: red cross (OD) at a given position within green concentric circles (OS). */
const CrossCircleDiagram: React.FC<{ position: CrossPosition; size?: number }> = ({ position, size = 64 }) => {
  const [dx, dy] = OFFSETS[position];
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={`Red cross ${POSITION_LABEL[position]} within the green circles`}>
      <g transform="translate(40,40)">
        <circle r={34} fill="none" stroke="#2fa84f" strokeWidth={3} />
        <circle r={20} fill="none" stroke="#2fa84f" strokeWidth={3} />
        <g transform={`translate(${dx},${dy})`} stroke="#e5484d" strokeWidth={3} strokeLinecap="round">
          <line x1={0} y1={-15} x2={0} y2={15} />
          <line x1={-15} y1={0} x2={15} y2={0} />
        </g>
      </g>
    </svg>
  );
};

export default CrossCircleDiagram;

import './SegmentedControl.css';

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Pill-style preset switcher, e.g. Vertex Distance's General / To CL (0 mm). */
const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange }) => (
  <div className="rx-segmented" role="tablist">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        role="tab"
        aria-selected={opt.value === value}
        className={`rx-segmented-item ${opt.value === value ? 'rx-segmented-item-active' : ''}`}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default SegmentedControl;

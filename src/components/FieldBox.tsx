import { IonInput } from '@ionic/react';
import './FieldBox.css';

export interface FieldBoxGridProps {
  children: React.ReactNode;
  /** Columns at the field-box's natural size (mobile). Defaults to 3, matching SPH/CYL/AXIS triads. */
  columns?: 2 | 3;
}

/** Lays FieldBoxes out in a compact grid, matching the boxed input pattern. */
export const FieldBoxGrid: React.FC<FieldBoxGridProps> = ({ children, columns = 3 }) => (
  <div className={`rx-fieldbox-grid rx-fieldbox-grid-${columns}`}>{children}</div>
);

export interface FieldBoxProps {
  label: string;
  unit?: string;
  value: string;
  placeholder?: string;
  inputMode?: 'decimal' | 'numeric';
  error?: string;
  onChange: (value: string) => void;
}

/** One boxed input: small label above, bold value + unit below. */
export const FieldBox: React.FC<FieldBoxProps> = ({
  label,
  unit,
  value,
  placeholder,
  inputMode = 'decimal',
  error,
  onChange,
}) => (
  <div className="rx-fieldbox">
    <span className="rx-fieldbox-label">{label}</span>
    <div className="rx-fieldbox-value-row">
      <IonInput
        className="rx-fieldbox-input"
        type="number"
        inputmode={inputMode}
        placeholder={placeholder}
        value={value}
        onIonInput={(e) => onChange(e.detail.value ?? '')}
      />
      {unit && <span className="rx-fieldbox-unit">{unit}</span>}
    </div>
    {error && <p className="rx-fieldbox-error">{error}</p>}
  </div>
);

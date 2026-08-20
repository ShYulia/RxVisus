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
  /** Secondary text shown below the input, e.g. "Example: 50 cm". Never put an example in `placeholder`. */
  helperText?: string;
  inputMode?: 'decimal' | 'numeric' | 'text';
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

/** One boxed input: small label above, bold value + unit below. */
export const FieldBox: React.FC<FieldBoxProps> = ({
  label,
  unit,
  value,
  placeholder,
  helperText,
  inputMode = 'decimal',
  error,
  disabled = false,
  onChange,
}) => (
  <div className="rx-fieldbox">
    <span className="rx-fieldbox-label">{label}</span>
    <div className="rx-fieldbox-value-row">
      <IonInput
        className="rx-fieldbox-input"
        // type="text" (not "number") deliberately: the HTML number input spec rejects a
        // leading "+" as invalid syntax and silently reports value="", which broke entering
        // plus-cylinder values like "+9.00". We parse the raw text ourselves (parseFloat/
        // parseInt), which handles a leading "+" fine.
        type="text"
        inputmode={inputMode}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onIonInput={(e) => onChange(e.detail.value ?? '')}
      />
      {unit && <span className="rx-fieldbox-unit">{unit}</span>}
    </div>
    {helperText && !error && <p className="rx-fieldbox-helper">{helperText}</p>}
    {error && <p className="rx-fieldbox-error">{error}</p>}
  </div>
);

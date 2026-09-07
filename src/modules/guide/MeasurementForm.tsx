import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import SegmentedControl from '../../components/SegmentedControl';
import type { HorizontalPrismBase, VerticalPrismBase } from '../../domain/calculators/prism';
import type { PrismMeasurement } from '../../domain/reference/prismMeasurement';

const HORIZONTAL_BASE_OPTIONS = [
  { value: 'BI', label: 'BI' },
  { value: 'BO', label: 'BO' },
];
const VERTICAL_BASE_OPTIONS = [
  { value: 'BU', label: 'BU' },
  { value: 'BD', label: 'BD' },
];
const EYE_OPTIONS = [
  { value: 'OD', label: 'OD' },
  { value: 'OS', label: 'OS' },
];

export interface MeasurementFormProps {
  initialValue?: PrismMeasurement | null;
  onSubmit: (measurement: PrismMeasurement) => void;
}

interface ComponentState<B extends string> {
  amount: number;
  base: B | null;
  eye: 'OD' | 'OS' | null;
  /** Any sub-field has been filled in — once true, the whole component must be completed before Continue, rather than being silently dropped from the submitted measurement. */
  touched: boolean;
  amountError?: string;
  complete: boolean;
  incomplete: boolean;
}

/**
 * A component (horizontal or vertical) is entirely optional while untouched, but once any of
 * its three sub-fields is filled in, all three become required together — an amount typed
 * without a base/eye (or vice versa) must never be silently discarded, since that would submit
 * a measurement quietly missing part of what the clinician actually recorded. Amount must be a
 * finite number strictly greater than 0 — direction is carried by the Base selection, never by
 * the amount's sign, and a 0Δ "measurement" isn't a real recorded deviation (that's what leaving
 * the whole component untouched already means).
 */
function parseComponent<B extends string>(amountStr: string, base: B | null, eye: 'OD' | 'OS' | null): ComponentState<B> {
  const raw = amountStr.trim();
  const amount = raw === '' ? NaN : parseFloat(raw);
  const touched = raw !== '' || base !== null || eye !== null;

  let amountError: string | undefined;
  if (raw !== '') {
    if (!Number.isFinite(amount)) amountError = 'Enter a valid number.';
    else if (amount <= 0) amountError = 'Enter a number greater than 0.';
  }

  const amountValid = raw !== '' && Number.isFinite(amount) && amount > 0;
  const complete = amountValid && base !== null && eye !== null;

  return { amount, base, eye, touched, amountError, complete, incomplete: touched && !complete };
}

/**
 * Structured prism entry — horizontal and vertical are each optional (fill in whichever
 * component the deviation actually has), recorded as-measured rather than computed.
 * Neither base direction is pre-selected: a defaulted base the clinician forgets to change
 * would silently record the wrong finding. Each component owns its own eye selector —
 * horizontal and vertical deviations may be measured over different eyes, so they're never
 * shared or defaulted from one another.
 */
const MeasurementForm: React.FC<MeasurementFormProps> = ({ initialValue, onSubmit }) => {
  const [hAmountStr, setHAmountStr] = useState(initialValue?.horizontal ? String(initialValue.horizontal.amount) : '');
  const [hBase, setHBase] = useState<HorizontalPrismBase | null>(initialValue?.horizontal?.base ?? null);
  const [hEye, setHEye] = useState<'OD' | 'OS' | null>(initialValue?.horizontal?.eye ?? null);
  const [vAmountStr, setVAmountStr] = useState(initialValue?.vertical ? String(initialValue.vertical.amount) : '');
  const [vBase, setVBase] = useState<VerticalPrismBase | null>(initialValue?.vertical?.base ?? null);
  const [vEye, setVEye] = useState<'OD' | 'OS' | null>(initialValue?.vertical?.eye ?? null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const horizontal = parseComponent(hAmountStr, hBase, hEye);
  const vertical = parseComponent(vAmountStr, vBase, vEye);
  // At least one component must be fully recorded — this step exists because a deviation was
  // already confirmed earlier in the flow, so a completely blank submission isn't valid either.
  const canSubmit = !horizontal.incomplete && !vertical.incomplete && (horizontal.complete || vertical.complete);

  const handleSubmit = () => {
    if (!canSubmit) {
      setSubmitAttempted(true);
      return;
    }
    const measurement: PrismMeasurement = {};
    if (horizontal.complete) measurement.horizontal = { amount: horizontal.amount, base: horizontal.base!, eye: horizontal.eye! };
    if (vertical.complete) measurement.vertical = { amount: vertical.amount, base: vertical.base!, eye: vertical.eye! };
    onSubmit(measurement);
  };

  const missingError = (component: ComponentState<string>, field: 'base' | 'eye') =>
    submitAttempted && component.touched && component[field] === null ? 'Required' : undefined;
  const hBaseError = missingError(horizontal, 'base');
  const hEyeError = missingError(horizontal, 'eye');
  const vBaseError = missingError(vertical, 'base');
  const vEyeError = missingError(vertical, 'eye');

  return (
    <div className="rx-measurement-form">
      <p className="rx-list-section-label">Horizontal</p>
      <FieldBoxGrid columns={3}>
        <FieldBox label="Amount" unit="Δ" placeholder="0.00" error={horizontal.amountError} value={hAmountStr} onChange={setHAmountStr} />
        <div>
          <span className="rx-fieldbox-label">Base</span>
          <SegmentedControl options={HORIZONTAL_BASE_OPTIONS} value={hBase ?? ''} onChange={(v) => setHBase(v as HorizontalPrismBase)} />
          {hBaseError && <p className="rx-fieldbox-error" style={{ marginTop: 4 }}>{hBaseError}</p>}
        </div>
        <div>
          <span className="rx-fieldbox-label">Eye</span>
          <SegmentedControl options={EYE_OPTIONS} value={hEye ?? ''} onChange={(v) => setHEye(v as 'OD' | 'OS')} />
          {hEyeError && <p className="rx-fieldbox-error" style={{ marginTop: 4 }}>{hEyeError}</p>}
        </div>
      </FieldBoxGrid>

      <p className="rx-list-section-label" style={{ marginTop: 20 }}>
        Vertical
      </p>
      <FieldBoxGrid columns={3}>
        <FieldBox label="Amount" unit="Δ" placeholder="0.00" error={vertical.amountError} value={vAmountStr} onChange={setVAmountStr} />
        <div>
          <span className="rx-fieldbox-label">Base</span>
          <SegmentedControl options={VERTICAL_BASE_OPTIONS} value={vBase ?? ''} onChange={(v) => setVBase(v as VerticalPrismBase)} />
          {vBaseError && <p className="rx-fieldbox-error" style={{ marginTop: 4 }}>{vBaseError}</p>}
        </div>
        <div>
          <span className="rx-fieldbox-label">Eye</span>
          <SegmentedControl options={EYE_OPTIONS} value={vEye ?? ''} onChange={(v) => setVEye(v as 'OD' | 'OS')} />
          {vEyeError && <p className="rx-fieldbox-error" style={{ marginTop: 4 }}>{vEyeError}</p>}
        </div>
      </FieldBoxGrid>

      {submitAttempted && !horizontal.incomplete && !vertical.incomplete && !horizontal.complete && !vertical.complete && (
        <p className="rx-hint" style={{ marginTop: 12 }}>
          Enter at least one component (Horizontal or Vertical) to continue.
        </p>
      )}

      <IonButton className="rx-btn-solid" expand="block" onClick={handleSubmit} style={{ marginTop: 20 }}>
        Continue
      </IonButton>
    </div>
  );
};

export default MeasurementForm;

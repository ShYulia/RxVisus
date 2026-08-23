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

/**
 * Structured prism entry — horizontal and vertical are each optional (fill in whichever
 * component the deviation actually has), recorded as-measured rather than computed.
 * Neither base direction is pre-selected: a defaulted base the clinician forgets to change
 * would silently record the wrong finding.
 */
const MeasurementForm: React.FC<MeasurementFormProps> = ({ initialValue, onSubmit }) => {
  const [hAmountStr, setHAmountStr] = useState(initialValue?.horizontal ? String(initialValue.horizontal.amount) : '');
  const [hBase, setHBase] = useState<HorizontalPrismBase | null>(initialValue?.horizontal?.base ?? null);
  const [vAmountStr, setVAmountStr] = useState(initialValue?.vertical ? String(initialValue.vertical.amount) : '');
  const [vBase, setVBase] = useState<VerticalPrismBase | null>(initialValue?.vertical?.base ?? null);
  const [vEye, setVEye] = useState<'OD' | 'OS' | null>(initialValue?.vertical?.eye ?? null);

  const hAmount = hAmountStr.trim() === '' ? NaN : parseFloat(hAmountStr);
  const vAmount = vAmountStr.trim() === '' ? NaN : parseFloat(vAmountStr);

  const horizontalEntered = !Number.isNaN(hAmount) && hAmount > 0 && hBase !== null;
  const verticalEntered = !Number.isNaN(vAmount) && vAmount > 0 && vBase !== null && vEye !== null;
  const canSubmit = horizontalEntered || verticalEntered;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const measurement: PrismMeasurement = {};
    if (horizontalEntered) measurement.horizontal = { amount: hAmount, base: hBase! };
    if (verticalEntered) measurement.vertical = { amount: vAmount, base: vBase!, eye: vEye! };
    onSubmit(measurement);
  };

  return (
    <div className="rx-measurement-form">
      <p className="rx-list-section-label">Horizontal</p>
      <FieldBoxGrid columns={2}>
        <FieldBox label="Amount" unit="Δ" placeholder="0.00" value={hAmountStr} onChange={setHAmountStr} />
        <div>
          <span className="rx-fieldbox-label">Base</span>
          <SegmentedControl options={HORIZONTAL_BASE_OPTIONS} value={hBase ?? ''} onChange={(v) => setHBase(v as HorizontalPrismBase)} />
        </div>
      </FieldBoxGrid>

      <p className="rx-list-section-label" style={{ marginTop: 20 }}>
        Vertical
      </p>
      <FieldBoxGrid columns={2}>
        <FieldBox label="Amount" unit="Δ" placeholder="0.00" value={vAmountStr} onChange={setVAmountStr} />
        <div>
          <span className="rx-fieldbox-label">Base</span>
          <SegmentedControl options={VERTICAL_BASE_OPTIONS} value={vBase ?? ''} onChange={(v) => setVBase(v as VerticalPrismBase)} />
        </div>
      </FieldBoxGrid>
      <FieldBoxGrid columns={2}>
        <div>
          <span className="rx-fieldbox-label">Eye</span>
          <SegmentedControl options={EYE_OPTIONS} value={vEye ?? ''} onChange={(v) => setVEye(v as 'OD' | 'OS')} />
        </div>
      </FieldBoxGrid>

      <IonButton className="rx-btn-solid" expand="block" disabled={!canSubmit} onClick={handleSubmit} style={{ marginTop: 20 }}>
        Continue
      </IonButton>
    </div>
  );
};

export default MeasurementForm;

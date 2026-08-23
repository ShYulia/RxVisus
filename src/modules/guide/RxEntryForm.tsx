import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import type { Prescription } from '../../domain/calculators/transposition';
import type { BestCorrection } from '../../domain/reference/prismMeasurement';
import { parseSphereInput } from '../calculators/formatDiopter';

export interface RxEntryFormProps {
  initialValue?: BestCorrection | null;
  onSubmit: (value: BestCorrection) => void;
}

interface EyeFieldState {
  sphereStr: string;
  cylinderStr: string;
  axisStr: string;
}

const EMPTY_EYE: EyeFieldState = { sphereStr: '', cylinderStr: '', axisStr: '' };

function toFieldState(rx?: Prescription): EyeFieldState {
  if (!rx) return EMPTY_EYE;
  return {
    sphereStr: Number.isNaN(rx.sphere) ? '' : String(rx.sphere),
    cylinderStr: rx.cylinder === 0 ? '' : String(rx.cylinder),
    axisStr: Number.isNaN(rx.axis) ? '' : String(rx.axis),
  };
}

function toPrescription(eye: EyeFieldState): Prescription {
  return {
    sphere: parseSphereInput(eye.sphereStr),
    cylinder: eye.cylinderStr.trim() === '' ? 0 : parseFloat(eye.cylinderStr),
    axis: eye.axisStr.trim() === '' ? NaN : parseFloat(eye.axisStr),
  };
}

const EyeRxFields: React.FC<{ label: string; value: EyeFieldState; onChange: (v: EyeFieldState) => void }> = ({ label, value, onChange }) => {
  const cylinder = value.cylinderStr.trim() === '' ? 0 : parseFloat(value.cylinderStr);
  return (
    <>
      <p className="rx-list-section-label">{label}</p>
      <FieldBoxGrid columns={3}>
        <FieldBox
          label="SPH"
          placeholder="0.00"
          helperText="Plano: type Pln"
          inputMode="text"
          value={value.sphereStr}
          onChange={(v) => onChange({ ...value, sphereStr: v })}
        />
        <FieldBox label="CYL" placeholder="0.00" value={value.cylinderStr} onChange={(v) => onChange({ ...value, cylinderStr: v })} />
        <FieldBox
          label="AXIS (1–180°)"
          inputMode="numeric"
          value={value.axisStr}
          onChange={(v) => onChange({ ...value, axisStr: v })}
          disabled={cylinder === 0}
        />
      </FieldBoxGrid>
    </>
  );
};

/** Best refractive correction per eye, entered before a prism trial — same SPH/CYL/AXIS pattern (Pln support, axis disabled until cylinder is entered) used across RxKit's calculators. */
const RxEntryForm: React.FC<RxEntryFormProps> = ({ initialValue, onSubmit }) => {
  const [od, setOd] = useState<EyeFieldState>(toFieldState(initialValue?.od));
  const [os, setOs] = useState<EyeFieldState>(toFieldState(initialValue?.os));

  const odRx = toPrescription(od);
  const osRx = toPrescription(os);
  const canSubmit = !Number.isNaN(odRx.sphere) && !Number.isNaN(osRx.sphere);

  return (
    <div className="rx-rxentry-form">
      <EyeRxFields label="OD" value={od} onChange={setOd} />
      <EyeRxFields label="OS" value={os} onChange={setOs} />
      <IonButton className="rx-btn-solid" expand="block" disabled={!canSubmit} onClick={() => onSubmit({ od: odRx, os: osRx })} style={{ marginTop: 20 }}>
        Continue
      </IonButton>
    </div>
  );
};

export default RxEntryForm;

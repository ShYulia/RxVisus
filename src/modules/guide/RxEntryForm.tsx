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

/**
 * Parses and validates one eye's SPH/CYL/AXIS — same rule Transposition/Vertex Distance use:
 * blank CYL means spherical (0), and AXIS is required (1-180°) only once CYL is a real,
 * non-zero cylinder; otherwise it's clinically meaningless and left NaN (formatRx already
 * omits the axis tail whenever cylinder is 0, so that NaN is never displayed). Malformed CYL
 * text must never silently become 0, and malformed/missing AXIS must never silently pass
 * through as NaN into a submitted Prescription — see clinicalPathways.ts's sharedPrismSteps.
 */
function parseEye(eye: EyeFieldState) {
  const sphere = parseSphereInput(eye.sphereStr);

  const cylinderRaw = eye.cylinderStr.trim();
  const cylinder = cylinderRaw === '' ? 0 : parseFloat(cylinderRaw);
  const cylinderError = cylinderRaw !== '' && !Number.isFinite(cylinder) ? 'Enter a valid number.' : undefined;

  const axisRequired = !cylinderError && cylinder !== 0;
  const axisRaw = eye.axisStr.trim();
  const axisParsed = axisRaw === '' ? NaN : parseFloat(axisRaw);
  const axisValid = Number.isFinite(axisParsed) && axisParsed >= 1 && axisParsed <= 180;
  const axisError = axisRequired && !axisValid ? 'Required — enter 1–180°.' : undefined;

  const valid = Number.isFinite(sphere) && !cylinderError && (!axisRequired || axisValid);

  return { sphere, cylinder, axis: axisRequired ? axisParsed : NaN, axisRequired, cylinderError, axisError, valid };
}

type EyeParsed = ReturnType<typeof parseEye>;

const EyeRxFields: React.FC<{ label: string; value: EyeFieldState; parsed: EyeParsed; onChange: (v: EyeFieldState) => void }> = ({
  label,
  value,
  parsed,
  onChange,
}) => (
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
      <FieldBox
        label="CYL"
        placeholder="0.00"
        value={value.cylinderStr}
        error={parsed.cylinderError}
        onChange={(v) => onChange({ ...value, cylinderStr: v })}
      />
      <FieldBox
        label="AXIS (1–180°)"
        inputMode="numeric"
        value={value.axisStr}
        error={parsed.axisError}
        onChange={(v) => onChange({ ...value, axisStr: v })}
        disabled={!parsed.axisRequired}
      />
    </FieldBoxGrid>
  </>
);

/** Best refractive correction per eye, entered before a prism trial — same SPH/CYL/AXIS pattern (Pln support, axis disabled until cylinder is entered) used across RxKit's calculators. */
const RxEntryForm: React.FC<RxEntryFormProps> = ({ initialValue, onSubmit }) => {
  const [od, setOd] = useState<EyeFieldState>(toFieldState(initialValue?.od));
  const [os, setOs] = useState<EyeFieldState>(toFieldState(initialValue?.os));

  const odParsed = parseEye(od);
  const osParsed = parseEye(os);
  const canSubmit = odParsed.valid && osParsed.valid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      od: { sphere: odParsed.sphere, cylinder: odParsed.cylinder, axis: odParsed.axis },
      os: { sphere: osParsed.sphere, cylinder: osParsed.cylinder, axis: osParsed.axis },
    });
  };

  return (
    <div className="rx-rxentry-form">
      <EyeRxFields label="OD" value={od} parsed={odParsed} onChange={setOd} />
      <EyeRxFields label="OS" value={os} parsed={osParsed} onChange={setOs} />
      <IonButton className="rx-btn-solid" expand="block" disabled={!canSubmit} onClick={handleSubmit} style={{ marginTop: 20 }}>
        Continue
      </IonButton>
    </div>
  );
};

export default RxEntryForm;

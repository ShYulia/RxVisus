import { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import {
  convertVertexDistance,
  validateVertexDistanceInput,
  type VertexDistanceValidationErrors,
} from '../../domain/calculators/vertexDistance';
import {
  GENERIC_TORIC_AVAILABILITY_PROFILE,
  exceedsCommonStockCylinderRange,
  mapToAvailability,
} from '../../domain/calculators/toricAvailability';
import { formatDiopter, formatRx, formatStockParameters, parseSphereInput } from './formatDiopter';
import PageHeader from '../../components/PageHeader';
import FavoriteStarButton from '../../components/FavoriteStarButton';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import CalculatorResult from '../../components/CalculatorResult';
import CautionBox from '../../components/CautionBox';
import Disclosure from '../../components/Disclosure';
import ActionRow from '../../components/ActionRow';
import CopyButton from '../../components/CopyButton';
import SegmentedControl from '../../components/SegmentedControl';
import { handleRxRowPaste } from './rxRowPaste';

const VertexDistanceCalculator: React.FC = () => {
  const [sphereStr, setSphereStr] = useState('');
  const [cylinderStr, setCylinderStr] = useState('');
  const [axisStr, setAxisStr] = useState('');
  const [fromVertexStr, setFromVertexStr] = useState('12');
  const [toVertexStr, setToVertexStr] = useState('0');

  const sphere = parseSphereInput(sphereStr);
  // Blank means "no cylinder" (spherical) — not a missing/invalid value.
  const cylinder = cylinderStr.trim() === '' ? 0 : parseFloat(cylinderStr);
  const axis = parseInt(axisStr, 10);
  const fromVertexMm = parseFloat(fromVertexStr);
  const toVertexMm = parseFloat(toVertexStr);

  const errors: VertexDistanceValidationErrors = useMemo(
    () => validateVertexDistanceInput({ rx: { sphere, cylinder, axis }, fromVertexMm, toVertexMm }),
    [sphere, cylinder, axis, fromVertexMm, toVertexMm],
  );

  const outcome = useMemo(() => {
    if (Object.keys(errors).length > 0) return null;
    return convertVertexDistance({ rx: { sphere, cylinder, axis }, fromVertexMm, toVertexMm });
  }, [errors, sphere, cylinder, axis, fromVertexMm, toVertexMm]);

  const availability = useMemo(() => {
    if (!outcome || !outcome.ok) return null;
    return mapToAvailability(outcome.result.rx, GENERIC_TORIC_AVAILABILITY_PROFILE);
  }, [outcome]);

  // An availability CONSTRAINT (stock has nothing that large), not ordinary step-rounding —
  // see exceedsCommonStockCylinderRange's doc comment. Drives the "Outside common stock
  // range" note; never affects the actual calculation.
  const outsideStockRange =
    outcome && outcome.ok
      ? exceedsCommonStockCylinderRange(outcome.result.rx.cylinder, GENERIC_TORIC_AVAILABILITY_PROFILE)
      : false;

  const showFieldError = (field: keyof VertexDistanceValidationErrors, raw: string) =>
    raw.trim() !== '' && Boolean(errors[field]);

  // Axis's required-ness depends on cylinder: once cylinder is non-zero, proactively surface
  // "axis needed" even before the field is touched, rather than silently withholding a result.
  const showAxisError = cylinder !== 0 ? Boolean(errors.axis) : showFieldError('axis', axisStr);

  const noInputYet = sphereStr.trim() === '' && cylinderStr.trim() === '' && axisStr.trim() === '';

  const presetMode = toVertexStr.trim() === '0' ? 'to-cl' : 'general';
  const handlePresetChange = (mode: string) => {
    setToVertexStr(mode === 'to-cl' ? '0' : '');
  };

  const handleClear = () => {
    setSphereStr('');
    setCylinderStr('');
    setAxisStr('');
    setFromVertexStr('12');
    setToVertexStr('0');
  };

  return (
    <IonPage>
      <PageHeader
        title="Vertex Distance"
        subline="Convert a prescription between two vertex distances."
        backHref="/calculate"
        action={<FavoriteStarButton favorite={{ type: 'calculator', id: 'vertex-distance' }} label="Vertex Distance" />}
      />
      <IonContent fullscreen className="ion-padding">
        <SegmentedControl
          value={presetMode}
          onChange={handlePresetChange}
          options={[
            { value: 'general', label: 'General' },
            { value: 'to-cl', label: 'To CL (0 mm)' },
          ]}
        />

        <FieldBoxGrid columns={2}>
          <FieldBox
            label="From vertex distance"
            unit="mm"
            value={fromVertexStr}
            onChange={setFromVertexStr}
            error={showFieldError('fromVertexMm', fromVertexStr) ? errors.fromVertexMm : undefined}
          />
          <FieldBox
            label="To vertex distance"
            unit="mm"
            value={toVertexStr}
            onChange={setToVertexStr}
            error={showFieldError('toVertexMm', toVertexStr) ? errors.toVertexMm : undefined}
          />
        </FieldBoxGrid>
        <p className="rx-hint">0 mm is the corneal plane — use it for contact lens power.</p>

        <p className="rx-section-label">Rx (minus cylinder)</p>
        <FieldBoxGrid
          columns={3}
          onPaste={(e) =>
            handleRxRowPaste(e, (fields) => {
              setSphereStr(fields.sphere);
              setCylinderStr(fields.cylinder);
              setAxisStr(fields.axis);
            })
          }
        >
          <FieldBox
            label="SPH"
            placeholder="0.00"
            helperText="Plano: type Pln"
            inputMode="text"
            value={sphereStr}
            onChange={setSphereStr}
            error={showFieldError('sphere', sphereStr) ? errors.sphere : undefined}
          />
          <FieldBox
            label="CYL"
            placeholder="0.00"
            value={cylinderStr}
            onChange={setCylinderStr}
            error={showFieldError('cylinder', cylinderStr) ? errors.cylinder : undefined}
          />
          <FieldBox
            label="AXIS (1–180°)"
            inputMode="numeric"
            value={axisStr}
            onChange={setAxisStr}
            disabled={cylinder === 0}
            error={showAxisError ? errors.axis : undefined}
          />
        </FieldBoxGrid>

        {outcome && !outcome.ok && (
          <div className="rx-undefined">
            <p>This vertex-distance conversion is mathematically undefined for these inputs.</p>
          </div>
        )}

        {outcome && outcome.ok && (
          <CalculatorResult
            primaryLabel="Vertex-Corrected Rx"
            primaryValue={formatRx(outcome.result.rx)}
            singleLine
            valueAction={<CopyButton compact label="Copy Corrected Rx" text={formatRx(outcome.result.rx)} />}
          />
        )}

        {outcome && outcome.ok && availability && (
          <>
            <CalculatorResult
              primaryLabel="Common Stock Parameters"
              primaryValue={formatStockParameters(availability)}
              singleLine
              valueAction={<CopyButton compact label="Copy Stock Parameters" text={formatStockParameters(availability)} />}
            >
              {outsideStockRange && (
                <CautionBox className="rx-result-caution">
                  <p className="rx-caution-text">
                    <strong>Outside common stock range</strong>
                  </p>
                  <p className="rx-caution-text">
                    Consider custom-made lens options when clinically appropriate. Final lens parameters depend on
                    lens design, fit, rotation and over-refraction.
                  </p>
                </CautionBox>
              )}
            </CalculatorResult>

            <Disclosure label="Calculation details">
              <p>
                Meridian 1 (sphere): {formatDiopter(outcome.result.meridian1.power)} D &rarr;{' '}
                <strong>{formatDiopter(outcome.result.meridian1.convertedPower)} D</strong>
              </p>
              <p>
                Meridian 2 (sphere + cylinder): {formatDiopter(outcome.result.meridian2.power)} D &rarr;{' '}
                <strong>{formatDiopter(outcome.result.meridian2.convertedPower)} D</strong>
              </p>
            </Disclosure>
          </>
        )}

        {!outcome && noInputYet && (
          <p className="rx-hint">Enter sphere to convert. Add cylinder and axis only for a toric Rx.</p>
        )}

        <ActionRow onClear={handleClear} />
      </IonContent>
    </IonPage>
  );
};

export default VertexDistanceCalculator;

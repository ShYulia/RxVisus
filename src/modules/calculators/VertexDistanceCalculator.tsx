import { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import {
  convertVertexDistance,
  validateVertexDistanceInput,
  type VertexDistanceValidationErrors,
} from '../../domain/calculators/vertexDistance';
import { GENERIC_TORIC_AVAILABILITY_PROFILE, mapToAvailability } from '../../domain/calculators/toricAvailability';
import { formatDiopter, formatRx } from './formatDiopter';
import PageHeader from '../../components/PageHeader';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import CalculatorResult from '../../components/CalculatorResult';
import Disclosure from '../../components/Disclosure';
import ActionRow from '../../components/ActionRow';
import SegmentedControl from '../../components/SegmentedControl';

const VertexDistanceCalculator: React.FC = () => {
  const [sphereStr, setSphereStr] = useState('');
  const [cylinderStr, setCylinderStr] = useState('');
  const [axisStr, setAxisStr] = useState('');
  const [fromVertexStr, setFromVertexStr] = useState('12');
  const [toVertexStr, setToVertexStr] = useState('0');

  const sphere = parseFloat(sphereStr);
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
      <PageHeader title="Vertex Distance" backHref="/calculate" />
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
        <FieldBoxGrid columns={3}>
          <FieldBox
            label="SPH"
            placeholder="0.00"
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
            label="AXIS"
            placeholder="0"
            inputMode="numeric"
            value={axisStr}
            onChange={setAxisStr}
            error={showAxisError ? errors.axis : undefined}
          />
        </FieldBoxGrid>

        {outcome && !outcome.ok && (
          <div className="rx-undefined">
            <p>This vertex-distance conversion is mathematically undefined for these inputs.</p>
          </div>
        )}

        {outcome && outcome.ok && (
          <CalculatorResult primaryLabel="Exact Optical Conversion" primaryValue={formatRx(outcome.result.rx)}>
            {availability && availability.cylinderCandidatesD.length === 0 && (
              <div className="rx-result-panel">
                <div className="rx-result-panel-label">Nearest Common Stock Parameters</div>
                <FieldBoxGrid columns={3}>
                  <div className="rx-fieldbox rx-fieldbox-static">
                    <span className="rx-fieldbox-label">SPH</span>
                    <span className="rx-fieldbox-value-static">{formatDiopter(availability.sphere)} D</span>
                  </div>
                </FieldBoxGrid>
                <p className="rx-result-panel-caption">Spherical — no cylinder to map.</p>
              </div>
            )}

            {availability && availability.cylinderCandidatesD.length > 0 && (
              <div className="rx-result-panel">
                <div className="rx-result-panel-label">Nearest Common Stock Parameters</div>
                <FieldBoxGrid columns={3}>
                  <div className="rx-fieldbox rx-fieldbox-static">
                    <span className="rx-fieldbox-label">SPH</span>
                    <span className="rx-fieldbox-value-static">{formatDiopter(availability.sphere)} D</span>
                  </div>
                  <div className="rx-fieldbox rx-fieldbox-static">
                    <span className="rx-fieldbox-label">CYL</span>
                    <span className="rx-fieldbox-value-static">
                      {availability.cylinderCandidatesD.map((c) => formatDiopter(c)).join(' / ')} D
                    </span>
                  </div>
                  <div className="rx-fieldbox rx-fieldbox-static">
                    <span className="rx-fieldbox-label">AXIS</span>
                    <span className="rx-fieldbox-value-static">
                      {String(availability.axis ?? 0).padStart(3, '0')}
                    </span>
                  </div>
                </FieldBoxGrid>
                <p className="rx-result-panel-caption">
                  Generic toric availability (10&deg; steps)
                  {availability.cylinderCandidatesD.length > 1 ? ' — two cylinders shown, equally close' : ''}
                </p>
              </div>
            )}
          </CalculatorResult>
        )}

        {outcome && outcome.ok && (
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
        )}

        {!outcome && noInputYet && (
          <p className="rx-hint">Enter sphere to convert. Add cylinder and axis only for a toric Rx.</p>
        )}

        <ActionRow onClear={handleClear} copyText={outcome && outcome.ok ? formatRx(outcome.result.rx) : undefined} />
      </IonContent>
    </IonPage>
  );
};

export default VertexDistanceCalculator;

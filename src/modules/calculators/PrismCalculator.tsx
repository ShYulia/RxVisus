import { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import type { Prescription } from '../../domain/calculators/transposition';
import {
  calculateBinocularInducedPrism,
  calculateBinocularRequiredDecentration,
  validateBinocularInducedPrismInput,
  validateBinocularRequiredDecentrationInput,
  hasBinocularInducedPrismErrors,
  hasBinocularRequiredDecentrationErrors,
  type EyeRequiredDecentrationResult,
  type InducedPrism,
  type HorizontalPrismBase,
  type VerticalPrismBase,
  type VerticalDecentrationDirection,
} from '../../domain/calculators/prism';
import { formatDecentrationMm, formatPrismDiopters } from './formatPrism';
import { formatDiopter, parseSphereInput } from './formatDiopter';
import PageHeader from '../../components/PageHeader';
import FavoriteStarButton from '../../components/FavoriteStarButton';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import CalculatorResult from '../../components/CalculatorResult';
import Disclosure from '../../components/Disclosure';
import ActionRow from '../../components/ActionRow';
import SegmentedControl from '../../components/SegmentedControl';

const MODE_OPTIONS = [
  { value: 'induced', label: 'Induced Prism' },
  { value: 'required', label: 'Required Decentration' },
];
const VERTICAL_DIRECTION_OPTIONS = [
  { value: 'UP', label: 'UP' },
  { value: 'DOWN', label: 'DOWN' },
];
const HORIZONTAL_BASE_OPTIONS = [
  { value: 'BI', label: 'BI' },
  { value: 'BO', label: 'BO' },
];
const VERTICAL_BASE_OPTIONS = [
  { value: 'BU', label: 'BU' },
  { value: 'BD', label: 'BD' },
];
const ALLOCATION_OPTIONS = [
  { value: 'total', label: 'Total (split OU)' },
  { value: 'perEye', label: 'Per eye' },
];
const SPLIT_OPTIONS = [
  { value: 'equal', label: 'Equal split' },
  { value: 'custom', label: 'Custom split' },
];

/** One SPH/CYL/AXIS Rx's field state — used twice (OD, OS), so factored out rather than duplicated. */
function useRxInput() {
  const [sphereStr, setSphereStr] = useState('');
  const [cylinderStr, setCylinderStr] = useState('');
  const [axisStr, setAxisStr] = useState('');

  const sphere = parseSphereInput(sphereStr);
  // Blank means "no cylinder" (spherical) — not a missing/invalid value.
  const cylinder = cylinderStr.trim() === '' ? 0 : parseFloat(cylinderStr);
  const axis = parseInt(axisStr, 10);
  const rx: Prescription = { sphere, cylinder, axis };

  const reset = () => {
    setSphereStr('');
    setCylinderStr('');
    setAxisStr('');
  };

  return { sphereStr, setSphereStr, cylinderStr, setCylinderStr, axisStr, setAxisStr, rx, reset };
}

type RxInput = ReturnType<typeof useRxInput>;

/** One eye's SPH/CYL/AXIS entry, labeled OD or OS. Rx-only — decentration/prism fields differ per mode and render separately. */
const EyeRxFields: React.FC<{
  label: string;
  eye: RxInput;
  errors: { sphere?: string; cylinder?: string; axis?: string };
}> = ({ label, eye, errors }) => {
  const showFieldError = (raw: string, error: string | undefined) => raw.trim() !== '' && Boolean(error);
  const showAxisError = eye.rx.cylinder !== 0 ? Boolean(errors.axis) : showFieldError(eye.axisStr, errors.axis);

  return (
    <>
      <p className="rx-section-label">{label} Rx (minus cylinder)</p>
      <FieldBoxGrid columns={3}>
        <FieldBox
          label="SPH"
          placeholder="0.00"
          helperText="Plano: type Pln"
          inputMode="text"
          value={eye.sphereStr}
          onChange={eye.setSphereStr}
          error={showFieldError(eye.sphereStr, errors.sphere) ? errors.sphere : undefined}
        />
        <FieldBox
          label="CYL"
          placeholder="0.00"
          value={eye.cylinderStr}
          onChange={eye.setCylinderStr}
          error={showFieldError(eye.cylinderStr, errors.cylinder) ? errors.cylinder : undefined}
        />
        <FieldBox
          label="AXIS (1–180°)"
          inputMode="numeric"
          value={eye.axisStr}
          onChange={eye.setAxisStr}
          disabled={eye.rx.cylinder === 0}
          error={showAxisError ? errors.axis : undefined}
        />
      </FieldBoxGrid>
    </>
  );
};

const EyeInducedPrismPanel: React.FC<{ label: string; result: InducedPrism }> = ({ label, result }) => {
  if (!result.horizontal && !result.vertical) {
    return (
      <div className="rx-result-panel">
        <div className="rx-result-panel-label">{label}</div>
        <p className="rx-hint">No measurable prism induced.</p>
      </div>
    );
  }
  return (
    <CalculatorResult
      primaryLabel={label}
      primaryValue={
        result.horizontal
          ? `${formatPrismDiopters(result.horizontal.diopters)} ${result.horizontal.base}`
          : `${formatPrismDiopters(result.vertical!.diopters)} ${result.vertical!.base}`
      }
      secondaryLabel={result.horizontal && result.vertical ? 'Vertical' : undefined}
      secondaryValue={
        result.horizontal && result.vertical ? `${formatPrismDiopters(result.vertical.diopters)} ${result.vertical.base}` : undefined
      }
    />
  );
};

const EyeRequiredDecentrationPanel: React.FC<{ label: string; result: EyeRequiredDecentrationResult }> = ({ label, result }) => {
  const { allocatedTarget, relevantPower, outcome, orderingPdMm, caution } = result;

  const desiredParts: string[] = [];
  if (allocatedTarget.horizontalDiopters > 0) {
    desiredParts.push(`${formatPrismDiopters(allocatedTarget.horizontalDiopters)} ${allocatedTarget.horizontalBase}`);
  }
  if (allocatedTarget.verticalDiopters > 0) {
    desiredParts.push(`${formatPrismDiopters(allocatedTarget.verticalDiopters)} ${allocatedTarget.verticalBase}`);
  }
  const desiredText = desiredParts.length > 0 ? desiredParts.join('  +  ') : 'None';

  if (!outcome.ok) {
    return (
      <div className="rx-result-panel">
        <div className="rx-result-panel-label">{label}</div>
        <p className="rx-result-secondary-row">
          <span className="rx-result-secondary-label">Desired</span> <span className="rx-result-secondary-value">{desiredText}</span>
        </p>
        <div className="rx-undefined">
          <p>
            Mathematically undefined for {label} — a principal meridian of this Rx is plano (zero power), so no decentration can
            produce prism there.
          </p>
        </div>
      </div>
    );
  }

  const { horizontal, vertical } = outcome.result;
  if (!horizontal && !vertical) {
    return (
      <div className="rx-result-panel">
        <div className="rx-result-panel-label">{label}</div>
        <p className="rx-hint">No decentration needed — the desired prism for this eye is zero.</p>
      </div>
    );
  }

  return (
    <CalculatorResult
      primaryLabel={label}
      primaryValue={horizontal ? `${formatDecentrationMm(horizontal.mm)} ${horizontal.direction}` : `${formatDecentrationMm(vertical!.mm)} ${vertical!.direction}`}
      secondaryLabel={horizontal && vertical ? 'Vertical' : undefined}
      secondaryValue={horizontal && vertical ? `${formatDecentrationMm(vertical.mm)} ${vertical.direction}` : undefined}
      caution={caution}
    >
      <div className="rx-result-secondary-row">
        <span className="rx-result-secondary-label">Desired</span>
        <span className="rx-result-secondary-value">{desiredText}</span>
      </div>
      {horizontal && (
        <div className="rx-result-secondary-row">
          <span className="rx-result-secondary-label">Relevant power (horizontal)</span>
          <span className="rx-result-secondary-value">{formatDiopter(relevantPower.horizontal)} D</span>
        </div>
      )}
      {vertical && (
        <div className="rx-result-secondary-row">
          <span className="rx-result-secondary-label">Relevant power (vertical)</span>
          <span className="rx-result-secondary-value">{formatDiopter(relevantPower.vertical)} D</span>
        </div>
      )}
      {orderingPdMm !== undefined && (
        <div className="rx-result-secondary-row">
          <span className="rx-result-secondary-label">Ordering PD</span>
          <span className="rx-result-secondary-value">{orderingPdMm.toFixed(1)} mm</span>
        </div>
      )}
    </CalculatorResult>
  );
};

const PrismCalculator: React.FC = () => {
  const [mode, setMode] = useState<'induced' | 'required'>('induced');

  const od = useRxInput();
  const os = useRxInput();

  // Shared across both modes — the same physically measured value either way.
  const [odPatientPdStr, setOdPatientPdStr] = useState('');
  const [osPatientPdStr, setOsPatientPdStr] = useState('');

  // Mode 1 only: where the lenses were actually manufactured/ground.
  const [odOcDistanceStr, setOdOcDistanceStr] = useState('');
  const [osOcDistanceStr, setOsOcDistanceStr] = useState('');
  const [odVMmStr, setOdVMmStr] = useState('');
  const [odVDir, setOdVDir] = useState<VerticalDecentrationDirection>('UP');
  const [osVMmStr, setOsVMmStr] = useState('');
  const [osVDir, setOsVDir] = useState<VerticalDecentrationDirection>('UP');

  // Mode 2 only.
  const [allocationMode, setAllocationMode] = useState<'perEye' | 'total'>('total');
  const [odHDeltaStr, setOdHDeltaStr] = useState('');
  const [odHBase, setOdHBase] = useState<HorizontalPrismBase>('BI');
  const [odVDeltaStr, setOdVDeltaStr] = useState('');
  const [odVBase, setOdVBase] = useState<VerticalPrismBase>('BU');
  const [osHDeltaStr, setOsHDeltaStr] = useState('');
  const [osHBase, setOsHBase] = useState<HorizontalPrismBase>('BI');
  const [osVDeltaStr, setOsVDeltaStr] = useState('');
  const [osVBase, setOsVBase] = useState<VerticalPrismBase>('BU');
  const [totalHDeltaStr, setTotalHDeltaStr] = useState('');
  const [totalHBase, setTotalHBase] = useState<HorizontalPrismBase>('BI');
  const [totalVDeltaStr, setTotalVDeltaStr] = useState('');
  const [totalVBase, setTotalVBase] = useState<VerticalPrismBase>('BU');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [odShareStr, setOdShareStr] = useState('50');

  const num = (raw: string) => (raw.trim() === '' ? 0 : parseFloat(raw));
  const numOrUndefined = (raw: string) => (raw.trim() === '' ? undefined : parseFloat(raw));

  // --- Mode 1: Induced Prism ---
  const inducedInput = useMemo(
    () => ({
      od: {
        rx: { sphere: od.rx.sphere, cylinder: od.rx.cylinder, axis: od.rx.axis },
        horizontalPosition: { patientPdMm: parseFloat(odPatientPdStr), ocDistanceMm: parseFloat(odOcDistanceStr) },
        vertical: { mm: num(odVMmStr), direction: odVDir },
      },
      os: {
        rx: { sphere: os.rx.sphere, cylinder: os.rx.cylinder, axis: os.rx.axis },
        horizontalPosition: { patientPdMm: parseFloat(osPatientPdStr), ocDistanceMm: parseFloat(osOcDistanceStr) },
        vertical: { mm: num(osVMmStr), direction: osVDir },
      },
    }),
    [od.rx.sphere, od.rx.cylinder, od.rx.axis, os.rx.sphere, os.rx.cylinder, os.rx.axis, odPatientPdStr, odOcDistanceStr, odVMmStr, odVDir, osPatientPdStr, osOcDistanceStr, osVMmStr, osVDir],
  );
  const inducedErrors = useMemo(() => validateBinocularInducedPrismInput(inducedInput), [inducedInput]);
  const inducedResult = useMemo(() => {
    if (hasBinocularInducedPrismErrors(inducedErrors)) return null;
    return calculateBinocularInducedPrism(inducedInput);
  }, [inducedErrors, inducedInput]);

  // --- Mode 2: Required Decentration ---
  const requiredInput = useMemo(() => {
    const odPatientPd = numOrUndefined(odPatientPdStr);
    const osPatientPd = numOrUndefined(osPatientPdStr);
    const allocation =
      allocationMode === 'perEye'
        ? {
            mode: 'perEye' as const,
            od: { horizontalDiopters: num(odHDeltaStr), horizontalBase: odHBase, verticalDiopters: num(odVDeltaStr), verticalBase: odVBase },
            os: { horizontalDiopters: num(osHDeltaStr), horizontalBase: osHBase, verticalDiopters: num(osVDeltaStr), verticalBase: osVBase },
          }
        : {
            mode: 'total' as const,
            total: { horizontalDiopters: num(totalHDeltaStr), horizontalBase: totalHBase, verticalDiopters: num(totalVDeltaStr), verticalBase: totalVBase },
            horizontalSplit: { odFraction: splitMode === 'equal' ? 0.5 : num(odShareStr) / 100 },
            verticalSplit: { odFraction: splitMode === 'equal' ? 0.5 : num(odShareStr) / 100 },
          };
    return {
      od: { rx: { sphere: od.rx.sphere, cylinder: od.rx.cylinder, axis: od.rx.axis }, patientPdMm: odPatientPd },
      os: { rx: { sphere: os.rx.sphere, cylinder: os.rx.cylinder, axis: os.rx.axis }, patientPdMm: osPatientPd },
      allocation,
    };
  }, [
    od.rx.sphere, od.rx.cylinder, od.rx.axis, os.rx.sphere, os.rx.cylinder, os.rx.axis,
    odPatientPdStr, osPatientPdStr, allocationMode,
    odHDeltaStr, odHBase, odVDeltaStr, odVBase, osHDeltaStr, osHBase, osVDeltaStr, osVBase,
    totalHDeltaStr, totalHBase, totalVDeltaStr, totalVBase, splitMode, odShareStr,
  ]);
  const requiredErrors = useMemo(() => validateBinocularRequiredDecentrationInput(requiredInput), [requiredInput]);
  const requiredResult = useMemo(() => {
    if (hasBinocularRequiredDecentrationErrors(requiredErrors)) return null;
    return calculateBinocularRequiredDecentration(requiredInput);
  }, [requiredErrors, requiredInput]);

  const noRxYet = od.sphereStr.trim() === '' && od.cylinderStr.trim() === '' && os.sphereStr.trim() === '' && os.cylinderStr.trim() === '';

  const handleClear = () => {
    od.reset();
    os.reset();
    setOdPatientPdStr('');
    setOsPatientPdStr('');
    setOdOcDistanceStr('');
    setOsOcDistanceStr('');
    setOdVMmStr('');
    setOdVDir('UP');
    setOsVMmStr('');
    setOsVDir('UP');
    setAllocationMode('total');
    setOdHDeltaStr('');
    setOdHBase('BI');
    setOdVDeltaStr('');
    setOdVBase('BU');
    setOsHDeltaStr('');
    setOsHBase('BI');
    setOsVDeltaStr('');
    setOsVBase('BU');
    setTotalHDeltaStr('');
    setTotalHBase('BI');
    setTotalVDeltaStr('');
    setTotalVBase('BU');
    setSplitMode('equal');
    setOdShareStr('50');
  };

  const horizontalMismatch =
    inducedResult?.od.horizontal && inducedResult?.os.horizontal && inducedResult.od.horizontal.base !== inducedResult.os.horizontal.base;
  const verticalMismatch =
    inducedResult?.od.vertical && inducedResult?.os.vertical && inducedResult.od.vertical.base !== inducedResult.os.vertical.base;

  return (
    <IonPage>
      <PageHeader
        title="Prism & Decentration"
        subline="Induced prism and required optical-center decentration."
        backHref="/calculate"
        action={<FavoriteStarButton favorite={{ type: 'calculator', id: 'prism' }} label="Prism & Decentration" />}
      />
      <IonContent fullscreen className="ion-padding">
        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={(v) => setMode(v as 'induced' | 'required')} />

        <EyeRxFields label="OD" eye={od} errors={mode === 'induced' ? inducedErrors.od : requiredErrors.od} />
        <EyeRxFields label="OS" eye={os} errors={mode === 'induced' ? inducedErrors.os : requiredErrors.os} />

        {mode === 'induced' ? (
          <>
            <p className="rx-section-label">Patient's PD (distance from bridge to pupil)</p>
            <FieldBoxGrid columns={2}>
              <FieldBox
                label="OD"
                unit="mm"
                placeholder="0"
                value={odPatientPdStr}
                onChange={setOdPatientPdStr}
                error={odPatientPdStr.trim() !== '' ? inducedErrors.od.patientPdMm : undefined}
              />
              <FieldBox
                label="OS"
                unit="mm"
                placeholder="0"
                value={osPatientPdStr}
                onChange={setOsPatientPdStr}
                error={osPatientPdStr.trim() !== '' ? inducedErrors.os.patientPdMm : undefined}
              />
            </FieldBoxGrid>

            <p className="rx-section-label">Manufactured optical center (distance from bridge)</p>
            <FieldBoxGrid columns={2}>
              <FieldBox
                label="OD"
                unit="mm"
                placeholder="0"
                value={odOcDistanceStr}
                onChange={setOdOcDistanceStr}
                error={odOcDistanceStr.trim() !== '' ? inducedErrors.od.ocDistanceMm : undefined}
              />
              <FieldBox
                label="OS"
                unit="mm"
                placeholder="0"
                value={osOcDistanceStr}
                onChange={setOsOcDistanceStr}
                error={osOcDistanceStr.trim() !== '' ? inducedErrors.os.ocDistanceMm : undefined}
              />
            </FieldBoxGrid>

            <p className="rx-section-label">Vertical decentration</p>
            <FieldBoxGrid columns={2}>
              <FieldBox label="OD" unit="mm" placeholder="0" value={odVMmStr} onChange={setOdVMmStr} />
              <FieldBox label="OS" unit="mm" placeholder="0" value={osVMmStr} onChange={setOsVMmStr} />
            </FieldBoxGrid>
            <FieldBoxGrid columns={2}>
              <div>
                <span className="rx-fieldbox-label">OD direction</span>
                <SegmentedControl options={VERTICAL_DIRECTION_OPTIONS} value={odVDir} onChange={(v) => setOdVDir(v as VerticalDecentrationDirection)} />
              </div>
              <div>
                <span className="rx-fieldbox-label">OS direction</span>
                <SegmentedControl options={VERTICAL_DIRECTION_OPTIONS} value={osVDir} onChange={(v) => setOsVDir(v as VerticalDecentrationDirection)} />
              </div>
            </FieldBoxGrid>

            {noRxYet ? (
              <p className="rx-hint">Enter OD and OS sphere to calculate the induced prism. Add cylinder and axis for a toric Rx.</p>
            ) : inducedResult ? (
              <>
                <EyeInducedPrismPanel label="OD" result={inducedResult.od} />
                <EyeInducedPrismPanel label="OS" result={inducedResult.os} />

                {(inducedResult.combinedHorizontal || inducedResult.combinedVertical) && (
                  <CalculatorResult
                    primaryLabel="Combined Binocular Effect"
                    primaryValue={
                      inducedResult.combinedHorizontal
                        ? `${formatPrismDiopters(inducedResult.combinedHorizontal.diopters)} ${inducedResult.combinedHorizontal.base}`
                        : `${formatPrismDiopters(inducedResult.combinedVertical!.diopters)} ${inducedResult.combinedVertical!.base}`
                    }
                    secondaryLabel={inducedResult.combinedHorizontal && inducedResult.combinedVertical ? 'Vertical' : undefined}
                    secondaryValue={
                      inducedResult.combinedHorizontal && inducedResult.combinedVertical
                        ? `${formatPrismDiopters(inducedResult.combinedVertical.diopters)} ${inducedResult.combinedVertical.base}`
                        : undefined
                    }
                  />
                )}
                {horizontalMismatch && (
                  <p className="rx-hint">OD and OS induce opposing horizontal bases — shown separately; no single total applies.</p>
                )}
                {verticalMismatch && (
                  <p className="rx-hint">OD and OS induce opposing vertical bases — shown separately; no single total applies.</p>
                )}

                <Disclosure label="Calculation details">
                  <p>
                    OD decentration: {formatDecentrationMm(Math.abs(parseFloat(odOcDistanceStr) - parseFloat(odPatientPdStr)) || 0)}{' '}
                    {parseFloat(odOcDistanceStr) - parseFloat(odPatientPdStr) >= 0 ? 'OUT' : 'IN'} horizontal, {odVMmStr || '0'} mm {odVDir}{' '}
                    vertical.
                  </p>
                  <p>
                    OS decentration: {formatDecentrationMm(Math.abs(parseFloat(osOcDistanceStr) - parseFloat(osPatientPdStr)) || 0)}{' '}
                    {parseFloat(osOcDistanceStr) - parseFloat(osPatientPdStr) >= 0 ? 'OUT' : 'IN'} horizontal, {osVMmStr || '0'} mm {osVDir}{' '}
                    vertical.
                  </p>
                </Disclosure>
              </>
            ) : null}
          </>
        ) : (
          <>
            <p className="rx-section-label">Desired Prism</p>
            <SegmentedControl options={ALLOCATION_OPTIONS} value={allocationMode} onChange={(v) => setAllocationMode(v as 'perEye' | 'total')} />

            {allocationMode === 'total' ? (
              <>
                <FieldBoxGrid columns={2}>
                  <FieldBox
                    label="Total horizontal"
                    unit="Δ"
                    placeholder="0.00"
                    value={totalHDeltaStr}
                    onChange={setTotalHDeltaStr}
                    error={requiredErrors.total?.horizontalDiopters}
                  />
                  <FieldBox
                    label="Total vertical"
                    unit="Δ"
                    placeholder="0.00"
                    value={totalVDeltaStr}
                    onChange={setTotalVDeltaStr}
                    error={requiredErrors.total?.verticalDiopters}
                  />
                </FieldBoxGrid>
                <FieldBoxGrid columns={2}>
                  <div>
                    <span className="rx-fieldbox-label">Horizontal base</span>
                    <SegmentedControl options={HORIZONTAL_BASE_OPTIONS} value={totalHBase} onChange={(v) => setTotalHBase(v as HorizontalPrismBase)} />
                  </div>
                  <div>
                    <span className="rx-fieldbox-label">Vertical base</span>
                    <SegmentedControl options={VERTICAL_BASE_OPTIONS} value={totalVBase} onChange={(v) => setTotalVBase(v as VerticalPrismBase)} />
                  </div>
                </FieldBoxGrid>

                <p className="rx-section-label">Allocation between OD and OS</p>
                <SegmentedControl options={SPLIT_OPTIONS} value={splitMode} onChange={(v) => setSplitMode(v as 'equal' | 'custom')} />
                {splitMode === 'custom' && (
                  <FieldBox
                    label="OD share"
                    unit="%"
                    placeholder="50"
                    value={odShareStr}
                    onChange={setOdShareStr}
                    helperText="OS receives the remainder."
                    error={requiredErrors.horizontalSplit ?? requiredErrors.verticalSplit}
                  />
                )}
              </>
            ) : (
              <>
                <p className="rx-fieldbox-label">OD</p>
                <FieldBoxGrid columns={2}>
                  <FieldBox
                    label="Horizontal"
                    unit="Δ"
                    placeholder="0.00"
                    value={odHDeltaStr}
                    onChange={setOdHDeltaStr}
                    error={requiredErrors.odTarget?.horizontalDiopters}
                  />
                  <FieldBox
                    label="Vertical"
                    unit="Δ"
                    placeholder="0.00"
                    value={odVDeltaStr}
                    onChange={setOdVDeltaStr}
                    error={requiredErrors.odTarget?.verticalDiopters}
                  />
                </FieldBoxGrid>
                <FieldBoxGrid columns={2}>
                  <SegmentedControl options={HORIZONTAL_BASE_OPTIONS} value={odHBase} onChange={(v) => setOdHBase(v as HorizontalPrismBase)} />
                  <SegmentedControl options={VERTICAL_BASE_OPTIONS} value={odVBase} onChange={(v) => setOdVBase(v as VerticalPrismBase)} />
                </FieldBoxGrid>

                <p className="rx-fieldbox-label">OS</p>
                <FieldBoxGrid columns={2}>
                  <FieldBox
                    label="Horizontal"
                    unit="Δ"
                    placeholder="0.00"
                    value={osHDeltaStr}
                    onChange={setOsHDeltaStr}
                    error={requiredErrors.osTarget?.horizontalDiopters}
                  />
                  <FieldBox
                    label="Vertical"
                    unit="Δ"
                    placeholder="0.00"
                    value={osVDeltaStr}
                    onChange={setOsVDeltaStr}
                    error={requiredErrors.osTarget?.verticalDiopters}
                  />
                </FieldBoxGrid>
                <FieldBoxGrid columns={2}>
                  <SegmentedControl options={HORIZONTAL_BASE_OPTIONS} value={osHBase} onChange={(v) => setOsHBase(v as HorizontalPrismBase)} />
                  <SegmentedControl options={VERTICAL_BASE_OPTIONS} value={osVBase} onChange={(v) => setOsVBase(v as VerticalPrismBase)} />
                </FieldBoxGrid>
              </>
            )}

            <p className="rx-section-label">Patient's PD (optional — enables an ordering-PD result)</p>
            <FieldBoxGrid columns={2}>
              <FieldBox
                label="OD"
                unit="mm"
                placeholder="0"
                value={odPatientPdStr}
                onChange={setOdPatientPdStr}
                error={odPatientPdStr.trim() !== '' ? requiredErrors.od.patientPdMm : undefined}
              />
              <FieldBox
                label="OS"
                unit="mm"
                placeholder="0"
                value={osPatientPdStr}
                onChange={setOsPatientPdStr}
                error={osPatientPdStr.trim() !== '' ? requiredErrors.os.patientPdMm : undefined}
              />
            </FieldBoxGrid>

            {noRxYet ? (
              <p className="rx-hint">Enter OD and OS sphere to calculate the required decentration. Add cylinder and axis for a toric Rx.</p>
            ) : requiredResult ? (
              <>
                <EyeRequiredDecentrationPanel label="OD" result={requiredResult.od} />
                <EyeRequiredDecentrationPanel label="OS" result={requiredResult.os} />
              </>
            ) : null}
          </>
        )}

        <ActionRow onClear={handleClear} />
      </IonContent>
    </IonPage>
  );
};

export default PrismCalculator;

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
  type EyeHorizontalInducedPrismResult,
  type EyeRequiredDecentrationResult,
  type HorizontalPrismBase,
  type HorizontalPrismTarget,
  type VerticalPrismBase,
  type VerticalPrismRelationship,
  type VerticalPrismTarget,
} from '../../domain/calculators/prism';
import { formatDecentrationMm, formatPrismDiopters } from './formatPrism';
import { formatDiopter, parseSphereInput } from './formatDiopter';
import { decentrationCautionLines } from './decentrationWarnings';
import OcPlacementDiagram from './OcPlacementDiagram';
import PageHeader from '../../components/PageHeader';
import FavoriteStarButton from '../../components/FavoriteStarButton';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import CalculatorResult from '../../components/CalculatorResult';
import CautionBox from '../../components/CautionBox';
import Disclosure from '../../components/Disclosure';
import ActionRow from '../../components/ActionRow';
import SegmentedControl from '../../components/SegmentedControl';

const MODE_OPTIONS = [
  { value: 'induced', label: 'Induced Prism' },
  { value: 'required', label: 'Required Decentration' },
];
const HORIZONTAL_BASE_OPTIONS = [
  { value: 'BI', label: 'BI' },
  { value: 'BO', label: 'BO' },
];
const VERTICAL_BASE_OPTIONS = [
  { value: 'BU', label: 'BU' },
  { value: 'BD', label: 'BD' },
];
const HORIZONTAL_ALLOCATION_OPTIONS = [
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

// --- Mode 1: Induced Prism ---------------------------------------------

const EyeInducedPrismPanel: React.FC<{ label: string; result: EyeHorizontalInducedPrismResult }> = ({ label, result }) => {
  if (!result.prism) {
    return (
      <div className="rx-undefined">
        <div className="rx-result-panel-label">{label}</div>
        <p>No measurable horizontal prism induced.</p>
      </div>
    );
  }
  return (
    <CalculatorResult primaryLabel={label} primaryValue={`${formatPrismDiopters(result.prism.diopters)} ${result.prism.base}`}>
      <div className="rx-result-secondary-row">
        <span className="rx-result-secondary-label">Decentration</span>
        <span className="rx-result-secondary-value">
          {formatDecentrationMm(result.decentration.mm)} {result.decentration.direction}
        </span>
      </div>
      <div className="rx-result-secondary-row">
        <span className="rx-result-secondary-label">F180 (horizontal power used)</span>
        <span className="rx-result-secondary-value">{formatDiopter(result.f180)} D</span>
      </div>
    </CalculatorResult>
  );
};

// --- Mode 2: Required Decentration --------------------------------------

const EyeRequiredDecentrationPanel: React.FC<{ label: string; result: EyeRequiredDecentrationResult }> = ({ label, result }) => {
  const { allocatedHorizontal, relevantPower, horizontal, vertical, orderingPdMm, caution } = result;

  const desiredParts: string[] = [];
  if (allocatedHorizontal && allocatedHorizontal.diopters > 0) {
    desiredParts.push(`${formatPrismDiopters(allocatedHorizontal.diopters)} ${allocatedHorizontal.base}`);
  }
  const desiredText = desiredParts.length > 0 ? desiredParts.join('  +  ') : 'None';

  const horizontalSingular = horizontal.kind === 'singularity';
  const verticalSingular = vertical.kind === 'singularity';
  const horizontalDefined = horizontal.kind === 'defined' ? horizontal : undefined;
  const verticalDefined = vertical.kind === 'defined' ? vertical : undefined;

  if (!horizontalDefined && !verticalDefined && !horizontalSingular && !verticalSingular) {
    // Distinguish "nothing was entered for this eye" from "something was entered and it
    // genuinely resolved to zero" — a blank field must never be reported as an explicit zero.
    const nothingSpecified = horizontal.kind === 'not-specified' && vertical.kind === 'not-specified';
    return (
      <div className="rx-undefined">
        <div className="rx-result-panel-label">{label}</div>
        <p>{nothingSpecified ? 'No horizontal or vertical prism specified for this eye.' : 'No decentration needed — the desired prism for this eye is zero.'}</p>
      </div>
    );
  }

  const hasDefinedResult = Boolean(horizontalDefined || verticalDefined);
  const decentrationCaution = decentrationCautionLines(horizontalDefined, verticalDefined);

  return (
    <CalculatorResult
      primaryLabel={`${label} — Optical center`}
      primaryValue={
        horizontalDefined
          ? `${formatDecentrationMm(horizontalDefined.mm)} ${horizontalDefined.direction}`
          : verticalDefined
            ? `${formatDecentrationMm(verticalDefined.mm)} ${verticalDefined.direction}`
            : 'Undefined'
      }
      primaryCaption={hasDefinedResult ? 'relative to pupil / patient PD' : undefined}
      secondaryLabel={horizontalDefined && verticalDefined ? 'Vertical' : undefined}
      secondaryValue={horizontalDefined && verticalDefined ? `${formatDecentrationMm(verticalDefined.mm)} ${verticalDefined.direction}` : undefined}
      caution={caution}
    >
      <div className="rx-result-secondary-row">
        <span className="rx-result-secondary-label">Desired</span>
        <span className="rx-result-secondary-value">{desiredText}</span>
      </div>
      {horizontalSingular && (
        <p className="rx-hint">Horizontal decentration is mathematically undefined for {label} — the horizontal (180°) meridian is plano.</p>
      )}
      {verticalSingular && <p className="rx-hint">Vertical decentration is mathematically undefined for {label} — the vertical (90°) meridian is plano.</p>}
      {(horizontalDefined || horizontalSingular) && (
        <div className="rx-result-secondary-row">
          <span className="rx-result-secondary-label">F180 (horizontal power used)</span>
          <span className="rx-result-secondary-value">{formatDiopter(relevantPower.f180)} D</span>
        </div>
      )}
      {(verticalDefined || verticalSingular) && (
        <div className="rx-result-secondary-row">
          <span className="rx-result-secondary-label">F90 (vertical power used)</span>
          <span className="rx-result-secondary-value">{formatDiopter(relevantPower.f90)} D</span>
        </div>
      )}
      {orderingPdMm !== undefined && (
        <div className="rx-result-secondary-row">
          <span className="rx-result-secondary-label">Target OC</span>
          <span className="rx-result-secondary-value">{orderingPdMm.toFixed(1)} mm</span>
        </div>
      )}

      {decentrationCaution && (
        <CautionBox className="rx-result-caution">
          {decentrationCaution.map((line, i) => (
            <p className="rx-caution-text" key={line}>
              {i < decentrationCaution.length - 1 ? <strong>{line}</strong> : line}
            </p>
          ))}
        </CautionBox>
      )}
    </CalculatorResult>
  );
};

/** Narrows a horizontal-axis result to the {mm, direction} shape OcPlacementDiagram needs, or undefined when there's nothing to show for that axis. */
function definedHorizontal(result: EyeRequiredDecentrationResult['horizontal']) {
  return result.kind === 'defined' ? { mm: result.mm, direction: result.direction } : undefined;
}

/** Same as definedHorizontal, for the vertical axis. */
function definedVertical(result: EyeRequiredDecentrationResult['vertical']) {
  return result.kind === 'defined' ? { mm: result.mm, direction: result.direction } : undefined;
}

const VerticalRelationshipPanel: React.FC<{ relationship: VerticalPrismRelationship }> = ({ relationship }) => {
  if (!relationship.imbalance && !relationship.yoked) return null;
  return (
    <CalculatorResult
      primaryLabel="Vertical imbalance between the eyes"
      primaryValue={relationship.imbalance ? `${formatPrismDiopters(relationship.imbalance.diopters)} (more BU in ${relationship.imbalance.moreBuEye})` : 'None — fully yoked'}
    >
      {relationship.yoked && (
        <div className="rx-result-secondary-row">
          <span className="rx-result-secondary-label">Common (yoked) component</span>
          <span className="rx-result-secondary-value">
            {formatPrismDiopters(relationship.yoked.diopters)} {relationship.yoked.base}
          </span>
        </div>
      )}
      <p className="rx-hint">
        {relationship.yoked
          ? 'The yoked component shifts both eyes’ view together and is not a source of vertical diplopia. Only the imbalance above is the relative demand between the eyes.'
          : 'This is the net relative vertical prism between the eyes — the figure relevant to vertical diplopia/fusion, not a simple OD + OS sum.'}
      </p>
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

  // Mode 1 only: where the lenses were actually manufactured/ground — horizontal only.
  const [odOcDistanceStr, setOdOcDistanceStr] = useState('');
  const [osOcDistanceStr, setOsOcDistanceStr] = useState('');

  // Mode 2 only.
  const [horizontalAllocationMode, setHorizontalAllocationMode] = useState<'perEye' | 'total'>('total');
  const [odHDeltaStr, setOdHDeltaStr] = useState('');
  const [odHBase, setOdHBase] = useState<HorizontalPrismBase>('BI');
  const [osHDeltaStr, setOsHDeltaStr] = useState('');
  const [osHBase, setOsHBase] = useState<HorizontalPrismBase>('BI');
  const [totalHDeltaStr, setTotalHDeltaStr] = useState('');
  const [totalHBase, setTotalHBase] = useState<HorizontalPrismBase>('BI');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [odShareStr, setOdShareStr] = useState('50');
  const [odVDeltaStr, setOdVDeltaStr] = useState('');
  const [odVBase, setOdVBase] = useState<VerticalPrismBase>('BU');
  const [osVDeltaStr, setOsVDeltaStr] = useState('');
  const [osVBase, setOsVBase] = useState<VerticalPrismBase>('BU');

  const numOrUndefined = (raw: string) => (raw.trim() === '' ? undefined : parseFloat(raw));
  // A blank amount field means "not specified" for that component, never a fabricated 0Δ — see
  // the domain layer's HorizontalDecentrationResult/VerticalDecentrationResult 'not-specified'
  // kind and allocateHorizontal, both of which rely on receiving `undefined` here rather than 0.
  const buildHorizontalTarget = (raw: string, base: HorizontalPrismBase): HorizontalPrismTarget | undefined =>
    raw.trim() === '' ? undefined : { diopters: parseFloat(raw), base };
  const buildVerticalTarget = (raw: string, base: VerticalPrismBase): VerticalPrismTarget | undefined =>
    raw.trim() === '' ? undefined : { diopters: parseFloat(raw), base };

  // --- Mode 1: Induced Prism (horizontal only) ---
  const inducedInput = useMemo(
    () => ({
      od: {
        rx: { sphere: od.rx.sphere, cylinder: od.rx.cylinder, axis: od.rx.axis },
        position: { patientPdMm: parseFloat(odPatientPdStr), ocDistanceMm: parseFloat(odOcDistanceStr) },
      },
      os: {
        rx: { sphere: os.rx.sphere, cylinder: os.rx.cylinder, axis: os.rx.axis },
        position: { patientPdMm: parseFloat(osPatientPdStr), ocDistanceMm: parseFloat(osOcDistanceStr) },
      },
    }),
    [od.rx.sphere, od.rx.cylinder, od.rx.axis, os.rx.sphere, os.rx.cylinder, os.rx.axis, odPatientPdStr, odOcDistanceStr, osPatientPdStr, osOcDistanceStr],
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
    // Equal split omits `split` entirely (the domain layer's own default), so it's never
    // confused with "custom split chosen but share not yet entered" — see allocateHorizontal.
    const odShareValue = numOrUndefined(odShareStr);
    const horizontal =
      horizontalAllocationMode === 'perEye'
        ? { mode: 'perEye' as const, od: buildHorizontalTarget(odHDeltaStr, odHBase), os: buildHorizontalTarget(osHDeltaStr, osHBase) }
        : {
            mode: 'total' as const,
            total: buildHorizontalTarget(totalHDeltaStr, totalHBase),
            split: splitMode === 'equal' ? undefined : { odFraction: odShareValue !== undefined ? odShareValue / 100 : undefined },
          };
    return {
      od: { rx: { sphere: od.rx.sphere, cylinder: od.rx.cylinder, axis: od.rx.axis }, patientPdMm: odPatientPd, vertical: buildVerticalTarget(odVDeltaStr, odVBase) },
      os: { rx: { sphere: os.rx.sphere, cylinder: os.rx.cylinder, axis: os.rx.axis }, patientPdMm: osPatientPd, vertical: buildVerticalTarget(osVDeltaStr, osVBase) },
      horizontal,
    };
  }, [
    od.rx.sphere, od.rx.cylinder, od.rx.axis, os.rx.sphere, os.rx.cylinder, os.rx.axis,
    odPatientPdStr, osPatientPdStr, horizontalAllocationMode,
    odHDeltaStr, odHBase, osHDeltaStr, osHBase,
    totalHDeltaStr, totalHBase, splitMode, odShareStr,
    odVDeltaStr, odVBase, osVDeltaStr, osVBase,
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
    setHorizontalAllocationMode('total');
    setOdHDeltaStr('');
    setOdHBase('BI');
    setOsHDeltaStr('');
    setOsHBase('BI');
    setTotalHDeltaStr('');
    setTotalHBase('BI');
    setSplitMode('equal');
    setOdShareStr('50');
    setOdVDeltaStr('');
    setOdVBase('BU');
    setOsVDeltaStr('');
    setOsVBase('BU');
  };

  const horizontalMismatch = inducedResult?.od.prism && inducedResult?.os.prism && inducedResult.od.prism.base !== inducedResult.os.prism.base;

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
            <p className="rx-hint" style={{ marginTop: 0 }}>
              What horizontal prism does the patient actually experience, given how the lenses were manufactured?
            </p>

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

            <p className="rx-section-label">Manufactured monocular optical center (distance from bridge)</p>
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

            {noRxYet ? (
              <p className="rx-hint">Enter OD and OS sphere to calculate the induced prism. Add cylinder and axis for a toric Rx.</p>
            ) : inducedResult ? (
              <>
                <EyeInducedPrismPanel label="OD" result={inducedResult.od} />
                <EyeInducedPrismPanel label="OS" result={inducedResult.os} />

                {inducedResult.totalHorizontal && (
                  <CalculatorResult
                    primaryLabel="Total horizontal prism (OD + OS)"
                    primaryValue={`${formatPrismDiopters(inducedResult.totalHorizontal.diopters)} ${inducedResult.totalHorizontal.base}`}
                  />
                )}
                {horizontalMismatch && (
                  <p className="rx-hint">OD and OS induce opposing horizontal bases — shown separately; no single total applies.</p>
                )}

                <Disclosure label="Calculation details">
                  <p>
                    OD: {formatDecentrationMm(inducedResult.od.decentration.mm)} {inducedResult.od.decentration.direction} horizontal decentration,
                    F180 = {formatDiopter(inducedResult.od.f180)} D.
                  </p>
                  <p>
                    OS: {formatDecentrationMm(inducedResult.os.decentration.mm)} {inducedResult.os.decentration.direction} horizontal decentration,
                    F180 = {formatDiopter(inducedResult.os.f180)} D.
                  </p>
                </Disclosure>
              </>
            ) : null}
          </>
        ) : (
          <>
            <p className="rx-hint" style={{ marginTop: 0 }}>
              A particular prism is wanted. How much optical-center decentration is required to produce it?
            </p>

            <p className="rx-section-label">Desired horizontal prism</p>
            <SegmentedControl
              options={HORIZONTAL_ALLOCATION_OPTIONS}
              value={horizontalAllocationMode}
              onChange={(v) => setHorizontalAllocationMode(v as 'perEye' | 'total')}
            />

            {horizontalAllocationMode === 'total' ? (
              <>
                <FieldBoxGrid columns={2}>
                  <FieldBox
                    label="Total horizontal (both eyes)"
                    unit="Δ"
                    placeholder="0.00"
                    value={totalHDeltaStr}
                    onChange={setTotalHDeltaStr}
                    error={requiredErrors.totalHorizontal?.diopters}
                  />
                  <div>
                    <span className="rx-fieldbox-label">Base</span>
                    <SegmentedControl options={HORIZONTAL_BASE_OPTIONS} value={totalHBase} onChange={(v) => setTotalHBase(v as HorizontalPrismBase)} />
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
                    error={requiredErrors.horizontalSplit}
                  />
                )}
              </>
            ) : (
              <>
                <p className="rx-section-label">OD horizontal</p>
                <FieldBoxGrid columns={2}>
                  <FieldBox label="Prism" unit="Δ" placeholder="0.00" value={odHDeltaStr} onChange={setOdHDeltaStr} error={requiredErrors.odHorizontal?.diopters} />
                  <div>
                    <span className="rx-fieldbox-label">Base</span>
                    <SegmentedControl options={HORIZONTAL_BASE_OPTIONS} value={odHBase} onChange={(v) => setOdHBase(v as HorizontalPrismBase)} />
                  </div>
                </FieldBoxGrid>

                <p className="rx-section-label">OS horizontal</p>
                <FieldBoxGrid columns={2}>
                  <FieldBox label="Prism" unit="Δ" placeholder="0.00" value={osHDeltaStr} onChange={setOsHDeltaStr} error={requiredErrors.osHorizontal?.diopters} />
                  <div>
                    <span className="rx-fieldbox-label">Base</span>
                    <SegmentedControl options={HORIZONTAL_BASE_OPTIONS} value={osHBase} onChange={(v) => setOsHBase(v as HorizontalPrismBase)} />
                  </div>
                </FieldBoxGrid>
              </>
            )}

            <p className="rx-section-label">Desired vertical prism (always per eye)</p>
            <FieldBoxGrid columns={2}>
              <FieldBox label="OD prism" unit="Δ" placeholder="0.00" value={odVDeltaStr} onChange={setOdVDeltaStr} error={requiredErrors.od.verticalDiopters} />
              <FieldBox label="OS prism" unit="Δ" placeholder="0.00" value={osVDeltaStr} onChange={setOsVDeltaStr} error={requiredErrors.os.verticalDiopters} />
            </FieldBoxGrid>
            <FieldBoxGrid columns={2}>
              <div>
                <span className="rx-fieldbox-label">OD base</span>
                <SegmentedControl options={VERTICAL_BASE_OPTIONS} value={odVBase} onChange={(v) => setOdVBase(v as VerticalPrismBase)} />
              </div>
              <div>
                <span className="rx-fieldbox-label">OS base</span>
                <SegmentedControl options={VERTICAL_BASE_OPTIONS} value={osVBase} onChange={(v) => setOsVBase(v as VerticalPrismBase)} />
              </div>
            </FieldBoxGrid>

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
                {requiredResult.verticalRelationship && <VerticalRelationshipPanel relationship={requiredResult.verticalRelationship} />}

                {(definedHorizontal(requiredResult.od.horizontal) ||
                  definedVertical(requiredResult.od.vertical) ||
                  definedHorizontal(requiredResult.os.horizontal) ||
                  definedVertical(requiredResult.os.vertical)) && (
                  <Disclosure label="Visualize OC placement">
                    <OcPlacementDiagram
                      od={{ horizontal: definedHorizontal(requiredResult.od.horizontal), vertical: definedVertical(requiredResult.od.vertical) }}
                      os={{ horizontal: definedHorizontal(requiredResult.os.horizontal), vertical: definedVertical(requiredResult.os.vertical) }}
                    />
                  </Disclosure>
                )}
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

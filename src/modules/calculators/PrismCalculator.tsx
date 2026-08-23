import { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import {
  calculateInducedPrism,
  calculateRequiredDecentration,
  validateInducedPrismInput,
  validateRequiredDecentrationInput,
  type HorizontalDecentrationDirection,
  type HorizontalPrismBase,
  type VerticalDecentrationDirection,
  type VerticalPrismBase,
} from '../../domain/calculators/prism';
import { formatDecentrationMm, formatPrismDiopters } from './formatPrism';
import { parseSphereInput } from './formatDiopter';
import PageHeader from '../../components/PageHeader';
import FavoriteStarButton from '../../components/FavoriteStarButton';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import CalculatorResult from '../../components/CalculatorResult';
import ActionRow from '../../components/ActionRow';
import SegmentedControl from '../../components/SegmentedControl';

const MODE_OPTIONS = [
  { value: 'forward', label: 'Induced Prism' },
  { value: 'reverse', label: 'Required Decentration' },
];
const HORIZONTAL_DIRECTION_OPTIONS = [
  { value: 'IN', label: 'IN' },
  { value: 'OUT', label: 'OUT' },
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

const PrismCalculator: React.FC = () => {
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward');

  const [sphereStr, setSphereStr] = useState('');
  const [cylinderStr, setCylinderStr] = useState('');
  const [axisStr, setAxisStr] = useState('');

  const [hMmStr, setHMmStr] = useState('');
  const [hDir, setHDir] = useState<HorizontalDecentrationDirection>('OUT');
  const [vMmStr, setVMmStr] = useState('');
  const [vDir, setVDir] = useState<VerticalDecentrationDirection>('UP');

  const [hDeltaStr, setHDeltaStr] = useState('');
  const [hBase, setHBase] = useState<HorizontalPrismBase>('BO');
  const [vDeltaStr, setVDeltaStr] = useState('');
  const [vBase, setVBase] = useState<VerticalPrismBase>('BU');

  const sphere = parseSphereInput(sphereStr);
  // Blank means "no cylinder" (spherical) — not a missing/invalid value.
  const cylinder = cylinderStr.trim() === '' ? 0 : parseFloat(cylinderStr);
  const axis = parseInt(axisStr, 10);
  const rx = { sphere, cylinder, axis };

  // Blank decentration/prism amounts default to zero, matching the app's cylinder-field convention.
  const horizontalMm = hMmStr.trim() === '' ? 0 : parseFloat(hMmStr);
  const verticalMm = vMmStr.trim() === '' ? 0 : parseFloat(vMmStr);
  const horizontalDiopters = hDeltaStr.trim() === '' ? 0 : parseFloat(hDeltaStr);
  const verticalDiopters = vDeltaStr.trim() === '' ? 0 : parseFloat(vDeltaStr);

  const forwardErrors = useMemo(
    () =>
      validateInducedPrismInput({
        rx,
        decentration: { horizontalMm, horizontalDirection: hDir, verticalMm, verticalDirection: vDir },
      }),
    [rx.sphere, rx.cylinder, rx.axis, horizontalMm, hDir, verticalMm, vDir],
  );

  const forwardResult = useMemo(() => {
    if (Object.keys(forwardErrors).length > 0) return null;
    return calculateInducedPrism(rx, { horizontalMm, horizontalDirection: hDir, verticalMm, verticalDirection: vDir });
  }, [forwardErrors, rx.sphere, rx.cylinder, rx.axis, horizontalMm, hDir, verticalMm, vDir]);

  const reverseErrors = useMemo(
    () =>
      validateRequiredDecentrationInput({
        rx,
        target: { horizontalDiopters, horizontalBase: hBase, verticalDiopters, verticalBase: vBase },
      }),
    [rx.sphere, rx.cylinder, rx.axis, horizontalDiopters, hBase, verticalDiopters, vBase],
  );

  const reverseOutcome = useMemo(() => {
    if (Object.keys(reverseErrors).length > 0) return null;
    return calculateRequiredDecentration(rx, { horizontalDiopters, horizontalBase: hBase, verticalDiopters, verticalBase: vBase });
  }, [reverseErrors, rx.sphere, rx.cylinder, rx.axis, horizontalDiopters, hBase, verticalDiopters, vBase]);

  // An oblique cylinder axis couples horizontal and vertical effects (Fxy != 0 unless axis is
  // 90 or 180). Only worth a note when the user asked for a "pure" single-axis target but the
  // oblique coupling means the other axis is required too — not on every oblique-axis result.
  const showCouplingNote =
    reverseOutcome?.ok &&
    cylinder !== 0 &&
    axis !== 90 &&
    axis !== 180 &&
    ((horizontalDiopters > 0 && verticalDiopters === 0 && reverseOutcome.result.vertical) ||
      (verticalDiopters > 0 && horizontalDiopters === 0 && reverseOutcome.result.horizontal));

  // Rx fields are shared between modes, so errors from whichever mode is active drive display.
  const activeRxErrors = mode === 'forward' ? forwardErrors : reverseErrors;

  const showFieldError = (field: 'sphere' | 'cylinder' | 'axis', raw: string) => raw.trim() !== '' && Boolean(activeRxErrors[field]);

  // Axis's required-ness depends on cylinder: once cylinder is non-zero, proactively surface
  // "axis needed" even before the field is touched, rather than silently withholding a result.
  const showAxisError = cylinder !== 0 ? Boolean(activeRxErrors.axis) : showFieldError('axis', axisStr);

  const noRxYet = sphereStr.trim() === '' && cylinderStr.trim() === '' && axisStr.trim() === '';

  const handleClear = () => {
    setSphereStr('');
    setCylinderStr('');
    setAxisStr('');
    setHMmStr('');
    setHDir('OUT');
    setVMmStr('');
    setVDir('UP');
    setHDeltaStr('');
    setHBase('BO');
    setVDeltaStr('');
    setVBase('BU');
  };

  return (
    <IonPage>
      <PageHeader
        title="Prism"
        subline="Prentice's Rule"
        backHref="/calculate"
        action={<FavoriteStarButton favorite={{ type: 'calculator', id: 'prism' }} label="Prism" />}
      />
      <IonContent fullscreen className="ion-padding">
        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={(v) => setMode(v as 'forward' | 'reverse')} />

        <p className="rx-section-label">Rx (minus cylinder)</p>
        <FieldBoxGrid columns={3}>
          <FieldBox
            label="SPH"
            placeholder="0.00"
            helperText="Plano: type Pln"
            inputMode="text"
            value={sphereStr}
            onChange={setSphereStr}
            error={showFieldError('sphere', sphereStr) ? activeRxErrors.sphere : undefined}
          />
          <FieldBox
            label="CYL"
            placeholder="0.00"
            value={cylinderStr}
            onChange={setCylinderStr}
            error={showFieldError('cylinder', cylinderStr) ? activeRxErrors.cylinder : undefined}
          />
          <FieldBox
            label="AXIS (1–180°)"
            inputMode="numeric"
            value={axisStr}
            onChange={setAxisStr}
            disabled={cylinder === 0}
            error={showAxisError ? activeRxErrors.axis : undefined}
          />
        </FieldBoxGrid>

        {mode === 'forward' ? (
          <>
            <p className="rx-section-label">Decentration</p>
            <FieldBoxGrid columns={2}>
              <FieldBox label="Horizontal" unit="mm" placeholder="0" value={hMmStr} onChange={setHMmStr} />
              <FieldBox label="Vertical" unit="mm" placeholder="0" value={vMmStr} onChange={setVMmStr} />
            </FieldBoxGrid>
            <FieldBoxGrid columns={2}>
              <div>
                <span className="rx-fieldbox-label">Horizontal direction</span>
                <SegmentedControl options={HORIZONTAL_DIRECTION_OPTIONS} value={hDir} onChange={(v) => setHDir(v as HorizontalDecentrationDirection)} />
              </div>
              <div>
                <span className="rx-fieldbox-label">Vertical direction</span>
                <SegmentedControl options={VERTICAL_DIRECTION_OPTIONS} value={vDir} onChange={(v) => setVDir(v as VerticalDecentrationDirection)} />
              </div>
            </FieldBoxGrid>

            {noRxYet ? (
              <p className="rx-hint">Enter sphere to calculate induced prism. Add cylinder and axis for a toric Rx.</p>
            ) : forwardResult ? (
              forwardResult.horizontal || forwardResult.vertical ? (
                <CalculatorResult
                  primaryLabel="Induced Prism"
                  primaryValue={
                    forwardResult.horizontal
                      ? `${formatPrismDiopters(forwardResult.horizontal.diopters)} ${forwardResult.horizontal.base}`
                      : `${formatPrismDiopters(forwardResult.vertical!.diopters)} ${forwardResult.vertical!.base}`
                  }
                  secondaryLabel={forwardResult.horizontal && forwardResult.vertical ? 'Vertical' : undefined}
                  secondaryValue={
                    forwardResult.horizontal && forwardResult.vertical
                      ? `${formatPrismDiopters(forwardResult.vertical.diopters)} ${forwardResult.vertical.base}`
                      : undefined
                  }
                />
              ) : (
                <p className="rx-hint">No prism induced — this decentration produces no measurable prismatic effect.</p>
              )
            ) : null}
          </>
        ) : (
          <>
            <p className="rx-section-label">Desired Prism</p>
            <FieldBoxGrid columns={2}>
              <FieldBox label="Horizontal" unit="Δ" placeholder="0.00" value={hDeltaStr} onChange={setHDeltaStr} />
              <FieldBox label="Vertical" unit="Δ" placeholder="0.00" value={vDeltaStr} onChange={setVDeltaStr} />
            </FieldBoxGrid>
            <FieldBoxGrid columns={2}>
              <div>
                <span className="rx-fieldbox-label">Horizontal base</span>
                <SegmentedControl options={HORIZONTAL_BASE_OPTIONS} value={hBase} onChange={(v) => setHBase(v as HorizontalPrismBase)} />
              </div>
              <div>
                <span className="rx-fieldbox-label">Vertical base</span>
                <SegmentedControl options={VERTICAL_BASE_OPTIONS} value={vBase} onChange={(v) => setVBase(v as VerticalPrismBase)} />
              </div>
            </FieldBoxGrid>

            {noRxYet ? (
              <p className="rx-hint">Enter sphere to calculate required decentration. Add cylinder and axis for a toric Rx.</p>
            ) : reverseOutcome && !reverseOutcome.ok ? (
              <div className="rx-undefined">
                <p>
                  This decentration requirement is mathematically undefined — a principal meridian of this Rx is
                  plano (zero power), so no decentration can produce prism there.
                </p>
              </div>
            ) : reverseOutcome && reverseOutcome.ok ? (
              reverseOutcome.result.horizontal || reverseOutcome.result.vertical ? (
                <CalculatorResult
                  primaryLabel="Required Decentration"
                  primaryValue={
                    reverseOutcome.result.horizontal
                      ? `${formatDecentrationMm(reverseOutcome.result.horizontal.mm)} ${reverseOutcome.result.horizontal.direction}`
                      : `${formatDecentrationMm(reverseOutcome.result.vertical!.mm)} ${reverseOutcome.result.vertical!.direction}`
                  }
                  secondaryLabel={reverseOutcome.result.horizontal && reverseOutcome.result.vertical ? 'Vertical' : undefined}
                  secondaryValue={
                    reverseOutcome.result.horizontal && reverseOutcome.result.vertical
                      ? `${formatDecentrationMm(reverseOutcome.result.vertical.mm)} ${reverseOutcome.result.vertical.direction}`
                      : undefined
                  }
                  caution={
                    showCouplingNote
                      ? "This Rx's oblique cylinder axis couples horizontal and vertical effects — reaching this target precisely requires decentering in both directions."
                      : undefined
                  }
                />
              ) : (
                <p className="rx-hint">No decentration needed — the desired prism is zero.</p>
              )
            ) : null}
          </>
        )}

        <ActionRow onClear={handleClear} />
      </IonContent>
    </IonPage>
  );
};

export default PrismCalculator;

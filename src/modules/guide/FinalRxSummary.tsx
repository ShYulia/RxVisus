import CompactCard from '../../components/CompactCard';
import type { Prescription } from '../../domain/calculators/transposition';
import { PRISM_DISTRIBUTION_NOTES } from '../../domain/reference/clinicalPathways';
import { formatPrismMeasurement, splitPrismEqually, type BestCorrection, type EyePrismSplit, type PrismMeasurement } from '../../domain/reference/prismMeasurement';
import { formatRx } from '../calculators/formatDiopter';

function eyePrismChips(split: EyePrismSplit): { key: string; text: string }[] {
  const chips: { key: string; text: string }[] = [];
  if (split.horizontal) chips.push({ key: 'h', text: `${split.horizontal.amount.toFixed(2)}Δ ${split.horizontal.base}` });
  if (split.vertical) chips.push({ key: 'v', text: `${split.vertical.amount.toFixed(2)}Δ ${split.vertical.base}` });
  return chips;
}

/** One eye's row in the primary Final Rx card: Rx first, then its prism component(s) as prominent chips — both horizontal and vertical shown together when an eye carries both. */
const EyeResultRow: React.FC<{ eyeLabel: string; rx: Prescription; split: EyePrismSplit }> = ({ eyeLabel, rx, split }) => {
  const chips = eyePrismChips(split);
  return (
    <div className="rx-finalrx-eye">
      <span className="rx-finalrx-eye-label">{eyeLabel}</span>
      <span className="rx-finalrx-eye-rx">{formatRx(rx)}</span>
      {chips.length > 0 && (
        <div className="rx-finalrx-prism-row">
          {chips.map((chip) => (
            <span key={chip.key} className="rx-finalrx-prism-chip">
              {chip.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export interface FinalRxSummaryProps {
  measurement: PrismMeasurement | null;
  bestCorrection: BestCorrection | null;
  trialOutcomeLabel?: string;
}

/**
 * The flow's real endpoint after a successful trial. Same visual hierarchy as Binocular
 * Status Summary: a prominent primary result card first (here, the Final Rx per eye — best
 * correction plus assigned prism, both eyes easy to scan independently), then a compact
 * always-visible "what was measured/trialled" card, then Prism Prescribing Guidance tucked
 * into a closed-by-default disclosure so it never competes with the actual result for
 * attention. Prism calculation (splitPrismEqually) is untouched — this only changes how its
 * output is presented.
 */
const FinalRxSummary: React.FC<FinalRxSummaryProps> = ({ measurement, bestCorrection, trialOutcomeLabel }) => {
  if (!measurement || !bestCorrection) {
    return <p className="rx-hint">Missing measurement or best correction — go back and complete those steps first.</p>;
  }

  const distribution = splitPrismEqually(measurement);

  return (
    <div className="rx-final-rx">
      <div className="rx-summary-result-card">
        <p className="rx-summary-result-label">Final Rx</p>
        <div className="rx-finalrx-eyes">
          <EyeResultRow eyeLabel="OD" rx={bestCorrection.od} split={distribution.od} />
          <EyeResultRow eyeLabel="OS" rx={bestCorrection.os} split={distribution.os} />
        </div>
      </div>

      <div className="rx-summary-why-card">
        <p className="rx-summary-pattern-why">Measured &amp; Trial</p>
        <p className="rx-final-rx-row">
          <span>Measured/trialled:</span> <strong>{formatPrismMeasurement(measurement)}</strong>
        </p>
        <p className="rx-final-rx-row">
          <span>Trial:</span> <strong>with best correction</strong>
        </p>
        {trialOutcomeLabel && (
          <p className="rx-final-rx-row" style={{ marginBottom: 0 }}>
            <span>Outcome:</span> <strong>{trialOutcomeLabel}</strong>
          </p>
        )}
      </div>

      <CompactCard label="Prism Prescribing Guidance">
        <ul>
          {PRISM_DISTRIBUTION_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </CompactCard>
    </div>
  );
};

export default FinalRxSummary;

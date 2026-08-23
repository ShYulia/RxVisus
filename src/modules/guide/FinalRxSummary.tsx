import type { Prescription } from '../../domain/calculators/transposition';
import { PRISM_DISTRIBUTION_NOTES } from '../../domain/reference/clinicalPathways';
import { formatPrismMeasurement, splitPrismEqually, type BestCorrection, type EyePrismSplit, type PrismMeasurement } from '../../domain/reference/prismMeasurement';
import { formatRx } from '../calculators/formatDiopter';

function formatEyeFinalRx(rx: Prescription, split: EyePrismSplit): string {
  const parts = [formatRx(rx)];
  if (split.horizontal) parts.push(`${split.horizontal.amount.toFixed(2)}Δ ${split.horizontal.base}`);
  if (split.vertical) parts.push(`${split.vertical.amount.toFixed(2)}Δ ${split.vertical.base}`);
  return parts.join('  ');
}

export interface FinalRxSummaryProps {
  measurement: PrismMeasurement | null;
  bestCorrection: BestCorrection | null;
  trialOutcomeLabel?: string;
}

/**
 * The flow's real endpoint after a successful trial: what was measured/trialled, the
 * equal-split reasoning (Prism Prescribing Guidance's own notes, reused inline rather than
 * navigating away and losing patient context), and the resulting Final Rx per eye.
 */
const FinalRxSummary: React.FC<FinalRxSummaryProps> = ({ measurement, bestCorrection, trialOutcomeLabel }) => {
  if (!measurement || !bestCorrection) {
    return <p className="rx-hint">Missing measurement or best correction — go back and complete those steps first.</p>;
  }

  const distribution = splitPrismEqually(measurement);

  return (
    <div className="rx-final-rx">
      <p className="rx-list-section-label">Final Prism Plan</p>
      <p className="rx-final-rx-row">
        <span>Measured/trialled:</span> <strong>{formatPrismMeasurement(measurement)}</strong>
      </p>
      <p className="rx-final-rx-row">
        <span>Trial:</span> <strong>with best correction</strong>
      </p>
      {trialOutcomeLabel && (
        <p className="rx-final-rx-row">
          <span>Outcome:</span> <strong>{trialOutcomeLabel}</strong>
        </p>
      )}

      <p className="rx-list-section-label" style={{ marginTop: 22 }}>
        Prism Prescribing Guidance
      </p>
      <ul className="rx-final-rx-notes">
        {PRISM_DISTRIBUTION_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <p className="rx-list-section-label" style={{ marginTop: 22 }}>
        Final Rx
      </p>
      <p className="rx-final-rx-row">
        <span>OD:</span> <strong>{formatEyeFinalRx(bestCorrection.od, distribution.od)}</strong>
      </p>
      <p className="rx-final-rx-row">
        <span>OS:</span> <strong>{formatEyeFinalRx(bestCorrection.os, distribution.os)}</strong>
      </p>
    </div>
  );
};

export default FinalRxSummary;

import CompactCard from '../../components/CompactCard';
import type { Prescription } from '../../domain/calculators/transposition';
import { formatPrismMeasurement, type BestCorrection, type PrismMeasurement } from '../../domain/reference/prismMeasurement';
import { formatRx } from '../calculators/formatDiopter';

/** The prism component(s) actually recorded/trialled over one eye — plain data (grouped by the `eye` each component was measured over), never a prescribing split. */
function eyeTrialChips(measurement: PrismMeasurement, eye: 'OD' | 'OS'): string[] {
  const chips: string[] = [];
  if (measurement.horizontal?.eye === eye) chips.push(`${measurement.horizontal.amount.toFixed(2)}Δ ${measurement.horizontal.base}`);
  if (measurement.vertical?.eye === eye) chips.push(`${measurement.vertical.amount.toFixed(2)}Δ ${measurement.vertical.base}`);
  return chips;
}

const BestCorrectionRow: React.FC<{ eyeLabel: string; rx: Prescription }> = ({ eyeLabel, rx }) => (
  <div className="rx-finalrx-eye">
    <span className="rx-finalrx-eye-label">{eyeLabel}</span>
    <span className="rx-finalrx-eye-rx">{formatRx(rx)}</span>
  </div>
);

const TrialPrismRow: React.FC<{ eyeLabel: string; chips: string[] }> = ({ eyeLabel, chips }) => (
  <div className="rx-finalrx-eye">
    <span className="rx-finalrx-eye-label">{eyeLabel}</span>
    {chips.length > 0 ? (
      <div className="rx-finalrx-prism-row">
        {chips.map((chip, i) => (
          <span key={`${chip}-${i}`} className="rx-finalrx-prism-chip">
            {chip}
          </span>
        ))}
      </div>
    ) : (
      <span className="rx-unsuccessful-none">No prism trialled</span>
    )}
  </div>
);

export interface PrismUnsuccessfulSummaryProps {
  title: string;
  message: string;
  guidance: string[];
  measurement: PrismMeasurement | null;
  bestCorrection: BestCorrection | null;
  trialOutcomeLabel?: string;
}

/**
 * Terminal screen for a trial that did NOT end in comfortable single vision (partial relief or
 * no meaningful benefit) — the clinician finished the assessment without a finalized
 * prescription. Same visual hierarchy as Binocular Status Summary / Final Rx: a prominent
 * primary result card up top (Best Correction and the prism as actually trialled per eye —
 * never a prescribing split, that's Final Rx's job on a successful trial), then closed-by-
 * default disclosures for supporting detail so the clinician sees measurements only after
 * tapping "All Measurements". Content (title/message/guidance) is entirely data-driven from
 * the pathway step — see clinicalPathways.ts's PrismUnsuccessfulStep — never invented here.
 * `message` (the outcome, e.g. "did not provide comfortable single vision") stays in the
 * primary card only; `guidance` (next-step considerations) never repeats or paraphrases it.
 */
const PrismUnsuccessfulSummary: React.FC<PrismUnsuccessfulSummaryProps> = ({ title, message, guidance, measurement, bestCorrection, trialOutcomeLabel }) => {
  if (!measurement || !bestCorrection) {
    return <p className="rx-hint">Missing measurement or best correction — go back and complete those steps first.</p>;
  }

  return (
    <div className="rx-final-rx">
      <div className="rx-summary-result-card">
        <p className="rx-summary-result-label">Trial Prism Outcome</p>
        <p className="rx-summary-result-value">{title}</p>
        <p className="rx-unsuccessful-message">{message}</p>
        <span className="rx-unsuccessful-status">Prism prescription not finalized</span>

        <p className="rx-unsuccessful-section-label">Best Correction</p>
        <div className="rx-finalrx-eyes">
          <BestCorrectionRow eyeLabel="OD" rx={bestCorrection.od} />
          <BestCorrectionRow eyeLabel="OS" rx={bestCorrection.os} />
        </div>

        <p className="rx-unsuccessful-section-label">Trial Prism</p>
        <div className="rx-finalrx-eyes">
          <TrialPrismRow eyeLabel="OD" chips={eyeTrialChips(measurement, 'OD')} />
          <TrialPrismRow eyeLabel="OS" chips={eyeTrialChips(measurement, 'OS')} />
        </div>
      </div>

      <CompactCard label="Clinical Considerations">
        <ul>
          {guidance.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </CompactCard>

      <CompactCard label="All Measurements">
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
      </CompactCard>
    </div>
  );
};

export default PrismUnsuccessfulSummary;

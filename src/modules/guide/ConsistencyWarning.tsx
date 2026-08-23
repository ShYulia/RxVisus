import CautionBox from '../../components/CautionBox';

export interface ConsistencyWarningProps {
  findingLabel: string;
  measuredLabel: string;
  message: string;
  onRecheckFinding: () => void;
  onRecheckMeasurement: () => void;
  onKeep: () => void;
}

/**
 * A non-blocking clinical consistency check — never silently corrects the clinician's
 * entry, never prevents them from keeping it. Rendered in place of the measurement form,
 * not as an urgent modal (unlike RedFlagAlert), since this is a "double-check this" prompt,
 * not a safety interrupt.
 */
const ConsistencyWarning: React.FC<ConsistencyWarningProps> = ({ findingLabel, measuredLabel, message, onRecheckFinding, onRecheckMeasurement, onKeep }) => (
  <div className="rx-wizard-step">
    <p className="rx-wizard-question">⚠ Check measurement</p>
    <CautionBox className="rx-consistency-box">
      <p className="rx-caution-text">
        Cover Test: <strong>{findingLabel}</strong>
      </p>
      <p className="rx-caution-text">
        Measured: <strong>{measuredLabel}</strong>
      </p>
      <p className="rx-caution-text">{message}</p>
    </CautionBox>

    <div className="rx-wizard-choices">
      <button type="button" className="rx-wizard-choice" onClick={onRecheckFinding}>
        Recheck Cover Test
      </button>
      <button type="button" className="rx-wizard-choice" onClick={onRecheckMeasurement}>
        Recheck Measurement
      </button>
      <button type="button" className="rx-wizard-choice" onClick={onKeep}>
        Keep result
      </button>
    </div>
  </div>
);

export default ConsistencyWarning;

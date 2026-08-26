export interface ActionFlowProps {
  steps: string[];
}

/**
 * Recognized step-kind prefixes, pulled out of the sentence and rendered as their own small
 * label chip (e.g. "WATCH the uncovered eye..." -> chip "WATCH" + "the uncovered eye..."). An
 * unlabeled step is an implicit DO action. Longer alternatives first so e.g. "PATIENT REPORTS"
 * doesn't get cut short by a shorter prefix.
 */
const STEP_LABELS = ['PATIENT REPORTS', 'WATCH', 'ASK', 'STOP', 'RECORD'];
const LABEL_PATTERN = new RegExp(`^(${STEP_LABELS.join('|')})\\b[:\\s]*`, 'i');

/**
 * Renders a short procedure as a vertical arrow sequence (DO THIS -> PATIENT REPORTS THIS ->
 * ...) instead of a numbered paragraph list — the dominant "what do I do" element on a Test
 * Card. Shared by every generic (non-bespoke-diagram) Test Card; see FlipperFacilityCard for
 * the richer value/action variant used by the flipper-facility tests.
 */
const ActionFlow: React.FC<ActionFlowProps> = ({ steps }) => {
  if (steps.length === 0) return null;
  return (
    <div className="rx-actionflow">
      {steps.map((step, i) => {
        const match = step.match(LABEL_PATTERN);
        const label = match ? match[1].toUpperCase() : null;
        const rest = match ? step.slice(match[0].length) : step;
        return (
          <div key={i} className="rx-actionflow-item">
            {i > 0 && <span className="rx-actionflow-arrow">↓</span>}
            {label && <span className="rx-actionflow-label">{label}</span>}
            <p className="rx-actionflow-step">{rest}</p>
          </div>
        );
      })}
    </div>
  );
};

export default ActionFlow;

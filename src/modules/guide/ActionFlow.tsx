export interface ActionFlowProps {
  steps: string[];
}

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
      {steps.map((step, i) => (
        <div key={i} className="rx-actionflow-item">
          {i > 0 && <span className="rx-actionflow-arrow">↓</span>}
          <p className="rx-actionflow-step">{step}</p>
        </div>
      ))}
    </div>
  );
};

export default ActionFlow;

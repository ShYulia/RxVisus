export interface FlowStepDef {
  /** 'value' = the lens/prism itself (the dominant visual). 'action' = what the clinician does with it (WAIT UNTIL CLEAR, FLIP, ...). */
  kind: 'value' | 'action';
  label: string;
}

export interface FlipperFacilityCardProps {
  /** Short uppercase tags for distance/laterality/duration, e.g. ['40 cm', 'ONE EYE AT A TIME', '60 SEC']. */
  meta: string[];
  /** The equipment needed, spelled out in full (never an abbreviation on first mention), e.g. 'USE ±2.00 D ACCOMMODATIVE FLIPPERS'. */
  equipmentLine: string;
  /** Plain instruction before the flow, e.g. 'Cover one eye.' — omit if there's nothing to set up. */
  beforeNote?: string;
  /** The vertical step-by-step flow — the dominant visual, alternating lens/prism values and the actions taken with them. */
  flowSteps: FlowStepDef[];
  /** Plain instruction after the flow, e.g. 'Then repeat with the other eye.' — omit if the test isn't repeated. */
  afterNote?: string;
  /** e.g. 'How many full cycles in 60 seconds?' */
  cycleQuestion: string;
  /** e.g. '+2.00 clear + −2.00 clear = 1 cycle' */
  cycleDefinition: string;
  /** e.g. 'Which lens was difficult to clear?' */
  difficultyQuestion: string;
  /** Plain-language answer categories shown as reference chips, e.g. ['+2.00', '−2.00', 'Both', 'Neither'] — not inputs; the actual finding is recorded on the assessment step that launched this card. */
  difficultyOptions: string[];
  /** One more thing to watch for beyond the difficulty question, if relevant (e.g. diplopia/suppression) — a plain sentence, not another chip row. */
  extraNote?: string;
  /** One or two short lines translating a finding into its clinical meaning, spelled out in full. */
  interpretLines: string[];
}

const FlowStep: React.FC<{ step: FlowStepDef }> = ({ step }) =>
  step.kind === 'value' ? <p className="rx-flowcard-step-value">{step.label}</p> : <p className="rx-flowcard-step-action">{step.label}</p>;

/**
 * Shared visual-instruction layout for flipper/facility-style tests (MAF, BAF, Vergence
 * Facility) — same underlying shape (equipment -> flow of value/action steps -> what to
 * record -> quick interpretation), so one glanceable component parameterized by content
 * rather than three near-duplicate ones. Optimized for minimum cognitive load, not minimum
 * word count: equipment is named explicitly, every action in the flow is spelled out (WAIT
 * UNTIL CLEAR, FLIP), and nothing relies on an abbreviation the clinician has to decode.
 */
const FlipperFacilityCard: React.FC<FlipperFacilityCardProps> = ({
  meta,
  equipmentLine,
  beforeNote,
  flowSteps,
  afterNote,
  cycleQuestion,
  cycleDefinition,
  difficultyQuestion,
  difficultyOptions,
  extraNote,
  interpretLines,
}) => (
  <div className="rx-flowcard">
    <p className="rx-flowcard-meta">{meta.join('  •  ')}</p>

    <p className="rx-flowcard-equipment">{equipmentLine}</p>

    {beforeNote && <p className="rx-flowcard-note">{beforeNote}</p>}

    <div className="rx-flowcard-flow">
      {flowSteps.map((step, i) => (
        <div key={`${i}-${step.kind}-${step.label}`} className="rx-flowcard-flow-item">
          {i > 0 && <span className="rx-flowcard-arrow">↓</span>}
          <FlowStep step={step} />
        </div>
      ))}
    </div>

    {afterNote && <p className="rx-flowcard-note">{afterNote}</p>}

    <p className="rx-list-section-label rx-flowcard-section-label">Record / What to note</p>

    <p className="rx-flowcard-question">{cycleQuestion}</p>
    <p className="rx-flowcard-subnote">{cycleDefinition}</p>

    <p className="rx-flowcard-question" style={{ marginTop: 14 }}>
      {difficultyQuestion}
    </p>
    <div className="rx-flowcard-options">
      {difficultyOptions.map((option) => (
        <span key={option} className="rx-flowcard-option">
          {option}
        </span>
      ))}
    </div>
    {extraNote && <p className="rx-flowcard-subnote">{extraNote}</p>}

    {interpretLines.length > 0 && (
      <>
        <p className="rx-list-section-label rx-flowcard-section-label">Quick interpretation</p>
        <div className="rx-flowcard-interpret">
          {interpretLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </>
    )}
  </div>
);

export default FlipperFacilityCard;

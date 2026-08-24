import { getGuidedNextSteps } from '../../domain/reference/binocularOptionalHints';
import { parseBinocularFindings } from '../../domain/reference/binocularFindings';
import { getPathwayNode, type OptionalTestOption } from '../../domain/reference/clinicalPathways';
import TestChips from './TestChips';

export interface OptionalTestsMenuProps {
  options: OptionalTestOption[];
  findings: Record<string, string>;
  onSelect: (option: OptionalTestOption) => void;
  onSkip: () => void;
}

/**
 * Guided targeted-testing step: the clinician should never have to remember on their own
 * whether Gradient AC/A, NRA/PRA, MEM/Nott, Vergence Facility, Distance Fusional Vergence, or
 * Stereoacuity is the right next test — the findings already entered drive a short, reasoned
 * recommendation (or "no additional testing indicated"). Continue to Summary is always
 * available; every other test stays reachable behind a secondary "Other / additional tests"
 * disclosure for a clinician who wants to look further on their own.
 */
/** The optional-menu stepId sometimes points at a gate/question step rather than the step that actually carries the Test Card reference — map to the real one for the chip link. */
const TEST_CARD_STEP_ID: Record<string, string> = { 'vergence-facility-gate': 'vergence-facility' };

const OptionalTestsMenu: React.FC<OptionalTestsMenuProps> = ({ options, findings, onSelect, onSkip }) => {
  const data = parseBinocularFindings(findings);
  const recommendations = getGuidedNextSteps(data);
  const recommendedStepIds = new Set(recommendations.map((r) => r.stepId));
  const otherOptions = options.filter((o) => !recommendedStepIds.has(o.stepId));
  const binocularStatusNode = getPathwayNode('binocular-status');

  return (
    <div className="rx-wizard-step">
      {recommendations.length === 0 ? (
        <>
          <p className="rx-wizard-question">No additional targeted testing indicated</p>
          <p className="rx-hint" style={{ marginTop: 0 }}>
            These findings don&rsquo;t point to a specific targeted test that would meaningfully add information.
          </p>
        </>
      ) : (
        <>
          <p className="rx-wizard-question">Targeted testing may help</p>
          <div className="rx-guided-recs">
            {recommendations.map((rec) => {
              const option = options.find((o) => o.stepId === rec.stepId);
              const step = binocularStatusNode?.steps?.find((s) => s.id === (TEST_CARD_STEP_ID[rec.stepId] ?? rec.stepId));
              const testIds = step && 'testIds' in step ? step.testIds : undefined;
              return (
                <div key={rec.stepId} className="rx-guided-rec">
                  <p className="rx-guided-rec-label">{rec.label}</p>
                  <p className="rx-guided-rec-reason">{rec.reason}</p>
                  <TestChips testIds={testIds} state={{}} />
                  {option && (
                    <button type="button" className="rx-wizard-choice" onClick={() => onSelect(option)}>
                      <span>Perform {rec.label}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <button type="button" className="rx-optional-skip" onClick={onSkip}>
        Continue to Summary
      </button>

      {otherOptions.length > 0 && (
        <details className="rx-more-details rx-guided-other">
          <summary>Other / additional tests</summary>
          <div className="rx-wizard-choices" style={{ marginTop: 12 }}>
            {otherOptions.map((option) => (
              <button key={option.stepId} type="button" className="rx-wizard-choice" onClick={() => onSelect(option)}>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default OptionalTestsMenu;

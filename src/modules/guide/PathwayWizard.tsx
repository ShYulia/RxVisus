import { useState } from 'react';
import Chip from '../../components/Chip';
import PillarRow from '../../components/PillarRow';
import { CompassIcon } from '../../components/icons';
import { getClinicalTest } from '../../domain/reference/clinicalTests';
import { getPathwayNode, type ClinicalPathwayNode, type DecisionOutcome, type QuestionStep } from '../../domain/reference/clinicalPathways';
import { formatPrismMeasurement, type PrismMeasurement } from '../../domain/reference/prismMeasurement';
import MeasurementForm from './MeasurementForm';
import RedFlagAlert from './RedFlagAlert';
import TermInfo from './TermInfo';

interface HistoryEntry {
  stepId: string;
  outcomeLabel: string;
  /** Snapshot of the recorded measurement immediately after this entry, so jumping back restores the right prefill. */
  measurementAtThisPoint: PrismMeasurement | null;
}

const TestChips: React.FC<{ testIds?: string[]; state: Record<string, unknown>; label?: string }> = ({ testIds, state, label }) => {
  if (!testIds || testIds.length === 0) return null;
  return (
    <div className="rx-wizard-testchips-block">
      {label && <p className="rx-wizard-testchips-label">{label}</p>}
      <div className="rx-chip-row">
        {testIds.map((testId) => {
          const test = getClinicalTest(testId);
          return test ? <Chip key={testId} label={test.title} routerLink={`/guide/tests/${testId}`} state={state} /> : null;
        })}
      </div>
    </div>
  );
};

/**
 * One relevant question/action at a time, not the whole algorithm on one
 * page. Remounted per pathway node (keyed by node.id in GuidePathway) so
 * its state resets automatically when navigating to a different pathway.
 */
const PathwayWizard: React.FC<{ node: ClinicalPathwayNode }> = ({ node }) => {
  const steps = node.steps ?? [];
  const stepById = new Map(steps.map((s) => [s.id, s]));
  const firstStepId = steps[0]?.id;
  const backState = { from: `/guide/pathway/${node.id}` };

  const [currentStepId, setCurrentStepId] = useState<string | undefined>(firstStepId);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [measurement, setMeasurement] = useState<PrismMeasurement | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<{ step: QuestionStep; outcome: DecisionOutcome } | null>(null);
  const [result, setResult] = useState<DecisionOutcome | null>(null);

  const currentStep = currentStepId ? stepById.get(currentStepId) : undefined;

  const commit = (step: QuestionStep, outcome: DecisionOutcome) => {
    setHistory((h) => [...h, { stepId: step.id, outcomeLabel: outcome.label, measurementAtThisPoint: measurement }]);
    if (outcome.next) {
      setCurrentStepId(outcome.next);
      setResult(null);
    } else {
      setCurrentStepId(undefined);
      setResult(outcome);
    }
  };

  const commitMeasurement = (measurementStepId: string, next: string, value: PrismMeasurement) => {
    setMeasurement(value);
    setHistory((h) => [...h, { stepId: measurementStepId, outcomeLabel: formatPrismMeasurement(value), measurementAtThisPoint: value }]);
    setCurrentStepId(next);
    setResult(null);
  };

  const handleSelect = (step: QuestionStep, outcome: DecisionOutcome) => {
    if (outcome.redFlag) {
      setPendingOutcome({ step, outcome });
    } else {
      commit(step, outcome);
    }
  };

  const acknowledgeAlert = () => {
    if (!pendingOutcome) return;
    const { step, outcome } = pendingOutcome;
    setPendingOutcome(null);
    commit(step, outcome);
  };

  const restart = () => {
    setCurrentStepId(firstStepId);
    setHistory([]);
    setMeasurement(null);
    setPendingOutcome(null);
    setResult(null);
  };

  const jumpTo = (index: number) => {
    const entry = history[index];
    if (!entry) return;
    const previous = history[index - 1];
    setHistory((h) => h.slice(0, index));
    setCurrentStepId(entry.stepId);
    setMeasurement(previous ? previous.measurementAtThisPoint : null);
    setPendingOutcome(null);
    setResult(null);
  };

  return (
    <>
      {history.length > 0 && (
        <div className="rx-wizard-trail">
          {history.map((entry, i) => (
            <span key={`${entry.stepId}-${i}`} className="rx-wizard-trail-item">
              {i > 0 && <span className="rx-wizard-trail-arrow">&rarr;</span>}
              <button type="button" className="rx-wizard-trail-btn" onClick={() => jumpTo(i)}>
                {entry.outcomeLabel}
              </button>
            </span>
          ))}
          <button type="button" className="rx-wizard-restart" onClick={restart}>
            Start over
          </button>
        </div>
      )}

      {history.length === 0 && node.overview && (
        <p className="rx-hint" style={{ marginTop: 0 }}>
          {node.overview}
        </p>
      )}

      {pendingOutcome?.outcome.redFlag && <RedFlagAlert message={pendingOutcome.outcome.redFlag} onContinue={acknowledgeAlert} />}

      {!pendingOutcome && !result && currentStep?.kind === 'measurement' && (
        <div className="rx-wizard-step">
          <p className="rx-wizard-question">{currentStep.question}</p>
          <MeasurementForm initialValue={measurement} onSubmit={(value) => commitMeasurement(currentStep.id, currentStep.next, value)} />
        </div>
      )}

      {!pendingOutcome && !result && currentStep?.kind === 'question' && (
        <div className="rx-wizard-step">
          {currentStep.instruction && <p className="rx-hint" style={{ marginTop: 0 }}>{currentStep.instruction}</p>}
          {currentStep.showMeasurement && measurement && (
            <p className="rx-wizard-measurement-summary">Proposed prism: {formatPrismMeasurement(measurement)}</p>
          )}
          <p className="rx-wizard-question">{currentStep.question}</p>

          <TestChips testIds={currentStep.testIds} state={backState} />

          <div className="rx-wizard-choices">
            {currentStep.outcomes.map((outcome) => (
              <button key={outcome.label} type="button" className="rx-wizard-choice" onClick={() => handleSelect(currentStep, outcome)}>
                <span>
                  {outcome.label}
                  {outcome.secondaryLabel && <span className="rx-wizard-choice-secondary"> ({outcome.secondaryLabel})</span>}
                </span>
                {outcome.infoTerm && <TermInfo term={outcome.infoTerm} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {!pendingOutcome && result && (
        <div className="rx-wizard-result">
          <p className="rx-wizard-result-label">What to do</p>
          <p className="rx-wizard-result-action">{result.action || 'No specific action — continue routine care.'}</p>

          <TestChips testIds={result.testIds} state={backState} label="Additional tests (optional)" />

          {(result.seeAlso ?? node.seeAlso ?? []).length > 0 && (
            <div className="rx-pillars rx-wizard-seealso">
              {(result.seeAlso ?? node.seeAlso ?? []).map((seeAlsoId) => {
                const seeAlsoNode = getPathwayNode(seeAlsoId);
                if (!seeAlsoNode) return null;
                return (
                  <PillarRow
                    key={seeAlsoNode.id}
                    icon={<CompassIcon size={22} />}
                    title={seeAlsoNode.title}
                    desc={seeAlsoNode.overview ?? ''}
                    routerLink={`/guide/pathway/${seeAlsoNode.id}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {!pendingOutcome && !result && !currentStep && <p className="rx-hint">No content for this pathway yet.</p>}
    </>
  );
};

export default PathwayWizard;

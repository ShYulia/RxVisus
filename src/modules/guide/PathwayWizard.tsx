import { useState } from 'react';
import { IonButton, IonContent, IonPage } from '@ionic/react';
import Chip from '../../components/Chip';
import PageHeader from '../../components/PageHeader';
import PillarRow from '../../components/PillarRow';
import { CompassIcon } from '../../components/icons';
import { checkHorizontalDirectionConsistency, type ConsistencyWarning as ConsistencyWarningInfo } from '../../domain/reference/consistencyChecks';
import { getClinicalTest } from '../../domain/reference/clinicalTests';
import {
  getPathwayNode,
  type ClinicalPathwayNode,
  type DecisionOutcome,
  type MeasurementStep,
  type QuestionStep,
  type RxEntryStep,
  type TextEntryStep,
} from '../../domain/reference/clinicalPathways';
import { formatPrismMeasurement, type BestCorrection, type PrismMeasurement } from '../../domain/reference/prismMeasurement';
import { formatRx } from '../calculators/formatDiopter';
import ConsistencyWarning from './ConsistencyWarning';
import FinalRxSummary from './FinalRxSummary';
import MeasurementForm from './MeasurementForm';
import RedFlagAlert from './RedFlagAlert';
import RxEntryForm from './RxEntryForm';
import TermInfo from './TermInfo';
import TextEntryForm from './TextEntryForm';

/** Everything a step's outcome can affect, snapshotted after every commit so jumping back to an earlier step restores exactly the state that existed then. */
interface WizardSnapshot {
  measurement: PrismMeasurement | null;
  bestCorrection: BestCorrection | null;
  findings: Record<string, string>;
}

const EMPTY_SNAPSHOT: WizardSnapshot = { measurement: null, bestCorrection: null, findings: {} };

interface HistoryEntry {
  stepId: string;
  outcomeLabel: string;
  snapshotAfter: WizardSnapshot;
}

/** e.g. "OD 20/25 · OS 20/20", or "Recorded" when every field was left blank. */
function formatTextEntry(values: Record<string, string>, fields: { key: string; label: string }[]): string {
  const parts = fields
    .map((field) => ({ label: field.label, value: values[field.key]?.trim() }))
    .filter((part) => part.value)
    .map((part) => `${part.label} ${part.value}`);
  return parts.length > 0 ? parts.join(' · ') : 'Recorded';
}

/** e.g. "OD -2.00/-0.50x90 · OS -1.50". */
function formatBestCorrection(value: BestCorrection): string {
  return `OD ${formatRx(value.od)} · OS ${formatRx(value.os)}`;
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
 * Owns its own page shell (rather than being nested under GuidePathway's)
 * so its header's Back button can step back one wizard step instead of
 * leaving the flow — see stepBack/jumpTo.
 */
const PathwayWizard: React.FC<{ node: ClinicalPathwayNode }> = ({ node }) => {
  const steps = node.steps ?? [];
  const stepById = new Map(steps.map((s) => [s.id, s]));
  const firstStepId = steps[0]?.id;
  const backState = { from: `/guide/pathway/${node.id}` };

  const [currentStepId, setCurrentStepId] = useState<string | undefined>(firstStepId);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [measurement, setMeasurement] = useState<PrismMeasurement | null>(null);
  const [bestCorrection, setBestCorrection] = useState<BestCorrection | null>(null);
  const [recordedFindings, setRecordedFindings] = useState<Record<string, string>>({});
  const [pendingOutcome, setPendingOutcome] = useState<{ step: QuestionStep; outcome: DecisionOutcome } | null>(null);
  const [pendingConsistencyWarning, setPendingConsistencyWarning] = useState<{ step: MeasurementStep; value: PrismMeasurement; warning: ConsistencyWarningInfo } | null>(
    null,
  );
  const [result, setResult] = useState<DecisionOutcome | null>(null);

  const currentStep = currentStepId ? stepById.get(currentStepId) : undefined;

  const applySnapshot = (snap: WizardSnapshot) => {
    setMeasurement(snap.measurement);
    setBestCorrection(snap.bestCorrection);
    setRecordedFindings(snap.findings);
  };

  const pushHistory = (stepId: string, outcomeLabel: string, snapshotAfter: WizardSnapshot) => {
    setHistory((h) => [...h, { stepId, outcomeLabel, snapshotAfter }]);
  };

  const commit = (step: QuestionStep, outcome: DecisionOutcome) => {
    const findings = outcome.recordAs ? { ...recordedFindings, [outcome.recordAs.key]: outcome.recordAs.value } : recordedFindings;
    if (outcome.recordAs) setRecordedFindings(findings);
    pushHistory(step.id, outcome.label, { measurement, bestCorrection, findings });
    if (outcome.next) {
      setCurrentStepId(outcome.next);
      setResult(null);
    } else {
      setCurrentStepId(undefined);
      setResult(outcome);
    }
  };

  const finalizeMeasurement = (step: MeasurementStep, value: PrismMeasurement) => {
    const isProposed = (step.target ?? 'proposed') === 'proposed';
    if (isProposed) setMeasurement(value);
    pushHistory(step.id, formatPrismMeasurement(value), { measurement: isProposed ? value : measurement, bestCorrection, findings: recordedFindings });
    setCurrentStepId(step.next);
    setResult(null);
  };

  const commitMeasurement = (step: MeasurementStep, value: PrismMeasurement) => {
    const isProposed = (step.target ?? 'proposed') === 'proposed';
    if (isProposed && step.consistencyCheck) {
      const direction = recordedFindings[step.consistencyCheck.findingKey];
      const warning = checkHorizontalDirectionConsistency(direction, value);
      if (warning) {
        setPendingConsistencyWarning({ step, value, warning });
        return;
      }
    }
    finalizeMeasurement(step, value);
  };

  const commitTextEntry = (step: TextEntryStep, values: Record<string, string>) => {
    pushHistory(step.id, formatTextEntry(values, step.fields), { measurement, bestCorrection, findings: recordedFindings });
    setCurrentStepId(step.next);
    setResult(null);
  };

  const commitRxEntry = (step: RxEntryStep, value: BestCorrection) => {
    setBestCorrection(value);
    pushHistory(step.id, formatBestCorrection(value), { measurement, bestCorrection: value, findings: recordedFindings });
    setCurrentStepId(step.next);
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

  const keepConsistencyResult = () => {
    if (!pendingConsistencyWarning) return;
    const { step, value } = pendingConsistencyWarning;
    setPendingConsistencyWarning(null);
    finalizeMeasurement(step, value);
  };

  const recheckMeasurementNow = () => {
    if (!pendingConsistencyWarning) return;
    setMeasurement(pendingConsistencyWarning.value);
    setPendingConsistencyWarning(null);
  };

  const restart = () => {
    setCurrentStepId(firstStepId);
    setHistory([]);
    setMeasurement(null);
    setBestCorrection(null);
    setRecordedFindings({});
    setPendingOutcome(null);
    setPendingConsistencyWarning(null);
    setResult(null);
  };

  const jumpTo = (index: number) => {
    const entry = history[index];
    if (!entry) return;
    const previous = history[index - 1];
    setHistory((h) => h.slice(0, index));
    setCurrentStepId(entry.stepId);
    applySnapshot(previous ? previous.snapshotAfter : EMPTY_SNAPSHOT);
    setPendingOutcome(null);
    setPendingConsistencyWarning(null);
    setResult(null);
  };

  const recheckFindingNow = () => {
    if (!pendingConsistencyWarning) return;
    const targetId = pendingConsistencyWarning.step.consistencyCheck?.recheckStepId;
    setPendingConsistencyWarning(null);
    if (!targetId) return;
    const idx = history.findIndex((e) => e.stepId === targetId);
    if (idx === -1) return;
    jumpTo(idx);
  };

  const stepBack = () => jumpTo(history.length - 1);

  return (
    <IonPage>
      <PageHeader
        title={node.title}
        backHref="/guide"
        onBack={history.length > 0 ? stepBack : undefined}
        action={
          <IonButton fill="clear" routerLink="/guide" className="rx-header-exit-btn">
            Exit
          </IonButton>
        }
      />
      <IonContent fullscreen className="ion-padding">
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

        {!pendingOutcome && pendingConsistencyWarning && (
          <ConsistencyWarning
            findingLabel={pendingConsistencyWarning.warning.findingLabel}
            measuredLabel={pendingConsistencyWarning.warning.measuredLabel}
            message={pendingConsistencyWarning.warning.message}
            onRecheckFinding={recheckFindingNow}
            onRecheckMeasurement={recheckMeasurementNow}
            onKeep={keepConsistencyResult}
          />
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'measurement' && (
          <div className="rx-wizard-step">
            <p className="rx-wizard-question">{currentStep.question}</p>
            <MeasurementForm
              initialValue={(currentStep.target ?? 'proposed') === 'proposed' ? measurement : null}
              onSubmit={(value) => commitMeasurement(currentStep, value)}
            />
          </div>
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'text-entry' && (
          <div className="rx-wizard-step">
            <p className="rx-wizard-question">{currentStep.question}</p>
            <TextEntryForm fields={currentStep.fields} helperText={currentStep.helperText} onSubmit={(values) => commitTextEntry(currentStep, values)} />
          </div>
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'rx-entry' && (
          <div className="rx-wizard-step">
            <p className="rx-wizard-question">{currentStep.question}</p>
            <RxEntryForm initialValue={bestCorrection} onSubmit={(value) => commitRxEntry(currentStep, value)} />
          </div>
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'final-rx' && (
          <FinalRxSummary measurement={measurement} bestCorrection={bestCorrection} trialOutcomeLabel={history[history.length - 1]?.outcomeLabel} />
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'question' && (
          <div className="rx-wizard-step">
            {currentStep.instruction && <p className="rx-hint" style={{ marginTop: 0 }}>{currentStep.instruction}</p>}
            {currentStep.showMeasurement && measurement && (
              <p className="rx-wizard-measurement-summary">Proposed prism: {formatPrismMeasurement(measurement)}</p>
            )}
            {currentStep.showBestCorrection && bestCorrection && (
              <p className="rx-wizard-measurement-summary">Best correction: {formatBestCorrection(bestCorrection)}</p>
            )}
            <p className="rx-wizard-question">{currentStep.question}</p>

            <TestChips testIds={currentStep.testIds} state={backState} label={currentStep.testIdsLabel} />

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

        {!pendingOutcome && !pendingConsistencyWarning && result && (
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

        {!pendingOutcome && !pendingConsistencyWarning && !result && !currentStep && <p className="rx-hint">No content for this pathway yet.</p>}
      </IonContent>
    </IonPage>
  );
};

export default PathwayWizard;

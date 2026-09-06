import { useLayoutEffect, useRef, useState } from 'react';
import { IonButton, IonContent, IonPage, useIonViewWillEnter, useIonViewWillLeave } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import PillarRow from '../../components/PillarRow';
import { ChevronRightIcon, CompassIcon } from '../../components/icons';
import { checkHorizontalDirectionConsistency, type ConsistencyWarning as ConsistencyWarningInfo } from '../../domain/reference/consistencyChecks';
import {
  getPathwayNode,
  type ClinicalPathwayNode,
  type DecisionOutcome,
  type MeasurementStep,
  type QuestionStep,
  type RxEntryStep,
  type SymptomSelectStep,
  type TextEntryStep,
} from '../../domain/reference/clinicalPathways';
import { formatPrismMeasurement, type BestCorrection, type PrismMeasurement } from '../../domain/reference/prismMeasurement';
import { formatRx } from '../calculators/formatDiopter';
import BinocularSummary from './BinocularSummary';
import ConsistencyWarning from './ConsistencyWarning';
import FinalRxSummary from './FinalRxSummary';
import MeasurementForm from './MeasurementForm';
import OptionalTestsMenu from './OptionalTestsMenu';
import QuickScreenResult from './QuickScreenResult';
import RedFlagAlert from './RedFlagAlert';
import RxEntryForm from './RxEntryForm';
import SymptomSelectForm from './SymptomSelectForm';
import TermInfo from './TermInfo';
import TestChips from './TestChips';
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

  // The "assessment in progress" checkpoint shown when reopening an unfinished assessment (see
  // the ionViewWillEnter hook below), and its nested "Start New Assessment" confirmation.
  const [pendingResumeGate, setPendingResumeGate] = useState(false);
  const [confirmingNewAssessment, setConfirmingNewAssessment] = useState(false);

  const currentStep = currentStepId ? stepById.get(currentStepId) : undefined;
  const isTerminalStep = currentStep?.kind === 'final-rx' || currentStep?.kind === 'binocular-summary';

  // Always-fresh refs for the two lifecycle hooks below, which register their callback once
  // (deps: []) and must not close over stale render values.
  const historyRef = useRef(history);
  historyRef.current = history;
  const isTerminalStepRef = useRef(isTerminalStep);
  isTerminalStepRef.current = isTerminalStep;

  // Full Assessment entered directly skips the Quick Screen checkpoint transparently —
  // no history entry, so Back/breadcrumb behave as if it never existed for that path.
  useLayoutEffect(() => {
    if (currentStep?.kind === 'quick-screen-result' && recordedFindings.entryMode === 'full') {
      setCurrentStepId(currentStep.continueNext);
    }
  }, [currentStep, recordedFindings.entryMode]);

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
    const findings = { ...recordedFindings, ...values };
    setRecordedFindings(findings);
    pushHistory(step.id, formatTextEntry(values, step.fields), { measurement, bestCorrection, findings });
    setCurrentStepId(step.next);
    setResult(null);
  };

  const skipTextEntryStep = (step: TextEntryStep) => {
    pushHistory(step.id, 'Skipped', { measurement, bestCorrection, findings: recordedFindings });
    setCurrentStepId(step.next);
    setResult(null);
  };

  const commitSymptomSelect = (step: SymptomSelectStep, selectedKeys: string[]) => {
    const findings = { ...recordedFindings, [step.recordAsKey]: selectedKeys.join(',') };
    setRecordedFindings(findings);
    const isNoneOnly = selectedKeys.length === 0 || (selectedKeys.length === 1 && selectedKeys[0] === step.exclusiveKey);
    const label = isNoneOnly ? 'No symptoms' : selectedKeys.map((key) => step.options.find((o) => o.key === key)?.label ?? key).join(', ');
    pushHistory(step.id, label, { measurement, bestCorrection, findings });
    const next = step.branchOnKey && selectedKeys.includes(step.branchOnKey.key) ? step.branchOnKey.next : step.next;
    setCurrentStepId(next);
    setResult(null);
  };

  const continueToFullAssessment = (stepId: string, continueNext: string) => {
    pushHistory(stepId, 'Continue to Full Assessment', { measurement, bestCorrection, findings: recordedFindings });
    setCurrentStepId(continueNext);
    setResult(null);
  };

  const finishQuickScreen = (stepId: string, finishNext: string) => {
    pushHistory(stepId, 'Finish Screening', { measurement, bestCorrection, findings: recordedFindings });
    setCurrentStepId(finishNext);
    setResult(null);
  };

  const selectOptionalTest = (stepId: string, label: string, targetStepId: string) => {
    pushHistory(stepId, label, { measurement, bestCorrection, findings: recordedFindings });
    setCurrentStepId(targetStepId);
    setResult(null);
  };

  const skipOptionalTests = (stepId: string, skipNext: string) => {
    pushHistory(stepId, 'Skip', { measurement, bestCorrection, findings: recordedFindings });
    setCurrentStepId(skipNext);
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

  const startNewAssessment = () => {
    restart();
    setPendingResumeGate(false);
    setConfirmingNewAssessment(false);
  };

  // Ionic keeps this page instance alive in its router page stack, so leaving mid-assessment and
  // coming back must never silently resume or silently discard the previous patient's data.
  // - Leaving from a completed step (Summary / Final Rx) always clears the assessment — a
  //   finished assessment must never later look like an unfinished one to resume.
  // - Leaving from an unfinished step preserves everything; reopening then shows the "assessment
  //   in progress" checkpoint below instead of silently resuming.
  useIonViewWillLeave(() => {
    if (isTerminalStepRef.current) restart();
  });

  // Reopening with an unfinished assessment still in state (i.e. it wasn't cleared on leaving,
  // per the above) shows the checkpoint rather than silently resuming.
  useIonViewWillEnter(() => {
    if (historyRef.current.length > 0 && !isTerminalStepRef.current) {
      setPendingResumeGate(true);
    }
  });

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
          !isTerminalStep && !pendingResumeGate ? (
            <IonButton fill="clear" routerLink="/guide" className="rx-header-guide-link-btn">
              Back to Clinical Guide
            </IonButton>
          ) : undefined
        }
      />
      <IonContent fullscreen className="ion-padding">
        {pendingResumeGate ? (
          <div className="rx-wizard-step">
            {!confirmingNewAssessment ? (
              <>
                <p className="rx-wizard-question">{node.title} assessment in progress</p>
                <div className="rx-wizard-choices">
                  <IonButton className="rx-btn-solid" expand="block" onClick={() => setPendingResumeGate(false)}>
                    Continue Assessment
                  </IonButton>
                  <IonButton className="rx-btn-outline" fill="outline" expand="block" onClick={() => setConfirmingNewAssessment(true)}>
                    Start New Assessment
                  </IonButton>
                </div>
              </>
            ) : (
              <>
                <p className="rx-wizard-question">Start a new assessment?</p>
                <p className="rx-hint" style={{ marginTop: 0 }}>
                  Current assessment data will be cleared.
                </p>
                <div className="rx-wizard-choices">
                  <IonButton className="rx-btn-outline" fill="outline" expand="block" onClick={() => setConfirmingNewAssessment(false)}>
                    Cancel
                  </IonButton>
                  <IonButton className="rx-btn-solid" expand="block" onClick={startNewAssessment}>
                    Start New Assessment
                  </IonButton>
                </div>
              </>
            )}
          </div>
        ) : (
        <>
        {history.length > 0 &&
          (isTerminalStep ? (
            // The Binocular Status Summary already has its own "All measurements" detail and a
            // deliberately clean, card-focused layout — the step-by-step trail would be visual
            // noise there, so it's omitted for that terminal step specifically (Final Rx keeps it).
            currentStep?.kind !== 'binocular-summary' && (
              <details className="rx-wizard-trail-collapsed">
                <summary>Assessment history ({history.length} steps)</summary>
                <div className="rx-wizard-trail rx-wizard-trail-nested">
                  {history.map((entry, i) => (
                    <span key={`${entry.stepId}-${i}`} className="rx-wizard-trail-item">
                      {i > 0 && <span className="rx-wizard-trail-arrow">&rarr;</span>}
                      <button type="button" className="rx-wizard-trail-btn" onClick={() => jumpTo(i)}>
                        {entry.outcomeLabel}
                      </button>
                    </span>
                  ))}
                </div>
              </details>
            )
          ) : (
            <div className="rx-wizard-trail">
              {history.map((entry, i) => (
                <span key={`${entry.stepId}-${i}`} className="rx-wizard-trail-item">
                  {i > 0 && <span className="rx-wizard-trail-arrow">&rarr;</span>}
                  <button type="button" className="rx-wizard-trail-btn" onClick={() => jumpTo(i)}>
                    {entry.outcomeLabel}
                  </button>
                </span>
              ))}
            </div>
          ))}

        {history.length === 0 && node.overview && (
          <p className="rx-hint" style={{ marginTop: 0 }}>
            {node.overview}
          </p>
        )}

        {pendingOutcome?.outcome.redFlag && (
          <RedFlagAlert
            message={pendingOutcome.outcome.redFlag}
            title={pendingOutcome.outcome.redFlagTitle}
            seeAlso={pendingOutcome.outcome.seeAlso}
            onContinue={acknowledgeAlert}
          />
        )}

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

        {/*
          Every step-driving form below is keyed by currentStep.id. Without a key, moving
          between two consecutive steps of the SAME kind (e.g. two text-entry steps in a row,
          which happens repeatedly in Binocular Status) reuses the same component instance —
          its internal state (values/absent/etc.) survives across the "different" step and can
          silently resubmit a stale, already-superseded value over a correctly-recorded one on
          the next unrelated Continue. Keying by step id forces a clean remount per step.
        */}
        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'measurement' && (
          <div className="rx-wizard-step">
            <p className="rx-wizard-question">{currentStep.question}</p>
            <MeasurementForm
              key={currentStep.id}
              initialValue={(currentStep.target ?? 'proposed') === 'proposed' ? measurement : null}
              onSubmit={(value) => commitMeasurement(currentStep, value)}
            />
          </div>
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'text-entry' && (
          <div className="rx-wizard-step">
            <p className="rx-wizard-question">{currentStep.question}</p>
            <TextEntryForm
              key={currentStep.id}
              fields={currentStep.fields}
              groups={currentStep.groups}
              helperText={currentStep.helperText}
              testIds={currentStep.testIds}
              backState={backState}
              onSkip={currentStep.skippable ? () => skipTextEntryStep(currentStep) : undefined}
              onSubmit={(values) => commitTextEntry(currentStep, values)}
            />
          </div>
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'symptom-select' && (
          <div className="rx-wizard-step">
            <p className="rx-wizard-question">{currentStep.question}</p>
            <SymptomSelectForm
              key={currentStep.id}
              options={currentStep.options}
              exclusiveKey={currentStep.exclusiveKey}
              onSubmit={(keys) => commitSymptomSelect(currentStep, keys)}
            />
          </div>
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'quick-screen-result' && recordedFindings.entryMode !== 'full' && (
          <QuickScreenResult
            findings={recordedFindings}
            onContinue={() => continueToFullAssessment(currentStep.id, currentStep.continueNext)}
            onFinish={() => finishQuickScreen(currentStep.id, currentStep.finishNext)}
          />
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'optional-tests-menu' && (
          <OptionalTestsMenu
            options={currentStep.options}
            findings={recordedFindings}
            onSelect={(option) => selectOptionalTest(currentStep.id, option.label, option.stepId)}
            onSkip={() => skipOptionalTests(currentStep.id, currentStep.skipNext)}
          />
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'binocular-summary' && <BinocularSummary findings={recordedFindings} />}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'rx-entry' && (
          <div className="rx-wizard-step">
            <p className="rx-wizard-question">{currentStep.question}</p>
            <RxEntryForm key={currentStep.id} initialValue={bestCorrection} onSubmit={(value) => commitRxEntry(currentStep, value)} />
          </div>
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && currentStep?.kind === 'final-rx' && (
          <FinalRxSummary measurement={measurement} bestCorrection={bestCorrection} trialOutcomeLabel={history[history.length - 1]?.outcomeLabel} />
        )}

        {!pendingOutcome && !pendingConsistencyWarning && !result && isTerminalStep && (
          <div
            className={
              currentStep?.kind === 'binocular-summary'
                ? 'rx-wizard-choices rx-terminal-actions rx-terminal-actions-summary'
                : 'rx-wizard-choices rx-terminal-actions'
            }
          >
            <IonButton className="rx-btn-solid" expand="block" onClick={restart}>
              New Patient
            </IonButton>
            <IonButton className="rx-btn-outline" fill="outline" expand="block" routerLink="/guide">
              Back to Clinical Guide
            </IonButton>
          </div>
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
              {currentStep.outcomes.map((outcome) =>
                outcome.hint ? (
                  <button
                    key={outcome.label}
                    type="button"
                    className="rx-wizard-choice rx-wizard-choice-rich"
                    onClick={() => handleSelect(currentStep, outcome)}
                  >
                    <span className="rx-pillar-icon">
                      <CompassIcon size={24} />
                    </span>
                    <span className="rx-pillar-text">
                      <span className="rx-pillar-title">
                        {outcome.label}
                        {outcome.secondaryLabel && <span className="rx-wizard-choice-secondary"> ({outcome.secondaryLabel})</span>}
                      </span>
                      <span className="rx-pillar-desc">{outcome.hint}</span>
                    </span>
                    {outcome.infoTerm && <TermInfo term={outcome.infoTerm} />}
                    <ChevronRightIcon size={16} className="rx-pillar-chevron" />
                  </button>
                ) : (
                  <button key={outcome.label} type="button" className="rx-wizard-choice" onClick={() => handleSelect(currentStep, outcome)}>
                    <span>
                      {outcome.label}
                      {outcome.secondaryLabel && <span className="rx-wizard-choice-secondary"> ({outcome.secondaryLabel})</span>}
                    </span>
                    {outcome.infoTerm && <TermInfo term={outcome.infoTerm} />}
                  </button>
                ),
              )}
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
                      icon={<CompassIcon size={23} />}
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
        </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default PathwayWizard;

import { IonButton } from '@ionic/react';
import { evaluateQuickScreen } from '../../domain/reference/binocularQuickScreen';
import { parseBinocularFindings } from '../../domain/reference/binocularFindings';

export interface QuickScreenResultProps {
  findings: Record<string, string>;
  onContinue: () => void;
  onFinish: () => void;
}

/**
 * The Quick Screen checkpoint — only rendered when reached via the Quick Screen entry path
 * (PathwayWizard silently skips this step for Full Assessment). Answers exactly one of two
 * questions — "screen clear" or "further assessment recommended" — and never a diagnosis or
 * pattern (e.g. never "possible Convergence Insufficiency"): that's Full Assessment's job.
 * Which action is visually primary follows the recommendation, not a fixed layout.
 */
const QuickScreenResult: React.FC<QuickScreenResultProps> = ({ findings, onContinue, onFinish }) => {
  const data = parseBinocularFindings(findings);
  const result = evaluateQuickScreen(data);
  const reasons = [...result.symptomReasons, ...result.objectiveReasons];

  return (
    <div className="rx-wizard-step">
      <p className="rx-quickscreen-headline">
        {result.recommendFullAssessment ? 'Further assessment recommended' : 'Screen clear — no further binocular assessment indicated from this screen.'}
      </p>

      {reasons.length > 0 && (
        <>
          <p className="rx-quickscreen-why">Why:</p>
          <ul className="rx-quickscreen-reasons">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </>
      )}

      <div className="rx-wizard-choices">
        {result.recommendFullAssessment ? (
          <>
            <IonButton className="rx-btn-solid" expand="block" onClick={onContinue}>
              Continue to Full Assessment
            </IonButton>
            <IonButton fill="outline" expand="block" onClick={onFinish}>
              Finish Screening
            </IonButton>
          </>
        ) : (
          <>
            <IonButton className="rx-btn-solid" expand="block" onClick={onFinish}>
              Finish Screening
            </IonButton>
            <IonButton fill="outline" expand="block" onClick={onContinue}>
              Continue to Full Assessment
            </IonButton>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickScreenResult;

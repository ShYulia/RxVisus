import { IonButton } from '@ionic/react';
import { evaluateQuickScreen } from '../../domain/reference/binocularQuickScreen';
import { parseBinocularFindings } from '../../domain/reference/binocularFindings';

export interface QuickScreenResultProps {
  findings: Record<string, string>;
  onContinue: () => void;
  onFinish: () => void;
}

/**
 * The Quick Screen checkpoint — only rendered when reached via the Quick
 * Screen entry path (PathwayWizard silently skips this step for Full
 * Assessment). Explains WHY further assessment is or isn't suggested, never
 * a diagnosis on its own.
 */
const QuickScreenResult: React.FC<QuickScreenResultProps> = ({ findings, onContinue, onFinish }) => {
  const data = parseBinocularFindings(findings);
  const result = evaluateQuickScreen(data);
  const reasons = [...result.symptomReasons, ...result.objectiveReasons];

  return (
    <div className="rx-wizard-step">
      <p className="rx-quickscreen-headline">
        {result.recommendFullAssessment ? 'Full Assessment suggested.' : 'Screening findings unremarkable — no red flags for further assessment.'}
      </p>

      {reasons.length > 0 && (
        <ul className="rx-quickscreen-reasons">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      <div className="rx-wizard-choices">
        <IonButton className="rx-btn-solid" expand="block" onClick={onContinue}>
          Continue to Full Assessment
        </IonButton>
        <IonButton fill="outline" expand="block" onClick={onFinish}>
          Finish here
        </IonButton>
      </div>
    </div>
  );
};

export default QuickScreenResult;

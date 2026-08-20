import { useMemo, useState } from 'react';
import {
  IonAccordion,
  IonAccordionGroup,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  convertWorkingDistanceToAdd,
  validateWorkingDistanceToAddInput,
  type WorkingDistanceToAddValidationErrors,
} from '../../domain/calculators/workingDistanceToAdd';
import { formatDiopter } from './formatDiopter';

const WorkingDistanceToAddCalculator: React.FC = () => {
  const [knownAddStr, setKnownAddStr] = useState('');
  const [testedDistanceStr, setTestedDistanceStr] = useState('');
  const [newDistanceStr, setNewDistanceStr] = useState('');

  const knownAdd = parseFloat(knownAddStr);
  const testedDistanceCm = parseFloat(testedDistanceStr);
  const newDistanceCm = parseFloat(newDistanceStr);

  const errors: WorkingDistanceToAddValidationErrors = useMemo(
    () => validateWorkingDistanceToAddInput({ knownAdd, testedDistanceCm, newDistanceCm }),
    [knownAdd, testedDistanceCm, newDistanceCm],
  );

  const result = useMemo(() => {
    if (Object.keys(errors).length > 0) return null;
    return convertWorkingDistanceToAdd({ knownAdd, testedDistanceCm, newDistanceCm });
  }, [errors, knownAdd, testedDistanceCm, newDistanceCm]);

  const showFieldError = (field: keyof WorkingDistanceToAddValidationErrors, raw: string) =>
    raw.trim() !== '' && Boolean(errors[field]);

  const noInputYet = knownAddStr.trim() === '' && testedDistanceStr.trim() === '' && newDistanceStr.trim() === '';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/calculate" text="Calculate" />
          </IonButtons>
          <IonTitle>Working Distance &rarr; ADD</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Clinically tested ADD</IonLabel>
            <IonInput
              type="number"
              inputmode="decimal"
              placeholder="e.g. 1.50"
              value={knownAddStr}
              onIonInput={(e) => setKnownAddStr(e.detail.value ?? '')}
            />
          </IonItem>
          {showFieldError('knownAdd', knownAddStr) && (
            <IonNote color="danger" className="ion-padding-start">
              {errors.knownAdd}
            </IonNote>
          )}

          <IonItem>
            <IonLabel position="stacked">Tested working distance (cm)</IonLabel>
            <IonInput
              type="number"
              inputmode="decimal"
              placeholder="e.g. 50"
              value={testedDistanceStr}
              onIonInput={(e) => setTestedDistanceStr(e.detail.value ?? '')}
            />
          </IonItem>
          {showFieldError('testedDistanceCm', testedDistanceStr) && (
            <IonNote color="danger" className="ion-padding-start">
              {errors.testedDistanceCm}
            </IonNote>
          )}

          <IonItem>
            <IonLabel position="stacked">New working distance (cm)</IonLabel>
            <IonInput
              type="number"
              inputmode="decimal"
              placeholder="e.g. 80"
              value={newDistanceStr}
              onIonInput={(e) => setNewDistanceStr(e.detail.value ?? '')}
            />
          </IonItem>
          {showFieldError('newDistanceCm', newDistanceStr) && (
            <IonNote color="danger" className="ion-padding-start">
              {errors.newDistanceCm}
            </IonNote>
          )}
        </IonList>

        {result && (
          <IonCard className="ion-margin-top">
            <IonCardContent>
              <IonNote>Calculated equivalent ADD</IonNote>
              <h1>{formatDiopter(result.equivalentAdd)} D</h1>

              <IonNote>Nearest 0.25 D</IonNote>
              <h2>{formatDiopter(result.nearestQuarterAdd)} D</h2>

              {result.requiresCaution && (
                <IonText color="warning">
                  <p>
                    This conversion does not produce a positive ADD for the requested working distance. Do not
                    interpret this automatically as a prescription — clinical verification is required.
                  </p>
                </IonText>
              )}

              <IonText color="medium">
                <p>Verify clinically at the intended working distance.</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {result && (
          <IonAccordionGroup className="ion-margin-top">
            <IonAccordion value="details">
              <IonItem slot="header">
                <IonLabel>Calculation details</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <p>
                  {testedDistanceCm} cm &rarr; {result.testedDistanceDemand.toFixed(2)} D working-distance demand
                </p>
                <p>
                  {newDistanceCm} cm &rarr; {result.newDistanceDemand.toFixed(2)} D working-distance demand
                </p>
                <p>
                  Power adjustment &rarr; {formatDiopter(result.newDistanceDemand - result.testedDistanceDemand)} D
                </p>
                <p>
                  {formatDiopter(knownAdd)} D + ({formatDiopter(result.newDistanceDemand - result.testedDistanceDemand)}{' '}
                  D) &rarr; {formatDiopter(result.equivalentAdd)} D
                </p>
              </div>
            </IonAccordion>
          </IonAccordionGroup>
        )}

        {!result && noInputYet && (
          <IonNote className="ion-padding-start ion-margin-top" style={{ display: 'block' }}>
            Enter the clinically tested ADD and both working distances to convert.
          </IonNote>
        )}
      </IonContent>
    </IonPage>
  );
};

export default WorkingDistanceToAddCalculator;

import { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import {
  convertWorkingDistanceToAdd,
  validateWorkingDistanceToAddInput,
  type WorkingDistanceToAddValidationErrors,
} from '../../domain/calculators/workingDistanceToAdd';
import { formatDiopter } from './formatDiopter';
import PageHeader from '../../components/PageHeader';
import FavoriteStarButton from '../../components/FavoriteStarButton';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import CalculatorResult from '../../components/CalculatorResult';
import Disclosure from '../../components/Disclosure';
import ActionRow from '../../components/ActionRow';

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

  const handleClear = () => {
    setKnownAddStr('');
    setTestedDistanceStr('');
    setNewDistanceStr('');
  };

  return (
    <IonPage>
      <PageHeader
        title="Working Distance → ADD"
        subline="Convert a clinically tested ADD to a different working distance."
        backHref="/calculate"
        action={
          <FavoriteStarButton
            favorite={{ type: 'calculator', id: 'working-distance-add' }}
            label="Working Distance → ADD"
          />
        }
      />
      <IonContent fullscreen className="ion-padding">
        <FieldBoxGrid columns={3}>
          <FieldBox
            label="Tested ADD"
            unit="D"
            placeholder="0.00"
            value={knownAddStr}
            onChange={setKnownAddStr}
            error={showFieldError('knownAdd', knownAddStr) ? errors.knownAdd : undefined}
          />
          <FieldBox
            label="Tested distance"
            unit="cm"
            placeholder="0"
            helperText="Example: 50 cm"
            value={testedDistanceStr}
            onChange={setTestedDistanceStr}
            error={showFieldError('testedDistanceCm', testedDistanceStr) ? errors.testedDistanceCm : undefined}
          />
          <FieldBox
            label="New distance"
            unit="cm"
            placeholder="0"
            helperText="Example: 80 cm"
            value={newDistanceStr}
            onChange={setNewDistanceStr}
            error={showFieldError('newDistanceCm', newDistanceStr) ? errors.newDistanceCm : undefined}
          />
        </FieldBoxGrid>

        {result && (
          <>
            <CalculatorResult
              primaryLabel="Calculated Equivalent ADD"
              primaryValue={`${formatDiopter(result.equivalentAdd)} D`}
              secondaryLabel="Nearest 0.25 D"
              secondaryValue={`${formatDiopter(result.nearestQuarterAdd)} D`}
              caution={
                result.requiresCaution
                  ? "Doesn't yield a positive ADD at this distance. Do not interpret this automatically as a prescription — clinical verification is required."
                  : undefined
              }
            >
              <p className="rx-result-note">Verify clinically at the intended working distance.</p>
            </CalculatorResult>

            <Disclosure label="Calculation details">
              <p>
                {testedDistanceCm} cm &rarr; <strong>{result.testedDistanceDemand.toFixed(2)} D</strong>{' '}
                working-distance demand
              </p>
              <p>
                {newDistanceCm} cm &rarr; <strong>{result.newDistanceDemand.toFixed(2)} D</strong> working-distance
                demand
              </p>
              <p>
                Power adjustment &rarr;{' '}
                <strong>{formatDiopter(result.newDistanceDemand - result.testedDistanceDemand)} D</strong>
              </p>
              <p>
                {formatDiopter(knownAdd)} D + (
                {formatDiopter(result.newDistanceDemand - result.testedDistanceDemand)} D) &rarr;{' '}
                <strong>{formatDiopter(result.equivalentAdd)} D</strong>
              </p>
            </Disclosure>
          </>
        )}

        {!result && noInputYet && (
          <p className="rx-hint">Enter the clinically tested ADD and both working distances to convert.</p>
        )}

        <ActionRow onClear={handleClear} />
      </IonContent>
    </IonPage>
  );
};

export default WorkingDistanceToAddCalculator;

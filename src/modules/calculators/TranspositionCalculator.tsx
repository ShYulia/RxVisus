import { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { transpose } from '../../domain/calculators/transposition';
import { formatRx, parseSphereInput } from './formatDiopter';
import PageHeader from '../../components/PageHeader';
import FavoriteStarButton from '../../components/FavoriteStarButton';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import CalculatorResult from '../../components/CalculatorResult';
import ActionRow from '../../components/ActionRow';

const TranspositionCalculator: React.FC = () => {
  const [sphere, setSphere] = useState('');
  const [cylinder, setCylinder] = useState('');
  const [axis, setAxis] = useState('');

  // Blank means "no cylinder" (spherical) — not a missing/invalid value.
  const cylinderValue = cylinder.trim() === '' ? 0 : parseFloat(cylinder);
  // Axis is clinically meaningless for a spherical-only Rx, so it's only required once there's
  // an actual cylinder to give an axis to.
  const axisRequired = cylinderValue !== 0;

  const result = useMemo(() => {
    const sphereValue = parseSphereInput(sphere);
    const axisValue = parseInt(axis, 10);
    if (Number.isNaN(sphereValue) || Number.isNaN(cylinderValue)) return null;
    if (axisRequired && (Number.isNaN(axisValue) || axisValue < 1 || axisValue > 180)) return null;
    return transpose({ sphere: sphereValue, cylinder: cylinderValue, axis: axisRequired ? axisValue : 180 });
  }, [sphere, cylinderValue, axisRequired, axis]);

  const handleClear = () => {
    setSphere('');
    setCylinder('');
    setAxis('');
  };

  return (
    <IonPage>
      <PageHeader
        title="Transposition"
        backHref="/calculate"
        action={<FavoriteStarButton favorite={{ type: 'calculator', id: 'transposition' }} label="Transposition" />}
      />
      <IonContent fullscreen className="ion-padding">
        <FieldBoxGrid columns={3}>
          <FieldBox
            label="SPH"
            placeholder="0.00"
            helperText="Plano: type Pln"
            inputMode="text"
            value={sphere}
            onChange={setSphere}
          />
          <FieldBox label="CYL" placeholder="0.00" value={cylinder} onChange={setCylinder} />
          <FieldBox
            label="AXIS (1–180°)"
            inputMode="numeric"
            value={axis}
            onChange={setAxis}
            disabled={!axisRequired}
          />
        </FieldBoxGrid>

        {result ? (
          <CalculatorResult primaryLabel="Transposed Prescription" primaryValue={formatRx(result)} />
        ) : (
          <p className="rx-hint">Enter sphere to transpose. Add cylinder and axis only for a toric Rx.</p>
        )}

        <ActionRow onClear={handleClear} />
      </IonContent>
    </IonPage>
  );
};

export default TranspositionCalculator;

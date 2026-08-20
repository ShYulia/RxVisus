import { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { transpose } from '../../domain/calculators/transposition';
import { formatRx } from './formatDiopter';
import PageHeader from '../../components/PageHeader';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import CalculatorResult from '../../components/CalculatorResult';
import ActionRow from '../../components/ActionRow';

const TranspositionCalculator: React.FC = () => {
  const [sphere, setSphere] = useState('');
  const [cylinder, setCylinder] = useState('');
  const [axis, setAxis] = useState('');

  const result = useMemo(() => {
    const sphereValue = parseFloat(sphere);
    const cylinderValue = parseFloat(cylinder);
    const axisValue = parseInt(axis, 10);
    if (
      Number.isNaN(sphereValue) ||
      Number.isNaN(cylinderValue) ||
      Number.isNaN(axisValue) ||
      axisValue < 1 ||
      axisValue > 180
    ) {
      return null;
    }
    return transpose({ sphere: sphereValue, cylinder: cylinderValue, axis: axisValue });
  }, [sphere, cylinder, axis]);

  const handleClear = () => {
    setSphere('');
    setCylinder('');
    setAxis('');
  };

  return (
    <IonPage>
      <PageHeader title="Transposition" backHref="/calculate" />
      <IonContent fullscreen className="ion-padding">
        <FieldBoxGrid columns={3}>
          <FieldBox label="SPH" placeholder="-2.00" value={sphere} onChange={setSphere} />
          <FieldBox label="CYL" placeholder="-1.00" value={cylinder} onChange={setCylinder} />
          <FieldBox label="AXIS" placeholder="1-180" inputMode="numeric" value={axis} onChange={setAxis} />
        </FieldBoxGrid>

        {result ? (
          <CalculatorResult primaryLabel="Transposed Prescription" primaryValue={formatRx(result)} />
        ) : (
          <p className="rx-hint">Enter sphere, cylinder, and axis (1-180) to transpose.</p>
        )}

        <ActionRow onClear={handleClear} copyText={result ? formatRx(result) : undefined} />
      </IonContent>
    </IonPage>
  );
};

export default TranspositionCalculator;

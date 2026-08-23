import { useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { calculateSphericalEquivalent } from '../../domain/calculators/sphericalEquivalent';
import { formatSphere, parseSphereInput } from './formatDiopter';
import PageHeader from '../../components/PageHeader';
import FavoriteStarButton from '../../components/FavoriteStarButton';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import CalculatorResult from '../../components/CalculatorResult';
import ActionRow from '../../components/ActionRow';

const SphericalEquivalentCalculator: React.FC = () => {
  const [sphere, setSphere] = useState('');
  const [cylinder, setCylinder] = useState('');

  // Blank means "no cylinder" (spherical) — not a missing/invalid value.
  const cylinderValue = cylinder.trim() === '' ? 0 : parseFloat(cylinder);

  const result = useMemo(() => {
    const sphereValue = parseSphereInput(sphere);
    if (Number.isNaN(sphereValue) || Number.isNaN(cylinderValue)) return null;
    return calculateSphericalEquivalent({ sphere: sphereValue, cylinder: cylinderValue });
  }, [sphere, cylinderValue]);

  const handleClear = () => {
    setSphere('');
    setCylinder('');
  };

  return (
    <IonPage>
      <PageHeader
        title="Spherical Equivalent"
        backHref="/calculate"
        action={
          <FavoriteStarButton
            favorite={{ type: 'calculator', id: 'spherical-equivalent' }}
            label="Spherical Equivalent"
          />
        }
      />
      <IonContent fullscreen className="ion-padding">
        <FieldBoxGrid columns={2}>
          <FieldBox
            label="SPH"
            placeholder="0.00"
            helperText="Plano: type Pln"
            inputMode="text"
            value={sphere}
            onChange={setSphere}
          />
          <FieldBox label="CYL" placeholder="0.00" value={cylinder} onChange={setCylinder} />
        </FieldBoxGrid>

        {result !== null ? (
          <CalculatorResult primaryLabel="Spherical Equivalent" primaryValue={`${formatSphere(result)} D`} />
        ) : (
          <p className="rx-hint">Enter sphere to calculate. Cylinder is optional.</p>
        )}

        <ActionRow onClear={handleClear} />
      </IonContent>
    </IonPage>
  );
};

export default SphericalEquivalentCalculator;

import { useMemo, useState } from 'react';
import {
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
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { transpose, type Prescription } from '../../domain/calculators/transposition';

function formatDiopter(value: number): string {
  const clean = Object.is(value, -0) ? 0 : value;
  const sign = clean < 0 ? '' : '+';
  return `${sign}${clean.toFixed(2)}`;
}

function formatRx(rx: Prescription): string {
  const axis = String(rx.axis).padStart(3, '0');
  return `${formatDiopter(rx.sphere)} ${formatDiopter(rx.cylinder)} x ${axis}`;
}

const Calculators: React.FC = () => {
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Transposition</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Sphere</IonLabel>
            <IonInput
              type="number"
              inputmode="decimal"
              placeholder="e.g. -2.00"
              value={sphere}
              onIonInput={(e) => setSphere(e.detail.value ?? '')}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Cylinder</IonLabel>
            <IonInput
              type="number"
              inputmode="decimal"
              placeholder="e.g. -1.00"
              value={cylinder}
              onIonInput={(e) => setCylinder(e.detail.value ?? '')}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Axis</IonLabel>
            <IonInput
              type="number"
              inputmode="numeric"
              placeholder="1-180"
              value={axis}
              onIonInput={(e) => setAxis(e.detail.value ?? '')}
            />
          </IonItem>
        </IonList>

        {result ? (
          <IonCard className="ion-margin-top">
            <IonCardContent>
              <IonNote>Transposed prescription</IonNote>
              <h1>{formatRx(result)}</h1>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonNote className="ion-padding-start ion-margin-top" style={{ display: 'block' }}>
            Enter sphere, cylinder, and axis (1-180) to transpose.
          </IonNote>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Calculators;

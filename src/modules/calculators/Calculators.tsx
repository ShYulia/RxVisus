import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { calculatorDefinitions } from './calculatorRegistry';

const Calculators: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Calculate</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonList inset>
          {calculatorDefinitions.map((def) => (
            <IonItem key={def.id} routerLink={def.path} detail>
              <IonLabel>
                <h2>{def.title}</h2>
                <IonNote>{def.subtitle}</IonNote>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Calculators;

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const Calculators: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Calculate</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <p>Calculators coming soon.</p>
      </IonContent>
    </IonPage>
  );
};

export default Calculators;

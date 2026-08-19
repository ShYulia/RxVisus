import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const QuickReference: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reference</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <p>Clinical Quick Reference coming soon.</p>
      </IonContent>
    </IonPage>
  );
};

export default QuickReference;

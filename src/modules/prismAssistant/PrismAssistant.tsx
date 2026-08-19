import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const PrismAssistant: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Assistant</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <p>Prism Assistant coming soon.</p>
      </IonContent>
    </IonPage>
  );
};

export default PrismAssistant;

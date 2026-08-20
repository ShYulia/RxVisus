import { useEffect } from 'react';
import { IonContent, IonPage, useIonAlert } from '@ionic/react';
import { UserIcon } from '../../components/icons';
import FeatureCard from '../../components/FeatureCard';
import { topLevelModules } from '../../navigation/topLevelModules';
import { MODULE_ILLUSTRATIONS } from '../../navigation/moduleVisuals';
import { useProfileStore } from '../../store/profileStore';
import greetingEye from '../../assets/illustrations/greeting-eye.png';
import './Home.css';

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const Home: React.FC = () => {
  const { displayName, hydrate, setDisplayName } = useProfileStore();
  const [presentAlert] = useIonAlert();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const greeting = displayName ? `${timeOfDayGreeting()}, ${displayName}` : timeOfDayGreeting();

  const editDisplayName = () => {
    presentAlert({
      header: 'Your name',
      message: 'Shown in the Home greeting. Leave blank to remove it.',
      inputs: [{ name: 'name', type: 'text', placeholder: 'e.g. Alex', value: displayName }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (data: { name?: string }) => setDisplayName(data.name ?? ''),
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding rx-home-content">
        <div className="rx-home-inner">
          <div className="rx-home-topbar">
            <div className="rx-home-wordmark">
              Rx<span className="rx-home-wordmark-dot">·</span>Visus
            </div>
            <button type="button" className="rx-profile-btn" onClick={editDisplayName} aria-label="Edit your name">
              <UserIcon size={18} />
            </button>
          </div>

          <div className="rx-hero">
            <div className="rx-hero-text">
              <h1 className="rx-hero-greeting">{greeting}</h1>
              <p className="rx-hero-subline">What do you need today?</p>
            </div>
            <div className="rx-hero-eye-wrap">
              <img src={greetingEye} alt="" className="rx-hero-eye" />
            </div>
          </div>

          <div className="rx-feature-grid">
            {topLevelModules.map((mod) => (
              <FeatureCard
                key={mod.id}
                illustration={MODULE_ILLUSTRATIONS[mod.illustration]}
                title={mod.title}
                desc={mod.description}
                routerLink={mod.route}
              />
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

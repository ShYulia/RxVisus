import { IonContent, IonPage } from '@ionic/react';
import { EyeMarkIcon } from '../../components/icons';
import ToolTile from '../../components/ToolTile';
import '../../components/ToolTile.css';
import { topLevelModules } from '../../navigation/topLevelModules';
import { MODULE_ICONS } from '../../navigation/moduleVisuals';
import './Home.css';

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <div className="rx-home-hero">
          <div className="rx-home-hero-text">
            <h1 className="rx-home-greeting">{timeOfDayGreeting()}</h1>
            <p className="rx-home-subline">What do you need today?</p>
          </div>
          <EyeMarkIcon size={56} className="rx-home-eye" />
        </div>

        <div className="rx-tile-grid">
          {topLevelModules.map((mod) => {
            const Icon = MODULE_ICONS[mod.icon];
            return (
              <ToolTile
                key={mod.id}
                icon={<Icon size={22} />}
                title={mod.title}
                desc={mod.description}
                routerLink={mod.route}
              />
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

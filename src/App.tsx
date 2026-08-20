import { useEffect } from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Tabs from './navigation/Tabs';
import SideRail from './navigation/SideRail';
import { useFavoritesStore } from './store/favoritesStore';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */
/* No dark palette designed yet — RxVisus renders its light warm-neutral
   theme regardless of OS setting until a deliberate dark variant exists. */

/* Self-hosted fonts (no network requests — RxVisus is offline-only) */
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';

/* Theme variables */
import './theme/variables.css';
import './theme/shell.css';

setupIonicReact();

const App: React.FC = () => {
  const hydrateFavorites = useFavoritesStore((s) => s.hydrate);

  useEffect(() => {
    hydrateFavorites();
  }, [hydrateFavorites]);

  return (
    <IonApp>
      <IonReactRouter>
        <div className="rx-shell">
          <SideRail />
          <div className="rx-shell-main">
            <Tabs />
          </div>
        </div>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;

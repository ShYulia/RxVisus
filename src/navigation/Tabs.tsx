import { Redirect, Route } from 'react-router-dom';
import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { bookOutline, calculatorOutline, glassesOutline, homeOutline } from 'ionicons/icons';
import Home from '../modules/home/Home';
import Calculators from '../modules/calculators/Calculators';
import PrismAssistant from '../modules/prismAssistant/PrismAssistant';
import QuickReference from '../modules/quickReference/QuickReference';

const Tabs: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/home">
        <Home />
      </Route>
      <Route exact path="/calculate">
        <Calculators />
      </Route>
      <Route exact path="/assistant">
        <PrismAssistant />
      </Route>
      <Route exact path="/reference">
        <QuickReference />
      </Route>
      <Route exact path="/">
        <Redirect to="/home" />
      </Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
      <IonTabButton tab="home" href="/home">
        <IonIcon icon={homeOutline} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      <IonTabButton tab="calculate" href="/calculate">
        <IonIcon icon={calculatorOutline} />
        <IonLabel>Calculate</IonLabel>
      </IonTabButton>
      <IonTabButton tab="assistant" href="/assistant">
        <IonIcon icon={glassesOutline} />
        <IonLabel>Assistant</IonLabel>
      </IonTabButton>
      <IonTabButton tab="reference" href="/reference">
        <IonIcon icon={bookOutline} />
        <IonLabel>Reference</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

export default Tabs;

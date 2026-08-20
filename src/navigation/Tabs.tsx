import { Redirect, Route } from 'react-router-dom';
import { IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { HomeIcon } from '../components/icons';
import Home from '../modules/home/Home';
import Calculators from '../modules/calculators/Calculators';
import { calculatorDefinitions } from '../modules/calculators/calculatorRegistry';
import Guide from '../modules/guide/Guide';
import GuidePathway from '../modules/guide/GuidePathway';
import TestsList from '../modules/guide/TestsList';
import TestCard from '../modules/guide/TestCard';
import { topLevelModules } from './topLevelModules';
import { MODULE_ICONS } from './moduleVisuals';
import './Tabs.css';

const Tabs: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/home">
        <Home />
      </Route>
      <Route exact path="/calculate">
        <Calculators />
      </Route>
      {calculatorDefinitions.map((def) => (
        <Route exact path={def.path} key={def.id}>
          <def.component />
        </Route>
      ))}
      <Route exact path="/guide">
        <Guide />
      </Route>
      <Route exact path="/guide/tests">
        <TestsList />
      </Route>
      <Route exact path="/guide/tests/:testId">
        <TestCard />
      </Route>
      <Route exact path="/guide/pathway/:pathwayId">
        <GuidePathway />
      </Route>
      <Route exact path="/">
        <Redirect to="/home" />
      </Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom" className="rx-tabbar">
      <IonTabButton tab="home" href="/home">
        <HomeIcon size={20} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      {topLevelModules
        .filter((mod) => mod.showInNav)
        .map((mod) => {
          const Icon = MODULE_ICONS[mod.icon];
          return (
            <IonTabButton key={mod.id} tab={mod.id} href={mod.route}>
              <Icon size={20} />
              <IonLabel>{mod.title}</IonLabel>
            </IonTabButton>
          );
        })}
    </IonTabBar>
  </IonTabs>
);

export default Tabs;

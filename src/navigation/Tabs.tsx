import { Redirect, Route } from 'react-router-dom';
import { IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { Calculator, Eye, House, Star, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import Home from '../modules/home/Home';
import Calculators from '../modules/calculators/Calculators';
import { calculatorDefinitions } from '../modules/calculators/calculatorRegistry';
import Guide from '../modules/guide/Guide';
import GuidePathway from '../modules/guide/GuidePathway';
import TestsList from '../modules/guide/TestsList';
import TestCard from '../modules/guide/TestCard';
import Favorites from '../modules/favorites/Favorites';
import { topLevelModules } from './topLevelModules';
import './Tabs.css';

/**
 * Bottom-tab-bar icons only — deliberately separate from moduleVisuals'
 * MODULE_ICONS (used by the desktop SideRail), which keeps its existing
 * lighter icon style. This mapping is scoped to the mobile tab bar.
 */
const TAB_BAR_ICONS: Record<string, PhosphorIcon> = {
  calculators: Calculator,
  guide: Eye,
};

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
      <Route exact path="/favorites">
        <Favorites />
      </Route>
      <Route exact path="/">
        <Redirect to="/home" />
      </Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom" className="rx-tabbar">
      <IonTabButton tab="home" href="/home">
        <span className="rx-tab-icon-wrap">
          <House size={25} weight="duotone" />
        </span>
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      {topLevelModules
        .filter((mod) => mod.showInNav)
        .map((mod) => {
          const Icon = TAB_BAR_ICONS[mod.id];
          return (
            <IonTabButton key={mod.id} tab={mod.id} href={mod.route}>
              <span className="rx-tab-icon-wrap">
                <Icon size={25} weight="duotone" />
              </span>
              <IonLabel>{mod.title}</IonLabel>
            </IonTabButton>
          );
        })}
      <IonTabButton tab="favorites" href="/favorites">
        <span className="rx-tab-icon-wrap">
          <Star size={25} weight="duotone" />
        </span>
        <IonLabel>Favorites</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

export default Tabs;

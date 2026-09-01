import { IonContent, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import PillarRow from '../../components/PillarRow';
import { GlassesIcon, SwapArrowsIcon, TriangleIcon } from '../../components/icons';
import { calculatorDefinitions } from './calculatorRegistry';
import '../../components/PillarRow.css';

const ICONS: Record<string, React.ReactNode> = {
  transposition: <SwapArrowsIcon size={26} />,
  'working-distance-add': <span className="rx-pillar-icon-text">ADD</span>,
  'vertex-distance': <GlassesIcon size={26} />,
  'spherical-equivalent': <span className="rx-pillar-icon-text">SE</span>,
  prism: <TriangleIcon size={26} />,
};

const Calculators: React.FC = () => {
  return (
    <IonPage>
      <PageHeader title="Calculators" backHref="/home" />
      <IonContent fullscreen className="ion-padding">
        <div className="rx-pillars rx-pillars-cards">
          {calculatorDefinitions.map((def) => (
            <PillarRow key={def.id} icon={ICONS[def.id]} title={def.title} desc={def.subtitle} routerLink={def.path} />
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Calculators;

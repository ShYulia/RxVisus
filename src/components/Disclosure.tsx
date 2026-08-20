import { IonAccordion, IonAccordionGroup, IonItem, IonLabel } from '@ionic/react';
import { ChevronDownIcon } from './icons';
import './Disclosure.css';

export interface DisclosureProps {
  label: string;
  children: React.ReactNode;
}

/** Collapsed-by-default "Calculation details" pattern — secondary, never competes with the result. */
const Disclosure: React.FC<DisclosureProps> = ({ label, children }) => (
  <IonAccordionGroup className="rx-disclosure">
    <IonAccordion value="details">
      <IonItem slot="header" lines="none" className="rx-disclosure-header">
        <IonLabel className="rx-disclosure-label">{label}</IonLabel>
        <ChevronDownIcon size={16} className="rx-disclosure-chevron" slot="end" />
      </IonItem>
      <div className="rx-disclosure-content" slot="content">
        {children}
      </div>
    </IonAccordion>
  </IonAccordionGroup>
);

export default Disclosure;

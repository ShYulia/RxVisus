import { IonBackButton, IonButtons, IonHeader, IonToolbar } from '@ionic/react';
import './PageHeader.css';

export interface PageHeaderProps {
  title: string;
  subline?: string;
  backHref?: string;
}

/** Shared screen header: left-aligned title + optional one-line context + optional back button. */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subline, backHref }) => (
  <IonHeader className="rx-header ion-no-border">
    <IonToolbar>
      {backHref && (
        <IonButtons slot="start">
          <IonBackButton defaultHref={backHref} text="" />
        </IonButtons>
      )}
      <div className="rx-header-text" slot="start">
        <h1 className="rx-header-title">{title}</h1>
        {subline && <p className="rx-header-subline">{subline}</p>}
      </div>
    </IonToolbar>
  </IonHeader>
);

export default PageHeader;

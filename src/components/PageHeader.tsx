import { IonBackButton, IonButton, IonButtons, IonHeader, IonToolbar } from '@ionic/react';
import { ChevronLeftIcon } from './icons';
import './PageHeader.css';

export interface PageHeaderProps {
  title: string;
  subline?: string;
  backHref?: string;
  /** In-page back handler (e.g. "step back one" in a wizard) — takes precedence over backHref, which stays as the route to fall back to when there's nothing left to step back through. */
  onBack?: () => void;
  /** Optional right-side control, e.g. a favorite-star toggle or an "Exit" link. */
  action?: React.ReactNode;
}

/** Shared screen header: left-aligned title + optional one-line context + optional back button. */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subline, backHref, onBack, action }) => (
  <IonHeader className="rx-header ion-no-border">
    <IonToolbar>
      {(backHref || onBack) && (
        <IonButtons slot="start">
          {onBack ? (
            <IonButton fill="clear" className="rx-header-back-btn" onClick={onBack} aria-label="Back">
              <ChevronLeftIcon size={22} />
            </IonButton>
          ) : (
            <IonBackButton defaultHref={backHref} text="" />
          )}
        </IonButtons>
      )}
      <div className="rx-header-text" slot="start">
        <h1 className="rx-header-title">{title}</h1>
        {subline && <p className="rx-header-subline">{subline}</p>}
      </div>
      {action && <IonButtons slot="end">{action}</IonButtons>}
    </IonToolbar>
  </IonHeader>
);

export default PageHeader;

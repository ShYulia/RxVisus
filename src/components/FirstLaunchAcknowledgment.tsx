import { useEffect } from 'react';
import { IonButton, IonModal } from '@ionic/react';
import { useOnboardingStore } from '../store/onboardingStore';
import './FirstLaunchAcknowledgment.css';

/**
 * Shown once, before anything else is reachable — not dismissible by backdrop tap, swipe, or
 * hardware back; "I understand" is the only way past it. canDismiss is a function (not a bare
 * `false`) that reads the store directly, because Ionic's dismiss() — including the legitimate
 * one triggered when isOpen turns false after acknowledging — is itself gated by canDismiss: a
 * bare `false` would block that dismissal too, not just backdrop/swipe/back. Wording mirrors the
 * About page and Binocular Summary's point-of-use disclaimer so the same framing appears
 * consistently everywhere it's stated, not just here. Hydrates its own store on mount (same
 * self-contained pattern as Home does for profileStore) so it works correctly wherever it's
 * rendered, without depending on a parent to remember to hydrate it.
 */
const FirstLaunchAcknowledgment: React.FC = () => {
  const acknowledged = useOnboardingStore((s) => s.acknowledged);
  const hydrated = useOnboardingStore((s) => s.hydrated);
  const hydrate = useOnboardingStore((s) => s.hydrate);
  const acknowledge = useOnboardingStore((s) => s.acknowledge);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <IonModal
      isOpen={hydrated && !acknowledged}
      backdropDismiss={false}
      canDismiss={() => Promise.resolve(useOnboardingStore.getState().acknowledged)}
      className="rx-ack-modal"
    >
      <div className="rx-ack-inner">
        <span className="rx-ack-wordmark">RxKit</span>
        <p className="rx-ack-heading">Before you begin</p>
        <ul className="rx-ack-points">
          <li>RxKit is intended for qualified eye-care professionals.</li>
          <li>It is a clinical reference and decision-support tool — not a diagnostic device.</li>
          <li>Calculations, findings, and interpretations must be independently verified.</li>
          <li>You remain responsible for diagnosis, management, and treatment decisions.</li>
        </ul>
        <IonButton className="rx-btn-solid" expand="block" onClick={acknowledge}>
          I understand
        </IonButton>
      </div>
    </IonModal>
  );
};

export default FirstLaunchAcknowledgment;

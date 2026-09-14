import { IonButton } from '@ionic/react';
import CopyButton from './CopyButton';
import './ActionRow.css';

export interface ActionRowProps {
  onClear: () => void;
  /** Text to copy — Copy Result is disabled while this is empty/undefined. */
  copyText?: string;
  /** Opt-in per calculator — only render Copy Result when there's a concrete external workflow for it. */
  showCopy?: boolean;
  /** Button label while idle. Defaults to "Copy Result" — override when the copied value isn't the calculator's headline result (e.g. Vertex Distance's "Copy Stock Parameters"). */
  copyLabel?: string;
}

/** Clear (+ optional Copy Result) actions shown below a calculator's result. */
const ActionRow: React.FC<ActionRowProps> = ({ onClear, copyText, showCopy = false, copyLabel = 'Copy Result' }) => (
  <div className="rx-action-row">
    <IonButton className="rx-btn-outline" expand="block" fill="outline" onClick={onClear}>
      Clear
    </IonButton>
    {showCopy && <CopyButton label={copyLabel} text={copyText} />}
  </div>
);

export default ActionRow;

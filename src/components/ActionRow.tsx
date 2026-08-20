import { useState } from 'react';
import { IonButton } from '@ionic/react';
import './ActionRow.css';

export interface ActionRowProps {
  onClear: () => void;
  /** Text to copy — Copy Result is disabled while this is empty/undefined. */
  copyText?: string;
  /** Opt-in per calculator — only render Copy Result when there's a concrete external workflow for it. */
  showCopy?: boolean;
}

/** Clear (+ optional Copy Result) actions shown below a calculator's result. */
const ActionRow: React.FC<ActionRowProps> = ({ onClear, copyText, showCopy = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable or permission denied — nothing to recover, just skip the "Copied" feedback.
    }
  };

  return (
    <div className="rx-action-row">
      <IonButton className="rx-btn-outline" expand="block" fill="outline" onClick={onClear}>
        Clear
      </IonButton>
      {showCopy && (
        <IonButton className="rx-btn-solid" expand="block" onClick={handleCopy} disabled={!copyText}>
          {copied ? 'Copied' : 'Copy Result'}
        </IonButton>
      )}
    </div>
  );
};

export default ActionRow;

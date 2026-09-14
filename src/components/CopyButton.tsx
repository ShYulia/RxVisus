import { useState } from 'react';
import { IonButton } from '@ionic/react';
import './ActionRow.css';

export interface CopyButtonProps {
  label: string;
  /** Text to copy — disabled while this is empty/undefined. */
  text?: string;
  /** Extra inline style — e.g. spacing when used standalone rather than inside ActionRow's flex row (where margin must stay 0 to keep Clear/Copy aligned). */
  style?: React.CSSProperties;
  /** Compact secondary-action sizing (`.rx-btn-compact`, auto width) instead of the full-width primary treatment (`.rx-btn-solid`) — for a copy action tied inline to one result value, where a large CTA would dominate the screen. */
  compact?: boolean;
}

/**
 * Standalone copy-to-clipboard button — the shared primary-button treatment (`.rx-btn-solid`,
 * same as ActionRow's Clear/Copy) by default, or the compact treatment (`compact` prop) for
 * calculators that need more than one distinct copy action tied to individual result values
 * (e.g. Vertex Distance's "Copy Corrected Rx" alongside "Copy Stock Parameters"), where a
 * single ActionRow copy slot — or a second full-width button — isn't the right fit.
 */
const CopyButton: React.FC<CopyButtonProps> = ({ label, text, style, compact = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable or permission denied — nothing to recover, just skip the "Copied" feedback.
    }
  };

  return (
    <IonButton
      className={compact ? 'rx-btn-compact' : 'rx-btn-solid'}
      expand={compact ? undefined : 'block'}
      style={style}
      onClick={handleCopy}
      disabled={!text}
    >
      {copied ? 'Copied' : label}
    </IonButton>
  );
};

export default CopyButton;

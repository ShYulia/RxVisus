import { useState } from 'react';
import { ChevronDownIcon } from './icons';
import './CompactCard.css';

export interface CompactCardProps {
  label: string;
  /** Rendered open on first mount instead of collapsed — use sparingly, only when the content is short enough not to reintroduce the density a compact card exists to avoid. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * A small, compact, tappable row that expands its content on click — no native <details>
 * marker. Used for secondary/supporting detail on a result screen so the primary result and
 * its key findings stay the visual focus (see Binocular Status Summary and Final Rx).
 */
const CompactCard: React.FC<CompactCardProps> = ({ label, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rx-summary-compact">
      <button type="button" className="rx-summary-compact-trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{label}</span>
        <ChevronDownIcon size={14} className={open ? 'rx-summary-compact-chevron rx-summary-compact-chevron-open' : 'rx-summary-compact-chevron'} />
      </button>
      {open && <div className="rx-summary-compact-content">{children}</div>}
    </div>
  );
};

export default CompactCard;

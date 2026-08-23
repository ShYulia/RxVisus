import { useState } from 'react';
import { getGlossaryTerm } from '../../domain/reference/glossary';

/** Tap-to-reveal "?" affordance for a jargon term — hidden by default, never inline in the main flow. */
const TermInfo: React.FC<{ term: string }> = ({ term }) => {
  const [open, setOpen] = useState(false);
  const definition = getGlossaryTerm(term);
  if (!definition) return null;

  return (
    <span className="rx-term-info">
      <button
        type="button"
        className="rx-term-info-trigger"
        aria-label={`What does "${term}" mean?`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        ?
      </button>
      {open && <span className="rx-term-info-popover">{definition}</span>}
    </span>
  );
};

export default TermInfo;

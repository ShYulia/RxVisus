import { getPathwayNode } from '../../domain/reference/clinicalPathways';
import PillarRow from '../../components/PillarRow';
import { CompassIcon } from '../../components/icons';

export interface RedFlagAlertProps {
  message: string;
  /** Overrides the default "Urgent assessment may be indicated" — for a non-emergency caution (e.g. "use the Diplopia pathway instead"). */
  title?: string;
  /** Pathway node(s) worth linking to directly from the alert — e.g. routing a new-diplopia finding to the Diplopia guide without waiting for the flow to end. */
  seeAlso?: string[];
  onContinue: () => void;
}

/** Interrupts the wizard flow for a finding-specific red flag — impossible to miss, must be acknowledged to continue. */
const RedFlagAlert: React.FC<RedFlagAlertProps> = ({ message, title, seeAlso, onContinue }) => {
  const alertTitle = title ?? 'Urgent assessment may be indicated';
  return (
    <div className="rx-alert-overlay" role="alertdialog" aria-modal="true" aria-label={alertTitle}>
      <div className="rx-alert-box">
        <p className="rx-alert-title">{alertTitle}</p>
        <p className="rx-alert-message">{message}</p>

        {seeAlso && seeAlso.length > 0 && (
          <div className="rx-pillars rx-alert-seealso">
            {seeAlso.map((seeAlsoId) => {
              const node = getPathwayNode(seeAlsoId);
              if (!node) return null;
              return (
                <PillarRow
                  key={node.id}
                  icon={<CompassIcon size={23} />}
                  title={node.title}
                  desc={node.overview ?? ''}
                  routerLink={`/guide/pathway/${node.id}`}
                />
              );
            })}
          </div>
        )}

        <button type="button" className="rx-alert-continue" onClick={onContinue}>
          Continue exam
        </button>
      </div>
    </div>
  );
};

export default RedFlagAlert;

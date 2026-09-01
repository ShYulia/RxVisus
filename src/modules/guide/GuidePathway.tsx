import { useParams } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import PillarRow from '../../components/PillarRow';
import Chip from '../../components/Chip';
import CautionBox from '../../components/CautionBox';
import { CompassIcon } from '../../components/icons';
import { getPathwayNode } from '../../domain/reference/clinicalPathways';
import { getClinicalTest } from '../../domain/reference/clinicalTests';
import PathwayWizard from './PathwayWizard';
import '../../components/Chip.css';
import './Guide.css';

/**
 * Generic renderer for any clinical pathway node — branch (more choices) or
 * leaf. A leaf with a `steps` decision flow renders as an interactive
 * wizard (PathwayWizard); a leaf without one (e.g. Prism Prescribing
 * Guidance) is plain reference content. One component for every pathway, so
 * a new pathway is a data change, not a new screen.
 */
const GuidePathway: React.FC = () => {
  const { pathwayId } = useParams<{ pathwayId: string }>();
  const node = getPathwayNode(pathwayId);

  if (!node) {
    return (
      <IonPage>
        <PageHeader title="Not found" backHref="/guide" />
        <IonContent fullscreen className="ion-padding">
          <p className="rx-hint">This pathway doesn&rsquo;t exist.</p>
        </IonContent>
      </IonPage>
    );
  }

  const hasWizard = node.kind === 'leaf' && !!node.steps && node.steps.length > 0;
  if (hasWizard) {
    // PathwayWizard owns its own page shell (header, back/exit behavior, content) —
    // nesting it inside another IonPage here would break Ionic's page stack.
    return <PathwayWizard key={node.id} node={node} />;
  }

  const backState = { from: `/guide/pathway/${node.id}` };

  return (
    <IonPage>
      <PageHeader title={node.title} backHref="/guide" />
      <IonContent fullscreen className="ion-padding">
        {node.overview && <p className="rx-hint" style={{ marginTop: 0 }}>{node.overview}</p>}

        {node.kind === 'branch' && (
          <div className="rx-pillars rx-pillars-cards" style={{ marginTop: 14 }}>
            {(node.children ?? []).map((childId) => {
              const child = getPathwayNode(childId);
              if (!child) return null;
              return (
                <PillarRow
                  key={child.id}
                  icon={<CompassIcon size={26} />}
                  title={child.title}
                  desc={child.overview ?? ''}
                  routerLink={`/guide/pathway/${child.id}`}
                />
              );
            })}
          </div>
        )}

        {node.kind === 'leaf' && (
          <>
            {node.keySteps && node.keySteps.length > 0 && (
              <div className="rx-list-section">
                <p className="rx-list-section-label">Notes</p>
                <ol>
                  {node.keySteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {node.testIds && node.testIds.length > 0 && (
              <div className="rx-list-section">
                <p className="rx-list-section-label">Relevant tests</p>
                <div className="rx-chip-row">
                  {node.testIds.map((testId) => {
                    const test = getClinicalTest(testId);
                    return test ? <Chip key={testId} label={test.title} routerLink={`/guide/tests/${testId}`} state={backState} /> : null;
                  })}
                </div>
              </div>
            )}

            {node.redFlags && node.redFlags.length > 0 && (
              <CautionBox className="rx-pathway-redflags">
                {node.redFlags.map((flag) => (
                  <p key={flag} className="rx-caution-text">
                    {flag}
                  </p>
                ))}
              </CautionBox>
            )}

            {node.seeAlso && node.seeAlso.length > 0 && (
              <div className="rx-pillars" style={{ marginTop: 14 }}>
                {node.seeAlso.map((seeAlsoId) => {
                  const seeAlsoNode = getPathwayNode(seeAlsoId);
                  if (!seeAlsoNode) return null;
                  return (
                    <PillarRow
                      key={seeAlsoNode.id}
                      icon={<CompassIcon size={23} />}
                      title={seeAlsoNode.title}
                      desc={seeAlsoNode.overview ?? ''}
                      routerLink={`/guide/pathway/${seeAlsoNode.id}`}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default GuidePathway;

import { useParams } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import PillarRow from '../../components/PillarRow';
import Chip from '../../components/Chip';
import CautionBox from '../../components/CautionBox';
import { CompassIcon } from '../../components/icons';
import { getPathwayNode } from '../../domain/reference/clinicalPathways';
import { getClinicalTest } from '../../domain/reference/clinicalTests';
import '../../components/Chip.css';
import './Guide.css';

/**
 * Generic renderer for any clinical pathway node — branch (more choices) or
 * leaf (guidance + decision flow). One component for every pathway, so a
 * new pathway is a data change, not a new screen.
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

  const backState = { from: `/guide/pathway/${node.id}` };

  return (
    <IonPage>
      <PageHeader title={node.title} backHref="/guide" />
      <IonContent fullscreen className="ion-padding">
        {node.overview && <p className="rx-hint" style={{ marginTop: 0 }}>{node.overview}</p>}

        {node.kind === 'branch' && (
          <div className="rx-pillars" style={{ marginTop: 14 }}>
            {(node.children ?? []).map((childId) => {
              const child = getPathwayNode(childId);
              if (!child) return null;
              return (
                <PillarRow
                  key={child.id}
                  icon={<CompassIcon size={22} />}
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
                <p className="rx-list-section-label">Before testing</p>
                <ol>
                  {node.keySteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {node.steps && node.steps.length > 0 && (
              <div className="rx-list-section">
                {node.steps.map((step) => (
                  <div className="rx-step" key={step.question}>
                    <p className="rx-step-question">{step.question}</p>

                    {step.testIds && step.testIds.length > 0 && (
                      <div className="rx-chip-row rx-step-testchips">
                        {step.testIds.map((testId) => {
                          const test = getClinicalTest(testId);
                          return test ? (
                            <Chip key={testId} label={test.title} routerLink={`/guide/tests/${testId}`} state={backState} />
                          ) : null;
                        })}
                      </div>
                    )}

                    <div className="rx-step-outcomes">
                      {step.outcomes.map((outcome) => (
                        <div className="rx-step-outcome" key={outcome.label}>
                          <p className="rx-step-outcome-line">
                            <span className="rx-step-outcome-label">{outcome.label}</span>
                            <span className="rx-step-outcome-arrow"> &rarr; </span>
                            <span className="rx-step-outcome-action">{outcome.action}</span>
                          </p>

                          {outcome.testIds && outcome.testIds.length > 0 && (
                            <div className="rx-chip-row rx-step-testchips">
                              {outcome.testIds.map((testId) => {
                                const test = getClinicalTest(testId);
                                return test ? (
                                  <Chip key={testId} label={test.title} routerLink={`/guide/tests/${testId}`} state={backState} />
                                ) : null;
                              })}
                            </div>
                          )}

                          {outcome.redFlag && (
                            <CautionBox className="rx-pathway-redflags">
                              <p className="rx-caution-text">{outcome.redFlag}</p>
                            </CautionBox>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                      icon={<CompassIcon size={22} />}
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

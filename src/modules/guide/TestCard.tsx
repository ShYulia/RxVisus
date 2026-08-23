import { useLocation, useParams } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import { getClinicalTest } from '../../domain/reference/clinicalTests';
import SchoberDiagram from './SchoberDiagram';
import './Guide.css';

/** Test cards where a small diagram scans faster than another paragraph. Keyed by ClinicalTest id. */
const TEST_DIAGRAMS: Record<string, React.FC> = {
  'schober-test': SchoberDiagram,
};

const Section: React.FC<{ label: string; items: string[]; ordered?: boolean }> = ({ label, items, ordered }) => {
  if (items.length === 0) return null;
  const List = ordered ? 'ol' : 'ul';
  return (
    <div className="rx-list-section">
      <p className="rx-list-section-label">{label}</p>
      <List>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    </div>
  );
};

/** The canonical test card — one component, reached from a pathway step's chips or from direct search, same content either way. */
const TestCard: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const location = useLocation<{ from?: string } | undefined>();
  const backHref = location.state?.from ?? '/guide/tests';
  const test = getClinicalTest(testId);
  const Diagram = test ? TEST_DIAGRAMS[test.id] : undefined;

  if (!test) {
    return (
      <IonPage>
        <PageHeader title="Not found" backHref={backHref} />
        <IonContent fullscreen className="ion-padding">
          <p className="rx-hint">This test doesn&rsquo;t exist.</p>
        </IonContent>
      </IonPage>
    );
  }

  const hasMoreDetails = !!test.moreDetails && test.moreDetails.length > 0;

  return (
    <IonPage>
      <PageHeader title={test.title} backHref={backHref} />
      <IonContent fullscreen className="ion-padding">
        <p className="rx-hint" style={{ marginTop: 0 }}>
          {test.purpose}
        </p>

        <Section label="You need" items={test.youNeed} />
        <Section label="Setup" items={test.setup} />
        <Section label="Do" items={test.doSteps} ordered />

        {(test.patientSees?.length || Diagram) && (
          <div className="rx-list-section">
            <p className="rx-list-section-label">Patient sees</p>
            {Diagram && <Diagram />}
            {test.patientSees && test.patientSees.length > 0 && (
              <ul>
                {test.patientSees.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {test.interpret.length > 0 && (
          <div className="rx-list-section">
            <p className="rx-list-section-label">Interpret</p>
            <div className="rx-interpret-rows">
              {test.interpret.map((row) => (
                <p className="rx-interpret-row" key={row.finding}>
                  <span className="rx-interpret-finding">{row.finding}</span>
                  <span className="rx-interpret-arrow"> &rarr; </span>
                  <span className="rx-interpret-meaning">{row.meaning}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        <Section label="Neutralize / measure" items={test.neutralize ?? []} />

        {hasMoreDetails && (
          <details className="rx-more-details">
            <summary>More details</summary>
            <ul>
              {test.moreDetails!.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        )}
      </IonContent>
    </IonPage>
  );
};

export default TestCard;

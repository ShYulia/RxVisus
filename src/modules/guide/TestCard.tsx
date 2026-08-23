import { useLocation, useParams } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import CautionBox from '../../components/CautionBox';
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

/** The canonical test card — one component, reached from a pathway leaf's chips or from direct search, same content either way. */
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

  return (
    <IonPage>
      <PageHeader title={test.title} backHref={backHref} />
      <IonContent fullscreen className="ion-padding">
        <p className="rx-hint" style={{ marginTop: 0 }}>
          {test.purpose}
        </p>

        <Section label="Setup" items={test.setup} />
        {Diagram && <Diagram />}
        <Section label="How to" items={test.howTo} ordered />
        <Section label="What to watch" items={test.whatToWatch} />
        <Section label="Record" items={test.record} />

        {test.quickTip && (
          <div className="rx-quicktip">
            <p className="rx-quicktip-label">Quick tip</p>
            <p>{test.quickTip}</p>
          </div>
        )}

        {test.commonMistakes && test.commonMistakes.length > 0 && (
          <CautionBox className="rx-pathway-redflags">
            {test.commonMistakes.map((mistake) => (
              <p key={mistake} className="rx-caution-text">
                {mistake}
              </p>
            ))}
          </CautionBox>
        )}
      </IonContent>
    </IonPage>
  );
};

export default TestCard;

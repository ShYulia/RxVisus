import { useLocation, useParams } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import PageHeader from '../../components/PageHeader';
import { getClinicalTest } from '../../domain/reference/clinicalTests';
import ActionFlow from './ActionFlow';
import ConvergenceDiagram from './ConvergenceDiagram';
import CoverTestQuickCard from './CoverTestQuickCard';
import DoubleMaddoxRodQuickCard from './DoubleMaddoxRodQuickCard';
import { BAFQuickCard, MAFQuickCard, VergenceFacilityQuickCard } from './FacilityQuickCards';
import MaddoxRodQuickCard from './MaddoxRodQuickCard';
import Parks3StepSelector from './Parks3StepSelector';
import PrismGaugeDiagram from './PrismGaugeDiagram';
import SchoberQuickCard from './SchoberQuickCard';
import StereoDepthDiagram from './StereoDepthDiagram';
import VonGraefeQuickCard from './VonGraefeQuickCard';
import Worth4DotQuickCard from './Worth4DotQuickCard';
import './Guide.css';

/**
 * Test cards with a bespoke visual quick-reference layout instead of the generic text
 * sections below. This is the general pattern for any future point-of-care Test Card that
 * needs it — see SchoberQuickCard/MaddoxRodQuickCard (recognition image, SETUP, PATIENT SEES
 * -> MEANS -> NEUTRALIZE rows), FacilityQuickCards (flip-sequence instruction cards for
 * MAF/BAF/Vergence Facility), CoverTestQuickCard (mode toggle between two techniques that
 * answer different clinical questions), and Parks3StepSelector (progressive decision-tree
 * card, no recognition/finding rows at all) for different shapes of "not the generic template."
 */
const QUICK_CARDS: Record<string, React.FC> = {
  'cover-test': CoverTestQuickCard,
  'schober-test': SchoberQuickCard,
  'maddox-rod': MaddoxRodQuickCard,
  'von-graefe-test': VonGraefeQuickCard,
  'double-maddox-rod': DoubleMaddoxRodQuickCard,
  'worth-4-dot': Worth4DotQuickCard,
  'monocular-accommodative-facility-test': MAFQuickCard,
  'binocular-accommodative-facility-test': BAFQuickCard,
  'vergence-facility-test': VergenceFacilityQuickCard,
  'parks-3-step': Parks3StepSelector,
};

/**
 * Quick cards that fully own their own equipment/setup presentation (folded into their
 * meta strip / instruction chips) — TestCard must not also render the generic Equipment
 * section above them, or the same information would appear twice.
 */
const SELF_CONTAINED_QUICK_CARDS = new Set(['monocular-accommodative-facility-test', 'binocular-accommodative-facility-test', 'vergence-facility-test']);

/**
 * A single supplementary illustration for a generic (non-QuickCard) test where seeing the
 * procedure is substantially faster than describing it — rendered inline above the "How to"
 * flow, not a replacement for the generic template the way QUICK_CARDS is.
 */
const DIAGRAMS: Record<string, React.FC> = {
  'npc-test': ConvergenceDiagram,
  'fusional-vergence-test': PrismGaugeDiagram,
  'stereoacuity-test': StereoDepthDiagram,
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
  const QuickCard = test ? QUICK_CARDS[test.id] : undefined;
  const Diagram = test ? DIAGRAMS[test.id] : undefined;

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

  const hasMoreSections = !!test.moreSections && test.moreSections.length > 0;
  const hasMoreDetails = !hasMoreSections && !!test.moreDetails && test.moreDetails.length > 0;

  return (
    <IonPage>
      <PageHeader title={test.title} backHref={backHref} />
      <IonContent fullscreen className="ion-padding">
        <p className="rx-hint" style={{ marginTop: 0 }}>
          {test.purpose}
        </p>

        {!SELF_CONTAINED_QUICK_CARDS.has(test.id) && <Section label="Equipment" items={test.youNeed} />}

        {!SELF_CONTAINED_QUICK_CARDS.has(test.id) && test.meta && test.meta.length > 0 && <p className="rx-testcard-meta">{test.meta.join('  •  ')}</p>}

        {QuickCard ? (
          <QuickCard />
        ) : (
          <>
            {(!test.meta || test.meta.length === 0) && <Section label="Setup" items={test.setup ?? []} />}

            {Diagram && (
              <div className="rx-testcard-diagram">
                <Diagram />
              </div>
            )}

            {test.doSteps && test.doSteps.length > 0 && (
              <>
                <p className="rx-list-section-label" style={{ margin: '20px 4px 8px' }}>
                  How to
                </p>
                <ActionFlow steps={test.doSteps} />
              </>
            )}

            {test.keyAnchor && (
              <div className="rx-testcard-anchor">
                <p className="rx-testcard-anchor-line">{test.keyAnchor}</p>
                {test.keyAnchorCaption && <p className="rx-testcard-anchor-caption">{test.keyAnchorCaption}</p>}
              </div>
            )}

            {test.quickReminder && <p className="rx-testcard-reminder">{test.quickReminder}</p>}

            {test.patientSees && test.patientSees.length > 0 && (
              <div className="rx-list-section">
                <p className="rx-list-section-label">Patient sees</p>
                <ul>
                  {test.patientSees.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <Section label="What to note" items={test.whatToNote ?? []} />

            {test.interpret && test.interpret.length > 0 && (
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

            {test.quickInterpretReminder && <p className="rx-testcard-interpret-reminder">{test.quickInterpretReminder}</p>}

            <Section label="Neutralize / measure" items={test.neutralize ?? []} />
          </>
        )}

        {hasMoreSections && (
          <details className="rx-more-details">
            <summary>More / Interpretation</summary>
            {test.moreSections!.map((section) => (
              <div className="rx-more-section" key={section.heading}>
                <p className="rx-more-section-heading">{section.heading}</p>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
        )}

        {hasMoreDetails && (
          <details className="rx-more-details">
            <summary>More / Interpretation</summary>
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

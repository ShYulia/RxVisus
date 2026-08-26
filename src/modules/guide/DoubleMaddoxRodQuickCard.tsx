import ActionFlow from './ActionFlow';
import SightRow from './SightRow';
import TorsionAdjustDiagram from './TorsionAdjustDiagram';
import TorsionLinesDiagram from './TorsionLinesDiagram';

/**
 * Chair-side quick reference for Double Maddox Rod: same underlying optics as single Maddox
 * Rod (each rod dissociates its eye into a streak), but with both grooves vertical (horizontal
 * streaks) so the two streaks can be compared for tilt rather than displacement — the endpoint
 * is rotating each rod's axis until the patient reports the streaks parallel, then reading
 * excyclo/incyclotorsion directly off the trial-frame axis scale. Red-over-OD/white-over-OS and
 * the excyclo=temporal/incyclo=nasal reading rule are verified against AAO EyeWiki/Stanford
 * teaching material and Ento Key — see the domain note in clinicalTests.ts.
 */
const DoubleMaddoxRodQuickCard: React.FC = () => (
  <div className="rx-quickcard">
    <div className="rx-quickcard-setup">
      <p className="rx-quickcard-setup-row">
        <span className="rx-quickcard-swatch rx-quickcard-swatch-red" /> Red rod <span className="rx-quickcard-setup-arrow">&rarr;</span> <strong>OD</strong>
      </p>
      <p className="rx-quickcard-setup-row">
        <span className="rx-quickcard-swatch" style={{ background: '#ffffff', border: '1px solid var(--rx-border)' }} /> White/clear rod{' '}
        <span className="rx-quickcard-setup-arrow">&rarr;</span> <strong>OS</strong>
      </p>
      <p className="rx-quickcard-setup-row">Both rods&rsquo; grooves <strong>vertical</strong> (start axis 90° — streaks appear horizontal)</p>
      <p className="rx-quickcard-setup-row">Single muscle-light target, dim room</p>
    </div>

    <TorsionAdjustDiagram />

    <ActionFlow
      steps={[
        'Patient fixates the single light',
        'ASK: are the two streaks parallel to each other, or tilted?',
        "Rotate each rod's axis",
        'PATIENT REPORTS: streaks now parallel — stop',
        "RECORD each eye's rotation off the trial-frame axis scale (e.g. 3° excyclotorsion OD)",
      ]}
    />

    <div className="rx-finding-rows">
      <SightRow diagram={<TorsionLinesDiagram mode="parallel" />} meaning="No significant torsion" isEndpoint />
      <SightRow
        diagram={<TorsionLinesDiagram mode="tilted" />}
        meaning="Torsion present — rotate each rod's axis until parallel, then read off each eye's trial-frame axis scale"
      />
    </div>

    <p className="rx-testcard-reminder">
      Reading each eye: the 12 o&rsquo;clock mark rotated temporally (away from the nose) = excyclotorsion; rotated nasally = incyclotorsion.
    </p>
  </div>
);

export default DoubleMaddoxRodQuickCard;

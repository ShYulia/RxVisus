import ActionFlow from './ActionFlow';
import SightRow from './SightRow';
import TorsionLinesDiagram from './TorsionLinesDiagram';

/**
 * Chair-side quick reference for Double Maddox Rod: same underlying optics as single Maddox
 * Rod (each rod dissociates its eye into a streak), but with both grooves vertical (horizontal
 * streaks) so the two streaks can be compared for tilt rather than displacement — the endpoint
 * is rotating each rod's axis until the patient reports the streaks parallel, then reading
 * excyclo/incyclotorsion directly off the trial-frame axis scale.
 */
const DoubleMaddoxRodQuickCard: React.FC = () => (
  <div className="rx-quickcard">
    <div className="rx-quickcard-recognition">
      <TorsionLinesDiagram mode="tilted" size={80} />
      <p className="rx-quickcard-recognition-caption">Two horizontal streaks, one red, one white</p>
    </div>

    <div className="rx-quickcard-setup">
      <p className="rx-quickcard-setup-row">Both rods&rsquo; grooves <strong>vertical</strong> (streaks appear horizontal), one rod over each eye</p>
      <p className="rx-quickcard-setup-row">Single muscle-light target, dim room</p>
    </div>

    <ActionFlow
      steps={[
        'Patient fixates the single light',
        'PATIENT REPORTS: are the two streaks parallel or tilted?',
        "Rotate each rod's axis",
        'PATIENT REPORTS: streaks now parallel — stop',
      ]}
    />

    <div className="rx-finding-rows">
      <SightRow diagram={<TorsionLinesDiagram mode="parallel" />} meaning="No significant torsion" isEndpoint />
      <SightRow
        diagram={<TorsionLinesDiagram mode="tilted" />}
        meaning="Torsion present — rotate each rod's axis until parallel, then read excyclo/incyclotorsion directly off each eye's trial-frame axis scale"
      />
    </div>
  </div>
);

export default DoubleMaddoxRodQuickCard;

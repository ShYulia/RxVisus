import ActionFlow from './ActionFlow';
import SightRow from './SightRow';
import WorthDotDiagram from './WorthDotDiagram';

/**
 * Chair-side quick reference for Worth 4 Dot: recognize the target, confirm the red/green ->
 * eye assignment, then read each percept straight off its row. Red lens over OD sees only the
 * red + white(-as-red) lights; green lens over OS sees the two green + white(-as-green)
 * lights — the shared white/bottom light is what reveals fusion, suppression, or diplopia.
 * Direction conventions match Schober/Maddox Rod's red-OD/green-OS documentation.
 */
const Worth4DotQuickCard: React.FC = () => (
  <div className="rx-quickcard">
    <div className="rx-quickcard-recognition">
      <WorthDotDiagram mode="target" size={80} />
      <p className="rx-quickcard-recognition-caption">Red light on top, two green lights on the sides, white light on the bottom</p>
    </div>

    <div className="rx-quickcard-setup">
      <p className="rx-quickcard-setup-row">
        <span className="rx-quickcard-swatch rx-quickcard-swatch-red" /> Red lens <span className="rx-quickcard-setup-arrow">&rarr;</span> <strong>OD</strong>{' '}
        (right eye)
      </p>
      <p className="rx-quickcard-setup-row">
        <span className="rx-quickcard-swatch rx-quickcard-swatch-green" /> Green lens <span className="rx-quickcard-setup-arrow">&rarr;</span> <strong>OS</strong>{' '}
        (left eye)
      </p>
    </div>

    <ActionFlow steps={['Patient wears the red/green glasses', 'Patient views the 4-dot target', 'PATIENT REPORTS: how many dots, what colors, how arranged']} />

    <div className="rx-finding-rows">
      <SightRow diagram={<WorthDotDiagram mode="fusion" />} caption="4 dots (bottom pink/flickering)" meaning="Normal fusion" isEndpoint />
      <SightRow diagram={<WorthDotDiagram mode="suppression-od" />} caption="3 green dots only" meaning="Suppression of OD — the red-lens (right) eye" />
      <SightRow diagram={<WorthDotDiagram mode="suppression-os" />} caption="2 red dots only" meaning="Suppression of OS — the green-lens (left) eye" />
      <SightRow diagram={<WorthDotDiagram mode="diplopia" />} caption="5 dots, or dots swap" meaning="Diplopia" />
    </div>
  </div>
);

export default Worth4DotQuickCard;

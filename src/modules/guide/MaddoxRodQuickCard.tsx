import { useState } from 'react';
import SegmentedControl from '../../components/SegmentedControl';
import ActionFlow from './ActionFlow';
import FindingRow from './FindingRow';
import LineLightDiagram from './LineLightDiagram';
import MaddoxRodIcon from './MaddoxRodIcon';

const AXIS_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
];

/**
 * Chair-side quick reference for Maddox Rod: recognize the instrument, confirm rod/light ->
 * eye assignment, then read PATIENT SEES -> MEANS -> NEUTRALIZE off the row for whichever
 * axis is relevant. Same underlying optics as the Schober quick card (the streak is the rod
 * eye's dissociated report, same as Schober's cross) — direction conventions derived from
 * first principles, not guessed — see the domain note in clinicalTests.ts.
 */
const MaddoxRodQuickCard: React.FC = () => {
  const [axis, setAxis] = useState<'horizontal' | 'vertical'>('horizontal');

  return (
    <div className="rx-quickcard">
      <div className="rx-quickcard-recognition">
        <MaddoxRodIcon size={72} />
        <p className="rx-quickcard-recognition-caption">Red lens, fine parallel ridges</p>
      </div>

      <div className="rx-quickcard-setup">
        <p className="rx-quickcard-setup-row">
          Rod <span className="rx-quickcard-setup-arrow">&rarr;</span> <strong>OD</strong> (sees the streak)
        </p>
        <p className="rx-quickcard-setup-row">
          Fixation light <span className="rx-quickcard-setup-arrow">&rarr;</span> <strong>OS</strong> (sees the light)
        </p>
      </div>

      <SegmentedControl options={AXIS_OPTIONS} value={axis} onChange={(v) => setAxis(v as 'horizontal' | 'vertical')} />
      <p className="rx-quickcard-axis-note">Grooves {axis === 'horizontal' ? 'horizontal → vertical line' : 'vertical → horizontal line'}</p>

      <ActionFlow
        steps={[
          'ASK: is the light on the line, or to one side?',
          'Add prism, base in the direction the streak is offset',
          'PATIENT REPORTS: line passes through the light — stop',
          'RECORD the prism amount and base direction (e.g. 6Δ BO)',
        ]}
      />

      <div className="rx-finding-rows">
        <FindingRow diagram={<LineLightDiagram axis={axis} finding="through" />} meaning="Through the light" neutralize="Endpoint" isEndpoint />
        {axis === 'horizontal' ? (
          <>
            <FindingRow
              diagram={<LineLightDiagram axis="horizontal" finding="right" />}
              meaning={
                <>
                  Eso <span className="rx-quickcard-secondary">(uncrossed)</span>
                </>
              }
              neutralize="BO"
            />
            <FindingRow
              diagram={<LineLightDiagram axis="horizontal" finding="left" />}
              meaning={
                <>
                  Exo <span className="rx-quickcard-secondary">(crossed)</span>
                </>
              }
              neutralize="BI"
            />
          </>
        ) : (
          <>
            <FindingRow diagram={<LineLightDiagram axis="vertical" finding="below" />} meaning="OD hyper" neutralize="BD OD (or BU OS)" />
            <FindingRow diagram={<LineLightDiagram axis="vertical" finding="above" />} meaning="OD hypo" neutralize="BU OD (or BD OS)" />
          </>
        )}
      </div>
    </div>
  );
};

export default MaddoxRodQuickCard;

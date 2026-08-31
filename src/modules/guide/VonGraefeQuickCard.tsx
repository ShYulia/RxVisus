import { useState } from 'react';
import SegmentedControl from '../../components/SegmentedControl';
import ActionFlow from './ActionFlow';
import FindingRow from './FindingRow';
import VonGraefeBlocksDiagram from './VonGraefeBlocksDiagram';

const AXIS_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
];

/**
 * Chair-side quick reference for the Von Graefe technique: recognize the base prism setting,
 * confirm which Risley prism is measuring vs dissociating for the selected axis (the two swap
 * roles between horizontal and vertical — this is the one thing that trips people up), then
 * read PATIENT SEES -> MEANS -> NEUTRALIZE off the row. Same underlying phoria as the Maddox
 * Rod/Schober quick cards, just dissociated with prisms instead of a colored streak or
 * red/green filters — direction conventions cross-checked against Maddox Rod's own verified
 * OD-hyper -> BD OD / BU OS rule (see the domain note in clinicalTests.ts), not guessed fresh.
 */
const VonGraefeQuickCard: React.FC = () => {
  const [axis, setAxis] = useState<'horizontal' | 'vertical'>('horizontal');

  return (
    <div className="rx-quickcard">
      <div className="rx-quickcard-recognition">
        <VonGraefeBlocksDiagram axis={axis} finding="through" size={72} />
        <p className="rx-quickcard-recognition-caption">{axis === 'horizontal' ? 'Two letter blocks, stacked' : 'Two letter blocks, side by side'}</p>
      </div>

      <div className="rx-quickcard-setup">
        <p className="rx-quickcard-setup-row">
          12&Delta; BI <span className="rx-quickcard-setup-arrow">&rarr;</span> <strong>OD</strong> (base setting)
        </p>
        <p className="rx-quickcard-setup-row">
          6&Delta; BU <span className="rx-quickcard-setup-arrow">&rarr;</span> <strong>OS</strong> (base setting)
        </p>
      </div>

      <SegmentedControl options={AXIS_OPTIONS} value={axis} onChange={(v) => setAxis(v as 'horizontal' | 'vertical')} />
      <p className="rx-quickcard-axis-note">
        {axis === 'horizontal' ? 'Vary the OD prism — OS prism stays fixed as the dissociator' : 'Vary the OS prism — OD prism stays fixed as the dissociator'}
      </p>

      <ActionFlow
        steps={
          axis === 'horizontal'
            ? [
                'ASK the patient to keep the target clear',
                'Reduce the OD prism smoothly from 12Δ BI',
                'PATIENT REPORTS: the blocks line up directly one under the other — stop',
                'Pass the endpoint, return from the other side, and average the two readings',
                'RECORD the OD prism amount and base direction (e.g. 8Δ BI)',
              ]
            : [
                'ASK the patient to keep the target clear',
                'Rotate the OS prism away from its 6Δ BU start',
                'PATIENT REPORTS: the blocks are side by side and level — stop',
                'RECORD the OS prism amount and base direction (e.g. 4Δ BU)',
              ]
        }
      />

      <div className="rx-finding-rows">
        <FindingRow diagram={<VonGraefeBlocksDiagram axis={axis} finding="through" />} meaning="Aligned" neutralize="Endpoint" isEndpoint />
        {axis === 'horizontal' ? (
          <>
            <FindingRow
              diagram={<VonGraefeBlocksDiagram axis="horizontal" finding="right" />}
              meaning={
                <>
                  Eso <span className="rx-quickcard-secondary">(uncrossed)</span>
                </>
              }
              neutralize="BO OD"
            />
            <FindingRow
              diagram={<VonGraefeBlocksDiagram axis="horizontal" finding="left" />}
              meaning={
                <>
                  Exo <span className="rx-quickcard-secondary">(crossed)</span>
                </>
              }
              neutralize="BI OD"
            />
          </>
        ) : (
          <>
            <FindingRow diagram={<VonGraefeBlocksDiagram axis="vertical" finding="below" />} meaning="OD hyper" neutralize="BU OS (or BD OD)" />
            <FindingRow diagram={<VonGraefeBlocksDiagram axis="vertical" finding="above" />} meaning="OD hypo" neutralize="BD OS (or BU OD)" />
          </>
        )}
      </div>
    </div>
  );
};

export default VonGraefeQuickCard;

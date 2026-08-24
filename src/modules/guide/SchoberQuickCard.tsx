import { useState } from 'react';
import SegmentedControl from '../../components/SegmentedControl';
import ActionFlow from './ActionFlow';
import CrossCircleDiagram from './CrossCircleDiagram';
import FindingRow from './FindingRow';

const AXIS_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
];

/**
 * Chair-side quick reference for the Schober test: recognize the target, confirm the
 * red/green -> eye assignment, then read PATIENT SEES -> MEANS -> NEUTRALIZE straight off
 * the row for whichever axis is relevant. Direction conventions (crossed/uncrossed,
 * Eso -> BO, Exo -> BI, hyper eye's own image displaced down -> BD over that eye) are
 * derived from first principles, not guessed — see the domain note in clinicalTests.ts.
 */
const SchoberQuickCard: React.FC = () => {
  const [axis, setAxis] = useState<'horizontal' | 'vertical'>('horizontal');

  return (
    <div className="rx-quickcard">
      <div className="rx-quickcard-recognition">
        <CrossCircleDiagram position="center" size={72} />
        <p className="rx-quickcard-recognition-caption">Red cross in green circles</p>
      </div>

      <div className="rx-quickcard-setup">
        <p className="rx-quickcard-setup-row">
          <span className="rx-quickcard-swatch rx-quickcard-swatch-red" /> Red filter <span className="rx-quickcard-setup-arrow">&rarr;</span>{' '}
          <strong>OD</strong> sees the cross
        </p>
        <p className="rx-quickcard-setup-row">
          <span className="rx-quickcard-swatch rx-quickcard-swatch-green" /> Green filter <span className="rx-quickcard-setup-arrow">&rarr;</span>{' '}
          <strong>OS</strong> sees the circles
        </p>
      </div>

      <ActionFlow steps={['Add prism toward the side the cross needs to move', 'PATIENT REPORTS: cross centered — stop, read the amount off the bar/lens']} />

      <FindingRow
        diagram={<CrossCircleDiagram position="center" />}
        meaning="Centered"
        neutralize="Endpoint"
        isEndpoint
      />

      <SegmentedControl options={AXIS_OPTIONS} value={axis} onChange={(v) => setAxis(v as 'horizontal' | 'vertical')} />

      <div className="rx-finding-rows">
        {axis === 'horizontal' ? (
          <>
            <FindingRow
              diagram={<CrossCircleDiagram position="right" />}
              meaning={
                <>
                  Eso <span className="rx-quickcard-secondary">(uncrossed)</span>
                </>
              }
              neutralize="BO"
            />
            <FindingRow
              diagram={<CrossCircleDiagram position="left" />}
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
            <FindingRow diagram={<CrossCircleDiagram position="down" />} meaning="OD hyper" neutralize="BD OD (or BU OS)" />
            <FindingRow diagram={<CrossCircleDiagram position="up" />} meaning="OD hypo" neutralize="BU OD (or BD OS)" />
          </>
        )}
      </div>
    </div>
  );
};

export default SchoberQuickCard;

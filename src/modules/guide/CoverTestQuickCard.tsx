import { useState } from 'react';
import SegmentedControl from '../../components/SegmentedControl';
import ActionFlow from './ActionFlow';
import CoverOccluderDiagram from './CoverOccluderDiagram';
import EyeMovementIcon from './EyeMovementIcon';
import FindingRow from './FindingRow';
import SightRow from './SightRow';

const MODE_OPTIONS = [
  { value: 'unilateral', label: 'Cover–Uncover' },
  { value: 'alternate', label: 'Alternate Cover' },
];

/**
 * Chair-side quick reference for Cover Test — the two techniques answer different questions,
 * so they're kept as clearly separate modes rather than one merged step list:
 * Cover-Uncover only ever dissociates one eye at a time (fusion is never fully broken), so it
 * detects a MANIFEST deviation (tropia) without measuring the latent component. Alternate Cover
 * keeps at least one eye covered throughout, breaking fusion entirely, so it reveals/measures
 * the TOTAL deviation (tropia + phoria) via prism neutralization — the basis of the Prism
 * Alternate Cover Test. Equipment/meta (distance-then-near, room lighting) is rendered above
 * this by TestCard from clinicalTests.ts; both modes are performed at distance, then near.
 */
const CoverTestQuickCard: React.FC = () => {
  const [mode, setMode] = useState<'unilateral' | 'alternate'>('unilateral');

  return (
    <div className="rx-quickcard">
      <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={(v) => setMode(v as 'unilateral' | 'alternate')} />

      {mode === 'unilateral' ? (
        <>
          <p className="rx-quickcard-axis-note" style={{ textAlign: 'center', margin: '10px 0 14px' }}>
            Detects a <strong>manifest</strong> deviation (tropia) — one eye covered at a time, fusion never fully broken.
          </p>

          <div className="rx-quickcard-recognition">
            <CoverOccluderDiagram mode="unilateral" coveredEye="OD" size={180} />
            <p className="rx-quickcard-recognition-caption">Cover OD, watch OS — then repeat covering OS, watching OD</p>
          </div>

          <ActionFlow
            steps={[
              'Cover one eye',
              'WATCH the other, uncovered eye for a refixation movement',
              'Uncover',
              'WATCH the just-uncovered eye for a recovery movement',
              'RECORD which eye moved and which direction, then repeat covering the other eye',
            ]}
          />

          <div className="rx-finding-rows">
            <SightRow diagram={<EyeMovementIcon moved={false} />} meaning="No movement — no manifest tropia" isEndpoint />
            <SightRow
              diagram={<EyeMovementIcon moved />}
              meaning="Refixation movement of the uncovered eye → manifest tropia in that eye"
            />
            <SightRow
              diagram={<EyeMovementIcon moved />}
              meaning="Recovery movement of the just-uncovered eye → phoria in that eye"
            />
          </div>
        </>
      ) : (
        <>
          <p className="rx-quickcard-axis-note" style={{ textAlign: 'center', margin: '10px 0 14px' }}>
            Dissociates fusion completely — reveals/measures the <strong>total</strong> deviation (tropia + phoria).
          </p>

          <div className="rx-quickcard-recognition">
            <CoverOccluderDiagram mode="alternate" size={180} />
            <p className="rx-quickcard-recognition-caption">Occluder swings eye to eye — neither eye is ever left uncovered together</p>
          </div>

          <ActionFlow
            steps={[
              'Alternate the cover rapidly, eye to eye — never leave both eyes uncovered together',
              'WATCH each eye as it is uncovered, for any refixation movement',
              'Neutralize the refixation movement with prism — increase until no movement is seen on alternation',
              'RECORD the prism amount at that endpoint — the total deviation',
            ]}
          />

          <div className="rx-finding-rows">
            <FindingRow diagram={<EyeMovementIcon moved={false} />} meaning="No refixation movement on alternation" neutralize="Endpoint" isEndpoint />
            <FindingRow diagram={<EyeMovementIcon moved />} meaning="Eye moves OUT (temporal)" neutralize="BO" />
            <FindingRow diagram={<EyeMovementIcon moved />} meaning="Eye moves IN (nasal)" neutralize="BI" />
          </div>
        </>
      )}

      <p className="rx-testcard-reminder">Same finding in every gaze position is comitant; a finding that differs by gaze position is incomitant.</p>
    </div>
  );
};

export default CoverTestQuickCard;

import { useState } from 'react';
import CautionBox from '../../components/CautionBox';
import SegmentedControl from '../../components/SegmentedControl';
import { localizeParks3Step, PARKS_3_STEP_LIMITATION, type Side } from '../../domain/reference/parksThreeStep';

const EYE_OPTIONS = [
  { value: 'right', label: 'OD (right)' },
  { value: 'left', label: 'OS (left)' },
];
const GAZE_OPTIONS = [
  { value: 'right', label: 'Right gaze' },
  { value: 'left', label: 'Left gaze' },
];
const TILT_OPTIONS = [
  { value: 'right', label: 'Right tilt' },
  { value: 'left', label: 'Left tilt' },
];

/**
 * Interactive Parks-Bielschowsky 3-step decision tree: answer each step in turn and the
 * localized muscle is shown immediately, instead of requiring the clinician to hold the
 * 8-row table in memory or look it up elsewhere. Each step only appears once the previous
 * one is answered, so the card still reads top-to-bottom as the reference itself (the
 * algorithm), not just an input form — see localizeParks3Step for the underlying table and
 * its verification status.
 */
const Parks3StepSelector: React.FC = () => {
  const [hyperEye, setHyperEye] = useState<Side | null>(null);
  const [worseGaze, setWorseGaze] = useState<Side | null>(null);
  const [worseTilt, setWorseTilt] = useState<Side | null>(null);

  const result = hyperEye && worseGaze && worseTilt ? localizeParks3Step({ hyperEye, worseGaze, worseTilt }) : null;

  const reset = () => {
    setHyperEye(null);
    setWorseGaze(null);
    setWorseTilt(null);
  };

  return (
    <div className="rx-quickcard">
      <div className="rx-parks-step">
        <p className="rx-list-section-label" style={{ margin: '0 0 8px' }}>
          Step 1 — Which eye is hypertropic in primary gaze?
        </p>
        <SegmentedControl options={EYE_OPTIONS} value={hyperEye ?? ''} onChange={(v) => setHyperEye(v as Side)} />
      </div>

      {hyperEye && (
        <div className="rx-parks-step">
          <p className="rx-list-section-label" style={{ margin: '0 0 8px' }}>
            Step 2 — Worse in right gaze or left gaze?
          </p>
          <SegmentedControl options={GAZE_OPTIONS} value={worseGaze ?? ''} onChange={(v) => setWorseGaze(v as Side)} />
        </div>
      )}

      {hyperEye && worseGaze && (
        <div className="rx-parks-step">
          <p className="rx-list-section-label" style={{ margin: '0 0 8px' }}>
            Step 3 — Worse on right head tilt or left head tilt? (Bielschowsky)
          </p>
          <SegmentedControl options={TILT_OPTIONS} value={worseTilt ?? ''} onChange={(v) => setWorseTilt(v as Side)} />
        </div>
      )}

      {result && (
        <div className="rx-testcard-anchor" style={{ marginTop: 20 }}>
          <p className="rx-testcard-anchor-line">{result}</p>
          <p className="rx-testcard-anchor-caption">Localized paretic muscle</p>
          <button type="button" className="rx-parks-reset" onClick={reset}>
            Start over
          </button>
        </div>
      )}

      <CautionBox className="rx-parks-caution">{PARKS_3_STEP_LIMITATION}</CautionBox>
    </div>
  );
};

export default Parks3StepSelector;

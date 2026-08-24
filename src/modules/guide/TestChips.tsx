import Chip from '../../components/Chip';
import { getClinicalTest } from '../../domain/reference/clinicalTests';

/** Reference chips linking out to canonical Test Cards — reused by both the wizard's question/result steps and TextEntryForm's data-entry steps. */
const TestChips: React.FC<{ testIds?: string[]; state: Record<string, unknown>; label?: string }> = ({ testIds, state, label }) => {
  if (!testIds || testIds.length === 0) return null;
  return (
    <div className="rx-wizard-testchips-block">
      {label && <p className="rx-wizard-testchips-label">{label}</p>}
      <div className="rx-chip-row">
        {testIds.map((testId) => {
          const test = getClinicalTest(testId);
          return test ? <Chip key={testId} label={test.title} routerLink={`/guide/tests/${testId}`} state={state} /> : null;
        })}
      </div>
    </div>
  );
};

export default TestChips;

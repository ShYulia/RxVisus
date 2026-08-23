export interface FindingRowProps {
  diagram: React.ReactNode;
  meaning: React.ReactNode;
  neutralize: React.ReactNode;
  /** The centered/through-the-light row — styled as the endpoint rather than another finding. */
  isEndpoint?: boolean;
}

/**
 * One scannable row: PATIENT SEES -> MEANS -> NEUTRALIZE WITH. The reusable building block for
 * any future Test Card that needs this visual-first, point-of-care layout (not just Schober/Maddox).
 */
const FindingRow: React.FC<FindingRowProps> = ({ diagram, meaning, neutralize, isEndpoint }) => (
  <div className="rx-finding-row">
    <div className="rx-finding-row-diagram">{diagram}</div>
    <span className="rx-finding-row-arrow">&rarr;</span>
    <div className="rx-finding-row-meaning">{meaning}</div>
    <span className="rx-finding-row-arrow">&rarr;</span>
    <div className={`rx-finding-row-neutralize ${isEndpoint ? 'rx-finding-row-neutralize-endpoint' : ''}`}>{neutralize}</div>
  </div>
);

export default FindingRow;

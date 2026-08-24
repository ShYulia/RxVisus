export interface SightRowProps {
  diagram: React.ReactNode;
  /** Short label under the diagram, e.g. "4 dots" — what the patient reports, before interpretation. */
  caption?: React.ReactNode;
  meaning: React.ReactNode;
  /** The normal/endpoint row — styled distinctly rather than as another finding. */
  isEndpoint?: boolean;
}

/**
 * Two-column scannable row: what the patient reports -> what it means. The FindingRow shape
 * (diagram -> meaning -> neutralize) doesn't fit sensory-status tests that have no prism
 * neutralization step (Worth 4 Dot, Double Maddox Rod's percept examples) — this is that
 * shape without the third column.
 */
const SightRow: React.FC<SightRowProps> = ({ diagram, caption, meaning, isEndpoint }) => (
  <div className="rx-finding-row rx-sight-row">
    <div className="rx-finding-row-diagram">
      {diagram}
      {caption && <p className="rx-sight-row-caption">{caption}</p>}
    </div>
    <span className="rx-finding-row-arrow">&rarr;</span>
    <div className={`rx-finding-row-meaning ${isEndpoint ? 'rx-finding-row-neutralize-endpoint' : ''}`}>{meaning}</div>
  </div>
);

export default SightRow;

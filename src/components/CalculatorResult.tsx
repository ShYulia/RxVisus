import CautionBox from './CautionBox';
import './CalculatorResult.css';

export interface CalculatorResultProps {
  primaryLabel: string;
  primaryValue: string;
  /** Small tertiary line directly under the primary value — e.g. clarifying what the value is measured relative to. */
  primaryCaption?: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  /** Calm clinical-caution message (never styled as an error). */
  caution?: string;
  /** Extra secondary content — e.g. an availability/stock-parameters panel. Stays visually subordinate to the primary value. */
  children?: React.ReactNode;
  /** Keeps primaryValue on one line (shrinking to fit) instead of wrapping — for a full Rx string where an orphaned "x 90" on its own line reads badly. */
  singleLine?: boolean;
  /** Compact control shown inline alongside primaryValue (e.g. a copy button) instead of a separate full-width action below. */
  valueAction?: React.ReactNode;
}

/**
 * The shared result treatment: a tinted zone (not another bordered card) with a
 * large bold primary value. Secondary values and cautions stay visually
 * subordinate — smaller type, below a hairline divider.
 */
const CalculatorResult: React.FC<CalculatorResultProps> = ({
  primaryLabel,
  primaryValue,
  primaryCaption,
  secondaryLabel,
  secondaryValue,
  caution,
  children,
  singleLine = false,
  valueAction,
}) => (
  <div className="rx-result">
    <div className="rx-result-label">{primaryLabel}</div>
    {valueAction ? (
      <div className="rx-result-value-row">
        <div className={`rx-result-value ${singleLine ? 'rx-result-value-singleline' : ''}`}>{primaryValue}</div>
        <div className="rx-result-value-action">{valueAction}</div>
      </div>
    ) : (
      <div className={`rx-result-value ${singleLine ? 'rx-result-value-singleline' : ''}`}>{primaryValue}</div>
    )}
    {primaryCaption && <p className="rx-result-panel-caption">{primaryCaption}</p>}

    {secondaryLabel && secondaryValue && (
      <div className="rx-result-secondary-row">
        <span className="rx-result-secondary-label">{secondaryLabel}</span>
        <span className="rx-result-secondary-value">{secondaryValue}</span>
      </div>
    )}

    {caution && (
      <CautionBox className="rx-result-caution">
        <p className="rx-caution-text">{caution}</p>
      </CautionBox>
    )}

    {children}
  </div>
);

export default CalculatorResult;

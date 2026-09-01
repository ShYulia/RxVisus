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
}) => (
  <div className="rx-result">
    <div className="rx-result-label">{primaryLabel}</div>
    <div className="rx-result-value">{primaryValue}</div>
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

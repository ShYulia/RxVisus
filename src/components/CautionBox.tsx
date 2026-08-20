import { InfoIcon } from './icons';
import './CautionBox.css';

export interface CautionBoxProps {
  /** One message, or several (e.g. multiple red flags). */
  children: React.ReactNode;
  className?: string;
}

/** Calm, non-alarming notice — used for both calculator clinical cautions and clinical-guide red flags. Never styled as an error. */
const CautionBox: React.FC<CautionBoxProps> = ({ children, className }) => (
  <div className={`rx-caution ${className ?? ''}`}>
    <InfoIcon size={16} className="rx-caution-icon" />
    <div>{children}</div>
  </div>
);

export default CautionBox;

import { Link } from 'react-router-dom';
import './Chip.css';

export interface ChipProps {
  label: string;
  routerLink: string;
  /** Location state carried to the destination — e.g. { from } so a Test Card's Back returns here. */
  state?: Record<string, unknown>;
}

/** Small pill link — used for "relevant tests" chips inside a clinical pathway. */
const Chip: React.FC<ChipProps> = ({ label, routerLink, state }) => (
  <Link className="rx-chip" to={{ pathname: routerLink, state }}>
    {label}
  </Link>
);

export default Chip;

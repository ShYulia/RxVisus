import { Link } from 'react-router-dom';
import './Chip.css';

export interface ChipProps {
  label: string;
  routerLink: string;
}

/** Small pill link — used for "relevant tests" chips inside a clinical pathway. */
const Chip: React.FC<ChipProps> = ({ label, routerLink }) => (
  <Link className="rx-chip" to={routerLink}>
    {label}
  </Link>
);

export default Chip;

import { Link } from 'react-router-dom';
import './FeatureCard.css';

export interface FeatureCardProps {
  illustration: string;
  title: string;
  desc: string;
  routerLink: string;
}

/** A compact illustrated destination card for Home — text-left / illustration-right. */
const FeatureCard: React.FC<FeatureCardProps> = ({ illustration, title, desc, routerLink }) => (
  <Link className="rx-feature-card" to={routerLink}>
    <div className="rx-feature-text">
      <h2 className="rx-feature-title">{title}</h2>
      <p className="rx-feature-desc">{desc}</p>
    </div>
    <div className="rx-feature-illustration-wrap">
      <img src={illustration} alt="" className="rx-feature-illustration" />
    </div>
  </Link>
);

export default FeatureCard;

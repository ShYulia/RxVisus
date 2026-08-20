import { Link } from 'react-router-dom';
import { ChevronRightIcon } from './icons';
import './PillarRow.css';

export interface PillarRowProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  comingSoon?: boolean;
  routerLink?: string;
}

/** Home's pillar entry — a doorway, not a dashboard widget. */
const PillarRow: React.FC<PillarRowProps> = ({ icon, title, desc, comingSoon, routerLink }) => {
  const inner = (
    <>
      <span className={`rx-pillar-icon ${comingSoon ? 'rx-pillar-icon-muted' : ''}`}>{icon}</span>
      <span className="rx-pillar-text">
        <span className="rx-pillar-title-row">
          <span className={`rx-pillar-title ${comingSoon ? 'rx-pillar-title-muted' : ''}`}>{title}</span>
          {comingSoon && <span className="rx-pillar-tag">Coming soon</span>}
        </span>
        <span className="rx-pillar-desc">{desc}</span>
      </span>
      {!comingSoon && <ChevronRightIcon size={16} className="rx-pillar-chevron" />}
    </>
  );

  if (comingSoon || !routerLink) {
    return <div className="rx-pillar rx-pillar-static">{inner}</div>;
  }

  return (
    <Link className="rx-pillar" to={routerLink}>
      {inner}
    </Link>
  );
};

export default PillarRow;

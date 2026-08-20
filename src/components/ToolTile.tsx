import { Link } from 'react-router-dom';
import './ToolTile.css';

export interface ToolTileProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  comingSoon?: boolean;
  routerLink?: string;
}

/** Home's doorway card — icon, title, one-line description. */
const ToolTile: React.FC<ToolTileProps> = ({ icon, title, desc, comingSoon, routerLink }) => {
  const content = (
    <>
      <span className={`rx-tile-icon ${comingSoon ? 'rx-tile-icon-muted' : ''}`}>{icon}</span>
      <span className="rx-tile-title">
        {title}
        {comingSoon && <span className="rx-tile-tag">Coming soon</span>}
      </span>
      <span className="rx-tile-desc">{desc}</span>
    </>
  );

  if (comingSoon || !routerLink) {
    return <div className={`rx-tile ${comingSoon ? 'rx-tile-muted' : ''}`}>{content}</div>;
  }

  return (
    <Link className="rx-tile" to={routerLink}>
      {content}
    </Link>
  );
};

export default ToolTile;

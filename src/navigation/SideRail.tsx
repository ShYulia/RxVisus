import { Link, useLocation } from 'react-router-dom';
import { HomeIcon } from '../components/icons';
import { topLevelModules } from './topLevelModules';
import { MODULE_ICONS } from './moduleVisuals';
import './SideRail.css';

/** Desktop-only left navigation rail — replaces the bottom tab bar above the desktop breakpoint. */
const SideRail: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { href: '/home', label: 'Home', Icon: HomeIcon },
    ...topLevelModules
      .filter((mod) => mod.showInNav)
      .map((mod) => ({ href: mod.route, label: mod.title, Icon: MODULE_ICONS[mod.icon] })),
  ];

  return (
    <nav className="rx-rail" aria-label="Primary">
      <div className="rx-rail-wordmark">
        Rx<span className="rx-rail-wordmark-dot">·</span>Visus
      </div>
      {navItems.map(({ href, label, Icon }) => {
        const active = location.pathname.startsWith(href);
        return (
          <Link key={href} to={href} className={`rx-rail-item ${active ? 'rx-rail-item-active' : ''}`}>
            <Icon size={20} />
            <span className="rx-rail-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default SideRail;

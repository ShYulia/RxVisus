import { CalculatorIcon, CompassIcon, type IconProps } from '../components/icons';

/** Small nav-weight icons, keyed by TopLevelModule.icon. */
export const MODULE_ICONS: Record<string, React.FC<IconProps>> = {
  calculator: CalculatorIcon,
  guide: CompassIcon,
};

/**
 * Larger Home-card visuals, keyed by TopLevelModule.illustration. Placeholder
 * mapping (reuses the nav icons) until the dedicated RxVisus hero
 * illustrations are designed — that's the deferred Home visual-redesign
 * follow-up, not part of this architecture change.
 */
export const MODULE_ILLUSTRATIONS: Record<string, React.FC<IconProps>> = {
  'calculators-hero': CalculatorIcon,
  'guide-hero': CompassIcon,
};

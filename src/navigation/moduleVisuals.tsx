import { CalculatorIcon, CompassIcon, type IconProps } from '../components/icons';
import calculatorsIllustration from '../assets/illustrations/calculators.png';
import clinicalGuideIllustration from '../assets/illustrations/clinical-guide.png';

/** Small nav-weight icons, keyed by TopLevelModule.icon. */
export const MODULE_ICONS: Record<string, React.FC<IconProps>> = {
  calculator: CalculatorIcon,
  guide: CompassIcon,
};

/** Larger Home feature-card illustrations, keyed by TopLevelModule.illustration. */
export const MODULE_ILLUSTRATIONS: Record<string, string> = {
  'calculators-hero': calculatorsIllustration,
  'guide-hero': clinicalGuideIllustration,
};

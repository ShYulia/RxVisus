/**
 * The single source of truth for RxKit's top-level product areas — drives
 * both Home's cards and the tab bar (see moduleVisuals.tsx for the
 * icon/illustration key -> component resolver, kept separate from this data).
 *
 * Adding a future module (e.g. Contact Lenses) is one entry here — it won't
 * appear in Home or navigation until it does. Don't hand-write it ahead of
 * the module actually existing.
 */
export interface TopLevelModule {
  id: string;
  title: string;
  description: string;
  route: string;
  /** Key into moduleVisuals' icon resolver — small, used in nav. */
  icon: string;
  /** Key into moduleVisuals' illustration resolver — larger, used on Home. */
  illustration: string;
  showInNav: boolean;
}

export const topLevelModules: TopLevelModule[] = [
  {
    id: 'calculators',
    title: 'Calculators',
    description: 'Optical calculations and conversions',
    route: '/calculate',
    icon: 'calculator',
    illustration: 'calculators-hero',
    showInNav: true,
  },
  {
    id: 'guide',
    title: 'Clinical Guide',
    description: 'Testing pathways and quick clinical recall',
    route: '/guide',
    icon: 'guide',
    illustration: 'guide-hero',
    showInNav: true,
  },
];

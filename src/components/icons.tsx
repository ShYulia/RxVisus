/**
 * RxVisus icon set — stroke-based, 20px grid, currentColor. Kept small and
 * restrained rather than using oversized decorative icon packs.
 */
export interface IconProps {
  size?: number;
  className?: string;
  /** Ionic slot name, e.g. "end" — needed when overriding a component's default slotted icon. */
  slot?: string;
}

interface IconBaseProps extends IconProps {
  viewBox: string;
  children: React.ReactNode;
}

// `slot` is a real DOM attribute (used for light-DOM slotting into Ionic's web
// components) but isn't part of React's SVGProps typings — cast once here
// rather than at every icon.
const IconBase: React.FC<IconBaseProps> = ({ size = 20, className, slot, viewBox, children }) => {
  const svgProps = {
    width: size,
    height: size,
    viewBox,
    fill: 'none',
    stroke: 'currentColor',
    className,
    slot,
  } as unknown as React.SVGProps<SVGSVGElement>;
  return <svg {...svgProps}>{children}</svg>;
};

export const HomeIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} viewBox="0 0 20 20">
    <path d="M3 9.5L10 3l7 6.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M5 8.5V16.5a1 1 0 0 0 1 1h3v-5h2v5h3a1 1 0 0 0 1-1V8.5"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const CalculatorIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} viewBox="0 0 20 20">
    <rect x="4" y="2.5" width="12" height="15" rx="2" strokeWidth="1.6" />
    <line x1="6.5" y1="6" x2="13.5" y2="6" strokeWidth="1.6" strokeLinecap="round" />
    {[6.8, 10, 13.2].flatMap((cx) =>
      [10, 13.2].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" fill="currentColor" />),
    )}
  </IconBase>
);

export const CompassIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="7.2" strokeWidth="1.6" />
    <path d="M12.6 7.4L11 11l-3.6 1.6L9 9l3.6-1.6z" strokeWidth="1.4" strokeLinejoin="round" />
  </IconBase>
);

export const BookIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} viewBox="0 0 20 20">
    <path
      d="M10 5.2c-1.1-.9-2.7-1.4-4.6-1.4-.6 0-1.1.05-1.6.14V14.8c.5-.1 1-.14 1.6-.14 1.9 0 3.5.5 4.6 1.4m0-10.86c1.1-.9 2.7-1.4 4.6-1.4.6 0 1.1.05 1.6.14V14.8c-.5-.1-1-.14-1.6-.14-1.9 0-3.5.5-4.6 1.4m0-10.86V15.66"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} size={props.size ?? 16} viewBox="0 0 16 16">
    <path d="M6 3.5L11 8l-5 4.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} size={props.size ?? 16} viewBox="0 0 16 16">
    <path d="M3.5 6L8 10.5 12.5 6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

export const InfoIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} size={props.size ?? 16} viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6.4" strokeWidth="1.4" />
    <line x1="8" y1="7.2" x2="8" y2="11" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="5.1" r="0.9" fill="currentColor" />
  </IconBase>
);

export const SwapArrowsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} viewBox="0 0 20 20">
    <path d="M4 6.5h11.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.5 3.5l3 3-3 3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 13.5H4.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 10.5l-3 3 3 3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

export const GlassesIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} viewBox="0 0 20 20">
    <circle cx="5.6" cy="12" r="3.1" strokeWidth="1.5" />
    <circle cx="14.4" cy="12" r="3.1" strokeWidth="1.5" />
    <path d="M8.7 11.2c.5-1.2 1.4-1.9 1.3-1.9s.8.7 1.3 1.9" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2.5 11.5L4 8.8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17.5 11.5L16 8.8" strokeWidth="1.5" strokeLinecap="round" />
  </IconBase>
);

export const TriangleIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} viewBox="0 0 20 20">
    <path d="M10 3.5L17 15.5H3L10 3.5Z" strokeWidth="1.6" strokeLinejoin="round" />
  </IconBase>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} viewBox="0 0 20 20">
    <circle cx="9" cy="9" r="6" strokeWidth="1.6" />
    <path d="M17 17l-4-4" strokeWidth="1.6" strokeLinecap="round" />
  </IconBase>
);

export const UserIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props} viewBox="0 0 20 20">
    <circle cx="10" cy="7" r="3.2" strokeWidth="1.6" />
    <path d="M3.8 16.5c1-2.9 3.6-4.5 6.2-4.5s5.2 1.6 6.2 4.5" strokeWidth="1.6" strokeLinecap="round" />
  </IconBase>
);

/** RxVisus brand mark — a simple line-art eye, used sparingly as a decorative accent. Wider than tall (5:3). */
export const EyeMarkIcon: React.FC<IconProps> = ({ size = 40, className, slot }) => {
  const svgProps = {
    width: size,
    height: (size * 24) / 40,
    viewBox: '0 0 40 24',
    fill: 'none',
    stroke: 'currentColor',
    className,
    slot,
  } as unknown as React.SVGProps<SVGSVGElement>;
  return (
    <svg {...svgProps}>
      <path
        d="M2 12C6.5 5 13 2 20 2s13.5 3 18 10c-4.5 7-11 10-18 10S6.5 19 2 12Z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="12" r="6" strokeWidth="1.6" />
      <circle cx="20" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
};

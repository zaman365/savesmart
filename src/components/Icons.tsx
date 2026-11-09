import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function BrandMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <path d="M4 9.5 11.5 3h16A1.5 1.5 0 0 1 29 4.5v23a1.5 1.5 0 0 1-1.5 1.5h-16L4 22.5Z" fill="#ffc52e" stroke="#1b2550" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="10" cy="16" r="2" fill="#fff" stroke="#1b2550" strokeWidth="1.4" />
      <text x="20.5" y="22" textAnchor="middle" fontSize="17" fontWeight="750" fill="#1b2550" fontFamily="'Anek Bangla Variable', 'Noto Sans Bengali', sans-serif">৳</text>
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 11 12 4l9 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </Base>
  );
}

export function CompareIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h11M4 12h16M4 17h8" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="15" cy="17" r="2" />
    </Base>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.2 2.2-5 3.6-7.3.6 1.4 1.2 2.2 2.2 2.8C11.6 7.6 12.6 5 14.5 3c.4 3 4 5.6 4 11.4C18.5 18.4 15.9 21 12 21Z" />
    </Base>
  );
}

export function SnowIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      <path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" />
    </Base>
  );
}

export function SignalIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 19v-3M10 19v-6M15 19v-9M20 19V6" />
    </Base>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </Base>
  );
}

export function TickIcon(props: IconProps) {
  return (
    <Base strokeWidth={2.4} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Base>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="7" y="2.8" width="10" height="18.4" rx="2" />
      <path d="M11 18h2" />
    </Base>
  );
}

export function LaptopIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="5" width="14" height="10" rx="1.2" />
      <path d="M3 19h18l-1.5-4h-15Z" />
    </Base>
  );
}

export function TvIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="12" rx="1.2" />
      <path d="M9 21h6M12 17v4" />
    </Base>
  );
}

export function AcIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="8" rx="1.5" />
      <path d="M6 10.5h12M8 16.5c0 1.5-1 2.5-1 2.5M12 16.5V20M16 16.5c0 1.5 1 2.5 1 2.5" />
    </Base>
  );
}

export function FridgeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6" y="2.8" width="12" height="18.4" rx="1.5" />
      <path d="M6 10h12M9 6v2M9 13v3" />
    </Base>
  );
}

export function HeadphonesIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3.5" y="14" width="4" height="6" rx="1.2" />
      <rect x="16.5" y="14" width="4" height="6" rx="1.2" />
    </Base>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12V4h8l10 10-8 8Z" />
      <circle cx="7.5" cy="8.5" r="1.3" />
    </Base>
  );
}

export const categoryIcons: Record<string, (p: IconProps) => React.JSX.Element> = {
  phones: PhoneIcon,
  laptops: LaptopIcon,
  tvs: TvIcon,
  acs: AcIcon,
  fridges: FridgeIcon,
  audio: HeadphonesIcon,
};

export function CategoryIcon({ category, ...props }: IconProps & { category: string }) {
  const Icon = categoryIcons[category] ?? TagIcon;
  return <Icon {...props} />;
}

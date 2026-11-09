'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CompareIcon, FlameIcon, HomeIcon, SignalIcon, UserIcon } from './Icons';

export function LangSwitch({ lang, label, ariaLabel }: { lang: 'bn' | 'en'; label: string; ariaLabel: string }) {
  const pathname = usePathname() || `/${lang}`;
  const other = lang === 'bn' ? 'en' : 'bn';
  const href = pathname.replace(/^\/(bn|en)(?=\/|$)/, `/${other}`);
  return (
    <Link href={href} className="lang-switch" hrefLang={other} lang={other} aria-label={ariaLabel}>
      {label}
    </Link>
  );
}

export function BottomNav({
  lang,
  labels,
}: {
  lang: 'bn' | 'en';
  labels: { home: string; compare: string; deals: string; packs: string; account: string };
}) {
  const pathname = usePathname() || '';
  const items = [
    { href: `/${lang}`, label: labels.home, Icon: HomeIcon, match: (p: string) => p === `/${lang}` },
    { href: `/${lang}/c`, label: labels.compare, Icon: CompareIcon, match: (p: string) => /\/(c|p)(\/|$)/.test(p.slice(3)) },
    { href: `/${lang}/deals`, label: labels.deals, Icon: FlameIcon, match: (p: string) => p.startsWith(`/${lang}/deals`) },
    { href: `/${lang}/packs`, label: labels.packs, Icon: SignalIcon, match: (p: string) => p.startsWith(`/${lang}/packs`) },
    { href: `/${lang}/account`, label: labels.account, Icon: UserIcon, match: (p: string) => p.startsWith(`/${lang}/account`) },
  ];
  return (
    <nav className="bottom-nav" aria-label="Main">
      {items.map(({ href, label, Icon, match }) => (
        <Link key={href} href={href} aria-current={match(pathname) ? 'page' : undefined}>
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  );
}

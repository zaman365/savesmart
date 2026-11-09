import Link from 'next/link';
import type { Lang } from '@/lib/format';
import type { Translate } from '@/lib/i18n';
import type { User } from '@/lib/repo/users';
import { BrandMark } from './Icons';
import { BottomNav, LangSwitch } from './Nav';

export function DemoBanner({ lang, t }: { lang: Lang; t: Translate }) {
  return (
    <div className="demo-banner" role="note">
      <div className="page">
        <span>{t('demoBanner')}</span>
        <Link href={`/${lang}/about/data`}>{t('demoMore')}</Link>
      </div>
    </div>
  );
}

export function Header({ lang, t, user, unread }: { lang: Lang; t: Translate; user: User | null; unread: number }) {
  return (
    <header className="site-header">
      <div className="page">
        <Link href={`/${lang}`} className="brand" aria-label="SaveSmart, home">
          <BrandMark className="brand-mark" />
          <span>SaveSmart</span>
        </Link>
        <form className="header-search" action={`/${lang}/search`} role="search">
          <label htmlFor="header-q" className="visually-hidden">
            {t('searchLabel')}
          </label>
          <input id="header-q" name="q" type="search" placeholder={t('searchPlaceholder')} autoComplete="off" />
          <button type="submit">{t('searchButton')}</button>
        </form>
        <nav className="header-nav" aria-label="Main">
          <Link className="nav-link" href={`/${lang}/c`}>
            {t('navCompare')}
          </Link>
          <Link className="nav-link" href={`/${lang}/deals`}>
            {t('navDeals')}
          </Link>
          <Link className="nav-link" href={`/${lang}/packs`}>
            {t('navPacks')}
          </Link>
          <Link className="nav-link" href={`/${lang}/offers`}>
            {t('navOffers')}
          </Link>
          {user?.role === 'admin' ? (
            <Link className="nav-link" href={`/${lang}/admin`}>
              {t('navAdmin')}
            </Link>
          ) : null}
          <Link className="nav-link" href={`/${lang}/account`}>
            {user ? user.name : t('signIn')}
            {unread > 0 ? <span className="unread">{unread}</span> : null}
          </Link>
          <LangSwitch lang={lang} label={t('langOther')} ariaLabel={t('langOtherLabel')} />
        </nav>
      </div>
    </header>
  );
}

export function Footer({ lang, t }: { lang: Lang; t: Translate }) {
  return (
    <footer className="site-footer">
      <div className="page">
        <Link href={`/${lang}/about/ranking`}>{t('howWeRank')}</Link>
        <Link href={`/${lang}/about/data`}>{t('dataSources')}</Link>
        <span className="muted">{t('footerNote')}</span>
        <span className="muted">© 2026 SaveSmart</span>
      </div>
    </footer>
  );
}

export function SiteBottomNav({ lang, t }: { lang: Lang; t: Translate }) {
  return (
    <BottomNav
      lang={lang}
      labels={{ home: t('navHome'), compare: t('navCompare'), deals: t('navDeals'), packs: t('navPacks'), account: t('navAccount') }}
    />
  );
}

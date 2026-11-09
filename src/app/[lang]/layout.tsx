import '@fontsource-variable/anek-bangla/standard.css';
import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { DemoBanner, Footer, Header, SiteBottomNav } from '@/components/Chrome';
import { getDb, isDemo } from '@/lib/db';
import { isLang } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { unreadCount } from '@/lib/repo/alerts';
import { getViewer } from '@/lib/session';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = translator(isLang(lang) ? lang : 'bn');
  return {
    title: { default: 'SaveSmart', template: '%s | SaveSmart' },
    description: t('brandLine'),
    alternates: { languages: { bn: '/bn', en: '/en' } },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1b2550',
};

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = translator(lang);
  const viewer = await getViewer();
  const unread = viewer.user ? unreadCount(getDb(), viewer.user.id) : 0;

  return (
    <html lang={lang}>
      <body>
        <a className="skip" href="#main">
          {t('skipToContent')}
        </a>
        {isDemo() ? <DemoBanner lang={lang} t={t} /> : null}
        <Header lang={lang} t={t} user={viewer.user} unread={unread} />
        <main id="main" className="page">
          {children}
        </main>
        <Footer lang={lang} t={t} />
        <SiteBottomNav lang={lang} t={t} />
      </body>
    </html>
  );
}

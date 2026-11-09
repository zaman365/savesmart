import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { daysBetween } from '@/lib/dates';
import { isLang, money, num, shortDate } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { isPaymentOfferActive } from '@/lib/pricing';
import { listCategories, listPaymentOffers } from '@/lib/repo/catalog';
import { getViewer } from '@/lib/session';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: translator(isLang(lang) ? lang : 'bn')('offersTitle') };
}

export default async function OffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = translator(lang);
  const query = await searchParams;
  const db = getDb();
  const viewer = await getViewer();
  const categories = new Map(listCategories(db).map((c) => [c.slug, lang === 'bn' ? c.nameBn : c.nameEn]));
  const all = listPaymentOffers(db, viewer.today).filter((o) => isPaymentOfferActive(o, viewer.today));
  const onlyMine = query.mine === '1' && viewer.methodIds.size > 0;
  const offers = onlyMine ? all.filter((o) => viewer.methodIds.has(o.methodId)) : all;

  return (
    <>
      <div className="page-head">
        <h1>{t('offersTitle')}</h1>
        <p className="lead">{t('offersLead')}</p>
      </div>
      {viewer.methodIds.size > 0 ? (
        <nav className="tabs" aria-label={t('offersTitle')}>
          <Link href={`/${lang}/offers`} aria-current={!onlyMine ? 'page' : undefined}>
            {t('showAllOffers')}
          </Link>
          <Link href={`/${lang}/offers?mine=1`} aria-current={onlyMine ? 'page' : undefined}>
            {t('onlyMine')}
          </Link>
        </nav>
      ) : (
        <p className="notice" style={{ marginBottom: 16 }}>
          <Link href={`/${lang}?prefs=1#prefs`}>{t('pricesForNone')}</Link>
        </p>
      )}
      {offers.length > 0 ? (
        <ul className="rows">
          {offers.map((o) => {
            const left = daysBetween(viewer.today, o.endsOn);
            return (
              <li key={o.id} className="offer-card">
                <div>
                  <div className="method-name">
                    {o.methodName}
                    {viewer.methodIds.has(o.methodId) ? <span className="tag" style={{ marginLeft: 8 }}>✓</span> : null}
                  </div>
                  <p>{lang === 'bn' ? o.titleBn : o.titleEn}</p>
                  <div className="meta">
                    <span>{o.shopName ?? t('allShops')}</span>
                    <span>{o.category ? categories.get(o.category) : t('anyCategory')}</span>
                    {o.minSpend > 0 ? <span>{t('minSpend', { amount: money(o.minSpend, lang) })}</span> : null}
                    {o.cap != null ? <span>{t('upTo', { amount: money(o.cap, lang) })}</span> : null}
                    <span>{t(o.kind === 'cashback' ? 'cashback' : 'discount')}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="price-strong">{o.percent > 0 ? `${num(o.percent, lang)}%` : money(o.flat, lang)}</div>
                  <div className={left <= 3 ? 'small' : 'small muted'} style={left <= 3 ? { color: 'var(--hot)' } : undefined}>
                    {left === 0 ? t('endsToday') : left <= 7 ? t('endsInDays', { n: num(left, lang) }) : t('until', { date: shortDate(o.endsOn, lang) })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="notice">
          {t('noOffersForYou')} <Link href={`/${lang}/offers`}>{t('showAllOffers')}</Link>
        </p>
      )}
    </>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Notice, PreferencesForm, ProductRow } from '@/components/Commerce';
import { DealRow } from '@/components/Community';
import { CategoryIcon } from '@/components/Icons';
import { getDb } from '@/lib/db';
import { isPaymentOfferActive } from '@/lib/pricing';
import { isLang, num } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { listCategories, listPaymentMethods, listPaymentOffers, listProducts } from '@/lib/repo/catalog';
import { listDeals, userVote } from '@/lib/repo/deals';
import { getViewer } from '@/lib/session';

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const query = await searchParams;
  const t = translator(lang);
  const db = getDb();
  const viewer = await getViewer();
  const ctx = { methodIds: viewer.methodIds, location: viewer.location, today: viewer.today };

  const methods = listPaymentMethods(db);
  const mine = methods.filter((m) => viewer.methodIds.has(m.id));
  const payOffers = listPaymentOffers(db, viewer.today);
  const activeOffers = payOffers.filter((o) => isPaymentOfferActive(o, viewer.today));
  const deals = listDeals(db, { tab: 'hot', limit: 5, today: viewer.today });
  const drops = listProducts(db, { sort: 'drop' }, payOffers, ctx)
    .filter((c) => c.drop30)
    .slice(0, 5);
  const categories = listCategories(db).filter((c) => c.productCount > 0);
  const openPrefs = query.prefs === '1';

  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">{t('homeHeading')}</h1>
        <p className="lead">{t('homeLead')}</p>
        <form className="hero-search" action={`/${lang}/search`} role="search">
          <label htmlFor="hero-q" className="visually-hidden">
            {t('searchLabel')}
          </label>
          <input id="hero-q" name="q" type="search" placeholder={t('searchPlaceholder')} autoComplete="off" />
          <button type="submit">{t('searchButton')}</button>
        </form>

        <div id="prefs">
          {query.saved ? (
            <div style={{ marginTop: 16, maxWidth: 720 }}>
              <Notice t={t} ok="saved" />
            </div>
          ) : null}
          <details open={openPrefs} className="prices-for-wrap">
            <summary className="prices-for">
              {mine.length > 0 ? (
                <>
                  <span>{t('pricesFor')}</span>
                  <ul className="chips" aria-label={t('methodsTitle')}>
                    {mine.map((m) => (
                      <li key={m.id} className="chip chip-static">
                        {m.name}
                      </li>
                    ))}
                  </ul>
                  <span className="small">{t('change')}</span>
                </>
              ) : (
                <>
                  <span>{t('pricesForNone')}</span>
                  <span className="chip">{t('choose')}</span>
                </>
              )}
            </summary>
            <div className="panel panel-pad prefs-panel">
              <h2 style={{ marginBottom: 8 }}>{t('methodsTitle')}</h2>
              <PreferencesForm lang={lang} t={t} methods={methods} selected={viewer.methodIds} location={viewer.location} returnTo={`/${lang}`} />
            </div>
          </details>
        </div>
      </section>

      <div className="home-grid">
        <section aria-labelledby="hot-title">
          <div className="section-head">
            <h2 id="hot-title">{t('hotDeals')}</h2>
            <Link href={`/${lang}/deals`} className="small">
              {t('allDeals')}
            </Link>
          </div>
          <ul className="rows">
            {deals.map((deal) => (
              <DealRow
                key={deal.id}
                deal={deal}
                lang={lang}
                t={t}
                today={viewer.today}
                myVote={viewer.user ? userVote(db, deal.id, viewer.user.id) : 0}
                returnTo={`/${lang}`}
              />
            ))}
          </ul>
        </section>
        <section aria-labelledby="drops-title">
          <div className="section-head">
            <h2 id="drops-title">{t('priceDrops')}</h2>
          </div>
          <ul className="rows">
            {drops.map((card) => (
              <ProductRow key={card.product.id} card={card} lang={lang} t={t} />
            ))}
          </ul>
        </section>
      </div>

      <section className="section" aria-labelledby="compare-title">
        <div className="section-head">
          <h2 id="compare-title">{t('compareTitle')}</h2>
        </div>
        <nav className="category-grid" aria-labelledby="compare-title">
          {categories.map((c) => (
            <Link key={c.slug} href={`/${lang}/c/${c.slug}`}>
              <CategoryIcon category={c.slug} />
              <span className="category-name">{lang === 'bn' ? c.nameBn : c.nameEn}</span>
              <span className="small muted">{t('productsCount', { n: num(c.productCount, lang) })}</span>
            </Link>
          ))}
        </nav>
      </section>

      <section className="section split-teasers">
        <div className="panel panel-pad">
          <h2>{t('packTeaserTitle')}</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            {t('packTeaserBody')}
          </p>
          <form className="inline-form" action={`/${lang}/packs`}>
            <div className="field">
              <label htmlFor="teaser-gb">{t('dataPerMonth')}</label>
              <input id="teaser-gb" className="input" name="gb" type="number" min="0" max="500" defaultValue="30" inputMode="numeric" />
            </div>
            <div className="field">
              <label htmlFor="teaser-min">{t('minutesPerMonth')}</label>
              <input id="teaser-min" className="input" name="min" type="number" min="0" max="5000" defaultValue="200" inputMode="numeric" />
            </div>
            <button className="btn" type="submit">
              {t('findMyPack')}
            </button>
          </form>
        </div>
        <div className="panel panel-pad">
          <h2>{t('offersTeaserTitle')}</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            {t('offersTeaserBody', { n: num(activeOffers.length, lang) })}
          </p>
          <p style={{ marginTop: 16 }}>
            <Link className="btn btn-quiet" href={`/${lang}/offers`}>
              {t('seeOffers')}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

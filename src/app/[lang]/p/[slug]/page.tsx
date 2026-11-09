import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteAlert, saveAlert } from '@/app/actions';
import { Memo, Notice, OfferTable, PriceChart, ProductGlyph } from '@/components/Commerce';
import { DealRow } from '@/components/Community';
import { getDb } from '@/lib/db';
import { isLang, money, num } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { getAlert } from '@/lib/repo/alerts';
import { getCategory, getProductBySlug, listPaymentOffers, offersForProducts, priceHistory, priceOffers } from '@/lib/repo/catalog';
import { dealsForProduct, userVote } from '@/lib/repo/deals';
import { getViewer } from '@/lib/session';

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(getDb(), slug);
  return { title: product?.name };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const db = getDb();
  const product = getProductBySlug(db, slug);
  if (!product) notFound();
  const t = translator(lang);
  const query = await searchParams;
  const viewer = await getViewer();
  const ctx = { methodIds: viewer.methodIds, location: viewer.location, today: viewer.today };

  const payOffers = listPaymentOffers(db, viewer.today);
  const priced = priceOffers(offersForProducts(db, [product.id]).get(product.id) ?? [], payOffers, ctx);
  const best = priced.find((p) => p.offer.inStock) ?? priced[0] ?? null;
  const bestOfficial = priced.find((p) => p.offer.inStock && p.offer.warrantyType === 'official') ?? null;
  const bestOfferDetail = best?.real.paymentOffer ? payOffers.find((o) => o.id === best.real.paymentOffer!.id) : undefined;
  const history = priceHistory(db, product.id, viewer.today);
  const alert = viewer.user ? getAlert(db, viewer.user.id, product.id) : null;
  const deals = dealsForProduct(db, product.id);
  const category = getCategory(db, product.category);
  const hasUnofficial = priced.some((p) => p.offer.warrantyType === 'unofficial');
  const here = `/${lang}/p/${product.slug}`;

  return (
    <>
      <ol className="breadcrumbs">
        <li>
          <Link href={`/${lang}`}>{t('navHome')}</Link>
        </li>
        {category ? (
          <li>
            <Link href={`/${lang}/c/${category.slug}`}>{lang === 'bn' ? category.nameBn : category.nameEn}</Link>
          </li>
        ) : null}
        <li aria-current="page">{product.brand}</li>
      </ol>

      <div className="product-head">
        <ProductGlyph category={product.category} />
        <div>
          <h1>{product.name}</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            {product.summary}
          </p>
        </div>
      </div>

      <div className="product-layout">
        <div className="stack">
          <section aria-labelledby="offers-title">
            <div className="section-head">
              <h2 id="offers-title">{t('pricesAtShops', { n: num(priced.length, lang) })}</h2>
            </div>
            {priced.length > 0 ? <OfferTable offers={priced} lang={lang} t={t} /> : <p className="notice">{t('noOffersYet')}</p>}
            {hasUnofficial && product.category === 'phones' ? (
              <p className="notice" style={{ marginTop: 12 }}>
                {t('neirNote')}
              </p>
            ) : null}
          </section>

          <section className="section panel panel-pad" aria-labelledby="history-title">
            <h2 id="history-title" style={{ marginBottom: 8 }}>
              {t('historyTitle')}
            </h2>
            <PriceChart points={history} lang={lang} t={t} />
          </section>

          <section className="section" aria-labelledby="specs-title">
            <h2 id="specs-title" style={{ marginBottom: 12 }}>
              {t('specs')}
            </h2>
            <dl className="specs">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {deals.length > 0 ? (
            <section className="section" aria-labelledby="deals-title">
              <h2 id="deals-title" style={{ marginBottom: 12 }}>
                {t('relatedDeals')}
              </h2>
              <ul className="rows">
                {deals.map((deal) => (
                  <DealRow
                    key={deal.id}
                    deal={deal}
                    lang={lang}
                    t={t}
                    today={viewer.today}
                    myVote={viewer.user ? userVote(db, deal.id, viewer.user.id) : 0}
                    returnTo={here}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="product-aside" aria-label={t('realPrice')}>
          {best ? (
            <Memo
              priced={best}
              lang={lang}
              t={t}
              location={viewer.location}
              returnTo={here}
              hasMethods={viewer.methodIds.size > 0}
              officialAlternative={bestOfficial}
              offerTitle={bestOfferDetail ? (lang === 'bn' ? bestOfferDetail.titleBn : bestOfferDetail.titleEn) : null}
            />
          ) : null}

          <section id="alert" className="panel panel-pad" aria-labelledby="alert-title">
            <h2 id="alert-title">{t('alertTitle')}</h2>
            <p className="small muted" style={{ marginTop: 4, marginBottom: 12 }}>
              {t('alertBody')}
            </p>
            <Notice t={t} error={query.error} />
            {viewer.user ? (
              <>
                {alert ? (
                  <p className="small" style={{ marginBottom: 8 }}>
                    {t('alertActive', { amount: money(alert.targetPrice, lang) })}
                  </p>
                ) : null}
                <form action={saveAlert} className="form-grid" style={{ gap: 8 }}>
                  <input type="hidden" name="lang" value={lang} />
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="returnTo" value={here} />
                  <div className="field">
                    <label htmlFor="target">{t('alertTarget')}</label>
                    <input
                      id="target"
                      className="input"
                      name="target"
                      inputMode="numeric"
                      required
                      defaultValue={alert?.targetPrice ?? (best ? Math.floor((best.real.total * 0.95) / 100) * 100 : '')}
                    />
                  </div>
                  <button className="btn" type="submit">
                    {alert ? t('updateAlert') : t('setAlert')}
                  </button>
                </form>
                {alert ? (
                  <form action={deleteAlert} style={{ marginTop: 8 }}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="returnTo" value={here} />
                    <button className="btn btn-quiet btn-small" type="submit">
                      {t('removeAlert')}
                    </button>
                  </form>
                ) : null}
              </>
            ) : (
              <Link className="btn btn-quiet" href={`/${lang}/account?next=${encodeURIComponent(`${here}#alert`)}`}>
                {t('signInForAlert')}
              </Link>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

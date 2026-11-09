import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductRow } from '@/components/Commerce';
import { DealRow } from '@/components/Community';
import { getDb } from '@/lib/db';
import { gb, isLang, money, num } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { listPaymentOffers, listProducts, searchProductIds } from '@/lib/repo/catalog';
import { searchDeals, userVote } from '@/lib/repo/deals';
import { searchPacks } from '@/lib/repo/packs';
import { getViewer } from '@/lib/session';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: translator(isLang(lang) ? lang : 'bn')('searchButton'), robots: { index: false } };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = translator(lang);
  const raw = (await searchParams).q ?? '';
  const q = raw.trim().slice(0, 80);
  const db = getDb();
  const viewer = await getViewer();

  if (!q) {
    return (
      <div className="page-head">
        <h1>{t('searchButton')}</h1>
        <p className="lead">{t('searchPrompt')}</p>
      </div>
    );
  }

  const ids = searchProductIds(db, q);
  const products = listProducts(db, { ids }, listPaymentOffers(db, viewer.today), {
    methodIds: viewer.methodIds,
    location: viewer.location,
    today: viewer.today,
  }).sort((a, b) => ids.indexOf(a.product.id) - ids.indexOf(b.product.id));
  const deals = searchDeals(db, q);
  const packs = searchPacks(db, q);
  const nothing = products.length + deals.length + packs.length === 0;
  const here = `/${lang}/search?q=${encodeURIComponent(q)}`;

  return (
    <>
      <div className="page-head">
        <h1>{t('searchTitle', { q })}</h1>
      </div>
      {nothing ? <p className="notice">{t('searchEmpty', { q })}</p> : null}
      {products.length > 0 ? (
        <section aria-labelledby="sp-title">
          <h2 id="sp-title" style={{ marginBottom: 12 }}>
            {t('searchProducts')} ({num(products.length, lang)})
          </h2>
          <ul className="rows">
            {products.map((card) => (
              <ProductRow key={card.product.id} card={card} lang={lang} t={t} />
            ))}
          </ul>
        </section>
      ) : null}
      {deals.length > 0 ? (
        <section className="section" aria-labelledby="sd-title">
          <h2 id="sd-title" style={{ marginBottom: 12 }}>
            {t('searchDeals')} ({num(deals.length, lang)})
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
      {packs.length > 0 ? (
        <section className="section" aria-labelledby="spk-title">
          <h2 id="spk-title" style={{ marginBottom: 12 }}>
            {t('searchPacks')}
          </h2>
          <ul className="rows">
            {packs.map((p) => (
              <li key={p.id} className="admin-row">
                <div>
                  <strong>{p.operatorName}</strong> {p.name}
                  <div className="meta">
                    {p.dataMb > 0 ? <span>{gb(p.dataMb, lang)}</span> : null}
                    {p.minutes > 0 ? <span>{num(p.minutes, lang)} min</span> : null}
                  </div>
                </div>
                <span className="price-strong">{money(p.price, lang)}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 12 }}>
            <Link href={`/${lang}/packs`}>{t('packsTitle')}</Link>
          </p>
        </section>
      ) : null}
    </>
  );
}

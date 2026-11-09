import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductRow } from '@/components/Commerce';
import { getDb } from '@/lib/db';
import { isLang, num } from '@/lib/format';
import { translator, type Key } from '@/lib/i18n';
import { brandsInCategory, getCategory, listPaymentOffers, listProducts, type SortKey } from '@/lib/repo/catalog';
import { getViewer } from '@/lib/session';
import { intInRange } from '@/lib/validate';

type Search = Record<string, string | string[] | undefined>;

const SORTS: Array<[SortKey, Key]> = [
  ['popular', 'sortPopular'],
  ['price_asc', 'sortPriceAsc'],
  ['price_desc', 'sortPriceDesc'],
  ['drop', 'sortDrop'],
];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; category: string }> }) {
  const { lang, category } = await params;
  const c = getCategory(getDb(), category);
  return { title: c ? (lang === 'en' ? c.nameEn : c.nameBn) : undefined };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; category: string }>;
  searchParams: Promise<Search>;
}) {
  const { lang, category: slug } = await params;
  if (!isLang(lang)) notFound();
  const db = getDb();
  const category = getCategory(db, slug);
  if (!category || category.productCount === 0) notFound();
  const t = translator(lang);
  const query = await searchParams;
  const viewer = await getViewer();

  const allBrands = brandsInCategory(db, slug);
  const brandParam = query.brand;
  const brands = (Array.isArray(brandParam) ? brandParam : brandParam ? [brandParam] : []).filter((b) => allBrands.includes(b));
  const sortRaw = one(query.sort);
  const sort: SortKey = SORTS.some(([k]) => k === sortRaw) ? (sortRaw as SortKey) : 'popular';
  const min = one(query.min) ? intInRange(one(query.min), 0, 10_000_000, 0) : undefined;
  const max = one(query.max) ? intInRange(one(query.max), 0, 10_000_000, 10_000_000) : undefined;
  const flags = {
    official: one(query.official) === '1',
    inStock: one(query.stock) === '1',
    emi: one(query.emi) === '1',
    cod: one(query.cod) === '1',
  };

  const cards = listProducts(
    db,
    { category: slug, brands, min, max, sort, ...flags },
    listPaymentOffers(db, viewer.today),
    { methodIds: viewer.methodIds, location: viewer.location, today: viewer.today },
  );
  const name = lang === 'bn' ? category.nameBn : category.nameEn;
  const hasFilters = brands.length > 0 || min != null || max != null || Object.values(flags).some(Boolean);

  const filterForm = (
    <form className="panel panel-pad form-grid" action={`/${lang}/c/${slug}`}>
      <input type="hidden" name="sort" value={sort} />
      <fieldset>
        <legend>{t('brand')}</legend>
        <div className="form-grid" style={{ gap: 6 }}>
          {allBrands.map((b) => (
            <label key={b} className="check">
              <input type="checkbox" name="brand" value={b} defaultChecked={brands.includes(b)} />
              {b}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t('price')}</legend>
        <div className="price-pair">
          <div className="field">
            <label htmlFor="min" className="small">
              {t('minPrice')}
            </label>
            <input id="min" className="input" name="min" type="number" min="0" inputMode="numeric" defaultValue={min ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="max" className="small">
              {t('maxPrice')}
            </label>
            <input id="max" className="input" name="max" type="number" min="0" inputMode="numeric" defaultValue={max ?? ''} />
          </div>
        </div>
      </fieldset>
      <fieldset className="form-grid" style={{ gap: 6 }}>
        <legend className="visually-hidden">{t('filters')}</legend>
        <label className="check">
          <input type="checkbox" name="official" value="1" defaultChecked={flags.official} />
          {t('officialOnly')}
        </label>
        <label className="check">
          <input type="checkbox" name="stock" value="1" defaultChecked={flags.inStock} />
          {t('inStockOnly')}
        </label>
        <label className="check">
          <input type="checkbox" name="emi" value="1" defaultChecked={flags.emi} />
          {t('emiOnly')}
        </label>
        <label className="check">
          <input type="checkbox" name="cod" value="1" defaultChecked={flags.cod} />
          {t('codOnly')}
        </label>
      </fieldset>
      <button className="btn" type="submit">
        {t('showResults')}
      </button>
      {hasFilters ? (
        <Link href={`/${lang}/c/${slug}`} className="small">
          {t('clearFilters')}
        </Link>
      ) : null}
    </form>
  );

  const keep = new URLSearchParams();
  for (const b of brands) keep.append('brand', b);
  if (min != null) keep.set('min', String(min));
  if (max != null) keep.set('max', String(max));
  if (flags.official) keep.set('official', '1');
  if (flags.inStock) keep.set('stock', '1');
  if (flags.emi) keep.set('emi', '1');
  if (flags.cod) keep.set('cod', '1');

  return (
    <>
      <ol className="breadcrumbs">
        <li>
          <Link href={`/${lang}`}>{t('navHome')}</Link>
        </li>
        <li>
          <Link href={`/${lang}/c`}>{t('navCompare')}</Link>
        </li>
        <li aria-current="page">{name}</li>
      </ol>
      <h1>{name}</h1>
      <div className="listing">
        <aside className="filters-panel" aria-label={t('filters')}>
          {filterForm}
        </aside>
        <section aria-label={name}>
          <div className="listing-head">
            <p className="muted">{t('productsCount', { n: num(cards.length, lang) })}</p>
            <form action={`/${lang}/c/${slug}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[...keep.entries()].map(([k, v], i) => (
                <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
              ))}
              <label htmlFor="sort" className="small">
                {t('sortBy')}
              </label>
              <select id="sort" name="sort" className="select" defaultValue={sort} style={{ width: 'auto' }}>
                {SORTS.map(([k, label]) => (
                  <option key={k} value={k}>
                    {t(label)}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-quiet btn-small">
                {t('showResults')}
              </button>
            </form>
          </div>
          {cards.length > 0 ? (
            <ul className="rows">
              {cards.map((card) => (
                <ProductRow key={card.product.id} card={card} lang={lang} t={t} />
              ))}
            </ul>
          ) : (
            <p className="notice">{t('noProducts')}</p>
          )}
        </section>
      </div>
    </>
  );
}

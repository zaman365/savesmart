import Link from 'next/link';
import { savePreferences } from '@/app/actions';
import { ago, money, num, shortDate, type Lang } from '@/lib/format';
import type { Key, Translate } from '@/lib/i18n';
import type { Location } from '@/lib/pricing';
import { emiMonthly } from '@/lib/pricing';
import type { HistoryPoint, PaymentMethod, PricedOffer, ProductCard } from '@/lib/repo/catalog';
import { CategoryIcon, TickIcon } from './Icons';

export function ProductGlyph({ category }: { category: string }) {
  return (
    <svg className="glyph" viewBox="0 0 56 56" aria-hidden="true">
      <rect x="0.75" y="0.75" width="54.5" height="54.5" rx="6" fill="#eef1f6" stroke="#d5dae5" strokeWidth="1.5" />
      <g transform="translate(14 14)" color="#4a5378">
        <CategoryIcon category={category} width={28} height={28} />
      </g>
    </svg>
  );
}

export function Notice({ t, error, ok }: { t: Translate; error?: string; ok?: Key | null }) {
  const isKey = (value: string | undefined): value is Key => !!value && /^err[A-Z]\w+$/.test(value);
  if (isKey(error)) {
    return (
      <p className="notice notice-error" role="alert">
        {t(error)}
      </p>
    );
  }
  if (ok) {
    return (
      <p className="notice notice-ok" role="status">
        {t(ok)}
      </p>
    );
  }
  return null;
}

export function ProductRow({ card, lang, t }: { card: ProductCard; lang: Lang; t: Translate }) {
  const { product, best, shopCount, drop30 } = card;
  return (
    <li className="product-row">
      <ProductGlyph category={product.category} />
      <div>
        <Link className="product-name" href={`/${lang}/p/${product.slug}`}>
          {product.name}
        </Link>
        <p className="small muted">{product.summary}</p>
      </div>
      <div className="product-price">
        {best ? (
          <>
            <div className="price-label">{t('realPriceFrom')}</div>
            <div className="price-strong">{money(best.real.total, lang)}</div>
            <div className="price-label">{shopCount === 1 ? t('atShop') : t('atShops', { n: num(shopCount, lang) })}</div>
            {drop30 ? <span className="drop">{t('dropVs30', { n: num(drop30, lang) })}</span> : null}
          </>
        ) : (
          <span className="muted small">{t('noOffersYet')}</span>
        )}
      </div>
    </li>
  );
}

export function PreferencesForm({
  lang,
  t,
  methods,
  selected,
  location,
  returnTo,
}: {
  lang: Lang;
  t: Translate;
  methods: PaymentMethod[];
  selected: Set<number>;
  location: Location;
  returnTo: string;
}) {
  const groups: Array<[Key, PaymentMethod[]]> = [
    ['mobileWallets', methods.filter((m) => m.kind === 'mfs')],
    ['cards', methods.filter((m) => m.kind === 'card')],
  ];
  return (
    <form action={savePreferences} className="form-grid">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="methodsSubmitted" value="1" />
      <p className="small muted">{t('methodsHelp')}</p>
      {groups.map(([label, list]) => (
        <fieldset key={label} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-label" style={{ marginBottom: 8 }}>
            {t(label)}
          </legend>
          <ul className="chips">
            {list.map((m) => (
              <li key={m.id}>
                <label className="chip">
                  <input type="checkbox" name="method" value={m.id} defaultChecked={selected.has(m.id)} />
                  <TickIcon className="tick" />
                  {m.name}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label" style={{ marginBottom: 8 }}>
          {t('deliveryTo')}
        </legend>
        <ul className="chips">
          {(['dhaka', 'outside'] as const).map((loc) => (
            <li key={loc}>
              <label className="chip">
                <input type="radio" name="location" value={loc} defaultChecked={location === loc} />
                <TickIcon className="tick" />
                {t(loc === 'dhaka' ? 'insideDhaka' : 'outsideDhaka')}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <div>
        <button className="btn" type="submit">
          {t('save')}
        </button>
      </div>
    </form>
  );
}

function savingLabel(priced: PricedOffer, t: Translate): string {
  const offer = priced.real.paymentOffer;
  if (!offer) return '';
  return `${offer.methodName} ${t(offer.kind === 'cashback' ? 'cashback' : 'discount')}`;
}

export function Memo({
  priced,
  lang,
  t,
  location,
  returnTo,
  hasMethods,
  offerTitle,
  officialAlternative,
}: {
  priced: PricedOffer;
  officialAlternative?: PricedOffer | null;
  lang: Lang;
  t: Translate;
  location: Location;
  returnTo: string;
  hasMethods: boolean;
  offerTitle: string | null;
}) {
  const { offer, real } = priced;
  const unofficial = offer.warrantyType === 'unofficial';
  return (
    <div className="memo-wrap">
      <section className="memo" aria-labelledby="memo-title">
        <div className="memo-head">
          <h2 id="memo-title" className="memo-title">
            {t('realPrice')}
          </h2>
          <span className="small muted">{offer.shop.name}</span>
        </div>
        {unofficial ? (
          <p style={{ marginBottom: 8 }}>
            <span className="badge badge-unofficial">{t('warrantyUnofficial')}</span>
          </p>
        ) : null}
        <dl className="memo-lines">
          <div className="memo-line">
            <dt>{t('shopPrice')}</dt>
            <dd>{money(real.shopPrice, lang)}</dd>
          </div>
          <div className="memo-line">
            <dt>
              {t('delivery')}
              <span className="memo-sub">{t(location === 'dhaka' ? 'insideDhaka' : 'outsideDhaka')}</span>
            </dt>
            <dd>+ {money(real.delivery, lang)}</dd>
          </div>
          {real.paymentOffer ? (
            <div className="memo-line memo-saving">
              <dt>
                {savingLabel(priced, t)}
                {offerTitle ? <span className="memo-sub">{offerTitle}</span> : null}
              </dt>
              <dd>− {money(real.saving, lang)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="memo-total">
          <span className="memo-total-label">{t('youPay')}</span>
          <span className="memo-total-amount">{money(real.total, lang)}</span>
        </div>
        {real.paymentOffer?.kind === 'cashback' ? <p className="small muted" style={{ marginTop: 8 }}>{t('cashbackNote')}</p> : null}
        {unofficial && officialAlternative ? (
          <p className="small" style={{ marginTop: 8 }}>
            {t('officialAlternative', { amount: money(officialAlternative.real.total, lang), shop: officialAlternative.offer.shop.name })}
          </p>
        ) : null}
        <div className="memo-actions">
          {offer.url ? (
            <a className="btn" href={offer.url} rel="sponsored noopener" target="_blank">
              {t('goToShop')}
            </a>
          ) : (
            <p className="small muted">{t('noShopLink')}</p>
          )}
          <p className="small muted">{t('affiliateNote')}</p>
        </div>
        <form action={savePreferences} className="loc-form">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <span>{t('deliveryTo')}</span>
          <button type="submit" name="location" value="dhaka" aria-pressed={location === 'dhaka'}>
            {t('insideDhaka')}
          </button>
          <button type="submit" name="location" value="outside" aria-pressed={location === 'outside'}>
            {t('outsideDhaka')}
          </button>
        </form>
        {!hasMethods ? (
          <p className="small" style={{ marginTop: 12 }}>
            <Link href={`/${lang}?prefs=1#prefs`}>{t('pricesForNone')}</Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}

const warrantyKey: Record<string, Key> = { official: 'warrantyOfficial', unofficial: 'warrantyUnofficial', shop: 'warrantyShop' };
const warrantyClass: Record<string, string> = { official: 'badge', unofficial: 'badge badge-unofficial', shop: 'badge badge-shop' };

export function OfferTable({ offers, lang, t }: { offers: PricedOffer[]; lang: Lang; t: Translate }) {
  const hasLinks = offers.some((p) => p.offer.url);
  return (
    <table className="offer-table">
      <thead>
        <tr>
          <th scope="col">{t('colShop')}</th>
          <th scope="col" className="num">
            {t('colShopPrice')}
          </th>
          <th scope="col" className="num">
            {t('colOffer')}
          </th>
          <th scope="col" className="num">
            {t('colReal')}
          </th>
          {hasLinks ? (
            <th scope="col">
              <span className="visually-hidden">{t('goToShop')}</span>
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {offers.map((p, i) => {
          const o = p.offer;
          return (
            <tr key={o.id} className={i === 0 ? 'offer-best' : undefined}>
              <td className="cell-shop">
                {i === 0 ? <span className="best-flag">{t('cheapestForYou')}</span> : null}
                <div className="shop-name">
                  {o.shop.name}
                  {o.shop.isDemo ? <span className="muted small"> ({t('demoShop')})</span> : null}
                </div>
                <div className="meta">
                  <span className={warrantyClass[o.warrantyType]}>
                    {t(warrantyKey[o.warrantyType])}
                    {o.warrantyMonths > 0 ? `, ${t('months', { n: num(o.warrantyMonths, lang) })}` : ''}
                  </span>
                  <span>{o.shop.city}</span>
                  <span>{t(o.inStock ? 'inStock' : 'outOfStock')}</span>
                  <span>{t(o.shop.cod ? 'cod' : 'noCod')}</span>
                  {o.emiMonths > 0 ? (
                    <span>{t('emiLine', { amount: money(emiMonthly(o.price, o.emiMonths), lang), n: num(o.emiMonths, lang) })}</span>
                  ) : null}
                  <span>{t('checked', { when: ago(o.checkedAt, lang) })}</span>
                </div>
              </td>
              <td className="num" data-label={t('colShopPrice')}>
                <span className="cell-value">
                  {o.regularPrice ? <span className="price-was">{money(o.regularPrice, lang)}</span> : null}
                  <span>{money(o.price, lang)}</span>
                </span>
              </td>
              <td className="num" data-label={t('colOffer')}>
                {p.real.paymentOffer ? (
                  <span className="cell-value save-text">
                    <span>− {money(p.real.saving, lang)}</span>
                    <span className="small">{savingLabel(p, t)}</span>
                  </span>
                ) : (
                  <span className="muted">{t('noOffer')}</span>
                )}
              </td>
              <td className="num cell-real" data-label={t('colReal')}>
                <span className="price-strong">{money(p.real.total, lang)}</span>
              </td>
              {hasLinks ? (
                <td className="cell-action">
                  {o.url ? (
                    <a className="btn btn-small" href={o.url} rel="sponsored noopener" target="_blank">
                      {t('goToShop')}
                    </a>
                  ) : null}
                </td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function PriceChart({ points, lang, t }: { points: HistoryPoint[]; lang: Lang; t: Translate }) {
  if (points.length < 2) return null;
  const W = 640;
  const H = 200;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 28;
  const prices = points.map((p) => p.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const span = Math.max(hi - lo, hi * 0.02);
  const yMin = lo - span * 0.15;
  const yMax = hi + span * 0.15;
  const x = (i: number) => padL + (i / (points.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(' ');
  const area = `${padL},${H - padB} ${line} ${W - padR},${H - padB}`;
  const lowIndex = prices.lastIndexOf(lo);
  const last = points[points.length - 1];
  const summary = `${t('historyLow', { amount: money(lo, lang), date: shortDate(points[lowIndex].date, lang) })}. ${t('historyNow', { amount: money(last.price, lang) })}.`;

  return (
    <figure style={{ margin: 0 }}>
      <div className="chart-legend">
        <span>{t('historyLow', { amount: money(lo, lang), date: shortDate(points[lowIndex].date, lang) })}</span>
        <span>{t('historyNow', { amount: money(last.price, lang) })}</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        <line x1={padL} x2={W - padR} y1={y(hi)} y2={y(hi)} stroke="#d5dae5" strokeDasharray="3 4" />
        <line x1={padL} x2={W - padR} y1={y(lo)} y2={y(lo)} stroke="#d5dae5" strokeDasharray="3 4" />
        <text x={W - padR} y={y(hi) - 5} textAnchor="end" fontSize="12" fill="#4a5378">
          {money(hi, lang)}
        </text>
        <polygon points={area} fill="#1b2550" fillOpacity="0.06" />
        <polyline points={line} fill="none" stroke="#1b2550" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={x(lowIndex)} cy={y(lo)} r="6" fill="#ffc52e" stroke="#1b2550" strokeWidth="1.5" />
        <circle cx={x(points.length - 1)} cy={y(last.price)} r="4" fill="#1b2550" />
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="#b7bfd1" />
        <text x={padL} y={H - 8} fontSize="12" fill="#4a5378">
          {shortDate(points[0].date, lang)}
        </text>
        <text x={W - padR} y={H - 8} textAnchor="end" fontSize="12" fill="#4a5378">
          {shortDate(last.date, lang)}
        </text>
      </svg>
      <figcaption className="small muted">{t('historyNote')}</figcaption>
    </figure>
  );
}

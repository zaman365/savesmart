import { notFound } from 'next/navigation';
import { ago, dec, gb, isLang, money, num, type Lang } from '@/lib/format';
import { translator, type Translate } from '@/lib/i18n';
import { rankPacks, type PackResult } from '@/lib/packs';
import { getDb } from '@/lib/db';
import { listOperators, listPacks, type PackListing } from '@/lib/repo/packs';
import { intInRange } from '@/lib/validate';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: translator(isLang(lang) ? lang : 'bn')('packsTitle') };
}

function PackRow({ result, lang, t, first }: { result: PackResult; lang: Lang; t: Translate; first: boolean }) {
  const p = result.pack as PackListing;
  return (
    <li className={`pack${first ? ' pack-first' : ''}`}>
      <div className="pack-operator">{p.operatorName}</div>
      <div>
        {first ? <span className="best-flag">{t('cheapestForYou')}</span> : null}
        <div style={{ fontWeight: 600 }}>{p.name}</div>
        <div className="facts">
          {p.dataMb > 0 ? <span className="tag">{gb(p.dataMb, lang)}</span> : null}
          {p.minutes > 0 ? <span className="tag">{num(p.minutes, lang)} min</span> : null}
          <span className="tag">{p.validityDays ? t('validDays', { n: num(p.validityDays, lang) }) : t('noExpiry')}</span>
          <span className="tag">{money(p.price, lang)}</span>
        </div>
        <div className="meta">
          <span>{result.packsNeeded > 1 ? t('buyTimes', { n: num(result.packsNeeded, lang) }) : t('buyOnce')}</span>
          {result.costPerGb != null ? <span>{t('perGb', { amount: `৳${dec(result.costPerGb, lang)}` })}</span> : null}
          {result.unusedGb >= 0.5 ? <span>{t('unusedGb', { n: dec(result.unusedGb, lang) })}</span> : null}
          <span>
            {t('source')}:{' '}
            {p.source === 'demo' ? (
              t('sourceDemo')
            ) : (
              <a href={p.source} rel="noopener" target="_blank">
                {new URL(p.source).hostname.replace(/^www\./, '')}
              </a>
            )}
          </span>
          <span>{t('checked', { when: ago(p.checkedAt, lang) })}</span>
        </div>
      </div>
      <div className="pack-cost">
        <div className="price-strong">{money(result.monthlyCost, lang)}</div>
        <div className="price-label">{t('perMonth', { amount: '' }).trim()}</div>
      </div>
    </li>
  );
}

export default async function PacksPage({
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
  const operators = listOperators(db);
  const operator = operators.some((o) => o.slug === query.op) ? query.op : undefined;
  const dataGb = intInRange(query.gb, 0, 500, 30);
  const minutes = intInRange(query.min, 0, 5000, 200);
  const { full, partial } = rankPacks(listPacks(db, operator), { dataGb, minutes });

  return (
    <>
      <div className="page-head">
        <h1>{t('packsTitle')}</h1>
        <p className="lead">{t('packsLead')}</p>
      </div>
      <form className="panel panel-pad pack-form" action={`/${lang}/packs`}>
        <div className="field">
          <label htmlFor="gb">{t('dataPerMonth')}</label>
          <input id="gb" name="gb" className="input" type="number" min="0" max="500" inputMode="numeric" defaultValue={dataGb} />
        </div>
        <div className="field">
          <label htmlFor="min">{t('minutesPerMonth')}</label>
          <input id="min" name="min" className="input" type="number" min="0" max="5000" inputMode="numeric" defaultValue={minutes} />
        </div>
        <div className="field">
          <label htmlFor="op">{t('operator')}</label>
          <select id="op" name="op" className="select" defaultValue={operator ?? ''}>
            <option value="">{t('allOperators')}</option>
            {operators.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit">
          {t('rankPacks')}
        </button>
      </form>
      <p className="small muted" style={{ marginTop: 8 }}>
        {t('packCheck')}
      </p>

      <section className="section" aria-labelledby="full-title">
        <h2 id="full-title" style={{ marginBottom: 12 }}>
          {t('coversAll')}
        </h2>
        {full.length > 0 ? (
          <ul className="rows">
            {full.map((r, i) => (
              <PackRow key={r.pack.id} result={r} lang={lang} t={t} first={i === 0} />
            ))}
          </ul>
        ) : (
          <p className="notice">{t('packsEmpty')}</p>
        )}
      </section>

      {partial.length > 0 ? (
        <section className="section" aria-labelledby="partial-title">
          <h2 id="partial-title" style={{ marginBottom: 12 }}>
            {t('coversPart')}
          </h2>
          <ul className="rows">
            {partial.map((r) => (
              <PackRow key={r.pack.id} result={r} lang={lang} t={t} first={false} />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

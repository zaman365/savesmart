import Link from 'next/link';
import { notFound } from 'next/navigation';
import { moderate, resetDemo, runAlertCheck } from '@/app/actions';
import { DealMeta } from '@/components/Community';
import { getDb, isDemo } from '@/lib/db';
import { isLang, num } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { freshness } from '@/lib/repo/catalog';
import { listDeals, pendingDeals } from '@/lib/repo/deals';
import { getViewer } from '@/lib/session';

export const metadata = { title: 'Admin', robots: { index: false } };

export default async function AdminPage({
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
  const viewer = await getViewer();

  if (viewer.user?.role !== 'admin') {
    return (
      <div className="page-head">
        <h1>{t('adminTitle')}</h1>
        <p className="notice" style={{ marginTop: 16 }}>
          {t('forbidden')}{' '}
          {!viewer.user ? <Link href={`/${lang}/account?next=${encodeURIComponent(`/${lang}/admin`)}`}>{t('signIn')}</Link> : null}
        </p>
      </div>
    );
  }

  const db = getDb();
  const pending = pendingDeals(db);
  const published = listDeals(db, { tab: 'new', limit: 15, today: viewer.today }).filter((d) => d.status === 'published');
  const fresh = freshness(db);

  const actionForm = (dealId: number, action: 'approve' | 'reject' | 'expire', label: string, quiet = true) => (
    <form action={moderate}>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="dealId" value={dealId} />
      <input type="hidden" name="action" value={action} />
      <button className={`btn btn-small${quiet ? ' btn-quiet' : ''}`} type="submit">
        {label}
      </button>
    </form>
  );

  return (
    <>
      <div className="page-head">
        <h1>{t('adminTitle')}</h1>
      </div>
      {query.alerts != null ? (
        <p className="notice notice-ok" role="status" style={{ marginBottom: 16 }}>
          {t('alertsRun', { n: num(Number(query.alerts) || 0, lang) })}
        </p>
      ) : null}

      <section aria-labelledby="pending-title">
        <h2 id="pending-title" style={{ marginBottom: 12 }}>
          {t('pendingDeals')} ({num(pending.length, lang)})
        </h2>
        {pending.length > 0 ? (
          <ul className="rows">
            {pending.map((d) => (
              <li key={d.id} className="admin-row">
                <div>
                  <Link href={`/${lang}/deals/${d.id}`} className="deal-title">
                    {d.title}
                  </Link>
                  <DealMeta deal={d} lang={lang} t={t} today={viewer.today} />
                  {d.body ? <p className="small" style={{ marginTop: 4 }}>{d.body}</p> : null}
                </div>
                <div className="admin-actions">
                  {actionForm(d.id, 'approve', t('approve'), false)}
                  {actionForm(d.id, 'reject', t('reject'))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t('noPending')}</p>
        )}
      </section>

      <section className="section" aria-labelledby="published-title">
        <h2 id="published-title" style={{ marginBottom: 12 }}>
          {t('publishedDeals')}
        </h2>
        <ul className="rows">
          {published.map((d) => (
            <li key={d.id} className="admin-row">
              <div>
                <Link href={`/${lang}/deals/${d.id}`}>{d.title}</Link>
                <DealMeta deal={d} lang={lang} t={t} today={viewer.today} />
              </div>
              <div className="admin-actions">{actionForm(d.id, 'expire', t('markExpired'))}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section panel panel-pad" aria-labelledby="fresh-title">
        <h2 id="fresh-title" style={{ marginBottom: 8 }}>
          {t('dataFreshness')}
        </h2>
        <div className="stat-line">
          <span>{t('offersFresh')}</span>
          <strong>
            {num(fresh.offersFresh, lang)} / {num(fresh.offersTotal, lang)}
          </strong>
        </div>
        <div className="stat-line">
          <span>{t('packsFresh')}</span>
          <strong>
            {num(fresh.packsFresh, lang)} / {num(fresh.packsTotal, lang)}
          </strong>
        </div>
        <div className="admin-actions" style={{ marginTop: 16 }}>
          <form action={runAlertCheck}>
            <input type="hidden" name="lang" value={lang} />
            <button className="btn btn-quiet" type="submit">
              {t('runAlerts')}
            </button>
          </form>
          {isDemo() ? (
            <form action={resetDemo}>
              <input type="hidden" name="lang" value={lang} />
              <button className="btn btn-quiet" type="submit">
                {t('resetDemo')}
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteAlert, readNotifications, register, signIn, signOut } from '@/app/actions';
import { Notice, PreferencesForm } from '@/components/Commerce';
import { getDb, isDemo } from '@/lib/db';
import { ago, isLang, money } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { listAlerts, listNotifications } from '@/lib/repo/alerts';
import { listPaymentMethods, listPaymentOffers, offersForProducts, priceOffers } from '@/lib/repo/catalog';
import { dealsByUser } from '@/lib/repo/deals';
import { DEMO_ADMIN_EMAIL, DEMO_MEMBER_EMAIL, DEMO_PASSWORD } from '@/lib/seed';
import { getViewer } from '@/lib/session';
import { safePath } from '@/lib/validate';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: translator(isLang(lang) ? lang : 'bn')('navAccount') };
}

export default async function AccountPage({
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
  const db = getDb();
  const next = safePath(query.next, `/${lang}/account`);

  if (!viewer.user) {
    return (
      <>
        <div className="page-head">
          <h1>{t('signIn')}</h1>
        </div>
        <Notice t={t} error={query.error} />
        {isDemo() ? (
          <p className="notice" style={{ margin: '16px 0' }}>
            {t('demoAccounts', { member: DEMO_MEMBER_EMAIL, admin: DEMO_ADMIN_EMAIL, pw: DEMO_PASSWORD })}
          </p>
        ) : null}
        <div className="auth-grid" style={{ marginTop: 16 }}>
          <form action={signIn} className="panel panel-pad form-grid" aria-labelledby="signin-title">
            <h2 id="signin-title">{t('signIn')}</h2>
            <input type="hidden" name="lang" value={lang} />
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label htmlFor="si-email">{t('email')}</label>
              <input id="si-email" name="email" type="email" className="input" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="si-password">{t('password')}</label>
              <input id="si-password" name="password" type="password" className="input" autoComplete="current-password" required />
            </div>
            <div>
              <button className="btn" type="submit">
                {t('signIn')}
              </button>
            </div>
          </form>

          <form action={register} className="panel panel-pad form-grid" aria-labelledby="register-title">
            <h2 id="register-title">{t('register')}</h2>
            <p className="small muted">{t('newHere')}</p>
            <input type="hidden" name="lang" value={lang} />
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label htmlFor="re-name">{t('name')}</label>
              <input id="re-name" name="name" className="input" autoComplete="name" required minLength={2} maxLength={60} />
            </div>
            <div className="field">
              <label htmlFor="re-email">{t('email')}</label>
              <input id="re-email" name="email" type="email" className="input" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="re-password">{t('password')}</label>
              <input
                id="re-password"
                name="password"
                type="password"
                className="input"
                autoComplete="new-password"
                required
                minLength={10}
                aria-describedby="re-password-hint"
              />
              <span id="re-password-hint" className="field-hint">
                {t('passwordHint')}
              </span>
            </div>
            <label className="check small">
              <input type="checkbox" name="consent" value="yes" required />
              {t('consent')}
            </label>
            <div>
              <button className="btn" type="submit">
                {t('register')}
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  const user = viewer.user;
  const notifications = listNotifications(db, user.id);
  const alerts = listAlerts(db, user.id);
  const payOffers = listPaymentOffers(db, viewer.today);
  const offers = offersForProducts(db, alerts.map((a) => a.productId));
  const ctx = { methodIds: viewer.methodIds, location: viewer.location, today: viewer.today };
  const deals = dealsByUser(db, user.id);
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
        <div>
          <h1>{t('signedInAs', { name: user.name })}</h1>
          <p className="lead">{user.email}</p>
        </div>
        <form action={signOut}>
          <input type="hidden" name="lang" value={lang} />
          <button className="btn btn-quiet" type="submit">
            {t('signOut')}
          </button>
        </form>
      </div>
      <Notice t={t} error={query.error} ok={query.saved ? 'saved' : null} />

      <section id="notifications" className="section" aria-labelledby="notif-title">
        <div className="section-head">
          <h2 id="notif-title">{t('notifications')}</h2>
          {hasUnread ? (
            <form action={readNotifications}>
              <input type="hidden" name="lang" value={lang} />
              <button className="btn btn-quiet btn-small" type="submit">
                {t('markRead')}
              </button>
            </form>
          ) : null}
        </div>
        {notifications.length > 0 ? (
          <ul className="rows">
            {notifications.map((n) => (
              <li key={n.id} className={`panel-pad${n.readAt ? '' : ' notif-unread'}`}>
                <p>{n.link ? <Link href={`/${lang}${n.link}`}>{lang === 'bn' ? n.bodyBn : n.bodyEn}</Link> : lang === 'bn' ? n.bodyBn : n.bodyEn}</p>
                <p className="small muted">{ago(n.createdAt, lang)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t('noNotifications')}</p>
        )}
      </section>

      <section className="section" aria-labelledby="alerts-title">
        <h2 id="alerts-title" style={{ marginBottom: 12 }}>
          {t('myAlerts')}
        </h2>
        {alerts.length > 0 ? (
          <ul className="rows">
            {alerts.map((a) => {
              const priced = priceOffers(offers.get(a.productId) ?? [], payOffers, ctx);
              const best = priced.find((p) => p.offer.inStock) ?? priced[0];
              const reached = best && best.real.total <= a.targetPrice;
              return (
                <li key={a.id} className="admin-row">
                  <div>
                    <Link className="product-name" href={`/${lang}/p/${a.productSlug}`}>
                      {a.productName}
                    </Link>
                    <div className="meta">
                      <span>{t('targetAt', { amount: money(a.targetPrice, lang) })}</span>
                      {best ? <span>{t('currentReal', { amount: money(best.real.total, lang) })}</span> : null}
                      {reached ? <span className="save-text">{t('alertTriggered')}</span> : null}
                    </div>
                  </div>
                  <form action={deleteAlert}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="productId" value={a.productId} />
                    <input type="hidden" name="returnTo" value={`/${lang}/account`} />
                    <button className="btn btn-quiet btn-small" type="submit">
                      {t('removeAlert')}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">{t('noAlerts')}</p>
        )}
      </section>

      <section className="section panel panel-pad" aria-labelledby="methods-title">
        <h2 id="methods-title" style={{ marginBottom: 8 }}>
          {t('methodsTitle')}
        </h2>
        <PreferencesForm
          lang={lang}
          t={t}
          methods={listPaymentMethods(db)}
          selected={viewer.methodIds}
          location={viewer.location}
          returnTo={`/${lang}/account`}
        />
      </section>

      {deals.length > 0 ? (
        <section className="section" aria-labelledby="mydeals-title">
          <h2 id="mydeals-title" style={{ marginBottom: 12 }}>
            {t('myDeals')}
          </h2>
          <ul className="rows">
            {deals.map((d) => (
              <li key={d.id} className="admin-row">
                <Link href={`/${lang}/deals/${d.id}`}>{d.title}</Link>
                <span className="small muted">
                  {d.status === 'pending' ? t('pendingBadge') : d.status === 'expired' ? t('expired') : `${d.temperature}°`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

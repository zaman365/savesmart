import Link from 'next/link';
import { notFound } from 'next/navigation';
import { comment } from '@/app/actions';
import { DealMeta, TempControl } from '@/components/Community';
import { Notice } from '@/components/Commerce';
import { getDb } from '@/lib/db';
import { ago, isLang, money } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { getDeal, isExpired, listComments, userVote } from '@/lib/repo/deals';
import { getViewer } from '@/lib/session';
import { discountPercent } from '@/lib/temperature';

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { id } = await params;
  const deal = Number.isInteger(Number(id)) ? getDeal(getDb(), Number(id)) : null;
  return { title: deal && (deal.status === 'published' || deal.status === 'expired') ? deal.title : undefined };
}

export default async function DealPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { lang, id } = await params;
  if (!isLang(lang) || !/^\d+$/.test(id)) notFound();
  const db = getDb();
  const deal = getDeal(db, Number(id));
  const viewer = await getViewer();
  if (!deal) notFound();
  const publicDeal = deal.status === 'published' || deal.status === 'expired';
  const canSee = publicDeal || viewer.user?.id === deal.userId || viewer.user?.role === 'admin';
  if (!canSee) notFound();

  const t = translator(lang);
  const query = await searchParams;
  const comments = listComments(db, deal.id);
  const expired = isExpired(deal, viewer.today);
  const here = `/${lang}/deals/${deal.id}`;
  const off = discountPercent(deal.price, deal.regularPrice);

  return (
    <>
      <ol className="breadcrumbs">
        <li>
          <Link href={`/${lang}`}>{t('navHome')}</Link>
        </li>
        <li>
          <Link href={`/${lang}/deals`}>{t('navDeals')}</Link>
        </li>
      </ol>
      {query.posted === 'pending' || deal.status === 'pending' ? <p className="notice" style={{ marginBottom: 16 }}>{t('pendingNotice')}</p> : null}
      <Notice t={t} error={query.error} />

      <article className="panel panel-pad" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TempControl
            deal={deal}
            lang={lang}
            t={t}
            myVote={viewer.user ? userVote(db, deal.id, viewer.user.id) : 0}
            returnTo={here}
            interactive={!expired && deal.status === 'published'}
          />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontSize: 26 }}>{deal.title}</h1>
            <DealMeta deal={deal} lang={lang} t={t} today={viewer.today} />
          </div>
        </div>

        {deal.price ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span className="memo-total-amount" style={{ fontSize: 34 }}>
              {money(deal.price, lang)}
            </span>
            {deal.regularPrice && off ? (
              <>
                <span className="price-was">{money(deal.regularPrice, lang)}</span>
                <span className="save-text">−{off}%</span>
              </>
            ) : null}
          </div>
        ) : null}

        {deal.voucherCode ? (
          <div>
            <span className="code" style={{ fontSize: 17 }}>
              <span className="code-label">{t('code')}</span>
              {deal.voucherCode}
            </span>
          </div>
        ) : null}

        {deal.body ? <p style={{ whiteSpace: 'pre-wrap', maxWidth: '70ch' }}>{deal.body}</p> : null}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {deal.url && !expired ? (
            <a className="btn" href={deal.url} rel="nofollow noopener" target="_blank">
              {t('goToShop')}
            </a>
          ) : null}
          {deal.productSlug ? (
            <Link className="btn btn-quiet" href={`/${lang}/p/${deal.productSlug}`}>
              {t('viewProduct')}
            </Link>
          ) : null}
        </div>
      </article>

      <section id="comments" className="section" aria-labelledby="comments-title">
        <h2 id="comments-title" style={{ marginBottom: 12 }}>
          {t('comments')}
        </h2>
        {comments.length > 0 ? (
          <ul className="rows">
            {comments.map((c) => (
              <li key={c.id} className="panel-pad">
                <div className="meta" style={{ marginTop: 0, marginBottom: 4 }}>
                  <strong style={{ color: 'var(--ink)' }}>{c.userName}</strong>
                  <span>{ago(c.createdAt, lang)}</span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{c.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t('noComments')}</p>
        )}

        {publicDeal ? (
          viewer.user ? (
            <form id="comment-form" action={comment} className="panel panel-pad form-grid" style={{ marginTop: 16 }}>
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="dealId" value={deal.id} />
              <div className="field">
                <label htmlFor="body">{t('commentLabel')}</label>
                <textarea id="body" name="body" className="textarea" required minLength={2} maxLength={1000} placeholder={t('commentPlaceholder')} />
              </div>
              <div>
                <button className="btn" type="submit">
                  {t('addComment')}
                </button>
              </div>
            </form>
          ) : (
            <p style={{ marginTop: 16 }}>
              <Link className="btn btn-quiet" href={`/${lang}/account?next=${encodeURIComponent(here)}`}>
                {t('signInToVote')}
              </Link>
            </p>
          )
        ) : null}
      </section>
    </>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { postDeal } from '@/app/actions';
import { Notice } from '@/components/Commerce';
import { getDb } from '@/lib/db';
import { isLang } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { listCategories, listPaymentMethods } from '@/lib/repo/catalog';
import { getViewer } from '@/lib/session';
import { needsModeration } from '@/lib/temperature';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: translator(isLang(lang) ? lang : 'bn')('postDeal') };
}

export default async function NewDealPage({
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

  if (!viewer.user) {
    return (
      <div className="page-head">
        <h1>{t('postDeal')}</h1>
        <p style={{ marginTop: 16 }}>
          <Link className="btn" href={`/${lang}/account?next=${encodeURIComponent(`/${lang}/deals/new`)}`}>
            {t('signInToPost')}
          </Link>
        </p>
      </div>
    );
  }

  const categories = listCategories(db);
  const methods = listPaymentMethods(db);

  return (
    <>
      <div className="page-head">
        <h1>{t('postDeal')}</h1>
        {needsModeration(viewer.user.role, viewer.user.approvedDeals) ? <p className="lead">{t('pendingNotice')}</p> : null}
      </div>
      <Notice t={t} error={query.error} />
      <form action={postDeal} className="panel panel-pad form-grid" style={{ maxWidth: 720, marginTop: 16 }}>
        <input type="hidden" name="lang" value={lang} />
        <div className="field">
          <label htmlFor="title">{t('dealTitle')}</label>
          <input id="title" name="title" className="input" required minLength={10} maxLength={140} aria-describedby="title-hint" />
          <span id="title-hint" className="field-hint">
            {t('dealTitleHint')}
          </span>
        </div>
        <div className="two-col">
          <div className="field">
            <label htmlFor="shop">{t('dealShop')}</label>
            <input id="shop" name="shop" className="input" required minLength={2} maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="category">{t('dealCategory')}</label>
            <select id="category" name="category" className="select" required defaultValue="">
              <option value="" disabled>
                {t('dealCategory')}
              </option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {lang === 'bn' ? c.nameBn : c.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="two-col">
          <div className="field">
            <label htmlFor="price">{t('dealPrice')}</label>
            <input id="price" name="price" className="input" inputMode="numeric" />
          </div>
          <div className="field">
            <label htmlFor="regular">{t('dealRegular')}</label>
            <input id="regular" name="regular" className="input" inputMode="numeric" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="url">{t('dealLink')}</label>
          <input id="url" name="url" type="url" className="input" placeholder="https://" />
        </div>
        <div className="two-col">
          <div className="field">
            <label htmlFor="code">{t('dealCode')}</label>
            <input id="code" name="code" className="input" maxLength={40} />
          </div>
          <div className="field">
            <label htmlFor="method">{t('dealMethod')}</label>
            <select id="method" name="method" className="select" defaultValue="">
              <option value="">{t('none')}</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field" style={{ maxWidth: 260 }}>
          <label htmlFor="expires">{t('dealExpires')}</label>
          <input id="expires" name="expires" type="date" className="input" min={viewer.today} />
        </div>
        <div className="field">
          <label htmlFor="body">{t('dealBody')}</label>
          <textarea id="body" name="body" className="textarea" maxLength={2000} aria-describedby="body-hint" />
          <span id="body-hint" className="field-hint">
            {t('dealBodyHint')}
          </span>
        </div>
        <div>
          <button className="btn" type="submit">
            {t('submitDeal')}
          </button>
        </div>
      </form>
    </>
  );
}

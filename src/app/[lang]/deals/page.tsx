import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DealRow } from '@/components/Community';
import { Notice } from '@/components/Commerce';
import { getDb } from '@/lib/db';
import { isLang } from '@/lib/format';
import { translator, type Key } from '@/lib/i18n';
import { listCategories } from '@/lib/repo/catalog';
import { listDeals, userVote, type DealTab } from '@/lib/repo/deals';
import { getViewer } from '@/lib/session';

const TABS: Array<[DealTab, Key]> = [
  ['hot', 'tabHot'],
  ['new', 'tabNew'],
  ['discussed', 'tabDiscussed'],
];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: translator(isLang(lang) ? lang : 'bn')('dealsTitle') };
}

export default async function DealsPage({
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
  const viewer = await getViewer();
  const categories = listCategories(db);
  const tab: DealTab = TABS.some(([k]) => k === query.tab) ? (query.tab as DealTab) : 'hot';
  const cat = categories.some((c) => c.slug === query.cat) ? query.cat : undefined;
  const deals = listDeals(db, { tab, category: cat, today: viewer.today });

  const href = (next: { tab?: DealTab; cat?: string | null }) => {
    const p = new URLSearchParams();
    const tb = next.tab ?? tab;
    const ct = next.cat === null ? undefined : (next.cat ?? cat);
    if (tb !== 'hot') p.set('tab', tb);
    if (ct) p.set('cat', ct);
    const s = p.toString();
    return `/${lang}/deals${s ? `?${s}` : ''}`;
  };
  const here = href({});

  return (
    <>
      <div className="page-head" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, alignItems: 'end' }}>
        <div>
          <h1>{t('dealsTitle')}</h1>
          <p className="lead">{t('dealsLead')}</p>
        </div>
        <Link className="btn" href={`/${lang}/deals/new`}>
          {t('postDeal')}
        </Link>
      </div>
      <Notice t={t} error={query.error} />
      <nav className="tabs" aria-label={t('dealsTitle')}>
        {TABS.map(([k, label]) => (
          <Link key={k} href={href({ tab: k })} aria-current={tab === k ? 'page' : undefined}>
            {t(label)}
          </Link>
        ))}
      </nav>
      <nav className="cat-filter" aria-label={t('dealCategory')}>
        <Link href={href({ cat: null })} aria-current={!cat ? 'page' : undefined}>
          {t('allCategories')}
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} href={href({ cat: c.slug })} aria-current={cat === c.slug ? 'page' : undefined}>
            {lang === 'bn' ? c.nameBn : c.nameEn}
          </Link>
        ))}
      </nav>
      {deals.length > 0 ? (
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
      ) : (
        <p className="notice">
          {t('noDeals')} <Link href={`/${lang}/deals/new`}>{t('postDeal')}</Link>
        </p>
      )}
    </>
  );
}

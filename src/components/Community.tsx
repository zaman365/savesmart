import Link from 'next/link';
import { vote } from '@/app/actions';
import { ago, money, num, shortDate, type Lang } from '@/lib/format';
import type { Translate } from '@/lib/i18n';
import { isExpired, type Deal } from '@/lib/repo/deals';
import { temperatureLevel } from '@/lib/temperature';
import { FlameIcon, SnowIcon } from './Icons';

export function TempControl({
  deal,
  lang,
  t,
  myVote,
  returnTo,
  interactive,
}: {
  deal: Deal;
  lang: Lang;
  t: Translate;
  myVote: -1 | 0 | 1;
  returnTo: string;
  interactive: boolean;
}) {
  const level = temperatureLevel(deal.temperature);
  const value = (
    <span className="temp-value" aria-label={`${t('temperature')}: ${num(deal.temperature, lang)}°`}>
      {num(deal.temperature, lang)}°
    </span>
  );
  if (!interactive) return <div className={`temp temp-static temp-${level}`}>{value}</div>;
  return (
    <div className={`temp temp-${level}`}>
      <form action={vote}>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="dealId" value={deal.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          className="temp-btn temp-btn-cold"
          type="submit"
          name="value"
          value="-1"
          aria-pressed={myVote === -1}
          aria-label={myVote === -1 ? t('youVotedCold') : t('voteCold')}
          title={t('voteCold')}
        >
          <SnowIcon />
        </button>
        {value}
        <button
          className="temp-btn temp-btn-hot"
          type="submit"
          name="value"
          value="1"
          aria-pressed={myVote === 1}
          aria-label={myVote === 1 ? t('youVotedHot') : t('voteHot')}
          title={t('voteHot')}
        >
          <FlameIcon />
        </button>
      </form>
    </div>
  );
}

export function DealMeta({ deal, lang, t, today }: { deal: Deal; lang: Lang; t: Translate; today: string }) {
  const expired = isExpired(deal, today);
  return (
    <div className="meta">
      <span>{deal.shopName}</span>
      {deal.methodName ? <span>{t('withMethod', { method: deal.methodName })}</span> : null}
      <span>{t('postedBy', { name: deal.userName })}</span>
      <span>{ago(deal.createdAt, lang)}</span>
      {deal.commentCount > 0 ? (
        <span>{deal.commentCount === 1 ? t('commentsOne') : t('commentsCount', { n: num(deal.commentCount, lang) })}</span>
      ) : null}
      {expired ? <span className="tag tag-expired">{t('expired')}</span> : null}
      {!expired && deal.expiresOn ? <span>{t('endsOn', { date: shortDate(deal.expiresOn, lang) })}</span> : null}
      {deal.status === 'pending' ? <span className="tag tag-pending">{t('pendingBadge')}</span> : null}
    </div>
  );
}

export function DealRow({
  deal,
  lang,
  t,
  today,
  myVote,
  returnTo,
}: {
  deal: Deal;
  lang: Lang;
  t: Translate;
  today: string;
  myVote: -1 | 0 | 1;
  returnTo: string;
}) {
  const expired = isExpired(deal, today);
  return (
    <li id={`deal-${deal.id}`} className={`deal${expired ? ' deal-expired' : ''}`}>
      <TempControl deal={deal} lang={lang} t={t} myVote={myVote} returnTo={`${returnTo}#deal-${deal.id}`} interactive={!expired && deal.status === 'published'} />
      <div>
        <Link className="deal-title" href={`/${lang}/deals/${deal.id}`}>
          {deal.title}
        </Link>
        <DealMeta deal={deal} lang={lang} t={t} today={today} />
        {deal.voucherCode ? (
          <span className="code">
            <span className="code-label">{t('code')}</span>
            {deal.voucherCode}
          </span>
        ) : null}
      </div>
      <div className="deal-price">
        {deal.price ? <div className="price-strong">{money(deal.price, lang)}</div> : null}
        {deal.regularPrice && deal.price && deal.regularPrice > deal.price ? <div className="price-was">{money(deal.regularPrice, lang)}</div> : null}
      </div>
    </li>
  );
}

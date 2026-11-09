import Link from 'next/link';
import { headers } from 'next/headers';
import { translator } from '@/lib/i18n';

export default async function NotFound() {
  const lang = (await headers()).get('x-ss-lang') === 'en' ? 'en' : 'bn';
  const t = translator(lang);
  return (
    <div className="page-head">
      <h1>{t('notFound')}</h1>
      <p style={{ marginTop: 16 }}>
        <Link className="btn" href={`/${lang}`}>
          {t('goHome')}
        </Link>
      </p>
    </div>
  );
}

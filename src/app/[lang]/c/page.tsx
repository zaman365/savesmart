import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryIcon } from '@/components/Icons';
import { getDb } from '@/lib/db';
import { isLang, num } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { listCategories } from '@/lib/repo/catalog';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: translator(isLang(lang) ? lang : 'bn')('compareTitle') };
}

export default async function CategoriesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = translator(lang);
  const categories = listCategories(getDb()).filter((c) => c.productCount > 0);
  return (
    <>
      <div className="page-head">
        <h1>{t('compareTitle')}</h1>
        <p className="lead">{t('homeLead')}</p>
      </div>
      <nav className="category-grid" aria-label={t('compareTitle')}>
        {categories.map((c) => (
          <Link key={c.slug} href={`/${lang}/c/${c.slug}`}>
            <CategoryIcon category={c.slug} />
            <span className="category-name">{lang === 'bn' ? c.nameBn : c.nameEn}</span>
            <span className="small muted">{t('productsCount', { n: num(c.productCount, lang) })}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

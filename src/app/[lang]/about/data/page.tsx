import { notFound } from 'next/navigation';
import { isDemo } from '@/lib/db';
import { isLang } from '@/lib/format';
import { translator } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: translator(isLang(lang) ? lang : 'bn')('dataSources') };
}

export default async function DataPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = translator(lang);
  const demo = isDemo();

  if (lang === 'bn') {
    return (
      <article className="prose page-head">
        <h1>{t('dataSources')}</h1>
        {demo ? (
          <p className="notice" style={{ marginTop: 16 }}>
            এই সাইটটি এখন ডেমো মোডে চলছে। Padma Tech, Meghna Digital-এর মতো দোকানের নাম বানানো, আর সব দাম, অফার, ডিল ও বেশিরভাগ প্যাক উদাহরণ মাত্র। ব্যাংক, ওয়ালেট, অপারেটর ও পণ্যের নাম শুধু উদাহরণ হিসেবে ব্যবহার করা হয়েছে; তাদের সাথে কোনো অংশীদারত্ব নেই।
          </p>
        ) : null}
        <h2>দোকানের দাম</h2>
        <p>দোকান নিজে বা তাদের অ্যাফিলিয়েট প্রোগ্রাম থেকে পাওয়া ফিড ব্যবহার করা হবে। দোকানের লিখিত অনুমতি ছাড়া কোনো সাইট থেকে দাম সংগ্রহ করা হয় না। প্রতিটি দামের পাশে লেখা থাকে কখন যাচাই করা হয়েছে।</p>
        <h2>পেমেন্ট অফার</h2>
        <p>ব্যাংক ও ওয়ালেটের প্রকাশিত শর্ত থেকে নেওয়া হয়: শতাংশ, সর্বোচ্চ সীমা, ন্যূনতম কেনাকাটা, দোকান, ক্যাটাগরি ও মেয়াদ।</p>
        <h2>মোবাইল প্যাক</h2>
        <p>অপারেটরের প্রকাশিত তথ্য বা সংবাদ থেকে নেওয়া, সাথে সূত্রের লিংক। প্যাক প্রায়ই বদলায়, তাই কেনার আগে অপারেটরের অ্যাপে মিলিয়ে নিন।</p>
        <h2>আপনার তথ্য</h2>
        <p>আমরা শুধু আপনার ইমেইল, নাম, পাসওয়ার্ডের হ্যাশ আর বেছে নেওয়া ওয়ালেট-কার্ডের নাম রাখি। কার্ড নম্বর, পিন বা ফোন নম্বর নিই না। ব্যক্তিগত উপাত্ত সুরক্ষা অধ্যাদেশ ২০২৫ অনুযায়ী আপনার সম্মতি নিয়েই তথ্য রাখা হয়।</p>
      </article>
    );
  }

  return (
    <article className="prose page-head">
      <h1>{t('dataSources')}</h1>
      {demo ? (
        <p className="notice" style={{ marginTop: 16 }}>
          This site is running in demo mode. Shop names such as Padma Tech and Meghna Digital are invented, and all prices, offers, deals and most packs are illustrative.
          Bank, wallet, operator and product names are used only as examples; there is no partnership with them.
        </p>
      ) : null}
      <h2>Shop prices</h2>
      <p>Prices come from feeds supplied by shops or their affiliate programmes. We do not collect prices from any site without the shop’s written permission. Every price shows when it was last checked.</p>
      <h2>Payment offers</h2>
      <p>Taken from the published terms of banks and wallets: percentage, cap, minimum spend, shop, category and dates.</p>
      <h2>Mobile packs</h2>
      <p>Taken from operators’ published information or news reports, with a link to the source. Packs change often, so confirm in your operator’s app before buying.</p>
      <h2>Your data</h2>
      <p>We keep only your email, name, a password hash and the names of the wallets and cards you pick. We never ask for card numbers, PINs or phone numbers. Data is kept with your consent, in line with Bangladesh’s Personal Data Protection Ordinance 2025.</p>
    </article>
  );
}

import { notFound } from 'next/navigation';
import { isLang } from '@/lib/format';
import { translator } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return { title: translator(isLang(lang) ? lang : 'bn')('howWeRank') };
}

export default async function RankingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = translator(lang);

  if (lang === 'bn') {
    return (
      <article className="prose page-head">
        <h1>{t('howWeRank')}</h1>
        <p className="lead">কেউ টাকা দিয়ে SaveSmart-এর ক্রমে জায়গা কিনতে পারে না।</p>
        <h2>দোকানের দাম</h2>
        <p>প্রতিটি পণ্যের দোকানগুলো আপনার আসল দাম অনুযায়ী সাজানো হয়:</p>
        <div className="formula">আসল দাম = দোকানের দাম + ডেলিভারি − আপনার ব্যবহারযোগ্য সেরা পেমেন্ট অফার</div>
        <ul>
          <li>পেমেন্ট অফার তখনই ধরা হয় যখন সেটি আজ চালু, আপনার বেছে নেওয়া ওয়ালেট বা কার্ডের, এই দোকান ও ক্যাটাগরিতে প্রযোজ্য, আর ন্যূনতম কেনাকাটার শর্ত পূরণ হয়।</li>
          <li>সর্বোচ্চ সীমা (যেমন “সর্বোচ্চ ৳৩০০”) সবসময় হিসাবে ধরা হয়।</li>
          <li>দুটো দাম সমান হলে আগে অফিসিয়াল ওয়ারেন্টি, তারপর স্টকে থাকা, তারপর কম দোকান-দাম।</li>
          <li>ক্যাশব্যাক পরে ফেরত আসে, তবুও খরচ কমায় বলে আসল দামে ধরা হয়, আর আলাদা করে লেখা থাকে।</li>
        </ul>
        <h2>কমিউনিটির ডিল</h2>
        <ul>
          <li>প্রতিটি গরম ভোট +৪°, ঠান্ডা ভোট −৪°। একজন সদস্য একটি ডিলে একটি ভোট দিতে পারেন, পরে বদলাতেও পারেন।</li>
          <li>“গরম” তালিকায় তাপমাত্রা সময়ের সাথে কমে আসে, যাতে নতুন ভালো ডিল ওপরে উঠতে পারে।</li>
          <li>নতুন সদস্যদের প্রথম ৩টি ডিল মডারেটর যাচাই করেন।</li>
        </ul>
        <h2>মোবাইল প্যাক</h2>
        <p>আপনার মাসিক ডেটা ও মিনিটের জন্য কতবার কিনতে হবে তা হিসাব করে মাসের মোট খরচ অনুযায়ী প্যাক সাজানো হয়।</p>
        <h2>কমিশন</h2>
        <p>দোকানে যাওয়ার লিংক থেকে SaveSmart কমিশন পেতে পারে। কমিশন কোনো ক্রমে প্রভাব ফেলে না। স্পন্সর করা কিছু দেখালে তা আলাদা জায়গায় “বিজ্ঞাপন” লেখা থাকবে।</p>
      </article>
    );
  }

  return (
    <article className="prose page-head">
      <h1>{t('howWeRank')}</h1>
      <p className="lead">Nobody can pay for a position on SaveSmart.</p>
      <h2>Shop prices</h2>
      <p>Shops for each product are ordered by your real price:</p>
      <div className="formula">real price = shop price + delivery − the best payment offer you can use</div>
      <ul>
        <li>A payment offer counts only when it runs today, belongs to a wallet or card you picked, applies to this shop and category, and the minimum spend is met.</li>
        <li>Caps such as “up to ৳300” are always applied.</li>
        <li>On equal real prices, official warranty comes first, then in stock, then the lower shop price.</li>
        <li>Cashback arrives later but still lowers your cost, so it counts toward the real price and is labelled as cashback.</li>
      </ul>
      <h2>Community deals</h2>
      <ul>
        <li>Each hot vote adds 4°, each cold vote takes 4° away. One vote per member per deal; you can change it.</li>
        <li>In the Hot feed, temperature fades with age so new good deals can rise.</li>
        <li>A moderator checks a new member’s first 3 deals.</li>
      </ul>
      <h2>Mobile packs</h2>
      <p>Packs are ordered by what they cost you in a month: how many times you would buy each pack to cover your data and minutes.</p>
      <h2>Commissions</h2>
      <p>SaveSmart may earn a commission when you go to a shop. Commissions never change any order. Anything sponsored will sit in a separate place, labelled as an ad.</p>
    </article>
  );
}

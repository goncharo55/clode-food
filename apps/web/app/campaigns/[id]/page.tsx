import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCampaignById, getCampaignsByChain } from "@/lib/queries";
import { chainEmoji } from "@/lib/chainVisuals";
import { CampaignBadges } from "@/components/CampaignBadges";
import CampaignCard from "@/components/CampaignCard";
import { formatPeriodJa, formatDateJa } from "@/lib/dates";
import { campaignLinkUrl } from "@/lib/campaignLink";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "published" },
    select: { id: true },
  });
  return campaigns.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) return {};

  const title = `${campaign.title}はいつまで？｜${campaign.chain.name}`;
  const description =
    `${campaign.chain.name}（チェーン店）の期間限定「${campaign.title}」はいつまで？` +
    `${formatPeriodJa(campaign.startDate, campaign.endDate)}。対象商品・対象店舗の詳細を紹介。` +
    (campaign.description ? ` ${campaign.description}` : "");

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

type TargetProduct = { name: string; price?: number };

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign || campaign.status === "draft") notFound();

  const targetProducts = Array.isArray(campaign.targetProducts)
    ? (campaign.targetProducts as unknown as TargetProduct[])
    : [];
  const officialLinkUrl = campaignLinkUrl(campaign, campaign.chain);
  const hasSpecificSourceUrl = Boolean(campaign.sourceUrl?.trim());

  const sameChainCampaigns = (await getCampaignsByChain(campaign.chainId))
    .filter((c) => c.id !== campaign.id)
    .slice(0, 4);

  const untilAnswer = campaign.endDate
    ? `${formatDateJa(campaign.endDate)}までの予定です（${campaign.chain.name}調べ）。実際の終了日は店舗や在庫状況により前後する場合があるため、最新情報は公式サイトでご確認ください。`
    : `終了日は明記されておらず、「なくなり次第終了」となる可能性があります。最新情報は公式サイトでご確認ください。`;

  const areaAnswer =
    campaign.areas.length > 0
      ? `${campaign.areas.map(({ area }) => area.name).join("・")}エリアの対象店舗で実施中です。`
      : `全国の${campaign.chain.name}各店で実施中です（一部取り扱いのない店舗がある場合があります）。`;

  const priceAnswer =
    targetProducts.length > 0 && targetProducts.some((p) => typeof p.price === "number")
      ? targetProducts
          .filter((p) => typeof p.price === "number")
          .map((p) => `${p.name}が${p.price!.toLocaleString()}円`)
          .join("、") + "です（価格は店舗により異なる場合があります）。"
      : "価格は公式サイトまたは店頭でご確認ください。";

  const faqItems = [
    { question: `${campaign.title}はいつまで？`, answer: untilAnswer },
    { question: "対象店舗はどこ？", answer: areaAnswer },
    { question: "値段はいくら？", answer: priceAnswer },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: campaign.title,
    startDate: campaign.startDate.toISOString().slice(0, 10),
    ...(campaign.endDate ? { endDate: campaign.endDate.toISOString().slice(0, 10) } : {}),
    description: campaign.description ?? campaign.title,
    image: campaign.imageUrl ? [campaign.imageUrl] : undefined,
    url: `${SITE_URL}/campaigns/${campaign.id}`,
    organizer: {
      "@type": "Organization",
      name: campaign.chain.name,
      url: campaign.chain.officialSiteUrl,
    },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Link
        href={`/chains/${campaign.chain.slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-600"
      >
        <span className="text-lg">{chainEmoji(campaign.chain.slug)}</span>
        {campaign.chain.name}
      </Link>

      <h1 className="mt-2 text-3xl font-bold text-gray-900">{campaign.title}</h1>
      <p className="mt-1 text-lg font-semibold text-orange-600">はいつまで？</p>

      <div className="mt-3">
        <CampaignBadges
          startDate={campaign.startDate}
          endDate={campaign.endDate}
          featured={campaign.featured}
        />
      </div>

      {campaign.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="mt-5 w-full rounded-xl border border-gray-200 object-cover"
        />
      )}

      <dl className="mt-6 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-28 shrink-0 text-sm font-semibold text-gray-500">開催期間</dt>
          <dd className="text-gray-900">{formatPeriodJa(campaign.startDate, campaign.endDate)}</dd>
        </div>
        {targetProducts.length > 0 && (
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-28 shrink-0 text-sm font-semibold text-gray-500">対象商品</dt>
            <dd className="text-gray-900">
              <ul className="space-y-1">
                {targetProducts.map((p, i) => (
                  <li key={i}>
                    {p.name}
                    {typeof p.price === "number" && (
                      <span className="text-gray-500"> （{p.price.toLocaleString()}円）</span>
                    )}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {campaign.areas.length > 0 && (
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-28 shrink-0 text-sm font-semibold text-gray-500">対象エリア</dt>
            <dd className="flex flex-wrap gap-2">
              {campaign.areas.map(({ area }) => (
                <Link
                  key={area.id}
                  href={`/areas/${area.slug}`}
                  className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700 hover:bg-orange-100"
                >
                  {area.name}
                </Link>
              ))}
            </dd>
          </div>
        )}
        {campaign.areas.length === 0 && (
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-28 shrink-0 text-sm font-semibold text-gray-500">対象エリア</dt>
            <dd className="text-gray-900">全国の対象店舗</dd>
          </div>
        )}
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-28 shrink-0 text-sm font-semibold text-gray-500">公式情報</dt>
          <dd>
            <a
              href={officialLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-orange-600 hover:underline"
            >
              {hasSpecificSourceUrl ? "公式サイトで詳細を見る ↗" : `${campaign.chain.name}の公式サイトを見る ↗`}
            </a>
          </dd>
        </div>
      </dl>

      {campaign.description && (
        <p className="mt-6 leading-relaxed text-gray-700">{campaign.description}</p>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold">よくある質問</h2>
        <dl className="mt-4 space-y-4">
          {faqItems.map((item) => (
            <div key={item.question} className="rounded-xl border border-gray-200 bg-white p-4">
              <dt className="font-semibold text-gray-900">Q. {item.question}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-gray-600">A. {item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {sameChainCampaigns.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">
            {chainEmoji(campaign.chain.slug)} {campaign.chain.name}の他の期間限定
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sameChainCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
          <Link
            href={`/chains/${campaign.chain.slug}`}
            className="mt-4 inline-block text-sm text-orange-600 hover:underline"
          >
            {campaign.chain.name}の期間限定を全て見る →
          </Link>
        </section>
      )}
    </div>
  );
}

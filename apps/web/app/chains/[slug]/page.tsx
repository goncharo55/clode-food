import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllChains, getChainBySlug, getCampaignsByChain, parseSort } from "@/lib/queries";
import { chainEmoji } from "@/lib/chainVisuals";
import CampaignCard from "@/components/CampaignCard";
import SortTabs from "@/components/SortTabs";

export const revalidate = 3600;

export async function generateStaticParams() {
  const chains = await getAllChains();
  return chains.map((chain) => ({ slug: chain.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const chain = await getChainBySlug(slug);
  if (!chain) return {};

  return {
    title: `${chain.name}の期間限定メニュー・キャンペーン一覧`,
    description: `${chain.name}で現在開催中・開催予定の期間限定メニューやキャンペーンをまとめて紹介。${
      chain.description ?? ""
    }`,
  };
}

export default async function ChainDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const chain = await getChainBySlug(slug);
  if (!chain) notFound();

  const sort = parseSort((await searchParams).sort);
  const campaigns = await getCampaignsByChain(chain.id, sort);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{chainEmoji(chain.slug)}</span>
        <div>
          <h1 className="text-2xl font-bold">{chain.name}</h1>
          <a
            href={chain.officialSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-600 hover:underline"
          >
            公式サイトを見る ↗
          </a>
        </div>
      </div>
      {chain.description && <p className="mt-3 text-gray-600">{chain.description}</p>}

      <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold">現在開催中・開催予定のキャンペーン</h2>
        <SortTabs basePath={`/chains/${chain.slug}`} current={sort} />
      </div>

      {campaigns.length === 0 ? (
        <p className="mt-6 text-gray-500">現在開催中のキャンペーン情報はありません。</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

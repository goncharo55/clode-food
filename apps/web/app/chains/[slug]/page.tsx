import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllChains, getChainBySlug, getCampaignsByChain } from "@/lib/queries";
import { chainEmoji } from "@/lib/chainVisuals";
import { currentYearMonthJa } from "@/lib/dates";
import SortTabs from "@/components/SortTabs";
import SortTabsClient from "@/components/SortTabsClient";
import ChainCampaignGrid, { ChainCampaignGridView } from "@/components/ChainCampaignGrid";

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

  const yearMonth = currentYearMonthJa();
  return {
    title: `${chain.name} 新作・期間限定メニューまとめ【${yearMonth}】`,
    description: `${chain.name}の新作・期間限定メニューやキャンペーンを${yearMonth}最新版でまとめて紹介。${
      chain.description ?? ""
    }`,
  };
}

export default async function ChainDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chain = await getChainBySlug(slug);
  if (!chain) notFound();

  // 並び替えはクライアント側(ChainCampaignGrid)で行う。ここでsearchParamsを
  // 読むとページ全体が動的レンダリング扱いになり、ISRキャッシュが効かなくなるため、
  // 並び替えに関わらず同じ固定順で1回だけ取得する
  const campaigns = await getCampaignsByChain(chain.id);

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
        <Suspense fallback={<SortTabs basePath={`/chains/${chain.slug}`} current="ending" />}>
          <SortTabsClient basePath={`/chains/${chain.slug}`} />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <ChainCampaignGridView campaigns={campaigns} emptyMessage="現在開催中のキャンペーン情報はありません。" />
        }
      >
        <ChainCampaignGrid campaigns={campaigns} emptyMessage="現在開催中のキャンペーン情報はありません。" />
      </Suspense>
    </div>
  );
}

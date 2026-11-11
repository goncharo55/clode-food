import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllAreas, getAreaBySlug, getCampaignsByArea } from "@/lib/queries";
import SortTabs from "@/components/SortTabs";
import SortTabsClient from "@/components/SortTabsClient";
import AreaCampaignGroups, { AreaCampaignGroupsView } from "@/components/AreaCampaignGroups";
import { groupByChain } from "@/lib/campaignGrouping";

export const revalidate = 3600;

export async function generateStaticParams() {
  const areas = await getAllAreas();
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = await getAreaBySlug(slug);
  if (!area) return {};

  return {
    title: `${area.name}周辺の期間限定メニュー・キャンペーン`,
    description: `${area.name}駅周辺で今すぐ体験できる期間限定メニュー・キャンペーンをチェーン別に一覧表示。`,
  };
}

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = await getAreaBySlug(slug);
  if (!area) notFound();

  // 並び替えはクライアント側(AreaCampaignGroups)で行う。ここでsearchParamsを
  // 読むとページ全体が動的レンダリング扱いになり、ISRキャッシュが効かなくなるため、
  // 並び替えに関わらず同じ固定順で1回だけ取得する
  const campaigns = await getCampaignsByArea(area.id);
  const chainCount = new Set(campaigns.map((c) => c.chain.id)).size;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm text-gray-500">{area.region}</p>
      <h1 className="text-2xl font-bold">{area.name}で今すぐ食べられる期間限定</h1>
      <p className="mt-2 text-gray-600">
        {area.name}駅周辺で開催中・開催予定のチェーンをまとめました。どこで何をやっているか、これ一画面でつながります。
      </p>

      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <span className="text-sm font-semibold text-gray-500">
          {chainCount}チェーン・{campaigns.length}件のキャンペーン
        </span>
        <Suspense fallback={<SortTabs basePath={`/areas/${area.slug}`} current="ending" />}>
          <SortTabsClient basePath={`/areas/${area.slug}`} />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <AreaCampaignGroupsView
            groups={groupByChain(campaigns)}
            areaName={area.name}
            emptyMessage={`現在、${area.name}に該当する期間限定情報はありません。全国区のキャンペーンが追加され次第表示されます。`}
          />
        }
      >
        <AreaCampaignGroups
          campaigns={campaigns}
          areaName={area.name}
          emptyMessage={`現在、${area.name}に該当する期間限定情報はありません。全国区のキャンペーンが追加され次第表示されます。`}
        />
      </Suspense>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllAreas,
  getAreaBySlug,
  getCampaignsByArea,
  parseSort,
  type CampaignWithRelations,
} from "@/lib/queries";
import { chainEmoji } from "@/lib/chainVisuals";
import { googleMapsSearchUrl } from "@/lib/googleMaps";
import CampaignCard from "@/components/CampaignCard";
import SortTabs from "@/components/SortTabs";

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

function groupByChain(campaigns: CampaignWithRelations[]) {
  const groups = new Map<string, CampaignWithRelations[]>();
  for (const c of campaigns) {
    const key = c.chain.id;
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }
  return [...groups.values()].sort((a, b) => a[0].chain.name.localeCompare(b[0].chain.name, "ja"));
}

export default async function AreaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const area = await getAreaBySlug(slug);
  if (!area) notFound();

  const sort = parseSort((await searchParams).sort);
  const campaigns = await getCampaignsByArea(area.id, sort);
  const groups = groupByChain(campaigns);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm text-gray-500">{area.region}</p>
      <h1 className="text-2xl font-bold">{area.name}で今すぐ食べられる期間限定</h1>
      <p className="mt-2 text-gray-600">
        {area.name}駅周辺で開催中・開催予定のチェーンをまとめました。どこで何をやっているか、これ一画面でつながります。
      </p>

      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <span className="text-sm font-semibold text-gray-500">
          {groups.length}チェーン・{campaigns.length}件のキャンペーン
        </span>
        <SortTabs basePath={`/areas/${area.slug}`} current={sort} />
      </div>

      {groups.length === 0 ? (
        <p className="mt-8 text-gray-500">
          現在、{area.name}に該当する期間限定情報はありません。全国区のキャンペーンが追加され次第表示されます。
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {groups.map((items) => (
            <section key={items[0].chain.id}>
              <h2 className="flex items-center gap-2 text-lg font-bold border-b border-gray-200 pb-2">
                <span className="text-2xl">{chainEmoji(items[0].chain.slug)}</span>
                {items[0].chain.name}
                <span className="text-sm font-normal text-gray-500">
                  {items.length}件開催中
                </span>
                <a
                  href={googleMapsSearchUrl(`${items[0].chain.name} ${area.name}駅`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs font-normal text-gray-400 hover:text-orange-600"
                >
                  📍 近くの店舗をGoogleマップで探す ↗
                </a>
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

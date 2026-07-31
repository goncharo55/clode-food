import type { Metadata } from "next";
import Link from "next/link";
import { getEndingSoonCampaigns, getCurrentCampaigns, getAllChains } from "@/lib/queries";
import CampaignCard from "@/components/CampaignCard";
import StationSearchForm from "@/components/StationSearchForm";
import AdSlot from "@/components/AdSlot";
import EventGanttCalendar from "@/components/EventGanttCalendar";
import { chainEmoji } from "@/lib/chainVisuals";
import { currentYearMonthJa } from "@/lib/dates";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  const yearMonth = currentYearMonthJa();
  return {
    title: `${SITE_NAME}｜マック・スタバなど新作・期間限定メニューまとめ【${yearMonth}】`,
    description: `${yearMonth}の飲食チェーン新作・期間限定メニュー・キャンペーンをまとめて検索。今日は何を食べよう？を30秒で見つけられます。`,
  };
}

export default async function HomePage() {
  const [endingSoon, featured, chains] = await Promise.all([
    getEndingSoonCampaigns(8),
    getCurrentCampaigns("popular"),
    getAllChains(),
  ]);

  return (
    <div>
      <section className="bg-gradient-to-b from-orange-50 to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            今日は何を食べよう？を30秒で。
          </h1>
          <p className="mt-3 text-gray-600">
            飲食チェーンの期間限定メニュー・キャンペーンをまとめて検索。駅名を入れれば、今その街で体験できる期間限定が一覧でわかります。
          </p>
          <div className="mt-6 mx-auto max-w-md">
            <StationSearchForm />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">⏰ 終了間近（行き忘れ注意）</h2>
            <Link href="/calendar?sort=ending" className="text-sm text-orange-600 hover:underline">
              すべて見る →
            </Link>
          </div>
          {endingSoon.length === 0 ? (
            <p className="mt-4 text-gray-500">現在、終了間近のキャンペーンはありません。</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {endingSoon.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🗓️ イベントカレンダー</h2>
            <Link href="/calendar" className="text-sm text-orange-600 hover:underline">
              大きい画面で見る →
            </Link>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            いつ・どのチェーンで何が開催されているか、色でひと目でわかります。
          </p>
          <div className="mt-4">
            <EventGanttCalendar campaigns={featured} />
          </div>
        </section>

        <AdSlot />

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🔥 注目の期間限定</h2>
            <Link href="/calendar?sort=popular" className="text-sm text-orange-600 hover:underline">
              すべて見る →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.slice(0, 8).map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold">チェーンから探す</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {chains.map((chain) => (
              <Link
                key={chain.id}
                href={`/chains/${chain.slug}`}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:border-orange-300"
              >
                <span className="text-lg">{chainEmoji(chain.slug)}</span>
                {chain.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

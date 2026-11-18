import type { Metadata } from "next";
import Link from "next/link";
import {
  getEndingSoonCampaigns,
  getNewOrUpcomingCampaigns,
  getCurrentCampaigns,
  getAllChains,
} from "@/lib/queries";
import CampaignCard from "@/components/CampaignCard";
import StationSearchForm from "@/components/StationSearchForm";
import AdSlot from "@/components/AdSlot";
import EventGanttCalendar from "@/components/EventGanttCalendar";
import RankingList from "@/components/RankingList";
import { chainEmoji } from "@/lib/chainVisuals";
import { currentYearMonthJa } from "@/lib/dates";
import { SITE_NAME } from "@/lib/site";
import { getRanking } from "@/lib/reactions";

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  const yearMonth = currentYearMonthJa();
  return {
    title: `${SITE_NAME}｜マック・スタバなどチェーン店の新作・期間限定メニューまとめ【${yearMonth}】`,
    description: `マック・スタバ・すき家など、飲食チェーン店の新作・期間限定メニューをまとめてチェック。${yearMonth}の最新情報を一覧で検索できます。`,
  };
}

export default async function HomePage() {
  const [endingSoon, newOrUpcoming, featured, chains, wantToEatRanking] = await Promise.all([
    getEndingSoonCampaigns(8),
    getNewOrUpcomingCampaigns(8),
    getCurrentCampaigns("popular"),
    getAllChains(),
    getRanking("want_to_eat", 3),
  ]);

  return (
    <div>
      <section className="bg-gradient-to-b from-orange-50 to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            期間限定、見逃していませんか？
          </h1>
          <p className="mt-3 text-gray-600">
            マック・スタバ・すき家など、飲食チェーン店の期間限定メニューをまとめてチェック。駅名を入れれば、今その街で体験できる期間限定が一覧でわかります。
          </p>
          <div className="mt-6 mx-auto max-w-md">
            <StationSearchForm />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🆕 新着・まもなく開始</h2>
            <Link href="/calendar?sort=starting" className="text-sm text-orange-600 hover:underline">
              すべて見る →
            </Link>
          </div>
          {newOrUpcoming.length === 0 ? (
            <p className="mt-4 text-gray-500">現在、新着・開始予定のキャンペーンはありません。</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {newOrUpcoming.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
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

        {wantToEatRanking.length > 0 && (
          <section className="mt-10 rounded-xl border border-orange-100 bg-orange-50/50 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">🙋 今週の「食べたい」ランキング</h2>
              <Link href="/ranking" className="text-sm text-orange-600 hover:underline">
                ランキングを見る →
              </Link>
            </div>
            <div className="mt-3">
              <RankingList kind="want_to_eat" entries={wantToEatRanking} compact />
            </div>
          </section>
        )}

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

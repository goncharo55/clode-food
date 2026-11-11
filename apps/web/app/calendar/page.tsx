import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentCampaigns } from "@/lib/queries";
import { currentYearMonthJa } from "@/lib/dates";
import SortTabs from "@/components/SortTabs";
import SortTabsClient from "@/components/SortTabsClient";
import CalendarCampaignSections, { CalendarCampaignSectionsView } from "@/components/CalendarCampaignSections";
import EventGanttCalendar from "@/components/EventGanttCalendar";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const yearMonth = currentYearMonthJa();
  return {
    title: `期間限定イベントカレンダー【${yearMonth}最新】`,
    description: `${yearMonth}時点の飲食チェーンの新作・期間限定メニュー・キャンペーンを開始日・終了間近・人気順・新着順で一覧チェック。`,
  };
}

export default async function CalendarPage() {
  // 並び替えはクライアント側(CalendarCampaignSections)で行う。ここでsearchParamsを
  // 読むとページ全体が動的レンダリング扱いになり、ISRキャッシュが効かなくなるため、
  // 並び替えに関わらず同じ固定順で1回だけ取得する
  const campaigns = await getCurrentCampaigns();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">期間限定イベントカレンダー</h1>
        <Link href="/calendar/history" className="text-sm text-orange-600 hover:underline">
          過去のイベントを見る →
        </Link>
      </div>
      <p className="mt-2 text-gray-600">開催中・開催予定の期間限定メニュー・キャンペーンを一覧でチェック。</p>

      {campaigns.length > 0 && (
        <div className="mt-8">
          <EventGanttCalendar campaigns={campaigns} rangeStartOffset={-14} rangeEndOffset={100} />
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-bold">詳細一覧</h2>
        <div className="mt-3">
          <Suspense fallback={<SortTabs basePath="/calendar" current="ending" />}>
            <SortTabsClient basePath="/calendar" />
          </Suspense>
        </div>
      </div>

      <Suspense
        fallback={
          <CalendarCampaignSectionsView
            campaigns={campaigns}
            sort="ending"
            emptyMessage="現在表示できるキャンペーンがありません。"
          />
        }
      >
        <CalendarCampaignSections campaigns={campaigns} emptyMessage="現在表示できるキャンペーンがありません。" />
      </Suspense>
    </div>
  );
}

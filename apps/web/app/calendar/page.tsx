import type { Metadata } from "next";
import { getCurrentCampaigns, parseSort, type CampaignWithRelations } from "@/lib/queries";
import { dateKey, formatDateWithWeekdayJa } from "@/lib/dates";
import CampaignCard from "@/components/CampaignCard";
import SortTabs from "@/components/SortTabs";
import EventGanttCalendar from "@/components/EventGanttCalendar";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "期間限定イベントカレンダー",
  description:
    "飲食チェーンの期間限定メニュー・キャンペーンを開始日・終了間近・人気順・新着順で一覧チェック。",
};

function groupByStartDate(campaigns: CampaignWithRelations[]) {
  const groups = new Map<string, CampaignWithRelations[]>();
  for (const c of campaigns) {
    const key = dateKey(c.startDate);
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }
  return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const sort = parseSort((await searchParams).sort);
  const campaigns = await getCurrentCampaigns(sort);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">期間限定イベントカレンダー</h1>
      <p className="mt-2 text-gray-600">開催中・開催予定の期間限定メニュー・キャンペーンを一覧でチェック。</p>

      {campaigns.length > 0 && (
        <div className="mt-8">
          <EventGanttCalendar campaigns={campaigns} rangeStartOffset={-14} rangeEndOffset={100} />
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-bold">詳細一覧</h2>
        <div className="mt-3">
          <SortTabs basePath="/calendar" current={sort} />
        </div>
      </div>

      {campaigns.length === 0 ? (
        <p className="mt-8 text-gray-500">現在表示できるキャンペーンがありません。</p>
      ) : sort === "starting" ? (
        <div className="mt-8 space-y-8">
          {groupByStartDate(campaigns).map(([key, items]) => (
            <section key={key}>
              <h2 className="text-sm font-bold text-gray-500 border-b border-gray-200 pb-2">
                {formatDateWithWeekdayJa(items[0].startDate)} 開始
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

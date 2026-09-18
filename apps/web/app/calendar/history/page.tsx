import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublishedCampaigns, type CampaignWithRelations } from "@/lib/queries";
import { currentYearMonthJa } from "@/lib/dates";
import CampaignCard from "@/components/CampaignCard";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const yearMonth = currentYearMonthJa();
  return {
    title: `過去の期間限定イベント一覧【${yearMonth}時点】`,
    description: "終了したものも含め、これまで掲載した飲食チェーンの期間限定メニュー・キャンペーンを月ごとに一覧できます。",
    robots: { index: false, follow: true },
  };
}

function yearMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function yearMonthLabelJa(key: string): string {
  const [year, month] = key.split("-");
  return `${year}年${Number(month)}月`;
}

function groupByYearMonth(campaigns: CampaignWithRelations[]) {
  const groups = new Map<string, CampaignWithRelations[]>();
  for (const c of campaigns) {
    const key = yearMonthKey(c.startDate);
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }
  return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export default async function CalendarHistoryPage() {
  const campaigns = await getAllPublishedCampaigns();
  const groups = groupByYearMonth(campaigns);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/calendar" className="text-sm text-orange-600 hover:underline">
        ← 開催中・開催予定のカレンダーに戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold">過去の期間限定イベント一覧</h1>
      <p className="mt-2 text-gray-600">
        終了したものも含め、これまで掲載した期間限定メニュー・キャンペーンを開始月ごとに振り返れます。
      </p>

      {groups.length === 0 ? (
        <p className="mt-8 text-gray-500">掲載データがありません。</p>
      ) : (
        <div className="mt-8 space-y-10">
          {groups.map(([key, items]) => (
            <section key={key}>
              <h2 className="text-sm font-bold text-gray-500 border-b border-gray-200 pb-2">
                {yearMonthLabelJa(key)}（{items.length}件）
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

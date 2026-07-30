import type { Metadata } from "next";
import { getWeeklyDigest } from "@/lib/digest";
import { formatDateShortJa, formatDateJa } from "@/lib/dates";
import CampaignCard from "@/components/CampaignCard";

export const revalidate = 3600;

function weekTitle(weekStart: Date): string {
  return `${formatDateShortJa(weekStart)}週の期間限定まとめ`;
}

export async function generateMetadata(): Promise<Metadata> {
  const digest = await getWeeklyDigest();
  const title = weekTitle(digest.weekStart);
  return {
    title,
    description: `${title}。今週登場した新商品・今週で終了するキャンペーン・来週以降の注目情報をまとめて解説します。`,
  };
}

export default async function DigestPage() {
  const digest = await getWeeklyDigest();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-gray-500">
        {formatDateJa(digest.weekStart)} 〜 {formatDateJa(digest.weekEnd)}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{weekTitle(digest.weekStart)}</h1>

      <p className="mt-4 leading-relaxed text-gray-700">
        今週は新たに{digest.startingThisWeek.length}件の期間限定メニュー・キャンペーンが登場し、
        {digest.endingThisWeek.length > 0
          ? `${digest.endingThisWeek.length}件が今週中に販売終了を迎える見込みです。`
          : "今週中に終了予定のキャンペーンは確認されていません。"}
        {digest.categoryTrends.length > 0 && (
          <>
            {" "}
            業態別に見ると、現在は
            {digest.categoryTrends
              .slice(0, 2)
              .map((t) => `${t.label}（${t.count}件）`)
              .join("、")}
            が活発に動いている週です。
          </>
        )}
      </p>

      {digest.startingThisWeek.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">🆕 今週スタートした注目メニュー</h2>
          <p className="mt-1 text-sm text-gray-500">
            今週新しく始まった期間限定メニュー・コラボです。気になるものは早めにチェックしましょう。
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {digest.startingThisWeek.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </section>
      )}

      {digest.endingThisWeek.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">⏰ 今週で終了するイベント（行き忘れ注意）</h2>
          <p className="mt-1 text-sm text-gray-500">
            今週中に販売終了・キャンペーン終了となる見込みのメニューです。行きそびれないようご注意ください。
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {digest.endingThisWeek.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </section>
      )}

      {digest.comingUp.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">📅 来週以降に登場予定</h2>
          <p className="mt-1 text-sm text-gray-500">
            数週間先までに開始が予定されている期間限定情報です。早めに知って予定を立てましょう。
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {digest.comingUp.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold">このまとめについて</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          このページは、当サイトが収集した期間限定メニュー・キャンペーン情報をもとに、
          その週の傾向を自動的にまとめたものです。表示内容はアクセス時点の最新データに基づいており、
          週が変わると自動的に更新されます。
        </p>
      </section>
    </div>
  );
}

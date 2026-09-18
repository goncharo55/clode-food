import Link from "next/link";
import { today, isEndingSoon, isNewlyStarted, isStartingSoon, formatPeriodJa } from "@/lib/dates";
import { CATEGORY_VISUALS, categoryVisual, CATEGORY_ORDER } from "@/lib/categoryVisuals";
import { chainEmoji } from "@/lib/chainVisuals";
import type { CampaignWithRelations } from "@/lib/queries";

const LABEL_WIDTH = 200;
const ROW_HEIGHT = 34;
const BAR_HEIGHT = 20;

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

/** 表示日数が増えるほど1日あたりの幅を狭め、3ヶ月規模でも横スクロール量を抑える */
function dayWidthFor(totalDays: number): number {
  if (totalDays <= 40) return 26;
  if (totalDays <= 70) return 20;
  return 16;
}

/**
 * 期間限定イベントを日付軸に沿った色付きの横棒（ガントチャート風）で一覧表示する。
 * 色はチェーンの業態カテゴリ(lib/categoryVisuals.ts)ごとに割り当てる
 * （個別チェーンごとに色分けすると24色になり判別不能なため、7業態カテゴリに集約）。
 */
export default function EventGanttCalendar({
  campaigns,
  rangeStartOffset = -7,
  rangeEndOffset = 60,
}: {
  campaigns: CampaignWithRelations[];
  rangeStartOffset?: number;
  rangeEndOffset?: number;
}) {
  const base = today();
  const rangeStart = addDays(base, rangeStartOffset);
  const rangeEnd = addDays(base, rangeEndOffset);
  const totalDays = diffDays(rangeEnd, rangeStart) + 1;
  const todayColIndex = diffDays(base, rangeStart);
  const DAY_WIDTH = dayWidthFor(totalDays);

  // 今日に近い（＝ユーザーが今関心を持ちやすい）イベントを上の行に表示する。
  // 単純な開始日昇順だと、開始が古いまま長期間続いているイベントが上に固定されてしまうため。
  const rows = campaigns
    .filter((c) => {
      if (c.startDate > rangeEnd) return false;
      if (c.endDate && c.endDate < rangeStart) return false;
      return true;
    })
    .sort((a, b) => Math.abs(diffDays(a.startDate, base)) - Math.abs(diffDays(b.startDate, base)));

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">この期間に表示できるイベントがありません。</p>;
  }

  const days = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));
  const usedCategories = new Set(rows.map((r) => r.chain.category));
  const gridTemplateColumns = `${LABEL_WIDTH}px repeat(${totalDays}, ${DAY_WIDTH}px)`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {CATEGORY_ORDER.filter((cat) => usedCategories.has(cat)).map((cat) => {
          const v = CATEGORY_VISUALS[cat];
          return (
            <span key={cat} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: v.colorLight }}
              />
              {v.label}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
          終了間近（3日以内）
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
          新着・まもなく開始（3日以内）
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <div
          className="grid"
          style={{ gridTemplateColumns, gridAutoRows: `${ROW_HEIGHT}px`, width: "max-content", minWidth: "100%" }}
        >
          {/* 背景バンド: 週末・当日のハイライト（全行にまたがる） */}
          {days.map((d, i) => {
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            if (!isWeekend) return null;
            return (
              <div
                key={`weekend-${i}`}
                aria-hidden
                className="bg-gray-50"
                style={{ gridColumn: `${i + 2} / ${i + 3}`, gridRow: "1 / -1" }}
              />
            );
          })}
          {todayColIndex >= 0 && todayColIndex < totalDays && (
            <div
              aria-hidden
              className="bg-orange-100/60"
              style={{ gridColumn: `${todayColIndex + 2} / ${todayColIndex + 3}`, gridRow: "1 / -1" }}
            />
          )}

          {/* 日付ヘッダー */}
          <div
            className="sticky left-0 z-10 flex items-end bg-white/95 pb-1 pl-2 text-[11px] font-semibold text-gray-400 backdrop-blur"
            style={{ gridColumn: "1 / 2", gridRow: "1 / 2" }}
          >
            チェーン・イベント
          </div>
          {days.map((d, i) => (
            <div
              key={`head-${i}`}
              className={`flex flex-col items-center justify-end pb-1 text-[10px] leading-tight ${
                d.getDate() === 1 && i !== 0 ? "border-l border-gray-300" : ""
              } ${i === todayColIndex ? "font-bold text-orange-600" : "text-gray-400"}`}
              style={{ gridColumn: `${i + 2} / ${i + 3}`, gridRow: "1 / 2" }}
            >
              {d.getDate() === 1 && <span className="text-[9px] text-gray-500">{d.getMonth() + 1}月</span>}
              {d.getDate()}
            </div>
          ))}

          {/* イベント行 */}
          {rows.map((campaign, rowIndex) => {
            const gridRow = rowIndex + 2;
            const visual = categoryVisual(campaign.chain.category);

            const rawStartCol = diffDays(campaign.startDate, rangeStart);
            const rawEndDateExclusive = campaign.endDate ? addDays(campaign.endDate, 1) : addDays(rangeEnd, 1);
            const rawEndCol = diffDays(rawEndDateExclusive, rangeStart);

            const startCol = Math.max(0, rawStartCol);
            const endCol = Math.min(totalDays, rawEndCol);
            if (endCol <= startCol) return null;

            const leftRounded = rawStartCol >= 0;
            const rightRounded = campaign.endDate !== null && rawEndCol <= totalDays;
            const barPixelWidth = (endCol - startCol) * DAY_WIDTH - 4;
            const estimatedTextWidth = campaign.title.length * 12.5;
            const showInlineText = barPixelWidth >= 60 && estimatedTextWidth <= barPixelWidth - 8;
            const ending = isEndingSoon(campaign.endDate);
            const isNew = isNewlyStarted(campaign.startDate) || isStartingSoon(campaign.startDate);
            const tooltip = `${campaign.chain.name}｜${campaign.title}（${formatPeriodJa(
              campaign.startDate,
              campaign.endDate,
            )}）`;

            return (
              <div key={campaign.id} className="contents">
                <div
                  className="sticky left-0 z-10 flex items-center gap-1.5 truncate border-t border-gray-100 bg-white/95 pl-2 pr-2 text-xs backdrop-blur"
                  style={{ gridColumn: "1 / 2", gridRow: `${gridRow} / ${gridRow + 1}` }}
                  title={tooltip}
                >
                  <span className="shrink-0">{chainEmoji(campaign.chain.slug)}</span>
                  <span className="truncate text-gray-700">{campaign.title}</span>
                </div>
                <div
                  className="relative border-t border-gray-100"
                  style={{ gridColumn: `${startCol + 2} / ${endCol + 2}`, gridRow: `${gridRow} / ${gridRow + 1}` }}
                >
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    title={tooltip}
                    className={`absolute inset-y-0 my-auto flex items-center overflow-hidden px-1.5 text-[11px] font-medium leading-none shadow-sm transition hover:brightness-95 ${
                      leftRounded ? "rounded-l-[4px]" : ""
                    } ${rightRounded ? "rounded-r-[4px]" : ""}`}
                    style={{
                      left: 1,
                      right: 1,
                      height: BAR_HEIGHT,
                      backgroundColor: visual.colorLight,
                      color: visual.textOnFill === "white" ? "#ffffff" : "#0b0b0b",
                    }}
                  >
                    {showInlineText && <span className="truncate">{campaign.title}</span>}
                    {isNew && (
                      <span
                        aria-hidden
                        className="absolute left-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-sky-500 ring-1 ring-white"
                      />
                    )}
                    {ending && (
                      <span
                        aria-hidden
                        className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white"
                      />
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

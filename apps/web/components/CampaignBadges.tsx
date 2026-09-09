import {
  daysUntilEnd,
  daysUntilStart,
  isEndingSoon,
  isNewlyStarted,
  isStartingSoon,
  isStartingToday,
} from "@/lib/dates";

export function CampaignBadges({
  startDate,
  endDate,
  featured,
}: {
  startDate: Date;
  endDate: Date | null;
  featured?: boolean;
}) {
  const remaining = daysUntilEnd(endDate);
  const untilStart = daysUntilStart(startDate);
  const endingSoon = isEndingSoon(endDate);
  const startingSoon = isStartingSoon(startDate);
  const newlyStarted = isNewlyStarted(startDate);

  return (
    <div className="flex flex-wrap gap-1.5">
      {startingSoon && (
        <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
          {untilStart === 1 ? "明日スタート" : `あと${untilStart}日でスタート`}
        </span>
      )}
      {newlyStarted && (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          {isStartingToday(startDate) ? "本日スタート" : "NEW"}
        </span>
      )}
      {endingSoon && remaining !== null && (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          {remaining === 0 ? "本日終了" : `あと${remaining}日で終了`}
        </span>
      )}
      {featured && (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          注目
        </span>
      )}
    </div>
  );
}

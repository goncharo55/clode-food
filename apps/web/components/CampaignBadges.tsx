import { daysUntilEnd, isEndingSoon, isStartingToday } from "@/lib/dates";

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
  const endingSoon = isEndingSoon(endDate);
  const startingToday = isStartingToday(startDate);

  return (
    <div className="flex flex-wrap gap-1.5">
      {startingToday && (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          本日スタート
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

import Link from "next/link";
import type { RankingEntry, RankingKind } from "@/lib/reactions";

function formatValue(kind: RankingKind, value: number): string {
  if (kind === "ratio") return `${Math.round(value * 100)}%`;
  return `${value}件`;
}

export default function RankingList({
  kind,
  entries,
  compact = false,
}: {
  kind: RankingKind;
  entries: RankingEntry[];
  compact?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">まだ投票が集まっていません。</p>;
  }

  return (
    <ol className={compact ? "space-y-1.5" : "space-y-2"}>
      {entries.map((entry, i) => (
        <li key={entry.campaignId}>
          <Link
            href={`/campaigns/${entry.campaignId}`}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-orange-50"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-5 shrink-0 text-right text-sm font-bold text-orange-500">{i + 1}</span>
              <span className={compact ? "truncate text-sm" : "truncate font-medium text-gray-900"}>
                {entry.title}
              </span>
              <span className="shrink-0 text-xs text-gray-400">{entry.chainName}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-gray-600">
              {formatValue(kind, entry.value)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

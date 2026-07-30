import Link from "next/link";
import type { CampaignSort } from "@/lib/queries";

const SORT_LABELS: Record<CampaignSort, string> = {
  starting: "今日開始",
  ending: "終了間近",
  popular: "人気順",
  new: "新着順",
};

const SORT_ORDER: CampaignSort[] = ["ending", "starting", "popular", "new"];

export default function SortTabs({
  basePath,
  current,
}: {
  basePath: string;
  current: CampaignSort;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SORT_ORDER.map((sort) => (
        <Link
          key={sort}
          href={`${basePath}?sort=${sort}`}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            sort === current
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-orange-100"
          }`}
        >
          {SORT_LABELS[sort]}
        </Link>
      ))}
    </div>
  );
}

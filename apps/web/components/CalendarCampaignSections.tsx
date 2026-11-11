"use client";

import { useMemo } from "react";
import CampaignCard from "@/components/CampaignCard";
import { dateKey, formatDateWithWeekdayJa } from "@/lib/dates";
import { applyCampaignSort, type CampaignSort } from "@/lib/campaignSort";
import { useCampaignSort } from "@/hooks/useCampaignSort";
import type { CampaignWithRelations } from "@/lib/queries";

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

/** 並び替え確定後の見た目部分(hooks非依存、Suspenseのfallbackからも使える) */
export function CalendarCampaignSectionsView({
  campaigns,
  sort,
  emptyMessage,
}: {
  campaigns: CampaignWithRelations[];
  sort: CampaignSort;
  emptyMessage: string;
}) {
  if (campaigns.length === 0) {
    return <p className="mt-8 text-gray-500">{emptyMessage}</p>;
  }

  if (sort === "starting") {
    return (
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
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}

export default function CalendarCampaignSections({
  campaigns,
  emptyMessage,
}: {
  campaigns: CampaignWithRelations[];
  emptyMessage: string;
}) {
  const sort = useCampaignSort();
  const sorted = useMemo(() => applyCampaignSort(campaigns, sort), [campaigns, sort]);

  return <CalendarCampaignSectionsView campaigns={sorted} sort={sort} emptyMessage={emptyMessage} />;
}

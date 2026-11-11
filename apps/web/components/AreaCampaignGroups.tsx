"use client";

import { useMemo } from "react";
import CampaignCard from "@/components/CampaignCard";
import { chainEmoji } from "@/lib/chainVisuals";
import { googleMapsSearchUrl } from "@/lib/googleMaps";
import { applyCampaignSort } from "@/lib/campaignSort";
import { groupByChain } from "@/lib/campaignGrouping";
import { useCampaignSort } from "@/hooks/useCampaignSort";
import type { CampaignWithRelations } from "@/lib/queries";

/** 並び替え確定後の見た目部分(hooks非依存、Suspenseのfallbackからも使える) */
export function AreaCampaignGroupsView({
  groups,
  areaName,
  emptyMessage,
}: {
  groups: CampaignWithRelations[][];
  areaName: string;
  emptyMessage: string;
}) {
  if (groups.length === 0) {
    return <p className="mt-8 text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="mt-8 space-y-8">
      {groups.map((items) => (
        <section key={items[0].chain.id}>
          <h2 className="flex items-center gap-2 text-lg font-bold border-b border-gray-200 pb-2">
            <span className="text-2xl">{chainEmoji(items[0].chain.slug)}</span>
            {items[0].chain.name}
            <span className="text-sm font-normal text-gray-500">{items.length}件開催中</span>
            <a
              href={googleMapsSearchUrl(`${items[0].chain.name} ${areaName}駅`)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs font-normal text-gray-400 hover:text-orange-600"
            >
              📍 近くの店舗をGoogleマップで探す ↗
            </a>
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

export default function AreaCampaignGroups({
  campaigns,
  areaName,
  emptyMessage,
}: {
  campaigns: CampaignWithRelations[];
  areaName: string;
  emptyMessage: string;
}) {
  const sort = useCampaignSort();
  const sorted = useMemo(() => applyCampaignSort(campaigns, sort), [campaigns, sort]);
  const groups = useMemo(() => groupByChain(sorted), [sorted]);

  return <AreaCampaignGroupsView groups={groups} areaName={areaName} emptyMessage={emptyMessage} />;
}

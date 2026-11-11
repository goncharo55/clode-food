"use client";

import { useMemo } from "react";
import CampaignCard from "@/components/CampaignCard";
import { applyCampaignSort } from "@/lib/campaignSort";
import { useCampaignSort } from "@/hooks/useCampaignSort";
import type { CampaignWithRelations } from "@/lib/queries";

/** 並び替え確定後の見た目部分(hooks非依存、Suspenseのfallbackからも使える) */
export function ChainCampaignGridView({
  campaigns,
  emptyMessage,
}: {
  campaigns: CampaignWithRelations[];
  emptyMessage: string;
}) {
  if (campaigns.length === 0) {
    return <p className="mt-6 text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}

export default function ChainCampaignGrid({
  campaigns,
  emptyMessage,
}: {
  campaigns: CampaignWithRelations[];
  emptyMessage: string;
}) {
  const sort = useCampaignSort();
  const sorted = useMemo(() => applyCampaignSort(campaigns, sort), [campaigns, sort]);

  return <ChainCampaignGridView campaigns={sorted} emptyMessage={emptyMessage} />;
}

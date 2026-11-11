"use client";

import SortTabs from "@/components/SortTabs";
import { useCampaignSort } from "@/hooks/useCampaignSort";

export default function SortTabsClient({ basePath }: { basePath: string }) {
  const sort = useCampaignSort();
  return <SortTabs basePath={basePath} current={sort} />;
}

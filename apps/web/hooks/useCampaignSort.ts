"use client";

import { useSearchParams } from "next/navigation";
import { parseSort, type CampaignSort } from "@/lib/campaignSort";

/** URLの?sort=を読み取るだけのフック(クライアント側)。ページ本体はsearchParamsを
 * 読まないため、静的生成・ISRキャッシュから外れずに済む。 */
export function useCampaignSort(): CampaignSort {
  const searchParams = useSearchParams();
  return parseSort(searchParams.get("sort"));
}

/**
 * キャンペーンの出典URL(sourceUrl)が欠損・不正な場合でも404を出さないよう、
 * チェーンの公式サイトURLへフォールバックする。
 */
export function campaignLinkUrl(
  campaign: { sourceUrl: string | null },
  chain: { officialSiteUrl: string },
): string {
  const url = campaign.sourceUrl?.trim();
  return url ? url : chain.officialSiteUrl;
}

import type { CampaignWithRelations } from "@/lib/queries";

/** prisma非依存の純粋関数。サーバー・クライアント両方から呼べるようにqueries.tsとは別ファイルに置く。 */
export function groupByChain(campaigns: CampaignWithRelations[]) {
  const groups = new Map<string, CampaignWithRelations[]>();
  for (const c of campaigns) {
    const key = c.chain.id;
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }
  return [...groups.values()].sort((a, b) => a[0].chain.name.localeCompare(b[0].chain.name, "ja"));
}

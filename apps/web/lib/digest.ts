import { prisma } from "@/lib/prisma";
import { today } from "@/lib/dates";
import { campaignListInclude, type CampaignWithRelations } from "@/lib/queries";
import { CATEGORY_VISUALS, type ChainCategory } from "@/lib/categoryVisuals";

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export type WeeklyDigest = {
  weekStart: Date;
  weekEnd: Date;
  startingThisWeek: CampaignWithRelations[];
  endingThisWeek: CampaignWithRelations[];
  comingUp: CampaignWithRelations[];
  categoryTrends: { category: ChainCategory; label: string; count: number }[];
};

/**
 * 「今週の期間限定まとめ」用のデータを、現在のDB状態から都度合成する。
 * 過去の週次アーカイブは保存していないため、常に「直近の週」の内容になる。
 */
export async function getWeeklyDigest(): Promise<WeeklyDigest> {
  const weekStart = today();
  const weekEnd = addDays(weekStart, 6);
  const comingUpEnd = addDays(weekStart, 34);

  const all = await prisma.campaign.findMany({
    where: {
      status: "published",
      OR: [{ endDate: null }, { endDate: { gte: weekStart } }],
    },
    include: campaignListInclude,
    orderBy: { startDate: "asc" },
  });

  const startingThisWeek = all.filter((c) => c.startDate >= weekStart && c.startDate <= weekEnd);
  const endingThisWeek = all.filter((c) => c.endDate && c.endDate >= weekStart && c.endDate <= weekEnd);
  const comingUp = all.filter((c) => c.startDate > weekEnd && c.startDate <= comingUpEnd);

  const categoryCounts = new Map<ChainCategory, number>();
  for (const c of all) {
    const cat = c.chain.category as ChainCategory;
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }
  const categoryTrends = [...categoryCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      label: CATEGORY_VISUALS[category]?.label ?? category,
      count,
    }));

  return {
    weekStart,
    weekEnd,
    startingThisWeek,
    endingThisWeek,
    comingUp: comingUp.slice(0, 8),
    categoryTrends,
  };
}

import { prisma } from "@/lib/prisma";
import { today } from "@/lib/dates";
import type { Prisma } from "@prisma/client";

// 終了日未設定(なくなり次第終了)のキャンペーンは、いつまでも「開催中」として残り続けてしまう。
// 開始からこの日数を超えたら一覧から外す（終了日が明記されているものは対象外、通常通りendDateで判定）
const OPEN_ENDED_STALE_DAYS = 30;

function currentOrUpcomingFilter(): Prisma.CampaignWhereInput {
  const staleCutoff = new Date(today());
  staleCutoff.setDate(staleCutoff.getDate() - OPEN_ENDED_STALE_DAYS);

  return {
    status: "published",
    OR: [
      { AND: [{ endDate: null }, { startDate: { gte: staleCutoff } }] },
      { endDate: { gte: today() } },
    ],
  };
}

export type CampaignSort = "ending" | "starting" | "popular" | "new";

const VALID_SORTS: CampaignSort[] = ["ending", "starting", "popular", "new"];

export function parseSort(value: string | string[] | undefined): CampaignSort {
  const v = Array.isArray(value) ? value[0] : value;
  return VALID_SORTS.includes(v as CampaignSort) ? (v as CampaignSort) : "ending";
}

function orderByForSort(sort: CampaignSort): Prisma.CampaignOrderByWithRelationInput[] {
  switch (sort) {
    case "starting":
      return [{ startDate: "desc" }];
    case "popular":
      return [{ featured: "desc" }, { startDate: "desc" }];
    case "new":
      return [{ createdAt: "desc" }];
    case "ending":
    default:
      // 終了日未設定(null)は後ろへ。Prismaのnulls sortはSQLiteでは非対応のため取得後に並べ替える
      return [{ startDate: "desc" }];
  }
}

function sortCampaignsForEnding<T extends { endDate: Date | null }>(campaigns: T[]): T[] {
  return [...campaigns].sort((a, b) => {
    if (a.endDate === null && b.endDate === null) return 0;
    if (a.endDate === null) return 1;
    if (b.endDate === null) return -1;
    return a.endDate.getTime() - b.endDate.getTime();
  });
}

export const campaignListInclude = {
  chain: true,
  areas: { include: { area: true } },
} satisfies Prisma.CampaignInclude;

export type CampaignWithRelations = Prisma.CampaignGetPayload<{
  include: typeof campaignListInclude;
}>;

export async function getCurrentCampaigns(sort: CampaignSort = "ending") {
  const campaigns = await prisma.campaign.findMany({
    where: currentOrUpcomingFilter(),
    orderBy: orderByForSort(sort),
    include: campaignListInclude,
  });
  return sort === "ending" ? sortCampaignsForEnding(campaigns) : campaigns;
}

export async function getChainBySlug(slug: string) {
  return prisma.chain.findUnique({ where: { slug } });
}

export async function getAllChains() {
  return prisma.chain.findMany({ orderBy: { name: "asc" } });
}

export async function getCampaignsByChain(chainId: string, sort: CampaignSort = "ending") {
  const campaigns = await prisma.campaign.findMany({
    where: { ...currentOrUpcomingFilter(), chainId },
    orderBy: orderByForSort(sort),
    include: campaignListInclude,
  });
  return sort === "ending" ? sortCampaignsForEnding(campaigns) : campaigns;
}

export async function getCampaignById(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: campaignListInclude,
  });
}

export async function getAreaBySlug(slug: string) {
  return prisma.area.findUnique({ where: { slug } });
}

export async function getAllAreas() {
  return prisma.area.findMany({ orderBy: { name: "asc" } });
}

/** 駅名・エリア名からエリアを解決する（完全一致優先、部分一致にフォールバック） */
export async function resolveAreaByStationQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const exactStation = await prisma.stationAlias.findFirst({
    where: { stationName: trimmed },
    include: { area: true },
  });
  if (exactStation) return exactStation.area;

  const exactArea = await prisma.area.findFirst({ where: { name: trimmed } });
  if (exactArea) return exactArea;

  const fuzzyStation = await prisma.stationAlias.findFirst({
    where: { stationName: { contains: trimmed } },
    include: { area: true },
  });
  if (fuzzyStation) return fuzzyStation.area;

  const fuzzyArea = await prisma.area.findFirst({
    where: { name: { contains: trimmed } },
  });
  return fuzzyArea;
}

/** 指定エリアで「今その駅で体験できる期間限定」一覧（全国区キャンペーン＋当該エリア限定キャンペーン） */
export async function getCampaignsByArea(areaId: string, sort: CampaignSort = "ending") {
  const campaigns = await prisma.campaign.findMany({
    where: {
      AND: [
        currentOrUpcomingFilter(),
        { OR: [{ areas: { none: {} } }, { areas: { some: { areaId } } }] },
      ],
    },
    orderBy: orderByForSort(sort),
    include: campaignListInclude,
  });
  return sort === "ending" ? sortCampaignsForEnding(campaigns) : campaigns;
}

export async function getEndingSoonCampaigns(limit = 8) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "published",
      endDate: { gte: today() },
    },
    orderBy: { endDate: "asc" },
    include: campaignListInclude,
    take: limit * 3,
  });
  return sortCampaignsForEnding(campaigns)
    .filter((c) => c.endDate !== null)
    .slice(0, limit);
}

/** 新着・まもなく開始（開始日が3日前〜3日後）のキャンペーン */
export async function getNewOrUpcomingCampaigns(limit = 8) {
  const start = new Date(today());
  start.setDate(start.getDate() - 3);
  const end = new Date(today());
  end.setDate(end.getDate() + 3);

  return prisma.campaign.findMany({
    where: {
      status: "published",
      startDate: { gte: start, lte: end },
    },
    orderBy: { startDate: "asc" },
    include: campaignListInclude,
    take: limit,
  });
}

export async function getStationSuggestions(limit = 30) {
  return prisma.stationAlias.findMany({
    orderBy: { stationName: "asc" },
    take: limit,
    include: { area: true },
  });
}

export async function getPendingReviewCampaigns() {
  return prisma.campaign.findMany({
    where: { status: "pending_review" },
    orderBy: { createdAt: "asc" },
    include: campaignListInclude,
  });
}

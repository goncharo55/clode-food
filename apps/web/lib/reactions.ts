import { createHmac } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ReactionType } from "@prisma/client";

const IP_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24時間
const IP_HASH_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7日でipHashを削除

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) {
    // 本番で未設定は明確なエラーにする。開発環境ではデフォルト値で動作させる。
    if (process.env.NODE_ENV === "production") {
      throw new Error("IP_HASH_SECRET is not configured");
    }
    return createHmac("sha256", "dev-only-insecure-secret").update(ip).digest("hex");
  }
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[reactions] TURNSTILE_SECRET_KEY未設定のため開発環境では検証をスキップします");
      return true;
    }
    // 本番で未設定なら安全側に倒して常に拒否する
    return false;
  }

  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token, remoteip: ip }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.error("[reactions] Turnstile検証リクエストに失敗", e);
    return false;
  }
}

export type ReactionCounts = { want_to_eat: number; have_eaten: number };

export async function getCounts(campaignId: string): Promise<ReactionCounts> {
  const rows = await prisma.campaignReactionCount.findMany({ where: { campaignId } });
  const counts: ReactionCounts = { want_to_eat: 0, have_eaten: 0 };
  for (const row of rows) {
    counts[row.reactionType as keyof ReactionCounts] = row.count;
  }
  return counts;
}

export type ToggleResult =
  | { ok: true; active: boolean; counts: ReactionCounts }
  | { ok: false; reason: "rate_limited" | "forbidden" };

export async function toggleReaction(params: {
  campaignId: string;
  reactionType: ReactionType;
  clientToken: string;
  ipHash: string;
}): Promise<ToggleResult> {
  const { campaignId, reactionType, clientToken, ipHash } = params;

  const existingVote = await prisma.campaignReactionVote.findUnique({
    where: { campaignId_reactionType_clientToken: { campaignId, reactionType, clientToken } },
  });

  if (existingVote) {
    // 取り消し: 同じ人による再押下なのでIPレート制限の対象外
    await prisma.$transaction([
      prisma.campaignReactionVote.delete({ where: { id: existingVote.id } }),
      prisma.campaignReactionCount.upsert({
        where: { campaignId_reactionType: { campaignId, reactionType } },
        create: { campaignId, reactionType, count: 0 },
        update: { count: { decrement: 1 } },
      }),
    ]);
    const counts = await getCounts(campaignId);
    return { ok: true, active: false, counts };
  }

  // 新規投票: 同じIPから別のclientTokenで直近にこのメニューへ投票済みなら拒否
  const recentSameIpVote = await prisma.campaignReactionVote.findFirst({
    where: {
      campaignId,
      reactionType,
      ipHash,
      clientToken: { not: clientToken },
      createdAt: { gte: new Date(Date.now() - IP_RATE_LIMIT_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recentSameIpVote) {
    return { ok: false, reason: "rate_limited" };
  }

  try {
    await prisma.$transaction([
      prisma.campaignReactionVote.create({
        data: { campaignId, reactionType, clientToken, ipHash },
      }),
      prisma.campaignReactionCount.upsert({
        where: { campaignId_reactionType: { campaignId, reactionType } },
        create: { campaignId, reactionType, count: 1 },
        update: { count: { increment: 1 } },
      }),
    ]);
  } catch {
    // ユニーク制約違反(同時押しによる競合) = 既に存在する扱いとして無視
  }
  const counts = await getCounts(campaignId);
  return { ok: true, active: true, counts };
}

export async function anonymizeOldIpHashes(): Promise<number> {
  const cutoff = new Date(Date.now() - IP_HASH_RETENTION_MS);
  const result = await prisma.campaignReactionVote.updateMany({
    where: { createdAt: { lt: cutoff }, ipHash: { not: null } },
    data: { ipHash: null },
  });
  return result.count;
}

export type RankingKind = "want_to_eat" | "have_eaten" | "ratio";

export type RankingEntry = {
  campaignId: string;
  title: string;
  chainName: string;
  value: number;
};

const RANKING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 直近7日間

export async function getRanking(kind: RankingKind, limit: number): Promise<RankingEntry[]> {
  const since = new Date(Date.now() - RANKING_WINDOW_MS);

  if (kind === "ratio") {
    const votes = await prisma.campaignReactionVote.groupBy({
      by: ["campaignId", "reactionType"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });

    const byCampaign = new Map<string, { want: number; eaten: number }>();
    for (const v of votes) {
      const entry = byCampaign.get(v.campaignId) ?? { want: 0, eaten: 0 };
      if (v.reactionType === "want_to_eat") entry.want = v._count._all;
      else entry.eaten = v._count._all;
      byCampaign.set(v.campaignId, entry);
    }

    const ranked = Array.from(byCampaign.entries())
      .filter(([, v]) => v.want > 0)
      .map(([campaignId, v]) => ({ campaignId, value: v.eaten / v.want }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    return attachCampaignInfo(ranked);
  }

  const votes = await prisma.campaignReactionVote.groupBy({
    by: ["campaignId"],
    where: { createdAt: { gte: since }, reactionType: kind },
    _count: { _all: true },
  });

  const ranked = votes
    .map((v) => ({ campaignId: v.campaignId, value: v._count._all }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  return attachCampaignInfo(ranked);
}

async function attachCampaignInfo(
  ranked: { campaignId: string; value: number }[],
): Promise<RankingEntry[]> {
  if (ranked.length === 0) return [];
  const campaigns = await prisma.campaign.findMany({
    where: { id: { in: ranked.map((r) => r.campaignId) }, status: "published" },
    select: { id: true, title: true, chain: { select: { name: true } } },
  });
  const byId = new Map(campaigns.map((c) => [c.id, c]));

  return ranked
    .map((r) => {
      const c = byId.get(r.campaignId);
      if (!c) return null;
      return { campaignId: r.campaignId, title: c.title, chainName: c.chain.name, value: r.value };
    })
    .filter((x): x is RankingEntry => x !== null);
}

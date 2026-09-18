import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type IngestPayload = {
  chainSlug: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  targetProducts: { name: string; price?: number }[];
  imageUrl?: string;
  sourceUrl: string;
  extractionMetadata?: Record<string, unknown>;
};

// 抽出結果のconfidenceがこの値以上なら人手レビューを経ずに即公開する。
// 未満、または不明な場合は従来通りpending_reviewとして管理画面での承認を待つ。
const AUTO_PUBLISH_CONFIDENCE_THRESHOLD = 0.7;

function resolveInitialStatus(extractionMetadata: Record<string, unknown> | undefined): "published" | "pending_review" {
  const confidence = extractionMetadata?.confidence;
  if (typeof confidence === "number" && confidence >= AUTO_PUBLISH_CONFIDENCE_THRESHOLD) {
    return "published";
  }
  return "pending_review";
}

/**
 * スクレイパーからの取り込み専用エンドポイント。
 * 抽出結果のconfidenceが高ければ即公開(published)、それ以外はpending_reviewとして
 * 管理画面での人手承認を待つ。
 * 同じsourceUrlが既に存在する場合は重複作成せずスキップする。
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: IngestPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!payload.chainSlug || !payload.title || !payload.startDate || !payload.sourceUrl) {
    return NextResponse.json(
      { error: "chainSlug, title, startDate, sourceUrl are required" },
      { status: 400 },
    );
  }

  const chain = await prisma.chain.findUnique({ where: { slug: payload.chainSlug } });
  if (!chain) {
    return NextResponse.json({ error: `unknown chainSlug: ${payload.chainSlug}` }, { status: 404 });
  }

  const existing = await prisma.campaign.findFirst({
    where: { sourceUrl: payload.sourceUrl },
    select: { id: true, status: true },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, created: false, status: existing.status });
  }

  const startDate = new Date(payload.startDate);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: `invalid startDate: ${payload.startDate}` }, { status: 400 });
  }
  const endDate = payload.endDate ? new Date(payload.endDate) : null;
  if (endDate && Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: `invalid endDate: ${payload.endDate}` }, { status: 400 });
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        chainId: chain.id,
        title: payload.title,
        description: payload.description,
        startDate,
        endDate,
        targetProducts: payload.targetProducts ?? [],
        imageUrl: payload.imageUrl,
        sourceUrl: payload.sourceUrl,
        status: resolveInitialStatus(payload.extractionMetadata),
        extractionMetadata: payload.extractionMetadata as Prisma.InputJsonValue | undefined,
      },
    });
    return NextResponse.json({ id: campaign.id, created: true, status: campaign.status });
  } catch (e) {
    console.error("ingest: failed to create campaign", e);
    return NextResponse.json({ error: "failed to create campaign" }, { status: 500 });
  }
}

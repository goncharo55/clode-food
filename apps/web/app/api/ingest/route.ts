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

/**
 * スクレイパーからの取り込み専用エンドポイント。
 * 常に status="pending_review" で作成し、公開は管理画面での人手承認を経る。
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
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, created: false });
  }

  const campaign = await prisma.campaign.create({
    data: {
      chainId: chain.id,
      title: payload.title,
      description: payload.description,
      startDate: new Date(payload.startDate),
      endDate: payload.endDate ? new Date(payload.endDate) : null,
      targetProducts: payload.targetProducts ?? [],
      imageUrl: payload.imageUrl,
      sourceUrl: payload.sourceUrl,
      status: "pending_review",
      extractionMetadata: payload.extractionMetadata as Prisma.InputJsonValue | undefined,
    },
  });

  return NextResponse.json({ id: campaign.id, created: true });
}

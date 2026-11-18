import { NextRequest, NextResponse } from "next/server";
import { getRanking, type RankingKind } from "@/lib/reactions";

const VALID_KINDS: RankingKind[] = ["want_to_eat", "have_eaten", "ratio"];

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const limitParam = request.nextUrl.searchParams.get("limit");

  if (!type || !VALID_KINDS.includes(type as RankingKind)) {
    return NextResponse.json({ error: "type must be one of want_to_eat, have_eaten, ratio" }, { status: 400 });
  }

  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 50);
  const ranking = await getRanking(type as RankingKind, limit);
  return NextResponse.json({ type, ranking });
}

import { NextRequest, NextResponse } from "next/server";
import { getClientIp, hashIp, toggleReaction, verifyTurnstile } from "@/lib/reactions";
import type { ReactionType } from "@prisma/client";

const VALID_TYPES: ReactionType[] = ["want_to_eat", "have_eaten"];

export async function POST(request: NextRequest) {
  let body: { campaignId?: string; reactionType?: string; clientToken?: string; turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { campaignId, reactionType, clientToken, turnstileToken } = body;
  if (
    !campaignId ||
    !reactionType ||
    !VALID_TYPES.includes(reactionType as ReactionType) ||
    !clientToken ||
    typeof clientToken !== "string" ||
    clientToken.length > 200
  ) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const ip = getClientIp(request);

  const verified = await verifyTurnstile(turnstileToken, ip);
  if (!verified) {
    return NextResponse.json({ error: "bot verification failed" }, { status: 403 });
  }

  const ipHash = hashIp(ip);

  const result = await toggleReaction({
    campaignId,
    reactionType: reactionType as ReactionType,
    clientToken,
    ipHash,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 429 });
  }

  return NextResponse.json({ active: result.active, counts: result.counts });
}

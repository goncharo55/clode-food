import { NextRequest, NextResponse } from "next/server";
import { getCounts } from "@/lib/reactions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await params;
  const counts = await getCounts(campaignId);
  return NextResponse.json(counts);
}

import { NextRequest, NextResponse } from "next/server";
import { anonymizeOldIpHashes } from "@/lib/reactions";

// Vercel Cronからの呼び出し専用。古い投票記録のIPハッシュをnull化してプライバシーを保つ。
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const count = await anonymizeOldIpHashes();
  return NextResponse.json({ anonymized: count });
}

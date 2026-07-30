import { ImageResponse } from "next/og";
import { getCampaignById } from "@/lib/queries";
import { categoryVisual } from "@/lib/categoryVisuals";
import { chainEmoji } from "@/lib/chainVisuals";
import { formatPeriodJa } from "@/lib/dates";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  const visual = categoryVisual(campaign?.chain.category ?? "curry_other");
  const textColor = visual.textOnFill === "white" ? "#ffffff" : "#0b0b0b";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: `linear-gradient(135deg, ${visual.colorLight}cc 0%, ${visual.colorLight} 100%)`,
          fontFamily: "system-ui, sans-serif",
          color: textColor,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 700 }}>
          <span style={{ marginRight: 16 }}>{chainEmoji(campaign?.chain.slug ?? "")}</span>
          {campaign?.chain.name ?? ""}
        </div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 800, lineHeight: 1.25 }}>
          {campaign?.title ?? ""}
        </div>
        {campaign && (
          <div style={{ display: "flex", fontSize: 30, opacity: 0.9 }}>
            {formatPeriodJa(campaign.startDate, campaign.endDate)}
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}

import Link from "next/link";
import { chainEmoji } from "@/lib/chainVisuals";
import { formatPeriodJa } from "@/lib/dates";
import { CampaignBadges } from "@/components/CampaignBadges";
import type { CampaignWithRelations } from "@/lib/queries";

function firstProductName(targetProducts: unknown): string | null {
  if (Array.isArray(targetProducts) && targetProducts.length > 0) {
    const first = targetProducts[0] as { name?: string };
    return first?.name ?? null;
  }
  return null;
}

export default function CampaignCard({ campaign }: { campaign: CampaignWithRelations }) {
  const productName = firstProductName(campaign.targetProducts);

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:shadow-md transition"
    >
      {campaign.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span className="text-xl leading-none">{chainEmoji(campaign.chain.slug)}</span>
            <span>{campaign.chain.name}</span>
          </div>
        </div>
        <h3 className="mt-2 text-lg font-bold text-gray-900">{campaign.title}</h3>
        {productName && <p className="mt-0.5 text-sm text-gray-600">{productName}</p>}
        <p className="mt-2 text-sm text-gray-500">{formatPeriodJa(campaign.startDate, campaign.endDate)}</p>
        <div className="mt-3">
          <CampaignBadges
            startDate={campaign.startDate}
            endDate={campaign.endDate}
            featured={campaign.featured}
          />
        </div>
      </div>
    </Link>
  );
}

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [chains, areas, campaigns] = await Promise.all([
    prisma.chain.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.area.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.campaign.findMany({
      where: { status: "published" },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/calendar`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/chains`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/areas`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/digest`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const chainEntries: MetadataRoute.Sitemap = chains.map((c) => ({
    url: `${SITE_URL}/chains/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const areaEntries: MetadataRoute.Sitemap = areas.map((a) => ({
    url: `${SITE_URL}/areas/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const campaignEntries: MetadataRoute.Sitemap = campaigns.map((c) => ({
    url: `${SITE_URL}/campaigns/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  return [...staticEntries, ...chainEntries, ...areaEntries, ...campaignEntries];
}

import Link from "next/link";
import type { Metadata } from "next";
import { getAllAreas } from "@/lib/queries";
import StationSearchForm from "@/components/StationSearchForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "エリア・駅から探す",
  description: "主要駅・エリアから、今すぐ体験できる期間限定メニュー・キャンペーンを探せます。",
};

export default async function AreasIndexPage() {
  const areas = await getAllAreas();
  const byRegion = new Map<string, typeof areas>();
  for (const area of areas) {
    const region = area.region ?? "その他";
    const list = byRegion.get(region) ?? [];
    list.push(area);
    byRegion.set(region, list);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">エリア・駅から探す</h1>
      <p className="mt-2 text-gray-600">駅名・エリア名を入力するか、下の一覧から選んでください。</p>

      <div className="mt-6 max-w-md">
        <StationSearchForm />
      </div>

      <div className="mt-10 space-y-8">
        {[...byRegion.entries()].map(([region, list]) => (
          <section key={region}>
            <h2 className="text-sm font-bold text-gray-500 border-b border-gray-200 pb-2">
              {region}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {list.map((area) => (
                <Link
                  key={area.id}
                  href={`/areas/${area.slug}`}
                  className="rounded-full bg-orange-50 px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100"
                >
                  {area.name}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { resolveAreaByStationQuery, getAllAreas } from "@/lib/queries";
import StationSearchForm from "@/components/StationSearchForm";

export const metadata: Metadata = {
  title: "駅名・エリア検索",
  robots: { index: false },
};

export default async function AreaSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q ?? "";
  const area = await resolveAreaByStationQuery(q);

  if (area) {
    redirect(`/areas/${area.slug}`);
  }

  const areas = await getAllAreas();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">「{q}」に該当するエリアが見つかりませんでした</h1>
      <p className="mt-2 text-gray-600">
        現在対応しているのは主要駅・エリアのみです。下記から選ぶか、別のキーワードで検索してください。
      </p>

      <div className="mt-6">
        <StationSearchForm />
      </div>

      <h2 className="mt-10 text-lg font-bold">対応エリア一覧</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {areas.map((a) => (
          <Link
            key={a.id}
            href={`/areas/${a.slug}`}
            className="rounded-full bg-orange-50 px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100"
          >
            {a.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

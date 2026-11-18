import type { Metadata } from "next";
import { getRanking } from "@/lib/reactions";
import RankingList from "@/components/RankingList";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "みんなの食べたい・食べたよランキング",
  description: `${SITE_NAME}の読者がリアクションした「食べたい」「食べたよ」の件数をもとにした、期間限定メニューのランキング。`,
};

export default async function RankingPage() {
  const [wantToEat, haveEaten, ratio] = await Promise.all([
    getRanking("want_to_eat", 15),
    getRanking("have_eaten", 15),
    getRanking("ratio", 15),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">みんなのランキング</h1>
      <p className="mt-2 text-sm text-gray-500">直近7日間の「食べたい🙋」「食べたよ✅」ボタンの件数集計です。</p>

      <section className="mt-8">
        <h2 className="text-lg font-bold">🙋 今週の食べたいランキング</h2>
        <div className="mt-3">
          <RankingList kind="want_to_eat" entries={wantToEat} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">✅ 食べたよランキング</h2>
        <div className="mt-3">
          <RankingList kind="have_eaten" entries={haveEaten} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">🔥 食べた率ランキング</h2>
        <p className="mt-1 text-sm text-gray-500">「食べたい」のうち実際に「食べたよ」が押された割合が高いメニュー。</p>
        <div className="mt-3">
          <RankingList kind="ratio" entries={ratio} />
        </div>
      </section>
    </div>
  );
}

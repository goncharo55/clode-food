/**
 * キャンペーンの並び替えロジック(prisma非依存の純粋関数のみ)。
 *
 * これを lib/queries.ts から分離しているのはクライアントコンポーネントから
 * 安全にimportできるようにするため。queries.tsはprisma(Node専用)に依存しており、
 * クライアント側でimportするとビルドが壊れる。並び替えタブの状態をURLの
 * searchParamsで管理しつつ、並び替え自体はクライアント側(useSearchParams)で
 * 行うことで、ページ本体はsearchParamsを読まずに済み、静的生成・ISRキャッシュが
 * 効くようになる(以前はページコンポーネントがsearchParams.sortを直接読んでおり、
 * Next.jsの仕様上それだけでページ全体が動的レンダリング扱いになってしまっていた)。
 */

export type CampaignSort = "ending" | "starting" | "popular" | "new";

const VALID_SORTS: CampaignSort[] = ["ending", "starting", "popular", "new"];

export function parseSort(value: string | string[] | null | undefined): CampaignSort {
  const v = Array.isArray(value) ? value[0] : value;
  return VALID_SORTS.includes(v as CampaignSort) ? (v as CampaignSort) : "ending";
}

type SortableCampaign = {
  startDate: Date;
  endDate: Date | null;
  featured: boolean;
  createdAt: Date;
};

function sortForEnding<T extends { endDate: Date | null }>(campaigns: T[]): T[] {
  return [...campaigns].sort((a, b) => {
    if (a.endDate === null && b.endDate === null) return 0;
    if (a.endDate === null) return 1;
    if (b.endDate === null) return -1;
    return a.endDate.getTime() - b.endDate.getTime();
  });
}

// 「注目」フラグを優先しつつ、その中では今日に近い開始日を優先する
function sortByRelevance<T extends { startDate: Date; featured: boolean }>(
  campaigns: T[],
  now: number,
): T[] {
  return [...campaigns].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return Math.abs(a.startDate.getTime() - now) - Math.abs(b.startDate.getTime() - now);
  });
}

function sortByStartDateDesc<T extends { startDate: Date }>(campaigns: T[]): T[] {
  return [...campaigns].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

function sortByCreatedAtDesc<T extends { createdAt: Date }>(campaigns: T[]): T[] {
  return [...campaigns].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function applyCampaignSort<T extends SortableCampaign>(
  campaigns: T[],
  sort: CampaignSort,
  now: number = Date.now(),
): T[] {
  switch (sort) {
    case "ending":
      return sortForEnding(campaigns);
    case "popular":
      return sortByRelevance(campaigns, now);
    case "starting":
      return sortByStartDateDesc(campaigns);
    case "new":
      return sortByCreatedAtDesc(campaigns);
  }
}

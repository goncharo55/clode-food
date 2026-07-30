/**
 * チェーンの業態カテゴリ。画像プレースホルダーとイベントカレンダーの配色の両方で使う。
 * 色はdatavizスキルの検証済みカテゴリカルパレット(スロット1〜7)をそのまま採用。
 */
export type ChainCategory =
  | "burger_fastfood"
  | "cafe_donut"
  | "sushi"
  | "gyudon_teishoku"
  | "family_restaurant"
  | "ramen_noodle"
  | "curry_other";

export const CATEGORY_ORDER: ChainCategory[] = [
  "burger_fastfood",
  "cafe_donut",
  "sushi",
  "gyudon_teishoku",
  "family_restaurant",
  "ramen_noodle",
  "curry_other",
];

export const CATEGORY_VISUALS: Record<
  ChainCategory,
  { label: string; colorLight: string; colorDark: string; image: string; textOnFill: "white" | "dark" }
> = {
  burger_fastfood: {
    label: "バーガー・ファストフード",
    colorLight: "#2a78d6",
    colorDark: "#3987e5",
    image: "/images/placeholders/burger_fastfood.svg",
    textOnFill: "white",
  },
  cafe_donut: {
    label: "カフェ・ドーナツ",
    colorLight: "#eb6834",
    colorDark: "#d95926",
    image: "/images/placeholders/cafe_donut.svg",
    textOnFill: "white",
  },
  sushi: {
    label: "回転寿司",
    colorLight: "#1baf7a",
    colorDark: "#199e70",
    image: "/images/placeholders/sushi.svg",
    textOnFill: "dark",
  },
  gyudon_teishoku: {
    label: "牛丼・定食",
    colorLight: "#c98500",
    colorDark: "#c98500",
    image: "/images/placeholders/gyudon_teishoku.svg",
    textOnFill: "dark",
  },
  family_restaurant: {
    label: "ファミリーレストラン",
    colorLight: "#e87ba4",
    colorDark: "#d55181",
    image: "/images/placeholders/family_restaurant.svg",
    textOnFill: "dark",
  },
  ramen_noodle: {
    label: "ラーメン・麺",
    colorLight: "#008300",
    colorDark: "#008300",
    image: "/images/placeholders/ramen_noodle.svg",
    textOnFill: "white",
  },
  curry_other: {
    label: "カレー・その他",
    colorLight: "#4a3aa7",
    colorDark: "#9085e9",
    image: "/images/placeholders/curry_other.svg",
    textOnFill: "white",
  },
};

export function categoryVisual(category: string) {
  return CATEGORY_VISUALS[category as ChainCategory] ?? CATEGORY_VISUALS.curry_other;
}

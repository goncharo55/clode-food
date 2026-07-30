const EMOJI_BY_SLUG: Record<string, string> = {
  mcdonalds: "🍔",
  komeda: "☕",
  "mister-donut": "🍩",
  sushiro: "🍣",
  "royal-host": "🍽️",
  yoshinoya: "🍚",
  sukiya: "🍚",
  matsuya: "🍚",
  saizeriya: "🍝",
  gusto: "🍽️",
  jonathans: "🍽️",
  dennys: "🍽️",
  ootoya: "🍚",
  yayoiken: "🍚",
  cocoichi: "🍛",
  tenya: "🍤",
  "kappa-sushi": "🍣",
  doutor: "☕",
  tullys: "☕",
  "starbucks-japan": "☕",
  ichiran: "🍜",
  "marugame-seimen": "🍜",
  lotteria: "🍔",
  "kfc-japan": "🍗",
};

export function chainEmoji(slug: string): string {
  return EMOJI_BY_SLUG[slug] ?? "🍽️";
}

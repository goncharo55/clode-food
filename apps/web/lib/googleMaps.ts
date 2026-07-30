/**
 * 自前で地図・店舗検索を持たず、Googleマップの検索結果に飛ばすための軽量なリンク生成。
 * APIキー不要、追加のJS/CSSも不要なため表示が軽い。
 */
export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

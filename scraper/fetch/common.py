"""
fetchモジュール間で共有するヘルパー関数。

背景: これまで各モジュールはBeautifulSoupの get_text() で本文をプレーンテキスト化して
Claudeに渡していたが、その時点で <img> や <meta property="og:image"> は全て
失われてしまい、Claudeは実在する画像URLを一切知りようがなかった
（結果としてほとんどのキャンペーンにimageUrlが設定されない原因になっていた）。
テキスト化する前のHTMLから代表画像を抽出し、Claudeの抽出結果とは別に
確定情報として取り込み時に使う。

og:image はサイト共通のロゴ/OGP画像を指しているだけのケースが多いことが
実機確認で分かったため(例: ミスタードーナツ、すき家は全ページで共通ロゴを返す)、
本文中に実際に掲載されている商品画像を最優先し、og:image等はそれが無い場合の
フォールバックとしてのみ使う。
"""

from urllib.parse import urljoin

from bs4 import BeautifulSoup

# ロゴ・アイコン・バッジ等、キャンペーンごとに変化しない共通アセットと判定するためのキーワード
_GENERIC_IMAGE_KEYWORDS = (
    "logo",
    "icon",
    "/common/",
    "/common_",
    "sprite",
    "spacer",
    "btn_",
    "favicon",
    "badge",
    "label",
)


def _is_generic(url: str) -> bool:
    low = url.lower()
    # svgは「期間限定」バッジ等の装飾アイコンであることが多く、商品写真としては使えない
    if low.endswith(".svg"):
        return True
    return any(keyword in low for keyword in _GENERIC_IMAGE_KEYWORDS)


def extract_detail(html: str, base_url: str) -> dict:
    """詳細ページのHTMLから、本文テキストと代表画像URLの両方を抽出する。

    戻り値: {"text": str, "image_url": str | None}
    """
    soup = BeautifulSoup(html, "html.parser")
    fallback_image = _meta_image_url(soup, base_url)

    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()

    content_image = _content_image_url(soup, base_url)
    text = soup.get_text("\n", strip=True)

    return {"text": text, "image_url": content_image or fallback_image}


def _content_image_url(soup: BeautifulSoup, base_url: str) -> str | None:
    """本文中(nav/header/footer除去後)に実際に掲載されている、サイト共通でない画像を探す。"""
    for img in soup.find_all("img", src=True):
        src = img["src"].strip()
        if not src or _is_generic(src):
            continue
        return urljoin(base_url, src)
    return None


def _meta_image_url(soup: BeautifulSoup, base_url: str) -> str | None:
    """og:image / twitter:imageを探す。サイト共通ロゴ等とみられるものは採用しない。"""
    for prop in ("og:image", "og:image:secure_url"):
        meta = soup.find("meta", property=prop)
        if meta and meta.get("content") and not _is_generic(meta["content"]):
            return urljoin(base_url, meta["content"].strip())

    meta = soup.find("meta", attrs={"name": "twitter:image"})
    if meta and meta.get("content") and not _is_generic(meta["content"]):
        return urljoin(base_url, meta["content"].strip())

    return None


# Playwright(JS描画サイト)側で代表画像を取得するためのブラウザ内実行JS。
# 考え方はPython版(_content_image_url / _meta_image_url)と同じ:
# header/nav/footer配下とサイト共通アセットを除外し、本文画像を優先、og:image等はフォールバック。
OG_IMAGE_JS = """
() => {
  const GENERIC = ['logo', 'icon', '/common/', '/common_', 'sprite', 'spacer', 'btn_', 'favicon', 'badge', 'label'];
  const isGeneric = (u) => {
    const low = (u || '').toLowerCase();
    if (low.endsWith('.svg')) return true;
    return GENERIC.some((k) => low.includes(k));
  };
  const abs = (v) => { try { return new URL(v, location.href).href; } catch { return null; } };

  const excluded = new Set();
  document.querySelectorAll('header, nav, footer').forEach((el) => excluded.add(el));
  const isExcluded = (el) => {
    let p = el;
    while (p) {
      if (excluded.has(p)) return true;
      p = p.parentElement;
    }
    return false;
  };

  for (const img of Array.from(document.querySelectorAll('img[src]'))) {
    if (isExcluded(img)) continue;
    if (isGeneric(img.src)) continue;
    return img.src;
  }

  const og = document.querySelector('meta[property="og:image"]') ||
             document.querySelector('meta[property="og:image:secure_url"]');
  if (og && og.content && !isGeneric(og.content)) return abs(og.content);
  const tw = document.querySelector('meta[name="twitter:image"]');
  if (tw && tw.content && !isGeneric(tw.content)) return abs(tw.content);
  return null;
}
"""

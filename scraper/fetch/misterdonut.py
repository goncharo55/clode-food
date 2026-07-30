"""
ミスタードーナツの新商品情報ページから、候補となる商品ページのURLを収集する。

一覧ページ(/whatsnew/)には新商品以外のお知らせ（ファンミーティング開催報告、
各種お詫び等）も混在しているため、ここでは/m_menu/new/配下のURLパターンに
一致するものだけをゆるく拾う。一覧ページのDOM構造は今後変わりうるため、
特定のクラス名等には依存しない作りにしている。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.misterdonut.jp"
NEWS_LIST_URL = f"{BASE_URL}/whatsnew/index.html?tabId=news"

# 個人運用の低頻度アグリゲーターであることが分かるUser-Agent。
# 対象サイトへの負荷を抑えるため、リクエスト間隔を空ける。
USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    """新商品情報一覧から /m_menu/new/ 配下のリンクだけを抽出する。

    戻り値の各要素: {"url": str, "list_title": str | None, "url_date": "YYYY-MM-DD" | None}
    url_date はURLパスの先頭6桁の日付(例: 260603 -> 2026-06-03)から推定した公開日。
    本文に明確な開始日が無い場合のフォールバックとして使う。
    """
    html = _get(NEWS_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    seen: set[str] = set()
    items: list[dict] = []

    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/m_menu/new/" not in href:
            continue

        full_url = urljoin(BASE_URL, href)
        if full_url in seen:
            continue
        seen.add(full_url)

        match = re.search(r"/m_menu/new/(\d{2})(\d{2})(\d{2})_", full_url)
        url_date = f"20{match.group(1)}-{match.group(2)}-{match.group(3)}" if match else None

        items.append(
            {
                "url": full_url,
                "list_title": a.get_text(strip=True) or None,
                "url_date": url_date,
            }
        )

        if len(items) >= limit:
            break

    return items


def fetch_detail_text(url: str) -> str:
    """商品詳細ページ本文をプレーンテキストとして取得する（Claude抽出の入力用）"""
    html = _get(url)
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    return soup.get_text("\n", strip=True)

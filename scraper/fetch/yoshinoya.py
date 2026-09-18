"""
吉野家のキャンペーン一覧ページから、候補となるキャンペーン詳細ページのURLを収集する。

/campaign/ 配下に現在実施中のキャンペーンへのリンクが並ぶ。URLの末尾は
`<slug>_YYYYMM/` の形式であることが多く、そこから公開月を推定する
（日までは分からないため、本文中の明記された日付を優先させる）。
robots.txt (https://www.yoshinoya.com/robots.txt) はDisallowなし。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.yoshinoya.com"
CAMPAIGN_LIST_URL = f"{BASE_URL}/campaign/"

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
    """キャンペーン一覧から /campaign/<slug>/ 配下の詳細ページリンクを抽出する。

    戻り値の各要素: {"url": str, "list_title": str | None, "url_date": "YYYY-MM-DD" | None}
    url_date はURL末尾の年月(例: _202609 -> 2026-09-01)から推定した公開月。日は不明のため1日固定。
    """
    html = _get(CAMPAIGN_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    seen: set[str] = set()
    items: list[dict] = []

    for a in soup.find_all("a", href=True):
        href = a["href"]
        full_url = urljoin(BASE_URL, href)

        if not full_url.startswith(f"{BASE_URL}/campaign/"):
            continue
        if full_url.rstrip("/") == CAMPAIGN_LIST_URL.rstrip("/"):
            continue
        if full_url in seen:
            continue
        seen.add(full_url)

        match = re.search(r"_(\d{4})(\d{2})/?$", full_url)
        url_date = f"{match.group(1)}-{match.group(2)}-01" if match else None

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
    """キャンペーン詳細ページ本文をプレーンテキストとして取得する（Claude抽出の入力用）"""
    html = _get(url)
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    return soup.get_text("\n", strip=True)

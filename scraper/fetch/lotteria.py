"""
ロッテリアのキャンペーン一覧ページから、候補ページのURLを収集する。
一覧・詳細とも静的HTMLで取得できる。

レスポンスヘッダーにcharsetの指定が無く、requestsがISO-8859-1と誤判定するため、
取得時にapparent_encoding(chardetによる推定)で上書きする。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://www.lotteria.jp"
CAMPAIGN_LIST_URL = f"{BASE_URL}/campaign/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    response.encoding = response.apparent_encoding
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    """キャンペーン一覧から /campaign/detail/NNNNNN.html 形式のリンクを抽出する。

    一覧のDOM順が必ずしも新着順ではないため、detail/以下の数値IDを新しさの代理指標として
    使い、大きい順に並べる(sushiro.pyと同様の方式)。
    """
    html = _get(CAMPAIGN_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    candidates: dict[int, dict] = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        match = re.search(r"/campaign/detail/(\d+)\.html", href)
        if not match:
            continue
        campaign_id = int(match.group(1))
        if campaign_id in candidates:
            continue
        candidates[campaign_id] = {
            "url": urljoin(BASE_URL, href),
            "list_title": a.get_text(strip=True) or None,
            "url_date": None,
        }

    ordered_ids = sorted(candidates.keys(), reverse=True)
    return [candidates[i] for i in ordered_ids[:limit]]


def fetch_detail(url: str) -> dict:
    html = _get(url)
    return extract_detail(html, url)

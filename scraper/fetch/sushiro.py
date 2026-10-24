"""
スシローのキャンペーン一覧ページから、候補ページのURLを収集する。
一覧・詳細とも静的HTMLで取得できる。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.akindo-sushiro.co.jp"
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
    html = _get(CAMPAIGN_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    # 一覧のDOM順は必ずしも新着順ではないため、detail.php?id=の数値
    # (サイト側で概ね連番と見られる)を新しさの代理指標として使い、大きい順に並べる
    candidates: dict[int, dict] = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        match = re.search(r"campaign/detail\.php\?id=(\d+)", href)
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


def fetch_detail_text(url: str) -> str:
    html = _get(url)
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    return soup.get_text("\n", strip=True)

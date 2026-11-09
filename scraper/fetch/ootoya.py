"""
大戸屋の「お知らせ」一覧ページから、候補ページのURLを収集する。

一覧ページ内のリンクは "./293.html" のような相対パス(数値ID)で、一覧のDOM順が
必ずしも新着順ではないため、数値IDを新しさの代理指標として大きい順に並べる
(sushiro.py/lotteria.pyと同様の方式)。リンクテキスト先頭に "YYYY/MM/DD" 形式の
日付が付くため、そこから公開日を推定する(royalhost.pyと同様だが区切り文字が異なる)。
新店オープン・お知らせ等キャンペーンでない項目も混在するが、Claude抽出時の
is_relevant判定でフィルタされる想定。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://www.ootoya.com"
NEWS_LIST_URL = f"{BASE_URL}/news/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

_DETAIL_PATTERN = re.compile(r"^\.?/?(\d+)\.html$")
_DATE_PREFIX_PATTERN = re.compile(r"^(\d{4})/(\d{2})/(\d{2})")


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    response.encoding = response.apparent_encoding
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    html = _get(NEWS_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    candidates: dict[int, dict] = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        match = _DETAIL_PATTERN.match(href)
        if not match:
            continue
        news_id = int(match.group(1))
        if news_id in candidates:
            continue

        text = a.get_text(strip=True)
        date_match = _DATE_PREFIX_PATTERN.match(text)
        url_date = (
            f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"
            if date_match
            else None
        )
        list_title = _DATE_PREFIX_PATTERN.sub("", text).strip() or None

        candidates[news_id] = {
            "url": urljoin(NEWS_LIST_URL, href),
            "list_title": list_title,
            "url_date": url_date,
        }

    ordered_ids = sorted(candidates.keys(), reverse=True)
    return [candidates[i] for i in ordered_ids[:limit]]


def fetch_detail(url: str) -> dict:
    html = _get(url)
    return extract_detail(html, url)

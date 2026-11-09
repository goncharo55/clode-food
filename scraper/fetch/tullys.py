"""
タリーズコーヒーの「プレスリリース」一覧ページから、候補ページのURLを収集する。
一覧・詳細とも静的HTMLで取得できる。

一覧ページの表示順が新着順になっているため、/company/pressrelease/{YYYY}/{MM}/*.html
形式のリンクをDOM順のまま先頭から採用する(年月だけで日付までは分からないため、
sushiro.py等のようなID降順ソートは行わない。lotteria.py同様、url_dateはNoneのまま
Claude抽出側の判定に委ねる)。

レスポンスヘッダーにcharsetの指定が無く、requestsがISO-8859-1と誤判定するため、
取得時にapparent_encoding(chardetによる推定)で上書きする。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://www.tullys.co.jp"
PRESSRELEASE_LIST_URL = f"{BASE_URL}/company/pressrelease/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

_DETAIL_PATTERN = re.compile(r"/company/pressrelease/\d{4}/\d{2}/[^/]+\.html$")


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    response.encoding = response.apparent_encoding
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    html = _get(PRESSRELEASE_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    seen: set[str] = set()
    items: list[dict] = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not _DETAIL_PATTERN.search(href):
            continue
        full_url = urljoin(BASE_URL, href)
        if full_url in seen:
            continue
        seen.add(full_url)

        items.append(
            {"url": full_url, "list_title": a.get_text(strip=True) or None, "url_date": None}
        )
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    html = _get(url)
    return extract_detail(html, url)

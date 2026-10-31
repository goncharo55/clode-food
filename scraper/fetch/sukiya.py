"""
すき家の新着情報ページから、候補となる商品・キャンペーンページのURLを収集する。

/news/ 一覧は静的HTMLで取得できる。プレスリリースPDF(Press_sukiya_*.pdf)は
テキスト抽出が別途必要になるためここでは対象外にし、/news/YYYY/MM/*.html
形式のお知らせ・クーポンページのみを候補にする。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://www.sukiya.jp"
NEWS_LIST_URL = f"{BASE_URL}/news/"

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
    html = _get(NEWS_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    items: list[dict] = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        match = re.search(r"/news/(\d{4})/(\d{2})/[a-zA-Z0-9_.]+\.html", href)
        if not match:
            continue

        full_url = urljoin(BASE_URL, href)
        if full_url in seen:
            continue
        seen.add(full_url)

        # ファイル名先頭のYYYYMMDDを日付候補として拾えるものは拾う(無ければNone)
        date_match = re.search(r"(\d{8})", href)
        url_date = None
        if date_match:
            raw = date_match.group(1)
            url_date = f"{raw[0:4]}-{raw[4:6]}-{raw[6:8]}"

        items.append({"url": full_url, "list_title": a.get_text(strip=True) or None, "url_date": url_date})
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    html = _get(url)
    return extract_detail(html, url)

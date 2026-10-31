"""
ケンタッキーフライドチキンのニュースリリース一覧から、候補ページのURLを収集する。

公式サイト www.kfc.co.jp はJavaScript描画のSPAだが、ニュースリリースは
別ドメイン japan.kfc.co.jp で静的に配信されているためそちらを利用する。
"""

import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://japan.kfc.co.jp"
NEWS_LIST_URL = f"{BASE_URL}/news_release"

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
    anchors = [a for a in soup.find_all("a", href=True) if "/news_release/" in a["href"]]
    for a in reversed(anchors):
        href = a["href"]
        full_url = urljoin(BASE_URL, href)
        if full_url.rstrip("/") == NEWS_LIST_URL.rstrip("/") or full_url in seen:
            continue
        seen.add(full_url)
        items.append({"url": full_url, "list_title": a.get_text(strip=True) or None, "url_date": None})
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    html = _get(url)
    return extract_detail(html, url)

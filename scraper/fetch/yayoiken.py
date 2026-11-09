"""
やよい軒の「お知らせ」一覧ページから、候補ページのURLを収集する。

詳細ページのURLファイル名自体に "YYMMDD_スラッグ.html" 形式で公開日が
埋め込まれているため、一覧のリンクテキストではなくURL自体から日付を抽出して
新しさの判定に使う(royalhost.py/ootoya.pyのリンクテキスト方式より確実)。
新店オープン・キャンペーン等、商品情報以外のお知らせも混在するが、Claude抽出時の
is_relevant判定でフィルタされる想定。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://www.yayoiken.com"
NEWS_LIST_URL = f"{BASE_URL}/news/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

_DETAIL_PATTERN = re.compile(r"/contents/news/(\d{2})(\d{2})(\d{2})_[^/]+\.html$")


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    response.encoding = response.apparent_encoding
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    html = _get(NEWS_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    candidates: dict[str, dict] = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        full_url = urljoin(NEWS_LIST_URL, href)
        match = _DETAIL_PATTERN.search(full_url)
        if not match:
            continue
        yy, mm, dd = match.groups()
        sort_key = f"20{yy}{mm}{dd}"
        if full_url in candidates:
            continue

        text = a.get_text(strip=True)
        candidates[full_url] = {
            "url": full_url,
            "list_title": text or None,
            "url_date": f"20{yy}-{mm}-{dd}",
            "_sort_key": sort_key,
        }

    ordered = sorted(candidates.values(), key=lambda item: item["_sort_key"], reverse=True)
    return [{"url": i["url"], "list_title": i["list_title"], "url_date": i["url_date"]} for i in ordered[:limit]]


def fetch_detail(url: str) -> dict:
    html = _get(url)
    return extract_detail(html, url)

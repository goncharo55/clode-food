"""
ドトールコーヒーの「ニュースリリース」一覧ページから、候補ページのURLを収集する。

一覧は年ごとのアーカイブページ(/news/newsrelease/{year}.html)に分かれており、
現在の年のページを取得する。新商品だけでなく、価格改定・個人情報漏えい等のお知らせも
混在するため、Claude抽出時のis_relevant判定でフィルタされる想定(royalhost.pyと同様)。

レスポンスヘッダーにcharsetの指定が無く、requestsがISO-8859-1と誤判定するため、
取得時にapparent_encoding(chardetによる推定)で上書きする。
"""

import time
from datetime import datetime
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://www.doutor.co.jp"

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
    year = datetime.now().year
    list_url = f"{BASE_URL}/news/newsrelease/{year}.html"
    html = _get(list_url)
    soup = BeautifulSoup(html, "html.parser")

    items: list[dict] = []
    for li in soup.select("li.news-list__item"):
        a = li.find("a", href=True)
        if not a:
            continue
        title_tag = li.select_one(".news-list__title")
        time_tag = li.select_one("time[datetime]")
        items.append(
            {
                "url": urljoin(list_url, a["href"]),
                "list_title": title_tag.get_text(strip=True) if title_tag else None,
                "url_date": time_tag["datetime"] if time_tag and time_tag.get("datetime") else None,
            }
        )
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    html = _get(url)
    return extract_detail(html, url)

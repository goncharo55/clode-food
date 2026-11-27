"""
ミニストップのニュースリリース一覧(/corporate/release/index.html)から、
商品・キャンペーン関連のプレスリリースを候補として収集する。

各リリースの実体はPDF(/corporate/release/assets/pdf/*.pdf)だが、一覧ページ
自体に <dt class="date">(日付+カテゴリタグ) / <dd class="newsDetail"><p>(本文要約)
がすでに十分な情報量で載っているため、dennys.pyと同様にPDFを解析せず一覧ページの
テキストをそのままClaude抽出の入力として使う。

一覧には「商品」「キャンペーン・セール」以外に「お知らせ」「経営」「サステナビリティ」
「サービス」「店舗」等の食品と無関係なカテゴリも混在しているため、各エントリに付く
newsIcon(cat-product / cat-campaign 等)のクラス名で商品・キャンペーン関連のみに絞り込む。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.ministop.co.jp"
RELEASE_LIST_URL = f"{BASE_URL}/corporate/release/index.html"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

# このタグが付いたエントリだけを「期間限定メニュー・キャンペーン」候補として扱う
# (お知らせ/経営/サステナビリティ/サービス/店舗 等の食品と無関係なカテゴリは除外)
RELEVANT_CATEGORIES = {"cat-product", "cat-campaign"}

_DATE_RE = re.compile(r"(\d{4})年(\d{1,2})月(\d{1,2})日")


def _get_soup(url: str) -> BeautifulSoup:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return BeautifulSoup(response.content, "html.parser")


def _iter_entries(soup: BeautifulSoup):
    """一覧ページの dl.newsBlock (日付+カテゴリ / 本文要約) を順に返す。"""
    for dl in soup.select("dl.newsBlock"):
        link = dl.find_parent("a", href=True)
        if not link:
            continue

        dt = dl.find("dt", class_="date")
        dd = dl.find("dd", class_="newsDetail")
        if not dt or not dd:
            continue

        categories = {
            cls
            for icon in dt.select("span.newsIcon")
            for cls in icon.get("class", [])
            if cls.startswith("cat-")
        }
        if not categories & RELEVANT_CATEGORIES:
            continue

        date_text = dt.get_text(" ", strip=True)
        date_match = _DATE_RE.search(date_text)
        url_date = None
        if date_match:
            year, month, day = date_match.groups()
            url_date = f"{int(year):04d}-{int(month):02d}-{int(day):02d}"

        summary = dd.get_text(" ", strip=True)

        yield {
            "url": urljoin(BASE_URL, link["href"]),
            "summary": summary,
            "url_date": url_date,
        }


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    soup = _get_soup(RELEASE_LIST_URL)

    items: list[dict] = []
    seen: set[str] = set()
    for entry in _iter_entries(soup):
        if entry["url"] in seen:
            continue
        seen.add(entry["url"])

        items.append(
            {
                "url": entry["url"],
                "list_title": entry["summary"][:60] if entry["summary"] else None,
                "url_date": entry["url_date"],
            }
        )
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    """PDF自体は取得せず、一覧ページから該当エントリの本文要約を組み立てる。"""
    soup = _get_soup(RELEASE_LIST_URL)

    for entry in _iter_entries(soup):
        if entry["url"] == url:
            return {"text": entry["summary"], "image_url": None}

    # 一覧から消えていた場合(月送り等)は空で返す
    return {"text": "", "image_url": None}

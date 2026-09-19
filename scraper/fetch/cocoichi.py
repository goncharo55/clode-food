"""
カレーハウスCoCo壱番屋の「お知らせ」一覧ページから、候補となる詳細ページのURLを収集する。

/whatsnew/ には新商品情報以外（決算・人事・お詫び等）のお知らせや、PDFのプレス
リリースも混在するため、/whatsnew/YYYY/MM/xxx.html 形式のHTML詳細ページだけに
絞り込む。新商品以外の内容が混ざっても、Claude抽出時のconfidenceが低くなり
pending_reviewに残るため、人の目でのフィルタリングに委ねられる。
robots.txt (https://www.ichibanya.co.jp/robots.txt) はDisallowなし。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.ichibanya.co.jp"
NEWS_LIST_URL = f"{BASE_URL}/whatsnew/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

_DETAIL_PATTERN = re.compile(r"/whatsnew/(\d{4})/(\d{2})/[^/]+\.html$")


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    """お知らせ一覧から /whatsnew/YYYY/MM/*.html 形式の詳細ページだけを抽出する。

    戻り値の各要素: {"url": str, "list_title": str | None, "url_date": "YYYY-MM-DD" | None}
    url_date はURLパスの年月(例: /whatsnew/2026/08/ -> 2026-08-01)から推定した公開月。
    """
    html = _get(NEWS_LIST_URL)
    soup = BeautifulSoup(html, "html.parser")

    seen: set[str] = set()
    items: list[dict] = []

    for a in soup.find_all("a", href=True):
        href = a["href"]
        full_url = urljoin(BASE_URL, href)
        # 相対パスの "../../whatsnew/..." がそのまま残ってURLに混ざることがあるため正規化
        full_url = full_url.replace("/whatsnew/../../whatsnew/", "/whatsnew/")

        match = _DETAIL_PATTERN.search(full_url)
        if not match:
            continue
        if full_url in seen:
            continue
        seen.add(full_url)

        url_date = f"{match.group(1)}-{match.group(2)}-01"

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
    """お知らせ詳細ページ本文をプレーンテキストとして取得する（Claude抽出の入力用）"""
    html = _get(url)
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    return soup.get_text("\n", strip=True)

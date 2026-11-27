"""
一蘭の新着情報フラグメントページから、候補となる商品ページのURLを収集する。

/news/ 自体はJavaScriptで多言語切り替え(Wovn.io)や各種トラッキングタグが
大量に挿入される作りだが、実際のお知らせ一覧は /news/index_common.html という
別ファイルに静的HTMLの<table>として存在し、トップページ側がこれをAjaxで
読み込んで差し込んでいるだけだった。index_common.html自体は単独でも
静的に取得できるため、これを直接パースする。

一覧には "tag_info"(お知らせ全般: 自主回収・ハラスメント方針・採用等)、
"tag_evt"(イベント)、"tag_omyg"(おみやげ=公式通販の新商品・数量限定再販等)の
3カテゴリが混在している。期間限定メニュー・新商品の話題は実質的に
tag_omyg(おみやげ/公式通販)にしか出てこない(店内の時限メニューという形の
告知は見当たらず、カップ麺などの通販新商品が実質的な新商品ニュース)ため、
候補はtag_omygのみに絞る。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://ichiran.com"
NEWS_FRAGMENT_URL = f"{BASE_URL}/news/index_common.html"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

DATE_RE = re.compile(r"^(\d{4})/(\d{2})/(\d{2})$")


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    html = _get(NEWS_FRAGMENT_URL)
    soup = BeautifulSoup(html, "html.parser")

    items: list[dict] = []
    for row in soup.find_all("tr", id=re.compile(r"^entry\d+")):
        a = row.find("a", href=True)
        if not a:
            continue

        tag_div = a.find("div", class_=re.compile(r"^tag_"))
        if not tag_div or "tag_omyg" not in tag_div.get("class", []):
            continue

        th = row.find("th")
        url_date = None
        if th:
            match = DATE_RE.match(th.get_text(strip=True))
            if match:
                url_date = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"

        tag_div.extract()
        title = a.get_text(strip=True) or None

        full_url = urljoin(BASE_URL, a["href"])
        items.append({"url": full_url, "list_title": title, "url_date": url_date})
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    html = _get(url)
    return extract_detail(html, url)

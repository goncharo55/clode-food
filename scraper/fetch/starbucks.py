"""
スターバックスの現在の季節限定ドリンク情報を取得する。

スターバックスの公式サイトはニュース一覧ページがJavaScript描画のSPAで、
一覧を安定して取得するのが難しい。一方 /cafe/ にアクセスすると、
その時点の目玉季節限定ドリンクのページへ自動的にリダイレクトされる
(例: /cafe/ -> /cafe/orange-mango/)。この挙動を利用して、
「今まさに展開中の目玉商品」を1件だけ確実に取得する方式にしている。
一覧すべてを網羅するものではない点に留意。
"""

import time

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.starbucks.co.jp"
FEATURED_CAFE_URL = f"{BASE_URL}/cafe/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    """/cafe/ のリダイレクト先(=現在の目玉季節限定ドリンク)を1件返す。"""
    response = _session.get(FEATURED_CAFE_URL, timeout=REQUEST_TIMEOUT_SECONDS, allow_redirects=True)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)

    final_url = response.url
    if final_url.rstrip("/") == FEATURED_CAFE_URL.rstrip("/"):
        # リダイレクトされなかった(現在目玉商品ページが無い)場合は候補なし
        return []

    return [{"url": final_url, "list_title": None, "url_date": None}][:limit]


def fetch_detail_text(url: str) -> str:
    """商品詳細ページ本文をプレーンテキストとして取得する(Claude抽出の入力用)"""
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    return soup.get_text("\n", strip=True)

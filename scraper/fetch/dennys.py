"""
デニーズの新着情報一覧(/news/)から、候補となるプレスリリースを収集する。

各リリースの実体はPDFだが、一覧ページ自体に <dt class="newstit"> (日付) /
<dd class="newstit"> (タイトル) / <dd class="newstxt"> (本文要約) が
すでに十分な情報量で載っているため、PDFを解析する依存を増やさずに
一覧ページのテキストをそのままClaude抽出の入力として使う。
そのため fetch_detail も一覧ページを再取得し、該当リンクの周辺テキストを
組み立てるだけで、PDF自体はダウンロードしない。
"""

import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.dennys.jp"
NEWS_LIST_URL = f"{BASE_URL}/news/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def _get_soup(url: str) -> BeautifulSoup:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    # サーバーがContent-TypeヘッダーにcharsetをつけないためBeautifulSoupに
    # 生バイトを渡し、HTML内のmeta charset(utf-8)から自力で判定させる
    # (response.textのままだとrequestsがISO-8859-1と誤判定し文字化けする)
    return BeautifulSoup(response.content, "html.parser")


def _iter_entries(soup: BeautifulSoup):
    """一覧ページの dt(日付) / dd.newstit(タイトル+リンク) / dd.newstxt(要約) を
    3つ1組として順に返す。"""
    for dt in soup.find_all("dt", class_="newsyear"):
        tit = dt.find_next_sibling("dd", class_="newstit")
        if not tit:
            continue
        txt = tit.find_next_sibling("dd", class_="newstxt")
        a = tit.find("a", href=True)
        if not a:
            continue
        yield {
            "date": dt.get_text(strip=True),
            "url": urljoin(BASE_URL, a["href"]),
            "title": a.get_text(strip=True),
            "summary": txt.get_text(strip=True) if txt else "",
        }


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    soup = _get_soup(NEWS_LIST_URL)

    items: list[dict] = []
    for entry in _iter_entries(soup):
        items.append({"url": entry["url"], "list_title": entry["title"], "url_date": None})
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    """PDF自体は取得せず、一覧ページから該当エントリのタイトル+要約を組み立てる。"""
    soup = _get_soup(NEWS_LIST_URL)

    for entry in _iter_entries(soup):
        if entry["url"] == url:
            text = f"{entry['title']}\n{entry['summary']}"
            return {"text": text, "image_url": None}

    # 一覧から消えていた場合(ページ送り等)は最低限タイトルだけでも返す
    return {"text": "", "image_url": None}

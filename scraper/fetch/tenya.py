"""
てんやの月別リリースアーカイブ(/release/YYYY/MM/)から、候補となる
新商品・期間限定メニューのお知らせを収集する。

一覧ページの <article class="newsBox"> 内に日付・タイトル・本文要約・
代表画像が揃っており、リンク先はHTMLページのこともPDFのこともあるため、
fetch_detailではリンク先を取得しに行かず、一覧ページ側の情報だけを
組み立てて返す(dennys.pyと同じ考え方)。
"""

import time
from datetime import date
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.tenya.co.jp"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def _current_month_url() -> str:
    today = date.today()
    return f"{BASE_URL}/release/{today.year:04d}/{today.month:02d}/"


def _get_soup(url: str) -> BeautifulSoup:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return BeautifulSoup(response.content, "html.parser")


def _iter_entries(soup: BeautifulSoup):
    for article in soup.find_all("article", class_="newsBox"):
        a = article.find("a", href=True)
        title_tag = article.find("h3", class_="newsTitle")
        caption_tag = article.find("p", class_="newsCaption")
        date_tag = article.find("time")
        img_tag = article.find("img", src=True)
        if not a or not title_tag:
            continue

        yield {
            "url": urljoin(BASE_URL, a["href"]),
            "title": title_tag.get_text(strip=True),
            "caption": caption_tag.get_text("\n", strip=True) if caption_tag else "",
            "url_date": date_tag["datetime"].strip() if date_tag and date_tag.has_attr("datetime") else None,
            "image_url": urljoin(BASE_URL, img_tag["src"]) if img_tag else None,
        }


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    soup = _get_soup(_current_month_url())

    items: list[dict] = []
    for entry in _iter_entries(soup):
        items.append(
            {"url": entry["url"], "list_title": entry["title"], "url_date": entry["url_date"]}
        )
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    """リンク先(HTMLまたはPDF)は取得せず、月別一覧ページの該当エントリから
    タイトル・本文要約・代表画像を組み立てる。"""
    soup = _get_soup(_current_month_url())

    for entry in _iter_entries(soup):
        if entry["url"] == url:
            text = f"{entry['title']}\n{entry['caption']}"
            return {"text": text, "image_url": entry["image_url"]}

    return {"text": "", "image_url": None}

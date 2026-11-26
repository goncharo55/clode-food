"""
松屋の最新情報RSSから、候補となる商品・キャンペーンページのURLを収集する。

whatsnew/rss.xml に「メニュー」「キャンペーン」「トピックス」の3カテゴリが
混在している。トピックス(アプリ障害のお詫び等、期間限定メニューと無関係な
お知らせ)は対象外にし、メニュー・キャンペーンのみを候補にする。
"""

import time
import xml.etree.ElementTree as ET

import requests

from fetch.common import extract_detail

BASE_URL = "https://www.matsuyafoods.co.jp"
RSS_URL = f"{BASE_URL}/matsuya/whatsnew/rss.xml"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

# 期間限定メニュー・キャンペーンとして扱うカテゴリ(トピックスは対象外)
RELEVANT_CATEGORIES = {"メニュー", "キャンペーン"}

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    response = _session.get(RSS_URL, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)

    root = ET.fromstring(response.content)

    items: list[dict] = []
    for item in root.findall(".//item"):
        category = (item.findtext("category") or "").strip()
        if category not in RELEVANT_CATEGORIES:
            continue

        link = (item.findtext("link") or "").strip()
        title = (item.findtext("title") or "").strip()
        if not link:
            continue

        items.append({"url": link, "list_title": title or None, "url_date": None})
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return extract_detail(response.text, url)

"""
丸亀製麺の新商品・キャンペーン情報を収集する。

このサイトには「お知らせ一覧」のようなナビゲート可能な一覧ページが存在しない
(/news/ はIR系PDFリリースのみ、/campaign/ 自体は404相当のページ)。
一方でキャンペーン個別ページは /campaign/<slug>/ という形式でサイトマップ
(sitemap.xml -> 各sitemap-N.xml)に載っているため、一覧の代わりにサイトマップを
突き合わせて /campaign/<slug>/ (日本語版、言語プレフィックス無し、スラッグが1階層のみ)
を候補として扱う。

各ページにURLから機械的に取れる日付情報は無いため、url_dateは常にNoneとし、
開始日・終了日はClaudeによる本文からの抽出に委ねる(例: 創業感謝祭ページは
本文中に「11月1日〜30日」のように明記されている)。
"""

import re
import time
from urllib.parse import urljoin
from xml.etree import ElementTree

import requests

from fetch.common import extract_detail

BASE_URL = "https://jp.marugame.com"
SITEMAP_INDEX_URL = f"{BASE_URL}/sitemap.xml"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

# /campaign/<slug>/ の1階層のみ(言語プレフィックスや深い階層を除外)
CAMPAIGN_URL_RE = re.compile(r"^https://jp\.marugame\.com/campaign/[^/]+/$")

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

_SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    # Content-TypeヘッダーにcharsetがないためrequestsがISO-8859-1と誤判定する
    # (実際はHTML側で<meta charset="utf-8">と明記されている)。明示的に矯正する。
    response.encoding = "utf-8"
    return response.text


def _iter_sitemap_urls() -> list[str]:
    index_xml = _get(SITEMAP_INDEX_URL)
    root = ElementTree.fromstring(index_xml)

    sub_sitemap_urls = [
        loc.text.strip()
        for loc in root.findall(".//sm:sitemap/sm:loc", _SITEMAP_NS)
        if loc.text
    ]
    # sitemapindexではなく単一sitemapが直接返ってきた場合のフォールバック
    if not sub_sitemap_urls:
        return [
            loc.text.strip()
            for loc in root.findall(".//sm:url/sm:loc", _SITEMAP_NS)
            if loc.text
        ]

    urls: list[str] = []
    for sub_url in sub_sitemap_urls:
        sub_xml = _get(sub_url)
        sub_root = ElementTree.fromstring(sub_xml)
        urls.extend(
            loc.text.strip()
            for loc in sub_root.findall(".//sm:url/sm:loc", _SITEMAP_NS)
            if loc.text
        )
    return urls


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    all_urls = _iter_sitemap_urls()

    items: list[dict] = []
    for url in all_urls:
        if not CAMPAIGN_URL_RE.match(url):
            continue
        items.append({"url": url, "list_title": None, "url_date": None})
        if len(items) >= limit:
            break

    return items


def fetch_detail(url: str) -> dict:
    html = _get(url)
    return extract_detail(html, url)

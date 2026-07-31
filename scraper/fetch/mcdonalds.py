"""
マクドナルドの新商品情報ページから、候補となる商品ページのURLを収集する。

/campaign/ 一覧ページはJavaScriptでリンクが描画されるSPA的な構造のため、
一覧の取得だけPlaywright(ヘッドレスブラウザ)を使う。個別の商品ページ自体は
静的に取得できるため、詳細ページの取得はrequestsで行う(misterdonut.pyと同様)。

一覧には「モーニング」「コーヒー」等の定番メニューカテゴリページも混在しており、
これらは期間限定ではないため既知のスラッグをデノイリスト(除外リスト)で除く。
定番メニューの構成が変わった場合はこのリストの見直しが必要になる。
"""

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

BASE_URL = "https://www.mcdonalds.co.jp"
CAMPAIGN_INDEX_URL = f"{BASE_URL}/campaign/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

# 定番メニューのカテゴリページ(期間限定ではないため除外)
EVERGREEN_SLUGS = {
    "samuraimac_regular",
    "set500",
    "hirumac",
    "choimc",
    "yorumac",
    "morning",
    "coffee",
}

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    """/campaign/ 一覧をPlaywrightで描画し、期間限定と思われる商品ページを抽出する。

    戻り値の各要素: {"url": str, "list_title": None, "url_date": None}
    (一覧側にタイトル・日付情報が無いため、詳細ページ本文からClaudeが抽出する)
    """
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(user_agent=USER_AGENT)
        page.goto(CAMPAIGN_INDEX_URL, timeout=30_000, wait_until="networkidle")
        raw_links = page.eval_on_selector_all(
            "a[href*='/campaign/']",
            "els => els.map(e => e.href)",
        )
        browser.close()

    items: list[dict] = []
    seen: set[str] = set()
    for href in raw_links:
        if "#" in href:
            continue
        match = re.match(rf"^{re.escape(CAMPAIGN_INDEX_URL)}([a-zA-Z0-9_-]+)/?$", href)
        if not match:
            continue
        slug = match.group(1)
        if slug in EVERGREEN_SLUGS:
            continue

        full_url = href if href.endswith("/") else f"{href}/"
        if full_url in seen:
            continue
        seen.add(full_url)
        items.append({"url": full_url, "list_title": None, "url_date": None})

        if len(items) >= limit:
            break

    return items


def fetch_detail_text(url: str) -> str:
    """商品詳細ページ本文をプレーンテキストとして取得する(Claude抽出の入力用)"""
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    return soup.get_text("\n", strip=True)

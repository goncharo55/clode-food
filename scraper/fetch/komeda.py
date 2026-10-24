"""
コメダ珈琲店の新商品・キャンペーン情報を収集する。

公式サイトはVue.js製のSPAで、一覧・詳細ともJavaScriptでレンダリングされるため
Playwright(ヘッドレスブラウザ)で両方取得する。
一覧ページの `cat=2`(新商品・キャンペーン)カテゴリのリンクのみを対象にする。
networkidleはバックグラウンド通信が続くページで到達しないことがあるため、
load待ち+短い固定待機を使う。
"""

import time

from playwright.sync_api import sync_playwright

BASE_URL = "https://www.komeda.co.jp"
NEWS_LIST_URL = f"{BASE_URL}/news/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_INTERVAL_SECONDS = 2.0


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(user_agent=USER_AGENT)
        page.goto(NEWS_LIST_URL, timeout=30_000, wait_until="load")
        page.wait_for_timeout(1500)
        raw_links = page.eval_on_selector_all(
            "a[href*='/news/detail.html']",
            "els => els.map(e => e.href)",
        )
        browser.close()

    items: list[dict] = []
    seen: set[str] = set()
    for href in raw_links:
        if "cat=2" not in href:
            continue
        if href in seen:
            continue
        seen.add(href)
        items.append({"url": href, "list_title": None, "url_date": None})
        if len(items) >= limit:
            break

    return items


def fetch_detail_text(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(user_agent=USER_AGENT)
        page.goto(url, timeout=30_000, wait_until="load")
        page.wait_for_timeout(1500)
        text = page.inner_text("body")
        browser.close()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return text

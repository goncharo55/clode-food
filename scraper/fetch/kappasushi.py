"""
かっぱ寿司のキャンペーン情報を収集する。

公式サイトはJavaScript描画のため、一覧・詳細ともPlaywrightで取得する。
URLパスに/cp/YYYYMM/のような日付が含まれるものだけを対象にし、
日付を含まない常設ページ(gochisushi, premium等)は除外する。
"""

import re
import time

from playwright.sync_api import sync_playwright

BASE_URL = "https://www.kappasushi.jp"
CAMPAIGN_LIST_URL = f"{BASE_URL}/campaign_list/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_INTERVAL_SECONDS = 2.0

DATED_PATH_RE = re.compile(r"/cp/(\d{6})/")


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(user_agent=USER_AGENT)
        page.goto(CAMPAIGN_LIST_URL, timeout=30_000, wait_until="networkidle")
        raw_links = page.eval_on_selector_all("a[href*='/cp/']", "els => els.map(e => e.href)")
        browser.close()

    items: list[dict] = []
    seen: set[str] = set()
    for href in raw_links:
        match = DATED_PATH_RE.search(href)
        if not match:
            continue
        full_url = href if href.endswith("/") else f"{href}/"
        if full_url in seen:
            continue
        seen.add(full_url)

        yyyymm = match.group(1)
        url_date = f"{yyyymm[0:4]}-{yyyymm[4:6]}-01"

        items.append({"url": full_url, "list_title": None, "url_date": url_date})
        if len(items) >= limit:
            break

    return items


def fetch_detail_text(url: str) -> str:
    # 一部ページはバックグラウンド通信が続き networkidle に到達しないため、
    # load待ち+短い固定待機に切り替える
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(user_agent=USER_AGENT)
        page.goto(url, timeout=30_000, wait_until="load")
        page.wait_for_timeout(1500)
        text = page.inner_text("body")
        browser.close()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return text

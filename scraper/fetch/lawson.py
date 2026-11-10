"""
ローソンの「今週の新商品」ページから、週替わりの新商品ラインナップを
1件の「まとめキャンペーン」として取り込む。seveneleven.pyと同じ方式。

/recommend/new/ はmeta refreshで /recommend/new/list/<週ごとに変わるID>.html に
転送される実装になっている。このIDが週ごとに自然に変わるため、他チェーンの
ように ?week=... を人工的に付与しなくても、このURL自体がそのままsourceUrlの
重複チェック用キーとして使える(過去の週のページも /recommend/new/list/ 配下に
残り続けており、ナビゲーションから辿れることを確認済み)。

各商品ブロックは <li><a href="/recommend/original/detail/XXXXXXX_XXXX.html">...
という個別詳細ページへのリンクを持ち、このhrefが商品固有のキーになっている
ため、それをそのまま重複排除キーに使う。画像はlazyloadではなく<img src>に
直接実画像パスが入っている。
"""

import re
import time
from datetime import date, timedelta
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.lawson.co.jp"
NEW_INDEX_URL = f"{BASE_URL}/recommend/new/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 20
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

_PRICE_RE = re.compile(r"([\d,]+)")
_DATE_RE = re.compile(r"(\d{4})\.(\d{2})\.(\d{2})")


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    response.encoding = response.apparent_encoding
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def _resolve_this_week_url() -> str:
    """/recommend/new/ のmeta refresh転送先(今週の実ページ)を解決する。"""
    html = _get(NEW_INDEX_URL)
    soup = BeautifulSoup(html, "html.parser")
    meta = soup.find("meta", attrs={"http-equiv": re.compile("refresh", re.I)})
    if not meta or not meta.get("content"):
        return NEW_INDEX_URL
    match = re.search(r"URL=([^\s;]+)", meta["content"], re.I)
    if not match:
        return NEW_INDEX_URL
    return urljoin(NEW_INDEX_URL, match.group(1))


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    url = _resolve_this_week_url()
    return [
        {
            "url": url,
            "list_title": "今週の新商品",
            "url_date": None,
        }
    ]


def fetch_detail(url: str) -> dict:
    html = _get(url)
    soup = BeautifulSoup(html, "html.parser")

    seen_hrefs: set[str] = set()
    lines: list[str] = []
    first_image: str | None = None
    launch_date: date | None = None

    for link in soup.select('a[href*="/recommend/original/detail/"]'):
        href = link.get("href")
        if not href or href in seen_hrefs:
            continue
        seen_hrefs.add(href)

        title_el = link.select_one(".ttl")
        price_el = link.select_one(".price")
        date_el = link.select_one(".date span")
        if not title_el:
            continue
        name = title_el.get_text(strip=True)
        price_match = _PRICE_RE.search(price_el.get_text(strip=True)) if price_el else None
        price_str = f"{price_match.group(1)}円" if price_match else ""

        lines.append(f"・{name}（{price_str}）" if price_str else f"・{name}")

        if launch_date is None and date_el:
            date_match = _DATE_RE.search(date_el.get_text(strip=True))
            if date_match:
                launch_date = date(int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3)))

        if first_image is None:
            img = link.select_one("img")
            if img and img.get("src"):
                first_image = urljoin(BASE_URL, img["src"])

    if launch_date:
        week_end = launch_date + timedelta(days=6)
        lines.append(f"\n（この新商品ラインナップの販売期間: {launch_date.isoformat()}〜{week_end.isoformat()}、次回更新まで）")

    text = "ローソン 今週の新商品一覧\n" + "\n".join(lines)
    return {"text": text, "image_url": first_image}

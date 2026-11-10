"""
ファミリーマートの「新商品」ページから、週替わりの新商品ラインナップを
1件の「まとめキャンペーン」として取り込む。seveneleven.pyと同じ方式。

このページはセブン-イレブンと違い、1商品=1ブロック(.ly-mod-infoset3)で
地域ごとの重複掲載が無く、各ブロックの詳細リンクhrefに商品固有の数値コードが
入っているため、そのままhrefをキーに重複排除すれば十分(念のためコードは
残しておく)。画像はlazyloadではなく<img src>に直接実画像パスが入っている。

更新曜日の明記が見つからなかったため、セブン-イレブンと同様「直近の火曜日」を
週の開始日とみなす(実際の更新曜日とずれても、1週間単位でsourceUrlが切り替わり
古い週の情報が延々residualしない、という目的は達成できるため実害は小さい)。
"""

import re
import time
from datetime import date, timedelta
from urllib.parse import urljoin, urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.family.co.jp"
NEW_GOODS_URL = f"{BASE_URL}/goods/newgoods.html"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 20
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

_PRICE_RE = re.compile(r"([\d,]+)\s*円")


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    response.encoding = response.apparent_encoding
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def _most_recent_tuesday(today: date) -> date:
    return today - timedelta(days=(today.weekday() - 1) % 7)


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    week_start = _most_recent_tuesday(date.today())
    url = f"{NEW_GOODS_URL}?week={week_start.isoformat()}"
    return [
        {
            "url": url,
            "list_title": "新商品",
            "url_date": week_start.isoformat(),
        }
    ]


def fetch_detail(url: str) -> dict:
    clean_url = urlunsplit(urlsplit(url)._replace(query=""))
    html = _get(clean_url)
    soup = BeautifulSoup(html, "html.parser")

    seen_hrefs: set[str] = set()
    lines: list[str] = []
    first_image: str | None = None

    for block in soup.select(".ly-mod-infoset3"):
        link_el = block.select_one("a.ly-mod-infoset3-link")
        href = link_el.get("href") if link_el else None
        if href:
            if href in seen_hrefs:
                continue
            seen_hrefs.add(href)

        title_el = block.select_one(".ly-mod-infoset3-ttl")
        price_el = block.select_one(".ly-mod-infoset3-txt")
        if not title_el:
            continue
        name = title_el.get_text(strip=True)
        price_text = price_el.get_text(strip=True) if price_el else ""
        price_match = _PRICE_RE.search(price_text)
        price_str = f"{price_match.group(1)}円" if price_match else ""

        lines.append(f"・{name}（{price_str}）" if price_str else f"・{name}")

        if first_image is None:
            img = block.select_one("img")
            if img:
                src = img.get("src")
                if src:
                    first_image = urljoin(BASE_URL, src)

    week_match = re.search(r"week=(\d{4}-\d{2}-\d{2})", url)
    if week_match:
        week_start = date.fromisoformat(week_match.group(1))
        week_end = week_start + timedelta(days=6)
        lines.append(f"\n（この新商品ラインナップの販売期間: {week_start.isoformat()}〜{week_end.isoformat()}、次回更新まで）")

    text = "ファミリーマート 新商品一覧\n" + "\n".join(lines)
    return {"text": text, "image_url": first_image}

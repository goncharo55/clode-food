"""
セブン-イレブンの「今週の新商品」ページから、週替わりの新商品ラインナップを
1件の「まとめキャンペーン」として取り込む。

他チェーンと違い、このページは1商品=1詳細ページという構造ではなく、
「北海道」「東北」「関東」…と地域ごとに新商品を並べた単一ページ(ほぼ全商品を
網羅、同じ商品が複数地域ブロックに重複掲載される)。ユーザー要望により、
これを個別キャンペーンとして大量投入するのではなく「今週のセブン-イレブン
新商品まとめ」という1エントリにtarget_productsとして列挙する方式にする。

そのため fetch_new_product_links は常に「今週のページ」を指す1件だけを返す
(他チェーンのような複数候補ページの収集ではない)。sourceUrlには週の火曜日の
日付をクエリパラメータとして付与し、取り込み時のURL重複チェック
(load/ingest.py の check_exists、sourceUrlの完全一致判定)が週ごとに別エントリ
として扱われるようにする(実際のページ取得時はこのクエリは外して本来のURLに
アクセスする)。

地域ブロックごとに同じ商品(同じアイテムコード)が繰り返し掲載されるため、
HTMLのクラス名に埋め込まれたアイテムコード(例: "list_inner -item-code-041748")
で重複排除してから、Claudeに渡すコンパクトなテキストを組み立てる。
"""

import re
import time
from datetime import date, timedelta
from urllib.parse import urljoin, urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.sej.co.jp"
THIS_WEEK_URL = f"{BASE_URL}/products/a/thisweek.html"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 20
REQUEST_INTERVAL_SECONDS = 2.0

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})

_ITEM_CODE_RE = re.compile(r"-item-code-(\w+)")
_PRICE_RE = re.compile(r"([\d,]+)\s*円")


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    response.encoding = response.apparent_encoding
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def _most_recent_tuesday(today: date) -> date:
    """「毎週火曜日更新」なので、本日以前で直近の火曜日を今週の更新日とみなす。"""
    return today - timedelta(days=(today.weekday() - 1) % 7)


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    """常に「今週の新商品まとめ」1件だけを返す(limitは無視する)。"""
    week_start = _most_recent_tuesday(date.today())
    url = f"{THIS_WEEK_URL}?week={week_start.isoformat()}"
    return [
        {
            "url": url,
            "list_title": "今週の新商品",
            "url_date": week_start.isoformat(),
        }
    ]


def fetch_detail(url: str) -> dict:
    # ?week=... はsourceUrlの重複チェック用の目印なので、実際の取得時は外す
    clean_url = urlunsplit(urlsplit(url)._replace(query=""))
    html = _get(clean_url)
    soup = BeautifulSoup(html, "html.parser")

    seen_codes: set[str] = set()
    lines: list[str] = []
    first_image: str | None = None

    for block in soup.select("div.list_inner"):
        code_match = _ITEM_CODE_RE.search(" ".join(block.get("class", [])))
        code = code_match.group(1) if code_match else None
        if code and code in seen_codes:
            continue
        if code:
            seen_codes.add(code)

        title_el = block.select_one(".item_ttl a")
        price_el = block.select_one(".item_price p")
        if not title_el:
            continue
        name = title_el.get_text(strip=True)
        price_text = price_el.get_text(strip=True) if price_el else ""
        price_match = _PRICE_RE.search(price_text)
        price_str = f"{price_match.group(1)}円" if price_match else ""

        lines.append(f"・{name}（{price_str}）" if price_str else f"・{name}")

        if first_image is None:
            img = block.select_one("figure img")
            if img:
                src = img.get("data-original") or img.get("src")
                if src and not src.endswith("giphy.gif"):
                    first_image = urljoin(BASE_URL, src)

    # 来週火曜日の更新で入れ替わるため、Claudeが終了日を明示的なテキストから
    # 拾えるようにしておく(本文に明記が無いとend_dateがnullになり、endDateなしの
    # キャンペーンとして永続的に「開催中」表示され続けてしまう=14チェーン放置と同じ不具合)
    week_match = re.search(r"week=(\d{4}-\d{2}-\d{2})", url)
    if week_match:
        week_start = date.fromisoformat(week_match.group(1))
        week_end = week_start + timedelta(days=6)
        lines.append(f"\n（この新商品ラインナップの販売期間: {week_start.isoformat()}〜{week_end.isoformat()}、次回火曜日に更新）")

    text = "セブン-イレブン 今週の新商品一覧\n" + "\n".join(lines)
    return {"text": text, "image_url": first_image}

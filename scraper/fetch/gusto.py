"""
ガストのキャンペーンページから、候補となるページURLを収集する。

公式サイトの構造上キャンペーンページのURL(/gusto/campaign/)は固定で、中身(開催中の
キャンペーン)だけが差し替わる。本パイプラインはsourceUrlの完全一致で既存データを判定する
(load/ingest.pyのcheck_exists)ため、URLが変わらないままでは新しいキャンペーンへの
切り替わりを検知できない。

対策として、ページ内の商品画像ファイル名に必ず付いている「YYYYMM_キャンペーン名」形式の
プレフィックス(例: 202611_blackfridaycoupon)を識別子として使い、キャンペーンが切り替わる
たびに付与されるURLのクエリ文字列を変える。fetch_detail側では、その合成クエリを取り除いた
本来のURLへ実際にはアクセスする。

ガストのページには本文中に具体的な開始日・終了日の記載が見当たらないため、識別子の
YYYYMM部分を「その月の1日」の開始日候補(url_date)としてmain.py側のフォールバックに渡す。
"""

import re
import time
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://www.skylark.co.jp"
CAMPAIGN_URL = f"{BASE_URL}/gusto/campaign/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

# 商品画像ファイル名に付く「YYYYMM_キャンペーン名」プレフィックス
# (例: 202611_blackfridaycoupon_banner_PC.webp の 202611_blackfridaycoupon 部分)
CAMPAIGN_IMAGE_RE = re.compile(r"(\d{6}_[A-Za-z0-9]+)_(?:banner|menu|title)")

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def _get(url: str) -> str:
    response = _session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    time.sleep(REQUEST_INTERVAL_SECONDS)
    return response.text


def _strip_campaign_marker(url: str) -> str:
    """fetch_new_product_linksが埋め込んだ識別子クエリ(cf_id)を取り除き、実アクセス用のURLに戻す。"""
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"


def _find_campaign_marker(html: str) -> str | None:
    match = CAMPAIGN_IMAGE_RE.search(html)
    return match.group(1) if match else None


def _url_date_from_marker(marker: str) -> str | None:
    """識別子先頭のYYYYMMから、その月1日をstart_dateのフォールバック候補として組み立てる。"""
    digits = marker[:6]
    if not digits.isdigit():
        return None
    year, month = digits[:4], digits[4:6]
    return f"{year}-{month}-01"


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    html = _get(CAMPAIGN_URL)
    soup = BeautifulSoup(html, "html.parser")
    title_tag = soup.find("title")
    list_title = title_tag.get_text(strip=True).split("｜")[0] if title_tag else None

    marker = _find_campaign_marker(html)
    if not marker:
        # 識別子が見つからない場合は安全側に倒してこの回は候補を返さない
        # (識別子無しで固定URLのまま送ると、以後ずっと同じキャンペーン扱いでスキップされ続けるため)
        return []

    marked_url = f"{CAMPAIGN_URL}?cf_id={marker}"
    item = {"url": marked_url, "list_title": list_title, "url_date": _url_date_from_marker(marker)}
    return [item][:limit]


def fetch_detail(url: str) -> dict:
    real_url = _strip_campaign_marker(url)
    html = _get(real_url)
    return extract_detail(html, real_url)

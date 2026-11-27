"""
ジョナサンのキャンペーンページから、候補となるページURLを収集する。

公式サイトの構造上キャンペーンページのURL(/jonathan/campaign/)は固定で、中身(開催中の
キャンペーン)だけが差し替わる。本パイプラインはsourceUrlの完全一致で既存データを判定する
(load/ingest.pyのcheck_exists)ため、URLが変わらないままでは新しいキャンペーンへの
切り替わりを検知できない。

対策として、ページ内のJSON-LD(Product/Offerの priceValidUntil)を識別子として使い、
キャンペーンが切り替わるたびに付与されるURLのクエリ文字列を変える。fetch_detail側では、
その合成クエリを取り除いた本来のURLへ実際にはアクセスする。

また、JSON-LDのdescriptionや画像alt属性に埋め込まれた開催期間のテキストは
fetch.common.extract_detail()のget_text()では(script/imgのalt属性のため)拾えず
Claudeに渡る本文から欠落してしまう。そのため本モジュールではJSON-LDのdescriptionと、
日付らしきパターンを含むimg alt属性を個別に抽出し、本文テキストの先頭に差し込む。
"""

import json
import re
import time
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from fetch.common import extract_detail

BASE_URL = "https://www.skylark.co.jp"
CAMPAIGN_URL = f"{BASE_URL}/jonathan/campaign/"

USER_AGENT = "KikanGenteiCalendarBot/0.1 (personal hobby project; low-frequency aggregator)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_INTERVAL_SECONDS = 2.0

# 「11.19 Thu〜12.2 Wed」のような開催期間表記をimgのalt属性から拾うためのパターン
DATE_RANGE_ALT_RE = re.compile(r"\d{1,2}\.\d{1,2}\s*[A-Za-z]{0,4}\s*[〜~～]\s*\d{1,2}\.\d{1,2}\s*[A-Za-z]{0,4}")

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


def _iter_json_ld_nodes(soup: BeautifulSoup):
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (TypeError, ValueError):
            continue
        graph = data.get("@graph") if isinstance(data, dict) else None
        nodes = graph if isinstance(graph, list) else [data]
        for node in nodes:
            if isinstance(node, dict):
                yield node


def _find_price_valid_until(soup: BeautifulSoup) -> str | None:
    """JSON-LD中のOffer.priceValidUntilを探す(キャンペーン切り替わりで値が変わる識別子として使う)。"""
    for node in _iter_json_ld_nodes(soup):
        offers = node.get("offers")
        if isinstance(offers, dict) and offers.get("priceValidUntil"):
            return offers["priceValidUntil"]
    return None


def _find_webpage_description(soup: BeautifulSoup) -> str | None:
    """JSON-LDのWebPageノードのdescription(開催期間・内容の要約文)を拾う。"""
    for node in _iter_json_ld_nodes(soup):
        if node.get("@type") == "WebPage" and node.get("description"):
            return node["description"]
    return None


def _find_date_range_from_alt(soup: BeautifulSoup) -> str | None:
    """バナー画像のalt属性に書かれた「11.19 Thu〜12.2 Wed」のような開催期間表記を拾う。"""
    for img in soup.find_all("img", alt=True):
        match = DATE_RANGE_ALT_RE.search(img["alt"])
        if match:
            return match.group(0)
    return None


def fetch_new_product_links(limit: int = 5) -> list[dict]:
    html = _get(CAMPAIGN_URL)
    soup = BeautifulSoup(html, "html.parser")
    title_tag = soup.find("title")
    list_title = title_tag.get_text(strip=True).split("｜")[0] if title_tag else None

    price_valid_until = _find_price_valid_until(soup)
    if not price_valid_until:
        # 識別子が見つからない場合は安全側に倒してこの回は候補を返さない
        # (識別子無しで固定URLのまま送ると、以後ずっと同じキャンペーン扱いでスキップされ続けるため)
        return []

    marked_url = f"{CAMPAIGN_URL}?cf_id={price_valid_until}"
    item = {"url": marked_url, "list_title": list_title, "url_date": None}
    return [item][:limit]


def fetch_detail(url: str) -> dict:
    real_url = _strip_campaign_marker(url)
    html = _get(real_url)
    soup = BeautifulSoup(html, "html.parser")

    extra_lines = []
    description = _find_webpage_description(soup)
    if description:
        extra_lines.append(description)
    date_range = _find_date_range_from_alt(soup)
    if date_range:
        extra_lines.append(f"開催期間表記: {date_range}")
    price_valid_until = _find_price_valid_until(soup)
    if price_valid_until:
        extra_lines.append(f"価格有効期限: {price_valid_until}")

    detail = extract_detail(html, real_url)
    if extra_lines:
        detail["text"] = "\n".join(extra_lines) + "\n" + detail["text"]
    return detail

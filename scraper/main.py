"""
スクレイパーのエントリポイント（複数チェーン対応）。

流れ: 新商品情報一覧を取得 → 候補ページを絞り込み → 各詳細ページを取得
      → Claudeで構造化抽出 → pending_reviewとして取り込みAPIへ送信

実行方法:
    cd scraper
    pip install -r requirements.txt
    playwright install chromium   # マクドナルド等JS描画サイトの取得に必要
    cp .env.example .env  # ANTHROPIC_API_KEY等を設定
    python main.py [取得件数(デフォルト3)] [チェーンslug(省略時は全チェーン)]

事前にapps/web側でアプリを起動し、INGEST_SECRETを一致させておくこと。
"""

import re
import sys

# Windows既定のコンソールエンコーディング(cp932)では日本語のprintでエラーになるため矯正する
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv

load_dotenv()

from extract.claude_extract import extract_campaign_fields
from fetch import cocoichi, mcdonalds, misterdonut, starbucks, yoshinoya
from load.ingest import submit_pending_campaign

# 対応チェーン一覧。fetchモジュールは fetch_new_product_links / fetch_detail_text を実装すること
CHAINS = {
    "mister-donut": misterdonut,
    "mcdonalds": mcdonalds,
    "starbucks-japan": starbucks,
    "yoshinoya": yoshinoya,
    "cocoichi": cocoichi,
}

# Claudeが日付を特定できない際に "<UNKNOWN>" 等のプレースホルダーを返すことがあるため、
# YYYY-MM-DD形式かどうかを検証してから送信する
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def valid_date_or_none(value: str | None) -> str | None:
    return value if value and DATE_RE.match(value) else None


def run_for_chain(chain_slug: str, module, limit: int) -> None:
    print(f"[fetch] {chain_slug} の新商品情報一覧を取得中...")
    try:
        items = module.fetch_new_product_links(limit=limit)
    except Exception as e:  # noqa: BLE001 - 1チェーンの失敗で全体を止めない
        print(f"  一覧取得失敗、スキップ: {e}")
        return
    print(f"[fetch] {len(items)}件の候補ページを検出")

    for item in items:
        url = item["url"]
        print(f"\n[fetch] 詳細ページ取得: {url}")
        try:
            raw_text = module.fetch_detail_text(url)
        except Exception as e:  # noqa: BLE001
            print(f"  取得失敗、スキップ: {e}")
            continue

        print("[extract] Claudeで構造化抽出中...")
        try:
            extracted = extract_campaign_fields(
                raw_text=raw_text,
                source_url=url,
                list_title=item.get("list_title"),
                url_date=item.get("url_date"),
            )
        except Exception as e:  # noqa: BLE001
            print(f"  抽出失敗、スキップ: {e}")
            continue

        start_date = valid_date_or_none(extracted.get("start_date")) or valid_date_or_none(
            item.get("url_date")
        )
        end_date = valid_date_or_none(extracted.get("end_date"))

        payload = {
            "chainSlug": chain_slug,
            "title": extracted.get("title"),
            "description": extracted.get("description"),
            "startDate": start_date,
            "endDate": end_date,
            "targetProducts": extracted.get("target_products", []),
            "imageUrl": extracted.get("image_url"),
            "sourceUrl": url,
            "extractionMetadata": {
                "extractedBy": "claude",
                "confidence": extracted.get("confidence"),
                "notes": extracted.get("notes"),
                "listTitle": item.get("list_title"),
            },
        }

        if not payload["startDate"]:
            print("  開始日を特定できずスキップ")
            continue

        print("[load] 取り込みAPIへ送信中...")
        try:
            result = submit_pending_campaign(payload)
        except Exception as e:  # noqa: BLE001
            print(f"  送信失敗: {e}")
            continue

        if result.get("created"):
            print(f"  -> 新規登録({result.get('status', '?')}): id={result.get('id')}")
        else:
            print(f"  -> 既存データ({result.get('status', '?')})のためスキップ: id={result.get('id')}")


def run(limit: int = 3, only_chain: str | None = None) -> None:
    targets = {only_chain: CHAINS[only_chain]} if only_chain else CHAINS
    for chain_slug, module in targets.items():
        run_for_chain(chain_slug, module, limit)
        print()


if __name__ == "__main__":
    limit_arg = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    chain_arg = sys.argv[2] if len(sys.argv) > 2 else None
    if chain_arg and chain_arg not in CHAINS:
        print(f"未対応のチェーンです: {chain_arg} (対応: {', '.join(CHAINS)})")
        sys.exit(1)
    run(limit=limit_arg, only_chain=chain_arg)

"""
スクレイパーのエントリポイント（現状はミスタードーナツ1チェーンのみ対応）。

流れ: 新商品情報一覧を取得 → 候補ページを絞り込み → 各詳細ページを取得
      → Claudeで構造化抽出 → pending_reviewとして取り込みAPIへ送信

実行方法:
    cd scraper
    pip install -r requirements.txt
    cp .env.example .env  # ANTHROPIC_API_KEY等を設定
    python main.py [取得件数(デフォルト3)]

事前にapps/web側で `npm run dev` を起動し、INGEST_SECRETを一致させておくこと。
"""

import sys

# Windows既定のコンソールエンコーディング(cp932)では日本語のprintでエラーになるため矯正する
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv

load_dotenv()

from extract.claude_extract import extract_campaign_fields
from fetch.misterdonut import fetch_detail_text, fetch_new_product_links
from load.ingest import submit_pending_campaign

CHAIN_SLUG = "mister-donut"


def run(limit: int = 3) -> None:
    print(f"[fetch] {CHAIN_SLUG} の新商品情報一覧を取得中...")
    items = fetch_new_product_links(limit=limit)
    print(f"[fetch] {len(items)}件の候補ページを検出")

    for item in items:
        url = item["url"]
        print(f"\n[fetch] 詳細ページ取得: {url}")
        try:
            raw_text = fetch_detail_text(url)
        except Exception as e:  # noqa: BLE001 - 1件の失敗で全体を止めない
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

        payload = {
            "chainSlug": CHAIN_SLUG,
            "title": extracted.get("title"),
            "description": extracted.get("description"),
            "startDate": extracted.get("start_date") or item.get("url_date"),
            "endDate": extracted.get("end_date"),
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
            print(f"  -> 新規登録(pending_review): id={result.get('id')}")
        else:
            print(f"  -> 既存データのためスキップ: id={result.get('id')}")


if __name__ == "__main__":
    limit_arg = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    run(limit=limit_arg)

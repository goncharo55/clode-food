"""Claude (Anthropic API) を使って、ページ本文から期間限定情報を構造化抽出する。

注意: これはClaude Codeのセッション利用とは別に、Anthropic Consoleで発行した
単体のAPIキー(ANTHROPIC_API_KEY)を使用する。利用量に応じて課金される。
"""

import os

from anthropic import Anthropic

MODEL = "claude-sonnet-5"

_client: Anthropic | None = None


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        _client = Anthropic(api_key=api_key)
    return _client


EXTRACTION_TOOL = {
    "name": "record_campaign",
    "description": "抽出した期間限定キャンペーン・新商品情報を構造化して記録する",
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "キャンペーン・商品名"},
            "description": {"type": "string", "description": "1〜2文程度の説明"},
            "start_date": {
                "type": "string",
                "description": "YYYY-MM-DD形式の販売開始日。本文に明記がなければurl_dateを使う",
            },
            "end_date": {
                "type": ["string", "null"],
                "description": "YYYY-MM-DD形式の終了日。明記がなければnull",
            },
            "target_products": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "price": {"type": "number"},
                    },
                    "required": ["name"],
                },
            },
            "image_url": {"type": ["string", "null"]},
            "confidence": {"type": "number", "description": "抽出結果の確信度 0.0〜1.0"},
            "notes": {
                "type": "string",
                "description": "終了日が「なくなり次第終了」等で曖昧、店舗限定の可能性がある等、レビュー時に人が確認すべき注意点",
            },
        },
        "required": ["title", "start_date", "target_products", "confidence"],
    },
}


def extract_campaign_fields(
    raw_text: str,
    source_url: str,
    list_title: str | None,
    url_date: str | None,
) -> dict:
    client = _get_client()

    prompt = f"""以下は飲食チェーンの新商品・キャンペーンページの本文テキストです。
このページから期間限定メニュー・キャンペーン情報を抽出し、record_campaignツールで記録してください。

- 一覧ページでのタイトル候補: {list_title or "(不明)"}
- URLから推定される公開日: {url_date or "(不明)"}
- 出典URL: {source_url}

本文:
---
{raw_text[:8000]}
---

開始日が本文中に明記されていなければ、URLから推定される公開日を開始日として使ってください。
終了日が「なくなり次第終了」「順次終了」など曖昧な場合はend_dateをnullにし、notesにその旨を書いてください。
複数商品が掲載されている場合はtarget_productsに全て列挙してください。
"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        tools=[EXTRACTION_TOOL],
        tool_choice={"type": "tool", "name": "record_campaign"},
        messages=[{"role": "user", "content": prompt}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "record_campaign":
            return block.input

    raise RuntimeError("Claude did not return the expected tool_use block")

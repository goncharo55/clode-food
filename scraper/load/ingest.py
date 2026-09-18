"""抽出結果をNext.jsアプリの取り込みAPI(/api/ingest)へ送信する。"""

import os

import requests


def submit_pending_campaign(payload: dict) -> dict:
    api_url = os.environ.get("INGEST_API_URL", "http://localhost:3000/api/ingest")
    secret = os.environ.get("INGEST_SECRET")
    if not secret:
        raise RuntimeError("INGEST_SECRET is not set")

    response = requests.post(
        api_url,
        json=payload,
        headers={"x-ingest-secret": secret},
        timeout=15,
    )
    if not response.ok:
        raise RuntimeError(
            f"ingest API returned {response.status_code}: {response.text[:500]}"
        )
    return response.json()

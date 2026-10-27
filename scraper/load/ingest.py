"""抽出結果をNext.jsアプリの取り込みAPI(/api/ingest)へ送信する。"""

import os

import requests


def _ingest_url() -> str:
    return os.environ.get("INGEST_API_URL", "http://localhost:3000/api/ingest")


def _secret() -> str:
    secret = os.environ.get("INGEST_SECRET")
    if not secret:
        raise RuntimeError("INGEST_SECRET is not set")
    return secret


def check_exists(source_url: str) -> bool:
    """既に取り込み済みのURLかどうかを確認する(Claude抽出より前に呼び、無駄な課金を避ける)。"""
    response = requests.get(
        _ingest_url(),
        params={"sourceUrl": source_url},
        headers={"x-ingest-secret": _secret()},
        timeout=15,
    )
    if not response.ok:
        # 確認できない場合は「存在しない」として扱い、通常どおり処理を続行する
        # (取り込み側でも重複チェックしているため、二重登録にはならない)
        return False
    return bool(response.json().get("exists"))


def submit_pending_campaign(payload: dict) -> dict:
    response = requests.post(
        _ingest_url(),
        json=payload,
        headers={"x-ingest-secret": _secret()},
        timeout=15,
    )
    if not response.ok:
        raise RuntimeError(
            f"ingest API returned {response.status_code}: {response.text[:500]}"
        )
    return response.json()

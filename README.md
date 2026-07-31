# 期間限定カレンダー（clode_food）

飲食チェーンの期間限定メニュー・キャンペーン・コラボ情報を自動収集し、
「今日は何を食べよう？」「近くで期間限定メニューをやっているお店は？」を
数秒で見つけられるWebサービス。

## 構成

```
clode_food/
  apps/web/       Next.js アプリ本体（フロント + API + 管理画面）
  scraper/        Python製 スクレイピング/AI抽出パイプライン（バッチ実行）
  docs/           データモデル・運用メモ
  .github/workflows/   将来の自動実行用ワークフロー雛形
```

## セットアップ（開発環境）

```bash
cd apps/web
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

http://localhost:3000 でアクセスできます。

## ドキュメント

- [データモデル](docs/data-model.md)
- [運用メモ・今後の自動化](docs/ops-notes.md)

## 現状のスコープ

MVP: チェーン検索、イベントカレンダー、エリア/駅検索、イベント詳細、終了間近ウィジェット、
簡易管理画面（承認フロー）、3チェーン（ミスタードーナツ・マクドナルド・スターバックス）分の
スクレイパー動作確認まで。

自動定期実行（GitHub Actions等）や本番DB（Supabase/Neon等）への切替、
お気に入り・通知・Google Map・AIおすすめ等は将来対応（[ops-notes.md](docs/ops-notes.md)参照）。

# 運用メモ・今後の自動化

現状（MVP）はローカルSQLite + 手動実行のスクレイパーで完結している。
本番運用に向けて必要になるステップをここにまとめる。

## 1. 本番DBへの切替（Supabase推奨）

1. https://supabase.com で無料アカウント作成、新規プロジェクト作成
2. プロジェクトの Postgres 接続文字列（`DATABASE_URL`）を取得
3. `apps/web/prisma/schema.prisma` の `datasource db` の `provider` を `sqlite` → `postgresql` に変更
4. `apps/web/.env` の `DATABASE_URL` をSupabaseの接続文字列に差し替え
5. `npx prisma migrate deploy` で本番DBにスキーマを適用
6. `npx prisma db seed` は本番では通常不要（実データはスクレイパー経由で投入）

## 2. Next.jsアプリのデプロイ（Vercel推奨）

1. GitHubリポジトリを作成しプッシュ
2. Vercelでリポジトリをインポート、Root Directoryを `apps/web` に設定
3. 環境変数 `DATABASE_URL`、`ADMIN_PASSWORD` 等を設定
4. デプロイ

## 3. スクレイパーの自動定期実行（GitHub Actions推奨）

現状 `scraper/main.py` はローカルで手動実行する前提。定期実行するには:

1. `scraper/requirements.txt` の依存を使い、GitHub Actionsのランナー上でPythonを実行
2. Secretsに `DATABASE_URL`（Supabase等、本番DB）と `ANTHROPIC_API_KEY` を登録
   - 注意: これはClaude Code利用とは別に、スクレイパー用に単体のAnthropic APIキーを
     https://console.anthropic.com で発行し、利用量に応じた課金が発生する
3. `.github/workflows/scrape.yml` の雛形（本リポジトリに配置済み、`schedule:` はコメントアウト状態）
   のコメントを外して有効化
4. 実行頻度は6〜12時間に1回程度を推奨（対象サイトへの負荷を抑えるため）

## 4. スクレイピング対象を増やす際の注意

- 一度に多数のチェーンを追加せず、1チェーンずつ動作確認しながら追加する
- 各チェーンの `robots.txt` を確認し、許可されている範囲でのみ取得する
- リクエスト間隔を空け、エラー時はリトライを控えて自動的にバックオフする
- 画像は可能な範囲で公式サイトへのリンク・出典明記を優先し、大量の一括複製は避ける

## 5. AdSense申請のタイミング

- プレースホルダーではない実データ（スクレイパー経由で継続的に更新されている状態）が
  数週間分蓄積し、ある程度のオーガニックトラフィックが出てから申請するのが望ましい
- `ads.txt` はコードとして用意済み（`apps/web/app/ads.txt/route.ts`）。
  AdSenceアカウント発行後、そこに記載のpublisher IDを環境変数等で反映する

## 6. 地図機能について（一度試して撤回した経緯）

`/areas/[slug]` に、OpenStreetMapの無料API（Nominatim + Overpass API）で周辺の実店舗を
その場で検索し、Leafletの地図上にピン表示する機能を一度実装したが、体感速度が重い
（地図ライブラリの読み込み＋外部APIへの都度アクセスで表示が遅い、Overpass APIの
公開インスタンスが時々タイムアウトする）という理由で撤回した。

代わりに、各チェーンの見出し横に「📍 近くの店舗をGoogleマップで探す」という
軽量なリンク（`lib/googleMaps.ts` の `googleMapsSearchUrl`）を設置している。
自前で地図やAPI呼び出しを持たないため表示が軽く、店舗検索の精度もGoogle側に任せられる。
`Area.lat`/`lng` カラムはスキーマ上残っているが（`docs/data-model.md`参照）、
現在のUIでは使用していない（将来、地図機能を再検討する場合の下地として残置）。

## 7. 将来機能（未着手）

- お気に入り登録（好きなチェーンのみ表示）
- 通知（新商品開始・終了3日前）
- AIおすすめ・デートモード

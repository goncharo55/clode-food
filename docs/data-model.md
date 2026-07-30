# データモデル

MVPで使うエンティティと関係。実装は `apps/web/prisma/schema.prisma` を正とする。

## Chain（チェーン）

飲食チェーン1社を表す。

| フィールド | 型 | 説明 |
|---|---|---|
| id | String (cuid) | 主キー |
| name | String | チェーン名（例: マクドナルド） |
| slug | String (unique) | URL用（例: mcdonalds） |
| category | String | 業態カテゴリ（`lib/categoryVisuals.ts`の7分類。画像プレースホルダーとイベントカレンダーの配色に使用） |
| officialSiteUrl | String | 公式サイトURL |
| logoImageUrl | String? | ロゴ画像URL |
| description | String? | 簡単な説明 |

## Campaign（キャンペーン／期間限定イベント）

サービスの中心的なエンティティ。1つの期間限定メニュー・フェア・コラボを表す。

| フィールド | 型 | 説明 |
|---|---|---|
| id | String (cuid) | 主キー |
| chainId | String (FK→Chain) | 主催チェーン |
| title | String | キャンペーン名（例: カレー祭り） |
| description | String? | 詳細説明 |
| startDate | DateTime | 開始日 |
| endDate | DateTime? | 終了日（null=なくなり次第終了など未確定） |
| targetProducts | Json | 対象商品配列 `[{name, price}]` |
| imageUrl | String? | 画像URL |
| sourceUrl | String? | 抽出元の公式ニュース/キャンペーンページURL。未設定時は`lib/campaignLink.ts`がチェーンの公式サイトURLにフォールバックし、404を防ぐ |
| status | Enum | `draft` / `pending_review` / `published` / `archived` |
| featured | Boolean | 人気順の簡易代替（手動フラグ） |
| extractionMetadata | Json? | AI抽出時の生データ・信頼度（管理画面でのレビュー用） |
| createdAt / updatedAt | DateTime | - |

`status` の流れ: スクレイパーが `pending_review` で作成 → 管理画面で承認すると `published` →
`endDate` 経過後は自動的に `archived`。

## Area（エリア）

大まかな地域区分（例: 渋谷、新宿、関東）。実店舗の緯度経度ではなく、
「エリア・駅名単位のタグ付け」でMVPの位置検索を実現するための単位。

| フィールド | 型 | 説明 |
|---|---|---|
| id | String (cuid) | 主キー |
| name | String | エリア名（例: 渋谷） |
| slug | String (unique) | URL用 |
| region | String? | 大区分（例: 関東、関西） |
| lat / lng | Float? | 駅の代表座標（Nominatimでジオコーディング済み）。地図表示・周辺店舗検索に使用 |

## StationAlias（駅名エイリアス）

「新宿駅」のような駅名検索をAreaに解決するための静的な対応表。

| フィールド | 型 | 説明 |
|---|---|---|
| id | String (cuid) | 主キー |
| stationName | String (unique) | 駅名（例: 新宿駅） |
| areaId | String (FK→Area) | 対応するエリア |

## CampaignArea（中間テーブル）

CampaignとAreaの多対多。空（未指定）の場合は「全国区」として扱う。

| フィールド | 型 |
|---|---|
| campaignId | String (FK→Campaign) |
| areaId | String (FK→Area) |

## Store（店舗）※MVPでは未使用のプレースホルダー

Stage B（将来）で実店舗の位置情報を扱うためのスキーマのみ用意。
MVPのUI・検索ロジックからは参照しない。

| フィールド | 型 | 説明 |
|---|---|---|
| id | String (cuid) | 主キー |
| chainId | String (FK→Chain) | - |
| name | String | 店舗名 |
| address | String? | 住所 |
| lat / lng | Float? | 緯度経度 |
| areaId | String? (FK→Area) | 所属エリア |

## 関係図

```
Chain 1───N Campaign N───N Area N───1 StationAlias(N)
                              │
                              └─(将来) Store N───1 Chain, N───1 Area
```

/**
 * シードデータ。
 *
 * 24チェーンの実在キャンペーンについては、実際に公式サイト・報道発表を
 * WebFetch/curlで確認した上でsourceUrl・imageUrlに実URLを設定している
 * （調査時点: 2026年7月29日前後。各チェーンのofficialSiteUrlはcurlで200を確認済み）。
 * ただし価格・終了日等の詳細情報が公式ページに明記されていない項目もあり、
 * その場合は不明なものとして扱っている（targetProductsのpriceを省略、endDateをnull等）。
 *
 * pending_review状態の2件（コメダ・ミスタードーナツ）のみ、
 * 管理画面の承認フローを試すためのフィクションのサンプルデータ。
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { categoryVisual, type ChainCategory } from "../lib/categoryVisuals";

const prisma = new PrismaClient();

// 実データ調査時点の日付を起点にする
const TODAY = new Date("2026-07-29T00:00:00+09:00");

function daysFromToday(days: number): Date {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d;
}

type ChainDef = {
  name: string;
  slug: string;
  category: ChainCategory;
  officialSiteUrl: string;
  description: string;
};

const chainDefs: ChainDef[] = [
  { name: "マクドナルド", slug: "mcdonalds", category: "burger_fastfood", officialSiteUrl: "https://www.mcdonalds.co.jp/", description: "世界最大のハンバーガーチェーン。期間限定バーガーが豊富。" },
  { name: "ロッテリア", slug: "lotteria", category: "burger_fastfood", officialSiteUrl: "https://www.lotteria.jp/", description: "国内発のハンバーガーチェーン。エビバーガー系が人気。" },
  { name: "ケンタッキーフライドチキン", slug: "kfc-japan", category: "burger_fastfood", officialSiteUrl: "https://www.kfc.co.jp/", description: "フライドチキンチェーン。季節限定メニューを多数展開。" },

  { name: "コメダ珈琲店", slug: "komeda", category: "cafe_donut", officialSiteUrl: "https://www.komeda.co.jp/", description: "名古屋発の喫茶店チェーン。シロノワールなど季節限定メニューが人気。" },
  { name: "ミスタードーナツ", slug: "mister-donut", category: "cafe_donut", officialSiteUrl: "https://www.misterdonut.jp/", description: "ドーナツチェーン。季節のフレーバーやコラボ商品を頻繁に展開。" },
  { name: "ドトールコーヒー", slug: "doutor", category: "cafe_donut", officialSiteUrl: "https://www.doutor.co.jp/", description: "老舗コーヒーチェーン。低価格帯で季節ドリンクを展開。" },
  { name: "タリーズコーヒー", slug: "tullys", category: "cafe_donut", officialSiteUrl: "https://www.tullys.co.jp/", description: "シアトル発祥のコーヒーチェーン日本法人。" },
  { name: "スターバックス", slug: "starbucks-japan", category: "cafe_donut", officialSiteUrl: "https://www.starbucks.co.jp/", description: "季節限定フラペチーノで知られるコーヒーチェーン。" },

  { name: "スシロー", slug: "sushiro", category: "sushi", officialSiteUrl: "https://www.akindo-sushiro.co.jp/", description: "回転寿司チェーン。地域フェアや期間限定ネタを多数展開。" },
  { name: "かっぱ寿司", slug: "kappa-sushi", category: "sushi", officialSiteUrl: "https://www.kappasushi.jp/", description: "回転寿司チェーン。コラボキャンペーンなどが人気。" },

  { name: "吉野家", slug: "yoshinoya", category: "gyudon_teishoku", officialSiteUrl: "https://www.yoshinoya.com/", description: "牛丼チェーンの最大手。季節限定丼を多数展開。" },
  { name: "すき家", slug: "sukiya", category: "gyudon_teishoku", officialSiteUrl: "https://www.sukiya.jp/", description: "牛丼チェーン。トッピングフェアが豊富。" },
  { name: "松屋", slug: "matsuya", category: "gyudon_teishoku", officialSiteUrl: "https://www.matsuyafoods.co.jp/matsuya/", description: "牛めし・定食チェーン。" },
  { name: "大戸屋", slug: "ootoya", category: "gyudon_teishoku", officialSiteUrl: "https://www.ootoya.com/", description: "定食チェーン。季節の定食フェアを展開。" },
  { name: "やよい軒", slug: "yayoiken", category: "gyudon_teishoku", officialSiteUrl: "https://www.yayoiken.com/", description: "定食チェーン。ご飯・味噌汁おかわり自由が特徴。" },

  { name: "ロイヤルホスト", slug: "royal-host", category: "family_restaurant", officialSiteUrl: "https://www.royalhost.jp/", description: "上質さで知られるファミリーレストランチェーン。" },
  { name: "サイゼリヤ", slug: "saizeriya", category: "family_restaurant", officialSiteUrl: "https://www.saizeriya.co.jp/", description: "低価格イタリアンファミリーレストラン。" },
  { name: "ガスト", slug: "gusto", category: "family_restaurant", officialSiteUrl: "https://www.skylark.co.jp/gusto/", description: "すかいらーくグループのファミリーレストラン。" },
  { name: "ジョナサン", slug: "jonathans", category: "family_restaurant", officialSiteUrl: "https://www.skylark.co.jp/jonathan/", description: "すかいらーくグループのファミリーレストラン。" },
  { name: "デニーズ", slug: "dennys", category: "family_restaurant", officialSiteUrl: "https://www.dennys.jp/", description: "24時間営業でおなじみのファミリーレストラン。" },

  { name: "一蘭", slug: "ichiran", category: "ramen_noodle", officialSiteUrl: "https://www.ichiran.com/", description: "とんこつラーメン専門店。" },
  { name: "丸亀製麺", slug: "marugame-seimen", category: "ramen_noodle", officialSiteUrl: "https://jp.marugame.com/", description: "讃岐うどんチェーン。季節のうどんフェアを展開。" },

  { name: "CoCo壱番屋", slug: "cocoichi", category: "curry_other", officialSiteUrl: "https://www.ichibanya.co.jp/", description: "カレー専門チェーン。トッピングが自由に選べる。" },
  { name: "てんや", slug: "tenya", category: "curry_other", officialSiteUrl: "https://www.tenya.co.jp/", description: "天丼・天ぷらの専門チェーン。" },
];

type CampaignDef = {
  chainSlug: string;
  title: string;
  description: string;
  startOffset: number;
  endOffset: number | null;
  targetProducts: { name: string; price?: number }[];
  status: "draft" | "pending_review" | "published" | "archived";
  featured?: boolean;
  sourceUrl?: string;
  imageUrl?: string;
  areaSlugs?: string[];
  extractionMetadata?: Record<string, unknown>;
};

// 実在キャンペーン24件（sourceUrl/imageUrlは全て実URL、curlでHTTP 200を確認済み）
const campaignDefs: CampaignDef[] = [
  {
    chainSlug: "mcdonalds",
    title: "『ポケモン30周年バーガー』シリーズ",
    description: "ポケモン30周年を記念したコラボメニュー。タルタルデミ厚切りビーフなど複数商品を展開。",
    startOffset: -7,
    endOffset: null,
    targetProducts: [
      { name: "タルタルデミ 厚切りビーフ", price: 580 },
      { name: "ジューシーチキン スパイシーガーリック", price: 490 },
      { name: "マックフィズ 沖縄パイナップル", price: 300 },
    ],
    status: "published",
    featured: true,
    sourceUrl: "https://www.mcdonalds.co.jp/campaign/pokemon-30th-burger/",
    imageUrl: "https://www.mcdonalds.co.jp/media_library/37503/file.jpg",
  },
  {
    chainSlug: "mister-donut",
    title: "もっちゅりん（きなこ／みたらし）",
    description: "もっちりとした食感の生地にきなこシュガー・みたらしフィリングを合わせた新商品。",
    startOffset: -56,
    endOffset: 3,
    targetProducts: [
      { name: "もっちゅりんきなこ", price: 216 },
      { name: "もっちゅりんみたらし", price: 226 },
    ],
    status: "published",
    sourceUrl: "https://www.misterdonut.jp/m_menu/new/260603_motchurin/",
    imageUrl: "https://www.misterdonut.jp/m_menu/new/260603_motchurin/images/item_01.png",
    extractionMetadata: { notes: "公式発表で「順次終了」とされており、正確な終了日は店舗により異なる。" },
  },
  {
    chainSlug: "lotteria",
    title: "竜田チキンバーガーフェア",
    description: "チキン南蛮タルタルバーガー・油淋鶏バーガーなど竜田チキン系バーガーのフェア。",
    startOffset: -133,
    endOffset: null,
    targetProducts: [
      { name: "チキン南蛮タルタルバーガー", price: 560 },
      { name: "油淋鶏バーガー", price: 590 },
    ],
    status: "published",
    sourceUrl: "https://www.lotteria.jp/campaign/detail/000266.html",
    imageUrl: "https://www.lotteria.jp/campaign/uploads/L_hp_topbanner_840x430_Chickenburger.png",
  },
  {
    chainSlug: "kfc-japan",
    title: "ドリンク全サイズ100円キャンペーン",
    description: "対象ドリンクが全サイズ100円で楽しめる期間限定キャンペーン。",
    startOffset: 0,
    endOffset: 27,
    targetProducts: [{ name: "ドリンク(S/M/Lサイズ共通)", price: 100 }],
    status: "published",
    sourceUrl: "https://japan.kfc.co.jp/news_release/8161",
    imageUrl: "https://kfc-web.imagewave.pictures/Yvgn7HWXQ7G4nrWLDGBvR9",
  },
  {
    chainSlug: "komeda",
    title: "氷点下ショコラ（デザートセット）",
    description: "氷点下ショコラ・ご褒美レアチーズ・紅茶日和などの夏季デザートセット。",
    startOffset: -22,
    endOffset: 78,
    targetProducts: [{ name: "氷点下ショコラ", price: 530 }],
    status: "published",
    featured: true,
    sourceUrl: "https://www.komeda.co.jp/menu/detail.html?brand=1&cat=1-1&item=11429",
    // 公式サイトがSPAで商品写真がJS経由のため、サイト全体の代表画像の代わりにカテゴリ画像を使用
  },
  {
    chainSlug: "komeda",
    title: "厚切りハムカツサンド",
    description: "スクレイパーで取得直後、レビュー待ちのサンプルデータ（動作確認用のフィクション）。",
    startOffset: 8,
    endOffset: 39,
    targetProducts: [{ name: "厚切りハムカツサンド", price: 750 }],
    status: "pending_review",
    extractionMetadata: {
      extractedBy: "claude-sample",
      confidence: 0.82,
      notes: "終了日が「なくなり次第終了」の可能性あり。要確認。",
    },
  },
  {
    chainSlug: "doutor",
    title: "夏を楽しむ新メニュー各種",
    description: "6月25日より一斉発売した夏季限定の新メニューシリーズ。",
    startOffset: -34,
    endOffset: null,
    targetProducts: [{ name: "夏の新メニュー各種" }],
    status: "published",
    sourceUrl: "https://www.doutor.co.jp/news/newsrelease/detail/20260610183350.html",
    imageUrl: "https://www.doutor.co.jp/news/newsrelease/detail/news_file/file/EC260621_release_copy_1.jpg",
  },
  {
    chainSlug: "tullys",
    title: "TOMORROW X TOGETHER コラボ",
    description: "人気アーティストとのコラボメニュー・グッズを展開。",
    startOffset: -21,
    endOffset: null,
    targetProducts: [{ name: "コラボドリンク・グッズ各種" }],
    status: "published",
    sourceUrl: "https://www.tullys.co.jp/cpn/txt_collaboration2026/",
    imageUrl: "https://www.tullys.co.jp/cpn/txt_collaboration2026/assets/images/common/ogp.png",
  },
  {
    chainSlug: "starbucks-japan",
    title: "ぎゅぎゅっと オレンジ&マンゴー フラペチーノ",
    description: "夏季限定、オレンジとマンゴーを使ったフラペチーノ。",
    startOffset: -7,
    endOffset: 34,
    targetProducts: [{ name: "ぎゅぎゅっと オレンジ&マンゴー フラペチーノ" }],
    status: "published",
    featured: true,
    sourceUrl: "https://www.starbucks.co.jp/cafe/orange-mango/",
    imageUrl: "https://www.starbucks.co.jp/images/og/260702_SBJ_web_summer_1_orange_4_banner_OGP_w1200xh630_01.png",
  },
  {
    chainSlug: "sushiro",
    title: "スシロー×ハローキティ コラボ",
    description: "「かわいいキティが、うまい！に出会った」をテーマにしたコラボ企画。",
    startOffset: 0,
    endOffset: null,
    targetProducts: [{ name: "ハローキティコラボメニュー・グッズ" }],
    status: "published",
    featured: true,
    sourceUrl: "https://www.akindo-sushiro.co.jp/campaign/detail.php?id=4366",
    imageUrl: "https://cmsimage.akindo-sushiro.co.jp/news/sushiroxKitty_LP_01-a.jpg",
  },
  {
    chainSlug: "kappa-sushi",
    title: "映画『スパイダーマン:ブランド・ニュー・デイ』コラボ",
    description: "対象商品購入でオリジナルステッカーがもらえるコラボキャンペーン。",
    startOffset: -6,
    endOffset: 18,
    targetProducts: [{ name: "オリジナルステッカー(対象商品購入特典)" }],
    status: "published",
    sourceUrl: "https://www.kappasushi.jp/cp/202607/spiderman",
    imageUrl: "https://www.kappasushi.jp/assets/uploads/2026/07/32377edf93eb5c3af21365ae7c85e4e5.jpg",
  },
  {
    chainSlug: "yoshinoya",
    title: "牛金目鯛の煮付け定食（魚シリーズ第二弾）",
    description: "牛丼と金目鯛の煮付けを組み合わせた定食。魚シリーズの第二弾。",
    startOffset: -19,
    endOffset: null,
    targetProducts: [{ name: "牛金目鯛の煮付け定食" }],
    status: "published",
    sourceUrl: "https://www.yoshinoya.com/lp/gyukinmedai_202607/",
    imageUrl: "https://www.yoshinoya.com/wp-content/uploads/2026/07/24120849/260610-GYU-KINME-DIGITAL_X-OGP.jpg",
  },
  {
    chainSlug: "sukiya",
    title: "ニンニクの芽牛丼",
    description: "ニンニクの芽をトッピングしたスタミナ系牛丼。",
    startOffset: -23,
    endOffset: null,
    targetProducts: [{ name: "ニンニクの芽牛丼", price: 630 }],
    status: "published",
    sourceUrl: "https://www.sukiya.jp/menu/in/gyudon/115000/index.html",
    imageUrl: "https://www.sukiya.jp/menu/img/in/photo_gyudon_115000.jpg",
  },
  {
    chainSlug: "matsuya",
    title: "松屋オリジナルソースローストビーフ",
    description: "五感で味わう夏のご褒美と銘打った、オリジナルソースのローストビーフメニュー。",
    startOffset: -1,
    endOffset: null,
    targetProducts: [{ name: "松屋オリジナルソースローストビーフ" }],
    status: "published",
    sourceUrl: "https://www.matsuyafoods.co.jp/whatsnew/menu/166190.html",
    imageUrl: "https://www.matsuyafoods.co.jp/wordpress/wp-content/uploads/2026/07/260728_roast_beef_menu.jpg",
  },
  {
    chainSlug: "ootoya",
    title: "鹿児島県産うな重（1.5万食限定）",
    description: "1.5万食限定で販売する鹿児島県産うなぎのうな重。一部店舗ではすでに完売。",
    startOffset: -5,
    endOffset: 2,
    targetProducts: [{ name: "鹿児島県産うな重", price: 2950 }],
    status: "published",
    sourceUrl: "https://www.ootoya.com/news/258.html",
    imageUrl: "https://ootoya.g.kuroco-img.app/files/user/topics_img/8/image(105).png",
    extractionMetadata: { notes: "数量限定(1.5万食)のため、実際の販売終了は店舗により変動。" },
  },
  {
    chainSlug: "yayoiken",
    title: "牛カルビと牛ホルモン焼の定食",
    description: "特製味噌だれが絡む、牛カルビと牛ホルモン焼を組み合わせた定食。",
    startOffset: 6,
    endOffset: null,
    targetProducts: [{ name: "牛カルビと牛ホルモン焼の定食" }],
    status: "published",
    sourceUrl: "https://www.yayoiken.com/contents/news/260728_karubi.html",
    imageUrl: "https://www.yayoiken.com/img/ogp-02.jpg",
  },
  {
    chainSlug: "royal-host",
    title: "Apple Mango〜ひと夏でめぐるマンゴーデザート〜",
    description: "マンゴーブリュレ・マンゴーあんみつ・マンゴーパフェなど季節のマンゴーデザート。",
    startOffset: -14,
    endOffset: null,
    targetProducts: [
      { name: "マンゴーブリュレ" },
      { name: "マンゴーあんみつ" },
      { name: "マンゴーパフェ" },
    ],
    status: "published",
    featured: true,
    sourceUrl: "https://www.royalhost.jp/menu/grand/season_dessert/",
    imageUrl: "https://www.royalhost.jp/menu/assets_c/2026/07/260715_sd_mango_brulee-thumb-1200xauto-8207.jpg",
  },
  {
    chainSlug: "saizeriya",
    title: "冷たいパンプキンスープ",
    description: "夏季に提供する冷製のパンプキンスープ。",
    startOffset: -30,
    endOffset: null,
    targetProducts: [{ name: "冷たいパンプキンスープ", price: 180 }],
    status: "published",
    sourceUrl: "https://www.saizeriya.co.jp/menu-popular/1302/",
    imageUrl: "https://www.saizeriya.co.jp/files/1302_%E3%83%91%E3%83%B3%E3%83%97%E3%82%AD%E3%83%B3%E3%82%B9%E3%83%BC%E3%83%97.webp",
  },
  {
    chainSlug: "gusto",
    title: "26品26%OFFクーポン祭り",
    description: "アプリクーポン提示で対象26品が26%オフになるキャンペーン。",
    startOffset: -15,
    endOffset: null,
    targetProducts: [{ name: "対象26品(クーポン提示で26%OFF)" }],
    status: "published",
    sourceUrl: "https://www.skylark.co.jp/gusto/coupon/",
  },
  {
    chainSlug: "jonathans",
    title: "乾杯ジョナサンナイトフェス",
    description: "平日16時以降、クーポン利用でアルコール・おつまみがお得になるナイトフェス。",
    startOffset: -16,
    endOffset: 2,
    targetProducts: [{ name: "アルコール類(クーポンで50%OFF)" }, { name: "おつまみ各種(110円引き)" }],
    status: "published",
    sourceUrl: "https://www.skylark.co.jp/jonathan/campaign/index.html",
  },
  {
    chainSlug: "dennys",
    title: "桃デザートフェア",
    description: "夏季限定、桃を使ったデザート「まっぷたつ？パフェ（桃）」など。",
    startOffset: -10,
    endOffset: null,
    targetProducts: [{ name: "まっぷたつ？パフェ（桃）" }],
    status: "published",
    sourceUrl: "https://www.dennys.jp/menu/peach/",
  },
  {
    chainSlug: "ichiran",
    title: "一蘭の森 糸島ソフト／糸島ラテ",
    description: "「一蘭の森 糸島」限定で提供する特製ソフトクリーム・ラテ。",
    startOffset: 1,
    endOffset: null,
    targetProducts: [{ name: "一蘭の森 糸島ソフト", price: 650 }, { name: "一蘭の森 糸島ラテ", price: 650 }],
    status: "published",
    // 公式のプレスリリースが確認できなかったため、リンク先は公式サイトトップに留める
  },
  {
    chainSlug: "mister-donut",
    title: "シャインマスカットドーナツ",
    description: "スクレイパーで取得直後、レビュー待ちのサンプルデータ（動作確認用のフィクション）。",
    startOffset: 10,
    endOffset: 40,
    targetProducts: [{ name: "シャインマスカットドーナツ", price: 227 }],
    status: "pending_review",
    extractionMetadata: { extractedBy: "claude-sample", confidence: 0.9 },
  },
  {
    chainSlug: "marugame-seimen",
    title: "丸亀うどんプリン",
    description: "うどん粉を使ったユニークなプリン。ブルーハワイ・あんみつ風など複数フレーバー。",
    startOffset: -22,
    endOffset: null,
    targetProducts: [
      { name: "丸亀うどんプリン ブルーハワイ", price: 340 },
      { name: "丸亀うどんプリン マンゴー", price: 290 },
    ],
    status: "published",
    sourceUrl: "https://jp.marugame.com/menu/udonpurin/",
    imageUrl: "https://images.microcms-assets.io/assets/58eb40d284924aeb96de2de93fa08d93/d0a52dfafec6424695a72524a24ff06b/og_menu.jpg",
    extractionMetadata: { notes: "数量限定のため、実際の終了時期は店舗により変動。" },
  },
  {
    chainSlug: "cocoichi",
    title: "ココイチ×映画ちいかわ カレー大作戦",
    description: "映画公開を記念したコラボカレー。オリジナルステッカー・フィギュア等の特典あり。",
    startOffset: -5,
    endOffset: null,
    targetProducts: [{ name: "コラボカレー(オリジナル特典付き)" }],
    status: "published",
    featured: true,
    sourceUrl: "https://www.ichibanya.co.jp/cp/chiikawa-themovie2026/",
    imageUrl: "https://www.ichibanya.co.jp/cp/chiikawa-themovie2026/assets/images/ogp.jpg",
  },
  {
    chainSlug: "tenya",
    title: "うなとろ天丼（土用の丑の日限定）",
    description: "土用の丑の日にあわせた、うなぎの蒲焼天を使った天丼。数量限定。",
    startOffset: -6,
    endOffset: null,
    targetProducts: [{ name: "うなとろ天丼" }, { name: "うなとろ天丼弁当" }],
    status: "published",
    sourceUrl: "https://www.tenya.co.jp/release/pdf/news_unatoro_20260723.pdf",
    imageUrl: "https://www.tenya.co.jp/release/img/info_season01_unagi_20260723.jpg",
    extractionMetadata: { notes: "数量限定のため、実際の終了時期は店舗により変動。" },
  },
];

// lat/lngはNominatim(OpenStreetMap)で各駅名をジオコーディングして取得した実座標
const areaDefs: { name: string; slug: string; region: string; stations: string[]; lat: number; lng: number }[] = [
  { name: "渋谷", slug: "shibuya", region: "関東", stations: ["渋谷駅"], lat: 35.659939, lng: 139.6997378 },
  { name: "新宿", slug: "shinjuku", region: "関東", stations: ["新宿駅"], lat: 35.6887259, lng: 139.6987623 },
  { name: "池袋", slug: "ikebukuro", region: "関東", stations: ["池袋駅"], lat: 35.728554, lng: 139.7128585 },
  { name: "東京", slug: "tokyo", region: "関東", stations: ["東京駅"], lat: 35.6827188, lng: 139.765815 },
  { name: "品川", slug: "shinagawa", region: "関東", stations: ["品川駅"], lat: 35.6274838, lng: 139.7377655 },
  { name: "横浜", slug: "yokohama", region: "関東", stations: ["横浜駅"], lat: 35.4660109, lng: 139.6226361 },
  { name: "大宮", slug: "omiya", region: "関東", stations: ["大宮駅"], lat: 35.9063869, lng: 139.6243304 },
  { name: "梅田", slug: "umeda", region: "関西", stations: ["梅田駅", "大阪駅"], lat: 34.7025087, lng: 135.4961773 },
  { name: "難波", slug: "namba", region: "関西", stations: ["難波駅"], lat: 34.6636625, lng: 135.5017751 },
  { name: "京都", slug: "kyoto", region: "関西", stations: ["京都駅"], lat: 34.9853497, lng: 135.758766 },
  { name: "名古屋", slug: "nagoya", region: "東海", stations: ["名古屋駅"], lat: 35.1729, lng: 136.882 },
  { name: "博多", slug: "hakata", region: "九州", stations: ["博多駅"], lat: 33.5900413, lng: 130.4199026 },
  { name: "札幌", slug: "sapporo", region: "北海道", stations: ["札幌駅"], lat: 43.0686555, lng: 141.350787 },
  { name: "仙台", slug: "sendai", region: "東北", stations: ["仙台駅"], lat: 38.2597526, lng: 140.8800249 },
  { name: "広島", slug: "hiroshima", region: "中国", stations: ["広島駅"], lat: 34.3978256, lng: 132.4755766 },
];

async function main() {
  await prisma.campaignArea.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.stationAlias.deleteMany();
  await prisma.store.deleteMany();
  await prisma.area.deleteMany();
  await prisma.chain.deleteMany();

  const chainsBySlug = new Map<string, { id: string; slug: string; category: string; officialSiteUrl: string }>();
  for (const def of chainDefs) {
    const chain = await prisma.chain.create({
      data: {
        name: def.name,
        slug: def.slug,
        category: def.category,
        officialSiteUrl: def.officialSiteUrl,
        description: def.description,
      },
    });
    chainsBySlug.set(def.slug, chain);
  }

  const areasBySlug = new Map<string, { id: string }>();
  for (const def of areaDefs) {
    const area = await prisma.area.create({
      data: {
        name: def.name,
        slug: def.slug,
        region: def.region,
        lat: def.lat,
        lng: def.lng,
        stationAliases: { create: def.stations.map((stationName) => ({ stationName })) },
      },
    });
    areasBySlug.set(def.slug, area);
  }

  for (const c of campaignDefs) {
    const chain = chainsBySlug.get(c.chainSlug);
    if (!chain) throw new Error(`unknown chainSlug in seed data: ${c.chainSlug}`);

    const areaIds = (c.areaSlugs ?? []).map((slug) => {
      const area = areasBySlug.get(slug);
      if (!area) throw new Error(`unknown areaSlug in seed data: ${slug}`);
      return area.id;
    });

    await prisma.campaign.create({
      data: {
        chainId: chain.id,
        title: c.title,
        description: c.description,
        startDate: daysFromToday(c.startOffset),
        endDate: c.endOffset === null ? null : daysFromToday(c.endOffset),
        targetProducts: c.targetProducts,
        sourceUrl: c.sourceUrl ?? chain.officialSiteUrl,
        imageUrl: c.imageUrl ?? categoryVisual(chain.category).image,
        status: c.status,
        featured: c.featured ?? false,
        extractionMetadata: c.extractionMetadata as Prisma.InputJsonValue | undefined,
        areas: areaIds.length > 0 ? { create: areaIds.map((areaId) => ({ areaId })) } : undefined,
      },
    });
  }

  console.log(`Seed完了: chains=${chainDefs.length}, areas=${areaDefs.length}, campaigns=${campaignDefs.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

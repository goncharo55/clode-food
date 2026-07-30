import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "運営者情報",
  description: `${SITE_NAME}の運営者情報・サイトについて。`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">運営者情報・このサイトについて</h1>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">運営者</h2>
        <p className="text-gray-700">
          個人運営（運営者名を記載してください）
          <br />
          お問い合わせ:{" "}
          <a href="mailto:gokimaru.poke@gmail.com" className="text-orange-600 hover:underline">
            gokimaru.poke@gmail.com
          </a>
          （実際に使用する連絡先アドレスに変更してください）
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">サイトの目的</h2>
        <p className="text-gray-700">
          {SITE_NAME}は、飲食チェーン各社が公式に発表している期間限定メニュー・キャンペーン情報を、
          「今日は何を食べよう？」を短時間で決められるようにまとめて紹介するサイトです。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">情報の収集方法</h2>
        <p className="text-gray-700">
          掲載している情報は、各チェーンの公式サイト・ニュースリリースをもとに、AIによる自動抽出と
          運営者による確認を経て掲載しています。内容は情報収集時点のものであり、価格・販売期間・
          対象店舗などの詳細は、必ず各キャンペーンページに記載の公式サイトリンクからご確認ください。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">免責事項</h2>
        <p className="text-gray-700">
          当サイトの情報の正確性には注意を払っておりますが、内容を保証するものではありません。
          情報の誤りや古い情報により生じた損害について、運営者は責任を負いかねます。
          商標・ロゴ・商品画像の権利は各社に帰属します。
        </p>
      </section>
    </div>
  );
}

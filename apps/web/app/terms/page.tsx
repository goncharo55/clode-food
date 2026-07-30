import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "利用規約",
  description: `${SITE_NAME}の利用規約。`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">利用規約</h1>
      <p className="mt-2 text-sm text-gray-500">最終更新日: 2026年7月29日</p>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">第1条（適用）</h2>
        <p className="text-gray-700">
          本規約は、{SITE_NAME}（以下「当サイト」）の利用条件を定めるものです。
          利用者は本規約に同意の上、当サイトをご利用ください。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">第2条（情報の正確性）</h2>
        <p className="text-gray-700">
          当サイトに掲載する期間限定メニュー・キャンペーン情報は、各チェーンの公式発表をもとに
          収集・編集したものですが、価格改定・販売終了・地域限定などにより実際の内容と異なる場合があります。
          ご利用の際は、必ず掲載元の公式サイトで最新情報をご確認ください。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">第3条（禁止事項）</h2>
        <p className="text-gray-700">
          利用者は、当サイトの利用にあたり、法令に違反する行為、当サイトの運営を妨害する行為、
          当サイトに掲載されたコンテンツを無断で複製・転載する行為を行ってはなりません。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">第4条（免責事項）</h2>
        <p className="text-gray-700">
          当サイトの利用により生じた損害について、運営者は一切の責任を負いません。
          当サイトは予告なく内容の変更・提供の中断・終了を行うことがあります。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">第5条（知的財産権）</h2>
        <p className="text-gray-700">
          当サイトに掲載する商品名・ロゴ・画像等の知的財産権は、各権利者に帰属します。
        </p>
      </section>
    </div>
  );
}

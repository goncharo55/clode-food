import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: `${SITE_NAME}へのお問い合わせ。`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">お問い合わせ</h1>
      <p className="mt-4 text-gray-700">
        掲載情報の誤りのご指摘、削除依頼、その他お問い合わせは以下のメールアドレスまでご連絡ください。
      </p>
      <p className="mt-4">
        <a
          href="mailto:gokimaru.poke@gmail.com"
          className="inline-block rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600"
        >
          gokimaru.poke@gmail.com 宛にメールを送る
        </a>
      </p>
      <p className="mt-2 text-sm text-gray-500">
        （実際に運用する際は、常時確認できる連絡先アドレスに変更してください）
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${SITE_NAME}のプライバシーポリシー。`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <p className="mt-2 text-sm text-gray-500">最終更新日: 2026年7月29日</p>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">広告について</h2>
        <p className="text-gray-700">
          当サイトは、第三者配信の広告サービス（Google
          AdSenseなど）を利用する場合があります。広告配信事業者は、ユーザーの興味に応じた広告を表示するため、
          Cookie（クッキー）を使用して当サイトや他サイトへのアクセス情報を収集することがあります。
          Cookieを無効にする方法や、Googleアドセンスに関する詳細は
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:underline"
          >
            Googleの広告ポリシー
          </a>
          をご覧ください。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">アクセス解析ツールについて</h2>
        <p className="text-gray-700">
          当サイトは、サービス改善のためGoogleアナリティクス等のアクセス解析ツールを利用する場合があります。
          これらのツールはCookieを利用してデータを収集しますが、個人を特定する情報は含まれません。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">お問い合わせフォームについて</h2>
        <p className="text-gray-700">
          お問い合わせの際にご提供いただいたメールアドレス等の情報は、お問い合わせへの対応以外の目的では利用しません。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-bold">プライバシーポリシーの変更について</h2>
        <p className="text-gray-700">
          法令の改正や当サイトの運営方針の変更等により、本ポリシーの内容を予告なく変更することがあります。
        </p>
      </section>
    </div>
  );
}

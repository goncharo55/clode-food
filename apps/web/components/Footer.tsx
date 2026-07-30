import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-orange-100 mt-16 py-8 text-sm text-gray-500">
      <div className="mx-auto max-w-5xl px-4 flex flex-col gap-4">
        <p>
          期間限定カレンダーは、各飲食チェーンの公式サイト・ニュースリリースをもとに
          期間限定メニュー・キャンペーン情報をまとめています。詳細は各キャンペーンページの公式サイトリンクをご確認ください。
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/about" className="hover:text-orange-600">
            運営者情報
          </Link>
          <Link href="/privacy" className="hover:text-orange-600">
            プライバシーポリシー
          </Link>
          <Link href="/terms" className="hover:text-orange-600">
            利用規約
          </Link>
          <Link href="/contact" className="hover:text-orange-600">
            お問い合わせ
          </Link>
          <Link href="/digest" className="hover:text-orange-600">
            まとめ記事
          </Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} 期間限定カレンダー</p>
      </div>
    </footer>
  );
}

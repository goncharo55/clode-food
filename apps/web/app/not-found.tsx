import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-5xl">🍽️</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">ページが見つかりませんでした</h1>
      <p className="mt-2 text-gray-600">
        お探しのページは削除されたか、URLが変更された可能性があります。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-orange-600 px-5 py-2.5 font-medium text-white hover:bg-orange-700"
        >
          トップページへ
        </Link>
        <Link
          href="/calendar"
          className="rounded-full bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-600"
        >
          カレンダーを見る
        </Link>
        <Link
          href="/chains"
          className="rounded-full bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-orange-100 hover:text-orange-600"
        >
          チェーン一覧
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import StationSearchForm from "@/components/StationSearchForm";

export default function Header() {
  return (
    <header className="border-b border-orange-100 bg-white/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <Link href="/" className="text-lg font-bold text-orange-600 whitespace-nowrap">
          🗓️ 期間限定カレンダー
        </Link>
        <div className="flex-1 min-w-[200px] max-w-sm">
          <StationSearchForm compact />
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <Link href="/calendar" className="hover:text-orange-600">
            カレンダー
          </Link>
          <Link href="/areas" className="hover:text-orange-600">
            エリアから探す
          </Link>
          <Link href="/chains" className="hover:text-orange-600">
            チェーン一覧
          </Link>
          <Link href="/digest" className="hover:text-orange-600">
            今週のまとめ
          </Link>
        </nav>
      </div>
    </header>
  );
}

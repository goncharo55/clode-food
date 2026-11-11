import Link from "next/link";
import StationSearchForm from "@/components/StationSearchForm";
import { SITE_NAME } from "@/lib/site";

export default function Header() {
  return (
    <header className="border-b border-orange-100 bg-white/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <Link href="/" className="text-lg font-bold text-orange-600 whitespace-nowrap">
          🗓️ {SITE_NAME}
        </Link>
        <div className="flex-1 min-w-[200px] max-w-sm">
          <StationSearchForm compact />
        </div>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-600">
          <Link href="/calendar" className="whitespace-nowrap hover:text-orange-600">
            カレンダー
          </Link>
          <Link href="/areas" className="whitespace-nowrap hover:text-orange-600">
            エリアから探す
          </Link>
          <Link href="/chains" className="whitespace-nowrap hover:text-orange-600">
            チェーン一覧
          </Link>
          <Link href="/digest" className="whitespace-nowrap hover:text-orange-600">
            今週のまとめ
          </Link>
        </nav>
      </div>
    </header>
  );
}

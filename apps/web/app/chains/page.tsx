import Link from "next/link";
import type { Metadata } from "next";
import { getAllChains } from "@/lib/queries";
import { chainEmoji } from "@/lib/chainVisuals";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "チェーン一覧",
  description: "マクドナルド、コメダ珈琲店、ミスタードーナツ、スシローなど飲食チェーンから期間限定情報を探せます。",
};

export default async function ChainsPage() {
  const chains = await getAllChains();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">チェーン一覧</h1>
      <p className="mt-2 text-gray-600">気になるチェーンを選んで、開催中の期間限定情報をチェックしよう。</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {chains.map((chain) => (
          <Link
            key={chain.id}
            href={`/chains/${chain.slug}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-orange-300 hover:shadow-md transition"
          >
            <span className="text-3xl">{chainEmoji(chain.slug)}</span>
            <div>
              <div className="font-bold text-gray-900">{chain.name}</div>
              {chain.description && (
                <div className="mt-1 text-sm text-gray-500 line-clamp-2">{chain.description}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

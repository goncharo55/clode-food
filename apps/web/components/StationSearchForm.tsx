export default function StationSearchForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/areas/search" method="GET" className="flex gap-2">
      <input
        type="text"
        name="q"
        placeholder="駅名・エリア名で検索（例: 渋谷駅）"
        className={`flex-1 min-w-0 rounded-full border border-orange-200 bg-white px-4 focus:outline-none focus:ring-2 focus:ring-orange-300 ${
          compact ? "py-1.5 text-sm" : "py-3 text-base"
        }`}
      />
      <button
        type="submit"
        className={`rounded-full bg-orange-500 font-semibold text-white hover:bg-orange-600 whitespace-nowrap ${
          compact ? "px-4 py-1.5 text-sm" : "px-6 py-3 text-base"
        }`}
      >
        検索
      </button>
    </form>
  );
}

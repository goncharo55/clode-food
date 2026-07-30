/**
 * 広告枠のプレースホルダー。
 * AdSense審査通過後、ここにAdSenseのスニペットを差し込む（docs/ops-notes.md参照）。
 * それまでは空間だけ確保しておき、後からレイアウトシフトなく差し替えられるようにする。
 */
export default function AdSlot({ label = "広告" }: { label?: string }) {
  return (
    <div className="my-6 flex min-h-[90px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
      {label}枠（準備中）
    </div>
  );
}

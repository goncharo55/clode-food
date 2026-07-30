import type { Metadata } from "next";
import { requireAdmin } from "@/lib/adminAuth";
import { getPendingReviewCampaigns } from "@/lib/queries";
import { logoutAction } from "@/app/admin/actions";
import PendingCampaignForm from "@/app/admin/PendingCampaignForm";

export const metadata: Metadata = {
  title: "管理画面",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdmin();
  const pending = await getPendingReviewCampaigns();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">レビュー待ちキャンペーン（{pending.length}件）</h1>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-gray-500 hover:text-orange-600">
            ログアウト
          </button>
        </form>
      </div>
      <p className="mt-2 text-gray-600">
        スクレイパーが取得したデータを確認し、内容を修正のうえ承認（公開）または却下してください。
      </p>

      {pending.length === 0 ? (
        <p className="mt-8 text-gray-500">レビュー待ちのキャンペーンはありません。</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {pending.map((campaign) => (
            <PendingCampaignForm key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

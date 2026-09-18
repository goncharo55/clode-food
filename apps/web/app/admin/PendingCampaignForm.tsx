"use client";

import { useActionState } from "react";
import { approveAction, rejectAction, type FormActionState } from "@/app/admin/actions";
import { campaignLinkUrl } from "@/lib/campaignLink";
import type { CampaignWithRelations } from "@/lib/queries";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function PendingCampaignForm({ campaign }: { campaign: CampaignWithRelations }) {
  const metadata = (campaign.extractionMetadata ?? {}) as {
    confidence?: number;
    notes?: string;
    extractedBy?: string;
  };

  const [approveState, approveFormAction, approvePending] = useActionState<FormActionState, FormData>(
    approveAction,
    null,
  );
  const [rejectState, rejectFormAction, rejectPending] = useActionState<FormActionState, FormData>(
    rejectAction,
    null,
  );
  const errorMessage = approveState?.error ?? rejectState?.error;
  const approveFormId = `approve-form-${campaign.id}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500">{campaign.chain.name}</span>
        <a
          href={campaignLinkUrl(campaign, campaign.chain)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-orange-600 hover:underline"
        >
          出典を見る ↗
        </a>
      </div>

      {(metadata.confidence !== undefined || metadata.notes) && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {metadata.confidence !== undefined && <p>抽出の確信度: {metadata.confidence}</p>}
          {metadata.notes && <p>注意事項: {metadata.notes}</p>}
        </div>
      )}

      {errorMessage && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{errorMessage}</p>}

      <form id={approveFormId} action={approveFormAction} className="space-y-3">
        <input type="hidden" name="id" value={campaign.id} />

        <label className="block text-sm">
          <span className="font-medium text-gray-700">タイトル</span>
          <input
            type="text"
            name="title"
            defaultValue={campaign.title}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">説明</span>
          <textarea
            name="description"
            defaultValue={campaign.description ?? ""}
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1 text-sm">
            <span className="font-medium text-gray-700">開始日</span>
            <input
              type="date"
              name="startDate"
              defaultValue={toDateInputValue(campaign.startDate)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5"
            />
          </label>
          <label className="block flex-1 text-sm">
            <span className="font-medium text-gray-700">終了日（任意）</span>
            <input
              type="date"
              name="endDate"
              defaultValue={campaign.endDate ? toDateInputValue(campaign.endDate) : ""}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">出典URL（空欄の場合はチェーン公式サイトにリンク）</span>
          <input
            type="text"
            name="sourceUrl"
            defaultValue={campaign.sourceUrl ?? ""}
            placeholder={campaign.chain.officialSiteUrl}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">画像URL（任意）</span>
          <input
            type="text"
            name="imageUrl"
            defaultValue={campaign.imageUrl ?? ""}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-gray-700">対象商品（JSON形式）</span>
          <textarea
            name="targetProducts"
            defaultValue={JSON.stringify(campaign.targetProducts, null, 2)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 font-mono text-xs"
          />
        </label>
      </form>

      {/* 却下は編集フィールドを必要としないため、承認フォームとは別フォームにして
          「必須項目が未入力だと却下ボタンも反応しない」事態を避ける */}
      <form action={rejectFormAction} className="contents">
        <input type="hidden" name="id" value={campaign.id} />
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            form={approveFormId}
            disabled={approvePending || rejectPending}
            className="flex-1 rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {approvePending ? "承認中..." : "承認して公開"}
          </button>
          <button
            type="submit"
            disabled={approvePending || rejectPending}
            className="flex-1 rounded-lg bg-gray-200 py-2 font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-60"
          >
            {rejectPending ? "処理中..." : "却下"}
          </button>
        </div>
      </form>
    </div>
  );
}

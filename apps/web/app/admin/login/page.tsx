import type { Metadata } from "next";
import { loginAction } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "管理画面ログイン",
  robots: { index: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const hasError = (await searchParams).error === "1";

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-xl font-bold">管理画面ログイン</h1>
      <form action={loginAction} className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          placeholder="パスワード"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        {hasError && <p className="text-sm text-red-600">パスワードが違います。</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-orange-500 py-2 font-semibold text-white hover:bg-orange-600"
        >
          ログイン
        </button>
      </form>
    </div>
  );
}

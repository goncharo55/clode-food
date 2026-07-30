"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_SESSION_COOKIE, checkPassword, requireAdmin, sessionCookieValue } from "@/lib/adminAuth";

export async function loginAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");

  if (!checkPassword(password)) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, sessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}

function readEditableFields(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDateRaw = String(formData.get("endDate") ?? "");
  const imageUrl = String(formData.get("imageUrl") ?? "");
  const sourceUrl = String(formData.get("sourceUrl") ?? "");
  const targetProductsRaw = String(formData.get("targetProducts") ?? "[]");

  let targetProducts: unknown = undefined;
  try {
    targetProducts = JSON.parse(targetProductsRaw);
  } catch {
    // JSONとして不正な場合は対象商品の変更を諦め、既存値を保持する
    targetProducts = undefined;
  }

  return {
    id,
    title,
    description: description || null,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDateRaw ? new Date(endDateRaw) : null,
    imageUrl: imageUrl || null,
    sourceUrl: sourceUrl || null,
    targetProducts,
  };
}

export async function approveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const fields = readEditableFields(formData);

  await prisma.campaign.update({
    where: { id: fields.id },
    data: {
      title: fields.title,
      description: fields.description,
      startDate: fields.startDate,
      endDate: fields.endDate,
      imageUrl: fields.imageUrl,
      sourceUrl: fields.sourceUrl,
      ...(fields.targetProducts !== undefined ? { targetProducts: fields.targetProducts as never } : {}),
      status: "published",
    },
  });

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function rejectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const existing = await prisma.campaign.findUnique({ where: { id } });
  const previousMetadata =
    existing?.extractionMetadata && typeof existing.extractionMetadata === "object"
      ? (existing.extractionMetadata as Record<string, unknown>)
      : {};

  await prisma.campaign.update({
    where: { id },
    data: {
      status: "archived",
      extractionMetadata: { ...previousMetadata, rejectedAt: new Date().toISOString() },
    },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

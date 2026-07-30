import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "admin_session";

function expectedSessionValue(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
  return createHash("sha256").update(password).digest("hex");
}

export function checkPassword(candidate: string): boolean {
  return candidate === process.env.ADMIN_PASSWORD && candidate.length > 0;
}

export function sessionCookieValue(): string {
  return expectedSessionValue();
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!value) return false;
  try {
    return value === expectedSessionValue();
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type ReactionType = "want_to_eat" | "have_eaten";
type Counts = { want_to_eat: number; have_eaten: number };

const CLIENT_TOKEN_KEY = "mc_client_token";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function getClientToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let token = localStorage.getItem(CLIENT_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(CLIENT_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return "";
  }
}

function activeKey(campaignId: string, type: ReactionType) {
  return `mc_reacted_${campaignId}_${type}`;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      execute: (container: HTMLElement, options?: Record<string, unknown>) => void;
    };
  }
}

export default function ReactionButtons({ campaignId }: { campaignId: string }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [active, setActive] = useState<{ want_to_eat: boolean; have_eaten: boolean }>({
    want_to_eat: false,
    have_eaten: false,
  });
  const [pending, setPending] = useState<ReactionType | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetRenderedRef = useRef(false);
  const resolveTokenRef = useRef<((token: string) => void) | null>(null);

  useEffect(() => {
    fetch(`/api/reactions/${campaignId}`)
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => setCounts({ want_to_eat: 0, have_eaten: 0 }));

    try {
      setActive({
        want_to_eat: localStorage.getItem(activeKey(campaignId, "want_to_eat")) === "1",
        have_eaten: localStorage.getItem(activeKey(campaignId, "have_eaten")) === "1",
      });
    } catch {
      // localStorageが使えない(プライベートモード等)場合は未投票扱いで進める
    }
  }, [campaignId]);

  function handleTurnstileLoad() {
    if (!window.turnstile || !widgetContainerRef.current || widgetRenderedRef.current) return;
    widgetRenderedRef.current = true;
    window.turnstile.render(widgetContainerRef.current, {
      sitekey: SITE_KEY,
      size: "invisible",
      execution: "execute",
      callback: (token: string) => {
        resolveTokenRef.current?.(token);
        resolveTokenRef.current = null;
      },
      "error-callback": () => {
        resolveTokenRef.current?.("");
        resolveTokenRef.current = null;
      },
    });
  }

  function getTurnstileToken(): Promise<string> {
    return new Promise((resolve) => {
      if (!SITE_KEY || !window.turnstile || !widgetContainerRef.current || !widgetRenderedRef.current) {
        resolve("");
        return;
      }
      resolveTokenRef.current = resolve;
      window.turnstile.execute(widgetContainerRef.current, {});
    });
  }

  async function handleClick(type: ReactionType) {
    if (pending || !counts) return;
    setPending(type);

    const wasActive = active[type];
    const delta = wasActive ? -1 : 1;
    setActive((prev) => ({ ...prev, [type]: !wasActive }));
    setCounts((prev) => (prev ? { ...prev, [type]: prev[type] + delta } : prev));

    try {
      const turnstileToken = await getTurnstileToken();
      const clientToken = getClientToken();
      const res = await fetch("/api/reactions/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, reactionType: type, clientToken, turnstileToken }),
      });
      if (!res.ok) throw new Error("toggle failed");
      const data: { active: boolean; counts: Counts } = await res.json();
      setCounts(data.counts);
      setActive((prev) => ({ ...prev, [type]: data.active }));
      try {
        if (data.active) localStorage.setItem(activeKey(campaignId, type), "1");
        else localStorage.removeItem(activeKey(campaignId, type));
      } catch {
        // noop
      }
    } catch {
      setActive((prev) => ({ ...prev, [type]: wasActive }));
      setCounts((prev) => (prev ? { ...prev, [type]: prev[type] - delta } : prev));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      {SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={handleTurnstileLoad}
        />
      )}
      <div ref={widgetContainerRef} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }} />

      <button
        type="button"
        onClick={() => handleClick("want_to_eat")}
        disabled={pending !== null || !counts}
        aria-pressed={active.want_to_eat}
        className={`flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
          active.want_to_eat
            ? "border-orange-500 bg-orange-500 text-white"
            : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
        }`}
      >
        🙋 食べたい {counts ? counts.want_to_eat : "–"}
      </button>

      <button
        type="button"
        onClick={() => handleClick("have_eaten")}
        disabled={pending !== null || !counts}
        aria-pressed={active.have_eaten}
        className={`flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
          active.have_eaten
            ? "border-green-600 bg-green-600 text-white"
            : "border-gray-200 bg-white text-gray-700 hover:border-green-300"
        }`}
      >
        ✅ 食べたよ {counts ? counts.have_eaten : "–"}
      </button>
    </div>
  );
}

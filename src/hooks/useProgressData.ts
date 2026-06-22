"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProgressApiMeta } from "@/lib/football-data";
import type { ProgressData } from "@/lib/types";

export function useProgressData() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [meta, setMeta] = useState<ProgressApiMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (force) params.set("refresh", "true");
      if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
        params.set("mock", "true");
      }
      const query = params.toString();
      const res = await fetch(`/api/progress${query ? `?${query}` : ""}`);

      let json: { data?: ProgressData; meta?: ProgressApiMeta; error?: string };
      try {
        json = await res.json();
      } catch {
        throw new Error(
          res.status >= 500
            ? "Server error — stop the dev server, run `rm -rf .next && npm run dev`, and reload"
            : `Request failed (${res.status})`,
        );
      }

      if (!res.ok) {
        throw new Error(json.error ?? `Request failed (${res.status})`);
      }

      if (!json.data) {
        throw new Error("Invalid response from /api/progress");
      }

      setData(json.data);
      setMeta(json.meta ?? null);
      if (json.meta?.apiError) {
        setError(json.meta.apiError);
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const nextAt = meta?.cacheExpiresAt ?? data?.nextStatusChangeAt;
    if (!nextAt) return;

    const ms = new Date(nextAt).getTime() - Date.now();
    if (ms <= 0) {
      refresh();
      return;
    }

    const timer = setTimeout(() => refresh(), ms + 500);
    return () => clearTimeout(timer);
  }, [meta?.cacheExpiresAt, data?.nextStatusChangeAt, refresh]);

  return { data, meta, loading, error, refresh, setLoading };
}

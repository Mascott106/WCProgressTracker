"use client";

import { useEffect, useState } from "react";
import { getViewerTimeZone } from "@/lib/format-datetime";

/** Viewer IANA timezone; re-syncs on tab focus and periodically for DST/travel. */
export function useViewerTimeZone(): string {
  const [timeZone, setTimeZone] = useState(getViewerTimeZone);

  useEffect(() => {
    const sync = () => {
      const next = getViewerTimeZone();
      setTimeZone((prev) => (prev === next ? prev : next));
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    const interval = window.setInterval(sync, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(interval);
    };
  }, []);

  return timeZone;
}

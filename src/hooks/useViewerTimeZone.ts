"use client";

import { useTimeZone } from "@/contexts/TimeZoneContext";

/** Viewer IANA timezone from the footer picker (or auto-detected). */
export function useViewerTimeZone(): string {
  return useTimeZone().timeZone;
}

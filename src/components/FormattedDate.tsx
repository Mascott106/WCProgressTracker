"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatDayLabel } from "@/lib/format-datetime";

interface FormattedDateProps {
  iso: string;
  className?: string;
  timeOnly?: boolean;
  dateOnly?: boolean;
}

/** Avoid hydration mismatches from locale/timezone differences between server and client. */
export function FormattedDate({
  iso,
  className,
  timeOnly = false,
  dateOnly = false,
}: FormattedDateProps) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(formatDateTime(iso, { timeOnly, dateOnly }));
  }, [iso, timeOnly, dateOnly]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {formatted ?? "…"}
    </time>
  );
}

export function FormattedDayLabel({
  iso,
  timeZone,
}: {
  iso: string;
  /** Defaults to the viewer's local timezone. */
  timeZone?: string;
}) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(formatDayLabel(iso, timeZone ? { timeZone } : {}));
  }, [iso, timeZone]);

  return <span suppressHydrationWarning>{formatted ?? "Tomorrow"}</span>;
}

"use client";

import { useEffect, useState } from "react";

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

const DATE_ONLY_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
};

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
    const format = dateOnly
      ? DATE_ONLY_FORMAT
      : timeOnly
        ? TIME_FORMAT
        : DATE_TIME_FORMAT;
    setFormatted(new Date(iso).toLocaleString("en-US", format));
  }, [iso, timeOnly, dateOnly]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {formatted ?? "…"}
    </time>
  );
}

export function FormattedDayLabel({ iso }: { iso: string }) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(
      new Date(iso).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );
  }, [iso]);

  return <span suppressHydrationWarning>{formatted ?? "Tomorrow"}</span>;
}

"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FormattedDate } from "@/components/FormattedDate";
import { BroadcastLabel } from "@/components/BroadcastLabel";
import { TeamName } from "@/components/TeamName";
import { useTranslation } from "@/contexts/LocaleContext";
import { formatMatchVenue } from "@/lib/types";
import type { FoxChannel } from "@/lib/types";

const TOOLTIP_OFFSET = 12;
const VIEWPORT_MARGIN = 8;

export interface BracketMatchScheduleInfo {
  matchId: number;
  date: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  city: string;
  foxChannel: FoxChannel;
  onTubi: boolean;
  status: string;
  statusLong: string;
}

function clampTooltipPosition(
  x: number,
  y: number,
  width: number,
  height: number,
): { left: number; top: number } {
  const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
  return {
    left: Math.min(Math.max(VIEWPORT_MARGIN, x), Math.max(VIEWPORT_MARGIN, maxLeft)),
    top: Math.min(Math.max(VIEWPORT_MARGIN, y), Math.max(VIEWPORT_MARGIN, maxTop)),
  };
}

function ScheduleTooltipCard({ info }: { info: BracketMatchScheduleInfo }) {
  const { t, translateRound, translateStatus } = useTranslation();
  const statusLabel =
    translateStatus(info.status) !== info.status
      ? translateStatus(info.status)
      : info.statusLong;
  const showStatus = info.status !== "NS";

  return (
    <div className="w-56 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 shadow-lg">
      <p className="text-sm font-semibold text-foreground">
        {t("knockout.matchNumber", { vars: { id: String(info.matchId) } })}
      </p>
      <p className="mt-0.5 text-xs text-muted/70">
        {translateRound(info.round)}
      </p>
      <FormattedDate
        iso={info.date}
        className="mt-1 block text-sm tabular-nums text-foreground/90"
      />
      <p className="mt-2 text-sm font-medium leading-snug">
        <TeamName name={info.homeTeam} />
        <span className="mx-1.5 font-normal text-muted/50">
          {t("panels.versus")}
        </span>
        <TeamName name={info.awayTeam} />
      </p>
      <p className="mt-1.5 text-xs text-muted/60">
        {formatMatchVenue(info)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <BroadcastLabel
          foxChannel={info.foxChannel}
          onTubi={info.onTubi}
          className="[&_span]:text-[9px]"
        />
        {showStatus && (
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
              info.status === "LIVE" || info.status === "P"
                ? "bg-red-500/15 text-red-400"
                : "bg-muted/10 text-muted/70"
            }`}
          >
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function BracketMatchId({
  matchId,
  schedule,
  className = "",
  children,
}: {
  matchId: number;
  schedule: BracketMatchScheduleInfo;
  className?: string;
  children?: ReactNode;
}) {
  const [hoverCapable, setHoverCapable] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHoverCapable(window.matchMedia("(hover: hover)").matches);
  }, []);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    const rect = tooltipRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 224;
    const height = rect?.height ?? 160;
    const clamped = clampTooltipPosition(
      clientX + TOOLTIP_OFFSET,
      clientY + TOOLTIP_OFFSET,
      width,
      height,
    );
    setPosition(clamped);
  }, []);

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      if (!hoverCapable) return;
      setVisible(true);
      updatePosition(event.clientX, event.clientY);
    },
    [hoverCapable, updatePosition],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      if (!hoverCapable || !visible) return;
      updatePosition(event.clientX, event.clientY);
    },
    [hoverCapable, visible, updatePosition],
  );

  const handleMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const rect = tooltipRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition((prev) =>
      clampTooltipPosition(prev.left, prev.top, rect.width, rect.height),
    );
  }, [visible]);

  return (
    <>
      <span
        className={`cursor-help ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children ?? `M${matchId}`}
      </span>
      {visible &&
        hoverCapable &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            className="pointer-events-none fixed z-50"
            style={{ left: position.left, top: position.top }}
            role="tooltip"
          >
            <ScheduleTooltipCard info={schedule} />
          </div>,
          document.body,
        )}
    </>
  );
}

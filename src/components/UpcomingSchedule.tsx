"use client";

import type { ReactNode } from "react";
import { FormattedDayLabel, FormattedDate } from "@/components/FormattedDate";
import { BroadcastLabel } from "@/components/BroadcastLabel";
import { TeamName } from "@/components/TeamName";
import {
  label,
  scheduleMatchCount,
} from "@/lib/nerd-mode-labels";
import { SCHEDULE_DAY_TIMEZONE } from "@/lib/schedule-day";
import type { MatchSummary, ScheduleDay } from "@/lib/types";
import { formatMatchVenue } from "@/lib/types";

function shortRound(round: string): string {
  const group = round.match(/\(Group ([A-L])\)/);
  if (group) return `Group ${group[1]}`;
  return round.replace("Group Stage - ", "");
}

function ScheduleRow({ match }: { match: MatchSummary }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/25 py-2 last:border-b-0 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-x-3 sm:py-1.5">
      <FormattedDate
        iso={match.date}
        timeOnly
        className="text-[11px] tabular-nums text-muted/70"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug">
          <TeamName name={match.homeTeam} />
          <span className="mx-1.5 font-normal text-muted/50">vs</span>
          <TeamName name={match.awayTeam} />
        </p>
        <p
          className="truncate text-[10px] text-muted/50"
          title={formatMatchVenue(match)}
        >
          {formatMatchVenue(match)}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
        <BroadcastLabel foxChannel={match.foxChannel} onTubi={match.onTubi} />
        <span className="truncate text-[10px] text-muted/60 sm:max-w-[5.5rem] sm:text-right">
          {shortRound(match.round)}
        </span>
      </div>
    </div>
  );
}

function scheduleDayLabel(iso: string) {
  return (
    <FormattedDayLabel iso={iso} timeZone={SCHEDULE_DAY_TIMEZONE} />
  );
}

function dayHeading(day: ScheduleDay, nerdMode: boolean): ReactNode {
  if (day.isToday) {
    return (
      <>
        {label("scheduleToday", nerdMode)} — {scheduleDayLabel(day.dateIso)}
      </>
    );
  }
  if (day.isTomorrow) {
    return (
      <>
        {label("scheduleTomorrow", nerdMode)} — {scheduleDayLabel(day.dateIso)}
      </>
    );
  }
  return scheduleDayLabel(day.dateIso);
}

function ScheduleDayBox({
  day,
  nerdMode,
  fullWidth = false,
}: {
  day: ScheduleDay;
  nerdMode: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`min-h-0 rounded-lg border border-border bg-surface-elevated/60 px-3 py-2 ${
        fullWidth ? "shrink-0" : "flex-1"
      }`}
    >
      <h2 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-dim">
        {dayHeading(day, nerdMode)}
        <span className="ml-2 text-muted/50">
          {scheduleMatchCount(day.matches.length, nerdMode)}
        </span>
      </h2>

      {day.matches.length === 0 ? (
        <p className="py-1 text-xs text-muted/40">
          {label("scheduleEmpty", nerdMode)}
        </p>
      ) : (
        <div>
          {day.matches.map((match) => (
            <ScheduleRow key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

export function UpcomingSchedule({
  days,
  nerdMode = false,
}: {
  days: ScheduleDay[];
  nerdMode?: boolean;
}) {
  const [today, ...laterDays] = days;

  return (
    <div className="flex shrink-0 flex-col gap-2">
      {today && <ScheduleDayBox day={today} nerdMode={nerdMode} fullWidth />}
      {laterDays.length > 0 && (
        <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {laterDays.map((day) => (
            <ScheduleDayBox key={day.dateIso} day={day} nerdMode={nerdMode} />
          ))}
        </div>
      )}
    </div>
  );
}

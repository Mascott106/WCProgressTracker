"use client";

import type { ReactNode } from "react";
import { FormattedDayLabel, FormattedDate } from "@/components/FormattedDate";
import { BroadcastLabel } from "@/components/BroadcastLabel";
import { SCHEDULE_DAY_TIMEZONE } from "@/lib/schedule-day";
import type { MatchSummary, ScheduleDay } from "@/lib/types";

function shortRound(round: string): string {
  const group = round.match(/\(Group ([A-L])\)/);
  if (group) return `Group ${group[1]}`;
  return round.replace("Group Stage - ", "");
}

function ScheduleRow({ match }: { match: MatchSummary }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_4.5rem] items-center gap-x-2 border-b border-border/25 py-1.5 last:border-b-0">
      <FormattedDate
        iso={match.date}
        timeOnly
        className="text-[11px] tabular-nums text-muted/70"
      />
      <p className="text-sm font-medium leading-snug">
        {match.homeTeam}
        <span className="mx-1.5 font-normal text-muted/50">vs</span>
        {match.awayTeam}
      </p>
      <div className="flex flex-col items-end gap-0.5">
        <BroadcastLabel foxChannel={match.foxChannel} onTubi={match.onTubi} />
        <span className="truncate text-right text-[10px] text-muted/60">
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

function dayHeading(day: ScheduleDay): ReactNode {
  if (day.isToday) {
    return <>Rest of today — {scheduleDayLabel(day.dateIso)}</>;
  }
  if (day.isTomorrow) {
    return <>Tomorrow — {scheduleDayLabel(day.dateIso)}</>;
  }
  return scheduleDayLabel(day.dateIso);
}

function ScheduleDayBox({
  day,
  fullWidth = false,
}: {
  day: ScheduleDay;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`min-h-0 rounded-lg border border-border bg-surface-elevated/60 px-3 py-2 ${
        fullWidth ? "shrink-0" : "flex-1"
      }`}
    >
      <h2 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-dim">
        {dayHeading(day)}
        <span className="ml-2 text-muted/50">({day.matches.length} matches)</span>
      </h2>

      {day.matches.length === 0 ? (
        <p className="py-1 text-xs text-muted/40">No matches scheduled</p>
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

export function UpcomingSchedule({ days }: { days: ScheduleDay[] }) {
  const [today, ...laterDays] = days;

  return (
    <div className="flex shrink-0 flex-col gap-2">
      {today && <ScheduleDayBox day={today} fullWidth />}
      {laterDays.length > 0 && (
        <div className="grid shrink-0 grid-cols-2 gap-2">
          {laterDays.map((day) => (
            <ScheduleDayBox key={day.dateIso} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}

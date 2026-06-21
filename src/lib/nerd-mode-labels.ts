export type NerdLabelKey =
  | "pageTitle"
  | "pageSubtitle"
  | "matchSection"
  | "statDone"
  | "statLive"
  | "statLeft"
  | "matchAxisStart"
  | "matchAxisMid"
  | "matchAxisEnd"
  | "timeSection"
  | "panelLive"
  | "panelLast"
  | "emptyLive"
  | "emptyLast"
  | "scheduleToday"
  | "scheduleTomorrow"
  | "scheduleDay"
  | "scheduleMatchCount"
  | "scheduleEmpty"
  | "refresh";

const LABELS: Record<NerdLabelKey, { normal: string; nerd: string }> = {
  pageTitle: { normal: "Tournament Progress", nerd: "Quest Progress" },
  pageSubtitle: {
    normal: "104 matches · June 11 – July 19",
    nerd: "EXP curve · Lv 1–99",
  },
  matchSection: { normal: "Match progress", nerd: "Quest EXP" },
  statDone: { normal: "Done", nerd: "Cleared" },
  statLive: { normal: "Live", nerd: "In Battle" },
  statLeft: { normal: "Left", nerd: "Remaining" },
  matchAxisStart: { normal: "Group Stage", nerd: "Act I" },
  matchAxisMid: { normal: "Knockout", nerd: "Act II" },
  matchAxisEnd: { normal: "Final", nerd: "Finale" },
  timeSection: { normal: "Real time", nerd: "Campaign Time" },
  panelLive: { normal: "Live Now", nerd: "Active Encounter" },
  panelLast: { normal: "Last Completed", nerd: "Last Victory" },
  emptyLive: { normal: "No live matches", nerd: "No active encounters" },
  emptyLast: { normal: "No results yet", nerd: "No victories yet" },
  scheduleToday: { normal: "Rest of today", nerd: "Today's Quests" },
  scheduleTomorrow: { normal: "Tomorrow", nerd: "Next Quests" },
  scheduleDay: { normal: "", nerd: "" },
  scheduleMatchCount: { normal: "matches", nerd: "encounters" },
  scheduleEmpty: { normal: "No matches scheduled", nerd: "No quests scheduled" },
  refresh: { normal: "Refresh", nerd: "Sync" },
};

export function label(key: NerdLabelKey, nerdMode: boolean): string {
  const entry = LABELS[key];
  return nerdMode ? entry.nerd : entry.normal;
}

export function scheduleMatchCount(count: number, nerdMode: boolean): string {
  const unit = label("scheduleMatchCount", nerdMode);
  return `(${count} ${unit})`;
}

/** FOX/FS1 assignments from the official FOX Sports WC 2026 broadcast guide. */
export type FoxChannel = "FOX" | "FS1";

const FOX_NETWORK: FoxChannel[] = [
  "FOX", "FS1", "FOX", "FOX", "FOX", "FS1", "FOX", "FOX",
  "FS1", "FOX", "FOX", "FS1", "FS1", "FOX", "FS1", "FOX",
  "FOX", "FOX", "FOX", "FS1", "FS1", "FOX", "FOX", "FS1",
  "FOX", "FOX", "FS1", "FOX", "FOX", "FOX", "FS1", "FOX",
  "FOX", "FS1", "FOX", "FS1", "FS1", "FOX", "FS1", "FS1",
  "FOX", "FOX", "FOX", "FS1", "FOX", "FOX", "FOX", "FS1",
  "FOX", "FS1", "FOX", "FS1", "FOX", "FS1", "FS1", "FOX",
  "FS1", "FOX", "FS1", "FOX", "FOX", "FS1", "FS1", "FOX",
  "FS1", "FOX", "FOX", "FS1", "FS1", "FOX", "FOX", "FS1",
  "FOX", "FOX", "FOX", "FOX", "FOX", "FOX", "FOX", "FOX",
  "FOX", "FS1", "FOX", "FOX", "FS1", "FOX", "FOX", "FOX",
  "FOX", "FOX", "FOX", "FOX", "FOX", "FOX", "FOX", "FOX",
  "FOX", "FOX", "FOX", "FOX", "FOX", "FOX", "FOX", "FOX",
];

/** Live simulcasts on Tubi (opening ceremony + Mexico opener + US opener). */
const TUBI_LIVE = new Set([1, 4]);

export interface BroadcastInfo {
  foxChannel: FoxChannel;
  onTubi: boolean;
}

export function getBroadcast(matchId: number): BroadcastInfo {
  const foxChannel = FOX_NETWORK[matchId - 1] ?? "FOX";
  return {
    foxChannel,
    onTubi: TUBI_LIVE.has(matchId),
  };
}

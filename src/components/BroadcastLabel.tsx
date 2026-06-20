import type { FoxChannel } from "@/lib/types";

export function BroadcastLabel({
  foxChannel,
  onTubi,
  className = "",
}: {
  foxChannel: FoxChannel;
  onTubi: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span
        className={`rounded px-1 py-px text-[8px] font-bold uppercase leading-none tracking-wide ${
          foxChannel === "FOX"
            ? "bg-blue-500/15 text-blue-300"
            : "bg-orange-500/15 text-orange-300"
        }`}
      >
        {foxChannel}
      </span>
      {onTubi && (
        <span className="rounded bg-purple-500/15 px-1 py-px text-[8px] font-bold uppercase leading-none tracking-wide text-purple-300">
          Tubi
        </span>
      )}
    </span>
  );
}

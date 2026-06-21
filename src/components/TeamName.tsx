import { teamFlag } from "@/lib/team-flags";

export function TeamName({
  name,
  className,
  flagClassName = "mr-1 shrink-0",
}: {
  name: string;
  className?: string;
  flagClassName?: string;
}) {
  const flag = teamFlag(name);

  return (
    <span className={className}>
      {flag ? (
        <span className={flagClassName} aria-hidden>
          {flag}
        </span>
      ) : null}
      {name}
    </span>
  );
}

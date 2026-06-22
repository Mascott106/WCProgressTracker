export function computeTimePercent(
  now: number,
  startAt: string,
  endAt: string,
): number {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return ((now - start) / (end - start)) * 100;
}

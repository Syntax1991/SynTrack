/*
 * Reuses the same reset instant Weekly Checklist and Vault/M+ already
 * compute (getWeeklyPeriod's endsAt) - not a separately-invented
 * countdown. Pure/testable: takes "now" as an argument rather than
 * reading the clock itself.
 */
export function formatResetCountdown(
  endsAt: string,
  now: Date
): string {
  const msRemaining =
    new Date(endsAt).getTime() -
    now.getTime();

  if (msRemaining <= 0) {
    return "Reset available";
  }

  const totalMinutes = Math.floor(
    msRemaining / (60 * 1000)
  );

  const days = Math.floor(
    totalMinutes / (60 * 24)
  );

  const hours = Math.floor(
    (totalMinutes -
      days * 60 * 24) /
      60
  );

  if (days === 0 && hours === 0) {
    const minutes =
      totalMinutes -
      days * 60 * 24 -
      hours * 60;

    return `Reset in ${minutes}m`;
  }

  if (days === 0) {
    return `Reset in ${hours}h`;
  }

  return `Reset in ${days}d ${hours}h`;
}

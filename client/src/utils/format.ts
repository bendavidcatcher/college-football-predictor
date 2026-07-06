/** Formats a 0..1 probability as a whole-number percentage string, e.g. 0.734 -> "73%". */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Formats a win/loss record like "7-1". */
export function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

/** Formats a conference win/loss record like "4-1". */
export function formatConferenceRecord(confWins: number, confLosses: number): string {
  return `${confWins}-${confLosses}`;
}

/** Formats an ISO date string as a short, readable date, e.g. "Sep 6, 2025". */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Formats a number to a fixed number of decimal places (default 1), trimming trailing complexity. */
export function formatStat(value: number, digits = 1): string {
  return value.toFixed(digits);
}

/** Formats strengthOfSchedule (0..1) as a percentage with one decimal, e.g. "62.5%". */
export function formatSosPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Formats a turnover margin with an explicit sign, e.g. "+4" or "-2". */
export function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

/** Formats a projected score pairing, e.g. "34 – 27". */
export function formatScoreLine(scoreA: number, scoreB: number): string {
  return `${Math.round(scoreA)} – ${Math.round(scoreB)}`;
}

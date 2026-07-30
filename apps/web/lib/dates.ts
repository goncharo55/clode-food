const DAY_MS = 24 * 60 * 60 * 1000;

/** アプリ全体で「今日」を一箇所に集約する（テスト・シードデータとの整合のため） */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function atMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 終了日までの残り日数。終了日未設定(なくなり次第終了)ならnull */
export function daysUntilEnd(endDate: Date | null): number | null {
  if (!endDate) return null;
  const diff = atMidnight(endDate).getTime() - today().getTime();
  return Math.ceil(diff / DAY_MS);
}

export function daysSinceStart(startDate: Date): number {
  const diff = today().getTime() - atMidnight(startDate).getTime();
  return Math.floor(diff / DAY_MS);
}

export function isStartingToday(startDate: Date): boolean {
  return daysSinceStart(startDate) === 0;
}

/** 終了間近（0〜3日後まで）かどうか。すでに終了している場合はfalse */
export function isEndingSoon(endDate: Date | null): boolean {
  const days = daysUntilEnd(endDate);
  if (days === null) return false;
  return days >= 0 && days <= 3;
}

export function isExpired(endDate: Date | null): boolean {
  const days = daysUntilEnd(endDate);
  if (days === null) return false;
  return days < 0;
}

export function formatDateJa(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateShortJa(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export function formatDateWithWeekdayJa(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function dateKey(date: Date): string {
  const d = atMidnight(date);
  return d.toISOString().slice(0, 10);
}

export function formatPeriodJa(startDate: Date, endDate: Date | null): string {
  const start = formatDateJa(startDate);
  if (!endDate) return `${start} 〜 なくなり次第終了`;
  return `${start} 〜 ${formatDateJa(endDate)}`;
}

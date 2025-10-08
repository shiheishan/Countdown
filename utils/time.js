export const MS = 1;
export const SEC = 1000 * MS;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const SHANGHAI_OFFSET_MIN = 8 * 60;

const pad = (value) => String(value).padStart(2, '0');

const toTimestamp = (value) => (value instanceof Date ? value.getTime() : Number(value));

const shanghaiDate = (year, month, day, hours = 0, minutes = 0, seconds = 0) =>
  new Date(Date.UTC(year, month, day, hours, minutes, seconds) - SHANGHAI_OFFSET_MIN * MIN);

export function formatShanghai(date) {
  const offsetDate = new Date(date.getTime() + SHANGHAI_OFFSET_MIN * MIN);
  const year = offsetDate.getUTCFullYear();
  const month = pad(offsetDate.getUTCMonth() + 1);
  const day = pad(offsetDate.getUTCDate());
  const hours = pad(offsetDate.getUTCHours());
  const minutes = pad(offsetDate.getUTCMinutes());
  const seconds = pad(offsetDate.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function breakdownDuration(duration) {
  let remaining = Math.max(0, duration);
  const days = Math.floor(remaining / DAY);
  remaining -= days * DAY;
  const hours = Math.floor(remaining / HOUR);
  remaining -= hours * HOUR;
  const minutes = Math.floor(remaining / MIN);
  remaining -= minutes * MIN;
  const seconds = Math.floor(remaining / SEC);
  return { d: days, h: hours, m: minutes, s: seconds };
}

export function humanizeDuration(duration) {
  const safe = Math.max(0, duration);
  const { d, h, m } = breakdownDuration(safe);
  return `${d}天 ${pad(h)}小时 ${pad(m)}分钟`;
}

export function formatDuration(duration) {
  const safe = Math.max(0, duration);
  const { d, h, m, s } = breakdownDuration(safe);
  return `${d} 天 ${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function startOfDay(date) {
  const ms = toTimestamp(date) ?? Date.now();
  const shanghaiNow = new Date(ms + SHANGHAI_OFFSET_MIN * MIN);
  const year = shanghaiNow.getUTCFullYear();
  const month = shanghaiNow.getUTCMonth();
  const day = shanghaiNow.getUTCDate();
  return shanghaiDate(year, month, day);
}

export function addDays(date, amount) {
  const ms = toTimestamp(date) ?? Date.now();
  return new Date(ms + amount * DAY);
}

export function rangeStatus(now, range) {
  const nowMs = toTimestamp(now) ?? Date.now();
  const startMs = toTimestamp(range.start);
  const endMs = toTimestamp(range.end);
  const total = Math.max(0, endMs - startMs);
  const baseRatio = total > 0 ? (nowMs - startMs) / total : 0;

  if (nowMs < startMs) {
    return { state: 'before', ratio: 0, target: new Date(startMs) };
  }

  if (nowMs >= endMs) {
    return { state: 'after', ratio: 1, target: new Date(endMs) };
  }

  const ratio = Math.min(1, Math.max(0, baseRatio));
  return { state: 'during', ratio, target: new Date(endMs) };
}

export function goldenWeekRange(year) {
  const start = shanghaiDate(year, 9, 1);
  const end = shanghaiDate(year, 9, 8, 23, 59, 59);
  return { start, end };
}

export function newYearRange(now) {
  const current = new Date(toTimestamp(now) ?? Date.now());
  const shanghaiNow = new Date(current.getTime() + SHANGHAI_OFFSET_MIN * MIN);
  const year = shanghaiNow.getUTCFullYear();
  const startThisYear = shanghaiDate(year, 0, 1);
  const endThisYear = addDays(startThisYear, 1);

  if (current.getTime() < endThisYear.getTime()) {
    return { start: startThisYear, end: endThisYear };
  }

  const nextStart = shanghaiDate(year + 1, 0, 1);
  return { start: nextStart, end: addDays(nextStart, 1) };
}

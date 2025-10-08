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
  const { d, h, m, s } = breakdownDuration(duration);
  const parts = [];
  if (d) parts.push(`${d}天`);
  if (h) parts.push(`${h}小时`);
  if (m) parts.push(`${m}分钟`);
  if (!d && !h) parts.push(`${s}秒`);
  return parts.join(' ');
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

  if (nowMs < startMs) {
    return { state: 'before', target: new Date(startMs) };
  }

  if (nowMs >= endMs) {
    return { state: 'after', target: new Date(endMs) };
  }

  return { state: 'during', target: new Date(endMs) };
}

export function octRange(year) {
  const start = shanghaiDate(year, 9, 1);
  const end = shanghaiDate(year, 9, 8);
  return { start, end };
}

export function nextSundayRange(now) {
  const currentStart = startOfDay(now);
  const shanghaiStart = new Date(currentStart.getTime() + SHANGHAI_OFFSET_MIN * MIN);
  const day = shanghaiStart.getUTCDay();

  if (day === 0) {
    const start = currentStart;
    return { start, end: addDays(start, 1) };
  }

  const daysUntil = (7 - day) % 7 || 7;
  const start = addDays(currentStart, daysUntil);
  return { start, end: addDays(start, 1) };
}

export function newYearRange(now) {
  const current = new Date(toTimestamp(now) ?? Date.now());
  const shanghaiNow = new Date(current.getTime() + SHANGHAI_OFFSET_MIN * MIN);
  const year = shanghaiNow.getUTCFullYear();
  const startThisYear = shanghaiDate(year, 0, 1);
  const endThisYear = addDays(startThisYear, 1);

  if (current.getTime() < startThisYear.getTime()) {
    return { start: startThisYear, end: endThisYear };
  }

  if (current.getTime() < endThisYear.getTime()) {
    return { start: startThisYear, end: endThisYear };
  }

  const nextStart = shanghaiDate(year + 1, 0, 1);
  return { start: nextStart, end: addDays(nextStart, 1) };
}

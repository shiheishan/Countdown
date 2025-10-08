export const MS = 1;
export const SEC = 1000 * MS;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const SHANGHAI_OFFSET_MIN = 8 * 60;

const pad = (value) => String(value).padStart(2, '0');

const toTimestamp = (value) => (value instanceof Date ? value.getTime() : value);

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
  const shanghaiNow = new Date(toTimestamp(date) + SHANGHAI_OFFSET_MIN * MIN);
  const year = shanghaiNow.getUTCFullYear();
  const month = shanghaiNow.getUTCMonth();
  const day = shanghaiNow.getUTCDate();
  return shanghaiDate(year, month, day);
}

export function addDays(date, amount) {
  return new Date(toTimestamp(date) + amount * DAY);
}

export function nextSundayRange(now) {
  const current = new Date(toTimestamp(now));
  const shanghaiNow = new Date(current.getTime() + SHANGHAI_OFFSET_MIN * MIN);
  const day = shanghaiNow.getUTCDay();
  const startToday = startOfDay(current);
  const daysUntil = (7 - day) % 7;
  const start = daysUntil === 0 ? startToday : addDays(startToday, daysUntil);
  const end = addDays(start, 1);
  return { start, end };
}

export function octRange(year) {
  const start = shanghaiDate(year, 9, 1);
  const end = shanghaiDate(year, 9, 8);
  return { start, end };
}

export function nextNewYearRange(now) {
  const current = new Date(toTimestamp(now));
  const shanghaiNow = new Date(current.getTime() + SHANGHAI_OFFSET_MIN * MIN);
  const year = shanghaiNow.getUTCFullYear();
  const thisNewYearStart = shanghaiDate(year, 0, 1);
  const thisNewYearEnd = addDays(thisNewYearStart, 1);

  if (current.getTime() < thisNewYearStart.getTime()) {
    return { start: thisNewYearStart, end: thisNewYearEnd };
  }

  if (current.getTime() < thisNewYearEnd.getTime()) {
    return { start: thisNewYearStart, end: thisNewYearEnd };
  }

  const nextNewYearStart = shanghaiDate(year + 1, 0, 1);
  return { start: nextNewYearStart, end: addDays(nextNewYearStart, 1) };
}

export function rangeStatus(now, start, end) {
  const nowMs = toTimestamp(now);
  const startMs = toTimestamp(start);
  const endMs = toTimestamp(end);
  const total = Math.max(0, endMs - startMs);

  if (nowMs < startMs) {
    return { status: 'before', ratio: total ? Math.max(0, (nowMs - startMs) / total) : 0 };
  }

  if (nowMs >= endMs) {
    return { status: 'after', ratio: 1 };
  }

  const ratio = total ? (nowMs - startMs) / total : 0;
  return { status: 'during', ratio };
}

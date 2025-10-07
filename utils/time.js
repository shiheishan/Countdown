export const MS = 1;
export const SEC = 1000 * MS;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const SHANGHAI_OFFSET_MIN = 8 * 60;

const pad = (value) => String(value).padStart(2, '0');

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

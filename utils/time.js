export const MS = 1;
export const SEC = 1000 * MS;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const BJT_TZ = 'Asia/Shanghai';
export const BJT_OFFSET_MS = 8 * 60 * 60 * 1000;

const pad = (value) => String(value).padStart(2, '0');

const bjtFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: BJT_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function formatBJT(date) {
  const safeDate = date instanceof Date ? date : new Date(Number(date) || Date.now());
  const parts = bjtFormatter.formatToParts(safeDate);
  const bucket = { year: '0000', month: '00', day: '00', hour: '00', minute: '00', second: '00' };
  parts.forEach((part) => {
    if (part.type in bucket) {
      bucket[part.type] = part.value;
    }
  });
  return `${bucket.year}-${bucket.month}-${bucket.day} ${bucket.hour}:${bucket.minute}:${bucket.second}`;
}

// ---- 北京时间工具（UTC+08:00）----
export function bjtParts(date = new Date()) {
  const source = date instanceof Date ? date : new Date(Number(date) || Date.now());
  const t = new Date(source.getTime() + BJT_OFFSET_MS);
  return {
    y: t.getUTCFullYear(),
    M: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
    h: t.getUTCHours(),
    m: t.getUTCMinutes(),
    s: t.getUTCSeconds(),
    dow: t.getUTCDay(),
  };
}

export function bjtLocalToUTC(y, M, d, hh = 0, mm = 0, ss = 0, ms = 0) {
  return new Date(Date.UTC(y, M - 1, d, hh, mm, ss, ms) - BJT_OFFSET_MS);
}

export function bjtStartOfDayUTC(date = new Date()) {
  const p = bjtParts(date);
  return bjtLocalToUTC(p.y, p.M, p.d);
}

export function bjtAddDaysUTC(date, n) {
  const p = bjtParts(date);
  return bjtLocalToUTC(p.y, p.M, p.d + n);
}

export function goldenWeekRangeBJT(now = new Date()) {
  const y = bjtParts(now).y;
  return { start: bjtLocalToUTC(y, 10, 1), end: bjtLocalToUTC(y, 10, 8) };
}

export function newYearRangeBJT(now = new Date()) {
  const y = bjtParts(now).y;
  const sThis = bjtLocalToUTC(y, 1, 1);
  const eThis = bjtLocalToUTC(y, 1, 2);
  const source = now instanceof Date ? now : new Date(Number(now) || Date.now());
  if (source < eThis) return { start: sThis, end: eThis };
  const sNext = bjtLocalToUTC(y + 1, 1, 1);
  const eNext = bjtLocalToUTC(y + 1, 1, 2);
  return { start: sNext, end: eNext };
}

export function nextSundayRangeBJT(now = new Date()) {
  const source = now instanceof Date ? now : new Date(Number(now) || Date.now());
  const dow = bjtParts(source).dow;
  if (dow === 0) {
    const start = bjtStartOfDayUTC(source);
    const end = bjtAddDaysUTC(start, 1);
    return { state: 'during', start, end, target: end };
  }
  const start = bjtAddDaysUTC(bjtStartOfDayUTC(source), 7 - dow);
  const end = bjtAddDaysUTC(start, 1);
  return { state: 'before', start, end, target: start };
}

export function rangeStatus(now, { start, end }) {
  const current = now instanceof Date ? now : new Date(Number(now) || Date.now());
  if (current < start) return { state: 'before', target: start };
  if (current < end) return { state: 'during', target: end };
  return { state: 'after', target: end };
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

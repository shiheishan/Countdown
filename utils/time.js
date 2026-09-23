export const MS = 1;
export const SEC = 1000 * MS;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const BJT_OFFSET_MS = 8 * 60 * 60 * 1000;

export const pad2 = (value) => String(value).padStart(2, '0');

const WEEKDAYS = '日一二三四五六';

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

// 'YYYY-MM-DD' 按北京时间解析
export function bjtDateStringToUTC(dateString, hh = 0, mm = 0, ss = 0) {
  const [y, M, d] = String(dateString).split('-').map(Number);
  return bjtLocalToUTC(y, M, d, hh, mm, ss);
}

// 两个时刻相差的自然日数（北京时间）
export function bjtDayDiff(from, to) {
  return Math.round((bjtStartOfDayUTC(to).getTime() - bjtStartOfDayUTC(from).getTime()) / DAY);
}

// 「9月25日」
export function formatCnDate(date) {
  const p = bjtParts(date);
  return `${p.M}月${p.d}日`;
}

// 「9月25日（周五）」
export function formatCnDateWeekday(date) {
  return `${formatCnDate(date)}（周${WEEKDAYS[bjtParts(date).dow]}）`;
}

// 元旦当天，结束于 1 月 1 日 23:59:59（与节假日数据的写法一致）
export function newYearRangeBJT(now = new Date()) {
  const source = now instanceof Date ? now : new Date(Number(now) || Date.now());
  const y = bjtParts(source).y;
  const end = bjtLocalToUTC(y, 1, 1, 23, 59, 59);
  if (source < end) return { start: bjtLocalToUTC(y, 1, 1), end };
  return { start: bjtLocalToUTC(y + 1, 1, 1), end: bjtLocalToUTC(y + 1, 1, 1, 23, 59, 59) };
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

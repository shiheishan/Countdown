import { MIN, SHANGHAI_OFFSET_MIN, goldenWeekRange, newYearRange } from '../utils/time.js';

const toTimestamp = (value) => (value instanceof Date ? value.getTime() : Number(value) || Date.now());

const getShanghaiYear = (now) => {
  const timestamp = toTimestamp(now);
  return new Date(timestamp + SHANGHAI_OFFSET_MIN * MIN).getUTCFullYear();
};

export function buildGoldenWeek(now = new Date()) {
  const nowMs = toTimestamp(now);
  const year = Math.max(2025, getShanghaiYear(now));
  let { start, end } = goldenWeekRange(year);

  if (nowMs > end.getTime()) {
    const next = goldenWeekRange(year + 1);
    start = next.start;
    end = next.end;
  }
  const year = getShanghaiYear(now);
  const { start, end } = goldenWeekRange(year);
  return {
    id: 'golden-week',
    title: '国庆·中秋',
    start,
    end,
  };
}

export function buildNewYear(now = new Date()) {
  const { start, end } = newYearRange(now);
  return {
    id: 'new-year',
    title: '元旦',
    start,
    end,
  };
}

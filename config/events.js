import { goldenWeekRangeBJT, newYearRangeBJT } from '../utils/time.js';

export function buildGoldenWeek(now = new Date()) {
  const range = goldenWeekRangeBJT(now);
  return {
    id: 'golden-week',
    title: '国庆·中秋',
    start: range.start,
    end: range.end,
  };
}

export function buildNewYear(now = new Date()) {
  const range = newYearRangeBJT(now);
  return {
    id: 'new-year',
    title: '元旦',
    start: range.start,
    end: range.end,
  };
}

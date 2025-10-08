import { nextNewYearRange, octRange, SHANGHAI_OFFSET_MIN, MIN } from '../utils/time.js';

export const EVENTS = [
  {
    id: 'national-day-2025',
    name: '国庆·中秋',
    start: '2025-10-01T00:00:00+08:00',
    end: '2025-10-08T00:00:00+08:00',
    statusLabels: {
      before: '等待',
      during: '假期中',
      after: '已结束',
    },
  },
];

const getShanghaiYear = (now) => {
  const timestamp = now instanceof Date ? now.getTime() : Number(now) || Date.now();
  return new Date(timestamp + SHANGHAI_OFFSET_MIN * MIN).getUTCFullYear();
};

export function buildNewYear(now = new Date()) {
  const { start, end } = nextNewYearRange(now);
  return {
    id: 'new-year',
    name: '元旦',
    start: start.toISOString(),
    end: end.toISOString(),
    statusLabels: {
      before: '等待',
      during: '今天',
      after: '已结束',
    },
  };
}

export function buildOct(now = new Date()) {
  const year = getShanghaiYear(now);
  const { start, end } = octRange(year);
  return {
    id: `national-day-${year}`,
    name: '国庆·中秋',
    start: start.toISOString(),
    end: end.toISOString(),
    statusLabels: {
      before: '等待',
      during: '假期中',
      after: '已结束',
    },
  };
}

export function getActiveEvent(search = window.location.search, now = new Date()) {
  const params = new URLSearchParams(search);
  const eventId = params.get('event');
  if (!eventId) {
    return buildNewYear(now);
  }

  const matched = EVENTS.find((event) => event.id === eventId);
  return matched ?? buildNewYear(now);
}

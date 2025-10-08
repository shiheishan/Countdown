import { newYearRange, octRange, nextSundayRange, SHANGHAI_OFFSET_MIN, MIN } from '../utils/time.js';

const toTimestamp = (value) => (value instanceof Date ? value.getTime() : Number(value) || Date.now());

const getShanghaiYear = (now) => {
  const timestamp = toTimestamp(now);
  return new Date(timestamp + SHANGHAI_OFFSET_MIN * MIN).getUTCFullYear();
};

export const HEADLINE_COPY = {
  'new-year': {
    before: (event) => `距离${event.title}还有…`,
    during: (event) => `今天是${event.title}，距离结束还有…`,
    after: (event) => `${event.title}已结束…`,
  },
  'golden-week': {
    before: (event) => `距离${event.title}还有…`,
    during: () => '放假中，距离结束还有…',
    after: (event) => `距离${event.title}结束已经过去…`,
  },
  'next-sunday': {
    before: (event) => `距离${event.title}还有…`,
    during: () => '放假中（周日），距离结束还有…',
    after: (event) => `${event.title}已结束…`,
  },
};

export const PANEL_COPY = {
  'new-year': {
    before: (event) => `距离${event.title}还有`,
    during: (event) => `今天是${event.title}，距离结束还有`,
    after: (event) => `${event.title}已结束`,
  },
  'golden-week': {
    before: (event) => `距离${event.title}还有`,
    during: () => '放假中，距离结束还有',
    after: (event) => `距离${event.title}结束已经过去`,
  },
  'next-sunday': {
    before: (event) => `距离${event.title}还有`,
    during: () => '放假中（周日），距离结束还有',
    after: (event) => `${event.title}已结束`,
  },
};

export function buildNewYear(now = new Date()) {
  const { start, end } = newYearRange(now);
  return {
    id: 'new-year',
    title: '元旦',
    start,
    end,
  };
}

export function buildGoldenWeek(now = new Date()) {
  const year = getShanghaiYear(now);
  const { start, end } = octRange(year);
  return {
    id: 'golden-week',
    title: '国庆·中秋',
    start,
    end,
  };
}

export function buildNextSunday(now = new Date()) {
  const { start, end } = nextSundayRange(now);
  return {
    id: 'next-sunday',
    title: '下次周日',
    start,
    end,
  };
}

import { DAY, bjtDateStringToUTC, newYearRangeBJT } from '../utils/time.js';

// 找不到上一个假期时，等待进度从开始前一年算起
const DEFAULT_LEAD_IN = 365 * DAY;

// 法定节假日数据：https://github.com/NateScarlet/holiday-cn（解析自国务院放假通知）
export const HOLIDAY_SOURCE = (year) => `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`;

// 节日名 → ?event= 使用的 id
export const HOLIDAY_IDS = {
  元旦: 'new-year',
  春节: 'spring-festival',
  清明节: 'qingming',
  劳动节: 'labor-day',
  端午节: 'dragon-boat',
  中秋节: 'mid-autumn',
  国庆节: 'national-day',
};

// 从 first 起连续 count 天的休息日（格式同 holiday-cn 的 days）
function offDays(name, first, count) {
  const firstMs = Date.parse(`${first}T00:00:00Z`);
  return Array.from({ length: count }, (_, index) => ({
    name,
    date: new Date(firstMs + index * DAY).toISOString().slice(0, 10),
    isOffDay: true,
  }));
}

// 内置数据，按年份存放（同 holiday-cn 每年一个文件里的 days）。某一年拉不到网络数据、缓存里也没有时用这里的。
// 每年 11 月前后国务院发布次年安排后，把次年加进来，否则网络不通的访客会看到按规则推算的元旦（只放 1 天）
export const FALLBACK_YEARS = {
  // https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm
  2026: [
    ...offDays('元旦', '2026-01-01', 3),
    ...offDays('春节', '2026-02-15', 9),
    ...offDays('清明节', '2026-04-04', 3),
    ...offDays('劳动节', '2026-05-01', 5),
    ...offDays('端午节', '2026-06-19', 3),
    ...offDays('中秋节', '2026-09-25', 3),
    ...offDays('国庆节', '2026-10-01', 7),
  ],
  // https://www.gov.cn/zhengce/zhengceku/202611/content_7085102.htm
  2027: [
    ...offDays('元旦', '2027-01-01', 3),
    ...offDays('春节', '2027-02-05', 9),
    ...offDays('清明节', '2027-04-03', 3),
    ...offDays('劳动节', '2027-05-01', 5),
    ...offDays('端午节', '2027-06-09', 1),
    ...offDays('中秋节', '2027-09-15', 1),
    ...offDays('国庆节', '2027-10-01', 7),
  ],
};

// 「国庆节、中秋节」→ 「国庆·中秋」；单个节日名保持原样
function holidayTitle(name) {
  const parts = name.split('、');
  if (parts.length === 1) return name;
  return parts.map((part) => part.replace(/节$/, '')).join('·');
}

function holidayId(name) {
  const first = name.split('、')[0];
  return HOLIDAY_IDS[first] ?? first;
}

// 把逐日数据合并成连续的放假区间：同名且日期相连的休息日为一段
export function buildHolidayRanges(days) {
  const offDays = (days ?? [])
    .filter((day) => day && day.isOffDay)
    .map((day) => ({ name: day.name, date: day.date, ms: bjtDateStringToUTC(day.date).getTime() }))
    .sort((a, b) => a.ms - b.ms);

  const groups = [];
  offDays.forEach((day) => {
    const last = groups[groups.length - 1];
    if (last && last.name === day.name && day.ms - last.lastMs === DAY) {
      last.lastDate = day.date;
      last.lastMs = day.ms;
    } else if (!last || last.lastMs !== day.ms) {
      groups.push({ name: day.name, firstDate: day.date, lastDate: day.date, lastMs: day.ms });
    }
  });

  return groups.map((group) => ({
    id: holidayId(group.name),
    title: holidayTitle(group.name),
    start: bjtDateStringToUTC(group.firstDate),
    end: bjtDateStringToUTC(group.lastDate, 23, 59, 59), // 结束于最后一天 23:59:59 BJT
  }));
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

// 等待进度的起点：开始之前、且已经结束的最近一个假期的结束时间，以及那个假期的名字
// （用 ?event= 指定较远的节日时，中间还没过的假期不算）
export function leadIn(event, ranges, now = new Date()) {
  const startMs = new Date(event.start).getTime();
  const limitMs = Math.min(startMs, new Date(now).getTime());
  const previous = ranges.filter((range) => range.end.getTime() <= limitMs).pop();
  return previous
    ? { leadStart: previous.end, leadAfter: previous.title }
    : { leadStart: new Date(startMs - DEFAULT_LEAD_IN), leadAfter: '' };
}

// 主页活动之后的下一个节日（供页脚使用）；没有更多数据时按规则推算元旦，
// 推算出的元旦就是主页活动时返回 null（页脚不再重复显示同一个节日）
export function pickNextHoliday(now, ranges, exclude) {
  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  const excludeMs = exclude ? new Date(exclude.start).getTime() : null;
  const isOther = (range) => new Date(range.start).getTime() !== excludeMs;
  const next = ranges.find((range) => range.end.getTime() > nowMs && isOther(range));
  if (next) return next;
  const newYear = buildNewYear(now);
  return isOther(newYear) ? newYear : null;
}

// 正在进行或下一个节日；指定 requestedId 时只在该节日里找（都已结束则显示最近一次）；
// 没有可用数据时回退到按规则计算的元旦
export function pickEvent(now, ranges, requestedId) {
  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  const isUpcoming = (range) => range.end.getTime() > nowMs;

  const matching = requestedId ? ranges.filter((range) => range.id === requestedId) : [];
  if (matching.length) {
    const upcoming = matching.find(isUpcoming);
    if (upcoming) return upcoming;
    // 元旦可按规则推算，次年数据未发布时也能倒计时
    if (requestedId === 'new-year') return buildNewYear(now);
    return matching[matching.length - 1];
  }
  return ranges.find(isUpcoming) ?? buildNewYear(now);
}

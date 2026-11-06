import { STORAGE_KEYS } from '../config/app.js';
import { FALLBACK_YEARS, HOLIDAY_SOURCE } from '../config/events.js';

const yearOf = (day) => String(day?.date).slice(0, 4);

function groupByYear(days) {
  const years = {};
  days.forEach((day) => (years[yearOf(day)] ??= []).push(day));
  return years;
}

// 缓存：{ 年份: 那一年 holiday-cn 文件里的 days }。按文件年份存，因为文件里可能有上一年的日期
// （如 2023 年的元旦从 2022-12-31 放起）。旧版本存的是拼在一起的数组，按日期年份拆开沿用
function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.holidays);
    const data = raw ? JSON.parse(raw) : null;
    if (Array.isArray(data)) return groupByYear(data);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function writeCache(years) {
  try {
    localStorage.setItem(STORAGE_KEYS.holidays, JSON.stringify(years));
  } catch {
    // 存储不可用（隐私模式等）时仅本次会话生效
  }
}

// 每一年优先用缓存，缓存里没有的年份用内置数据。缓存可能是次年安排发布前写的、只有今年，
// 这时网络再拉不到，次年也能用内置数据，不会退回按规则推算的元旦
export function loadCachedDays() {
  return Object.values({ ...FALLBACK_YEARS, ...readCache() }).flat();
}

async function fetchYear(year) {
  const response = await fetch(HOLIDAY_SOURCE(year));
  if (!response.ok) throw new Error(`holiday-cn ${year}: HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.days) ? data.days : [];
}

// 拉取多个年份；某年拉取失败或还没有数据时，用缓存里的这一年，再没有就用内置数据；
// 一年都没拉到返回 null（下一年的数据在官方发布前会 404，属正常）
export async function fetchDays(years) {
  const results = await Promise.allSettled(years.map(fetchYear));
  const fetched = {};
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.length) fetched[years[index]] = result.value;
  });
  if (!Object.keys(fetched).length) return null;

  // 缓存只留这次请求的年份（今年、明年），更早的年份内置数据里有
  const cache = readCache();
  const kept = Object.fromEntries(years.filter((year) => cache[year]).map((year) => [year, cache[year]]));
  writeCache({ ...kept, ...fetched });
  return Object.values({ ...FALLBACK_YEARS, ...kept, ...fetched }).flat();
}

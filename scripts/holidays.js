import { STORAGE_KEYS } from '../config/app.js';
import { FALLBACK_DAYS, HOLIDAY_SOURCE } from '../config/events.js';

function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.holidays);
    const days = raw ? JSON.parse(raw) : null;
    return Array.isArray(days) && days.length ? days : null;
  } catch {
    return null;
  }
}

function writeCache(days) {
  try {
    localStorage.setItem(STORAGE_KEYS.holidays, JSON.stringify(days));
  } catch {
    // 存储不可用（隐私模式等）时仅本次会话生效
  }
}

export function loadCachedDays() {
  return readCache() ?? FALLBACK_DAYS;
}

async function fetchYear(year) {
  const response = await fetch(HOLIDAY_SOURCE(year));
  if (!response.ok) throw new Error(`holiday-cn ${year}: HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.days) ? data.days : [];
}

// 拉取多个年份并合并；某年拉取失败时沿用该年的缓存；全部失败返回 null
// （下一年的数据在官方发布前会 404，属正常）
export async function fetchDays(years) {
  const results = await Promise.allSettled(years.map(fetchYear));
  if (!results.some((result) => result.status === 'fulfilled')) return null;

  const cached = readCache() ?? [];
  const days = results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    const year = String(years[index]);
    return cached.filter((day) => String(day.date).startsWith(year));
  });
  writeCache(days);
  return days;
}

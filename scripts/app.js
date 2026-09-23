import { initThemes } from './theme.js';
import { renderCountdown } from './countdown.js';
import { renderFooter } from './footer.js';
import { buildHolidayRanges, leadIn, pickEvent, pickNextHoliday } from '../config/events.js';
import { fetchDays, loadCachedDays } from './holidays.js';
import { bjtParts } from '../utils/time.js';

let ranges = buildHolidayRanges(loadCachedDays());

function createTick(requestedId) {
  return () => {
    const now = new Date();
    const event = pickEvent(now, ranges, requestedId);
    renderCountdown({ ...event, ...leadIn(event, ranges, now) }, now);
    renderFooter(now, pickNextHoliday(now, ranges, event));
  };
}

async function refreshHolidays(tick) {
  const year = bjtParts().y;
  const days = await fetchDays([year, year + 1]);
  if (!days) return;
  ranges = buildHolidayRanges(days);
  tick();
}

function boot() {
  initThemes();

  const requestedId = new URLSearchParams(window.location.search).get('event');
  const tick = createTick(requestedId);
  tick();

  const kick = 1000 - (Date.now() % 1000);
  window.setTimeout(() => {
    tick();
    window.setInterval(tick, 1000);
  }, kick);

  refreshHolidays(tick);
}

document.addEventListener('DOMContentLoaded', boot);

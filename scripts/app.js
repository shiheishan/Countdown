import { initThemePicker } from './theme.js';
import { renderCountdown } from './countdown.js';
import { buildNewYear, buildGoldenWeek, buildNextSunday } from '../config/events.js';
import { initDrawer, renderPanel } from './panel.js';
import { addDays } from '../utils/time.js';

const getTime = (value) => (value instanceof Date ? value.getTime() : new Date(value).getTime());

function withinWindow(now, start, end) {
  const nowMs = getTime(now);
  return nowMs >= getTime(start) && nowMs < getTime(end);
}

export function selectHomeEvent(now = new Date()) {
  const current = now instanceof Date ? now : new Date(now);

  const newYear = buildNewYear(current);
  const newYearWindowStart = addDays(newYear.start, -1);
  if (withinWindow(current, newYearWindowStart, newYear.end)) {
    return newYear;
  }

  const golden = buildGoldenWeek(current);
  const goldenWindowStart = addDays(golden.start, -1);
  const goldenWindowEnd = addDays(golden.end, 1);
  if (withinWindow(current, goldenWindowStart, goldenWindowEnd)) {
    return golden;
  }

  return buildNextSunday(current);
}

function createTick() {
  return () => {
    const now = new Date();
    const homeEvent = selectHomeEvent(now);
    renderCountdown(homeEvent, now);
    renderPanel(now);
  };
}

function boot() {
  initThemePicker();
  initDrawer();

  const tick = createTick();
  tick();

  const kick = 1000 - (Date.now() % 1000);
  window.setTimeout(() => {
    tick();
    window.setInterval(tick, 1000);
  }, kick);
}

document.addEventListener('DOMContentLoaded', boot);

import { initThemePicker } from './theme.js';
import { renderCountdown } from './countdown.js';
import { buildGoldenWeek } from '../config/events.js';
import { initDrawer, renderSidebar, updateClock } from './sidebar.js';

function createTick() {
  return () => {
    const now = new Date();
    updateClock(now);
    const event = buildGoldenWeek(now);
    renderCountdown(event, now);
    renderSidebar(now);
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

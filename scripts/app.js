import { initThemePicker } from './theme.js';
import { renderCountdown } from './countdown.js';
import { buildGoldenWeek } from '../config/events.js';
import { initDrawer, renderNewYearCard, renderSunday } from './sidebar.js';
import { elements } from './dom.js';

const formatClock = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

function updateClock(now) {
  const { clock } = elements;
  if (!clock || !clock.now) return;
  clock.now.textContent = formatClock(now);
}

function createTick() {
  return () => {
    const now = new Date();
    updateClock(now);
    const event = buildGoldenWeek(now);
    renderCountdown(event, now);
    renderNewYearCard(now);
    renderSunday(now);
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

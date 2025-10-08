import { initThemePicker } from './theme.js';
import { startCountdown } from './countdown.js';
import { getActiveEvent, buildNewYear } from '../config/events.js';
import { elements } from './dom.js';
import { initDrawer, startPanel } from './panel.js';

function boot() {
  const now = new Date();
  const event = getActiveEvent(window.location.search, now) ?? buildNewYear(now);
  if (event) {
    document.title = event.name;
    if (elements.pageTitle) {
      elements.pageTitle.textContent = event.name;
    }
  }

  initThemePicker();
  startCountdown(event);
  initDrawer();
  startPanel();
}

document.addEventListener('DOMContentLoaded', boot);

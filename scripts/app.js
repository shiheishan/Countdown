import { initThemePicker } from './theme.js';
import { startCountdown } from './countdown.js';
import { getActiveEvent } from '../config/events.js';
import { elements } from './dom.js';

function boot() {
  const event = getActiveEvent();
  if (event) {
    document.title = event.name;
    if (elements.pageTitle) {
      elements.pageTitle.textContent = event.name;
    }
  }

  initThemePicker();
  startCountdown(event);
}

document.addEventListener('DOMContentLoaded', boot);

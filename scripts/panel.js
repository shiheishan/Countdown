import { elements } from './dom.js';
import { breakdownDuration, formatShanghai, rangeStatus } from '../utils/time.js';
import { buildGoldenWeek, buildNextSunday, PANEL_COPY } from '../config/events.js';

const pad = (value) => String(Math.max(0, value)).padStart(2, '0');

const toLabel = (date) => formatShanghai(date).slice(0, 16);

const formatCountdown = (duration) => {
  const safe = Math.max(0, duration);
  const { d, h, m, s } = breakdownDuration(safe);
  return `${d} 天 ${pad(h)}:${pad(m)}:${pad(s)}`;
};

const setText = (element, text) => {
  if (!element) return;
  element.textContent = text;
};

const getPanelMessage = (event, state) => {
  const copy = PANEL_COPY[event.id];
  const builder = copy && copy[state];
  if (typeof builder === 'function') {
    return builder(event);
  }

  if (state === 'after') {
    return `${event.title ?? ''}已结束`;
  }
  if (state === 'during') {
    return `${event.title ?? ''}进行中`;
  }
  return `距离${event.title ?? ''}还有`;
};

const getPanelDesc = (event, state) => {
  if (state === 'before') {
    return `开始：${toLabel(event.start)}`;
  }
  return `结束：${toLabel(event.end)}`;
};

const describeEvent = (event, now) => {
  const status = rangeStatus(now, event);
  const state = status.state;

  let diff = 0;
  if (state === 'before') {
    diff = event.start.getTime() - now.getTime();
  } else if (state === 'during') {
    diff = event.end.getTime() - now.getTime();
  } else {
    diff = now.getTime() - event.end.getTime();
  }

  const message = getPanelMessage(event, state);
  const value = `${message} ${formatCountdown(diff)}`;
  const desc = getPanelDesc(event, state);

  return { value, desc };
};

export function initDrawer() {
  const { drawer } = elements;
  if (!drawer || !drawer.button) return;

  const { button, root, backdrop } = drawer;
  let hideTimer = null;

  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'drawer');

  const openDrawer = () => {
    if (!root) return;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (root.hidden) root.hidden = false;
    if (backdrop && backdrop.hidden) backdrop.hidden = false;
    requestAnimationFrame(() => {
      root.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
    });
    button.setAttribute('aria-expanded', 'true');
  };

  const closeDrawer = () => {
    if (!root) return;
    root.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    hideTimer = window.setTimeout(() => {
      if (root && !root.classList.contains('open')) {
        root.hidden = true;
      }
      if (backdrop && !backdrop.classList.contains('open')) {
        backdrop.hidden = true;
      }
      hideTimer = null;
    }, 280);
  };

  const toggleDrawer = () => {
    if (!root) return;
    if (root.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  button.addEventListener('click', toggleDrawer);

  if (backdrop) {
    backdrop.addEventListener('click', closeDrawer);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root && root.classList.contains('open')) {
      event.preventDefault();
      closeDrawer();
      button.focus();
    }
  });
}

export function renderPanel(now) {
  const { panel } = elements;
  if (!panel) return;

  const sundayEvent = buildNextSunday(now);
  const sunday = describeEvent(sundayEvent, now);
  setText(panel.sunValue, sunday.value);
  setText(panel.sunDesc, sunday.desc);

  const goldenEvent = buildGoldenWeek(now);
  const golden = describeEvent(goldenEvent, now);
  setText(panel.octValue, golden.value);
  setText(panel.octDesc, golden.desc);
}

import { elements } from './dom.js';
import {
  breakdownDuration,
  formatShanghai,
  nextSundayRange,
  rangeStatus,
} from '../utils/time.js';
import { buildOct } from '../config/events.js';

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

function renderSunday(now) {
  const { panel } = elements;
  if (!panel) return;

  const { start, end } = nextSundayRange(now);
  const { status } = rangeStatus(now, start, end);

  if (status === 'during') {
    const diff = end.getTime() - now.getTime();
    setText(panel.sunValue, `放假中，距离结束还有 ${formatCountdown(diff)}`);
    setText(panel.sunDesc, `结束：${toLabel(end)}`);
    return;
  }

  if (status === 'after') {
    const diff = now.getTime() - end.getTime();
    setText(panel.sunValue, `已经过去 ${formatCountdown(diff)}`);
    setText(panel.sunDesc, `结束：${toLabel(end)}`);
    return;
  }

  const diff = start.getTime() - now.getTime();
  setText(panel.sunValue, `还有 ${formatCountdown(diff)}`);
  setText(panel.sunDesc, `下次周日：${toLabel(start)}`);
}

function renderOct(now) {
  const { panel } = elements;
  if (!panel) return;

  const event = buildOct(now);
  const start = new Date(event.start);
  const end = new Date(event.end);
  const { status } = rangeStatus(now, start, end);

  if (status === 'during') {
    const diff = end.getTime() - now.getTime();
    setText(panel.octValue, `放假中，距离结束还有 ${formatCountdown(diff)}`);
    setText(panel.octDesc, `结束：${toLabel(end)}`);
    return;
  }

  if (status === 'after') {
    const diff = now.getTime() - end.getTime();
    setText(panel.octValue, `已经过去 ${formatCountdown(diff)}`);
    setText(panel.octDesc, `结束：${toLabel(end)}`);
    return;
  }

  const diff = start.getTime() - now.getTime();
  setText(panel.octValue, `还有 ${formatCountdown(diff)}`);
  setText(panel.octDesc, `开始：${toLabel(start)}`);
}

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

export function startPanel() {
  const render = () => {
    const now = new Date();
    renderSunday(now);
    renderOct(now);
  };

  render();
  const kick = 1000 - (Date.now() % 1000);
  window.setTimeout(() => {
    render();
    window.setInterval(render, 1000);
  }, kick);
}

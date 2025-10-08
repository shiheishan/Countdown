import { elements } from './dom.js';
import { formatDuration, formatShanghai, nextSundayRange, rangeStatus } from '../utils/time.js';
import { buildNewYear } from '../config/events.js';

const NY_MESSAGES = {
  before: '距离元旦还有',
  during: '今天是元旦，距离结束还有',
  after: '距离元旦结束已经过去',
};

const setText = (element, text) => {
  if (!element) return;
  element.textContent = text;
};

const toLabel = (date) => formatShanghai(date).slice(0, 16);

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

export function renderNewYearCard(now) {
  const { panel } = elements;
  if (!panel) return;

  const event = buildNewYear(now);
  const status = rangeStatus(now, event);
  const current = now instanceof Date ? now : new Date(now);
  const nowMs = current.getTime();
  const targetMs = status.target.getTime();
  const diffMs = status.state === 'after' ? Math.max(0, nowMs - targetMs) : Math.max(0, targetMs - nowMs);
  const message = NY_MESSAGES[status.state] ?? NY_MESSAGES.before;

  setText(panel.nyValue, `${message} ${formatDuration(diffMs)}`);

  const descPrefix = status.state === 'before' ? '开始' : '结束';
  const descDate = status.state === 'before' ? event.start : event.end;
  setText(panel.nyDesc, `${descPrefix}：${toLabel(descDate)}`);
}

export function renderSunday(now) {
  const { panel } = elements;
  if (!panel) return;

  const current = now instanceof Date ? now : new Date(now);
  const range = nextSundayRange(current);

  if (range.state === 'during') {
    const remainMs = Math.max(0, range.end.getTime() - current.getTime());
    setText(panel.sunValue, `放假中（周日），距离结束还有 ${formatDuration(remainMs)}`);
    setText(panel.sunDesc, `结束：${toLabel(range.end)}`);
    return;
  }

  const untilStart = Math.max(0, range.start.getTime() - current.getTime());
  setText(panel.sunValue, `距离下次周日还有 ${formatDuration(untilStart)}`);
  setText(panel.sunDesc, `开始：${toLabel(range.start)}`);
}

export function renderSidebar(now) {
  renderNewYearCard(now);
  renderSunday(now);
}

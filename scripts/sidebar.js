import { elements } from './dom.js';
import {
  formatDuration,
  formatBJT,
  rangeStatus,
  newYearRangeBJT,
  nextSundayRangeBJT,
} from '../utils/time.js';

const NY_MESSAGES = {
  before: '距离元旦还有',
  during: '今天是元旦，距离结束还有',
  after: '距离元旦结束已经过去',
};

const setText = (element, text) => {
  if (!element) return;
  element.textContent = text;
};

const formatLabel = (date) => formatBJT(date);

export function updateClock(now = new Date()) {
  const { panel } = elements;
  if (!panel || !panel.nowClock) return;
  setText(panel.nowClock, `当前：${formatLabel(now)}`);
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

export function renderSidebar(now) {
  const { panel } = elements;
  if (!panel) return;

  const current = now instanceof Date ? now : new Date(now);
  const nowMs = current.getTime();

  const nyRange = newYearRangeBJT(current);
  const nyStatus = rangeStatus(current, nyRange);
  let nyDiff = 0;
  if (nyStatus.state === 'before') {
    nyDiff = Math.max(0, nyRange.start.getTime() - nowMs);
  } else if (nyStatus.state === 'during') {
    nyDiff = Math.max(0, nyRange.end.getTime() - nowMs);
  } else {
    nyDiff = Math.max(0, nowMs - nyRange.end.getTime());
  }
  const nyMessage = NY_MESSAGES[nyStatus.state] ?? NY_MESSAGES.before;

  setText(panel.nyValue, `${nyMessage} ${formatDuration(nyDiff)}`);

  const nyDescPrefix = nyStatus.state === 'before' ? '开始' : '结束';
  const nyDescDate = nyStatus.state === 'before' ? nyRange.start : nyRange.end;
  setText(panel.nyDesc, `${nyDescPrefix}：${formatLabel(nyDescDate)}`);

  if (panel.sunValue && panel.sunDesc) {
    const sundayRange = nextSundayRangeBJT(current);
    if (sundayRange.state === 'during') {
      const diff = Math.max(0, sundayRange.end.getTime() - nowMs);
      setText(panel.sunValue, `放假中（周日），距离结束还有 ${formatDuration(diff)}`);
      setText(panel.sunDesc, `结束：${formatLabel(sundayRange.end)}`);
    } else {
      const diff = Math.max(0, sundayRange.target.getTime() - nowMs);
      setText(panel.sunValue, `距离下次周日还有 ${formatDuration(diff)}`);
      setText(panel.sunDesc, `开始：${formatLabel(sundayRange.start)}`);
    }
  }
}

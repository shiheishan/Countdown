import { elements } from './dom.js';
import { breakdownDuration, humanizeDuration, formatShanghai, rangeStatus } from '../utils/time.js';
import { HEADLINE_COPY } from '../config/events.js';

const RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RADIUS;
const RING_ANIMATION_DURATION = 420;
const RING_ANIMATION_EPSILON = 1e-4;

const STATE_BADGE_LABELS = {
  before: '等待',
  during: '进行中',
  after: '已结束',
};

let ringAnimationFrame = null;
let ringCurrentRatio = 0;
let ringInitialized = false;

let activeEventKey = null;
let activeStart = null;
let activeEnd = null;
let activeTitle = '';
let totalDuration = 0;
let totalText = '';

const previousDigits = {
  days: '',
  hours: '',
  minutes: '',
  seconds: '',
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const toDate = (value) => (value instanceof Date ? value : new Date(value));

function resetDigitsState() {
  Object.keys(previousDigits).forEach((key) => {
    previousDigits[key] = '';
  });
}

function ensureDigitSlots(container, count) {
  if (!container) return;
  if (container.children.length === count) return;
  container.innerHTML = '';
  for (let index = 0; index < count; index += 1) {
    const span = document.createElement('span');
    span.className = 'digit';
    span.textContent = '-';
    container.appendChild(span);
  }
}

function setDigits(container, key, value, width = 2) {
  if (!container) return;
  const target = String(Math.max(0, value)).padStart(width, '0');
  ensureDigitSlots(container, target.length);

  for (let index = 0; index < target.length; index += 1) {
    const char = target[index];
    const digit = container.children[index];
    if (previousDigits[key].charAt(index) !== char) {
      digit.classList.remove('is-ticking');
      void digit.offsetWidth;
      digit.textContent = char;
      digit.classList.add('is-ticking');
    } else if (!digit.textContent) {
      digit.textContent = char;
    }
  }

  previousDigits[key] = target;
}

function updateRingGeometry(ringArc) {
  if (ringArc) {
    ringArc.setAttribute('stroke-dasharray', RING_LENGTH.toFixed(2));
  }
}

function resetRingProgress() {
  if (ringAnimationFrame) {
    cancelAnimationFrame(ringAnimationFrame);
    ringAnimationFrame = null;
  }
  ringCurrentRatio = 0;
  ringInitialized = false;
}

function applyRingFrame({ arc, head, pct }, ratio) {
  const safeRatio = clamp01(Number.isFinite(ratio) ? ratio : 0);

  if (arc) {
    const offset = RING_LENGTH * (1 - safeRatio);
    arc.style.strokeDashoffset = offset.toFixed(3);
  }

  if (pct) {
    const percentValue = Math.round(safeRatio * 100);
    pct.textContent = `${percentValue}%`;
  }

  if (!head) return;

  const theta = -Math.PI / 2 + safeRatio * 2 * Math.PI;
  if (safeRatio > 0) {
    const cx = 60 + Math.cos(theta) * RADIUS;
    const cy = 60 + Math.sin(theta) * RADIUS;
    head.setAttribute('cx', cx.toFixed(2));
    head.setAttribute('cy', cy.toFixed(2));
    head.setAttribute('opacity', safeRatio >= 1 ? '0.65' : '1');
    head.setAttribute('r', safeRatio >= 1 ? '4.6' : '3.8');
  } else {
    head.setAttribute('cx', '60');
    head.setAttribute('cy', '8');
    head.setAttribute('r', '3.8');
    head.setAttribute('opacity', '0');
  }
}

function setRingProgress(ringElements, ratio, statusText) {
  if (!ringElements) return;
  const { arc, head, pct, state } = ringElements;

  if (state) {
    state.textContent = statusText;
  }

  if (!arc) return;

  const targetRatio = clamp01(Number.isFinite(ratio) ? ratio : 0);

  if (!ringInitialized) {
    applyRingFrame({ arc, head, pct }, targetRatio);
    ringCurrentRatio = targetRatio;
    ringInitialized = true;
    return;
  }

  if (Math.abs(targetRatio - ringCurrentRatio) <= RING_ANIMATION_EPSILON) {
    applyRingFrame({ arc, head, pct }, targetRatio);
    ringCurrentRatio = targetRatio;
    return;
  }

  if (ringAnimationFrame) {
    cancelAnimationFrame(ringAnimationFrame);
    ringAnimationFrame = null;
  }

  const startRatio = ringCurrentRatio;
  const delta = targetRatio - startRatio;
  const startTime = performance.now();

  const step = (timestamp) => {
    const elapsed = Math.min(1, (timestamp - startTime) / RING_ANIMATION_DURATION);
    const eased = startRatio + delta * (1 - Math.pow(1 - elapsed, 3));
    applyRingFrame({ arc, head, pct }, eased);

    if (elapsed < 1) {
      ringAnimationFrame = requestAnimationFrame(step);
    } else {
      ringAnimationFrame = null;
      ringCurrentRatio = targetRatio;
      applyRingFrame({ arc, head, pct }, targetRatio);
    }
  };

  ringAnimationFrame = requestAnimationFrame(step);
}

function getHeadline(event, state) {
  const copy = HEADLINE_COPY[event.id];
  const builder = copy && copy[state];
  if (typeof builder === 'function') {
    return builder(event);
  }

  if (state === 'after') {
    return `${event.title ?? ''}已结束…`;
  }
  if (state === 'during') {
    return `${event.title ?? ''}进行中…`;
  }
  return `距离${event.title ?? ''}还有…`;
}

function ensureEvent(event) {
  if (!event) return false;

  const start = toDate(event.start);
  const end = toDate(event.end);
  const key = `${event.id ?? 'event'}-${start.getTime()}-${end.getTime()}`;

  if (activeEventKey === key) {
    return true;
  }

  activeEventKey = key;
  activeStart = start;
  activeEnd = end;
  activeTitle = event.title ?? event.name ?? '';
  totalDuration = Math.max(0, activeEnd.getTime() - activeStart.getTime());
  totalText = humanizeDuration(totalDuration);

  const { digits, meta, labels, ring } = elements;
  updateRingGeometry(ring.arc);
  resetRingProgress();
  resetDigitsState();

  ['days', 'hours', 'minutes', 'seconds'].forEach((keyName) => {
    ensureDigitSlots(digits[keyName], 2);
  });

  if (labels.start) {
    labels.start.textContent = formatShanghai(activeStart);
  }
  if (labels.end) {
    labels.end.textContent = formatShanghai(activeEnd);
  }
  if (meta.total) {
    meta.total.textContent = totalText;
  }

  return true;
}

export function renderCountdown(event, now = new Date()) {
  if (!ensureEvent(event)) return;

  const current = now instanceof Date ? now : new Date(now);
  const nowMs = current.getTime();
  const { digits, meta, statusBadge, ring, pageTitle } = elements;

  const status = rangeStatus(current, { start: activeStart, end: activeEnd });
  const state = status.state;

  let diffMs = 0;
  if (state === 'before') {
    diffMs = activeStart.getTime() - nowMs;
  } else if (state === 'during') {
    diffMs = activeEnd.getTime() - nowMs;
  } else {
    diffMs = nowMs - activeEnd.getTime();
  }

  const remainingParts = breakdownDuration(diffMs);
  setDigits(digits.days, 'days', remainingParts.d, 2);
  setDigits(digits.hours, 'hours', remainingParts.h, 2);
  setDigits(digits.minutes, 'minutes', remainingParts.m, 2);
  setDigits(digits.seconds, 'seconds', remainingParts.s, 2);

  const elapsed = nowMs - activeStart.getTime();
  const remain = activeEnd.getTime() - nowMs;
  const ratio = totalDuration > 0 ? (nowMs - activeStart.getTime()) / totalDuration : 0;
  const safeRatio = clamp01(ratio);

  if (meta.fill) {
    meta.fill.style.transform = `scaleX(${safeRatio})`;
  }
  if (meta.pct) {
    meta.pct.textContent = `${(Math.round(safeRatio * 1000) / 10).toFixed(1)}%`;
  }
  if (meta.elapsed) {
    meta.elapsed.textContent = elapsed < 0 ? '未开始' : humanizeDuration(elapsed);
  }
  if (meta.remain) {
    meta.remain.textContent = remain < 0 ? '已结束' : humanizeDuration(remain);
  }
  if (meta.total) {
    meta.total.textContent = totalText;
  }

  const statusText = STATE_BADGE_LABELS[state] ?? STATE_BADGE_LABELS.before;
  if (statusBadge) {
    statusBadge.textContent = statusText;
  }
  setRingProgress(ring, ratio, statusText);

  const headline = getHeadline(event, state);
  if (pageTitle) {
    pageTitle.textContent = headline;
  }

  if (activeTitle) {
    document.title = `${activeTitle} · ${statusText}`;
  }
}

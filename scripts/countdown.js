import { elements } from './dom.js';
import { breakdownDuration, humanizeDuration, formatShanghai } from '../utils/time.js';

const RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RADIUS;

const previousDigits = {
  days: '',
  hours: '',
  minutes: '',
  seconds: '',
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

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
      void digit.offsetWidth; // restart animation
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

function setRingProgress({ arc, head, pct, state }, ratio, statusText) {
  if (!arc || !head || !pct || !state) return;

  const offset = RING_LENGTH * (1 - ratio);
  arc.style.strokeDashoffset = String(offset);
  pct.textContent = `${Math.round(ratio * 100)}%`;
  state.textContent = statusText;

  const theta = -Math.PI / 2 + ratio * 2 * Math.PI;
  if (ratio > 0) {
    const cx = 60 + Math.cos(theta) * RADIUS;
    const cy = 60 + Math.sin(theta) * RADIUS;
    head.setAttribute('cx', cx.toFixed(2));
    head.setAttribute('cy', cy.toFixed(2));
    head.setAttribute('opacity', ratio >= 1 ? '0.65' : '1');
    head.setAttribute('r', ratio >= 1 ? '4.6' : '3.8');
  } else {
    head.setAttribute('cx', '60');
    head.setAttribute('cy', '8');
    head.setAttribute('r', '3.8');
    head.setAttribute('opacity', '0');
  }
}

function deriveStatus(labels, elapsed, remain) {
  if (elapsed < 0) return labels.before;
  if (remain < 0) return labels.after;
  return labels.during;
}

export function startCountdown(event) {
  if (!event) return;

  const start = new Date(event.start);
  const end = new Date(event.end);
  const total = end.getTime() - start.getTime();
  const totalText = humanizeDuration(total);
  const statusLabels = {
    before: '等待',
    during: '进行中',
    after: '已结束',
    ...event.statusLabels,
  };

  const { digits, meta, labels, statusBadge, ring } = elements;
  updateRingGeometry(ring.arc);

  ['days', 'hours', 'minutes', 'seconds'].forEach((key) => {
    ensureDigitSlots(digits[key], 2);
  });

  if (labels.start && !labels.start.textContent) {
    labels.start.textContent = formatShanghai(start);
  }
  if (labels.end && !labels.end.textContent) {
    labels.end.textContent = formatShanghai(end);
  }

  const render = () => {
    const now = Date.now();
    const elapsed = now - start.getTime();
    const remain = end.getTime() - now;

    const remainingParts = breakdownDuration(remain);
    setDigits(digits.days, 'days', remainingParts.d, 2);
    setDigits(digits.hours, 'hours', remainingParts.h, 2);
    setDigits(digits.minutes, 'minutes', remainingParts.m, 2);
    setDigits(digits.seconds, 'seconds', remainingParts.s, 2);

    const ratio = clamp01(elapsed / total);
    if (meta.fill) {
      meta.fill.style.transform = `scaleX(${ratio})`;
    }
    if (meta.pct) {
      meta.pct.textContent = `${(Math.round(ratio * 1000) / 10).toFixed(1)}%`;
    }

    const statusText = deriveStatus(statusLabels, elapsed, remain);
    if (statusBadge) statusBadge.textContent = statusText;

    if (meta.elapsed) meta.elapsed.textContent = elapsed < 0 ? '未开始' : humanizeDuration(elapsed);
    if (meta.remain) meta.remain.textContent = remain < 0 ? '已结束' : humanizeDuration(remain);
    if (meta.total) meta.total.textContent = totalText;

    setRingProgress(ring, ratio, statusText);
  };

  render();
  const kick = 1000 - (Date.now() % 1000);
  window.setTimeout(() => {
    render();
    window.setInterval(render, 1000);
  }, kick);
}

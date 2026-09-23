import { elements, setText } from './dom.js';
import {
  DAY,
  bjtStartOfDayUTC,
  breakdownDuration,
  formatCnDateWeekday,
  pad2,
  rangeStatus,
} from '../utils/time.js';

const HEADLINE_PARTS = {
  before: { pre: '距离', post: '还有' },
  during: { pre: '', post: '假期中，还剩' },
  after: { pre: '', post: '已结束' },
};

const DOCUMENT_TITLES = {
  before: (title) => `距离${title}还有`,
  during: (title) => `${title}假期中`,
  after: (title) => `${title}已结束`,
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const shownDigits = new WeakMap();

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const toDate = (value) => (value instanceof Date ? value : new Date(value));

function digitSlot(char) {
  const slot = document.createElement('span');
  slot.className = 'digit';
  const inner = document.createElement('span');
  inner.textContent = char;
  slot.appendChild(inner);
  return slot;
}

// 逐字符渲染；长度不变时只给变化的字符播放翻动动画
function renderDigits(container, text) {
  if (!container) return;
  const previous = shownDigits.get(container) ?? '';
  if (previous === text) return;
  shownDigits.set(container, text);

  if (previous.length !== text.length || reducedMotion.matches) {
    container.replaceChildren(...[...text].map(digitSlot));
    return;
  }

  [...text].forEach((char, index) => {
    const oldChar = previous[index];
    if (char === oldChar) return;

    const incoming = document.createElement('span');
    incoming.className = 'digit-in';
    incoming.textContent = char;

    const outgoing = document.createElement('span');
    outgoing.className = 'digit-out';
    outgoing.setAttribute('aria-hidden', 'true');
    outgoing.textContent = oldChar;
    outgoing.addEventListener('animationend', () => outgoing.remove(), { once: true });

    container.children[index].replaceChildren(incoming, outgoing);
  });
}

function isSameDay(a, b) {
  return bjtStartOfDayUTC(a).getTime() === bjtStartOfDayUTC(b).getTime();
}

export function renderCountdown(event, now = new Date()) {
  if (!event) return;

  const current = toDate(now);
  const nowMs = current.getTime();
  const start = toDate(event.start);
  const end = toDate(event.end);
  const leadStart = toDate(event.leadStart ?? event.start);
  const title = event.title ?? '';
  const { headline, clock, range, progress, vprogress } = elements;

  const { state, target } = rangeStatus(current, { start, end });
  const diffMs = state === 'after' ? nowMs - end.getTime() : target.getTime() - nowMs;
  const parts = breakdownDuration(diffMs);

  const headlineParts = HEADLINE_PARTS[state];
  setText(headline.pre, headlineParts.pre);
  setText(headline.name, title);
  setText(headline.post, headlineParts.post);
  const documentTitle = DOCUMENT_TITLES[state](title);
  if (document.title !== documentTitle) document.title = documentTitle;

  // 天数位数决定手机版布局：个位数出血放大，多位数按位数缩放
  const daysText = String(parts.d);
  if (clock.root && clock.root.dataset.digits !== String(daysText.length)) {
    clock.root.dataset.digits = String(daysText.length);
  }
  renderDigits(clock.days, daysText);
  renderDigits(clock.hms, `${pad2(parts.h)}:${pad2(parts.m)}:${pad2(parts.s)}`);

  // 放假天数：结束时间是最后一天 23:59:59，补 1 秒凑整
  const totalDays = Math.round((end.getTime() + 1000 - start.getTime()) / DAY);
  // 连接符「至 / —」和「·」由 CSS 按桌面 / 手机分别补上
  setText(range.from, formatCnDateWeekday(start));
  setText(range.to, isSameDay(start, end) ? '' : formatCnDateWeekday(end));
  setText(range.total, `共 ${totalDays} 天`);

  // 未开始：从上一个假期结束到本假期开始的等待进度；进行中：假期本身的进度
  const waitTotalMs = start.getTime() - leadStart.getTime();
  const holidayTotalMs = end.getTime() - start.getTime();
  let ratio = 1;
  let progressText = '已结束';
  if (state === 'before') {
    ratio = waitTotalMs > 0 ? clamp01((nowMs - leadStart.getTime()) / waitTotalMs) : 0;
    const waitedDays = breakdownDuration(nowMs - leadStart.getTime()).d;
    progressText = `${event.leadAfter ? `${event.leadAfter}后` : ''}已过 ${waitedDays} 天`;
  } else if (state === 'during') {
    ratio = holidayTotalMs > 0 ? clamp01((nowMs - start.getTime()) / holidayTotalMs) : 0;
    const dayIndex = Math.floor((nowMs - start.getTime()) / DAY) + 1;
    progressText = `第 ${dayIndex} 天，共 ${totalDays} 天`;
  }

  const percent = Math.round(ratio * 100);
  const ratioText = ratio.toFixed(4);
  if (progress.fill) progress.fill.style.transform = `scaleX(${ratioText})`;
  if (vprogress.fill) vprogress.fill.style.transform = `scaleY(${ratioText})`;
  if (vprogress.dot) vprogress.dot.style.top = `${(ratio * 100).toFixed(2)}%`;
  [progress.track, vprogress.root].forEach((bar) => bar?.setAttribute('aria-valuenow', String(percent)));
  setText(progress.text, progressText);
  setText(vprogress.text, progressText);
  setText(progress.pct, `${percent}%`);
  setText(vprogress.pct, `${percent}%`);
}

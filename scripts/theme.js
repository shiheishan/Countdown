import { THEMES, DEFAULT_THEME_ID } from '../config/themes.js';
import { STORAGE_KEYS } from '../config/app.js';
import { elements } from './dom.js';

let fadeTimer = null;
let cleanupFrame = null;
let currentThemeId = null;

const setVar = (name, value) => {
  document.documentElement.style.setProperty(name, value);
};

const clearVar = (name) => {
  document.documentElement.style.removeProperty(name);
};

const parseDuration = (value) => {
  const trimmed = value.trim();
  if (trimmed.endsWith('ms')) return parseFloat(trimmed);
  if (trimmed.endsWith('s')) return parseFloat(trimmed) * 1000;
  return 700;
};

function markSelected(themeId) {
  elements.theme.list.querySelectorAll('.item').forEach((item) => {
    item.classList.toggle('selected', item.dataset.id === themeId);
  });
}

const queueNextVarCleanup = () => {
  if (cleanupFrame !== null) {
    window.cancelAnimationFrame(cleanupFrame);
  }

  cleanupFrame = window.requestAnimationFrame(() => {
    clearVar('--c1_next');
    clearVar('--c2_next');
    clearVar('--c3_next');
    clearVar('--acc1_next');
    clearVar('--acc2_next');
    cleanupFrame = null;
  });
};

function commitThemeVariables(theme) {
  const [c1, c2, c3] = theme.bg;
  const [acc1, acc2] = theme.acc;

  setVar('--c1', c1);
  setVar('--c2', c2);
  setVar('--c3', c3);
  setVar('--acc1', acc1);
  setVar('--acc2', acc2);
  queueNextVarCleanup();
  document.body.classList.remove('bg-fading');
}

function applyTheme(themeId) {
  const theme = THEMES.find((item) => item.id === themeId) ?? THEMES[0];
  const [c1, c2, c3] = theme.bg;
  const [acc1, acc2] = theme.acc;
  const accent = theme.accent ?? acc2;

  if (cleanupFrame !== null) {
    window.cancelAnimationFrame(cleanupFrame);
    cleanupFrame = null;
  }

  setVar('--c1_next', c1);
  setVar('--c2_next', c2);
  setVar('--c3_next', c3);
  setVar('--acc1_next', acc1);
  setVar('--acc2_next', acc2);

  const body = document.body;
  body.classList.remove('bg-fading');
  void body.offsetWidth; // force reflow to restart animation
  body.classList.add('bg-fading');

  setVar('--accent', accent);

  const duration = parseDuration(getComputedStyle(document.documentElement).getPropertyValue('--dur-bg'));
  window.clearTimeout(fadeTimer);
  fadeTimer = window.setTimeout(() => commitThemeVariables(theme), duration);

  currentThemeId = theme.id;
  localStorage.setItem(STORAGE_KEYS.theme, currentThemeId);
  document.documentElement.dataset.theme = currentThemeId;
  markSelected(currentThemeId);
}

function renderThemes(initialThemeId) {
  const { list } = elements.theme;
  list.innerHTML = '';

  THEMES.forEach((theme) => {
    const item = document.createElement('div');
    item.className = 'item';
    item.dataset.id = theme.id;
    item.setAttribute('role', 'option');
    item.style.setProperty('--dot', theme.acc[1]);

    const dot = document.createElement('div');
    dot.className = 'dot';

    const preview = document.createElement('div');
    preview.className = 'preview';
    preview.style.setProperty('--sw', `linear-gradient(90deg, ${theme.bg[0]}, ${theme.bg[1]}, ${theme.bg[2]})`);

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = theme.name;

    preview.appendChild(name);
    item.append(dot, preview);
    item.addEventListener('click', () => {
      applyTheme(theme.id);
      elements.theme.popover.classList.remove('open');
      elements.theme.button.setAttribute('aria-expanded', 'false');
    });

    list.appendChild(item);
  });

  applyTheme(initialThemeId);
}

function positionPopover() {
  const { button, popover } = elements.theme;
  const rect = button.getBoundingClientRect();
  const offsetWidth = popover.offsetWidth || 240;
  const x = Math.max(8, rect.right - offsetWidth);
  const y = rect.bottom + 10;
  popover.style.left = `${x}px`;
  popover.style.top = `${y}px`;
}

function bindPopover() {
  const { button, popover } = elements.theme;

  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-controls', popover.id);

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = !popover.classList.contains('open');
    if (willOpen) {
      positionPopover();
      requestAnimationFrame(() => {
        popover.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
      });
    } else {
      popover.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  window.addEventListener('resize', () => {
    if (popover.classList.contains('open')) {
      positionPopover();
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!popover.contains(event.target) && !button.contains(event.target)) {
      popover.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });
}

export function initThemePicker() {
  const { button, popover, list } = elements.theme;
  if (!button || !popover || !list) return;

  const saved = localStorage.getItem(STORAGE_KEYS.theme) || DEFAULT_THEME_ID;
  renderThemes(saved);
  bindPopover();
}

export function getCurrentThemeId() {
  return currentThemeId ?? DEFAULT_THEME_ID;
}

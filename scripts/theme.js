import { THEMES, DEFAULT_THEME_ID } from '../config/themes.js';
import { STORAGE_KEYS } from '../config/app.js';
import { elements } from './dom.js';

const layers = new Map();
const dots = new Map();

function buildLayer(theme) {
  const [b0, b1] = theme.bg;
  const [a1, a2] = theme.acc;
  const layer = document.createElement('div');
  layer.className = 'bg-layer';
  layer.style.setProperty('--b0', b0);
  layer.style.setProperty('--b1', b1);
  layer.style.setProperty('--blob-b', `${a1}77`);
  layer.style.setProperty('--blob-c', `${a2}26`);
  ['blob blob-a', 'blob blob-b', 'blob blob-c', 'grain'].forEach((className) => {
    const child = document.createElement('div');
    child.className = className;
    layer.appendChild(child);
  });
  return layer;
}

function buildDot(theme) {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'theme-dot';
  dot.title = theme.name;
  dot.setAttribute('aria-label', theme.name);
  dot.style.setProperty('--dot', theme.acc[1]);
  dot.addEventListener('click', () => applyTheme(theme.id, true));
  return dot;
}

function applyTheme(themeId, persist) {
  const theme =
    THEMES.find((item) => item.id === themeId) ?? THEMES.find((item) => item.id === DEFAULT_THEME_ID) ?? THEMES[0];
  const root = document.documentElement;

  root.style.setProperty('--bg0', theme.bg[0]);
  root.style.setProperty('--accent', theme.accent ?? theme.acc[1]);
  root.dataset.theme = theme.id;

  layers.forEach((layer, id) => layer.classList.toggle('is-active', id === theme.id));
  dots.forEach((dot, id) => dot.setAttribute('aria-pressed', String(id === theme.id)));

  if (!persist) return;
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme.id);
  } catch {
    // 存储不可用时仅本次会话生效
  }
}

export function initThemes() {
  const { bg, themes } = elements;

  THEMES.forEach((theme) => {
    const layer = buildLayer(theme);
    layers.set(theme.id, layer);
    bg?.appendChild(layer);

    const dot = buildDot(theme);
    dots.set(theme.id, dot);
    themes?.appendChild(dot);
  });

  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEYS.theme);
  } catch {
    // 忽略，使用默认主题
  }
  applyTheme(saved || DEFAULT_THEME_ID, false);
}

const byId = (id) => document.getElementById(id);

export const elements = {
  bg: byId('bg'),
  themes: byId('themes'),
  headline: {
    pre: byId('hlPre'),
    name: byId('hlName'),
    post: byId('hlPost'),
  },
  clock: {
    root: byId('clock'),
    days: byId('days'),
    hms: byId('hms'),
  },
  range: {
    from: byId('rangeFrom'),
    to: byId('rangeTo'),
    total: byId('rangeTotal'),
  },
  progress: {
    track: byId('progress'),
    fill: byId('fill'),
    text: byId('progText'),
    pct: byId('progPct'),
  },
  // 手机版：竖向进度与主体内的进度文字
  vprogress: {
    root: document.querySelector('.vprogress'),
    fill: byId('vfill'),
    dot: byId('vdot'),
    pct: byId('vpct'),
    text: byId('progTextM'),
  },
  footer: {
    nextItem: byId('footNext'),
    next: byId('nextText'),
    nextWhen: byId('nextWhen'),
    sunItem: byId('footSun'),
    sunday: byId('sunText'),
    sundayWhen: byId('sunWhen'),
  },
};

// 仅在内容变化时写入，避免每秒重复触发重排
export function setText(element, text) {
  if (element && element.textContent !== text) {
    element.textContent = text;
  }
}

import { initThemes } from './theme.js';
import { renderCountdown } from './countdown.js';
import { renderFooter } from './footer.js';
import { buildHolidayRanges, leadIn, pickEvent, pickNextHoliday } from '../config/events.js';
import { fetchDays, loadCachedDays } from './holidays.js';
import { bjtParts } from '../utils/time.js';
import { Reveal, forgetShapes } from '../vendor/skullet/skullet.js';

let ranges = buildHolidayRanges(loadCachedDays());

// 首屏骨架：一道光从左往右扫过灰块，光带后面紧跟着揭开真内容——
// 哪里扫过了哪里就先出来，不等右边。揭开用 skullet 的 wipe（斜遮罩前沿），
// 前沿的位置和时机由这里按光带算好交给它。
const REVEAL_MS = 1000; // 揭开前沿扫完全部内容的时长（skullet 的揭开动画最长 1s）
const ANGLE = (20 * Math.PI) / 180; // 光带和前沿都斜 20°，与 skullet 自带扫光一致
const SLANT = Math.tan(ANGLE);
const COS = Math.cos(ANGLE);
const EDGE = 40; // 揭开前沿的柔边半宽（沿渐变方向，px）
const BAND_ALPHA = [0, 0.25, 0.75, 1, 0.75, 0.25, 0]; // 光带亮度：两头透明，中间最亮

// 斜坐标：沿 20° 斜线投影后的横向位置，同一条斜线上的点取值相同
const slanted = (x, y) => x + y * SLANT;

// skullet 自带的扫光是首尾相接、按全页时钟循环的光带，打开时常常已经扫到一半，
// 左右看着不对称。这里接管它给每根灰条加的动画，换成单独一道光带，
// 并返回跟着这道光走的揭开方式（RevealSpec）；没有扫光（减少动态效果）时返回 null。
function startSweep(hero) {
  const animations = [...hero.querySelectorAll('*')].flatMap((el) => el.shadowRoot?.getAnimations() ?? []);
  const bars = animations.map((animation) => animation.effect?.target).filter(Boolean);
  if (!bars.length) return null;
  animations.forEach((animation) => animation.cancel());

  const rects = bars.map((bar) => bar.getBoundingClientRect());
  const band = Math.min(Math.max(hero.getBoundingClientRect().width * 0.35, 160), 360);
  const edge = EDGE / COS; // 柔边换算到斜坐标
  const lag = band * 0.6 + edge; // 前沿落后光带前端的距离：光最亮处一过，内容就开始显出来
  const from = Math.min(...rects.map((rect) => slanted(rect.left, rect.top))); // 最先碰到光的点
  const to = Math.max(...rects.map((rect) => slanted(rect.right, rect.bottom))); // 最后碰到光的点
  // 前沿要在 REVEAL_MS 内走完全部内容；留两帧余量，免得 skullet 先收尾
  const speed = (to - from + 2 * edge) / (REVEAL_MS - 32);
  const delay = (lag - edge) / speed; // 前沿碰到第一块灰块的时刻
  const total = delay + REVEAL_MS;
  const startedAt = document.timeline.currentTime;
  const lead = () => from + (document.timeline.currentTime - startedAt) * speed; // 光带前端

  bars.forEach((bar, index) => {
    const rect = rects[index];
    // 光带画在比它宽 rise 的背景块里，斜着的两头不会被块边截出硬边
    const rise = rect.height * SLANT;
    const stops = BAND_ALPHA.map((alpha, i) => {
      const at = (rise + (band * i) / (BAND_ALPHA.length - 1)) * COS;
      return `color-mix(in srgb, var(--skullet-highlight) ${alpha * 100}%, transparent) ${at.toFixed(1)}px`;
    });
    const position = (x) => `${(x - band - rise - slanted(rect.left, rect.top)).toFixed(1)}px 0`;
    bar.style.backgroundImage = `linear-gradient(110deg, ${stops.join(', ')})`;
    bar.style.backgroundSize = `${(band + rise).toFixed(1)}px 100%`;
    bar.style.backgroundRepeat = 'no-repeat';
    const sweep = bar.animate(
      [{ backgroundPosition: position(from) }, { backgroundPosition: position(from + speed * total) }],
      { duration: total, fill: 'forwards' },
    );
    sweep.startTime = startedAt; // 所有灰条和揭开前沿共用同一个起点
  });

  // 前沿后面（斜坐标更小）显出内容、藏起骨架，前面相反；中间 2×EDGE 柔和过渡
  const wipeAt = (rect, behind, ahead) => {
    const at = (lead() - lag - slanted(rect.left, rect.top)) * COS;
    return `linear-gradient(110deg, ${behind} ${(at - EDGE).toFixed(1)}px, ${ahead} ${(at + EDGE).toFixed(1)}px)`;
  };
  return {
    wipe: {
      mask: (progress, { rect }) => wipeAt(rect, '#000', 'transparent'),
      out: (progress, { rect }) => wipeAt(rect, 'transparent', '#000'),
    },
    delay,
    duration: REVEAL_MS,
  };
}

function createTick(requestedId) {
  return () => {
    const now = new Date();
    const event = pickEvent(now, ranges, requestedId);
    renderCountdown({ ...event, ...leadIn(event, ranges, now) }, now);
    renderFooter(now, pickNextHoliday(now, ranges, event));
  };
}

// 首屏：用第一次渲染好的主体克隆出骨架，光带扫过的地方紧跟着揭开真内容
function revealHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const real = document.createDocumentFragment();
  real.append(...hero.childNodes);
  const sample = real.cloneNode(true);
  sample.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  sample.querySelectorAll('[aria-live]').forEach((el) => el.removeAttribute('aria-live'));

  // 骨架每次都从刚渲染的真内容克隆，已经精确；skullet 记下的旧形状会把文字换成 0，
  // 数字区宽度跟着变，揭开时会错位，所以不用它的记忆
  forgetShapes();
  const options = { reveal: 'sequence', label: '加载中' };
  const reveal = new Reveal(hero, options);
  reveal.load(sample);
  hero.removeAttribute('data-pending');
  const show = () => {
    // 骨架期间内容不在页面上，秒数刷新留下的翻动元素没法播完、也不会被移除，
    // 揭开时才开始播，和淡入叠成两个数字；揭开前把它们收成静止的最终状态
    real.querySelectorAll('.digit-out').forEach((el) => el.remove());
    real.querySelectorAll('.digit-in').forEach((el) => el.classList.remove('digit-in'));
    reveal.show(real);
  };
  // 等 skullet 画好灰条的下一帧：起一道光，同时开始揭开（内容先被遮住，前沿跟着光走）。
  // 没有扫光（如系统开了减少动态效果）就停一会儿后直接揭开
  requestAnimationFrame(() => {
    const wipe = startSweep(hero);
    if (!wipe) {
      window.setTimeout(show, REVEAL_MS);
      return;
    }
    options.reveal = wipe; // skullet 在 show() 时才读取揭开方式
    show();
  });
}

async function refreshHolidays(tick) {
  const year = bjtParts().y;
  const days = await fetchDays([year, year + 1]);
  if (!days) return;
  ranges = buildHolidayRanges(days);
  tick();
}

function boot() {
  initThemes();

  const requestedId = new URLSearchParams(window.location.search).get('event');
  const tick = createTick(requestedId);
  tick();

  try {
    revealHero();
  } catch (error) {
    console.error(error);
  } finally {
    document.querySelector('.hero')?.removeAttribute('data-pending');
  }

  const kick = 1000 - (Date.now() % 1000);
  window.setTimeout(() => {
    tick();
    window.setInterval(tick, 1000);
  }, kick);

  refreshHolidays(tick);
}

document.addEventListener('DOMContentLoaded', boot);

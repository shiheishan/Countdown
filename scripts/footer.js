import { elements, setText } from './dom.js';
import { bjtDayDiff, formatCnDate, nextSundayRangeBJT, rangeStatus } from '../utils/time.js';

function relativeDays(now, date) {
  const days = bjtDayDiff(now, date);
  return days === 0 ? '今天' : `${days} 天后`;
}

// 页脚：主倒计时之后的下一个节日 + 下个周日
// 每行分「内容」和「多久以后」两段：桌面版连成一句，手机版分列对齐
export function renderFooter(now, holiday) {
  const { footer } = elements;

  if (holiday) {
    const { state } = rangeStatus(now, holiday);
    setText(footer.next, `${holiday.title} · ${formatCnDate(holiday.start)}`);
    setText(footer.nextWhen, state === 'during' ? '假期中' : relativeDays(now, holiday.start));
  }

  const sunday = nextSundayRangeBJT(now);
  const isToday = sunday.state === 'during';
  footer.sunItem?.classList.toggle('is-today', isToday);
  setText(footer.sunday, isToday ? '今天' : formatCnDate(sunday.start));
  setText(footer.sundayWhen, isToday ? '就是今天' : relativeDays(now, sunday.start));
}

# Countdown

静态节假日倒计时页面，模块化的 HTML / CSS / JS 结构，无需构建。

页面设计来自 Claude Design：宽屏为「1b 数字为主」，640px 以下为手机版「2f 自适应」（天数为个位数时放大并伸出左边缘，多位数时按位数缩放；右侧竖向进度）。两种布局共用同一份 HTML，由 `styles/main.css` 末尾的媒体查询切换。

## 目录结构

```
.
├── config
│   ├── app.js          # 本地存储键等全局配置
│   ├── events.js       # 节假日数据源、区间解析与主页活动选择
│   └── themes.js       # 主题配色列表
├── fonts               # 本地托管的字体（可变字体 woff2）及 OFL 许可
├── index.html          # 页面结构
├── scripts
│   ├── app.js          # 应用入口：加载节假日并每秒刷新
│   ├── countdown.js    # 标题、倒计时数字、日期与进度
│   ├── dom.js          # DOM 引用集中出口
│   ├── footer.js       # 页脚：下一个节日 / 下个周日
│   ├── holidays.js     # 节假日数据拉取与缓存
│   └── theme.js        # 主题色点与流动背景
├── styles
│   └── main.css        # 页面样式
└── utils
    └── time.js         # 北京时间工具函数
```

## 节假日数据

- **来源**：[NateScarlet/holiday-cn](https://github.com/NateScarlet/holiday-cn)，自动解析国务院放假通知，经 jsDelivr 获取当年和次年的 JSON。无需每年手动改日期；次年数据在官方发布（通常 11 月）后自动生效。
- **回退顺序**：网络获取 → 本地缓存（`localStorage`）→ `config/events.js` 中的 `FALLBACK_DAYS` 内置数据 → 按规则计算的元旦。
- **主页显示**：默认显示正在进行或下一个节假日。可用查询参数 `?event=<id>` 固定某个节日：

  | id | 节日 |
  | --- | --- |
  | `new-year` | 元旦 |
  | `spring-festival` | 春节 |
  | `qingming` | 清明节 |
  | `labor-day` | 劳动节 |
  | `dragon-boat` | 端午节 |
  | `mid-autumn` | 中秋节 |
  | `national-day` | 国庆节（含与中秋合并的年份） |

- 所有时间均按北京时间（UTC+08:00）计算，假期结束时间为最后一天 23:59:59。

## 其他配置

- **主题配色**：在 `config/themes.js` 中维护 `THEMES` 数组，每项包含背景三色与强调色；页面右上角的色点即由此生成。
- **本地存储键**：集中于 `config/app.js`。

## 字体

两款字体均来自 Google Fonts（SIL Open Font License 1.1），以可变字体形式放在 `fonts/`，不依赖外网：

- **Noto Serif SC**：正文与标题。为控制体积只包含页面会出现的字符（约 410 个）。**新增或修改页面上的中文文案后需要重新生成**，否则新字会回退到系统字体。重新生成时，收集 `index.html`、`scripts/`、`config/`、`utils/`、`styles/` 中的全部字符（CSS 里的「至」「—」也会显示在页面上），通过 `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&text=<字符>` 取得子集文件，覆盖 `fonts/noto-serif-sc.woff2`。
- **Cormorant Garamond**：倒计时数字（latin 子集，含等宽数字 `tnum` 与齐线数字 `lnum` 特性）。

## 本地预览

页面使用 ES Modules，需要通过静态服务器访问（如 `python3 -m http.server` 或 `npx serve`），直接双击打开 `index.html` 无法加载脚本。

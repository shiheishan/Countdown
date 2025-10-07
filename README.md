# Countdown

静态倒计时页面，已拆分为模块化的 HTML / CSS / JS 结构。

## 目录结构

```
.
├── config
│   ├── app.js          # 本地存储键等全局配置
│   ├── events.js       # 活动时间配置，可通过 ?event= 切换
│   └── themes.js       # 主题配色列表
├── index.html          # 页面结构
├── scripts
│   ├── app.js          # 应用入口：加载配置并初始化
│   ├── countdown.js    # 倒计时与进度环逻辑
│   ├── dom.js          # DOM 引用集中出口
│   └── theme.js        # 主题切换弹层与动画
├── styles
│   └── main.css        # 页面样式
└── utils
    └── time.js         # 时间工具函数
```

## 配置说明

- **活动时间**：在 `config/events.js` 中追加对象即可新增活动，支持通过查询参数 `?event=<id>` 指定活动。
- **主题配色**：在 `config/themes.js` 中维护 `THEMES` 数组，每项包含背景三色与强调色。
- **本地存储键**：集中于 `config/app.js`，避免散落硬编码。

## 本地预览

使用任意静态服务器（如 `npx serve` 或 VSCode Live Server）访问 `index.html`，即可在浏览器查看效果。

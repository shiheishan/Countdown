// 给静态资源地址加上内容哈希（?v=xxxxxxxx），避免浏览器沿用旧缓存。
// 用法：node tools/version-assets.mjs    （改动 CSS / JS / 字体后、提交前运行）
//
// - styles/main.css 里的字体地址
// - index.html 里的样式表、预加载字体、入口脚本
// - index.html 里的 import map：每个 JS 模块映射到带版本号的地址，
//   模块之间的相对 import 不用改，浏览器会按映射加载新版本
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path));
const hash = (path) => createHash('sha256').update(read(path)).digest('hex').slice(0, 8);
const listJs = (dir) =>
  readdirSync(join(root, dir))
    .filter((name) => name.endsWith('.js'))
    .sort()
    .map((name) => `${dir}/${name}`);

// 去掉旧版本号后再加新版本号
const withVersion = (text, path, version) => {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`${escaped}(\\?v=[0-9a-f]+)?`, 'g'), `${path}?v=${version}`);
};

// 1. 字体 → CSS（CSS 内容随字体版本变化，所以先改 CSS 再算它的哈希）
const cssPath = 'styles/main.css';
let css = read(cssPath).toString();
const fonts = readdirSync(join(root, 'fonts')).filter((name) => name.endsWith('.woff2'));
for (const font of fonts) {
  css = withVersion(css, `../fonts/${font}`, hash(`fonts/${font}`));
}
writeFileSync(join(root, cssPath), css);

// 2. index.html：样式表、预加载字体、入口脚本
let html = read('index.html').toString();
html = withVersion(html, `./${cssPath}`, hash(cssPath));
for (const font of fonts) {
  html = withVersion(html, `./fonts/${font}`, hash(`fonts/${font}`));
}
html = withVersion(html, './scripts/app.js', hash('scripts/app.js'));

// 3. import map：所有 JS 模块
const modules = ['config', 'scripts', 'utils'].flatMap(listJs);
const imports = Object.fromEntries(modules.map((path) => [`./${path}`, `./${path}?v=${hash(path)}`]));
const importMap = `<script type="importmap">\n${JSON.stringify({ imports }, null, 2)
  .split('\n')
  .map((line) => `  ${line}`)
  .join('\n')}\n  </script>`;
const mapPattern = /<script type="importmap">[\s\S]*?<\/script>/;
if (!mapPattern.test(html)) {
  throw new Error('index.html 缺少 <script type="importmap"> 占位');
}
html = html.replace(mapPattern, importMap);
writeFileSync(join(root, 'index.html'), html);

console.log(`已更新 ${relative(process.cwd(), join(root, 'index.html')) || 'index.html'}、${cssPath}：${modules.length} 个模块，${fonts.length} 个字体`);

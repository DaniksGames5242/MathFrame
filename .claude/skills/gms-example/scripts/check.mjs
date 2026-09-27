// Браузерная проверка скомпилированного примера: предупреждения/ошибки консоли
// и скриншоты каждой вкладки в тёмной и светлой теме.
//   node .claude/skills/gms-example/scripts/check.mjs <example.html> <outDir> ["Вкладка 1" "Вкладка 2" ...]
// Имена вкладок — точные подписи кнопок. Скриншоты: <outDir>/<тема>-<N>.png
// (N — номер вкладки, 0 — начальный вид). Выход 1, если в консоли были ошибки.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { pathToFileURL } from 'url';

const pw = await import(pathToFileURL(path.join(execSync('npm root -g').toString().trim(), 'playwright/index.mjs')).href);
const [html, outDir, ...tabs] = process.argv.slice(2);
if (!html || !outDir) { console.error('usage: check.mjs <example.html> <outDir> [tab labels...]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => pw.chromium.launch());
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
page.on('console', m => {
  const t = m.text();
  if (/Failed to load resource/.test(t)) return; // CDN (KaTeX, шрифты) в песочнице недоступен
  if (m.type() === 'warning' || m.type() === 'error') problems.push(m.type() + ': ' + t);
});
await page.goto(pathToFileURL(path.resolve(html)).href);
await page.waitForTimeout(800);
const canvasShot = async (file) => {
  const r = await page.evaluate(() => { const c = document.getElementById('mainCanvas').getBoundingClientRect(); return { x: c.x, y: c.y, w: c.width, h: c.height }; });
  await page.screenshot({ path: file, clip: { x: r.x - 2, y: r.y - 2, width: r.w + 4, height: r.h + 180 } });
};
for (const theme of ['dark', 'light']) {
  await page.evaluate(t => window.geocompilerSetTheme(t), theme);
  await page.waitForTimeout(200);
  if (!tabs.length) { await canvasShot(path.join(outDir, theme + '-0.png')); continue; }
  for (let i = 0; i < tabs.length; i++) {
    await page.getByRole('button', { name: tabs[i], exact: true }).click();
    await page.waitForTimeout(250);
    await canvasShot(path.join(outDir, theme + '-' + (i + 1) + '.png'));
  }
}
await browser.close();
if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
console.log('ok: консоль чистая, скриншоты в', outDir);

// Устойчивость к мусорному вводу: node tools/services-test/edge.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const base = process.argv[2] || 'http://localhost:8765/pages/mini-services.html';
const VALUES = ['', 'abc', '-5', '0', '1e308', '0.0000001'];
const b = await chromium.launch();
const issues = [];
async function screens(p, svc) {
  const out = [];
  const cats = await p.$$eval('#work .conv-chips > .conv-chip', e => e.map(x => x.textContent.trim()));
  if (!cats.length) return [[svc]];
  for (const c of cats) {
    await p.evaluate(t => [...document.querySelectorAll('#work .conv-chips > .conv-chip')].find(e => e.textContent.trim() === t).click(), c);
    const subs = await p.$$eval('#work .more-toolrow .geo-subchip', e => e.map(x => x.textContent.trim()));
    if (!subs.length) out.push([svc, c]); else subs.forEach(s => out.push([svc, c, s]));
  }
  return out;
}
for (const svc of ['conv', 'geo', 'more']) {
  const p0 = await b.newPage(); await p0.goto(base + '#' + svc); await p0.waitForTimeout(1200);
  const list = await screens(p0, svc); await p0.close();
  for (const path of list) {
    if (path[1] === 'Задача' || path[1] === 'Случайность') continue;
    for (const v of VALUES) {
      const p = await b.newPage({ viewport: { width: 1200, height: 1400 } });
      const errs = []; p.on('pageerror', e => { if (!/firebase/.test(String(e))) errs.push(String(e).slice(0, 140)); });
      await p.goto(base + '#' + svc); await p.waitForTimeout(900);
      await p.evaluate(([c, s]) => {
        const cl = (sel, t) => { const e = [...document.querySelectorAll(sel)].find(x => x.textContent.trim() === t); if (e) e.click(); };
        if (c) cl('#work .conv-chips > .conv-chip', c); if (s) cl('#work .more-toolrow .geo-subchip', s);
      }, [path[1], path[2]]);
      await p.waitForTimeout(200);
      await p.evaluate(v => {
        for (const el of document.querySelectorAll('#work input[type=text], #work input[type=number], #work input:not([type]), #work textarea')) {
          if (!el.offsetParent || el.closest('.gp-algai')) continue;
          el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, v);
      await p.waitForTimeout(350);
      const txt = await p.evaluate(() => document.querySelector('#work').innerText);
      const m = txt.match(/NaN|undefined|Infinity|\[object/);
      if (m || errs.length) issues.push(path.join(' / ') + '  ввод «' + v + '»: ' + (errs.length ? errs.join('; ') : '…' + txt.slice(Math.max(0, m.index - 50), m.index + 30).replace(/\s+/g, ' ') + '…'));
      await p.close();
    }
  }
}
console.log(issues.length ? issues.join('\n') : 'проблем нет');
console.log('ИТОГО проблем: ' + issues.length);
await b.close();

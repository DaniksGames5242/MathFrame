// node tools/services-test/run.mjs [базовый URL] — нужен запущенный статический сервер.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import cases from './cases.mjs';
const base = process.argv[2] || 'http://localhost:8765/pages/mini-services.html';
const b = await chromium.launch();
let pass = 0, fail = 0;
for (const c of cases) {
  const p = await b.newPage({ viewport: { width: 1200, height: 1600 } });
  const errs = []; p.on('pageerror', e => { if (!/firebase/.test(String(e))) errs.push(String(e).slice(0, 150)); });
  await p.goto(base + '#' + c.path[0]); await p.waitForTimeout(1200);
  const clickText = async (sel, text) => p.evaluate(([sel, text]) => { const el = [...document.querySelectorAll(sel)].find(e => e.textContent.trim() === text); if (el) el.click(); return !!el; }, [sel, text]);
  if (c.path[1]) await clickText('#work .conv-chips > .conv-chip', c.path[1]);
  if (c.path[2]) await clickText('#work .more-toolrow .geo-subchip', c.path[2]);
  await p.waitForTimeout(300);
  for (const [key, val] of Object.entries(c.set || {})) {
    const ok = await p.evaluate(([key, val]) => {
      const vis = [...document.querySelectorAll('#work input:not([type=hidden]), #work textarea, #work select')].filter(e => e.offsetParent && !e.closest('.gp-algai'));
      let el;
      if (key[0] === '#') el = vis[parseInt(key.slice(1), 10) - 1];
      else el = vis.find(e => { const l = e.closest('label'); const t = l ? (l.querySelector('span') || l).textContent.trim() : ''; return t === key; });
      if (!el) return false;
      el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }, [key, val]);
    if (!ok) errs.push('нет поля «' + key + '»');
  }
  for (const k of c.keys || []) {
    const ok = await p.evaluate(k => { const btn = [...document.querySelectorAll('#work button')].find(e => e.textContent.trim() === k && e.offsetParent); if (btn) btn.click(); return !!btn; }, k);
    if (!ok) errs.push('нет кнопки «' + k + '»');
    await p.waitForTimeout(60);
  }
  await p.waitForTimeout(500);
  const txt = await p.evaluate(basic => { if (basic) return document.querySelector('#work').innerText.split('История')[0]; const ps = document.querySelectorAll('#work .panel'); const panel = ps[ps.length - 1]; const last = panel ? panel.lastElementChild : document.querySelector('#work'); return (last || panel).innerText; }, c.path[0] === 'basic' || c.path[0] === 'plot');
  const found = (txt.replace(/−/g, '-').replace(/(\d)\s(?=\d{3}\b)/g, '$1').match(/-?\d+(?:[.,]\d+)?(?:e[-+]?\d+)?/gi) || []).map(x => parseFloat(x.replace(',', '.')));
  const missN = (c.nums || []).filter(n => !found.some(f => Math.abs(f - n) <= 1e-4 * Math.max(1, Math.abs(n))));
  const missS = (c.strs || []).filter(s => !txt.includes(s));
  const missNot = (c.not || []).filter(s => txt.includes(s));
  if (missNot.length) missS.push('лишнее: ' + missNot.join(', '));
  const bad = /NaN|undefined|Infinity/.test(txt) ? 'NaN/undefined в выводе' : '';
  const ok = !missN.length && !missS.length && !errs.length && !bad;
  ok ? pass++ : fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + c.path.join(' / ') + ' ' + JSON.stringify(c.set || {}).slice(0, 70) + (ok ? '' : '\n     нет чисел: ' + missN.join(', ') + (missS.length ? ' | нет строк: ' + missS.join(', ') : '') + (bad ? ' | ' + bad : '') + (errs.length ? ' | ' + errs.join('; ') : '') + '\n     вывод: ' + txt.replace(/\s+/g, ' ').slice(0, 300)));
  await p.close();
}
console.log(`\nпройдено ${pass}/${pass + fail}`);
await b.close();

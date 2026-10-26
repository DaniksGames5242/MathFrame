// node tools/alg-solver/test.cjs [-v] — доля примеров, которые калькулятор решает сам, и проверка ответов.
const c = require('./load.cjs');
const corpus = require('./corpus.cjs');
const v = process.argv.includes('-v');
let ok = 0, err = 0, wrong = 0;
function nums(res) {
  // числа из ответа: approx, либо из tex («x = 2», «\frac{1}{2}», «\sqrt{5}»)
  const out = [];
  for (const it of (res.answer && res.answer.items) || []) {
    if (it.approx !== undefined && it.approx !== null && it.approx !== '') {
      const n = parseFloat(String(it.approx).replace(',', '.').replace('−', '-'));
      if (Number.isFinite(n)) { out.push(n); continue; }
    }
    let t = String(it.tex).replace(/^[a-z]\s*=\s*/i, '').replace(/\\left|\\right|\s/g, '');
    t = t.replace(/\\dfrac|\\frac/g, '\\frac').replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]+)\}/g, 'Math.sqrt($1)').replace(/\\cdot/g, '*').replace(/−/g, '-').replace(/\{|\}/g, '');
    if (/^\(?[-+*/.()\dMathsqr]+\)?$/.test(t)) { try { const n = Function('return ' + t)(); if (Number.isFinite(n)) out.push(n); } catch (e) {} }
  }
  return out;
}
for (const [input, exp] of corpus) {
  const r = input.includes(';') ? c.MFSolver.solve({ rows: input.split(';') }) : c.MFSolver.solve({ linear: input });
  if (r.error) { err++; if (v) console.log('ERR   ' + input + '  →  ' + r.error); continue; }
  if (exp === null) { ok++; continue; }
  let got = nums(r);
  if (input.includes(';')) {   // система: «(2; 1)»
    const t = (r.answer.items[0] || {}).tex || '';
    got = (t.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  }
  const noSol = (r.answer.items || []).some(i => /нет|\\varnothing|∅/.test(i.tex));
  const good = exp.length === 0 ? noSol : (got.length === exp.length && got.slice().sort((a, b) => a - b).every((g, i) => Math.abs(g - exp.slice().sort((a, b) => a - b)[i]) < 1e-6 * Math.max(1, Math.abs(exp[i]))));
  if (good) ok++; else { wrong++; if (v) console.log('WRONG ' + input + '  →  ' + JSON.stringify((r.answer.items || []).map(i => i.tex + (i.approx ? ' ≈' + i.approx : ''))) + '  ожидалось ' + exp); }
}
console.log(`решено верно: ${ok}/${corpus.length} (${(100 * ok / corpus.length).toFixed(1)}%), ошибок решателя: ${err}, неверно/не распознан ответ: ${wrong}`);

// точная запись ответов
let exOk = 0; const exact = require('./exact.cjs');
for (const [input, want] of exact) {
  const r = c.MFSolver.solve({ linear: input });
  const got = r.error ? 'ERR ' + r.error : (r.answer.items || []).map(i => i.tex).join(' | ');
  if (got === want) exOk++; else console.log('EXACT ' + input + '  →  ' + got + '  ожидалось ' + want);
}
console.log(`точная запись: ${exOk}/${exact.length}`);
if (ok < corpus.length || exOk < exact.length) process.exitCode = 1;

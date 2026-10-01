// Замер покрытия: node tools/geo-solver/coverage.mjs [-v]
const corpus = (await import(process.argv.find(a => /^\.\/corpus\d*\.mjs$/.test(a)) || './corpus.mjs')).default;
import { solveGeometryProblem } from '../../assets/js/geo/geo-problem.js';
let ok = 0, wrong = 0, fail = 0;
const v = process.argv.includes('-v');
for (const [t, exp] of corpus) {
  let r; try { r = await solveGeometryProblem(t, {}); } catch (e) { r = { ok: false, error: 'THROW ' + e.message }; }
  const got = r.ok ? r.answers.map(a => a.value) : [];
  const good = r.ok && r.method !== 'coords' && !r.undetermined && got.length === exp.length && got.every((x, i) => Math.abs(x - exp[i]) < 1e-6 * Math.max(1, Math.abs(exp[i])));
  if (good) ok++; else if (r.ok) wrong++; else fail++;
  if (!good && v) console.log((r.ok ? 'WRONG ' : 'FAIL  ') + t + '\n      ' + (r.ok ? 'got ' + got.map(x => +x.toFixed(4)).join(', ') + ' exp ' + exp.map(x => +x.toFixed(4)).join(', ') + ' method ' + r.method + (r.undetermined ? ' undetermined' : '') : r.error));
}
console.log(`решено верно: ${ok}/${corpus.length} (${(100 * ok / corpus.length).toFixed(1)}%), неверно/неточно: ${wrong}, не решено: ${fail}`);

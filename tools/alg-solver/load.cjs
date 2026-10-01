// Загружает решатель алгебраического калькулятора (mf-math.js + mf-solver.js) в Node.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '../../assets/js');
const ctx = { console, Math, JSON, Date, Number, String, Array, Object, RegExp, Error, Map, Set, isFinite, isNaN, parseFloat, parseInt, BigInt, Symbol, Infinity, NaN };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
for (const f of ['mf-math.js', 'mf-solver.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
module.exports = ctx;

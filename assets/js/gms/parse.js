// assets/js/gms/parse.js
// Разбор сцены: вычисление выражений на этапе компиляции, парсеры всех блоков
// (new Point / Line / Figure / … , draw …) и parseCommands — разбор всей сцены целиком.
// Часть компилятора GMS; точка входа — assets/js/gms-compiler.js.

import { diagnoseBlockIssues, eraseSpanKeepingLines, findHeaderedBlocks, isInsideStringOrComment } from './preprocess.js';


const OBJECT_BLOCK_HEADERS = [
    '\\bnew\\s+Point(2D|3D)?\\b', '\\bnew\\s+Line(2D|3D)?\\b', '\\bnew\\s+Figure(2D|3D)?\\b', '\\bnew\\s+Primitive\\b',
    '\\bnew\\s+Section\\b', '\\bnew\\s+Boolean\\b', '\\bnew\\s+Truncate\\b', '\\bnew\\s+Hull\\b', '\\bnew\\s+Minkowski\\b', '\\bnew\\s+Angle3D\\b', '\\bnew\\s+Claster(2D|3D)?\\b',
    '\\bnew\\s+Angle\\b', '\\bdraw\\s+Angle\\b', '\\bdraw\\s+EquallySing\\b', '\\bdraw\\s+Vector(2D|3D)?\\b',
    '\\bdraw\\s+InfLine\\b', '\\bdraw\\s+InfPlane\\b', '\\bdraw\\s+Filling(2D|3D)?\\b', '\\bdraw\\s+Punctir\\b', '\\bdraw\\s+Text(2D|3D)?\\b',
    '\\bnew\\s+UI\\b', '\\bnew\\s+Circle\\b', '\\bdraw\\s+Arc\\b', '\\bnew\\s+Ellipse\\b',
    '\\bnew\\s+Curve(2D|3D)?\\b', '\\bdraw\\s+Function\\b', '\\bdraw\\s+Surface(2D|3D)?\\b', '\\bdraw\\s+Image\\b',
    '\\bdraw\\s+Histogram\\b', '\\bdraw\\s+Field(2D|3D)?\\b', '\\bdraw\\s+Trajectory(2D|3D)?\\b', '\\bdraw\\s+Graph\\b',
    '\\bdraw\\s+Fractal\\b', '\\bdraw\\s+Formula\\b', '\\bdraw\\s+Distribution\\b', '\\bdraw\\s+Locus\\b',
    '\\bdraw\\s+Trace\\b', '\\bdraw\\s+Region\\b', '\\bdraw\\s+Chart\\b',
    '\\bdraw\\s+Tree\\b', '\\bdraw\\s+Table\\b', '\\bdraw\\s+Complex\\b',
    '\\bdraw\\s+Hyperbolic\\b', '\\bdraw\\s+Bifurcation\\b', '\\bdraw\\s+Cobweb\\b', '\\bdraw\\s+IFS\\b', '\\bdraw\\s+Automaton\\b', '\\bdraw\\s+Voronoi\\b', '\\bdraw\\s+Fourier\\b', '\\bdraw\\s+Diagram\\b', '\\bdraw\\s+TensorField\\b',
    '\\bdraw\\s+Scatter3D\\b', '\\bdraw\\s+Histogram3D\\b', '\\bnew\\s+Publish\\b'
];
function removeObjectBlocks(code) {
    // Балансный поиск вместо нежадных regex: '};' внутри строк (например, в action кнопки)
    // больше не обрывает блок раньше времени.
    let spans = [];
    for (const h of OBJECT_BLOCK_HEADERS) {
        for (const b of findHeaderedBlocks(code, h)) spans.push(b);
    }
    spans.sort((a, b) => b.start - a.start);
    let result = code;
    for (const s of spans) result = eraseSpanKeepingLines(result, s.start, s.end);
    return result;
}

        // Безопасный вычислитель числовых выражений в объявлениях переменных.
        // Поддерживает: + - * / % ^, унарный минус, скобки, числа с e-нотацией,
        // константы pi/e/tau, функции sin/cos/tan/asin/acos/atan/atan2/sqrt/cbrt/abs/
        // floor/ceil/round/exp/log/log2/log10/min/max/pow/sign/hypot и ссылки на переменные.
        // Не использует Function()/eval — работает при любой CSP.
        function evaluateNumericExpression(expr, vars) {
            const FUNCS = {
                sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos,
                atan: Math.atan, atan2: Math.atan2, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
                floor: Math.floor, ceil: Math.ceil, round: Math.round, exp: Math.exp, log: Math.log,
                log2: Math.log2, log10: Math.log10, min: Math.min, max: Math.max, pow: Math.pow,
                sign: Math.sign, hypot: Math.hypot,
            };
            const CONSTS = { pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E, tau: 2 * Math.PI };
            let i = 0;
            const s = String(expr);
            function skipWs() { while (i < s.length && /\s/.test(s[i])) i++; }
            function parseE() {
                let v = parseT();
                while (true) {
                    skipWs();
                    if (s[i] === '+') { i++; v = v + parseT(); }
                    else if (s[i] === '-') { i++; v = v - parseT(); }
                    else break;
                }
                return v;
            }
            function parseT() {
                let v = parseP();
                while (true) {
                    skipWs();
                    if (s[i] === '*') { i++; v = v * parseP(); }
                    else if (s[i] === '/') { i++; v = v / parseP(); }
                    else if (s[i] === '%') { i++; v = v % parseP(); }
                    else break;
                }
                return v;
            }
            function parseP() {
                const base = parseU();
                skipWs();
                if (s[i] === '^') { i++; return Math.pow(base, parseP()); }
                return base;
            }
            function parseU() {
                skipWs();
                if (s[i] === '-') { i++; return -parseU(); }
                if (s[i] === '+') { i++; return parseU(); }
                return parseA();
            }
            function parseA() {
                skipWs();
                if (s[i] === '(') {
                    i++;
                    const v = parseE();
                    skipWs();
                    if (s[i] !== ')') throw new Error('Ожидалась ")" в выражении: ' + s);
                    i++;
                    return v;
                }
                const numMatch = /^\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|^\.\d+(?:[eE][+-]?\d+)?/.exec(s.slice(i));
                if (numMatch) { i += numMatch[0].length; return parseFloat(numMatch[0]); }
                const idMatch = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(s.slice(i));
                if (idMatch) {
                    const name = idMatch[0];
                    i += name.length;
                    skipWs();
                    if (s[i] === '(') {
                        i++;
                        const args = [];
                        skipWs();
                        if (s[i] !== ')') {
                            args.push(parseE());
                            skipWs();
                            while (s[i] === ',') { i++; args.push(parseE()); skipWs(); }
                        }
                        if (s[i] !== ')') throw new Error('Ожидалась ")" после аргументов ' + name);
                        i++;
                        const fn = FUNCS[name];
                        if (!fn) throw new Error(`Неизвестная функция: ${name}`);
                        return fn.apply(null, args);
                    }
                    if (vars[name] !== undefined && typeof vars[name] === 'number') return vars[name];
                    if (name in CONSTS) return CONSTS[name];
                    throw new Error(`Неизвестная переменная: ${name}`);
                }
                throw new Error(`Некорректное выражение: ${s}`);
            }
            const result = parseE();
            skipWs();
            if (i < s.length) throw new Error(`Некорректное выражение: ${s}`);
            if (typeof result !== 'number' || isNaN(result)) throw new Error(`Некорректное выражение: ${s}`);
            return result;
        }

        function evaluateStringExpression(expr, vars) {
            let parts = [];
            let current = '';
            let inQuotes = false;
            let escape = false;
            for (let i = 0; i < expr.length; i++) {
                const ch = expr[i];
                if (escape) {
                    current += ch;
                    escape = false;
                    continue;
                }
                if (ch === '\\') {
                    escape = true;
                    current += ch;
                    continue;
                }
                if (ch === '"') {
                    inQuotes = !inQuotes;
                    current += ch;
                } else if (ch === '+' && !inQuotes) {
                    parts.push(current.trim());
                    current = '';
                } else {
                    current += ch;
                }
            }
            if (current.trim()) parts.push(current.trim());
            let result = '';
            for (let part of parts) {
                if (!part) continue;
                if (part.startsWith('"') && part.endsWith('"')) {
                    let inner = part.slice(1, -1);
                    inner = inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    result += inner;
                } else {
                    const trimmed = part.trim();
                    if (vars[trimmed] !== undefined) {
                        const val = vars[trimmed];
                        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                            result += String(val);
                        } else {
                            throw new Error(`Переменная "${trimmed}" не может быть преобразована в строку`);
                        }
                    } else {
                        throw new Error(`Неизвестная переменная: ${trimmed}`);
                    }
                }
            }
            return result;
        }

        // ---- Общие хелперы разбора полей блока (устраняют дублирование across parseXBlock) ----
        // Строка: "значение" в кавычках, либо имя переменной типа string
        // Поиск поля блока (field = ...) — только на «верхнем уровне» блока. Раньше обычный
        // block.match находил имя поля где угодно: внутри строкового значения другого поля
        // (action = "tabA.active = false" у кнопки давал самой кнопке active = false, и она
        // пропадала) и после точки (obj.active). Теперь совпадения внутри строк и после "."
        // пропускаются. Регулярка должна начинаться с префикса (?:^|[^A-Za-z0-9_]) — как у
        // всех полевых регулярок ниже.
        function matchField(block, re) {
            const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
            let m;
            while ((m = g.exec(block))) {
                const fieldPos = /^[A-Za-z_]/.test(m[0]) ? m.index : m.index + 1;
                const prev = fieldPos > 0 ? block[fieldPos - 1] : '';
                if (prev !== '.' && !isInsideStringOrComment(block, fieldPos)) return m;
                if (m[0].length === 0) g.lastIndex++;
                else g.lastIndex = fieldPos + 1;
            }
            return null;
        }
        function parseStringField(block, vars, field) {
            const quoted = matchField(block, new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*"([^"]*)"'));
            if (quoted) return quoted[1];
            const ref = matchField(block, new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*([a-zA-Z_][a-zA-Z0-9_]*)'));
            if (ref && vars[ref[1]] !== undefined && typeof vars[ref[1]] === 'string') return vars[ref[1]];
            if (field === 'name') return '_auto' + (++autoNameCounter);
            return null;
        }
        // Настройка обновления объекта — общая для ЛЮБОГО типа блока: update = always
        // (по умолчанию, до 60 раз в сек, как раньше) | event (пересчитывать только при
        // реальном изменении сцены — драг/клик/тик Update) | once (пересчитать один раз при
        // запуске и больше никогда). update interval — доп. троттлинг в секундах поверх
        // always/event. См. рантайм-функцию gcShouldUpdate.
        function parseUpdateFields(block, vars) {
            const m = block.match(/(?:^|[^A-Za-z0-9_])update\s*=\s*"?(always|event|once)"?/);
            const updateMode = m ? m[1] : 'always';
            const updateInterval = parseNumberField(block, vars, 'update interval', null, false);
            return { updateMode, updateInterval };
        }
        // Цвет: #hex, ключевое слово default (-> def), либо имя переменной-строки с #hex
        function parseColorField(block, vars, field, def) {
            const m = matchField(block, new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*))', 'i'));
            if (!m) return def;
            const c = m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]);
            if (!c) return def;
            if (c.toLowerCase() === 'default') return def;
            if (c.startsWith('#')) return c;
            if (vars[c] !== undefined && typeof vars[c] === 'string') return vars[c];
            // Не переменная и не hex — считаем это именем цвета (CSS-совместимо, например "red"),
            // и передаём как есть: Canvas2D/Three.js понимают именованные цвета нативно.
            return c;
        }
        // Булево: true/false, либо имя переменной типа boolean
        function parseBoolField(block, vars, field, def) {
            const m = matchField(block, new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|(true|false|[a-zA-Z_][a-zA-Z0-9_]*))', 'i'));
            if (!m) return def;
            const v = (m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3])).toLowerCase();
            if (v === 'true') return true;
            if (v === 'false') return false;
            if (vars[v] !== undefined && typeof vars[v] === 'boolean') return vars[v];
            return def;
        }
        // Сырое значение поля active (литерал true/false или ИМЯ переменной).
        // parseBoolField резолвит переменную один раз на этапе компиляции; для 3D нужна
        // возможность пересчитывать видимость каждый кадр (например, когда переменную
        // меняет переключатель new UI), поэтому здесь сохраняется исходный токен.
        function parseActiveExpr(block) {
            // active = nA > 1 — любое выражение, не только имя переменной: раньше из него
            // бралось одно имя (nA), и условие молча превращалось в «nA не ноль».
            const full = captureExprField(block, 'active');
            if (full && !/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(full.trim())) return full.trim();
            const m = matchField(block, /(?:^|[^A-Za-z0-9_])active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_.]*)/);
            return m ? m[1] : null;
        }
        // new Publish { name = "..." value = <любое выражение движка> } — чистый способ
        // сообщить наружу (родительской странице через postMessage) текущее значение
        // чего угодно в сцене: длины отрезка, угла, площади фигуры — без парсинга
        // description/DOM. value — «сырое» выражение до конца блока (единственное
        // поле после name, поэтому не нужен общий сканер границ полей).
        function parsePublishBlock(body) {
            const nameMatch = body.match(/(?:^|[^A-Za-z0-9_])name\s*=\s*"([^"]*)"/);
            if (!nameMatch) return null;
            const valueMatch = body.match(/(?:^|[^A-Za-z0-9_])value\s*=\s*([\s\S]+)$/);
            const expr = valueMatch ? valueMatch[1].trim().replace(/;\s*$/, '') : '';
            if (!expr) return null;
            return { name: nameMatch[1], expr: expr };
        }
        // Число: литерал, необязательное ключевое слово default (-> def), либо имя переменной-числа
        function parseNumberField(block, vars, field, def, allowDefaultKeyword) {
            const num = '-?[\\d.]+(?:[eE][+-]?\\d+)?';
            const alt = allowDefaultKeyword ? num + '|default|[a-zA-Z_][a-zA-Z0-9_]*' : num + '|[a-zA-Z_][a-zA-Z0-9_]*';
            const m = matchField(block, new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*(' + alt + ')'));
            if (!m) return def;
            const v = m[1];
            if (allowDefaultKeyword && v === 'default') return def;
            if (!isNaN(parseFloat(v))) return parseFloat(v);
            if (vars[v] !== undefined && typeof vars[v] === 'number') return vars[v];
            return def;
        }

        // ---- Ссылки на точки: имя ИЛИ буквальные координаты (x, y) — везде, где ожидается точка ----
        // Координатный литерал молча регистрирует скрытую (нерисуемую) точку и возвращает её сгенерированное имя,
        // поэтому весь остальной код (который резолвит точки по имени) работает без изменений.
        let syntheticPointCounter = 0;
        let syntheticPoints = [];
        function resolvePointRef(raw, vars) {
            if (raw === undefined || raw === null) return null;
            let s = String(raw).trim();
            if (s === '') return null;
            const coordMatch = s.match(/^\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)$/);
            if (coordMatch) {
                let x = parseFloat(coordMatch[1]);
                let y = parseFloat(coordMatch[2]);
                if (isNaN(x) && vars[coordMatch[1]] !== undefined && typeof vars[coordMatch[1]] === 'number') x = vars[coordMatch[1]];
                if (isNaN(y) && vars[coordMatch[2]] !== undefined && typeof vars[coordMatch[2]] === 'number') y = vars[coordMatch[2]];
                if (isNaN(x) || isNaN(y)) return null;
                const nm = '_coord' + (++syntheticPointCounter);
                syntheticPoints.push({
                    name: nm, pos: { x, y }, line: null, circle: null, t: 0.5, extend: false,
                    construct: null, vertex: null, base: null,
                    color: '#000000', textEnabled: false, textValue: null, textColor: '#000000',
                    dynamic: false, active: true, size: 1, shape: 'circle', textSize: 1,
                    pauseOnDrag: true, layer: 40, hidden: true, dim: '2D',
                });
                return nm;
            }
            if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
            else if (vars[s] !== undefined && typeof vars[s] === 'string') return vars[s];
            return s;
        }
        // Достаёт значение поля (скобки/строка/имя) как СЫРУЮ строку — без резолва — чтобы затем передать в resolvePointRef
        function matchPointRefRaw(block, field) {
            const m = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*(\\([^)]*\\)|"[^"]*"|[a-zA-Z_][a-zA-Z0-9_]*)'));
            return m ? m[1] : null;
        }
        // Точка (единичная ссылка): имя ИЛИ (x, y)
        function parsePointRefField(block, vars, field) {
            return resolvePointRef(matchPointRefRaw(block, field), vars);
        }
        // Достаёт содержимое СБАЛАНСИРОВАННЫХ скобок после "field =", корректно работает с вложенными скобками
        // (нужно для списков, где элементом может быть координата "(x, y)")
        function extractParenGroup(block, field) {
            const re = new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*\\(');
            const m = re.exec(block);
            if (!m) return null;
            let i = m.index + m[0].length;
            let depth = 1;
            const start = i;
            while (i < block.length && depth > 0) {
                if (block[i] === '(') depth++;
                else if (block[i] === ')') depth--;
                i++;
            }
            if (depth !== 0) return null;
            return block.slice(start, i - 1);
        }
        // Список ссылок на точки в скобках через запятую, каждая — имя ИЛИ (x, y): field = (A, B, (0,0))
        function parsePointRefList(block, vars, field) {
            const inner = extractParenGroup(block, field);
            if (inner === null) return null;
            const items = splitTopLevelList(inner);
            return items.map(it => resolvePointRef(it, vars)).filter(n => n !== null);
        }
        // Список чисел в скобках: collisionMask = (1, 2, 3)
        function parseNumberListField(block, vars, field) {
            const inner = extractParenGroup(block, field);
            if (inner === null) return null;
            const items = splitTopLevelList(inner);
            const nums = items.map(it => {
                const s = it.trim();
                const v = parseFloat(s);
                if (!isNaN(v)) return v;
                if (vars[s] !== undefined && typeof vars[s] === 'number') return vars[s];
                return null;
            }).filter(v => v !== null);
            return nums.length > 0 ? nums : null;
        }
        // Захватывает значение поля как выражение мини-языка до запятой / ';' / переноса строки
        // ВЕРХНЕГО уровня (учитывает вложенные (), [] и строки): angle = min(a, b) -> "min(a, b)".
        // Раньше такие выражения обрезались regex'ом [^,;\n]+ на первой же запятой.
        function captureExprField(block, field) {
            const m = matchField(block, new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*'));
            if (!m) return null;
            let i = m.index + m[0].length;
            let depth = 0, out = '', inStr = false, strCh = '';
            while (i < block.length) {
                const ch = block[i];
                if (inStr) {
                    out += ch;
                    if (ch === '\\') { if (i + 1 < block.length) { out += block[i + 1]; i += 2; continue; } }
                    else if (ch === strCh) inStr = false;
                    i++; continue;
                }
                if (ch === '"' || ch === "'") { inStr = true; strCh = ch; out += ch; i++; continue; }
                if (ch === '(' || ch === '[') depth++;
                if (ch === ')' || ch === ']') { if (depth === 0) break; depth--; }
                if (depth === 0 && (ch === ',' || ch === ';' || ch === '\n' || ch === '}')) break;
                out += ch; i++;
            }
            const t = out.trim();
            return t === '' ? null : t;
        }
        // Для полей вроде data/labels у draw Chart/Tree/Table (ожидается массив), где по аналогии
        // с другими строковыми полями DSL (f = "myFunc" и т.п.) человек нередко оборачивает
        // значение в кавычки: data = "[1,2,3]". captureExprField в этом случае вернёт текст ВМЕСТЕ
        // с кавычками, evaluate() на этапе рендера распарсит это как обычную строку (не массив),
        // и Array.isArray(...) молча провалится — объект просто не нарисуется без единой ошибки в
        // консоли. draw Histogram уже был так исправлен раньше; тем же приёмом чиним и остальные:
        // если поле целиком — одна двойная кавычка, берём её СОДЕРЖИМОЕ как выражение напрямую,
        // не оборачивая заново в строку.
        function captureQuotableExprField(block, field) {
            const quoted = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*"([^"]*)"'));
            if (quoted) { const t = quoted[1].trim(); return t === '' ? null : t; }
            return captureExprField(block, field);
        }
        // Разбивает "A, B, (0, 0), C" по запятым верхнего уровня, не трогая запятые внутри вложенных скобок
        function splitTopLevelList(str) {
            const items = [];
            let depth = 0, cur = '';
            for (const ch of str) {
                if (ch === '(') depth++;
                if (ch === ')') depth--;
                if (ch === ',' && depth === 0) { items.push(cur.trim()); cur = ''; }
                else cur += ch;
            }
            if (cur.trim() !== '') items.push(cur.trim());
            return items;
        }

        // Разбор ОДНОГО элемента внутри значения list-переменной: рекурсивно, чтобы вложенные
        // кортежи (списки списков — например данные для draw Chart type=box/scatter, где
        // каждый элемент сам является парой/набором чисел) разбирались правильно, а не через
        // наивный split(',') по всей строке (тот terял вложенность и вообще ломался на первой
        // же внутренней ")"). Числа и true/false приводятся к настоящим JS-типам — иначе draw
        // Histogram/Chart получали массив СТРОК вместо чисел, что либо не рисовалось вовсе,
        // либо считалось неверно.
        function parseListLiteralItem(str) {
            const s = str.trim();
            if (s.startsWith('(') && s.endsWith(')')) {
                return splitTopLevelList(s.slice(1, -1)).map(parseListLiteralItem);
            }
            if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
                return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
            }
            if (s === 'true') return true;
            if (s === 'false') return false;
            if (/^-?[\d.]+(?:[eE][+-]?\d+)?$/.test(s)) {
                const n = parseFloat(s);
                if (!isNaN(n)) return n;
            }
            return s; // строка/идентификатор как есть — сохраняет прежнее поведение для прочего
        }
        function parseVariablesAndExpressions(codeBlock) {
            const vars = {};
            const errors = [];
            const varRegex = /\b(int|float|string|bool|Vector2|color|list)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+);/g;
            let match;
            while ((match = varRegex.exec(codeBlock)) !== null) {
                if (isInsideStringOrComment(codeBlock, match.index)) continue;
                const lineNum = codeBlock.slice(0, match.index).split('\n').length; // настоящий номер строки
                const type = match[1];
                const name = match[2];
                const valueStr = match[3].trim();
                if (vars[name] !== undefined) {
                    errors.push({ line: lineNum, message: `Переменная "${name}" уже объявлена` });
                    continue;
                }
                let parsedValue;
                try {
                    if (type === 'int' || type === 'float') {
                        parsedValue = evaluateNumericExpression(valueStr, vars);
                        if (type === 'int') parsedValue = Math.floor(parsedValue);
                        else parsedValue = parseFloat(parsedValue);
                    } else if (type === 'string') {
                        if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
                            let inner = valueStr.slice(1, -1);
                            inner = inner.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
                            parsedValue = inner;
                        } else {
                            parsedValue = evaluateStringExpression(valueStr, vars);
                        }
                    } else if (type === 'bool') {
                        if (valueStr === 'true') parsedValue = true;
                        else if (valueStr === 'false') parsedValue = false;
                        else if (vars[valueStr] !== undefined && typeof vars[valueStr] === 'boolean') parsedValue = vars[valueStr];
                        else throw new Error(`Некорректное значение для bool: ${valueStr}`);
                    } else if (type === 'Vector2') {
                        // Копия другой Vector2-переменной: Vector2 b = a;
                        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(valueStr) && vars[valueStr] !== undefined &&
                            typeof vars[valueStr] === 'object' && typeof vars[valueStr].x === 'number') {
                            vars[name] = { x: vars[valueStr].x, y: vars[valueStr].y };
                            continue;
                        }
                        const vecMatch = valueStr.match(/\(([^)]+)\)/);
                        if (vecMatch) {
                            const parts = vecMatch[1].split(',').map(s => s.trim());
                            if (parts.length === 2) {
                                let x = parseFloat(parts[0]);
                                let y = parseFloat(parts[1]);
                                if (isNaN(x) && vars[parts[0]] !== undefined && typeof vars[parts[0]] === 'number') x = vars[parts[0]];
                                else if (isNaN(x)) throw new Error(`Некорректное значение для Vector2: ${parts[0]}`);
                                if (isNaN(y) && vars[parts[1]] !== undefined && typeof vars[parts[1]] === 'number') y = vars[parts[1]];
                                else if (isNaN(y)) throw new Error(`Некорректное значение для Vector2: ${parts[1]}`);
                                parsedValue = { x, y };
                            } else throw new Error(`Vector2 должен содержать 2 числа: ${valueStr}`);
                        } else throw new Error(`Некорректный формат Vector2: ${valueStr}`);
                    } else if (type === 'color') {
                        if (valueStr.startsWith('#')) parsedValue = valueStr;
                        else if (vars[valueStr] !== undefined && typeof vars[valueStr] === 'string' && vars[valueStr].startsWith('#')) parsedValue = vars[valueStr];
                        else throw new Error(`Некорректное значение для color: ${valueStr}`);
                    } else if (type === 'list') {
                        // и (1, 2), и [1, 2] — второй вид используется в выражениях внутри Update
                        const listMatch = valueStr.match(/^\(([\s\S]*)\)$/) || valueStr.match(/^\[([\s\S]*)\]$/);
                        if (listMatch) {
                            const items = splitTopLevelList(listMatch[1]).map(parseListLiteralItem);
                            parsedValue = items;
                        } else throw new Error(`Некорректный формат list: ${valueStr}`);
                    }
                    vars[name] = parsedValue;
                } catch (e) {
                    errors.push({ line: lineNum, message: `Ошибка в выражении: ${e.message}` });
                }
            }
            return { vars, errors };
        }

        // Исправленный парсер UI: поддерживает вложенные переменные (через точку)
        function parseUIBlock(block, vars) {
            try {
                const typeMatch = matchField(block, /(?:^|[^A-Za-z0-9_])type\s*=\s*(button|toggle|input|slider|select)/);
                if (!typeMatch) return null;
                const type = typeMatch[1];

                // name — необязателен для обратной совместимости (раньше UI-контролы были
                // анонимными), но без него его нельзя включить в draw Filling... то есть в
                // new Claster { elements = (...) } — кластеры ищут элементы по имени.
                const name = parseStringField(block, vars, 'name');

                const labelMatch = matchField(block, /(?:^|[^A-Za-z0-9_])label\s*=\s*"([^"]*)"/);
                const label = labelMatch ? labelMatch[1] : '';

                const color = parseColorField(block, vars, 'color', null);

                const textcolor = parseColorField(block, vars, 'textcolor', null);

                const active = parseBoolField(block, vars, 'active', true);

                let variable = null;
                // Имя переменной допускается как без кавычек (variable = amplitude),
                // так и в кавычках (variable = "amplitude") — раньше вариант с кавычками
                // молча не распознавался, и контрол оказывался ни с чем не связан.
                const varMatch = matchField(block, /(?:^|[^A-Za-z0-9_])variable\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_.]*)"?/);
                if (varMatch) variable = varMatch[1]; // может содержать точки

                let funcName = null;
                const funcNameMatch = matchField(block, /(?:^|[^A-Za-z0-9_])funcName\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_]*)"?/);
                if (funcNameMatch) funcName = funcNameMatch[1];

                let defaultValue = null;
                const defaultMatch = matchField(block, /(?:^|[^A-Za-z0-9_])default\s*=\s*([^,;\n]+)/);
                if (defaultMatch) {
                    const raw = defaultMatch[1].trim();
                    if (raw === 'true') defaultValue = true;
                    else if (raw === 'false') defaultValue = false;
                    else if (!isNaN(parseFloat(raw))) defaultValue = parseFloat(raw);
                    else if (raw.startsWith('"') && raw.endsWith('"')) defaultValue = raw.slice(1, -1);
                    else if (vars[raw] !== undefined) defaultValue = vars[raw];
                    else defaultValue = raw;
                }

                let action = '';
                const actionMatch = matchField(block, /(?:^|[^A-Za-z0-9_])action\s*=\s*"([^"]*)"/);
                if (actionMatch) action = actionMatch[1];

                let inputtype = 'text';
                if (type === 'input') {
                    const itMatch = matchField(block, /(?:^|[^A-Za-z0-9_])inputtype\s*=\s*(number|text|formula)/);
                    if (itMatch) inputtype = itMatch[1];
                }

                let min = null, max = null, step = null, maxExpr = null;
                if ((type === 'input' && inputtype === 'number') || type === 'slider') {
                    const minMatch = matchField(block, /(?:^|[^A-Za-z0-9_])min\s*=\s*([\d.-]+)/);
                    if (minMatch) min = parseFloat(minMatch[1]);
                    const maxMatch = matchField(block, /(?:^|[^A-Za-z0-9_])max\s*=\s*([\d.-]+)/);
                    if (maxMatch) max = parseFloat(maxMatch[1]);
                    // max = выражение (например, p - 1): верхняя граница ползунка, зависящая
                    // от других переменных. Пересчитывается при каждой перерисовке.
                    else if (type === 'slider') {
                        const me = matchField(block, /(?:^|[^A-Za-z0-9_])max\s*=\s*([^;]+)/);
                        if (me) maxExpr = me[1].trim();
                    }
                    const stepMatch = matchField(block, /(?:^|[^A-Za-z0-9_])step\s*=\s*([\d.]+)/);
                    if (stepMatch) step = parseFloat(stepMatch[1]);
                }
                if (type === 'slider') {
                    if (min === null) min = 0;
                    if (max === null) max = 100;
                    if (step === null) step = 1;
                }

                // type = select — выпадающий список. options = ("a", "b") задаёт варианты;
                // строки в кавычках попадают в переменную как строки, голые числа — как числа
                // (чтобы select можно было использовать и для выбора параметра, и для выбора
                // режима). Необязательное labels = (...) задаёт подписи, если они должны
                // отличаться от самих значений.
                let options = null, optionLabels = null;
                if (type === 'select') {
                    // Скобки и запятые внутри строк ("(y/2, 0) — сдвиг") не должны обрывать список:
                    // раньше список заканчивался на первой «)» и подписи молча пропадали.
                    const parseListLiteral = (field) => {
                        const m = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*\\('));
                        if (!m) return null;
                        const parts = []; let cur = '', depth = 0, q = null, i = m.index + m[0].length;
                        for (; i < block.length; i++) {
                            const ch = block[i];
                            if (q) { cur += ch; if (ch === q) q = null; continue; }
                            if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
                            if (ch === '(') { depth++; cur += ch; continue; }
                            if (ch === ')') { if (depth === 0) break; depth--; cur += ch; continue; }
                            if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
                            cur += ch;
                        }
                        if (cur.trim() !== '') parts.push(cur.trim());
                        if (!parts.length) return null;
                        return parts.map(p => {
                            if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) return p.slice(1, -1);
                            const num = parseFloat(p);
                            if (!isNaN(num) && String(num) === p) return num;
                            if (vars[p] !== undefined && (typeof vars[p] === 'string' || typeof vars[p] === 'number')) return vars[p];
                            return p;
                        });
                    };
                    options = parseListLiteral('options');
                    if (!options) return null; // select без options бессмысленен — это ошибка блока
                    optionLabels = parseListLiteral('labels');
                    if (optionLabels && optionLabels.length !== options.length) optionLabels = null;
                }

                const x = parseNumberField(block, vars, 'x', null, false);
                const y = parseNumberField(block, vars, 'y', null, false);
                const uiWidth = parseNumberField(block, vars, 'width', null, false);
                const uiHeight = parseNumberField(block, vars, 'height', null, false);
                const radius = parseNumberField(block, vars, 'radius', 4, false);
                const stepper = parseBoolField(block, vars, 'stepper', true);
                const layer = parseNumberField(block, vars, 'layer', 100, false);

                return { name, type, label, color, textcolor, active, activeExpr: parseActiveExpr(block), variable, funcName, default: defaultValue, action, inputtype, min, max, maxExpr, step, stepper, options, optionLabels, x, y, width: uiWidth, height: uiHeight, radius, layer };
            } catch (e) {
                return null;
            }
        }

        // Остальные парсеры (Angle, DrawAngle, Point, Line, Figure, Circle, Claster) остаются без изменений, 
        // но мы добавляем поддержку динамического обновления окружностей в генераторе.

        function parseAngleBlock(block, vars) {
            const name = parseStringField(block, vars, 'name');
            if (!name) return null;

            let lineNames = null;
            const linesMatch = block.match(/lines\s*=\s*\(([^)]*)\)/);
            if (linesMatch) {
                const str = linesMatch[1].trim();
                lineNames = str.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            } else {
                const varNameMatch = block.match(/lines\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (varNameMatch) {
                    const varName = varNameMatch[1];
                    if (vars[varName] !== undefined && Array.isArray(vars[varName])) {
                        lineNames = vars[varName];
                    }
                }
            }
            if (!lineNames || lineNames.length !== 2) return null;

            const lock = parseBoolField(block, vars, 'lock', false);

            return { name, lineNames, lock };
        }

        function parseDrawAngleBlock(block, vars) {
            const name = parseStringField(block, vars, 'name');
            if (!name) return null;

            let angleName = null;
            const angleMatch = block.match(/angle\s*=\s*"([^"]*)"/);
            if (angleMatch) {
                angleName = angleMatch[1];
            } else {
                const varNameMatch = block.match(/angle\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (varNameMatch) {
                    const varName = varNameMatch[1];
                    if (vars[varName] !== undefined && typeof vars[varName] === 'string') angleName = vars[varName];
                }
            }
            if (!angleName) return null;

            const arc = parseBoolField(block, vars, 'arc', true);

            const measure = parseBoolField(block, vars, 'measure', true);

            const arccolor = parseColorField(block, vars, 'arccolor', null);
            const arccolorExpr = captureExprField(block, 'arccolor');

            const measurecolor = parseColorField(block, vars, 'measurecolor', null);
            const measurecolorExpr = captureExprField(block, 'measurecolor');

            let radius = 1.0;
            let radiusExpr = null;
            const radiusMatch = block.match(/radius\s*=\s*(-?[\d.]+(?:[eE][+-]?\d+)?|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (radiusMatch) {
                let r = radiusMatch[1];
                if (!isNaN(parseFloat(r))) {
                    radius = Math.abs(parseFloat(r));
                } else if (vars[r] !== undefined) {
                    if (typeof vars[r] === 'number') { radius = vars[r]; radiusExpr = r; }
                    else radius = r;
                } else {
                    radius = r;
                }
            }

            let side = 1;
            const sideMatch = block.match(/side\s*=\s*(-?1|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (sideMatch) {
                let s = sideMatch[1];
                if (s === '1') side = 1;
                else if (s === '-1') side = -1;
                else if (vars[s] !== undefined && typeof vars[s] === 'number' && (vars[s] === 1 || vars[s] === -1)) side = vars[s];
            }

            const fractions = parseBoolField(block, vars, 'fractions', false);

            let count = 1;
            const countMatch = block.match(/count\s*=\s*([\d.]+|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (countMatch) {
                let cnt = countMatch[1];
                if (!isNaN(parseFloat(cnt))) count = parseInt(cnt);
                else if (vars[cnt] !== undefined && typeof vars[cnt] === 'number') count = parseInt(vars[cnt]);
            }
            count = Math.min(3, Math.max(1, count || 1));

            // Слой дуги угла был 90 — заметно выше типичного слоя линий/отрезков (10), поэтому
            // дуга рисовалась ПОВЕРХ сторон угла и слегка перекрывала их у вершины (renderQueue
            // сортируется по возрастанию layer, и больший слой рисуется последним, то есть
            // сверху). Дуга — это разметка НА сторонах угла, а не самостоятельный элемент,
            // который должен их перекрывать, поэтому её место — под линиями. 5 выбрано чуть
            // ниже дефолтного слоя линии (10), чтобы дуга гарантированно оказывалась под ней
            // даже если у линии задан нестандартный (но обычный) layer.
            const layer = parseNumberField(block, vars, 'layer', 5, false);
            const { updateMode, updateInterval } = parseUpdateFields(block, vars);
            return { name, angleName, arc, measure, arccolor, arccolorExpr, measurecolor, measurecolorExpr, radius, radiusExpr, side, fractions, count, layer, updateMode, updateInterval };
        }

        function parseEquallySingBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let edges = null;
    const edgesMatch = block.match(/edges\s*=\s*\(([^)]*)\)/);
    if (edgesMatch) {
        const str = edgesMatch[1].trim();
        edges = str.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    } else {
        const varNameMatch = block.match(/edges\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && Array.isArray(vars[varName])) {
                edges = vars[varName];
            }
        }
    }
    if (!edges || edges.length === 0) return null;

    let type = 1;
    const typeMatch = block.match(/type\s*=\s*([\d.]+|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (typeMatch) {
        let t = typeMatch[1];
        if (!isNaN(parseFloat(t))) type = parseInt(t);
        else if (vars[t] !== undefined && typeof vars[t] === 'number') type = vars[t];
        else if (vars[t] !== undefined && typeof vars[t] === 'string') type = parseInt(vars[t]);
    }

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    const layer = parseNumberField(block, vars, 'layer', 80, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return { name, edges, type, color, colorExpr, layer, updateMode, updateInterval };
}

// draw Vector
function parseVectorBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let edge = null;
    const edgeMatch = block.match(/edge\s*=\s*"([^"]*)"/);
    if (edgeMatch) edge = edgeMatch[1];
    else {
        const varNameMatch = block.match(/edge\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') edge = vars[varName];
        }
    }
    if (!edge) return null;

    let pos = 0;
    const posMatch = block.match(/pos\s*=\s*([\d.-]+|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (posMatch) {
        let p = posMatch[1];
        if (!isNaN(parseFloat(p))) pos = parseFloat(p);
        else if (vars[p] !== undefined && typeof vars[p] === 'number') pos = vars[p];
    }

    let direct = 1;
    const directMatch = block.match(/direct\s*=\s*([\d.-]+|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (directMatch) {
        let d = directMatch[1];
        if (!isNaN(parseFloat(d))) direct = parseFloat(d);
        else if (vars[d] !== undefined && typeof vars[d] === 'number') direct = vars[d];
    }

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');

    const length = parseNumberField(block, vars, 'length', null, true);
    const lengthExpr = captureExprField(block, 'length');

    const thickness = parseNumberField(block, vars, 'thickness', null, true);
    const thicknessExpr = captureExprField(block, 'thickness');

    const layer = parseNumberField(block, vars, 'layer', 70, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, edge, pos, direct, color, colorExpr, length, lengthExpr, thickness, thicknessExpr, layer, updateMode, updateInterval };
}

// draw InfLine
function parseInfLineBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let edge = null;
    const edgeMatch = block.match(/edge\s*=\s*"([^"]*)"/);
    if (edgeMatch) edge = edgeMatch[1];
    else {
        const varNameMatch = block.match(/edge\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') edge = vars[varName];
        }
    }
    if (!edge) return null;

    let limit = null;
    const limitMatch = block.match(/limit\s*=\s*(none|[a-zA-Z_][a-zA-Z0-9_]*|"([^"]*)")/);
    if (limitMatch) {
        if (limitMatch[1] === 'none') limit = 'none';
        else if (limitMatch[2] !== undefined) limit = limitMatch[2];
        else {
            const v = limitMatch[1];
            if (vars[v] !== undefined && typeof vars[v] === 'string') limit = vars[v];
            else if (vars[v] !== undefined && typeof vars[v] === 'object' && vars[v].x !== undefined) limit = v;
        }
    }

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');

    const thickness = parseNumberField(block, vars, 'thickness', null, true);
    const thicknessExpr = captureExprField(block, 'thickness');

    const dotline = parseBoolField(block, vars, 'dotline', false);

    const layer = parseNumberField(block, vars, 'layer', 50, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, edge, limit, color, colorExpr, thickness, thicknessExpr, dotline, layer, updateMode, updateInterval };
}

// draw InfPlane — аналог draw InfLine, но для плоскостей (только 3D).
// Плоскость задаётся либо тремя точками (points = (A, B, C)), либо фигурой
// (figure = "faceABC" — берутся её первые три точки). Как и у InfLine, объект
// не имеет собственных вершин: он строится по чужим точкам и следует за ними.
// size — насколько далеко плоскость простирается от центра (аналог limit у InfLine).
function parseInfPlaneBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let figure = parseStringField(block, vars, 'figure');
    let points = null;
    if (!figure) {
        points = parsePointRefList(block, vars, 'points');
        if (!points || points.length < 3) return null;
    }

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    let opacity = parseNumberField(block, vars, 'opacity', 0.35, false);
    if (opacity < 0) opacity = 0;
    if (opacity > 1) opacity = 1;
    const opacityExpr = captureExprField(block, 'opacity');
    const size = parseNumberField(block, vars, 'size', null, false);
    const grid = parseBoolField(block, vars, 'grid', false);
    // fade = true — плоскость плавно растворяется от первой точки к краям (без резкого края)
    const fade = parseBoolField(block, vars, 'fade', false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 25, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, figure, points, color, colorExpr, opacity, opacityExpr, size, grid, fade, active, activeExpr: parseActiveExpr(block), layer, updateMode, updateInterval };
}

// draw Filling
function parseFillingBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let figure = null;
    const figureMatch = block.match(/figure\s*=\s*"([^"]*)"/);
    if (figureMatch) figure = figureMatch[1];
    else {
        const varNameMatch = block.match(/figure\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') figure = vars[varName];
        }
    }

    // Полуплоскость: line + side (имя точки, задающей нужную сторону от прямой)
    let line = null;
    const lineMatch = block.match(/line\s*=\s*"([^"]*)"/);
    if (lineMatch) line = lineMatch[1];
    else {
        const varNameMatch = block.match(/line\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') line = vars[varName];
        }
    }
    const side = parsePointRefField(block, vars, 'side');

    // Сектор/сегмент окружности: circle + from + to (точки, задающие направления от центра) + shape
    let circle = null;
    const circleMatch = block.match(/circle\s*=\s*"([^"]*)"/);
    if (circleMatch) circle = circleMatch[1];
    else {
        const varNameMatch = block.match(/circle\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') circle = vars[varName];
        }
    }
    const from = parsePointRefField(block, vars, 'from');
    const to = parsePointRefField(block, vars, 'to');
    let shape = 'sector';
    const shapeMatch = block.match(/shape\s*=\s*(sector|segment)/);
    if (shapeMatch) shape = shapeMatch[1];

    // Заливка уже существующей дуги (переиспользует её center/radius/from/to)
    let arc = null;
    const arcMatch = block.match(/arc\s*=\s*"([^"]*)"/);
    if (arcMatch) arc = arcMatch[1];
    else {
        const varNameMatch = block.match(/arc\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') arc = vars[varName];
        }
    }

    // Площадь под графиком / между графиками: func — имя объекта draw Function
    // (нижняя граница области — ось X, если func2 не задан); func2 — имя второго
    // draw Function (тогда заливается область между двумя кривыми на общем участке x).
    // xmin/xmax/segments необязательны: если не заданы явно, при инициализации сцены
    // берутся из самого объекта draw Function, на который ссылается func (см. initDrawFillings).
    let func = null;
    const funcMatch = block.match(/\bfunc\s*=\s*"([^"]*)"/);
    if (funcMatch) func = funcMatch[1];
    else {
        const varNameMatch = block.match(/\bfunc\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') func = vars[varName];
        }
    }
    let func2 = null;
    const func2Match = block.match(/\bfunc2\s*=\s*"([^"]*)"/);
    if (func2Match) func2 = func2Match[1];
    else {
        const varNameMatch = block.match(/\bfunc2\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') func2 = vars[varName];
        }
    }
    const hasFuncXmin = /(?:^|[^A-Za-z0-9_])xmin\s*=/.test(block);
    const hasFuncXmax = /(?:^|[^A-Za-z0-9_])xmax\s*=/.test(block);
    const funcXmin = hasFuncXmin ? parseNumberField(block, vars, 'xmin', null, false) : null;
    const funcXmax = hasFuncXmax ? parseNumberField(block, vars, 'xmax', null, false) : null;
    const hasFuncSegments = /(?:^|[^A-Za-z0-9_])segments\s*=/.test(block);
    const funcSegments = hasFuncSegments ? parseNumberField(block, vars, 'segments', null, false) : null;

    if (!figure && !line && !circle && !arc && !func) return null;
    if (line && !side) return null; // для полуплоскости обязательно указать сторону точкой
    if (circle && (!from || !to)) return null; // для сектора/сегмента обязательны from и to
    if (func2 && !func) return null; // func2 без func не имеет смысла

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');

    let mode = 'full';
    const modeMatch = block.match(/mode\s*=\s*(full|inside|outside|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (modeMatch) {
        let m = modeMatch[1];
        if (m === 'full' || m === 'inside' || m === 'outside') mode = m;
        else if (vars[m] !== undefined && typeof vars[m] === 'string' && (vars[m] === 'full' || vars[m] === 'inside' || vars[m] === 'outside')) mode = vars[m];
    }

    const layer = parseNumberField(block, vars, 'layer', 30, false);
    // Прозрачность заливки: 0 — полностью прозрачная, 1 — полностью непрозрачная.
    // По умолчанию 0.5 — то же значение, что раньше было жёстко зашито в 2D-рендере.
    let opacity = parseNumberField(block, vars, 'opacity', 0.5, false);
    if (opacity < 0) opacity = 0;
    if (opacity > 1) opacity = 1;
    const opacityExpr = captureExprField(block, 'opacity');
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, figure, line, side, circle, from, to, arc, shape, color, colorExpr, mode, layer, opacity, opacityExpr, updateMode, updateInterval, func, func2, funcXmin, funcXmax, funcSegments, activeExpr: parseActiveExpr(block) };
}

function parsePunctirBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let edge = null;
    const edgeMatch = block.match(/edge\s*=\s*"([^"]*)"/);
    if (edgeMatch) edge = edgeMatch[1];
    else {
        const varNameMatch = block.match(/edge\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') edge = vars[varName];
        }
    }
    if (!edge) return null;

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');

    const thickness = parseNumberField(block, vars, 'thickness', null, true);
    const thicknessExpr = captureExprField(block, 'thickness');

    let pattern = null;
    const patternMatch = block.match(/pattern\s*=\s*\(([\d.,\s]+)\)/);
    if (patternMatch) {
        const str = patternMatch[1].trim();
        pattern = str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
    } else {
        // стандартный пунктир
        pattern = [6, 6];
    }

    const layer = parseNumberField(block, vars, 'layer', 60, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, edge, color, colorExpr, thickness, thicknessExpr, pattern, layer, updateMode, updateInterval };
}

        // Общие атрибуты коллизий для линий/кривых/фигур/окружностей/эллипсов/дуг (по умолчанию collision=false)
        function parseGeneralCollisionFields(block, vars, defaultCollision) {
            return {
                collision: parseBoolField(block, vars, 'collision', defaultCollision),
                collisionGroup: parseNumberField(block, vars, 'collisionGroup', 0, false),
                collisionMask: parseNumberListField(block, vars, 'collisionMask'),
                collisionMargin: parseNumberField(block, vars, 'collisionMargin', 0, false),
                collideWithPoints: parseBoolField(block, vars, 'collideWithPoints', false),
                collideWithLines: parseBoolField(block, vars, 'collideWithLines', false),
                collideWithCurves: parseBoolField(block, vars, 'collideWithCurves', false),
                collideWithCircles: parseBoolField(block, vars, 'collideWithCircles', false),
                collideWithEllipses: parseBoolField(block, vars, 'collideWithEllipses', false),
                collideWithArcs: parseBoolField(block, vars, 'collideWithArcs', false),
                collideWithFigures: parseBoolField(block, vars, 'collideWithFigures', false),
                collideWithClusters: parseBoolField(block, vars, 'collideWithClusters', false),
                collideWithBoundary: parseBoolField(block, vars, 'collideWithBoundary', false),
            };
        }
        function parsePointCommonFields(block, vars) {
            const color = parseColorField(block, vars, 'color', null);
            // Живая версия — вычисляется заново на каждой перерисовке (см. drawPoint/gcShouldUpdate),
            // а не один раз при компиляции. color/size выше остаются как статический дефолт на
            // случай, если captureExprField ничего не найдёт (поле вообще не задано).
            const colorExpr = captureExprField(block, 'color');
            let textEnabled = false;
            let textValue = null;
            // true("...") — строка может содержать ")" (например, "ζ(s)"): сначала пробуем
            // строковый литерал целиком, иначе прежний разбор до первой ")".
            const quotedText = matchField(block, /(?:^|[^A-Za-z0-9_])text\s*=\s*true\s*\(\s*"((?:[^"\\]|\\.)*)"\s*\)/);
            const textMatch = quotedText ? [quotedText[0], 'true("' + quotedText[1] + '")', '"' + quotedText[1] + '"'] : block.match(/text\s*=\s*(true\s*\(([^)]*)\)|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (textMatch) {
                let full = textMatch[1];
                if (full === 'false') textEnabled = false;
                else if (full.startsWith('true(')) {
                    let arg = textMatch[2].trim();
                    if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
                        textEnabled = true;
                        textValue = arg.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    } else if (vars[arg] !== undefined) {
                        textEnabled = true;
                        textValue = String(vars[arg]);
                    } else {
                        try {
                            textValue = evaluateStringExpression(arg, vars);
                            textEnabled = true;
                        } catch (e) {
                            textEnabled = true;
                            textValue = arg;
                        }
                    }
                } else {
                    if (vars[full] !== undefined && typeof vars[full] === 'string') {
                        textEnabled = true;
                        textValue = vars[full];
                    }
                }
            }

            const textColor = parseColorField(block, vars, 'textColor', null);
            const dynamic = parseBoolField(block, vars, 'dynamic', true);
            const active = parseBoolField(block, vars, 'active', true);
            const activeExpr = parseActiveExpr(block);
            const size = parseNumberField(block, vars, 'size', 1, false);
            const sizeExpr = captureExprField(block, 'size');
            let shape = 'circle';
            const shapeMatch = block.match(/shape\s*=\s*(circle|square|cross|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (shapeMatch) {
                const s = shapeMatch[1];
                if (s === 'circle' || s === 'square' || s === 'cross') shape = s;
                else if (vars[s] !== undefined && ['circle', 'square', 'cross'].includes(vars[s])) shape = vars[s];
            }
            const textSize = parseNumberField(block, vars, 'textSize', 1, false);
            // textDir = (dx, dy) — в какую сторону от точки поставить подпись (в координатах
            // поля, y вверх). Без него — как раньше, слева сверху. Нужен генерируемым
            // чертежам (геометрический калькулятор): подпись вершины выносится наружу фигуры.
            const textDirMatch = block.match(/textDir\s*=\s*\(\s*(-?[\d.]+(?:[eE][+-]?\d+)?)\s*,\s*(-?[\d.]+(?:[eE][+-]?\d+)?)\s*\)/);
            const textDir = textDirMatch ? { x: parseFloat(textDirMatch[1]), y: parseFloat(textDirMatch[2]) } : null;
            const pauseOnDrag = parseBoolField(block, vars, 'pauseOnDrag', true);
            const layer = parseNumberField(block, vars, 'layer', 40, false);

            const collision = parseBoolField(block, vars, 'collision', true);
            const collisionGroup = parseNumberField(block, vars, 'collisionGroup', 0, false);
            const collisionMask = parseNumberListField(block, vars, 'collisionMask');
            const collisionMargin = parseNumberField(block, vars, 'collisionMargin', 0, false);
            const collideWithPoints = parseBoolField(block, vars, 'collideWithPoints', true);
            const collideWithLines = parseBoolField(block, vars, 'collideWithLines', false);
            const collideWithCurves = parseBoolField(block, vars, 'collideWithCurves', false);
            const collideWithCircles = parseBoolField(block, vars, 'collideWithCircles', false);
            const collideWithEllipses = parseBoolField(block, vars, 'collideWithEllipses', false);
            const collideWithArcs = parseBoolField(block, vars, 'collideWithArcs', false);
            const collideWithFigures = parseBoolField(block, vars, 'collideWithFigures', false);
            const collideWithClusters = parseBoolField(block, vars, 'collideWithClusters', false);
            const collideWithBoundary = parseBoolField(block, vars, 'collideWithBoundary', true);
            // Только 3D: столкновение с телами Primitive (сфера/куб/цилиндр/конус и т.п.) —
            // по умолчанию включено (как и collideWithPoints/collideWithBoundary), чтобы точки
            // не "проваливались" внутрь примитивов сразу, без дополнительной настройки скрипта;
            // как и всё остальное здесь, отключается точечно: collideWithPrimitives = false.
            const collideWithPrimitives = parseBoolField(block, vars, 'collideWithPrimitives', true);
            const { updateMode, updateInterval } = parseUpdateFields(block, vars);

            return {
                color, colorExpr, textEnabled, textValue, textColor, dynamic, active, activeExpr, size, sizeExpr, shape, textSize, textDir, pauseOnDrag, layer,
                collision, collisionGroup, collisionMask, collisionMargin,
                collideWithPoints, collideWithLines, collideWithCurves, collideWithCircles, collideWithEllipses, collideWithArcs,
                collideWithFigures, collideWithClusters, collideWithBoundary, collideWithPrimitives,
                updateMode, updateInterval,
            };
        }

        function parsePointBlock(block, vars) {
            const name = parseStringField(block, vars, 'name');
            if (!name) return null;
            const common = parsePointCommonFields(block, vars);
            const base = { name, ...common };

            // ---- Вычисляемые точки (пересчитываются каждый кадр) ----
            const constructMatch = block.match(/construct\s*=\s*(bisector|median|altitude)/);
            if (constructMatch) {
                const vertexName = parsePointRefField(block, vars, 'vertex');
                const baseMatch = block.match(/base\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_]*)"?/);
                const baseName = baseMatch ? baseMatch[1] : null;
                if (!vertexName || !baseName) return null;
                return { ...base, pos: { x: 0, y: 0 }, construct: constructMatch[1], vertex: vertexName, base: baseName };
            }

            // Задача 2: отражение / поворот / гомотетия
            const reflectSrc = parsePointRefField(block, vars, 'reflect');
            if (reflectSrc) {
                const over = parsePointRefField(block, vars, 'over');
                if (!over) return null;
                return { ...base, pos: { x: 0, y: 0, z: 0 }, transform: 'reflect', transformSource: reflectSrc, transformOver: over };
            }
            const rotateSrc = parsePointRefField(block, vars, 'rotate');
            if (rotateSrc) {
                const around = parsePointRefField(block, vars, 'around');
                const angleExpr = captureExprField(block, 'angle');
                if (!around || angleExpr === null) return null;
                // axis — только для 3D-сцен (в 2D вращение всегда вокруг оси Z, перпендикулярной
                // плоскости, поэтому направление не нужно); по умолчанию — вертикальная ось Y
                // ("карусельное" вращение вокруг точки around), самый частый случай, когда явная
                // ось не задана. Можно переопределить: axis = (x, y, z) — направление оси вращения.
                const axis = parseXYZField(block, vars, 'axis', { x: 0, y: 1, z: 0 });
                return { ...base, pos: { x: 0, y: 0, z: 0 }, transform: 'rotate', transformSource: rotateSrc, transformAround: around, transformExpr: angleExpr, transformAxis: axis };
            }
            const homothetySrc = parsePointRefField(block, vars, 'homothety');
            if (homothetySrc) {
                const center = parsePointRefField(block, vars, 'center');
                const ratioExpr = captureExprField(block, 'ratio');
                if (!center || ratioExpr === null) return null;
                const ratioYExpr = captureExprField(block, 'ratioY');
                const ratioZExpr = captureExprField(block, 'ratioZ');
                return { ...base, pos: { x: 0, y: 0, z: 0 }, transform: 'homothety', transformSource: homothetySrc, transformCenter: center, transformExpr: ratioExpr, transformExprY: ratioYExpr, transformExprZ: ratioZExpr };
            }
            const translateSrc = parsePointRefField(block, vars, 'translate');
            if (translateSrc) {
                const dxExpr = captureExprField(block, 'dx');
                const dyExpr = captureExprField(block, 'dy');
                if (dxExpr === null || dyExpr === null) return null;
                const dzExpr = captureExprField(block, 'dz');
                return { ...base, pos: { x: 0, y: 0, z: 0 }, transform: 'translate', transformSource: translateSrc, transformDx: dxExpr, transformDy: dyExpr, transformDz: dzExpr };
            }

            // ---- Точка на линии / окружности / эллипсе / кривой / дуге / графике функции ----
            const lineMatch = block.match(/(?:^|[^A-Za-z0-9_])line\s*=\s*"([^"]*)"/);
            if (lineMatch) {
                const extend = parseBoolField(block, vars, 'extend', false);
                let t = 0.5;
                const tMatch = block.match(/(?:^|[^A-Za-z0-9_])t\s*=\s*(-?[\d.]+)/);
                if (tMatch) {
                    t = parseFloat(tMatch[1]);
                    if (isNaN(t)) t = 0.5;
                    if (!extend) { if (t < 0) t = 0; if (t > 1) t = 1; }
                }
                return { ...base, pos: { x: 0, y: 0 }, line: lineMatch[1], t, extend };
            }
            const circleMatch = block.match(/(?:^|[^A-Za-z0-9_])circle\s*=\s*"([^"]*)"/);
            if (circleMatch) {
                let t = 0.5;
                const tMatch = block.match(/(?:^|[^A-Za-z0-9_])t\s*=\s*([\d.]+)/);
                if (tMatch) { t = parseFloat(tMatch[1]); if (isNaN(t) || t < 0) t = 0; if (t > 1) t = 1; }
                return { ...base, pos: { x: 0, y: 0 }, circle: circleMatch[1], t };
            }
            // Динамическая точка, лежащая на графике функции (draw Function):
            // new Point { name = P, graph = "gr", t = 0.5 } — t в [0,1] по оси x графика,
            // y пересчитывается каждый кадр как f(x); перетаскивается вдоль графика мышью.
            const graphMatch = block.match(/(?:^|[^A-Za-z0-9_])graph\s*=\s*"([^"]*)"/);
            if (graphMatch) {
                let t = 0.5;
                const tMatch = block.match(/(?:^|[^A-Za-z0-9_])t\s*=\s*([\d.]+)/);
                if (tMatch) { t = parseFloat(tMatch[1]); if (isNaN(t) || t < 0) t = 0; if (t > 1) t = 1; }
                return { ...base, pos: { x: 0, y: 0 }, graph: graphMatch[1], t };
            }
            const ellipseMatch = block.match(/(?:^|[^A-Za-z0-9_])ellipse\s*=\s*"([^"]*)"/);
            if (ellipseMatch) {
                const axisMatch = block.match(/axis\s*=\s*(a|b)/);
                let t = 0.5, axis = null;
                if (axisMatch) {
                    axis = axisMatch[1];
                } else {
                    const tMatch = block.match(/(?:^|[^A-Za-z0-9_])t\s*=\s*([\d.]+)/);
                    if (tMatch) { t = parseFloat(tMatch[1]); if (isNaN(t) || t < 0) t = 0; if (t > 1) t = 1; }
                }
                return { ...base, pos: { x: 0, y: 0 }, ellipse: ellipseMatch[1], axis, t };
            }
            const curveMatch = block.match(/(?:^|[^A-Za-z0-9_])curve\s*=\s*"([^"]*)"/);
            if (curveMatch) {
                let t = 0.5;
                const tMatch = block.match(/(?:^|[^A-Za-z0-9_])t\s*=\s*([\d.]+)/);
                if (tMatch) { t = parseFloat(tMatch[1]); if (isNaN(t) || t < 0) t = 0; if (t > 1) t = 1; }
                return { ...base, pos: { x: 0, y: 0 }, curve: curveMatch[1], t };
            }
            const arcMatch = block.match(/(?:^|[^A-Za-z0-9_])arc\s*=\s*"([^"]*)"/);
            if (arcMatch) {
                let t = 0.5;
                const tMatch = block.match(/(?:^|[^A-Za-z0-9_])t\s*=\s*([\d.]+)/);
                if (tMatch) { t = parseFloat(tMatch[1]); if (isNaN(t) || t < 0) t = 0; if (t > 1) t = 1; }
                return { ...base, pos: { x: 0, y: 0 }, arc: arcMatch[1], t };
            }

            // ---- Точка на плоскости (draw InfPlane) или на грани фигуры (Figure3D) — только 3D. ----
            // Плоскость/грань задаёт свой собственный ортонормированный базис (см. update3DConstrainedPoints
            // в generate3D): origin — первая из определяющих точек, basis1/basis2 — два перпендикулярных
            // направления В плоскости. u, v — свободные вещественные координаты точки в этом базисе
            // (как и у draw InfPlane, плоскость считается бесконечной — u/v не ограничены контуром
            // фигуры/размером plane, даже если сама грань конечна).
            const planeMatch = block.match(/(?:^|[^A-Za-z0-9_])plane\s*=\s*"([^"]*)"/);
            const onFigureMatch = block.match(/(?:^|[^A-Za-z0-9_])figure\s*=\s*"([^"]*)"/);
            if (planeMatch || onFigureMatch) {
                const uExpr = captureExprField(block, 'u');
                const vExpr = captureExprField(block, 'v');
                if (uExpr === null || vExpr === null) return null;
                return planeMatch
                    ? { ...base, pos: { x: 0, y: 0, z: 0 }, plane: planeMatch[1], uExpr, vExpr }
                    : { ...base, pos: { x: 0, y: 0, z: 0 }, onFigure: onFigureMatch[1], uExpr, vExpr };
            }

            // ---- Обычная точка с фиксированными (или дефолтными) координатами ----
            // В 3D-пространстве pos пишется как (x, y, z); третья координата опциональна
            // и для 2D-сцен просто игнорируется (но парсится всегда одинаково, чтобы
            // один и тот же код точки не зависел от того, читает его generate2D или generate3D).
            let pos = null;
            const posMatch = block.match(/pos\s*=\s*\(([^)]*)\)/);
            if (posMatch) {
                const coords = posMatch[1].trim().split(',').map(s => s.trim());
                if (coords.length === 2 || coords.length === 3) {
                    let x = parseFloat(coords[0]);
                    let y = parseFloat(coords[1]);
                    let z = coords.length === 3 ? parseFloat(coords[2]) : 0;
                    if (isNaN(x) && vars[coords[0]] !== undefined && typeof vars[coords[0]] === 'number') x = vars[coords[0]];
                    if (isNaN(y) && vars[coords[1]] !== undefined && typeof vars[coords[1]] === 'number') y = vars[coords[1]];
                    if (coords.length === 3 && isNaN(z) && vars[coords[2]] !== undefined && typeof vars[coords[2]] === 'number') z = vars[coords[2]];
                    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) pos = { x, y, z };
                }
            } else {
                const varNameMatch = block.match(/pos\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (varNameMatch && vars[varNameMatch[1]] !== undefined && typeof vars[varNameMatch[1]] === 'object' && vars[varNameMatch[1]].x !== undefined) {
                    const v = vars[varNameMatch[1]];
                    pos = { x: v.x, y: v.y, z: (typeof v.z === 'number') ? v.z : 0 };
                }
            }
            // Запрос #3: отсутствие pos — не ошибка, а разумное значение по умолчанию
            if (!pos) pos = { x: 0, y: 0, z: 0 };
            return { ...base, pos };
        }

        function parseLineBlock(block, vars) {
            const name = parseStringField(block, vars, 'name');
            if (!name) return null;

            // Задача 2: линия как отражение/поворот/гомотетия/перенос другой линии (преобразуются обе её точки)
            const reflectSrcLine = parsePointRefField(block, vars, 'reflect');
            const rotateSrcLine = parsePointRefField(block, vars, 'rotate');
            const homothetySrcLine = parsePointRefField(block, vars, 'homothety');
            const translateSrcLine = parsePointRefField(block, vars, 'translate');
            let pointA = null, pointB = null;
            if (reflectSrcLine || rotateSrcLine || homothetySrcLine || translateSrcLine) {
                let transform, srcLineName, over = null, around = null, center = null, transformExpr = null, transformExprY = null, transformDx = null, transformDy = null;
                if (reflectSrcLine) {
                    transform = 'reflect'; srcLineName = reflectSrcLine;
                    over = parsePointRefField(block, vars, 'over');
                    if (!over) return null;
                } else if (rotateSrcLine) {
                    transform = 'rotate'; srcLineName = rotateSrcLine;
                    around = parsePointRefField(block, vars, 'around');
                    const angleExpr = captureExprField(block, 'angle');
                    if (!around || angleExpr === null) return null;
                    transformExpr = angleExpr;
                } else if (homothetySrcLine) {
                    transform = 'homothety'; srcLineName = homothetySrcLine;
                    center = parsePointRefField(block, vars, 'center');
                    const ratioExpr = captureExprField(block, 'ratio');
                    if (!center || ratioExpr === null) return null;
                    transformExpr = ratioExpr;
                    const ratioYExpr = captureExprField(block, 'ratioY');
                    if (ratioYExpr !== null) transformExprY = ratioYExpr;
                } else {
                    transform = 'translate'; srcLineName = translateSrcLine;
                    const dxExpr = captureExprField(block, 'dx');
                    const dyExpr = captureExprField(block, 'dy');
                    if (dxExpr === null || dyExpr === null) return null;
                    transformDx = dxExpr; transformDy = dyExpr;
                }
                for (const end of ['A', 'B']) {
                    const nm = '_lt' + (++syntheticPointCounter);
                    syntheticPoints.push({
                        name: nm, pos: { x: 0, y: 0 }, line: null, circle: null, ellipse: null, axis: null, t: 0.5, extend: false,
                        construct: null, vertex: null, base: null,
                        transform, transformSourceLine: srcLineName, transformSourceEnd: end,
                        transformOver: over, transformAround: around, transformCenter: center, transformExpr, transformExprY, transformDx, transformDy,
                        color: '#000000', textEnabled: false, textValue: null, textColor: '#000000',
                        dynamic: false, active: true, size: 1, shape: 'circle', textSize: 1,
                        pauseOnDrag: true, layer: 40, hidden: true, dim: null,
                    });
                    if (end === 'A') pointA = nm; else pointB = nm;
                }
            } else {
                let pointNames = parsePointRefList(block, vars, 'pos');
                if (!pointNames) {
                    const varNameMatch = block.match(/pos\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (varNameMatch) {
                        const varName = varNameMatch[1];
                        if (vars[varName] !== undefined && Array.isArray(vars[varName])) {
                            pointNames = vars[varName];
                        }
                    }
                }
                if (!pointNames || pointNames.length !== 2) return null;
                pointA = pointNames[0];
                pointB = pointNames[1];
            }

            const color = parseColorField(block, vars, 'color', null);
            const colorExpr = captureExprField(block, 'color');
            const thickness = parseNumberField(block, vars, 'thickness', 2.5, true);
            const thicknessExpr = captureExprField(block, 'thickness');

            const interact = parseBoolField(block, vars, 'interact', true);

            const active = parseBoolField(block, vars, 'active', true);
            const layer = parseNumberField(block, vars, 'layer', 10, false);
            const collisionFields = parseGeneralCollisionFields(block, vars, false);
            const { updateMode, updateInterval } = parseUpdateFields(block, vars);

            return { name, pointA, pointB, color, colorExpr, thickness, thicknessExpr, interact, active, activeExpr: parseActiveExpr(block), layer, updateMode, updateInterval, ...collisionFields };
        }

        function parseFigureBlock(block, vars) {
            const name = parseStringField(block, vars, 'name');
            if (!name) return null;

            let elements = parsePointRefList(block, vars, 'elements');
            if (!elements) {
                const varNameMatch = block.match(/elements\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (varNameMatch) {
                    const varName = varNameMatch[1];
                    if (vars[varName] !== undefined && Array.isArray(vars[varName])) {
                        elements = vars[varName];
                    }
                }
            }
            if (!elements || elements.length === 0) return null;

            const rotate = parseNumberField(block, vars, 'rotate', 0, false);

            const size = parseNumberField(block, vars, 'size', 1.0, false);
            const sizeX = parseNumberField(block, vars, 'sizeX', null, false);
            const sizeY = parseNumberField(block, vars, 'sizeY', null, false);
            const flipX = parseBoolField(block, vars, 'flipX', false);
            const flipY = parseBoolField(block, vars, 'flipY', false);

            const interact = parseBoolField(block, vars, 'interact', true);

            const active = parseBoolField(block, vars, 'active', true);
            const collisionFields = parseGeneralCollisionFields(block, vars, false);

            return { name, elements, rotate, size, sizeX, sizeY, flipX, flipY, interact, active, ...collisionFields };
        }

// ---- Готовые объёмные примитивы (только для 3D-сцен) ----
// new Primitive { name, type, pos=(x,y,z), <размеры по типу>, color, opacity,
//                 wireframe, rotate=(rx,ry,rz), active, showInfo, textColor, textSize }
// Площадь и объём считаются аналитически на этапе компиляции (все размеры — числа
// или разрешённые в vars числовые переменные, как и у остальных блоков), поэтому
// в скомпилированный HTML попадают уже готовые значения, а не пересчёт в рантайме.
const PRIMITIVE_TYPES = ['cube', 'box', 'sphere', 'cylinder', 'cone', 'pyramid', 'prism',
                          'tetrahedron', 'octahedron', 'dodecahedron', 'icosahedron', 'torus'];
function parseXYZField(block, vars, field, def) {
    const m = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*\\(([^)]*)\\)'));
    if (m) {
        const coords = m[1].split(',').map(s => s.trim());
        if (coords.length === 2 || coords.length === 3) {
            let x = parseFloat(coords[0]);
            let y = parseFloat(coords[1]);
            let z = coords.length === 3 ? parseFloat(coords[2]) : 0;
            if (isNaN(x) && vars[coords[0]] !== undefined && typeof vars[coords[0]] === 'number') x = vars[coords[0]];
            if (isNaN(y) && vars[coords[1]] !== undefined && typeof vars[coords[1]] === 'number') y = vars[coords[1]];
            if (coords.length === 3 && isNaN(z) && vars[coords[2]] !== undefined && typeof vars[coords[2]] === 'number') z = vars[coords[2]];
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) return { x, y, z };
        }
    }
    return def;
}
function parsePrimitiveBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const typeMatch = block.match(new RegExp('(?:^|[^A-Za-z0-9_])type\\s*=\\s*(' + PRIMITIVE_TYPES.join('|') + ')\\b'));
    if (!typeMatch) return null;
    const type = typeMatch[1];

    const pos = parseXYZField(block, vars, 'pos', { x: 0, y: 0, z: 0 });
    const rotateDeg = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });

    const edge = parseNumberField(block, vars, 'edge', 2, false);
    const edgeExpr = captureExprField(block, 'edge');
    const width = parseNumberField(block, vars, 'width', edge, false);
    const widthExpr = captureExprField(block, 'width');
    const height = parseNumberField(block, vars, 'height', 2, false);
    const heightExpr = captureExprField(block, 'height');
    const depth = parseNumberField(block, vars, 'depth', edge, false);
    const depthExpr = captureExprField(block, 'depth');
    const radius = parseNumberField(block, vars, 'radius', 1.5, false);
    const radiusExpr = captureExprField(block, 'radius');
    const tube = parseNumberField(block, vars, 'tube', radius * 0.35, false);
    const tubeExpr = captureExprField(block, 'tube');
    let sides = parseNumberField(block, vars, 'sides', type === 'pyramid' ? 4 : 6, false);
    sides = Math.max(3, Math.min(32, Math.round(sides)));

    const color = parseColorField(block, vars, 'color', null);
    let opacity = parseNumberField(block, vars, 'opacity', 1, false);
    if (isNaN(opacity)) opacity = 1;
    opacity = Math.max(0, Math.min(1, opacity));
    const wireframe = parseBoolField(block, vars, 'wireframe', false);
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);
    const showInfo = parseBoolField(block, vars, 'showInfo', false);
    const textColor = parseColorField(block, vars, 'textColor', null);
    const textSize = parseNumberField(block, vars, 'textSize', 1, false);

    // ---- Аналитические формулы площади полной поверхности и объёма ----
    let volume = 0, area = 0;
    // Для THREE.ConeGeometry/CylinderGeometry с radialSegments = sides получаются
    // правильные пирамида/призма с описанной окружностью основания radius, поэтому
    // геометрические формулы ниже используют именно circumradius (R), а не сторону.
    const regularPolygon = (n, R) => {
        const side = 2 * R * Math.sin(Math.PI / n);
        const apothem = R * Math.cos(Math.PI / n);
        const baseArea = 0.5 * n * R * R * Math.sin(2 * Math.PI / n);
        return { side, apothem, baseArea, perimeter: n * side };
    };
    switch (type) {
        case 'cube':
            volume = edge ** 3;
            area = 6 * edge ** 2;
            break;
        case 'box':
            volume = width * height * depth;
            area = 2 * (width * height + height * depth + width * depth);
            break;
        case 'sphere':
            volume = (4 / 3) * Math.PI * radius ** 3;
            area = 4 * Math.PI * radius ** 2;
            break;
        case 'cylinder':
            volume = Math.PI * radius ** 2 * height;
            area = 2 * Math.PI * radius * (radius + height);
            break;
        case 'cone': {
            const slant = Math.sqrt(radius ** 2 + height ** 2);
            volume = (Math.PI * radius ** 2 * height) / 3;
            area = Math.PI * radius * (radius + slant);
            break;
        }
        case 'pyramid': {
            const { apothem, baseArea, perimeter } = regularPolygon(sides, radius);
            const slant = Math.sqrt(height ** 2 + apothem ** 2);
            volume = (baseArea * height) / 3;
            area = baseArea + 0.5 * perimeter * slant;
            break;
        }
        case 'prism': {
            const { baseArea, perimeter } = regularPolygon(sides, radius);
            volume = baseArea * height;
            area = 2 * baseArea + perimeter * height;
            break;
        }
        case 'tetrahedron':
            volume = edge ** 3 / (6 * Math.SQRT2);
            area = Math.sqrt(3) * edge ** 2;
            break;
        case 'octahedron':
            volume = (Math.SQRT2 / 3) * edge ** 3;
            area = 2 * Math.sqrt(3) * edge ** 2;
            break;
        case 'dodecahedron':
            volume = ((15 + 7 * Math.sqrt(5)) / 4) * edge ** 3;
            area = 3 * Math.sqrt(25 + 10 * Math.sqrt(5)) * edge ** 2;
            break;
        case 'icosahedron':
            volume = ((5 * (3 + Math.sqrt(5))) / 12) * edge ** 3;
            area = 5 * Math.sqrt(3) * edge ** 2;
            break;
        case 'torus':
            volume = 2 * Math.PI ** 2 * radius * tube ** 2;
            area = 4 * Math.PI ** 2 * radius * tube;
            break;
    }
    if (!isFinite(volume) || isNaN(volume)) volume = 0;
    if (!isFinite(area) || isNaN(area)) area = 0;

    const colorExpr = captureExprField(block, 'color');
    const opacityExpr = captureExprField(block, 'opacity');
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return {
        name, type, pos, rotateDeg,
        edge, edgeExpr, width, widthExpr, height, heightExpr, depth, depthExpr, radius, radiusExpr, tube, tubeExpr, sides,
        color, colorExpr, opacity, opacityExpr, wireframe, active, activeExpr, showInfo, textColor, textSize,
        updateMode, updateInterval,
        volume, area,
    };
}

// ---- Сечения (new Section) и булевы операции (new Boolean) над примитивами ----
// Оба блока — «производные» объекты: их геометрия строится в рантайме (в браузере)
// из уже построенных THREE-геометрий примитивов/других производных объектов,
// поэтому здесь на этапе компиляции разбираются только декларативные параметры.
// ---- Общая схема оформления объёмных элементов статистики ----
// Набор полей (palette / roughness / metalness / opacity / flatShading / segments) повторялся
// в каждом блоке отдельно, и с добавлением новых элементов расхождение только росло: где-то
// материал был захардкожен (у столбцов Histogram3D стоял фиксированный roughness = 0.5 без
// возможности настройки), где-то поля назывались одинаково, но разбирались по-своему.
// Один парсер на всех гарантирует, что "roughness" во всех блоках означает одно и то же.
// Значения по умолчанию — матовая поверхность: пользователю нужен объём, а не блики.
// ---- Общий разбор режима закрепления ----
// anchor = world  — элемент живёт в координатах поля: панорамирование и зум двигают его
//                   вместе со сценой, как любую точку или линию.
// anchor = screen — элемент закреплён относительно холста и не реагирует на камеру.
// Раньше режим был зашит в каждый элемент намертво и различался между ними без всякой
// системы, поэтому поле разбирается одним парсером на всех — как и схема оформления.
function parseAnchorField(block, defaultAnchor) {
    const m = block.match(/(?:^|[^A-Za-z0-9_])anchor\s*=\s*"?(world|screen)"?/);
    return m ? m[1] : (defaultAnchor || 'world');
}
// interactive = true — включает ручное редактирование элемента статистики поверх обычного
// (по умолчанию статического) режима: перетаскивание узлов графа, столбцов диаграммы, правка
// ячеек таблицы кликом. По умолчанию false — старые сцены не меняют поведение.
function parseInteractiveField(block, vars) {
    return parseBoolField(block, vars, 'interactive', false);
}
function parseVisualStyleFields(block, vars, overrides) {
    const o = overrides || {};
    return {
        palette: parseNameListField(block, 'palette'),
        roughness: parseNumberField(block, vars, 'roughness', (o.roughness !== undefined) ? o.roughness : 1, false),
        metalness: parseNumberField(block, vars, 'metalness', (o.metalness !== undefined) ? o.metalness : 0, false),
        opacity: parseNumberField(block, vars, 'opacity', (o.opacity !== undefined) ? o.opacity : 1, false),
        opacityExpr: captureExprField(block, 'opacity'),
        flatShading: parseBoolField(block, vars, 'flatShading', (o.flatShading !== undefined) ? o.flatShading : false),
        segments: parseNumberField(block, vars, 'segments', (o.segments !== undefined) ? o.segments : 16, false),
    };
}
function parseNameListField(block, field) {
    const inner = extractParenGroup(block, field);
    if (inner === null) return null;
    const items = splitTopLevelList(inner).map(s => s.trim()).filter(s => s.length > 0);
    return items.length > 0 ? items : null;
}
function parseSectionBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const sourceMatch = block.match(/(?:^|[^A-Za-z0-9_])source\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_]*)"?/);
    if (!sourceMatch) return null;
    const source = sourceMatch[1];

    let normal = parseXYZField(block, vars, 'normal', { x: 0, y: 1, z: 0 });
    const nlen = Math.hypot(normal.x, normal.y, normal.z) || 1;
    normal = { x: normal.x / nlen, y: normal.y / nlen, z: normal.z / nlen };

    let offset = parseNumberField(block, vars, 'offset', 0, false);
    // point = (x,y,z) — точка на плоскости сечения; если указана, offset пересчитывается
    // из неё (offset = normal · point) и имеет приоритет над явным offset.
    const point = parseXYZField(block, vars, 'point', null);
    if (point) offset = normal.x * point.x + normal.y * point.y + normal.z * point.z;

    const keepMatch = block.match(/(?:^|[^A-Za-z0-9_])keep\s*=\s*(positive|negative)\b/);
    const keep = keepMatch ? keepMatch[1] : 'positive';

    const explode = parseNumberField(block, vars, 'explode', 0, false);
    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    const capColor = parseColorField(block, vars, 'capColor', null);
    const capColorExpr = captureExprField(block, 'capColor');
    let opacity = parseNumberField(block, vars, 'opacity', 1, false);
    if (isNaN(opacity)) opacity = 1;
    opacity = Math.max(0, Math.min(1, opacity));
    const opacityExpr = captureExprField(block, 'opacity');
    const wireframe = parseBoolField(block, vars, 'wireframe', false);
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);
    const showInfo = parseBoolField(block, vars, 'showInfo', false);
    const hideSource = parseBoolField(block, vars, 'hideSource', true);
    const textColor = parseColorField(block, vars, 'textColor', null);
    const textSize = parseNumberField(block, vars, 'textSize', 1, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return {
        name, source, normal, offset, keep, explode,
        color, colorExpr, capColor, capColorExpr, opacity, opacityExpr, wireframe, active, activeExpr, showInfo, hideSource, textColor, textSize,
        updateMode, updateInterval,
    };
}
function parseBooleanBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const opMatch = block.match(/(?:^|[^A-Za-z0-9_])op\s*=\s*(union|intersect|subtract)\b/);
    if (!opMatch) return null;
    const op = opMatch[1];

    const parts = parseNameListField(block, 'parts');
    if (!parts || parts.length < 2) return null;

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    let opacity = parseNumberField(block, vars, 'opacity', 1, false);
    if (isNaN(opacity)) opacity = 1;
    opacity = Math.max(0, Math.min(1, opacity));
    const opacityExpr = captureExprField(block, 'opacity');
    const wireframe = parseBoolField(block, vars, 'wireframe', false);
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);
    const showInfo = parseBoolField(block, vars, 'showInfo', false);
    const hideSource = parseBoolField(block, vars, 'hideSource', true);
    const textColor = parseColorField(block, vars, 'textColor', null);
    const textSize = parseNumberField(block, vars, 'textSize', 1, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return { name, op, parts, color, colorExpr, opacity, opacityExpr, wireframe, active, activeExpr, showInfo, hideSource, textColor, textSize, updateMode, updateInterval };
}

// new Truncate — усечение вершин тела (как «усечённый куб», «усечённый тетраэдр» и т.п.):
// каждая вершина source среза́ется плоскостью, проходящей через точки на её рёбрах на
// расстоянии fraction (0..0.5) от вершины к соседям. Работает для ЛЮБОГО тела (Primitive,
// Section, Boolean, Hull, Minkowski — не только для правильных многогранников).
function parseTruncateBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const sourceMatch = block.match(/(?:^|[^A-Za-z0-9_])source\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_]*)"?/);
    if (!sourceMatch) return null;
    const source = sourceMatch[1];

    let fraction = parseNumberField(block, vars, 'fraction', 0.3, false);
    if (isNaN(fraction)) fraction = 0.3;
    fraction = Math.max(0.01, Math.min(0.5, fraction));

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    let opacity = parseNumberField(block, vars, 'opacity', 1, false);
    if (isNaN(opacity)) opacity = 1;
    opacity = Math.max(0, Math.min(1, opacity));
    const opacityExpr = captureExprField(block, 'opacity');
    const wireframe = parseBoolField(block, vars, 'wireframe', false);
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);
    const showInfo = parseBoolField(block, vars, 'showInfo', false);
    const hideSource = parseBoolField(block, vars, 'hideSource', true);
    const textColor = parseColorField(block, vars, 'textColor', null);
    const textSize = parseNumberField(block, vars, 'textSize', 1, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return { name, source, fraction, color, colorExpr, opacity, opacityExpr, wireframe, active, activeExpr, showInfo, hideSource, textColor, textSize, updateMode, updateInterval };
}

// new Hull — выпуклая оболочка объединённых вершин parts (одного или нескольких тел/точек).
// Полезно само по себе (напр. оболочка вокруг облака точек) и как строительный блок для
// Minkowski (сумма Минковского двух выпуклых тел = оболочка попарных сумм их вершин).
function parseHullBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const parts = parseNameListField(block, 'parts');
    if (!parts || parts.length < 1) return null;

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    let opacity = parseNumberField(block, vars, 'opacity', 1, false);
    if (isNaN(opacity)) opacity = 1;
    opacity = Math.max(0, Math.min(1, opacity));
    const opacityExpr = captureExprField(block, 'opacity');
    const wireframe = parseBoolField(block, vars, 'wireframe', false);
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);
    const showInfo = parseBoolField(block, vars, 'showInfo', false);
    const hideSource = parseBoolField(block, vars, 'hideSource', true);
    const textColor = parseColorField(block, vars, 'textColor', null);
    const textSize = parseNumberField(block, vars, 'textSize', 1, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return { name, parts, color, colorExpr, opacity, opacityExpr, wireframe, active, activeExpr, showInfo, hideSource, textColor, textSize, updateMode, updateInterval };
}

// new Minkowski — сумма Минковского parts (>=2 тел): A ⊕ B = { a + b : a ∈ A, b ∈ B }.
// Точна для ВЫПУКЛЫХ тел (тогда это ровно оболочка попарных сумм вершин — стандартный факт
// выпуклой геометрии); для невыпуклых тел (напр. Torus) даёт оболочку суммы, то есть
// приближение сверху, а не точную (тоже невыпуклую) сумму Минковского — это отдельная,
// значительно более сложная вычислительная задача.
function parseMinkowskiBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const parts = parseNameListField(block, 'parts');
    if (!parts || parts.length < 2) return null;

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    let opacity = parseNumberField(block, vars, 'opacity', 1, false);
    if (isNaN(opacity)) opacity = 1;
    opacity = Math.max(0, Math.min(1, opacity));
    const opacityExpr = captureExprField(block, 'opacity');
    const wireframe = parseBoolField(block, vars, 'wireframe', false);
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);
    const showInfo = parseBoolField(block, vars, 'showInfo', false);
    const hideSource = parseBoolField(block, vars, 'hideSource', true);
    const textColor = parseColorField(block, vars, 'textColor', null);
    const textSize = parseNumberField(block, vars, 'textSize', 1, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return { name, parts, color, colorExpr, opacity, opacityExpr, wireframe, active, activeExpr, showInfo, hideSource, textColor, textSize, updateMode, updateInterval };
}

// ---- Углы, специфичные для 3D (new Angle3D) ----
// В отличие от new Angle (плоский угол «вершина + два ребра», общий с 2D), эти четыре
// типа не сводятся к простому углу между двумя векторами из одной вершины — они
// определяются классическими формулами стереометрии:
//   lineLine   — угол между прямыми (в т.ч. скрещивающимися): между направляющими векторами,
//                берётся острый (0°, 90°];
//   linePlane  — угол между прямой и плоскостью: между прямой и её ортогональной проекцией
//                на плоскость (эквивалентно 90° − угол между прямой и нормалью), [0°, 90°];
//   planePlane — угол между плоскостями: между векторами внутри каждой плоскости,
//                перпендикулярными линии пересечения нормалей, острый [0°, 90°];
//   dihedral   — двугранный угол при ребре: между лучами, перпендикулярными ребру, по одному
//                в каждой грани — «настоящий» угол (0°, 180°), может быть тупым.
// Вершины/точки задаются либо именем существующей Point (тогда угол пересчитывается каждый
// кадр и следует за перетаскиванием — как у new Angle), либо литералом (x, y, z).
const ANGLE3D_TYPES = ['lineLine', 'linePlane', 'planePlane', 'dihedral', 'pointAngle', 'vectorVector', 'solid'];
function parseVertexRef3D(raw, vars) {
    if (raw === undefined || raw === null) return null;
    let s = String(raw).trim();
    if (s === '') return null;
    const coordMatch = s.match(/^\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)$/);
    if (coordMatch) {
        let x = parseFloat(coordMatch[1]);
        let y = parseFloat(coordMatch[2]);
        let z = parseFloat(coordMatch[3]);
        if (isNaN(x) && typeof vars[coordMatch[1]] === 'number') x = vars[coordMatch[1]];
        if (isNaN(y) && typeof vars[coordMatch[2]] === 'number') y = vars[coordMatch[2]];
        if (isNaN(z) && typeof vars[coordMatch[3]] === 'number') z = vars[coordMatch[3]];
        if (isNaN(x) || isNaN(y) || isNaN(z)) return null;
        return { pos: { x, y, z } };
    }
    return { point: s };
}
function matchVertexRefRaw3D(block, field) {
    const m = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*(\\([^)]*\\)|[a-zA-Z_][a-zA-Z0-9_]*)'));
    return m ? m[1] : null;
}
function parseVertexRefField3D(block, vars, field) {
    return parseVertexRef3D(matchVertexRefRaw3D(block, field), vars);
}
function parseVertexRefListField3D(block, vars, field) {
    const inner = extractParenGroup(block, field);
    if (inner === null) return null;
    const items = splitTopLevelList(inner);
    const refs = items.map(it => parseVertexRef3D(it, vars));
    return refs.every(r => r !== null) ? refs : null;
}
function parseAngle3DBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const typeMatch = block.match(new RegExp('(?:^|[^A-Za-z0-9_])type\\s*=\\s*(' + ANGLE3D_TYPES.join('|') + ')\\b'));
    if (!typeMatch) return null;
    const type = typeMatch[1];

    let refs = null;
    if (type === 'lineLine') {
        const line1 = parseVertexRefListField3D(block, vars, 'line1');
        const line2 = parseVertexRefListField3D(block, vars, 'line2');
        if (line1 && line1.length === 2 && line2 && line2.length === 2) {
            refs = { a: line1[0], b: line1[1], c: line2[0], d: line2[1] };
        }
    } else if (type === 'linePlane') {
        const line = parseVertexRefListField3D(block, vars, 'line');
        const plane = parseVertexRefListField3D(block, vars, 'plane');
        if (line && line.length === 2 && plane && plane.length === 3) {
            refs = { a: line[0], b: line[1], c: plane[0], d: plane[1], e: plane[2] };
        }
    } else if (type === 'planePlane') {
        const plane1 = parseVertexRefListField3D(block, vars, 'plane1');
        const plane2 = parseVertexRefListField3D(block, vars, 'plane2');
        if (plane1 && plane1.length === 3 && plane2 && plane2.length === 3) {
            refs = { a: plane1[0], b: plane1[1], c: plane1[2], d: plane2[0], e: plane2[1], f: plane2[2] };
        }
    } else if (type === 'dihedral') {
        const edge = parseVertexRefListField3D(block, vars, 'edge');
        const point1 = parseVertexRefField3D(block, vars, 'point1');
        const point2 = parseVertexRefField3D(block, vars, 'point2');
        if (edge && edge.length === 2 && point1 && point2) {
            refs = { a: edge[0], b: edge[1], c: point1, d: point2 };
        }
    } else if (type === 'pointAngle') {
        // Самый распространённый бытовой случай — угол ABC по трём точкам (вершина B,
        // лучи к A и C), без необходимости заранее строить отдельные Line3D — раньше в 3D
        // такого удобного варианта не было вовсе, только через lineLine.
        const vertex = parseVertexRefField3D(block, vars, 'vertex');
        const point1 = parseVertexRefField3D(block, vars, 'point1');
        const point2 = parseVertexRefField3D(block, vars, 'point2');
        if (vertex && point1 && point2) {
            refs = { a: vertex, b: point1, c: point2 };
        }
    } else if (type === 'vectorVector') {
        // Угол между двумя ИМЕНОВАННЫМИ векторами (draw Vector) — в отличие от lineLine,
        // векторы направленные: показывается настоящий угол между направлениями (0..180°),
        // без принудительного приведения к острому (у lineLine линии ненаправленные, поэтому
        // там всегда берётся угол <= 90°; см. computeAngle3D).
        const vec1M = block.match(/(?:^|[^A-Za-z0-9_])vec1\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_]*)"?/);
        const vec2M = block.match(/(?:^|[^A-Za-z0-9_])vec2\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_]*)"?/);
        if (vec1M && vec2M) refs = { vec1: vec1M[1], vec2: vec2M[1] };
    } else if (type === 'solid') {
        // Телесный угол (стерадианы) — сколько "видно" из вершины через многоугольник rays
        // (>=3 точек). Раньше в 3D телесных углов не было вовсе — только плоские.
        const vertex = parseVertexRefField3D(block, vars, 'vertex');
        const rays = parseVertexRefListField3D(block, vars, 'rays');
        if (vertex && rays && rays.length >= 3) refs = { vertex: vertex, rays: rays };
    }
    if (!refs) return null;

    const vertexOverride = parseVertexRefField3D(block, vars, 'vertex');

    let radius = parseNumberField(block, vars, 'radius', 1, false);
    if (isNaN(radius) || radius <= 0) radius = 1;
    const showArc = parseBoolField(block, vars, 'arc', true);
    const showMeasure = parseBoolField(block, vars, 'measure', true);
    const fractions = parseBoolField(block, vars, 'fractions', false);
    let count = parseNumberField(block, vars, 'count', 1, false);
    count = Math.min(3, Math.max(1, Math.round(isNaN(count) ? 1 : count)));
    const arccolor = parseColorField(block, vars, 'arccolor', null);
    const measurecolor = parseColorField(block, vars, 'measurecolor', null);
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);

    return { name, type, refs, vertexOverride, radius, showArc, showMeasure, fractions, count, arccolor, measurecolor, active, activeExpr };
}

function parseCircleBlock(block, vars) {
    // Ищем name
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    // Ищем type
    let type = null;
    const typeMatch = block.match(/type\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (typeMatch) {
        type = typeMatch[1];
    } else {
        if (block.match(/center\s*=/)) type = 'FromRadius';
        else if (block.match(/points\s*=/)) type = 'FromPoints';
    }
    if (!type) return null;

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    const thickness = parseNumberField(block, vars, 'thickness', 1.5, false);
    const thicknessExpr = captureExprField(block, 'thickness');

    if (type === 'FromRadius') {
        const centerName = parsePointRefField(block, vars, 'center');
        if (!centerName) return null;

        let radius = null;
        let radiusExpr = null;
        // Ищем радиус: число (включая отрицательные и научную запись — см. parseNumberField),
        // точка по имени, или буквальные координаты (x, y)
        const radiusRaw = block.match(/radius\s*=\s*(\([^)]*\)|"[^"]*"|-?[\d.]+(?:[eE][+-]?\d+)?|[a-zA-Z_][a-zA-Z0-9_]*)/);
        if (radiusRaw) {
            const r = radiusRaw[1];
            if (!isNaN(parseFloat(r))) {
                radius = Math.abs(parseFloat(r)); // отрицательное число — не ошибка, а модуль (радиус не бывает отрицательным)
            } else if (vars[r] !== undefined && typeof vars[r] === 'number') {
                // Переменная-число: раньше подставлялась один раз при компиляции и больше не
                // менялась. Сохраняем и как живое выражение — updateCircles() пересчитывает его
                // каждый кадр, как уже давно делает для радиуса-через-точку (см. ниже).
                radius = Math.abs(vars[r]);
                radiusExpr = r;
            } else {
                radius = resolvePointRef(r, vars); // имя точки (или буквальные координаты) — радиус = расстояние до неё
            }
        }
        if (radius === null) return null;
        const layer = parseNumberField(block, vars, 'layer', 20, false);
        const collisionFields = parseGeneralCollisionFields(block, vars, false);
        const { updateMode, updateInterval } = parseUpdateFields(block, vars);
        // active = false — вспомогательная (невидимая) окружность, например траектория или
        // опора для точек; раньше поле не читалось, и такая окружность всё равно рисовалась.
        return { name, type, centerName, radius, radiusExpr, color, colorExpr, thickness, thicknessExpr, layer, active: parseBoolField(block, vars, 'active', true), activeExpr: parseActiveExpr(block), updateMode, updateInterval, ...collisionFields };
    } else if (type === 'FromPoints') {
        let pointNames = parsePointRefList(block, vars, 'points');
        if (!pointNames) {
            const varMatch = block.match(/points\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (varMatch) {
                const v = varMatch[1];
                if (vars[v] !== undefined && Array.isArray(vars[v])) {
                    pointNames = vars[v];
                }
            }
        }
        if (!pointNames || pointNames.length !== 3) return null;
        const layer = parseNumberField(block, vars, 'layer', 20, false);
        const collisionFields = parseGeneralCollisionFields(block, vars, false);
        const { updateMode, updateInterval } = parseUpdateFields(block, vars);
        return { name, type, pointNames, color, colorExpr, thickness, thicknessExpr, layer, active: parseBoolField(block, vars, 'active', true), activeExpr: parseActiveExpr(block), updateMode, updateInterval, ...collisionFields };
    }
    return null;
}

// Arc — часть окружности, задаётся динамически позициями точек (центр, радиус, направления начала/конца)
function parseArcBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let type = null;
    const typeMatch = block.match(/type\s*=\s*"?(ThreePoints|CenterRadius)"?/);
    if (typeMatch) type = typeMatch[1];
    else if (block.match(/points\s*=/)) type = 'ThreePoints';
    else type = 'CenterRadius';

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const thicknessExpr = captureExprField(block, 'thickness');
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    const common = { name, type, color, colorExpr, thickness, thicknessExpr, active, layer, updateMode, updateInterval, ...parseGeneralCollisionFields(block, vars, false) };

    if (type === 'ThreePoints') {
        const pointNames = parsePointRefList(block, vars, 'points');
        if (!pointNames || pointNames.length !== 3) return null;
        return { ...common, pointNames };
    }

    const centerName = parsePointRefField(block, vars, 'center');
    if (!centerName) return null;

    let radius = null;
    let radiusExpr = null;
    const radiusRaw = block.match(/radius\s*=\s*(\([^)]*\)|"[^"]*"|-?[\d.]+(?:[eE][+-]?\d+)?|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (radiusRaw) {
        const r = radiusRaw[1];
        if (!isNaN(parseFloat(r))) radius = Math.abs(parseFloat(r)); // отрицательное число — не ошибка, а модуль
        else if (vars[r] !== undefined && typeof vars[r] === 'number') { radius = Math.abs(vars[r]); radiusExpr = r; }
        else radius = resolvePointRef(r, vars); // радиус = расстояние от центра до этой точки
    }

    const from = parsePointRefField(block, vars, 'from');
    const to = parsePointRefField(block, vars, 'to');
    if (radius === null || !from || !to) return null;

    return { ...common, centerName, radius, radiusExpr, from, to };
}

// Ellipse — интерактивный объект: центр (точка) + полуоси a/b (число или выражение) + поворот
function parseEllipseBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let type = null;
    const typeMatch = block.match(/type\s*=\s*"?(FromPoints|ByFoci|FromCenter)"?/);
    if (typeMatch) type = typeMatch[1];
    else if (block.match(/points\s*=/)) type = 'FromPoints';
    else if (block.match(/focus1\s*=/)) type = 'ByFoci';
    else type = 'FromCenter';

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const thicknessExpr = captureExprField(block, 'thickness');
    const active = parseBoolField(block, vars, 'active', true);
    const dynamic = parseBoolField(block, vars, 'dynamic', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    const common = { name, type, color, colorExpr, thickness, thicknessExpr, active, dynamic, layer, updateMode, updateInterval, ...parseGeneralCollisionFields(block, vars, false) };

    if (type === 'FromPoints') {
        const pointNames = parsePointRefList(block, vars, 'points');
        if (!pointNames || pointNames.length !== 5) return null;
        return { ...common, pointNames };
    }
    if (type === 'ByFoci') {
        const focus1 = parsePointRefField(block, vars, 'focus1');
        const focus2 = parsePointRefField(block, vars, 'focus2');
        const aMatch = block.match(/(?:^|[^A-Za-z0-9_])\s*a\s*=\s*([^,;\n]+)/);
        if (!focus1 || !focus2 || !aMatch) return null;
        return { ...common, focus1, focus2, aExpr: aMatch[1].trim() };
    }

    // FromCenter (по умолчанию)
    const centerName = parsePointRefField(block, vars, 'center');
    if (!centerName) return null;
    const aMatch = block.match(/(?:^|[^A-Za-z0-9_])\s*a\s*=\s*([^,;\n]+)/);
    const bMatch = block.match(/(?:^|[^A-Za-z0-9_])\s*b\s*=\s*([^,;\n]+)/);
    if (!aMatch || !bMatch) return null;
    const rotate = parseNumberField(block, vars, 'rotate', 0, false);
    return { ...common, centerName, aExpr: aMatch[1].trim(), bExpr: bMatch[1].trim(), rotate };
}

// Curve — кривая Безье (по контрольным точкам) или параметрическая (x(t), y(t) на мини-языке)
function parseCurveBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let type = 'bezier';
    const typeMatch = block.match(/type\s*=\s*(bezier|parametric|spiral|cycloid|involute)/);
    if (typeMatch) type = typeMatch[1];

    let controlPoints = null, xExpr = null, yExpr = null, zExpr = null;
    let centerName = null, curveA = null, curveB = null, curveRadius = null, turns = null;
    if (type === 'bezier') {
        controlPoints = parsePointRefList(block, vars, 'points');
        if (!controlPoints || controlPoints.length < 2 || controlPoints.length > 4) return null;
    } else if (type === 'parametric') {
        const xQuoted = block.match(/(?:^|[^A-Za-z0-9_])x\s*=\s*"([^"]*)"/);
        const yQuoted = block.match(/(?:^|[^A-Za-z0-9_])y\s*=\s*"([^"]*)"/);
        // z(t) — опциональна, задаёт третью координату для 3D-сцен; в 2D игнорируется.
        const zQuoted = block.match(/(?:^|[^A-Za-z0-9_])z\s*=\s*"([^"]*)"/);
        xExpr = xQuoted ? xQuoted[1].trim() : captureExprField(block, 'x');
        yExpr = yQuoted ? yQuoted[1].trim() : captureExprField(block, 'y');
        zExpr = zQuoted ? zQuoted[1].trim() : null;
        if (xExpr === null || yExpr === null || xExpr === '' || yExpr === '') return null;
    } else {
        // spiral / cycloid / involute — предопределённые кривые вокруг опорной точки (интерактивна через её перетаскивание)
        centerName = parsePointRefField(block, vars, 'center') || parsePointRefField(block, vars, 'start');
        if (!centerName) return null;
        turns = parseNumberField(block, vars, 'turns', 3, false);
        if (type === 'spiral') {
            curveA = parseNumberField(block, vars, 'a', 0, false);
            curveB = parseNumberField(block, vars, 'b', 1, false);
        } else {
            curveRadius = parseNumberField(block, vars, 'radius', 2, false);
        }
    }
    const turnsExpr = captureExprField(block, 'turns');
    const curveAExpr = captureExprField(block, 'a');
    const curveBExpr = captureExprField(block, 'b');
    const curveRadiusExpr = captureExprField(block, 'radius');

    const segments = parseNumberField(block, vars, 'segments', 50, false);
    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const thicknessExpr = captureExprField(block, 'thickness');
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const collisionFields = parseGeneralCollisionFields(block, vars, false);
    // Дифференциальная геометрия САМОЙ кривой (не путать с torsion в bettiNumbers/homology —
    // это про группы гомологий симплициальных комплексов, а тут — кручение пространственной
    // кривой). Только для 3D-кривых (нужен z(t) либо 3D control points): colorBy красит линию
    // по кривизне/кручению (численно, центральными разностями), showFrenet рисует репер Френе
    // (T/N/B) в нескольких точках вдоль кривой — см. gcCurveDerivatives3D в generate3D.
    const colorByM = block.match(/(?:^|[^A-Za-z0-9_])colorBy\s*=\s*"?(none|curvature|torsion)"?/);
    const colorBy = colorByM ? colorByM[1] : 'none';
    const showFrenet = parseBoolField(block, vars, 'showFrenet', false);
    const frenetCount = parseNumberField(block, vars, 'frenetCount', 8, false);
    const frenetScale = parseNumberField(block, vars, 'frenetScale', null, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return {
        name, type, controlPoints, xExpr, yExpr, zExpr, segments, color, colorExpr, thickness, thicknessExpr, active, activeExpr: parseActiveExpr(block), layer,
        centerName, a: curveA, aExpr: curveAExpr, b: curveB, bExpr: curveBExpr, radius: curveRadius, radiusExpr: curveRadiusExpr,
        turns, turnsExpr, colorBy, showFrenet, frenetCount, frenetScale, updateMode, updateInterval, ...collisionFields
    };
}

// draw Function — график функции одной переменной, объявленной через func
function parseFunctionGraphBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const fMatch = block.match(/f\s*=\s*"([^"]*)"/);
    if (!fMatch) return null;
    const funcName = fMatch[1];

    const xminGiven = /(?:^|[^A-Za-z0-9_])xmin\s*=/.test(block);
    const xmaxGiven = /(?:^|[^A-Za-z0-9_])xmax\s*=/.test(block);
    const xmin = parseNumberField(block, vars, 'xmin', -10, false);
    const xmax = parseNumberField(block, vars, 'xmax', 10, false);
    const segments = parseNumberField(block, vars, 'segments', 100, false);
    const color = parseColorField(block, vars, 'color', null);
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const grid = parseBoolField(block, vars, 'grid', false);
    const gridStep = parseNumberField(block, vars, 'gridStep', 1, false);
    // Продление за пределы видимой камеры (Задача 8): по умолчанию включено, если xmin/xmax
    // не заданы явно — тогда график тянется до края текущего видимого поля (с запасом
    // extendDistance), а не обрывается на жёстко заданных ±10. Задать extend = false, чтобы
    // вернуть старое поведение с фиксированным диапазоном.
    const extend = parseBoolField(block, vars, 'extend', !xminGiven && !xmaxGiven);
    const extendDistance = parseNumberField(block, vars, 'extendDistance', null, false);
    // mode = manual (по умолчанию) — диапазон и число сегментов ровно те, что заданы (или extend,
    // как раньше). mode = auto — диапазон ВСЕГДА равен текущей видимой части камеры (без запаса),
    // а число сегментов пересчитывается каждый кадр так, чтобы примерно на каждые 2 пикселя
    // холста приходился один сэмпл — то есть детализация сама растёт при приближении камеры
    // и падает при отдалении, без участия автора скрипта.
    const modeMatch = block.match(/(?:^|[^A-Za-z0-9_])mode\s*=\s*"?(auto|manual)"?/);
    const mode = modeMatch ? modeMatch[1] : 'manual';
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return { name, funcName, xmin, xmax, segments, color, thickness, active, layer, grid, gridStep, extend, extendDistance, mode, updateMode, updateInterval };
}

// draw Surface — график функции двух переменных: contour (изолинии) или псевдо-3D (в 2D);
// в 3D дополнительно поддерживается настоящая параметрическая поверхность x(u,v), y(u,v), z(u,v) —
// та же конвенция полей x/y/z, что у параметрической кривой (new Curve { type = parametric }),
// только с двумя параметрами u, v вместо одного t.
function parseSurfaceBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    // type = "implicit" — неявная поверхность f(x, y, z) = level (marching cubes, только 3D);
    // f ссылается на обычную функцию трёх переменных (func f(x, y, z) = ...;), как и funcName
    // у heightfield-поверхностей ссылается на функцию двух переменных.
    let type = 'heightfield';
    const typeMatch = block.match(/type\s*=\s*"?(heightfield|parametric|implicit)"?/);
    if (typeMatch) type = typeMatch[1];

    const fMatch = block.match(/f\s*=\s*"([^"]*)"/);
    const funcName = fMatch ? fMatch[1] : null;

    let xExpr = null, yExpr = null, zExpr = null;
    if (type === 'parametric') {
        const xQuoted = block.match(/(?:^|[^A-Za-z0-9_])x\s*=\s*"([^"]*)"/);
        const yQuoted = block.match(/(?:^|[^A-Za-z0-9_])y\s*=\s*"([^"]*)"/);
        const zQuoted = block.match(/(?:^|[^A-Za-z0-9_])z\s*=\s*"([^"]*)"/);
        xExpr = xQuoted ? xQuoted[1].trim() : null;
        yExpr = yQuoted ? yQuoted[1].trim() : null;
        zExpr = zQuoted ? zQuoted[1].trim() : null;
        if (!xExpr || !yExpr || !zExpr) return null;
    } else {
        if (!funcName) return null;
    }

    const xmin = parseNumberField(block, vars, 'xmin', -5, false);
    const xmax = parseNumberField(block, vars, 'xmax', 5, false);
    const ymin = parseNumberField(block, vars, 'ymin', -5, false);
    const ymax = parseNumberField(block, vars, 'ymax', 5, false);
    // zmin/zmax — только для implicit (третье измерение вокселя marching cubes); для
    // heightfield/parametric не используется, но парсится всегда единообразно.
    const zmin = parseNumberField(block, vars, 'zmin', -5, false);
    const zmax = parseNumberField(block, vars, 'zmax', 5, false);
    // umin/umax/vmin/vmax — область определения параметров u, v для параметрической поверхности
    const umin = parseNumberField(block, vars, 'umin', -5, false);
    const umax = parseNumberField(block, vars, 'umax', 5, false);
    const vmin = parseNumberField(block, vars, 'vmin', -5, false);
    const vmax = parseNumberField(block, vars, 'vmax', 5, false);
    // grid — сторона сетки; для heightfield/parametric до 80, для implicit клэмпится ниже
    // (до 40) из-за кубической стоимости marching cubes (n^3 вызовов f за кадр).
    const grid = parseNumberField(block, vars, 'grid', 20, false);
    let mode = 'contour';
    const modeMatch = block.match(/mode\s*=\s*"?(contour|3d)"?/);
    if (modeMatch) mode = modeMatch[1];
    const color = parseColorField(block, vars, 'color', null);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const angle = parseNumberField(block, vars, 'angle', 30, false);
    // levels — число изолиний; level — ОДНА конкретная изолиния.
    // level = 0 превращает контурный режим в построение неявной кривой f(x, y) = 0.
    const levels = parseNumberField(block, vars, 'levels', 8, false);
    const level = parseNumberField(block, vars, 'level', null, false);
    // Прозрачность поверхности в 3D (та же конвенция, что у draw Filling); в 2D не используется.
    let opacity = parseNumberField(block, vars, 'opacity', 0.85, false);
    if (opacity < 0) opacity = 0;
    if (opacity > 1) opacity = 1;
    const colorExpr = captureExprField(block, 'color');
    const opacityExpr = captureExprField(block, 'opacity');
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return { name, type, funcName, xExpr, yExpr, zExpr, xmin, xmax, ymin, ymax, zmin, zmax, umin, umax, vmin, vmax, grid, mode, color, colorExpr, opacity, opacityExpr, active, activeExpr: parseActiveExpr(block), layer, angle, levels, level, updateMode, updateInterval };
}

// draw Chart — диаграммы: scatter / line строятся в координатах поля,
// bar / pie / box — в прямоугольнике (pos + width/height либо radius).
//   draw Chart { name = "s", type = scatter, data = pts, regression = true };
function parseChartBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const typeM = block.match(/(?:^|[^A-Za-z0-9_])type\s*=\s*"?(scatter|line|bar|pie|box)"?/);
    const type = typeM ? typeM[1] : 'scatter';
    const dataExpr = captureQuotableExprField(block, 'data');
    if (dataExpr === null) return null;
    const labelsExpr = captureQuotableExprField(block, 'labels');
    // 3D-альтернатива (билборд-панель): pos = (x, y, z) — три ЛИТЕРАЛЬНЫХ числа (в отличие
    // от прежнего 2D pos = (exprX, exprY), где выражения пересчитываются каждый кадр — см.
    // parseImageBlock/parseHistogramBlock, та же конвенция статичной позиции для 3D-объектов).
    let dim = '2D', posXExpr = null, posYExpr = null, pos3D = null, rotate3D = null, billboard = true;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = splitTopLevelList(posMatch[1]);
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0].trim(), vars),
                    y: evaluateNumericExpression(parts[1].trim(), vars),
                    z: evaluateNumericExpression(parts[2].trim(), vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        } else if (parts.length === 2) {
            posXExpr = parts[0].trim(); posYExpr = parts[1].trim();
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    return {
        anchor: parseAnchorField(block, 'world'),
        name, type, dataExpr, labelsExpr, posXExpr, posYExpr, dim, pos3D, rotate3D, billboard,
        width: parseNumberField(block, vars, 'width', 10, false),
        height: parseNumberField(block, vars, 'height', 6, false),
        radius: parseNumberField(block, vars, 'radius', 4, false),
        pointSize: parseNumberField(block, vars, 'pointSize', 4, false),
        color: parseColorField(block, vars, 'color', '#4a90d9'),
        colorExpr: captureExprField(block, 'color'),
        regression: parseBoolField(block, vars, 'regression', false),
        showValues: parseBoolField(block, vars, 'showValues', false),
        showAxes: parseBoolField(block, vars, 'showAxes', true),
        markers: parseBoolField(block, vars, 'markers', false),
        horizontal: parseBoolField(block, vars, 'horizontal', false),
        // volume = true — рисовать НАСТОЯЩЕЕ тело вместо растровой билборд-панели. Панель
        // остаётся поведением по умолчанию, потому что для scatter/line она разумна, а вот
        // круговая и столбчатая в объёме — это то, ради чего вообще заводят 3D. Сектора
        // строятся выдавливанием THREE.Shape, поэтому у них есть и боковые стенки, и
        // крышки, а не только видимость толщины.
        volume: parseBoolField(block, vars, 'volume', false),
        thickness: parseNumberField(block, vars, 'thickness', 1, false),
        explode: parseNumberField(block, vars, 'explode', 0, false),
        startAngle: parseNumberField(block, vars, 'startAngle', 0, false),
        innerRadius: parseNumberField(block, vars, 'innerRadius', 0, false),

        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', 22, false),
        // Подписи объёмных диаграмм. Порядок альтернатив в регулярке значим: label+value
        // должно проверяться РАНЬШЕ label, иначе чередование остановится на коротком
        // совпадении и "+value" будет молча отброшено.
        // labelFormat = auto означает: показать текст из labels,
        // если он задан, и добавить долю в процентах, если включён showValues. Явные значения
        // (label / value / percent / label+value / label+percent) перекрывают это правило.
        labelFormat: (block.match(/(?:^|[^A-Za-z0-9_])labelFormat\s*=\s*"?(label\+value|label\+percent|auto|none|label|value|percent)"?/) || [null, 'auto'])[1],
        labelSize: parseNumberField(block, vars, 'labelSize', 1, false),
        labelColor: parseColorField(block, vars, 'labelColor', null),
        // Доля радиуса, на которой стоит подпись: >1 выносит её за край диаграммы.
        labelOffset: parseNumberField(block, vars, 'labelOffset', 1.18, false),
        labelDigits: parseNumberField(block, vars, 'labelDigits', 0, false),
        // Круговой нужна заметно более гладкая дуга, чем маркеру-сфере, поэтому segments
        // по умолчанию выше общего значения — остальные поля схемы стандартные.
        ...parseVisualStyleFields(block, vars, { segments: 64 }),
        interactive: parseInteractiveField(block, vars),
        ...parseUpdateFields(block, vars),
    };
}

// draw Tree — дерево из вложенных списков [метка, [потомки...]].
// Хорошо сочетается с exprTree(): draw Tree { data = exprTree("x^2 + 1") };
function parseTreeBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const dataExpr = captureQuotableExprField(block, 'data');
    if (dataExpr === null) return null;
    let posXExpr = '0', posYExpr = '0';
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = splitTopLevelList(posMatch[1]);
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0].trim(), vars),
                    y: evaluateNumericExpression(parts[1].trim(), vars),
                    z: evaluateNumericExpression(parts[2].trim(), vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        } else if (parts.length === 2) {
            posXExpr = parts[0].trim(); posYExpr = parts[1].trim();
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    return {
        anchor: parseAnchorField(block, 'world'),
        name, dataExpr, posXExpr, posYExpr, dim, pos3D, rotate3D, billboard,
        spacing: parseNumberField(block, vars, 'spacing', 2.2, false),
        levelGap: parseNumberField(block, vars, 'levelGap', 2.2, false),
        nodeRadius: parseNumberField(block, vars, 'nodeRadius', 11, false),
        // color/labelColor — нейтральные (текст узла, подпись), близкие к чёрному/белому:
        // default для них означает "взять цвет темы", резолвится динамически при каждой
        // перерисовке через __gcDefaultColor() — см. drawTreeDiagram. edgeColor (линии
        // связей) — сознательно оставлен фиксированным серо-голубым, это не чёрный/белый.
        color: parseColorField(block, vars, 'color', null),
        colorExpr: captureExprField(block, 'color'),
        edgeColor: parseColorField(block, vars, 'edgeColor', '#90a4ae'),
        edgeColorExpr: captureExprField(block, 'edgeColor'),
        labelColor: parseColorField(block, vars, 'labelColor', null),
        boxed: parseBoolField(block, vars, 'boxed', false),
        panelWidth: parseNumberField(block, vars, 'panelWidth', 8, false),
        panelHeight: parseNumberField(block, vars, 'panelHeight', 6, false),
        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', 22, false),
        ...parseUpdateFields(block, vars),
    };
}

// draw Table — таблица из двумерного списка, привязанная к координатам поля.
function parseTableBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const dataExpr = captureQuotableExprField(block, 'data');
    if (dataExpr === null) return null;
    let posXExpr = '0', posYExpr = '0';
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = splitTopLevelList(posMatch[1]);
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0].trim(), vars),
                    y: evaluateNumericExpression(parts[1].trim(), vars),
                    z: evaluateNumericExpression(parts[2].trim(), vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        } else if (parts.length === 2) {
            posXExpr = parts[0].trim(); posYExpr = parts[1].trim();
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    const alignM = block.match(/(?:^|[^A-Za-z0-9_])align\s*=\s*"?(left|center|right)"?/);
    return {
        // Оба режима закрепления доступны и здесь: world (по умолчанию —
        // прежнее поведение) и screen.
        anchor: parseAnchorField(block, 'world'),
        name, dataExpr, posXExpr, posYExpr, dim, pos3D, rotate3D, billboard,
        cellWidth: parseNumberField(block, vars, 'cellWidth', 3, false),
        cellHeight: parseNumberField(block, vars, 'cellHeight', 1.4, false),
        header: parseBoolField(block, vars, 'header', true),
        borders: parseBoolField(block, vars, 'borders', true),
        align: alignM ? alignM[1] : 'center',
        color: parseColorField(block, vars, 'color', null),
        colorExpr: captureExprField(block, 'color'),
        // ИСКЛЮЧЕНИЕ из правила "близко к чёрному/белому -> за темой": headerBg — это ЗАЛИВКА
        // ФОНА шапки, а не цвет текста. Подпись в шапке красится тем же d.color ||
        // __gcDefaultColor(), что и обычные ячейки (см. drawTable) — если бы фон шапки ТОЖЕ
        // стал __gcDefaultColor(), в дефолтном виде (color тоже default) текст оказался бы
        // ровно того же цвета, что фон, и подпись стала бы невидимой. Оставлен фиксированным
        // светло-серым: он остаётся читаемой подложкой в обеих темах, а не автоцветом.
        headerBg: parseColorField(block, vars, 'headerBg', '#eceff1'),
        borderColor: parseColorField(block, vars, 'borderColor', '#90a4ae'),
        fontSize: parseNumberField(block, vars, 'fontSize', 1, false),
        panelWidth: parseNumberField(block, vars, 'panelWidth', 8, false),
        panelHeight: parseNumberField(block, vars, 'panelHeight', 5, false),
        interactive: parseInteractiveField(block, vars),
        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', 22, false),
        ...parseUpdateFields(block, vars),
    };
}

// draw Formula — математическая формула в нотации LaTeX, размещённая в координатах поля.
// Рендерится KaTeX в HTML-слое поверх холста (на canvas нативной поддержки LaTeX нет).
// Поле latex — ВЫРАЖЕНИЕ мини-языка, поэтому формула может пересчитываться каждый кадр:
//   draw Formula { name = "f1", pos = (A.pos.x, A.pos.y), latex = diffLatex("x^2", "x") };
function parseFormulaBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    let posXExpr = null, posYExpr = null;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = splitTopLevelList(posMatch[1]);
        if (parts.length === 2) { posXExpr = parts[0].trim(); posYExpr = parts[1].trim(); }
    } else {
        const vm2 = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (vm2) { posXExpr = vm2[1] + '.pos.x'; posYExpr = vm2[1] + '.pos.y'; }
    }
    if (!posXExpr || !posYExpr) return null;
    // latex = <выражение> либо text = <выражение> (алиас)
    let latexExpr = captureExprField(block, 'latex');
    if (latexExpr === null) latexExpr = captureExprField(block, 'text');
    if (latexExpr === null) return null;
    const size = parseNumberField(block, vars, 'size', 1, false);
    const sizeExpr = captureExprField(block, 'size');
    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    const bg = parseColorField(block, vars, 'background', 'transparent');
    const alignM = block.match(/(?:^|[^A-Za-z0-9_])align\s*=\s*"?(left|center|right)"?/);
    const align = alignM ? alignM[1] : 'center';
    const display = parseBoolField(block, vars, 'display', false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 60, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, posXExpr, posYExpr, latexExpr, size, sizeExpr, color, colorExpr, bg, align, display, active, layer, updateMode, updateInterval };
}

// draw Distribution — готовые визуализации распределений вероятностей, без необходимости
// вручную писать func f(x) = normalPdf(x, mu, sigma); и draw Function поверх неё.
// type = normal (кривая плотности, mu/sigma) | uniform (mu/sigma заменяются на a/b) |
// exponential (lambda) — непрерывные, рисуются кривой с заливкой под ней;
// type = binomial (n, p) | poisson (lambda) — дискретные, рисуются столбцами по k = 0..kmax.
// highlightFrom/highlightTo — необязательная подсветка области другим цветом: для непрерывных
// это P(highlightFrom <= X <= highlightTo) (заливка под частью кривой), для дискретных —
// столбцы k из диапазона [highlightFrom, highlightTo] закрашиваются highlightColor.
function parseDistributionBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let type = 'normal';
    const typeMatch = block.match(/(?:^|[^A-Za-z0-9_])type\s*=\s*"?(normal|binomial|poisson|uniform|exponential)"?/);
    if (typeMatch) type = typeMatch[1];

    // Параметры распределения — набор полей зависит от типа, лишние поля просто игнорируются.
    const mu = parseNumberField(block, vars, 'mu', 0, false);
    const sigma = parseNumberField(block, vars, 'sigma', 1, false);
    const n = parseNumberField(block, vars, 'n', 20, false);
    const p = parseNumberField(block, vars, 'p', 0.5, false);
    const lambda = parseNumberField(block, vars, 'lambda', 4, false);
    const a = parseNumberField(block, vars, 'a', 0, false);
    const b = parseNumberField(block, vars, 'b', 1, false);

    if (type === 'normal' && !(sigma > 0)) return null;
    if (type === 'binomial' && (!(n >= 0) || !(p >= 0 && p <= 1))) return null;
    if (type === 'poisson' && !(lambda >= 0)) return null;
    if (type === 'uniform' && !(b > a)) return null;
    if (type === 'exponential' && !(lambda > 0)) return null;

    // xmin/xmax (непрерывные типы) и kmax (дискретные типы) — необязательные переопределения;
    // если не заданы, разумные значения по умолчанию вычисляются ниже из параметров распределения.
    const hasXmin = /(?:^|[^A-Za-z0-9_])xmin\s*=/.test(block);
    const hasXmax = /(?:^|[^A-Za-z0-9_])xmax\s*=/.test(block);
    let xmin = hasXmin ? parseNumberField(block, vars, 'xmin', null, false) : null;
    let xmax = hasXmax ? parseNumberField(block, vars, 'xmax', null, false) : null;
    const hasKmax = /(?:^|[^A-Za-z0-9_])kmax\s*=/.test(block);
    let kmax = hasKmax ? parseNumberField(block, vars, 'kmax', null, false) : null;
    const segments = parseNumberField(block, vars, 'segments', 200, false);

    if (type === 'normal') {
        if (xmin === null) xmin = mu - 4 * sigma;
        if (xmax === null) xmax = mu + 4 * sigma;
    } else if (type === 'uniform') {
        const pad = (b - a) * 0.25 || 1;
        if (xmin === null) xmin = a - pad;
        if (xmax === null) xmax = b + pad;
    } else if (type === 'exponential') {
        if (xmin === null) xmin = 0;
        if (xmax === null) xmax = 6 / lambda;
    } else if (type === 'binomial') {
        if (kmax === null) kmax = Math.round(n);
    } else if (type === 'poisson') {
        if (kmax === null) kmax = Math.max(10, Math.ceil(lambda + 4 * Math.sqrt(lambda)) + 3);
    }

    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const thicknessExpr = captureExprField(block, 'thickness');
    let opacity = parseNumberField(block, vars, 'opacity', 1, false);
    if (opacity < 0) opacity = 0;
    if (opacity > 1) opacity = 1;
    const opacityExpr = captureExprField(block, 'opacity');
    const filled = parseBoolField(block, vars, 'filled', true);

    const hasHFrom = /(?:^|[^A-Za-z0-9_])highlightFrom\s*=/.test(block);
    const hasHTo = /(?:^|[^A-Za-z0-9_])highlightTo\s*=/.test(block);
    const highlightFrom = hasHFrom ? parseNumberField(block, vars, 'highlightFrom', null, false) : null;
    const highlightTo = hasHTo ? parseNumberField(block, vars, 'highlightTo', null, false) : null;
    const highlightColor = parseColorField(block, vars, 'highlightColor', '#e07a5f');
    let highlightOpacity = parseNumberField(block, vars, 'highlightOpacity', 0.5, false);
    if (highlightOpacity < 0) highlightOpacity = 0;
    if (highlightOpacity > 1) highlightOpacity = 1;

    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return {
        anchor: parseAnchorField(block, 'world'),
        name, type, mu, sigma, n, p, lambda, a, b,
        xmin, xmax, kmax, segments,
        color, colorExpr, thickness, thicknessExpr, opacity, opacityExpr, filled,
        highlightFrom, highlightTo, highlightColor, highlightOpacity,
        active, layer, updateMode, updateInterval,
    };
}

// draw Locus — геометрическое место точек: параметр driver пробегает [0,1],
// на каждом шаге сцена пересчитывается и запоминается положение точки point.
//   draw Locus { name = "L", point = M, driver = P, samples = 240 };
function parseLocusBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const pointName = parsePointRefField(block, vars, 'point');
    const driverName = parsePointRefField(block, vars, 'driver');
    if (!pointName || !driverName) return null;
    const samples = parseNumberField(block, vars, 'samples', 200, false);
    const from = parseNumberField(block, vars, 'from', 0, false);
    const to = parseNumberField(block, vars, 'to', 1, false);
    const color = parseColorField(block, vars, 'color', '#d9534f');
    const colorExpr = captureExprField(block, 'color');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const thicknessExpr = captureExprField(block, 'thickness');
    const dashed = parseBoolField(block, vars, 'dashed', false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 18, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, pointName, driverName, samples, from, to, color, colorExpr, thickness, thicknessExpr, dashed, active, layer, updateMode, updateInterval };
}

// draw Trace — след точки во времени (накапливается по кадрам, полезно для анимаций).
function parseTraceBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const pointName = parsePointRefField(block, vars, 'point');
    if (!pointName) return null;
    const maxPoints = parseNumberField(block, vars, 'maxPoints', 400, false);
    const minDist = parseNumberField(block, vars, 'minDist', 0.05, false);
    const color = parseColorField(block, vars, 'color', '#0275d8');
    const colorExpr = captureExprField(block, 'color');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const thicknessExpr = captureExprField(block, 'thickness');
    const fade = parseBoolField(block, vars, 'fade', true);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 18, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, pointName, maxPoints, minDist, color, colorExpr, thickness, thicknessExpr, fade, active, layer, updateMode, updateInterval };
}

// draw Region — закрашенная область, заданная неравенством f(x, y) <op> level.
// Две функции можно объединить через combine = and | or (системы неравенств):
//   draw Region { name = "R", f = "g", op = "<", level = 0, f2 = "h", op2 = ">=", combine = and };
function parseRegionBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const fM = block.match(/(?:^|[^A-Za-z0-9_])f\s*=\s*"([^"]*)"/);
    if (!fM) return null;
    const opM = block.match(/(?:^|[^A-Za-z0-9_])op\s*=\s*"?(<=|>=|<|>)"?/);
    const f2M = block.match(/(?:^|[^A-Za-z0-9_])f2\s*=\s*"([^"]*)"/);
    const op2M = block.match(/(?:^|[^A-Za-z0-9_])op2\s*=\s*"?(<=|>=|<|>)"?/);
    const combineM = block.match(/(?:^|[^A-Za-z0-9_])combine\s*=\s*"?(and|or)"?/);
    const color = parseColorField(block, vars, 'color', '#4a90d9');
    const colorExpr = captureExprField(block, 'color');
    const opacity = parseNumberField(block, vars, 'opacity', 0.35, false);
    const opacityExpr = captureExprField(block, 'opacity');
    const quality = parseNumberField(block, vars, 'quality', 3, false);
    const border = parseBoolField(block, vars, 'border', true);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 5, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    // 3D-альтернатива (билборд-панель): та же неявная область f(x,y) <op> level, только
    // растровая маска рисуется на отдельной панели в 3D-пространстве (pos = (x,y,z)), а не
    // поверх основной 2D-сцены. Настоящий объёмный аналог (область в пространстве, заданная
    // f(x,y,z) <op> level, через marching cubes) — отдельная, более крупная задача.
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = posMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    return {
        name, funcName: fM[1], op: opM ? opM[1] : '<',
        level: parseNumberField(block, vars, 'level', 0, false),
        func2Name: f2M ? f2M[1] : null, op2: op2M ? op2M[1] : '<',
        level2: parseNumberField(block, vars, 'level2', 0, false),
        combine: combineM ? combineM[1] : 'and',
        color, colorExpr, opacity, opacityExpr, quality, border, active, activeExpr: parseActiveExpr(block), layer,
        updateMode, updateInterval,
        dim, pos3D, rotate3D, billboard,
        panelWidth: parseNumberField(block, vars, 'panelWidth', 8, false),
        panelHeight: parseNumberField(block, vars, 'panelHeight', 8, false),
        rangeX: parseNumberField(block, vars, 'rangeX', 6, false),
        rangeY: parseNumberField(block, vars, 'rangeY', 6, false),
    };
}

// draw Bifurcation — бифуркационная диаграмма семейства x -> f(r, x).
function parseBifurcationBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const fM = block.match(/(?:^|[^A-Za-z0-9_])f\s*=\s*"([^"]*)"/);
    if (!fM) return null;
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = posMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    return {
        anchor: parseAnchorField(block, 'world'),
        name, funcName: fM[1],
        // box = (x1, y1, x2, y2) — прямоугольник поля, в который вписывается диаграмма
        // (без него — на весь холст, как раньше). Нужен, чтобы рядом поместить, например,
        // паутинную диаграмму для выбранного r.
        box: (() => { const m = block.match(/(?:^|[^A-Za-z0-9_])box\s*=\s*\(([^)]*)\)/); if (!m) return null; const v = m[1].split(',').map(x => evaluateNumericExpression(x.trim(), vars)); return v.length === 4 && v.every(isFinite) ? v : null; })(),
        rmin: parseNumberField(block, vars, 'rmin', 2.4, false),
        rmax: parseNumberField(block, vars, 'rmax', 4, false),
        ymin: parseNumberField(block, vars, 'ymin', 0, false),
        ymax: parseNumberField(block, vars, 'ymax', 1, false),
        x0: parseNumberField(block, vars, 'x0', 0.5, false),
        skip: parseNumberField(block, vars, 'skip', 200, false),
        keep: parseNumberField(block, vars, 'keep', 120, false),
        quality: parseNumberField(block, vars, 'quality', 2, false),
        color: parseColorField(block, vars, 'color', '#1a237e'),
        colorExpr: captureExprField(block, 'color'),
        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', 15, false),
        dim, pos3D, rotate3D, billboard,
        panelWidth: parseNumberField(block, vars, 'panelWidth', 8, false),
        panelHeight: parseNumberField(block, vars, 'panelHeight', 5, false),
        ...parseUpdateFields(block, vars),
    };
}

// draw Cobweb — паутинная диаграмма итераций x -> f(x) вместе с прямой y = x.
function parseCobwebBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const fM = block.match(/(?:^|[^A-Za-z0-9_])f\s*=\s*"([^"]*)"/);
    if (!fM) return null;
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = posMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    return {
        anchor: parseAnchorField(block, 'world'),
        name, funcName: fM[1],
        x0Expr: captureExprField(block, 'x0'),
        steps: parseNumberField(block, vars, 'steps', 40, false),
        xmin: parseNumberField(block, vars, 'xmin', 0, false),
        xmax: parseNumberField(block, vars, 'xmax', 1, false),
        color: parseColorField(block, vars, 'color', '#c62828'),
        colorExpr: captureExprField(block, 'color'),
        curveColor: parseColorField(block, vars, 'curveColor', '#1565c0'),
        curveColorExpr: captureExprField(block, 'curveColor'),
        showDiagonal: parseBoolField(block, vars, 'showDiagonal', true),
        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', 16, false),
        dim, pos3D, rotate3D, billboard,
        panelWidth: parseNumberField(block, vars, 'panelWidth', 6, false),
        panelHeight: parseNumberField(block, vars, 'panelHeight', 6, false),
        ...parseUpdateFields(block, vars),
    };
}

// draw IFS — система итерированных функций (игра хаоса): папоротник, ковёр и т.п.
// maps = [[a,b,c,d,e,f,p], ...] — аффинные отображения с вероятностями.
function parseIFSBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const mapsExpr = captureExprField(block, 'maps');
    if (mapsExpr === null) return null;
    // 3D-альтернатива: если задан pos = (x, y, z) (литеральные координаты, как у Primitive),
    // отображения интерпретируются как 3D-аффинные — [a,b,c, d,e,f, g,h,i, tx,ty,tz, p]
    // (матрица 3x3 + перенос + вероятность), а не 2D [a,b,c,d,e,f,p]. Это настоящее облако
    // точек в 3D-пространстве (THREE.Points), а не билборд — например, 3D-папоротник или
    // тетраэдр Серпинского в 3D можно построить именно так.
    let dim = '2D', pos3D = null;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = posMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    return {
        name, mapsExpr,
        iterations: parseNumberField(block, vars, 'iterations', 40000, false),
        color: parseColorField(block, vars, 'color', '#1b5e20'),
        colorExpr: captureExprField(block, 'color'),
        pointSize: parseNumberField(block, vars, 'pointSize', 1, false),
        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', 14, false),
        dim, pos3D,
        scale: parseNumberField(block, vars, 'scale', 1, false),
        ...parseUpdateFields(block, vars),
    };
}

// draw Automaton — клеточные автоматы: элементарные (правила Вольфрама) и «Жизнь».
function parseAutomatonBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const typeM = block.match(/(?:^|[^A-Za-z0-9_])type\s*=\s*"?(elementary|life)"?/);
    const posMatch2D = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    // 3D-альтернатива (билборд-панель): если pos — три ЛИТЕРАЛЬНЫХ числа, автомат (elementary
    // или life) рисуется на отдельной панели в 3D; если два — прежнее 2D-поведение (pos как
    // два динамических выражения в координатах поля).
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true, posXExpr = '0', posYExpr = '0';
    if (posMatch2D) {
        const parts = posMatch2D[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        } else if (parts.length === 2) {
            posXExpr = parts[0].trim(); posYExpr = parts[1].trim();
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    return {
        anchor: parseAnchorField(block, 'world'),
        name, type: typeM ? typeM[1] : 'elementary',
        rule: parseNumberField(block, vars, 'rule', 30, false),
        cells: parseNumberField(block, vars, 'cells', 101, false),
        steps: parseNumberField(block, vars, 'steps', 60, false),
        cellSize: parseNumberField(block, vars, 'cellSize', 0.25, false),
        initExpr: captureExprField(block, 'init'),
        generationExpr: captureExprField(block, 'generation'),
        posXExpr, posYExpr,
        // Почти чёрный цвет клеток автомата — нейтральный, default идёт за темой.
        color: parseColorField(block, vars, 'color', null),
        colorExpr: captureExprField(block, 'color'),
        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', 16, false),
        dim, pos3D, rotate3D, billboard,
        panelWidth: parseNumberField(block, vars, 'panelWidth', 8, false),
        panelHeight: parseNumberField(block, vars, 'panelHeight', 8, false),
        ...parseUpdateFields(block, vars),
    };
}

// draw Voronoi — диаграмма Вороного / триангуляция Делоне / выпуклая оболочка.
function parseVoronoiBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const sitesExpr = captureExprField(block, 'sites');
    const modeM = block.match(/(?:^|[^A-Za-z0-9_])mode\s*=\s*"?(voronoi|delaunay|hull)"?/);
    // 3D: voronoi — точные выпуклые ячейки (последовательное отсечение полупространствами-
    // бисекторами каждой пары сайтов, клип по боксу rangeX/Y/Z); delaunay — тетраэдризация
    // (перебор четвёрок точек с проверкой пустоты описанной сферы, см. glDelaunay3D); hull —
    // выпуклая оболочка через convexHull3D (та же функция, что и у new Hull).
    let dim = '2D', pos3D = null;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = posMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    return {
        name, sitesExpr, mode: modeM ? modeM[1] : 'voronoi',
        quality: parseNumberField(block, vars, 'quality', 3, false),
        // Тёмно-серые рёбра/сайты диаграммы Вороного — нейтральный цвет, default идёт за темой.
        color: parseColorField(block, vars, 'color', null),
        colorExpr: captureExprField(block, 'color'),
        showSites: parseBoolField(block, vars, 'showSites', true),
        filled: parseBoolField(block, vars, 'filled', true),
        opacity: parseNumberField(block, vars, 'opacity', 0.45, false),
        opacityExpr: captureExprField(block, 'opacity'),
        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', 8, false),
        dim, pos3D,
        ...parseUpdateFields(block, vars),
        rangeX: parseNumberField(block, vars, 'rangeX', 8, false),
        rangeY: parseNumberField(block, vars, 'rangeY', 8, false),
        rangeZ: parseNumberField(block, vars, 'rangeZ', 8, false),
        resolution: parseNumberField(block, vars, 'resolution', 18, false),
    };
}

// draw Fourier — разложение замкнутой кривой в ряд Фурье, нарисованное эпициклами.
function parseFourierBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const pathExpr = captureExprField(block, 'path');
    if (pathExpr === null) return null;
    return {
        name, pathExpr,
        terms: parseNumberField(block, vars, 'terms', 24, false),
        speed: parseNumberField(block, vars, 'speed', 0.25, false),
        showCircles: parseBoolField(block, vars, 'showCircles', true),
        color: parseColorField(block, vars, 'color', '#ad1457'),
        colorExpr: captureExprField(block, 'color'),
        circleColor: parseColorField(block, vars, 'circleColor', '#9e9e9e'),
        circleColorExpr: captureExprField(block, 'circleColor'),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 24, false),
        ...parseUpdateFields(block, vars),
    };
}

// draw Diagram — помеченный граф со стрелками: коммутативные диаграммы,
// автоматы, цепи Маркова. nodes = [[метка, x, y], ...], arrows = [[из, в, метка], ...]
function parseDiagramBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const nodesExpr = captureExprField(block, 'nodes');
    const arrowsExpr = captureExprField(block, 'arrows');
    if (nodesExpr === null) return null;
    return {
        // Оба режима закрепления доступны и здесь: world (по умолчанию —
        // прежнее поведение) и screen.
        anchor: parseAnchorField(block, 'world'),
        name, nodesExpr, arrowsExpr,
        acceptingExpr: captureExprField(block, 'accepting'),
        nodeRadius: parseNumberField(block, vars, 'nodeRadius', 14, false),
        boxed: parseBoolField(block, vars, 'boxed', false),
        curved: parseBoolField(block, vars, 'curved', true),
        // Все три — нейтральные тёмные/светлый цвета (текст состояния, стрелка перехода,
        // подпись), не акцентные: default идёт за темой через __gcDefaultColor().
        color: parseColorField(block, vars, 'color', null),
        colorExpr: captureExprField(block, 'color'),
        arrowColor: parseColorField(block, vars, 'arrowColor', null),
        arrowColorExpr: captureExprField(block, 'arrowColor'),
        labelColor: parseColorField(block, vars, 'labelColor', null),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 24, false),
        ...parseUpdateFields(block, vars),
    };
}

// draw Complex — раскраска области значений комплексной функции.
// Оттенок кодирует аргумент, светлота — модуль. Функция объявляется как func f(z) = ...,
// где z комплексное; операторы мини-языка уже умеют комплексную арифметику.
function parseComplexBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const fM = block.match(/(?:^|[^A-Za-z0-9_])f\s*=\s*"([^"]*)"/);
    if (!fM) return null;
    const modeM = block.match(/(?:^|[^A-Za-z0-9_])mode\s*=\s*"?(domain|phase|modulus)"?/);
    // 3D-альтернатива (билборд-панель): та же раскраска области (domain coloring), только
    // область обзора задаётся явно через centerRe/centerIm/scale (в панели нет камеры/
    // pixelToField, как и у draw Fractal).
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = posMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    return {
        name, funcName: fM[1], mode: modeM ? modeM[1] : 'domain',
        quality: parseNumberField(block, vars, 'quality', 2, false),
        contours: parseBoolField(block, vars, 'contours', true),
        opacity: parseNumberField(block, vars, 'opacity', 1, false),
        opacityExpr: captureExprField(block, 'opacity'),
        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', -90, false),
        dim, pos3D, rotate3D, billboard,
        panelWidth: parseNumberField(block, vars, 'panelWidth', 8, false),
        panelHeight: parseNumberField(block, vars, 'panelHeight', 8, false),
        centerRe: parseNumberField(block, vars, 'centerRe', 0, false),
        centerIm: parseNumberField(block, vars, 'centerIm', 0, false),
        scale: parseNumberField(block, vars, 'scale', 3, false),
        ...parseUpdateFields(block, vars),
    };
}

// draw Hyperbolic — геометрия Лобачевского в модели Пуанкаре (круг/полуплоскость в 2D,
// шар/полупространство в 3D). Умеет: границу абсолюта, геодезические между точками, правильное
// замощение {p,q} (только 2D). Для работы с изометриями и расстоянием из скриптов — builtin-
// функции hypDistance/hypTranslate/mobiusTransform (2D) и hypDistance3D/hypTranslate3D (3D, шар).
function parseHyperbolicBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const modelM = block.match(/(?:^|[^A-Za-z0-9_])model\s*=\s*"?(disk|halfplane|ball|halfspace)"?/);
    const tilingM = block.match(/(?:^|[^A-Za-z0-9_])tiling\s*=\s*"\{?\s*(\d+)\s*,\s*(\d+)\s*\}?"/);
    const geodesicsExpr = captureExprField(block, 'geodesics');
    const pointsExpr = captureExprField(block, 'points');
    // 3D-альтернатива: шар Пуанкаре (Poincaré ball model, model = "ball", по умолчанию для 3D)
    // ИЛИ модель полупространства (model = "halfspace") — прямой 3D-аналог модели полуплоскости:
    // граница абсолюта — плоскость z = 0, "внутренность" — z > 0; геодезические — вертикальные
    // отрезки (если xy совпадают) либо полуокружности в вертикальной плоскости через обе точки
    // (см. gcHypGeodesicHalfSpace3D). pos = (x,y,z) — центр шара/начало координат полупространства
    // в сцене. geodesics/points — тройки [x,y,z]: внутри единичного шара для model="ball", либо
    // произвольные точки с z > 0 для model="halfspace". Правильное замощение {p,q} — понятие
    // специфичное для 2D-мозаик; настоящий 3D-аналог — соты {p,q,r} — требует групп отражений
    // в гиперболическом 3-пространстве и НЕ реализован (см. итоговое резюме); при dim=3D
    // tiling просто игнорируется.
    let dim = '2D', pos3D = null;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = posMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    // "halfplane"/"halfspace" — синонимы (полуплоскость-модель по смыслу одна и та же что в 2D,
    // что в 3D, просто у неё на одно измерение больше); по умолчанию — disk в 2D, ball в 3D.
    let model = modelM ? modelM[1] : (dim === '3D' ? 'ball' : 'disk');
    if (model === 'halfplane' || model === 'halfspace') model = (dim === '3D') ? 'halfspace' : 'halfplane';
    else if (dim === '3D') model = 'ball';
    return {
        name, model,
        tilingP: tilingM ? parseInt(tilingM[1], 10) : 0,
        tilingQ: tilingM ? parseInt(tilingM[2], 10) : 0,
        depth: parseNumberField(block, vars, 'depth', 3, false),
        radius: parseNumberField(block, vars, 'radius', 8, false),
        geodesicsExpr, pointsExpr,
        showBoundary: parseBoolField(block, vars, 'showBoundary', true),
        // Тёмный цвет геодезических/границы — нейтральный, default идёт за темой.
        color: parseColorField(block, vars, 'color', null),
        colorExpr: captureExprField(block, 'color'),
        tileColor: parseColorField(block, vars, 'tileColor', '#5b8db8'),
        tileColorExpr: captureExprField(block, 'tileColor'),
        thickness: parseNumberField(block, vars, 'thickness', 1.4, false),
        thicknessExpr: captureExprField(block, 'thickness'),
        active: parseBoolField(block, vars, 'active', true),
        activeExpr: parseActiveExpr(block),
        layer: parseNumberField(block, vars, 'layer', 12, false),
        dim, pos3D,
        ...parseUpdateFields(block, vars),
    };
}

// draw Fractal — эскейп-тайм фракталы: Мандельброт, Жюлиа, «Горящий корабль».
// Для julia параметры cRe/cIm — ВЫРАЖЕНИЯ мини-языка (например, cRe = C.pos.x),
// что позволяет привязать фрактал к перетаскиваемой точке и менять его динамически.
function parseFractalBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    let type = 'mandelbrot';
    const typeMatch = block.match(/(?:^|[^A-Za-z0-9_])type\s*=\s*"?(mandelbrot|julia|burningship|mandelbulb|mengersponge|sierpinski3d)"?/);
    if (typeMatch) type = typeMatch[1];
    const is3DNative = (type === 'mandelbulb' || type === 'mengersponge' || type === 'sierpinski3d');
    const cReExpr = captureExprField(block, 'cRe');
    const cImExpr = captureExprField(block, 'cIm');
    if (type === 'julia' && (cReExpr === null || cImExpr === null)) return null;
    const maxIter = parseNumberField(block, vars, 'maxIter', 80, false);
    const quality = parseNumberField(block, vars, 'quality', 2, false);
    // adaptiveIter — при приближении (маленький scale) внутренние области множества требуют
    // намного больше итераций, иначе вместо детализированной границы получится сплошное чёрное
    // пятно без структуры; maxIter в этом случае трактуется как МИНИМУМ, а не фиксированное
    // число (см. drawFractal). periodicityCheck — классическая оптимизация рендера Мандельброта:
    // если z входит в короткий цикл, точка гарантированно принадлежит множеству, и можно
    // прекратить итерации сразу, не дожидаясь maxIter — без неё глубокий зум с адаптивным
    // ростом итераций был бы намного медленнее именно во внутренних областях множества.
    const adaptiveIter = parseBoolField(block, vars, 'adaptiveIter', true);
    const periodicityCheck = parseBoolField(block, vars, 'periodicityCheck', true);
    const paletteMatch = block.match(/(?:^|[^A-Za-z0-9_])palette\s*=\s*"?(fire|ocean|gray|rainbow)"?/);
    const palette = paletteMatch ? paletteMatch[1] : 'ocean';
    const opacity = parseNumberField(block, vars, 'opacity', 1, false);
    const opacityExpr = captureExprField(block, 'opacity');
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', -100, false);
    if (is3DNative) {
        // Настоящий объёмный фрактал (Mandelbulb/Menger sponge/тетраэдр Серпинского) — рендерится
        // рэймarчингом (сфера-трейсинг сигнатурной функции расстояния до поверхности, SDF) прямо
        // на GPU во фрагментном шейдере (см. build3DFractalMaterial в generate3D), а НЕ растровой
        // 2D-панелью-биллбордом. Детализация ограничена только числом итераций/шагов и точностью
        // float на GPU — при приближении камерой видна всё более мелкая структура точно так же,
        // как и у остальных объектов сцены (это не билборд — обычная 3D-геометрия с точки зрения
        // камеры/зума/окклюзии другими объектами).
        const posMatch3D = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
        if (!posMatch3D) return null;
        const parts3D = posMatch3D[1].split(',').map(s => s.trim());
        if (parts3D.length !== 3) return null;
        let pos3D;
        try {
            pos3D = {
                x: evaluateNumericExpression(parts3D[0], vars),
                y: evaluateNumericExpression(parts3D[1], vars),
                z: evaluateNumericExpression(parts3D[2], vars),
            };
        } catch (e) { return null; }
        return {
            name, type, active, activeExpr: parseActiveExpr(block), layer, dim: '3D', pos3D,
            rotate3D: parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 }),
            size: parseNumberField(block, vars, 'size', 1.5, false),
            power: parseNumberField(block, vars, 'power', 8, false),
            iterations: Math.max(1, Math.round(parseNumberField(block, vars, 'iterations', type === 'mengersponge' ? 5 : (type === 'sierpinski3d' ? 12 : 10), false))),
            maxSteps: Math.max(8, Math.round(parseNumberField(block, vars, 'maxSteps', 128, false))),
            color: parseColorField(block, vars, 'color', '#4a90d9'),
            colorExpr: captureExprField(block, 'color'),
            color2: parseColorField(block, vars, 'color2', '#ffaa44'),
            color2Expr: captureExprField(block, 'color2'),
            ...parseUpdateFields(block, vars),
        };
    }
    // 3D-альтернатива (билборд-панель): та же растровая математика Мандельброта/Жюлиа/
    // Burning Ship (см. drawFractal в generate2D), но область обзора задаётся явно через
    // centerRe/centerIm/scale, а не через камеру сцены (в 3D-панели нет pixelToField).
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = posMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    return {
        name, type, cReExpr, cImExpr, maxIter, quality, adaptiveIter, periodicityCheck, palette, opacity, opacityExpr, active,
        activeExpr: parseActiveExpr(block), layer, dim, pos3D, rotate3D, billboard,
        panelWidth: parseNumberField(block, vars, 'panelWidth', 8, false),
        panelHeight: parseNumberField(block, vars, 'panelHeight', 8, false),
        centerRe: parseNumberField(block, vars, 'centerRe', type === 'julia' ? 0 : -0.5, false),
        centerIm: parseNumberField(block, vars, 'centerIm', 0, false),
        scale: parseNumberField(block, vars, 'scale', 1.5, false),
        // Те же значения, но как СЫРОЕ выражение (не вычисленное один раз при компиляции) —
        // используется только в 2D-рендере (см. drawFractal), чтобы centerRe/centerIm/scale
        // можно было привязать к переменной слайдера и приближаться к деталям фрактала
        // "вживую", перетаскивая слайдер, а не только правкой скрипта и перекомпиляцией.
        centerReExpr: captureExprField(block, 'centerRe'),
        centerImExpr: captureExprField(block, 'centerIm'),
        scaleExpr: captureExprField(block, 'scale'),
        ...parseUpdateFields(block, vars),
    };
}

// draw Image — асинхронно загружаемое растровое изображение (Задача 3)
function parseImageBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const srcMatch = block.match(/src\s*=\s*"([^"]*)"/);
    if (!srcMatch) return null;
    const src = srcMatch[1];

    // 3D-вариант: pos = (x, y, z) — три литеральных числа/выражения (как в new Primitive),
    // а не имя точки. 2D-вариант (как раньше) остаётся без изменений: pos = ИмяТочки.
    let dim = null, posName = null, pos3D = null, rotate3D = null, billboard = true;
    const posTupleMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posTupleMatch) {
        const parts = posTupleMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    if (!pos3D) {
        posName = parsePointRefField(block, vars, 'pos');
        if (!posName) return null;
        dim = '2D';
    } else {
        // rotate — фиксированная ориентация плоскости (градусы по осям X/Y/Z). Если не задан —
        // billboard = true (по умолчанию): плоскость сама разворачивается к камере каждый кадр
        // (как THREE.Sprite), удобно для меток/картинок, которые должны быть видны при повороте
        // камеры. billboard = false — плоскость держит заданную ориентацию (полезно для текстур,
        // "приклеенных" к грани тела, плаката на стене и т.п.).
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }

    const width = parseNumberField(block, vars, 'width', 5, false);
    const height = parseNumberField(block, vars, 'height', 5, false);
    const opacity = parseNumberField(block, vars, 'opacity', 1, false);
    const opacityExpr = captureExprField(block, 'opacity');
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);
    const layer = parseNumberField(block, vars, 'layer', 15, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);

    return { name, src, dim, posName, pos3D, rotate3D, billboard, width, height, opacity, opacityExpr, active, activeExpr, layer, updateMode, updateInterval };
}

// draw Histogram — гистограмма по данным (Задача 3), data — выражение (обычно имя переменной-вектора)
function parseHistogramBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const dataQuoted = block.match(/(?:^|[^A-Za-z0-9_])data\s*=\s*"([^"]*)"/);
    const dataExpr = dataQuoted ? dataQuoted[1].trim() : captureExprField(block, 'data');
    if (dataExpr === null || dataExpr === '') return null;
    const bins = parseNumberField(block, vars, 'bins', 10, false);
    const color = parseColorField(block, vars, 'color', '#4a90d9');
    const colorExpr = captureExprField(block, 'color');
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    // 3D-альтернатива (билборд-панель, Задача: 3D-аналоги для всех объектов): если задан
    // pos = (x, y, z), та же самая гистограмма (одинаковый dataExpr/bins/color) рисуется не на
    // основном canvas сцены, а на отдельном offscreen-canvas, который натягивается как текстура
    // на плоскость в 3D-пространстве (см. gcMakeCanvasPanel в generate3D). Без pos поведение
    // остаётся прежним — 2D-гистограмма в фиксированном углу основного canvas.
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true;
    const posTupleMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posTupleMatch) {
        const parts = posTupleMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    if (pos3D) {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    // Двухкомпонентный pos = (x, y) — положение в координатах ПОЛЯ (не в пикселях холста).
    // Раньше гистограмма его вовсе не понимала: прямоугольник всегда считался от угла
    // холста, поэтому она и оказывалась приклеенной к камере. Если pos задан, разумное
    // умолчание — жить в пространстве; без pos прежнее экранное поведение сохраняется,
    // чтобы существующие сцены не поехали.
    let posPoint = null;
    if (!pos3D && posTupleMatch) {
        const parts2 = posTupleMatch[1].split(',').map(t => t.trim());
        if (parts2.length === 2) {
            try {
                posPoint = {
                    x: evaluateNumericExpression(parts2[0], vars),
                    y: evaluateNumericExpression(parts2[1], vars),
                };
            } catch (e) { posPoint = null; }
        }
    }
    const anchor = parseAnchorField(block, posPoint ? 'world' : 'screen');
    // Размер в единицах поля для мирового режима (в экранном по-прежнему берётся доля холста).
    const fieldWidth = parseNumberField(block, vars, 'width', 8, false);
    const fieldHeight = parseNumberField(block, vars, 'height', 5, false);
    const panelWidth = parseNumberField(block, vars, 'panelWidth', 6, false);
    const panelHeight = parseNumberField(block, vars, 'panelHeight', 4, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, dataExpr, bins, color, colorExpr, active, activeExpr: parseActiveExpr(block), layer, dim, pos3D, rotate3D, billboard, panelWidth, panelHeight, posPoint, anchor, fieldWidth, fieldHeight, updateMode, updateInterval };
}

// draw Scatter3D — настоящая 3D-статистика: облако точек с РЕАЛЬНЫМИ x,y,z-координатами
// (не билборд-панель с растровым 2D-графиком, как у draw Chart{type=scatter, pos=(x,y,z)} —
// там это плоская текстура, натянутая на плоскость в 3D; тут — фактическое облако точек
// в THREE.Points, которое можно вращать/разглядывать с любой стороны, с настоящей глубиной).
// data — выражение мини-языка, дающее массив [x,y,z] или [x,y,z,value] (4-й элемент — для
// colorBy="value"). pos — смещение всего облака в мировых координатах сцены.
function parseScatter3DBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const dataExpr = captureQuotableExprField(block, 'data');
    if (dataExpr === null) return null;
    const pos3D = parseXYZField(block, vars, 'pos', { x: 0, y: 0, z: 0 });
    const pointSize = parseNumberField(block, vars, 'pointSize', 0.25, false);
    const color = parseColorField(block, vars, 'color', '#4a90d9');
    const colorByM = block.match(/(?:^|[^A-Za-z0-9_])colorBy\s*=\s*"?(none|value|z)"?/);
    const colorBy = colorByM ? colorByM[1] : 'none';
    const showBox = parseBoolField(block, vars, 'showBox', true);
    // shape — форма маркера. По умолчанию sphere: точки становятся НАСТОЯЩИМИ телами
    // (инстансированная геометрия), а не плоскими спрайтами THREE.Points, которые всегда
    // развёрнуты к камере и потому в 3D выглядят как наклейки без глубины. shape = flat
    // возвращает прежний спрайтовый режим — он дешевле и уместен для очень больших облаков.
    const shapeM = block.match(/(?:^|[^A-Za-z0-9_])shape\s*=\s*"?(sphere|cube|box|octahedron|tetrahedron|icosahedron|flat|point)"?/);
    const shape = shapeM ? (shapeM[1] === 'point' ? 'flat' : (shapeM[1] === 'box' ? 'cube' : shapeM[1])) : 'sphere';
    // Материал. Значения по умолчанию подобраны под «просто объём, без бликов»:
    // roughness = 1 и metalness = 0 дают матовую поверхность, у которой форма читается
    // только за счёт затенения, без зеркального пятна.
    const style = parseVisualStyleFields(block, vars);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    return Object.assign({ name, dataExpr, pos3D, pointSize, color, colorBy, showBox, shape,
        active, activeExpr: parseActiveExpr(block), layer }, style);
}

// draw Histogram3D — настоящая 3D-статистика: двумерная гистограмма (совместное распределение
// x, y) в виде столбиков в 3D — не путать с draw Histogram{pos=(x,y,z)}, у которого "3D" — это
// та же самая одномерная растровая гистограмма на billboard-панели. Здесь data — выражение,
// дающее массив пар [x, y]; плоскость XY разбивается на сетку binsX × binsY, высота столбика —
// количество точек в ячейке. Диапазон x/y берётся из самих данных автоматически на каждый
// пересчёт (данные могут меняться в Update), если xmin/xmax/ymin/ymax не заданы явно.
function parseHistogram3DBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const dataExpr = captureQuotableExprField(block, 'data');
    if (dataExpr === null) return null;
    const binsX = parseNumberField(block, vars, 'binsX', 8, false);
    const binsY = parseNumberField(block, vars, 'binsY', 8, false);
    const pos3D = parseXYZField(block, vars, 'pos', { x: 0, y: 0, z: 0 });
    const width = parseNumberField(block, vars, 'width', 10, false);
    const depth = parseNumberField(block, vars, 'depth', 10, false);
    const heightScale = parseNumberField(block, vars, 'heightScale', 5, false);
    // Явный диапазон данных (необязателен) — если не задан, считается автоматически из
    // фактических данных при каждом пересчёте (см. gcRebuildHistogram3D).
    const xmin = parseNumberField(block, vars, 'xmin', null, false);
    const xmax = parseNumberField(block, vars, 'xmax', null, false);
    const ymin = parseNumberField(block, vars, 'ymin', null, false);
    const ymax = parseNumberField(block, vars, 'ymax', null, false);
    const color = parseColorField(block, vars, 'color', '#4a90d9');
    const colorByM = block.match(/(?:^|[^A-Za-z0-9_])colorBy\s*=\s*"?(none|count)"?/);
    const colorBy = colorByM ? colorByM[1] : 'count';
    const showAxes = parseBoolField(block, vars, 'showAxes', true);
    const style = parseVisualStyleFields(block, vars);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    return Object.assign({
        name, dataExpr, binsX, binsY, pos3D, width, depth, heightScale,
        xmin, xmax, ymin, ymax, color, colorBy, showAxes,
        active, activeExpr: parseActiveExpr(block), layer,
    }, style);
}

// draw Field — векторное поле (Задача 4): P(x,y), Q(x,y)
function parseFieldBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const pMatch = block.match(/(?:^|[^A-Za-z0-9_])\s*P\s*=\s*"([^"]*)"/);
    const qMatch = block.match(/(?:^|[^A-Za-z0-9_])\s*Q\s*=\s*"([^"]*)"/);
    if (!pMatch || !qMatch) return null;
    // R — третья (вертикальная) компонента поля, только для 3D; если не задана,
    // поле считается плоским (лежащим в срезе z = 0), как и было в 2D.
    const rMatch = block.match(/(?:^|[^A-Za-z0-9_])\s*R\s*=\s*"([^"]*)"/);
    const rExpr = rMatch ? rMatch[1] : null;
    const xmin = parseNumberField(block, vars, 'xmin', -25, false);
    const xmax = parseNumberField(block, vars, 'xmax', 25, false);
    const ymin = parseNumberField(block, vars, 'ymin', -15, false);
    const ymax = parseNumberField(block, vars, 'ymax', 15, false);
    const zmin = parseNumberField(block, vars, 'zmin', -15, false);
    const zmax = parseNumberField(block, vars, 'zmax', 15, false);
    const grid = parseNumberField(block, vars, 'grid', 15, false);
    const scale = parseNumberField(block, vars, 'scale', 1, false);
    const color = parseColorField(block, vars, 'color', '#888888');
    const colorExpr = captureExprField(block, 'color');
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 10, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, pExpr: pMatch[1], qExpr: qMatch[1], rExpr, xmin, xmax, ymin, ymax, zmin, zmax, grid, scale, color, colorExpr, active, activeExpr: parseActiveExpr(block), layer, updateMode, updateInterval };
}

// draw TensorField — тензорное поле ранга 2 (симметричный 3x3-тензор T(x,y,z): напряжения,
// деформации, диффузии, инерции и т.п. — все они по построению симметричны, поэтому здесь
// поддержан только симметричный случай — это позволяет всегда получить вещественные собственные
// значения и ортогональные собственные векторы методом Якоби). Задаётся 6 независимыми
// компонентами (Txx, Tyy, Tzz — обязательны; Txy, Txz, Tyz — по умолчанию 0). Визуализация —
// эллипсоид-глиф в каждом узле сетки: полуоси вдоль собственных векторов, длины — |собственные
// значения| (тот же принцип, что и в diffusion tensor imaging). Только 3D — рангу 2 тензора
// в 2D-сцене естественнее соответствовал бы эллипс, но это отдельная, менее востребованная
// визуализация, и здесь не реализована.
function parseTensorFieldBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const txxM = block.match(/(?:^|[^A-Za-z0-9_])\s*Txx\s*=\s*"([^"]*)"/);
    const tyyM = block.match(/(?:^|[^A-Za-z0-9_])\s*Tyy\s*=\s*"([^"]*)"/);
    const tzzM = block.match(/(?:^|[^A-Za-z0-9_])\s*Tzz\s*=\s*"([^"]*)"/);
    if (!txxM || !tyyM || !tzzM) return null;
    const txyM = block.match(/(?:^|[^A-Za-z0-9_])\s*Txy\s*=\s*"([^"]*)"/);
    const txzM = block.match(/(?:^|[^A-Za-z0-9_])\s*Txz\s*=\s*"([^"]*)"/);
    const tyzM = block.match(/(?:^|[^A-Za-z0-9_])\s*Tyz\s*=\s*"([^"]*)"/);
    const xmin = parseNumberField(block, vars, 'xmin', -10, false);
    const xmax = parseNumberField(block, vars, 'xmax', 10, false);
    const ymin = parseNumberField(block, vars, 'ymin', -10, false);
    const ymax = parseNumberField(block, vars, 'ymax', 10, false);
    const zmin = parseNumberField(block, vars, 'zmin', -10, false);
    const zmax = parseNumberField(block, vars, 'zmax', 10, false);
    // grid — узлов на ось; уже при 5 (по умолчанию) получается 6^3 = 216 эллипсоидов, поэтому
    // потолок ниже, чем у векторного поля (там просто стрелки, тут — полноценные меши).
    const grid = parseNumberField(block, vars, 'grid', 4, false);
    const scale = parseNumberField(block, vars, 'scale', 1, false);
    const color = parseColorField(block, vars, 'color', '#4a90d9');
    const colorExpr = captureExprField(block, 'color');
    const colorByM = block.match(/(?:^|[^A-Za-z0-9_])colorBy\s*=\s*"?(none|trace)"?/);
    const colorBy = colorByM ? colorByM[1] : 'none';
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 10, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return {
        name,
        txxExpr: txxM[1], tyyExpr: tyyM[1], tzzExpr: tzzM[1],
        txyExpr: txyM ? txyM[1] : '0', txzExpr: txzM ? txzM[1] : '0', tyzExpr: tyzM ? tyzM[1] : '0',
        xmin, xmax, ymin, ymax, zmin, zmax, grid, scale, color, colorExpr, colorBy,
        active, activeExpr: parseActiveExpr(block), layer, updateMode, updateInterval,
    };
}

// draw Trajectory — интегральная кривая векторного поля (Задача 4), RK4.
// В 3D дополнительно допускается третья компонента R (как у draw Field) и
// start = (x, y, z); для 2D-сцен по-прежнему достаточно (x, y).
function parseTrajectoryBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    let systemName = null;
    const systemMatch = block.match(/system\s*=\s*"([^"]*)"/);
    if (systemMatch) systemName = systemMatch[1];
    let fieldName = null, pExpr = null, qExpr = null, rExpr = null;
    if (!systemName) {
        const fieldMatch = block.match(/field\s*=\s*"([^"]*)"/);
        if (fieldMatch) fieldName = fieldMatch[1];
        if (!fieldName) {
            const pMatch = block.match(/(?:^|[^A-Za-z0-9_])\s*P\s*=\s*"([^"]*)"/);
            const qMatch = block.match(/(?:^|[^A-Za-z0-9_])\s*Q\s*=\s*"([^"]*)"/);
            if (!pMatch || !qMatch) return null;
            pExpr = pMatch[1]; qExpr = qMatch[1];
            const rMatch = block.match(/(?:^|[^A-Za-z0-9_])\s*R\s*=\s*"([^"]*)"/);
            if (rMatch) rExpr = rMatch[1];
        }
    }
    const startRaw = block.match(/start\s*=\s*\(([^)]*)\)/);
    if (!startRaw) return null;
    const startParts = startRaw[1].split(',').map(s => parseFloat(s.trim()));
    if ((startParts.length !== 2 && startParts.length !== 3) || startParts.some(isNaN)) return null;
    const steps = parseNumberField(block, vars, 'steps', 200, false);
    const dt = parseNumberField(block, vars, 'dt', 0.05, false);
    const color = parseColorField(block, vars, 'color', '#ff0000');
    const colorExpr = captureExprField(block, 'color');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const thicknessExpr = captureExprField(block, 'thickness');
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 15, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    return { name, systemName, fieldName, pExpr, qExpr, rExpr, start: startParts, steps, dt, color, colorExpr, thickness, thicknessExpr, active, activeExpr: parseActiveExpr(block), layer, updateMode, updateInterval };
}

// draw Graph — визуализация графа (Задача 5), graph — имя переменной, созданной через newGraph()/addNode/addEdge
function parseGraphDrawBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const graphMatch = block.match(/graph\s*=\s*"([^"]*)"/);
    if (!graphMatch) return null;
    const color = parseColorField(block, vars, 'color', null);
    const colorExpr = captureExprField(block, 'color');
    const nodeColor = parseColorField(block, vars, 'nodeColor', null);
    const nodeColorExpr = captureExprField(block, 'nodeColor');
    const edgeColor = parseColorField(block, vars, 'edgeColor', null);
    const edgeColorExpr = captureExprField(block, 'edgeColor');
    // Белая подпись узла графа — нейтральный цвет, default идёт за темой.
    const labelColor = parseColorField(block, vars, 'labelColor', null);
    const nodeRadius = parseNumberField(block, vars, 'nodeRadius', 9, false);
    const directed = parseBoolField(block, vars, 'directed', false);
    const showWeights = parseBoolField(block, vars, 'showWeights', true);
    const labels = parseBoolField(block, vars, 'labels', true);
    // Выражения, вычисляемые каждый кадр: списки подсвечиваемых вершин/рёбер
    const highlightExpr = captureQuotableExprField(block, 'highlight');
    const highlightEdgesExpr = captureQuotableExprField(block, 'highlightEdges');
    const highlightColor = parseColorField(block, vars, 'highlightColor', '#e8590c');
    const interactive = parseInteractiveField(block, vars);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    // 3D-альтернатива (билборд-панель): раньше у draw Graph не было поля pos вообще — граф
    // рисовался прямо в координатах поля 2D-сцены. pos = (x, y, z) — новое, чисто аддитивное
    // поле: если задано, тот же граф (те же узлы/рёбра из переменной graph) рисуется на
    // отдельной панели в 3D, а не на основном canvas.
    let dim = '2D', pos3D = null, rotate3D = null, billboard = true;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = posMatch[1].split(',').map(s => s.trim());
        if (parts.length === 3) {
            try {
                pos3D = {
                    x: evaluateNumericExpression(parts[0], vars),
                    y: evaluateNumericExpression(parts[1], vars),
                    z: evaluateNumericExpression(parts[2], vars),
                };
                dim = '3D';
            } catch (e) { pos3D = null; }
        }
    }
    if (dim === '3D') {
        rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: 0 });
        billboard = parseBoolField(block, vars, 'billboard', true);
    }
    return {
        // Оба режима закрепления доступны и здесь: world (по умолчанию —
        // прежнее поведение) и screen.
        anchor: parseAnchorField(block, 'world'),
        name, graphVar: graphMatch[1], color, colorExpr, nodeColor, nodeColorExpr, edgeColor, edgeColorExpr, labelColor, nodeRadius,
        directed, showWeights, labels, highlightExpr, highlightEdgesExpr, highlightColor, active,
        edgeWidth: parseNumberField(block, vars, 'edgeWidth', 2, false),
        // Концы рёбер: round (по умолчанию) | butt | square. butt — для столбиков диаграмм.
        edgeCap: (block.match(/(?:^|[^A-Za-z0-9_])edgeCap\s*=\s*"?(butt|square|round)"?/) || [0, 'round'])[1],
        activeExpr: parseActiveExpr(block), layer, dim, pos3D, rotate3D, billboard,
        panelWidth: parseNumberField(block, vars, 'panelWidth', 8, false),
        panelHeight: parseNumberField(block, vars, 'panelHeight', 6, false),
        interactive,
        ...parseUpdateFields(block, vars),
    };
}

function parseDrawTextBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    // Сохраняем ВСЕ поля как сырые строки выражений
    let posXExpr = null, posYExpr = null, posZExpr = null, zGiven = false;
    // pos = (x, y[, z]) — координаты могут быть выражениями со своими скобками и
    // запятыми внутри вызовов: ((A.pos.x + B.pos.x) / 2, 0.8), (max(a, b), 1).
    // Раньше регулярка брала текст до первой ")" и делила его по всем запятым —
    // такие выражения ломали блок целиком («пропущены обязательные поля»).
    let posMatch = null;
    {
        const pm = matchField(block, /(?:^|[^A-Za-z0-9_])pos\s*=\s*\(/);
        if (pm) {
            let i = pm.index + pm[0].length, depth = 0, inStr = null, cur = '';
            const parts = [];
            for (; i < block.length; i++) {
                const ch = block[i];
                if (inStr) { cur += ch; if (ch === '\\') { cur += block[++i] || ''; } else if (ch === inStr) inStr = null; continue; }
                if (ch === '"' || ch === "'") { inStr = ch; cur += ch; continue; }
                if (ch === '(' || ch === '[') { depth++; cur += ch; continue; }
                if (ch === ')' || ch === ']') { if (depth === 0) break; depth--; cur += ch; continue; }
                if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
                cur += ch;
            }
            parts.push(cur);
            posMatch = parts.map(t => t.trim());
        }
    }
    if (posMatch) {
        const parts = posMatch;
        if (parts.length === 2) {
            posXExpr = parts[0];
            posYExpr = parts[1];
        } else if (parts.length === 3) {
            // Третья координата — только для 3D-сцен; в 2D просто не используется.
            posXExpr = parts[0];
            posYExpr = parts[1];
            posZExpr = parts[2];
            zGiven = true;
        }
    } else {
        const varNameMatch = block.match(/pos\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            // если это переменная типа Vector2, то можно извлечь x и y
            // но пока просто сохраняем как выражение "varName.x" и "varName.y"
            // но парсер не знает тип, поэтому оставим как есть – в evaluate будем разбирать
            posXExpr = varName + '.x';
            posYExpr = varName + '.y';
            posZExpr = varName + '.z'; // используется только в 3D
        }
    }
    if (!posXExpr || !posYExpr) return null;

    // captureExprField корректно захватывает и одиночный строковый литерал ("hello, world"),
    // и выражение-конкатенацию ("x = " + format(A.pos.x, 2)) — запятые внутри вызовов
    // и внутри строк больше не обрывают значение.
    let textExpr = '';
    const rawTextExpr = captureExprField(block, 'text');
    if (rawTextExpr !== null) {
        textExpr = rawTextExpr;
    } else {
        const textMatch = block.match(/(?:^|[^A-Za-z0-9_])text\s*=\s*"([^"]*)"/);
        if (textMatch) textExpr = '"' + textMatch[1] + '"';
    }

    // Без явного color текст идёт за темой страницы (как и все остальные объекты) —
    // раньше дефолтом был жёсткий '#000000', и на тёмной теме подпись была не видна.
    let colorExpr = 'default';
    const colorMatch = matchField(block, /(?:^|[^A-Za-z0-9_])color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (colorMatch) {
        colorExpr = colorMatch[1];
    }

    let sizeExpr = '1';
    const sizeMatch = matchField(block, /(?:^|[^A-Za-z0-9_])size\s*=\s*(-?[\d.]+|default|[a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (sizeMatch) {
        sizeExpr = sizeMatch[1];
    }

    let activeExpr = 'true';
    // active — целое выражение (active = nc > 3 && crK[3] == 1), а не только имя переменной
    const activeFull = captureExprField(block, 'active');
    const activeMatch = matchField(block, /(?:^|[^A-Za-z0-9_])active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (activeFull && activeFull.trim()) activeExpr = activeFull.trim();
    else if (activeMatch) activeExpr = activeMatch[1];

    const layer = parseNumberField(block, vars, 'layer', 45, false);
    const { updateMode, updateInterval } = parseUpdateFields(block, vars);
    // align = left / center / right — к какой стороне текста привязана точка pos
    const alignM = block.match(/(?:^|[^A-Za-z0-9_])align\s*=\s*"?(left|center|right)"?/);
    return { name, posXExpr, posYExpr, posZExpr, zGiven, textExpr, colorExpr, sizeExpr, activeExpr, layer, updateMode, updateInterval, align: alignM ? alignM[1] : null };
}

        function parseClasterBlock(block, vars) {
            const name = parseStringField(block, vars, 'name');
            if (!name) return null;

            let elements = null;
            const elemMatch = block.match(/elements\s*=\s*\(([^)]*)\)/);
            if (elemMatch) {
                const elemStr = elemMatch[1].trim();
                elements = elemStr.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            } else {
                const varNameMatch = block.match(/elements\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (varNameMatch) {
                    const varName = varNameMatch[1];
                    if (vars[varName] !== undefined && Array.isArray(vars[varName])) {
                        elements = vars[varName];
                    }
                }
            }
            if (!elements || elements.length === 0) return null;

            const active = parseBoolField(block, vars, 'active', true);
            // Жёсткая трансформация составного тела: rotate — поворот вокруг центра масс
            // кластера. В 2D используется как угол в градусах (число). В 3D можно также
            // задать тройку (rx, ry, rz) — повороты вокруг осей X/Y/Z в градусах; если дано
            // число, оно трактуется как поворот вокруг оси Z (аналог 2D-плоскости).
            // interact — можно ли перетаскивать кластер целиком мышью (только 2D).
            const rotate = parseNumberField(block, vars, 'rotate', 0, false);
            const rotateExpr = captureExprField(block, 'rotate');
            const rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: rotate || 0 });
            const interact = parseBoolField(block, vars, 'interact', true);
            const collisionFields = parseGeneralCollisionFields(block, vars, false);
            const { updateMode, updateInterval } = parseUpdateFields(block, vars);
            // step — необязательный номер "пункта" пошагового доказательства (proof-режим).
            // Кластер с этим полем виден ТОЛЬКО когда window.__gcCurrentStep равен этому
            // номеру; кластеры без step ведут себя как раньше (управляются только active).
            // Переключение шага приходит СНАРУЖИ (из родительской страницы — аккордеон
            // описания темы типа "доказательство") через postMessage; внутри самой сцены
            // никаких кнопок переключения не добавляется — см. gcSetStep/g3SetStep.
            const step = parseNumberField(block, vars, 'step', null, false);

            return { name, elements, active, rotate, rotateExpr, rotate3D, interact, step, updateMode, updateInterval, ...collisionFields };
        }

let autoNameCounter = 0;
function parseCommands(codeBlock, vars) {
    autoNameCounter = 0;
    syntheticPointCounter = 0;
    syntheticPoints = [];
    const points = [];
    const lines = [];
    const figures = [];
    const primitives = [];
    const sections = [];
    const booleans = [];
    const truncations = [];
    const hulls = [];
    const minkowskis = [];
    const angles3D = [];
    const clusters = [];
    const angles = [];
    const drawAngles = [];
    const drawEqually = [];
    const drawVectors = [];
    const drawInfLines = [];
    const drawInfPlanes = [];
    const drawFillings = [];
    const drawPunctirs = [];
    const drawTexts = [];
    const uiElements = [];
    const circles = [];
    const arcs = [];
    const ellipses = [];
    const curves = [];
    const drawFunctions = [];
    const drawSurfaces = [];
    const drawImages = [];
    const drawHistograms = [];
    const drawFields = [];
    const drawTrajectories = [];
    const drawGraphs = [];
    const drawFractals = [];
    const drawFormulas = [];
    const drawDistributions = [];
    const drawLoci = [];
    const drawTraces = [];
    const drawRegions = [];
    const drawCharts = [];
    const drawTrees = [];
    const drawTables = [];
    const drawComplexes = [];
    const drawHyperbolics = [];
    const drawBifurcations = [];
    const drawCobwebs = [];
    const drawIFSs = [];
    const drawAutomata = [];
    const drawVoronois = [];
    const drawFouriers = [];
    const drawDiagrams = [];
    const drawTensorFields = [];
    const drawScatter3Ds = [];
    const drawHistogram3Ds = [];
    const errors = [];

    // Все объектные блоки извлекаются балансным сканером (findHeaderedBlocks):
    // вложенные { } и '};' внутри строковых значений больше не обрывают блок.
    // dual: true                — тип существует и в 2D, и в 3D; конкретное измерение задаётся
    //               суффиксом в самом ключевом слове (Point2D → dim='2D', Point3D → dim='3D').
    //               Без суффикса у Point измерение сразу берётся '2D' (у самой точки нет ничего,
    //               из чего можно было бы его вывести — она базовый примитив).
    // dual + infer: true — тоже 2D/3D-тип, суффикс работает так же, НО без суффикса измерение
    //               НЕ фиксируется сразу, а откладывается (dim=null) до отдельного прохода
    //               автоопределения сразу после parseCommands (ищет его по фактическим ссылкам —
    //               на какие точки/линии/фигуры указывает объект, или по собственным полям вроде
    //               z(t)/R/mode/start, которые и так уже различают 2D/3D-варианты).
    // fixedDim     — тип однозначно принадлежит одному измерению (историческая причина —
    //               либо возможности только 3D-сцены (Primitive/Section/Boolean/Angle3D/InfPlane),
    //               либо чисто плоские алгоритмические визуализации (фракталы, автоматы, Вороной,
    //               гистограммы и т.п.); суффикс тут не нужен и не добавляется.
    // Примечание: у Angle/draw Angle сознательно нет 3D-варианта — ключевое слово "Angle3D" уже
    // занято отдельным, самостоятельным типом объекта (угол между линиями/плоскостями в 3D,
    // с полями type/refs), и добавление суффикса 3D к обычному Angle пересеклось бы с ним.
    const blockDefs = [
        { header: '\\bnew\\s+Point(2D|3D)?\\b',        label: 'Point',           parse: parsePointBlock,        target: points,          dual: true, infer: true, err: 'пропущены обязательные поля (name, pos или line/circle/graph/...)' },
        { header: '\\bnew\\s+Line(2D|3D)?\\b',         label: 'Line',            parse: parseLineBlock,         target: lines,           dual: true, infer: true, err: 'пропущены обязательные поля (name, pos)' },
        { header: '\\bnew\\s+Figure(2D|3D)?\\b',       label: 'Figure',          parse: parseFigureBlock,       target: figures,         dual: true, infer: true, err: 'пропущены обязательные поля (name, elements)' },
        { header: '\\bnew\\s+Primitive\\b',    label: 'Primitive',       parse: parsePrimitiveBlock,    target: primitives,      fixedDim: '3D', err: 'пропущены обязательные поля (name, type — один из: ' + PRIMITIVE_TYPES.join(', ') + ')' },
        { header: '\\bnew\\s+Section\\b',      label: 'Section',         parse: parseSectionBlock,      target: sections,        fixedDim: '3D', err: 'пропущены обязательные поля (name, source)', trackPos: true },
        { header: '\\bnew\\s+Boolean\\b',      label: 'Boolean',         parse: parseBooleanBlock,      target: booleans,        fixedDim: '3D', err: 'пропущены обязательные поля (name, op — union/intersect/subtract, parts — минимум 2 элемента)', trackPos: true },
        { header: '\\bnew\\s+Truncate\\b',     label: 'Truncate',        parse: parseTruncateBlock,     target: truncations,     fixedDim: '3D', err: 'пропущены обязательные поля (name, source)', trackPos: true },
        { header: '\\bnew\\s+Hull\\b',         label: 'Hull',            parse: parseHullBlock,         target: hulls,           fixedDim: '3D', err: 'пропущены обязательные поля (name, parts — минимум 1 элемент)', trackPos: true },
        { header: '\\bnew\\s+Minkowski\\b',    label: 'Minkowski',       parse: parseMinkowskiBlock,    target: minkowskis,      fixedDim: '3D', err: 'пропущены обязательные поля (name, parts — минимум 2 элемента)', trackPos: true },
        { header: '\\bnew\\s+Angle3D\\b',      label: 'Angle3D',         parse: parseAngle3DBlock,      target: angles3D,        fixedDim: '3D', err: 'пропущены обязательные поля (name, type — один из: ' + ANGLE3D_TYPES.join(', ') + ', и соответствующие точки/линии/плоскости)' },
        { header: '\\bnew\\s+Claster(2D|3D)?\\b',      label: 'Claster',         parse: parseClasterBlock,      target: clusters,        dual: true, infer: true, err: 'пропущены обязательные поля (name, elements)' },
        { header: '\\bnew\\s+Angle\\b',        label: 'Angle',           parse: parseAngleBlock,        target: angles,          fixedDim: '2D', err: 'пропущены обязательные поля (name, lines)' },
        { header: '\\bdraw\\s+Angle\\b',       label: 'draw Angle',      parse: parseDrawAngleBlock,    target: drawAngles,      fixedDim: '2D', err: 'пропущено обязательное поле (angle)' },
        { header: '\\bdraw\\s+EquallySing\\b', label: 'draw EquallySing',parse: parseEquallySingBlock,  target: drawEqually,     err: 'пропущены обязательные поля (edges)' },
        { header: '\\bdraw\\s+Vector(2D|3D)?\\b',      label: 'draw Vector',     parse: parseVectorBlock,       target: drawVectors,     dual: true, infer: true, err: 'пропущены обязательные поля (edge)' },
        { header: '\\bdraw\\s+InfLine\\b',     label: 'draw InfLine',    parse: parseInfLineBlock,      target: drawInfLines,    err: 'пропущены обязательные поля (line)' },
        { header: '\\bdraw\\s+InfPlane\\b',    label: 'draw InfPlane',   parse: parseInfPlaneBlock,     target: drawInfPlanes,   fixedDim: '3D', err: 'пропущены обязательные поля (name и figure/points)' },
        { header: '\\bdraw\\s+Filling(2D|3D)?\\b',     label: 'draw Filling',    parse: parseFillingBlock,      target: drawFillings,    dual: true, infer: true, err: 'пропущены обязательные поля (figure, или line+side, или circle+from+to, или func — площадь под графиком/между графиками)' },
        { header: '\\bdraw\\s+Punctir\\b',     label: 'draw Punctir',    parse: parsePunctirBlock,      target: drawPunctirs,    err: 'пропущены обязательные поля (line)' },
        { header: '\\bdraw\\s+Text(2D|3D)?\\b',        label: 'draw Text',       parse: parseDrawTextBlock,     target: drawTexts,       dual: true, infer: true, err: 'пропущены обязательные поля (name, pos)' },
        { header: '\\bnew\\s+UI\\b',           label: 'UI',              parse: parseUIBlock,           target: uiElements,      err: 'пропущены обязательные поля (type и его параметры)' },
        { header: '\\bnew\\s+Circle\\b',       label: 'Circle',          parse: parseCircleBlock,       target: circles,         fixedDim: '2D', err: 'пропущены обязательные поля (name, center, radius)' },
        { header: '\\bdraw\\s+Arc\\b',         label: 'draw Arc',        parse: parseArcBlock,          target: arcs,            fixedDim: '2D', err: 'пропущены обязательные поля (name и center+from+to или points)' },
        { header: '\\bnew\\s+Ellipse\\b',      label: 'Ellipse',         parse: parseEllipseBlock,      target: ellipses,        fixedDim: '2D', err: 'пропущены обязательные поля (name, center, a, b или points/foci)' },
        { header: '\\bnew\\s+Curve(2D|3D)?\\b',        label: 'Curve',           parse: parseCurveBlock,        target: curves,          dual: true, infer: true, err: 'пропущены обязательные поля (name и points или x+y)' },
        { header: '\\bdraw\\s+Function\\b',    label: 'draw Function',   parse: parseFunctionGraphBlock,target: drawFunctions,   fixedDim: '2D', err: 'пропущены обязательные поля (name, f)' },
        { header: '\\bdraw\\s+Surface(2D|3D)?\\b',     label: 'draw Surface',    parse: parseSurfaceBlock,      target: drawSurfaces,    dual: true, infer: true, err: 'пропущены обязательные поля (name, f)' },
        { header: '\\bdraw\\s+Image\\b',       label: 'draw Image',      parse: parseImageBlock,        target: drawImages,      err: 'пропущены обязательные поля (name, src, pos)' },
        { header: '\\bdraw\\s+Histogram\\b',   label: 'draw Histogram',  parse: parseHistogramBlock,    target: drawHistograms,  err: 'пропущены обязательные поля (name, data)' },
        { header: '\\bdraw\\s+Field(2D|3D)?\\b',       label: 'draw Field',      parse: parseFieldBlock,        target: drawFields,      dual: true, infer: true, err: 'пропущены обязательные поля (name, P, Q)' },
        { header: '\\bdraw\\s+Trajectory(2D|3D)?\\b',  label: 'draw Trajectory', parse: parseTrajectoryBlock,   target: drawTrajectories,dual: true, infer: true, err: 'пропущены обязательные поля (name, start, и один из: system / field / P+Q)' },
        { header: '\\bdraw\\s+Graph\\b',       label: 'draw Graph',      parse: parseGraphDrawBlock,    target: drawGraphs,      err: 'пропущены обязательные поля (name, graph)' },
        { header: '\\bdraw\\s+Fractal\\b',     label: 'draw Fractal',    parse: parseFractalBlock,      target: drawFractals,    err: 'пропущены обязательные поля (name; для julia — cRe и cIm)' },
        { header: '\\bdraw\\s+Formula\\b',     label: 'draw Formula',    parse: parseFormulaBlock,      target: drawFormulas,    fixedDim: '2D', err: 'пропущены обязательные поля (name, pos, latex)' },
        { header: '\\bdraw\\s+Distribution\\b',label: 'draw Distribution',parse: parseDistributionBlock,target: drawDistributions,fixedDim: '2D', err: 'пропущено обязательное поле (name) или некорректные параметры распределения (type — normal/binomial/poisson/uniform/exponential)' },
        { header: '\\bdraw\\s+Locus\\b',       label: 'draw Locus',      parse: parseLocusBlock,        target: drawLoci,        fixedDim: '2D', err: 'пропущены обязательные поля (name, point, driver)' },
        { header: '\\bdraw\\s+Trace\\b',       label: 'draw Trace',      parse: parseTraceBlock,        target: drawTraces,      err: 'пропущены обязательные поля (name, point)' },
        { header: '\\bdraw\\s+Region\\b',      label: 'draw Region',     parse: parseRegionBlock,       target: drawRegions,     err: 'пропущены обязательные поля (name, f)' },
        { header: '\\bdraw\\s+Chart\\b',       label: 'draw Chart',      parse: parseChartBlock,        target: drawCharts,      err: 'пропущены обязательные поля (name, data)' },
        { header: '\\bdraw\\s+Tree\\b',        label: 'draw Tree',       parse: parseTreeBlock,         target: drawTrees,       err: 'пропущены обязательные поля (name, data)' },
        { header: '\\bdraw\\s+Table\\b',       label: 'draw Table',      parse: parseTableBlock,        target: drawTables,      err: 'пропущены обязательные поля (name, data)' },
        { header: '\\bdraw\\s+Complex\\b',     label: 'draw Complex',    parse: parseComplexBlock,      target: drawComplexes,   err: 'пропущены обязательные поля (name, f)' },
        { header: '\\bdraw\\s+Hyperbolic\\b',  label: 'draw Hyperbolic', parse: parseHyperbolicBlock,   target: drawHyperbolics,  err: 'пропущено обязательное поле (name)' },
        { header: '\\bdraw\\s+Bifurcation\\b', label: 'draw Bifurcation', parse: parseBifurcationBlock, target: drawBifurcations, err: 'пропущены обязательные поля (name, f)' },
        { header: '\\bdraw\\s+Cobweb\\b', label: 'draw Cobweb', parse: parseCobwebBlock, target: drawCobwebs, err: 'пропущены обязательные поля (name, f)' },
        { header: '\\bdraw\\s+IFS\\b', label: 'draw IFS', parse: parseIFSBlock, target: drawIFSs, err: 'пропущены обязательные поля (name, maps)' },
        { header: '\\bdraw\\s+Automaton\\b', label: 'draw Automaton', parse: parseAutomatonBlock, target: drawAutomata, err: 'пропущено обязательное поле (name)' },
        { header: '\\bdraw\\s+Voronoi\\b', label: 'draw Voronoi', parse: parseVoronoiBlock, target: drawVoronois, err: 'пропущено обязательное поле (name)' },
        { header: '\\bdraw\\s+Fourier\\b', label: 'draw Fourier', parse: parseFourierBlock, target: drawFouriers, fixedDim: '2D', err: 'пропущены обязательные поля (name, path)' },
        { header: '\\bdraw\\s+Diagram\\b', label: 'draw Diagram', parse: parseDiagramBlock, target: drawDiagrams, fixedDim: '2D', err: 'пропущены обязательные поля (name, nodes)' },
        { header: '\\bdraw\\s+TensorField\\b', label: 'draw TensorField', parse: parseTensorFieldBlock, target: drawTensorFields, fixedDim: '3D', err: 'пропущены обязательные поля (name, Txx, Tyy, Tzz)' },
        { header: '\\bdraw\\s+Scatter3D\\b', label: 'draw Scatter3D', parse: parseScatter3DBlock, target: drawScatter3Ds, fixedDim: '3D', err: 'пропущено обязательное поле (name, data)' },
        { header: '\\bdraw\\s+Histogram3D\\b', label: 'draw Histogram3D', parse: parseHistogram3DBlock, target: drawHistogram3Ds, fixedDim: '3D', err: 'пропущено обязательное поле (name, data)' }
    ];
    for (const def of blockDefs) {
        for (const b of findHeaderedBlocks(codeBlock, def.header)) {
            const parsed = def.parse(b.body, vars);
            if (parsed) {
                if (def.dual) {
                    if (b.groups && b.groups[1]) parsed.dim = b.groups[1].toUpperCase();
                    else parsed.dim = def.infer ? null : '2D';
                }
                else if (def.fixedDim) parsed.dim = def.fixedDim;
                parsed.__pos = b.start; // всегда — используется во всех последующих проверках ссылок для указания места ошибки
                def.target.push(parsed);
            }
            else {
                const hints = diagnoseBlockIssues(b.body);
                const hintText = hints.length ? ` Похоже, дело в следующем: ${hints.join('; ')}.` : '';
                errors.push({ line: '--', message: `Ошибка в блоке ${def.label}: ${def.err}.${hintText}`, __pos: b.start });
            }
        }
    }

    // Скрытые точки, порождённые буквальными координатами (x, y) вместо имени точки — везде, где ожидалась точка
    points.push(...syntheticPoints);

    // ----- Автоопределение измерения (2D/3D) для типов, написанных БЕЗ явного суффикса -----
    // Явный Line2D/Line3D (и т.п.) уже выставлен выше и сюда не попадает (dim уже не null).
    // Для голого "Line"/"Figure"/... измерение выводится из того, на что объект реально
    // ссылается — какого измерения точки/линии/фигуры, либо (если ссылок на точки нет,
    // как у draw Surface/Field/Trajectory) из собственных полей объекта (z(t)/R/mode/start),
    // которые и так уже различают 2D/3D-варианты. Порядок ниже важен: каждый следующий шаг
    // опирается на то, что предыдущий уже разрешил свои dim.
    // Точки construct (bisector/median/altitude) наследуют dim от vertex/base; точки
    // transform (reflect/rotate/homothety/translate) — от transformSource (обычная точка-
    // трансформация) или от transformSourceLine (синтетические концы transform-линии,
    // см. parseLineBlock) — раньше в обоих случаях dim не наследовался (оставался
    // дефолтным/жёстким '2D'), из-за чего трансформация 3D-объекта в 3D-сцене создавала
    // 2D-точки и валилась валидация ниже. Линии в общем случае наследуют dim от своих точек,
    // но если точка — сама синтетический конец transform-линии, её dim нужно сначала
    // разрешить от ИСХОДНОЙ линии, поэтому точки и линии выводятся вместе, в несколько
    // проходов (на случай цепочек: поворот отражённой линии и т.п.).
    for (let pass = 0; pass < 6; pass++) {
        let changed = false;
        for (let p of points) {
            if (p.dim) continue;
            if (p.construct) {
                const vertexPt = points.find(pp => pp.name === p.vertex);
                const basePt = points.find(pp => pp.name === p.base);
                const d = (vertexPt && vertexPt.dim) || (basePt && basePt.dim);
                if (d) { p.dim = d; changed = true; }
            } else if (p.transformSourceLine) {
                const srcLine = lines.find(l => l.name === p.transformSourceLine);
                if (srcLine && srcLine.dim) { p.dim = srcLine.dim; changed = true; }
            } else if (p.transform) {
                const srcPt = points.find(pp => pp.name === p.transformSource);
                if (srcPt && srcPt.dim) { p.dim = srcPt.dim; changed = true; }
            } else {
                p.dim = '2D';
                changed = true;
            }
        }
        for (let l of lines) {
            if (l.dim) continue;
            const pA = points.find(p => p.name === l.pointA);
            const pB = points.find(p => p.name === l.pointB);
            if (pA && pA.transform && !pA.dim) continue; // ждём, пока синтетическая точка получит dim выше
            const d = (pA && pA.dim) || (pB && pB.dim);
            if (d) { l.dim = d; changed = true; }
            else if (!(pA && pA.transform)) { l.dim = '2D'; changed = true; }
        }
        if (!changed) break;
    }
    // Safety-net: битая ссылка на несуществующий источник (например, опечатка в vertex/
    // transformSource) не должна оставлять dim пустым — иначе дальнейшие проверки/рендер
    // упадут на null. Дефолт '2D' — то же поведение, что было раньше для всех точек.
    for (let p of points) { if (!p.dim) p.dim = '2D'; }
    for (let l of lines) { if (!l.dim) l.dim = '2D'; }
    for (let cv of curves) {
        if (cv.dim) continue;
        if (cv.type === 'bezier') {
            const p0 = points.find(p => p.name === (cv.controlPoints || [])[0]);
            cv.dim = (p0 && p0.dim) || '2D';
        } else if (cv.type === 'spiral' || cv.type === 'cycloid' || cv.type === 'involute') {
            const p0 = points.find(p => p.name === cv.centerName);
            cv.dim = (p0 && p0.dim) || '2D';
        } else {
            // parametric: x(t)/y(t) всегда заданы, z(t) — опциональна и есть только у 3D-кривых.
            cv.dim = cv.zExpr ? '3D' : '2D';
        }
    }
    for (let f of figures) {
        if (f.dim) continue;
        let found = null;
        for (const elem of f.elements) {
            found = points.find(p => p.name === elem) || lines.find(ln => ln.name === elem);
            if (found) break;
        }
        f.dim = (found && found.dim) || '2D';
    }
    for (let d of drawFillings) {
        if (d.dim) continue;
        if (d.func) { d.dim = '2D'; continue; } // draw Function существует только в 2D
        if (d.circle || d.arc) { d.dim = '2D'; continue; } // Circle/Arc всегда 2D
        if (d.figure) { const fg = figures.find(f => f.name === d.figure); d.dim = (fg && fg.dim) || '2D'; continue; }
        if (d.line) { const ln = lines.find(l => l.name === d.line); d.dim = (ln && ln.dim) || '2D'; continue; }
        d.dim = '2D';
    }
    for (let d of drawVectors) {
        if (d.dim) continue;
        const ln = lines.find(l => l.name === d.edge);
        d.dim = (ln && ln.dim) || '2D';
    }
    // draw InfLine: раньше был жёстко только 2D. Теперь измерение выводится из линии-edge —
    // если edge ссылается на Line3D, InfLine продолжает её бесконечно в 3D-пространстве
    // (аналогично тому, как draw InfPlane продолжает плоскость по трём точкам).
    for (let d of drawInfLines) {
        if (d.dim) continue;
        const ln = lines.find(l => l.name === d.edge);
        d.dim = (ln && ln.dim) || '2D';
    }
    // draw Punctir: тоже раньше был жёстко только 2D; теперь наследует dim линии-edge.
    for (let d of drawPunctirs) {
        if (d.dim) continue;
        const ln = lines.find(l => l.name === d.edge);
        d.dim = (ln && ln.dim) || '2D';
    }
    // draw EquallySing: тоже был жёстко только 2D; теперь наследует dim от первого
    // разрешимого edge (обычно все рёбра группы в одном измерении).
    for (let d of drawEqually) {
        if (d.dim) continue;
        let dim = null;
        for (const en of d.edges) {
            const ln = lines.find(l => l.name === en);
            if (ln && ln.dim) { dim = ln.dim; break; }
        }
        d.dim = dim || '2D';
    }
    // draw Trace: раньше был жёстко только 2D; теперь наследует dim от точки point —
    // если это Point3D, след накапливается и рисуется прямо в 3D-пространстве.
    for (let d of drawTraces) {
        if (d.dim) continue;
        const pt = points.find(p => p.name === d.pointName);
        d.dim = (pt && pt.dim) || '2D';
    }
    for (let d of drawTexts) {
        if (d.dim) continue;
        d.dim = d.zGiven ? '3D' : '2D';
    }
    for (let d of drawSurfaces) {
        if (d.dim) continue;
        // parametric (x(u,v)/y(u,v)/z(u,v)) и implicit (f(x,y,z) = level, marching cubes) —
        // по построению всегда 3D-поверхности. heightfield различает 2D/3D через поле mode
        // ("contour" | "3d").
        d.dim = (d.type === 'parametric' || d.type === 'implicit') ? '3D' : ((d.mode === '3d') ? '3D' : '2D');
    }
    for (let d of drawFields) {
        if (d.dim) continue;
        // R — третья (вертикальная) компонента поля; задана только у 3D-полей.
        d.dim = d.rExpr ? '3D' : '2D';
    }
    for (let d of drawTrajectories) {
        if (d.dim) continue;
        if (d.fieldName) {
            const fld = drawFields.find(f => f.name === d.fieldName);
            d.dim = (fld && fld.dim) || ((d.start && d.start.length === 3) ? '3D' : '2D');
        } else {
            d.dim = (d.rExpr || (d.start && d.start.length === 3)) ? '3D' : '2D';
        }
    }

    // ----- Валидации -----
    for (let l of lines) {
        const pA = points.find(p => p.name === l.pointA);
        const pB = points.find(p => p.name === l.pointB);
        if (!pA || !pB) { errors.push({ line: '--', message: `Линия "${l.name}" ссылается на несуществующую точку.`, __pos: l.__pos }); continue; }
        if (pA.dim !== l.dim || pB.dim !== l.dim) {
            errors.push({ line: '--', message: `Line${l.dim} "${l.name}" ссылается на точку другого измерения — обе точки должны быть Point${l.dim}`, __pos: l.__pos });
        }
    }

    for (let p of points) {
        if (p.line) {
            const line = lines.find(l => l.name === p.line);
            if (!line) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую линию "${p.line}"`, __pos: p.__pos });
        }
        if (p.circle) {
            const circle = circles.find(c => c.name === p.circle);
            if (!circle) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую окружность "${p.circle}"`, __pos: p.__pos });
        }
        if (p.graph) {
            const g = drawFunctions.find(d => d.name === p.graph);
            if (!g) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующий график функции "${p.graph}"`, __pos: p.__pos });
        }
        if (p.ellipse) {
            const ellipse = ellipses.find(e => e.name === p.ellipse);
            if (!ellipse) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующий эллипс "${p.ellipse}"`, __pos: p.__pos });
        }
        if (p.curve) {
            const curve = curves.find(c => c.name === p.curve);
            if (!curve) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую кривую "${p.curve}"`, __pos: p.__pos });
        }
        if (p.arc) {
            const arc = arcs.find(a => a.name === p.arc);
            if (!arc) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую дугу "${p.arc}"`, __pos: p.__pos });
        }
        if (p.transform) {
            if (p.transformSourceLine) {
                if (!lines.find(l => l.name === p.transformSourceLine)) {
                    errors.push({ line: '--', message: `Линия ссылается на несуществующую исходную линию "${p.transformSourceLine}"`, __pos: p.__pos });
                }
            } else if (!points.find(pp => pp.name === p.transformSource)) {
                errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую исходную точку "${p.transformSource}"`, __pos: p.__pos });
            }
            const ref = p.transformOver || p.transformAround || p.transformCenter;
            if (ref && !points.find(pp => pp.name === ref) && !lines.find(l => l.name === ref)) {
                errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую точку/линию "${ref}"`, __pos: p.__pos });
            }
        }
    }

    for (let f of figures) {
        const allPointNames = [];
        for (let elem of f.elements) {
            const line = lines.find(l => l.name === elem);
            if (line) {
                if (!allPointNames.includes(line.pointA)) allPointNames.push(line.pointA);
                if (!allPointNames.includes(line.pointB)) allPointNames.push(line.pointB);
                continue;
            }
            const point = points.find(p => p.name === elem);
            if (point) {
                if (!allPointNames.includes(elem)) allPointNames.push(elem);
                continue;
            }
            errors.push({ line: '--', message: `Фигура "${f.name}" содержит неизвестный элемент "${elem}"${/\s/.test(elem) ? ' — похоже, здесь пропущена запятая между элементами списка' : ''}`, __pos: f.__pos });
        }
        f.pointNames = allPointNames;
        for (let pn of allPointNames) {
            const pt = points.find(p => p.name === pn);
            if (!pt) errors.push({ line: '--', message: `Фигура "${f.name}" ссылается на несуществующую точку "${pn}"`, __pos: f.__pos });
            else if (pt.dim !== f.dim) errors.push({ line: '--', message: `Figure${f.dim} "${f.name}" ссылается на точку "${pn}" другого измерения — ожидается Point${f.dim}`, __pos: f.__pos });
        }
    }

    // Section/Boolean — «производные» объекты; чтобы их можно было ссылаться друг на друга
    // в любом порядке (сечение среза, булева операция над сечениями и т.д.), они объединяются
    // в единый список, отсортированный по позиции в исходном тексте (__pos), и обрабатываются
    // в рантайме в этом порядке. Ссылка вперёд (на объект, объявленный ниже по файлу) запрещена —
    // это делает построение геометрии в браузере однопроходным и предсказуемым.
    const derivedOps = [
        ...sections.map(s => ({ ...s, kind: 'section' })),
        ...booleans.map(b => ({ ...b, kind: 'boolean' })),
        ...truncations.map(t => ({ ...t, kind: 'truncate' })),
        ...hulls.map(h => ({ ...h, kind: 'hull' })),
        ...minkowskis.map(m => ({ ...m, kind: 'minkowski' })),
    ].sort((a, b) => a.__pos - b.__pos);

    {
        const primitiveNames = new Set(primitives.map(p => p.name));
        const posByName = new Map();
        for (const op of derivedOps) posByName.set(op.name, op.__pos);
        const singleSourceKinds = { section: 'Section', truncate: 'Truncate' };
        const multiPartsKinds = { boolean: 'Boolean', hull: 'Hull', minkowski: 'Minkowski' };
        for (const op of derivedOps) {
            const isSingle = !!singleSourceKinds[op.kind];
            const refs = isSingle ? [op.source] : op.parts;
            const label = isSingle ? singleSourceKinds[op.kind] : multiPartsKinds[op.kind];
            if (isSingle && op.source === op.name) {
                errors.push({ line: '--', message: `${label} "${op.name}" не может ссылаться сам на себя`, __pos: op.__pos });
                continue;
            }
            if (!isSingle && op.parts.includes(op.name)) {
                errors.push({ line: '--', message: `${label} "${op.name}" не может ссылаться сам на себя`, __pos: op.__pos });
                continue;
            }
            for (const refName of refs) {
                if (primitiveNames.has(refName)) continue;
                if (posByName.has(refName)) {
                    if (posByName.get(refName) >= op.__pos) {
                        errors.push({ line: '--', message: `${label} "${op.name}" ссылается на "${refName}", объявленный позже (Section/Boolean/Truncate/Hull/Minkowski должны ссылаться только на ранее объявленные Primitive/Section/Boolean/Truncate/Hull/Minkowski)`, __pos: op.__pos });
                    }
                    continue;
                }
                errors.push({ line: '--', message: `${label} "${op.name}" ссылается на неизвестный объект "${refName}"`, __pos: op.__pos });
            }
        }
    }

    // Валидация кластеров – теперь с учётом всех draw-элементов
    for (let c of clusters) {
        const allElements = [];
        // Раньше здесь искалась лишь небольшая часть типов объектов — remaining типы (UI-контролы
        // и большинство draw Xxx-визуализаций) считались "неизвестным элементом", даже если
        // реально существовали в сцене, и кластер с ними просто не компилировался. Теперь ищем
        // по всем типам, что и в рантайм-резолвере (см. initClusters в generate2D/generate3D).
        const findElem = (elem) => points.find(p => p.name === elem) ||
                          lines.find(l => l.name === elem) ||
                          figures.find(f => f.name === elem) ||
                          primitives.find(pr => pr.name === elem) ||
                          derivedOps.find(op => op.name === elem) ||
                          circles.find(cir => cir.name === elem) ||
                          arcs.find(ar => ar.name === elem) ||
                          ellipses.find(el => el.name === elem) ||
                          curves.find(cv => cv.name === elem) ||
                          angles.find(a => a.name === elem) ||
                          angles3D.find(a => a.name === elem) ||
                          drawAngles.find(d => d.name === elem) ||
                          drawEqually.find(d => d.name === elem) ||
                          drawVectors.find(d => d.name === elem) ||
                          drawInfLines.find(d => d.name === elem) ||
                          drawFillings.find(d => d.name === elem) ||
                          drawPunctirs.find(d => d.name === elem) ||
                          drawTexts.find(d => d.name === elem) ||
                          uiElements.find(d => d.name === elem) ||
                          drawFunctions.find(d => d.name === elem) ||
                          drawSurfaces.find(d => d.name === elem) ||
                          drawImages.find(d => d.name === elem) ||
                          drawHistograms.find(d => d.name === elem) ||
                          drawFields.find(d => d.name === elem) ||
                          drawTrajectories.find(d => d.name === elem) ||
                          drawGraphs.find(d => d.name === elem) ||
                          drawFractals.find(d => d.name === elem) ||
                          drawFormulas.find(d => d.name === elem) ||
                          drawDistributions.find(d => d.name === elem) ||
                          drawLoci.find(d => d.name === elem) ||
                          drawTraces.find(d => d.name === elem) ||
                          drawRegions.find(d => d.name === elem) ||
                          drawCharts.find(d => d.name === elem) ||
                          drawTrees.find(d => d.name === elem) ||
                          drawTables.find(d => d.name === elem) ||
                          drawComplexes.find(d => d.name === elem) ||
                          drawHyperbolics.find(d => d.name === elem) ||
                          drawBifurcations.find(d => d.name === elem) ||
                          drawCobwebs.find(d => d.name === elem) ||
                          drawIFSs.find(d => d.name === elem) ||
                          drawAutomata.find(d => d.name === elem) ||
                          drawVoronois.find(d => d.name === elem) ||
                          drawFouriers.find(d => d.name === elem) ||
                          drawDiagrams.find(d => d.name === elem) ||
                          drawTensorFields.find(d => d.name === elem) ||
                          drawScatter3Ds.find(d => d.name === elem) ||
                          drawHistogram3Ds.find(d => d.name === elem);
        if (!c.dim) {
            for (const elem of c.elements) {
                const found = findElem(elem);
                if (found && found.dim) { c.dim = found.dim; break; }
            }
            if (!c.dim) c.dim = '2D';
        }
        for (let elem of c.elements) {
            const found = findElem(elem);
            if (!found) { errors.push({ line: '--', message: `Кластер "${c.name}" содержит неизвестный элемент "${elem}"${/\s/.test(elem) ? ' — похоже, здесь пропущена запятая между элементами списка' : ''}`, __pos: c.__pos }); continue; }
            if (found.dim && found.dim !== c.dim) {
                errors.push({ line: '--', message: `Claster${c.dim} "${c.name}" содержит элемент "${elem}" другого измерения (${found.dim}) — кластер и его элементы должны быть в одном пространстве`, __pos: c.__pos });
                continue;
            }
            allElements.push(elem);
        }
        c.elements = allElements;
    }

    for (let pr of primitives) {
        if (pr.width <= 0 || pr.height <= 0 || pr.depth <= 0 || pr.edge <= 0 || pr.radius <= 0 || pr.tube <= 0) {
            errors.push({ line: '--', message: `Примитив "${pr.name}" (${pr.type}): размеры должны быть положительными числами`, __pos: pr.__pos });
        }
    }

    for (let a3 of angles3D) {
        const allRefs = Object.values(a3.refs).concat(a3.vertexOverride ? [a3.vertexOverride] : []);
        for (const r of allRefs) {
            if (r.point && !points.find(p => p.name === r.point)) {
                errors.push({ line: '--', message: `Angle3D "${a3.name}" ссылается на несуществующую точку "${r.point}"`, __pos: a3.__pos });
            }
        }
    }

    for (let a of angles) {
        const l1 = lines.find(l => l.name === a.lineNames[0]);
        const l2 = lines.find(l => l.name === a.lineNames[1]);
        if (!l1 || !l2) {
            errors.push({ line: '--', message: `Угол "${a.name}" ссылается на несуществующую линию.`, __pos: a.__pos });
            continue;
        }
        if (l1.dim !== '2D' || l2.dim !== '2D') {
            errors.push({ line: '--', message: `Угол "${a.name}" — Angle работает только с Line2D (3D-линии сюда передавать нельзя)`, __pos: a.__pos });
            continue;
        }
        const p1 = points.find(p => p.name === l1.pointA);
        const p2 = points.find(p => p.name === l1.pointB);
        const p3 = points.find(p => p.name === l2.pointA);
        const p4 = points.find(p => p.name === l2.pointB);
        const common = [p1, p2].find(p => p === p3 || p === p4);
        if (!common) errors.push({ line: '--', message: `Линии угла "${a.name}" не имеют общей вершины.`, __pos: a.__pos });
    }

    for (let d of drawAngles) {
        const angle = angles.find(a => a.name === d.angleName);
        if (!angle) errors.push({ line: '--', message: `draw Angle "${d.name}" ссылается на неизвестный угол "${d.angleName}"`, __pos: d.__pos });
    }

    for (let c of circles) {
        if (c.type === 'FromRadius') {
            const centerPoint = points.find(p => p.name === c.centerName);
            if (!centerPoint) errors.push({ line: '--', message: `Окружность "${c.name}" ссылается на несуществующую точку "${c.centerName}"`, __pos: c.__pos });
            if (typeof c.radius === 'string') {
                const radiusPoint = points.find(p => p.name === c.radius);
                if (!radiusPoint) errors.push({ line: '--', message: `Окружность "${c.name}" использует радиус-точку "${c.radius}", которая не найдена`, __pos: c.__pos });
            }
        } else if (c.type === 'FromPoints') {
            for (let pn of c.pointNames) {
                if (!points.find(p => p.name === pn)) errors.push({ line: '--', message: `Окружность "${c.name}" ссылается на несуществующую точку "${pn}"`, __pos: c.__pos });
            }
        }
    }

    for (let a of arcs) {
        if (a.type === 'ThreePoints') {
            for (let pn of a.pointNames) {
                if (!points.find(p => p.name === pn)) errors.push({ line: '--', message: `Дуга "${a.name}" (ThreePoints) ссылается на несуществующую точку "${pn}"`, __pos: a.__pos });
            }
            continue;
        }
        if (!points.find(p => p.name === a.centerName)) errors.push({ line: '--', message: `Дуга "${a.name}" ссылается на несуществующую точку центра "${a.centerName}"`, __pos: a.__pos });
        if (!points.find(p => p.name === a.from)) errors.push({ line: '--', message: `Дуга "${a.name}" ссылается на несуществующую точку "from"`, __pos: a.__pos });
        if (!points.find(p => p.name === a.to)) errors.push({ line: '--', message: `Дуга "${a.name}" ссылается на несуществующую точку "to"`, __pos: a.__pos });
        if (typeof a.radius === 'string' && !points.find(p => p.name === a.radius)) {
            errors.push({ line: '--', message: `Дуга "${a.name}" использует радиус-точку "${a.radius}", которая не найдена`, __pos: a.__pos });
        }
    }

    for (let e of ellipses) {
        if (e.type === 'FromPoints') {
            for (let pn of e.pointNames) {
                if (!points.find(p => p.name === pn)) errors.push({ line: '--', message: `Эллипс "${e.name}" (FromPoints) ссылается на несуществующую точку "${pn}"`, __pos: e.__pos });
            }
        } else if (e.type === 'ByFoci') {
            if (!points.find(p => p.name === e.focus1)) errors.push({ line: '--', message: `Эллипс "${e.name}" (ByFoci) ссылается на несуществующий фокус "${e.focus1}"`, __pos: e.__pos });
            if (!points.find(p => p.name === e.focus2)) errors.push({ line: '--', message: `Эллипс "${e.name}" (ByFoci) ссылается на несуществующий фокус "${e.focus2}"`, __pos: e.__pos });
        } else {
            if (!points.find(p => p.name === e.centerName)) errors.push({ line: '--', message: `Эллипс "${e.name}" ссылается на несуществующую точку центра "${e.centerName}"`, __pos: e.__pos });
        }
    }

    for (let cv of curves) {
        if (cv.type === 'bezier') {
            for (let pn of cv.controlPoints) {
                const pt = points.find(p => p.name === pn);
                if (!pt) errors.push({ line: '--', message: `Кривая "${cv.name}" ссылается на несуществующую контрольную точку "${pn}"`, __pos: cv.__pos });
                else if (pt.dim !== cv.dim) errors.push({ line: '--', message: `Curve${cv.dim} "${cv.name}" ссылается на контрольную точку "${pn}" другого измерения — ожидается Point${cv.dim}`, __pos: cv.__pos });
            }
        } else if (cv.type === 'spiral' || cv.type === 'cycloid' || cv.type === 'involute') {
            const pt = points.find(p => p.name === cv.centerName);
            if (!pt) errors.push({ line: '--', message: `Кривая "${cv.name}" ссылается на несуществующую опорную точку "${cv.centerName}"`, __pos: cv.__pos });
            else if (pt.dim !== cv.dim) errors.push({ line: '--', message: `Curve${cv.dim} "${cv.name}" ссылается на опорную точку "${cv.centerName}" другого измерения — ожидается Point${cv.dim}`, __pos: cv.__pos });
        }
    }

    for (let im of drawImages) {
        if (im.dim === '3D') continue; // 3D-вариант: pos = (x, y, z), ссылки на точку нет
        if (!points.find(p => p.name === im.posName)) errors.push({ line: '--', message: `Изображение "${im.name}" ссылается на несуществующую точку "${im.posName}"`, __pos: im.__pos });
    }

    for (let tr of drawTrajectories) {
        if (tr.fieldName && !drawFields.find(f => f.name === tr.fieldName)) {
            errors.push({ line: '--', message: `Траектория "${tr.name}" ссылается на несуществующее поле "${tr.fieldName}"`, __pos: tr.__pos });
        }
    }

    return {
        points, lines, figures, primitives, derivedOps, clusters, angles, angles3D,
        drawAngles, drawEqually, drawVectors, drawInfLines, drawInfPlanes, drawFillings, drawPunctirs, drawTexts,
        uiElements, circles, arcs, ellipses, curves, drawFunctions, drawSurfaces, drawImages,
        drawHistograms, drawFields, drawTrajectories, drawGraphs, drawFractals,
        drawFormulas, drawDistributions, drawLoci, drawTraces, drawRegions, drawCharts, drawTrees, drawTables,
        drawComplexes, drawHyperbolics, drawBifurcations, drawCobwebs, drawIFSs, drawAutomata, drawVoronois, drawFouriers, drawDiagrams, drawTensorFields, drawScatter3Ds, drawHistogram3Ds, errors
    };
}

export { ANGLE3D_TYPES, OBJECT_BLOCK_HEADERS, PRIMITIVE_TYPES, autoNameCounter, captureExprField, captureQuotableExprField, evaluateNumericExpression, evaluateStringExpression, extractParenGroup, matchField, matchPointRefRaw, matchVertexRefRaw3D, parseActiveExpr, parseAnchorField, parseAngle3DBlock, parseAngleBlock, parseArcBlock, parseAutomatonBlock, parseBifurcationBlock, parseBoolField, parseBooleanBlock, parseChartBlock, parseCircleBlock, parseClasterBlock, parseCobwebBlock, parseColorField, parseCommands, parseComplexBlock, parseCurveBlock, parseDiagramBlock, parseDistributionBlock, parseDrawAngleBlock, parseDrawTextBlock, parseEllipseBlock, parseEquallySingBlock, parseFieldBlock, parseFigureBlock, parseFillingBlock, parseFormulaBlock, parseFourierBlock, parseFractalBlock, parseFunctionGraphBlock, parseGeneralCollisionFields, parseGraphDrawBlock, parseHistogram3DBlock, parseHistogramBlock, parseHullBlock, parseHyperbolicBlock, parseIFSBlock, parseImageBlock, parseInfLineBlock, parseInfPlaneBlock, parseInteractiveField, parseLineBlock, parseListLiteralItem, parseLocusBlock, parseMinkowskiBlock, parseNameListField, parseNumberField, parseNumberListField, parsePointBlock, parsePointCommonFields, parsePointRefField, parsePointRefList, parsePrimitiveBlock, parsePublishBlock, parsePunctirBlock, parseRegionBlock, parseScatter3DBlock, parseSectionBlock, parseStringField, parseSurfaceBlock, parseTableBlock, parseTensorFieldBlock, parseTraceBlock, parseTrajectoryBlock, parseTreeBlock, parseTruncateBlock, parseUIBlock, parseUpdateFields, parseVariablesAndExpressions, parseVectorBlock, parseVertexRef3D, parseVertexRefField3D, parseVertexRefListField3D, parseVisualStyleFields, parseVoronoiBlock, parseXYZField, removeObjectBlocks, resolvePointRef, splitTopLevelList, syntheticPointCounter, syntheticPoints };

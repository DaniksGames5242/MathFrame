// tools/gms-schema/build.mjs
// Схема языка GMS для визуального редактора «Все элементы»: все типы new/draw,
// их поля (вид, умолчание, варианты) и параметры сцены. Источник — сам компилятор:
//   • типы — blockDefs в assets/js/gms/parse.js;
//   • поля — вызовы parse*Field / matchField / captureExprField в телах parse*Block;
//   • параметры сцены — списки ключей в assets/js/gms/validate.js.
// Запуск: node tools/gms-schema/build.mjs  →  data/gms-docs/schema.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const parseSrc = fs.readFileSync(path.join(ROOT, 'assets/js/gms/parse.js'), 'utf8');
const validateSrc = fs.readFileSync(path.join(ROOT, 'assets/js/gms/validate.js'), 'utf8');

// ── тела функций ──────────────────────────────────────────────────────────────
function fnBody(name) {
    const re = new RegExp('(?:^|\\n)\\s*function\\s+' + name + '\\s*\\(');
    const m = re.exec(parseSrc);
    if (!m) return '';
    let i = parseSrc.indexOf('{', m.index + m[0].length), depth = 0, start = i;
    for (; i < parseSrc.length; i++) {
        const c = parseSrc[i];
        if (c === '{') depth++;
        else if (c === '}' && --depth === 0) break;
    }
    return parseSrc.slice(start, i + 1);
}

// ── типы из blockDefs ────────────────────────────────────────────────────────
const defsSrc = parseSrc.slice(parseSrc.indexOf('const blockDefs = ['), parseSrc.indexOf('for (const def of blockDefs)'));
const defs = [];
for (const line of defsSrc.split('\n')) {
    const m = /header:\s*'([^']+)'.*?label:\s*'([^']+)'.*?parse:\s*(\w+)/.exec(line);
    if (!m) continue;
    const hm = /\\\\b(new|draw)\\\\s\+(\w+)(\(2D\|3D\)\?)?/.exec(m[1]);
    const fixed = /fixedDim:\s*'(2D|3D)'/.exec(line);
    defs.push({ kw: hm[1], type: hm[2], label: m[2], parse: m[3], dual: !!hm[3], dim: fixed ? fixed[1] : (hm[3] ? 'both' : 'any'),
        err: (/err:\s*'([^']*)'/.exec(line) || [])[1] || '' });
}

const KIND = { Bool: 'bool', Color: 'color', Number: 'number', String: 'string', PointRef: 'ref', XYZ: 'xyz', NumberList: 'list', NameList: 'names', Anchor: 'enum', Interactive: 'bool' };

function literal(s) {
    if (s == null) return undefined;
    s = s.trim();
    if (/^-?\d+(\.\d+)?(e-?\d+)?$/i.test(s)) return Number(s);
    if (s === 'true' || s === 'false') return s === 'true';
    const q = /^(['"])(.*)\1$/.exec(s);
    if (q) return q[2];
    const t = /^\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\]$/.exec(s);
    if (t) return t.slice(1).filter(v => v != null).map(Number);
    return undefined;
}

// Аргументы вызова верхнего уровня: "block, vars, 'f', 1, false" → массив строк.
function splitArgs(s) {
    const out = []; let depth = 0, cur = '', q = null;
    for (const c of s) {
        if (q) { cur += c; if (c === q) q = null; continue; }
        if (c === '"' || c === "'") { q = c; cur += c; continue; }
        if ('([{'.includes(c)) depth++;
        if (')]}'.includes(c)) depth--;
        if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
        cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
}
function callArgs(src, at) {
    let i = src.indexOf('(', at), depth = 0, start = i + 1;
    for (; i < src.length; i++) {
        if (src[i] === '(') depth++;
        else if (src[i] === ')' && --depth === 0) break;
    }
    return splitArgs(src.slice(start, i));
}

function extractFields(body, seen = new Set()) {
    const fields = new Map();
    const add = (name, kind, def, extra) => {
        if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return;
        const f = fields.get(name) || { name, kind };
        if (f.kind === 'expr' && kind !== 'expr') f.kind = kind;
        if (def !== undefined && f.default === undefined) f.default = def;
        if (extra) Object.assign(f, extra);
        fields.set(name, f);
    };
    const reCall = /\bparse(Bool|Color|Number|String|PointRef|XYZ|NumberList|NameList|Anchor|Interactive)Field\s*\(/g;
    let m;
    while ((m = reCall.exec(body))) {
        const args = callArgs(body, m.index);
        const kind = KIND[m[1]];
        if (m[1] === 'Anchor') { add('anchor', 'enum', literal(args[1]) || 'world', { options: ['world', 'screen'] }); continue; }
        if (m[1] === 'Interactive') { add('interactive', 'bool', false); continue; }
        const nameArg = m[1] === 'NameList' ? args[1] : args[2];
        const name = literal(nameArg);
        if (typeof name !== 'string') continue;
        const def = m[1] === 'NameList' ? undefined : literal(args[3]);
        add(name, kind, def);
    }
    const reV = /parseVertexRef(List)?Field3D\s*\(\s*block\s*,\s*vars\s*,\s*'(\w+)'/g;
    while ((m = reV.exec(body))) add(m[2], m[1] ? 'names' : 'ref');
    const reExpr = /(?:captureExprField|captureQuotableExprField)\s*\(\s*block\s*,\s*'(\w+)'/g;
    while ((m = reExpr.exec(body))) add(m[1], 'expr');
    // matchField(block, /(?:^|[^A-Za-z0-9_])f\s*=\s*(a|b|c)/) и block.match(...) с тем же шаблоном
    const reMatch = /\[\^A-Za-z0-9_\]\)(\w+)\\s\*=\\s\*([^/\n]*)/g;
    while ((m = reMatch.exec(body))) {
        const name = m[1], tail = m[2];
        const en = /\(((?:[\w-]+\|)+[\w-]+)\)/.exec(tail);
        if (en && !/\\/.test(en[1])) add(name, 'enum', undefined, { options: en[1].split('|') });
        else if (/^\\\(/.test(tail)) add(name, 'tuple');
        else add(name, 'expr');
    }
    for (const r of [/parseListLiteral\(\s*'(\w+)'/g]) while ((m = r.exec(body))) add(m[1], 'list');
    // прочие поля из регулярок вида /(?:^|[^A-Za-z0-9_])f\s*=/ и строк '... f\\s*='
    for (const r of [/\/(?:\(\?:\^\|\[\^A-Za-z0-9_\]\))?(\w+)\\s\*=/g, /\)(\w+)\\s\*=/g, /\\s\*(\w+)\\s\*=/g, /(\w+)\\\\s\*=/g, /\\b(\w+)\\s\*=/g]) {
        while ((m = r.exec(body))) if (!fields.has(m[1]) && !/^(field|\w*Field)$/.test(m[1])) add(m[1], 'expr');
    }
    // хелперы, читающие поля того же блока
    const reHelper = /\b(parse[A-Z]\w*(?:Field|Fields)|parse\w+Common\w*)\s*\(\s*block\b/g;
    while ((m = reHelper.exec(body))) {
        const h = m[1];
        if (/^parse(Bool|Color|Number|String|PointRef|XYZ|NumberList|NameList|Anchor|Interactive)Field$/.test(h) || seen.has(h)) continue;
        seen.add(h);
        for (const f of extractFields(fnBody(h), seen).values()) if (!fields.has(f.name)) fields.set(f.name, f);
    }
    // варианты строковых полей: f === 'x' рядом с присваиванием из поля
    for (const f of fields.values()) {
        if (f.kind !== 'string' || f.options) continue;
        const vr = new RegExp('(?:const|let|var)\\s+(\\w+)\\s*=\\s*[^;\\n]*\'' + f.name + '\'').exec(body);
        if (!vr) continue;
        const opts = new Set();
        const cmp = new RegExp('\\b' + vr[1] + '\\s*[!=]==\\s*\'([\\w-]+)\'', 'g');
        let c; while ((c = cmp.exec(body))) opts.add(c[1]);
        const inc = new RegExp('\\[([^\\]]+)\\]\\.(?:includes|indexOf)\\(\\s*' + vr[1] + '\\b', 'g');
        while ((c = inc.exec(body))) for (const s of c[1].matchAll(/'([\w-]+)'/g)) opts.add(s[1]);
        if (opts.size >= 2) { f.kind = 'enum'; f.options = [...opts]; }
    }
    return fields;
}

// Константы-перечисления парсера
function constList(name) {
    const m = new RegExp('const\\s+' + name + '\\s*=\\s*\\[([^\\]]*)\\]').exec(parseSrc);
    return m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : null;
}
const ENUMS = {
    'Primitive.type': constList('PRIMITIVE_TYPES'),
    'Angle3D.type': constList('ANGLE3D_TYPES'),
};

// Ручные дополнения: поля, которые парсер читает нестандартно
const EXTRA = {
    Point: [{ name: 'color', kind: 'color' }, { name: 'size', kind: 'number' }, { name: 'interact', kind: 'bool' }, { name: 'active', kind: 'bool', default: true }, { name: 'layer', kind: 'number' }],
    'draw Text': [{ name: 'text', kind: 'string' }],
    'draw InfPlane': [{ name: 'points', kind: 'names' }],
};

const COMMON_LABELS = {
    name: 'Имя', pos: 'Положение', color: 'Цвет', active: 'Видимость', layer: 'Слой', thickness: 'Толщина',
    size: 'Размер', opacity: 'Непрозрачность', type: 'Вид', text: 'Текст', label: 'Подпись', rotate: 'Поворот',
    center: 'Центр', radius: 'Радиус', points: 'Точки', elements: 'Элементы', interact: 'Перетаскивание',
    f: 'Функция f', xmin: 'x от', xmax: 'x до', ymin: 'y от', ymax: 'y до', zmin: 'z от', zmax: 'z до',
    segments: 'Сегменты', data: 'Данные', width: 'Ширина', height: 'Высота', depth: 'Глубина',
    textColor: 'Цвет текста', textSize: 'Размер текста', align: 'Выравнивание', mode: 'Режим',
    edge: 'Отрезок', line: 'Прямая', figure: 'Фигура', circle: 'Окружность', min: 'Минимум', max: 'Максимум',
    step: 'Шаг', default: 'Значение по умолчанию', variable: 'Переменная', action: 'Действие',
    wireframe: 'Каркас', showInfo: 'Показывать сведения', hideSource: 'Скрыть исходные', grid: 'Сетка',
    billboard: 'Всегда к камере', world: 'В мировых координатах', quality: 'Качество', palette: 'Палитра',
};

const types = [];
for (const d of defs) {
    const fields = extractFields(fnBody(d.parse));
    for (const e of EXTRA[d.label] || []) if (!fields.has(e.name)) fields.set(e.name, { ...e });
    const arr = [...fields.values()];
    for (const f of arr) {
        const en = ENUMS[d.label + '.' + f.name];
        if (en) { f.kind = 'enum'; f.options = en; }
        if (COMMON_LABELS[f.name]) f.label = COMMON_LABELS[f.name];
    }
    // обязательные поля — из текста ошибки «пропущены обязательные поля (name, pos …)»
    const req = new Set(((/\(([^)]*)\)/.exec(d.err) || [])[1] || '').split(/[,\s]+/).filter(w => fields.has(w)));
    if (fields.has('name')) req.add('name');
    for (const f of arr) if (req.has(f.name)) f.required = true;
    arr.sort((a, b) => (b.name === 'name') - (a.name === 'name') || (!!b.required - !!a.required));
    types.push({ keyword: d.kw, type: d.type, label: d.label, dim: d.dim, dual: d.dual, hint: d.err, fields: arr });
}

// ── параметры сцены ──────────────────────────────────────────────────────────
function arrayLit(name) {
    const m = new RegExp('const\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\];').exec(validateSrc);
    return m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
}
const valid = arrayLit('validKeys'), numeric = arrayLit('numericKeys'), tuple = arrayLit('tupleKeys'),
    color = arrayLit('colorKeys'), bool = arrayLit('booleanKeys');
const SCENE_ENUMS = {
    theme: ['light', 'dark', 'auto'], 'ui position': ['bottom', 'top', 'left', 'right', 'overlay'],
    'ui align': ['start', 'center', 'end'], 'description align': ['left', 'center', 'right'],
    'camera type': ['fixed', 'pan', 'orbit'], 'steps animation': ['fade', 'slide', 'scale', 'none'],
};
// варианты из сообщений validate.js: key ... (a|b|c) или 'a', 'b'
for (const k of valid) {
    if (SCENE_ENUMS[k]) continue;
    const m = new RegExp("key\\s*===\\s*'" + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'[^\\n]*?\\[([^\\]]+)\\]\\.includes").exec(validateSrc);
    if (m) SCENE_ENUMS[k] = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
}
const GROUPS = [
    ['Поле', /^(field|frame|background|scene)/],
    ['Камера', /^(camera|can |zoom)/],
    ['Оси и сетка', /(axes|grid|axis)/],
    ['Описание', /description/],
    ['Привязка', /^snap/],
    ['Шаги', /^steps?/],
    ['Песочница', /^(ui |theme|show description|drag)/],
];
const scene = valid.map((key) => {
    let kind = 'string';
    if (bool.includes(key)) kind = 'bool';
    else if (numeric.includes(key)) kind = 'number';
    else if (tuple.includes(key)) kind = 'tuple';
    else if (color.includes(key)) kind = 'color';
    if (SCENE_ENUMS[key]) kind = 'enum';
    if (key === 'camera projection') SCENE_ENUMS[key] = ['perspective', 'orthographic'];
    if (key === 'description') kind = 'text';
    if (key === 'background') kind = 'color';
    // В кавычках: grid color = "#ccc"; camera projection = "orthographic"; 2D layer = "…"
    if (/^(grid|axes|boundary) color$/.test(key)) kind = 'qcolor';
    if (key === 'camera projection') { kind = 'qenum'; }
    const g = GROUPS.find(([, re]) => re.test(key));
    return { key, kind, group: g ? g[0] : 'Прочее', ...(SCENE_ENUMS[key] ? { options: SCENE_ENUMS[key] } : {}) };
});

// ── шаблоны новых объектов (tools/gms-schema/templates.mjs) — проверяются компиляцией
const { compile } = await import(pathToFileURL(path.join(ROOT, 'assets/js/gms-compiler.js')).href);
const { TEMPLATES } = await import(pathToFileURL(path.join(ROOT, 'tools/gms-schema/templates.mjs')).href);
const failed = [];
function check(label, code, is3D) {
    const src = '[\nfield width = 20;\nfield height = 12;\n' + (is3D ? 'field depth = 10;\n' : '') + code.split('$').join('1') + '\n]';
    let r; try { r = compile(src); } catch (e) { r = { success: false, errors: [String(e)] }; }
    if (!r.success) failed.push(label + (is3D ? ' (3D)' : '') + ': ' + r.errors.join('; ').slice(0, 300));
}
for (const t of types) {
    const tpl = TEMPLATES[t.label];
    if (!tpl) { failed.push(t.label + ': нет шаблона'); continue; }
    t.template = tpl;
    check(t.label, tpl.code, t.dim === '3D');
    if (tpl.code3) check(t.label, tpl.code3, true);
}
if (failed.length) { console.log('Шаблоны с ошибками:\n  ' + failed.join('\n  ')); process.exitCode = 1; }

const out = { generated: 'tools/gms-schema/build.mjs', types, scene };
fs.writeFileSync(path.join(ROOT, 'data/gms-docs/schema.json'), JSON.stringify(out, null, 1) + '\n');
console.log('types:', types.length, 'blockDefs:', defs.length, 'scene keys:', scene.length,
    'fields:', types.reduce((s, t) => s + t.fields.length, 0));

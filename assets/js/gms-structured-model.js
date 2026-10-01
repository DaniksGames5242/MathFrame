// assets/js/gms-structured-model.js
// Модель GMS-кода для визуального редактора «Все элементы» (gms-structured-editor.js).
//
// Код сцены делится на сегменты, которые вместе покрывают исходный текст целиком:
//   • param — параметр сцены верхнего уровня: `field width = 16;`
//   • block — объект `new Тип { … }` / `draw Тип { … }` верхнего уровня (поля разобраны);
//   • raw   — всё остальное как есть: переменные, функции, Start/Update, комментарии, пробелы.
// Неизменённый сегмент сериализуется своим исходным текстом — правка одного поля меняет
// в коде только эту строку, а нетронутый код остаётся байт в байт прежним.

// Пропуск строки/комментария с позиции i; возвращает новую позицию или -1, если тут их нет.
function skipQuoted(s, i) {
    const c = s[i];
    if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < s.length && s[j] !== c) { if (s[j] === '\\') j++; j++; }
        return j + 1;
    }
    if (c === '/' && s[i + 1] === '/') { const e = s.indexOf('\n', i); return e < 0 ? s.length : e; }
    if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); return e < 0 ? s.length : e + 2; }
    return -1;
}

// Позиция парной закрывающей скобки для открывающей в s[open].
function matchBracket(s, open) {
    let depth = 0;
    for (let i = open; i < s.length; i++) {
        const q = skipQuoted(s, i);
        if (q >= 0) { i = q - 1; continue; }
        const c = s[i];
        if (c === '(' || c === '[' || c === '{') depth++;
        else if (c === ')' || c === ']' || c === '}') { if (--depth === 0) return i; }
    }
    return -1;
}

const BLOCK_RE = /^(new|draw)\s+([A-Za-z][A-Za-z0-9]*)\s*\{/;

// Разбор тела блока на поля: разделители — «;» и перевод строки на нулевой глубине.
export function parseFields(body) {
    const items = [];
    let cur = '', depth = 0;
    const flush = () => {
        const t = cur.trim();
        if (t) {
            const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]*)$/.exec(t);
            if (m && !/^\/[/*]/.test(t)) items.push({ key: m[1], value: m[2].trim() });
            else items.push({ raw: t });
        }
        cur = '';
    };
    for (let i = 0; i < body.length; i++) {
        const q = skipQuoted(body, i);
        if (q >= 0) {
            const piece = body.slice(i, q);
            // комментарий в начале поля — отдельный элемент
            if (piece.startsWith('//') || piece.startsWith('/*')) { if (cur.trim()) flush(); items.push({ raw: piece.trim() }); }
            else cur += piece;
            i = q - 1; continue;
        }
        const c = body[i];
        if (c === '(' || c === '[' || c === '{') depth++;
        else if (c === ')' || c === ']' || c === '}') depth--;
        if (depth === 0 && (c === ';' || c === '\n')) { flush(); continue; }
        cur += c;
    }
    flush();
    return items;
}

export function parseGms(src, sceneKeys) {
    const keys = (sceneKeys || []).slice().sort((a, b) => b.length - a.length);
    const segs = [];
    let rawStart = 0;
    const pushRaw = (end) => { if (end > rawStart) segs.push({ t: 'raw', text: src.slice(rawStart, end) }); };
    const open = src.indexOf('[');
    let depth = 0, i = 0;
    let lineStart = true;
    for (; i < src.length; i++) {
        const q = skipQuoted(src, i);
        if (q >= 0) { i = q - 1; lineStart = false; continue; }
        const c = src[i];
        if (c === '\n') { lineStart = true; continue; }
        if (depth === 1 && /[A-Za-z]/.test(c) && /(^|[\s;\]}])$/.test(src.slice(Math.max(0, i - 1), i) || ' ')) {
            const rest = src.slice(i, i + 400);
            const bm = BLOCK_RE.exec(rest);
            if (bm) {
                const ob = i + bm[0].length - 1;
                const cb = matchBracket(src, ob);
                if (cb > 0) {
                    pushRaw(i);
                    segs.push({ t: 'block', kw: bm[1], type: bm[2], fields: parseFields(src.slice(ob + 1, cb)), multiline: src.slice(ob, cb).includes('\n'), raw: src.slice(i, cb + 1) });
                    i = cb; rawStart = cb + 1; lineStart = false;
                    continue;
                }
            }
            if (lineStart) {
                const key = keys.find((k) => rest.startsWith(k) && /^\s*=/.test(rest.slice(k.length)));
                if (key) {
                    // значение — до «;» или конца строки на нулевой глубине
                    let j = i + key.length, d = 0;
                    j = src.indexOf('=', j) + 1;
                    let end = j;
                    for (; end < src.length; end++) {
                        const qq = skipQuoted(src, end);
                        if (qq >= 0) { if (src[end] === '/' ) break; end = qq - 1; continue; }
                        const ch = src[end];
                        if (ch === '(' || ch === '[' || ch === '{') d++;
                        else if (ch === ')' || ch === ']' || ch === '}') { if (d === 0) break; d--; }
                        else if (d === 0 && (ch === ';' || ch === '\n')) break;
                    }
                    let stop = end;
                    while (stop > j && /\s/.test(src[stop - 1])) stop--;
                    if (src[end] === ';') end++;
                    pushRaw(i);
                    segs.push({ t: 'param', key, value: src.slice(j, stop).trim(), raw: src.slice(i, end) });
                    i = end - 1; rawStart = end; lineStart = src[end - 1] === ';';
                    continue;
                }
            }
        }
        if (!/\s/.test(c)) lineStart = depth === 1 && c === ';';   // `field width = 16; field height = 10;`
        if (c === '(' || c === '[' || c === '{') { depth++; if (i === open && depth !== 1) depth = 1; }
        else if (c === ')' || c === ']' || c === '}') depth--;
    }
    pushRaw(src.length);
    return { segs };
}

function blockText(b) {
    const head = b.kw + ' ' + b.type + ' {';
    const parts = b.fields.map((f) => f.raw != null ? f.raw : f.key + ' = ' + f.value);
    if (!parts.length) return head + ' }';
    if (!b.multiline) return head + ' ' + parts.join('; ') + ' }';
    return head + '\n' + parts.map((p) => '    ' + p + (/^\/[/*]/.test(p) ? '' : ';')).join('\n') + '\n}';
}

export function segText(s) {
    if (s.t === 'raw') return s.text;
    if (!s.dirty && s.raw != null) return s.raw;
    if (s.t === 'param') return s.key + ' = ' + s.value + ';';
    return blockText(s);
}

export function serializeGms(model) { return model.segs.map(segText).join(''); }

// ── правки модели ────────────────────────────────────────────────────────────
export function blocks(model) { return model.segs.filter((s) => s.t === 'block'); }
export function getField(b, key) { const f = b.fields.find((x) => x.key === key); return f ? f.value : undefined; }
export function setField(b, key, value) {
    const i = b.fields.findIndex((x) => x.key === key);
    if (value == null || value === '') { if (i >= 0) b.fields.splice(i, 1); }
    else if (i >= 0) b.fields[i].value = value;
    else b.fields.push({ key, value });
    b.dirty = true;
}
export function getParam(model, key) { const p = model.segs.find((s) => s.t === 'param' && s.key === key); return p ? p.value : undefined; }
export function setParam(model, key, value) {
    const i = model.segs.findIndex((s) => s.t === 'param' && s.key === key);
    if (value == null || value === '') {
        if (i < 0) return;
        model.segs.splice(i, 1);
        // убрать оставшийся перевод строки, чтобы не копились пустые строки
        const n = model.segs[i];
        if (n && n.t === 'raw' && /^[ \t]*\n/.test(n.text)) n.text = n.text.replace(/^[ \t]*\n/, '');
        return;
    }
    if (i >= 0) { model.segs[i].value = value; model.segs[i].dirty = true; return; }
    // новый параметр — после последнего параметра или сразу после «[»
    let at = -1;
    model.segs.forEach((s, k) => { if (s.t === 'param') at = k; });
    const seg = { t: 'param', key, value, dirty: true };
    if (at >= 0) { model.segs.splice(at + 1, 0, { t: 'raw', text: '\n' }, seg); return; }
    const first = model.segs[0];
    if (first && first.t === 'raw' && first.text.includes('[')) {
        const k = first.text.indexOf('[') + 1;
        model.segs.splice(0, 1, { t: 'raw', text: first.text.slice(0, k) + '\n' }, seg, { t: 'raw', text: first.text.slice(k) });
    } else model.segs.unshift(seg, { t: 'raw', text: '\n' });
}

// Вставка объекта: после последнего объекта (или перед закрывающей «]»).
export function addBlock(model, block, afterBlock) {
    block.dirty = true;
    let at = afterBlock ? model.segs.indexOf(afterBlock) : -1;
    if (at < 0) model.segs.forEach((s, k) => { if (s.t === 'block') at = k; });
    if (at >= 0) { model.segs.splice(at + 1, 0, { t: 'raw', text: '\n' }, block); return; }
    const last = model.segs[model.segs.length - 1];
    if (last && last.t === 'raw' && last.text.lastIndexOf(']') >= 0) {
        const k = last.text.lastIndexOf(']');
        model.segs.splice(model.segs.length - 1, 1, { t: 'raw', text: last.text.slice(0, k).replace(/\s*$/, '\n') }, block, { t: 'raw', text: '\n' + last.text.slice(k) });
    } else model.segs.push({ t: 'raw', text: '\n' }, block);
}
export function removeBlock(model, b) {
    const i = model.segs.indexOf(b);
    if (i < 0) return;
    model.segs.splice(i, 1);
    const n = model.segs[i];
    if (n && n.t === 'raw' && /^[ \t]*\n/.test(n.text)) n.text = n.text.replace(/^[ \t]*\n/, '');
}
// Сдвиг объекта на одну позицию среди объектов (меняются местами два блока).
export function moveBlock(model, b, dir) {
    const list = blocks(model), k = list.indexOf(b), other = list[k + dir];
    if (!other) return;
    const i = model.segs.indexOf(b), j = model.segs.indexOf(other);
    model.segs[i] = other; model.segs[j] = b;
}
export function cloneBlock(b) {
    return { t: 'block', kw: b.kw, type: b.type, multiline: b.multiline, fields: b.fields.map((f) => ({ ...f })), dirty: true };
}

// Строка (с 1) начала каждого сегмента — для ссылок «элемент — строка N».
export function segLines(model) {
    const out = new Map();
    let line = 1;
    for (const s of model.segs) {
        out.set(s, line);
        line += (segText(s).match(/\n/g) || []).length;
    }
    return out;
}

export function unquote(v) {
    const m = /^"([\s\S]*)"$/.exec(v || '');
    return m ? m[1] : v;
}

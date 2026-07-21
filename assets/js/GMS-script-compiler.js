        function escapeHtml(text) {
            if (!text) return '';
            return text.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;')
                       .replace(/"/g, '&quot;')
                       .replace(/'/g, '&#39;');
        }

        // JSON, безопасный для вставки внутрь <script>: строка со значением "</script>"
        // иначе преждевременно закрыла бы тег и сломала весь сгенерированный HTML.
        function jsonForScript(value) {
            return JSON.stringify(value)
                .replace(/</g, '\\u003c')
                .replace(/\u2028/g, '\\u2028')
                .replace(/\u2029/g, '\\u2029');
        }

        // ========== ТЕМЫ ОФОРМЛЕНИЯ ==========
        // Две заготовки: тёмная (по умолчанию) и светлая. "light" воспроизводит исходную
        // (дореформенную) цветовую схему компилятора, чтобы не ломать старые примеры.
        const THEME_PRESETS = {
            dark: {
                background: '#1b1b2a',
                fieldColor: '#12121c',
                frameColor: '#4a4a68',
                defaultColor: '#e8e8f0',
                titleColor: '#f5f5fa',
                subColor: '#b8b8cc',
                descColor: '#dcdce6',
                footerColor: '#9494ac',
                panelBg: 'rgba(255,255,255,0.06)',
                footerBorder: '#3a3a52',
                controlBg: '#2a2a40',
                controlBorder: '#5a5a7e',
                controlText: '#f0f0f5',
                buttonText: '#f5f5fa',
                inputBg: '#20202f',
                accent: '#7c7cff',
            },
            light: {
                background: '#ffffff',
                fieldColor: 'transparent',
                frameColor: '#000000',
                defaultColor: '#000000',
                titleColor: '#000000',
                subColor: '#333333',
                descColor: '#000000',
                footerColor: '#333333',
                panelBg: 'rgba(0,0,0,0.03)',
                footerBorder: '#cccccc',
                controlBg: '#000000',
                controlBorder: '#000000',
                controlText: '#000000',
                buttonText: '#ffffff',
                inputBg: '#ffffff',
                accent: '#000000',
            },
        };
        // Тема текущей компиляции — выставляется в compile() до разбора команд, чтобы
        // все parse*Block-функции могли брать её как значение по умолчанию для цвета объектов.
        let currentThemeName = 'dark';
        function themeDefaultColor() {
            return (THEME_PRESETS[currentThemeName] || THEME_PRESETS.dark).defaultColor;
        }

        function isInsideStringOrComment(code, pos) {
            let inString = false;
            let stringChar = '';
            let escapeNext = false;
            let inLineComment = false;
            let inBlockComment = false;
            for (let i = 0; i < code.length; i++) {
                const ch = code[i];
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                if (ch === '\\') {
                    escapeNext = true;
                    continue;
                }
                if (!inString && !inLineComment && !inBlockComment && (ch === '"' || ch === "'")) {
                    inString = true;
                    stringChar = ch;
                    continue;
                }
                if (inString && ch === stringChar) {
                    inString = false;
                    continue;
                }
                if (!inString && !inLineComment && !inBlockComment && ch === '/' && i + 1 < code.length && code[i+1] === '/') {
                    inLineComment = true;
                    i++;
                    continue;
                }
                if (inLineComment) {
                    if (ch === '\n') inLineComment = false;
                    continue;
                }
                if (!inString && !inLineComment && !inBlockComment && ch === '/' && i + 1 < code.length && code[i+1] === '*') {
                    inBlockComment = true;
                    i++;
                    continue;
                }
                if (inBlockComment) {
                    if (ch === '*' && i + 1 < code.length && code[i+1] === '/') {
                        inBlockComment = false;
                        i++;
                        continue;
                    }
                    continue;
                }
                if (i === pos) {
                    return inString || inLineComment || inBlockComment;
                }
            }
            return false;
        }

        function removeComments(code) {
            let result = '';
            let inString = false;
            let stringChar = '';
            let escapeNext = false;
            let inLineComment = false;
            let inBlockComment = false;
            for (let i = 0; i < code.length; i++) {
                const ch = code[i];
                if (escapeNext) {
                    result += ch;
                    escapeNext = false;
                    continue;
                }
                if (ch === '\\') {
                    escapeNext = true;
                    result += ch;
                    continue;
                }
                if (!inLineComment && !inBlockComment && !inString && (ch === '"' || ch === "'")) {
                    inString = true;
                    stringChar = ch;
                    result += ch;
                    continue;
                }
                if (inString && ch === stringChar) {
                    inString = false;
                    result += ch;
                    continue;
                }
                if (inString) {
                    result += ch;
                    continue;
                }
                if (!inLineComment && !inBlockComment && !inString && ch === '/' && i + 1 < code.length && code[i+1] === '/') {
                    inLineComment = true;
                    i++;
                    continue;
                }
                if (!inLineComment && !inBlockComment && !inString && ch === '/' && i + 1 < code.length && code[i+1] === '*') {
                    inBlockComment = true;
                    i++;
                    continue;
                }
                if (inBlockComment && ch === '*' && i + 1 < code.length && code[i+1] === '/') {
                    inBlockComment = false;
                    i++;
                    continue;
                }
                if (inLineComment && ch === '\n') {
                    inLineComment = false;
                    result += '\n';
                    continue;
                }
                if (inLineComment || inBlockComment) continue;
                result += ch;
            }
            return result;
        }

        // Находит блоки вида "<header> [= ] { ... } [;]" со СБАЛАНСИРОВАННЫМИ фигурными
        // скобками; скобки внутри строк и комментариев не учитываются. Исправляет два бага:
        // 1) '};' внутри строки (например, action кнопки с мини-языком) обрывал блок раньше времени;
        // 2) вложенные { } внутри значений полей ломали нежадные regex-экстракторы.
        function findHeaderedBlocks(code, headerRegexSrc) {
            const re = new RegExp(headerRegexSrc, 'g');
            const found = [];
            let m;
            while ((m = re.exec(code)) !== null) {
                if (isInsideStringOrComment(code, m.index)) continue;
                let i = m.index + m[0].length;
                while (i < code.length && /\s/.test(code[i])) i++;
                if (code[i] === '=') { i++; while (i < code.length && /\s/.test(code[i])) i++; }
                if (code[i] !== '{') continue;
                const bodyStart = i + 1;
                let depth = 1, j = bodyStart;
                let inStr = false, strCh = '', esc = false, lineC = false, blockC = false;
                while (j < code.length && depth > 0) {
                    const ch = code[j];
                    if (esc) { esc = false; j++; continue; }
                    if (inStr) {
                        if (ch === '\\') esc = true;
                        else if (ch === strCh) inStr = false;
                        j++; continue;
                    }
                    if (lineC) { if (ch === '\n') lineC = false; j++; continue; }
                    if (blockC) { if (ch === '*' && code[j + 1] === '/') { blockC = false; j++; } j++; continue; }
                    if (ch === '"' || ch === "'") { inStr = true; strCh = ch; j++; continue; }
                    if (ch === '/' && code[j + 1] === '/') { lineC = true; j += 2; continue; }
                    if (ch === '/' && code[j + 1] === '*') { blockC = true; j += 2; continue; }
                    if (ch === '{') depth++;
                    else if (ch === '}') depth--;
                    j++;
                }
                if (depth !== 0) continue;
                const bodyEnd = j - 1;
                let end = j;
                while (end < code.length && /\s/.test(code[end])) end++;
                if (code[end] === ';') end++;
                found.push({ start: m.index, end: end, body: code.slice(bodyStart, bodyEnd) });
                re.lastIndex = end;
            }
            return found;
        }

        function findBlocks(code, keyword) {
            return findHeaderedBlocks(code, '\\b' + keyword + '\\b')
                .map(b => ({ start: b.start, end: b.end, body: b.body }));
        }

        function findBlocksLegacy(code, keyword) {
            const blocks = [];
            let i = 0;
            let inString = false;
            let stringChar = '';
            let escapeNext = false;
            let inComment = false;
            const kw = keyword;
            while (i < code.length) {
                const ch = code[i];
                if (escapeNext) {
                    escapeNext = false;
                    i++;
                    continue;
                }
                if (ch === '\\') {
                    escapeNext = true;
                    i++;
                    continue;
                }
                if (!inComment && !inString && (ch === '"' || ch === "'")) {
                    inString = true;
                    stringChar = ch;
                    i++;
                    continue;
                } else if (inString && ch === stringChar) {
                    inString = false;
                    i++;
                    continue;
                }
                if (!inString && !inComment && ch === '/' && i + 1 < code.length && code[i + 1] === '/') {
                    inComment = true;
                    i += 2;
                    continue;
                }
                if (inComment) {
                    if (ch === '\n') inComment = false;
                    i++;
                    continue;
                }
                if (!inString && !inComment && code.substr(i, kw.length) === kw) {
                    const nextChar = code[i + kw.length] || '';
                    if (!/[a-zA-Z0-9_]/.test(nextChar)) {
                        let pos = i + kw.length;
                        while (pos < code.length && /\s/.test(code[pos])) pos++;
                        if (code[pos] === '{') {
                            let depth = 1;
                            let end = pos + 1;
                            while (depth > 0 && end < code.length) {
                                const c = code[end];
                                if (c === '{') depth++;
                                else if (c === '}') depth--;
                                end++;
                            }
                            if (depth === 0) {
                                blocks.push({
                                    start: i,
                                    end: end,
                                    bodyStart: pos + 1,
                                    bodyEnd: end - 1
                                });
                                i = end;
                                continue;
                            }
                        }
                    }
                }
                i++;
            }
            return blocks;
        }

        // Задача 1: func f(x) = x^2 + sin(x); — определения функций на верхнем уровне
        function findFuncDeclarations(code) {
            const regex = /func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*=\s*([^;]+);/g;
            const results = [];
            let match;
            while ((match = regex.exec(code)) !== null) {
                if (isInsideStringOrComment(code, match.index)) continue;
                const name = match[1];
                const params = match[2].split(',').map(s => s.trim()).filter(s => s.length > 0);
                const bodyExpr = match[3].trim();
                results.push({ name, params, bodyExpr, start: match.index, end: match.index + match[0].length });
            }
            return results;
        }
        function removeFuncDeclarations(code) {
            const decls = findFuncDeclarations(code).sort((a, b) => b.start - a.start);
            let result = code;
            for (let d of decls) { result = result.substring(0, d.start) + result.substring(d.end); }
            return result;
        }

        // Function name(params) { ...statements...; return expr; } — полноценная многострочная
        // функция, возвращающая значение (в отличие от однострочной func f(x) = expr;).
        // Void name(params) { ...statements... } — то же самое, но без возвращаемого значения;
        // используется ради побочных эффектов (изменение переменных/точек), вызывается как
        // обычная функция-выражение (например, из action кнопки new UI) — её результат просто
        // не используется.
        // Тело — сырой текст, разбирается отдельно в каждом рантайме (2D/3D), т.к. у них разные
        // исполнители выражений/операторов.
        function findProcDeclarations(code, keyword) {
            const re = new RegExp('\\b' + keyword + '\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(([^)]*)\\)\\s*', 'g');
            const results = [];
            let m;
            while ((m = re.exec(code)) !== null) {
                if (isInsideStringOrComment(code, m.index)) continue;
                let i = m.index + m[0].length;
                while (i < code.length && /\s/.test(code[i])) i++;
                if (code[i] !== '{') { re.lastIndex = m.index + m[0].length; continue; }
                const bodyStart = i + 1;
                let depth = 1, j = bodyStart;
                let inStr = false, strCh = '', esc = false, lineC = false, blockC = false;
                while (j < code.length && depth > 0) {
                    const ch = code[j];
                    if (esc) { esc = false; j++; continue; }
                    if (inStr) { if (ch === '\\') esc = true; else if (ch === strCh) inStr = false; j++; continue; }
                    if (lineC) { if (ch === '\n') lineC = false; j++; continue; }
                    if (blockC) { if (ch === '*' && code[j + 1] === '/') { blockC = false; j++; } j++; continue; }
                    if (ch === '"' || ch === "'") { inStr = true; strCh = ch; j++; continue; }
                    if (ch === '/' && code[j + 1] === '/') { lineC = true; j += 2; continue; }
                    if (ch === '/' && code[j + 1] === '*') { blockC = true; j += 2; continue; }
                    if (ch === '{') depth++;
                    else if (ch === '}') depth--;
                    j++;
                }
                if (depth !== 0) continue;
                const bodyEnd = j - 1;
                let end = j;
                while (end < code.length && /\s/.test(code[end])) end++;
                if (code[end] === ';') end++;
                const name = m[1];
                const params = m[2].split(',').map(s => s.trim()).filter(s => s.length > 0);
                const body = code.slice(bodyStart, bodyEnd);
                results.push({ name, params, body, start: m.index, end, isVoid: keyword === 'Void' });
                re.lastIndex = end;
            }
            return results;
        }
        function findAllProcDeclarations(code) {
            return findProcDeclarations(code, 'Function').concat(findProcDeclarations(code, 'Void'));
        }
        function removeProcDeclarations(code) {
            const decls = findAllProcDeclarations(code).sort((a, b) => b.start - a.start);
            let result = code;
            for (let d of decls) { result = result.substring(0, d.start) + result.substring(d.end); }
            return result;
        }

        function extractMethodBlocks(code) {
            const startBlocks = findBlocks(code, 'Start');
            const updateBlocks = findBlocks(code, 'Update');
            const startCodes = startBlocks.map(b => b.body.trim());
            const updateCodes = updateBlocks.map(b => b.body.trim());
            return { startCodes, updateCodes };
        }

        function removeMethodBlocks(code) {
            let result = code;
            const allBlocks = findBlocks(code, 'Start').concat(findBlocks(code, 'Update'));
            allBlocks.sort((a, b) => b.start - a.start);
            for (let block of allBlocks) {
                result = result.substring(0, block.start) + result.substring(block.end);
            }
            return result;
        }

const OBJECT_BLOCK_HEADERS = [
    '\\bnew\\s+Point\\b', '\\bnew\\s+Line\\b', '\\bnew\\s+Figure\\b', '\\bnew\\s+Primitive\\b',
    '\\bnew\\s+Section\\b', '\\bnew\\s+Boolean\\b', '\\bnew\\s+Angle3D\\b', '\\bnew\\s+Claster\\b',
    '\\bnew\\s+Angle\\b', '\\bdraw\\s+Angle\\b', '\\bdraw\\s+EquallySing\\b', '\\bdraw\\s+Vector\\b',
    '\\bdraw\\s+InfLine\\b', '\\bdraw\\s+InfPlane\\b', '\\bdraw\\s+Filling\\b', '\\bdraw\\s+Punctir\\b', '\\bdraw\\s+Text\\b',
    '\\bnew\\s+UI\\b', '\\bnew\\s+Circle\\b', '\\bdraw\\s+Arc\\b', '\\bnew\\s+Ellipse\\b',
    '\\bnew\\s+Curve\\b', '\\bdraw\\s+Function\\b', '\\bdraw\\s+Surface\\b', '\\bdraw\\s+Image\\b',
    '\\bdraw\\s+Histogram\\b', '\\bdraw\\s+Field\\b', '\\bdraw\\s+Trajectory\\b', '\\bdraw\\s+Graph\\b',
    '\\bdraw\\s+Fractal\\b', '\\bdraw\\s+Formula\\b', '\\bdraw\\s+Locus\\b',
    '\\bdraw\\s+Trace\\b', '\\bdraw\\s+Region\\b', '\\bdraw\\s+Chart\\b',
    '\\bdraw\\s+Tree\\b', '\\bdraw\\s+Table\\b', '\\bdraw\\s+Complex\\b',
    '\\bdraw\\s+Hyperbolic\\b', '\\bdraw\\s+Bifurcation\\b', '\\bdraw\\s+Cobweb\\b', '\\bdraw\\s+IFS\\b', '\\bdraw\\s+Automaton\\b', '\\bdraw\\s+Voronoi\\b', '\\bdraw\\s+Fourier\\b', '\\bdraw\\s+Diagram\\b'
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
    for (const s of spans) result = result.substring(0, s.start) + result.substring(s.end);
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
        function parseStringField(block, vars, field) {
            const quoted = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*"([^"]*)"'));
            if (quoted) return quoted[1];
            const ref = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*([a-zA-Z_][a-zA-Z0-9_]*)'));
            if (ref && vars[ref[1]] !== undefined && typeof vars[ref[1]] === 'string') return vars[ref[1]];
            if (field === 'name') return '_auto' + (++autoNameCounter);
            return null;
        }
        // Цвет: #hex, ключевое слово default (-> def), либо имя переменной-строки с #hex
        function parseColorField(block, vars, field, def) {
            const m = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)'));
            if (!m) return def;
            const c = m[1];
            if (c === 'default') return def;
            if (c.startsWith('#')) return c;
            if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) return vars[c];
            return def;
        }
        // Булево: true/false, либо имя переменной типа boolean
        function parseBoolField(block, vars, field, def) {
            const m = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)'));
            if (!m) return def;
            const v = m[1];
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
            const m = block.match(/(?:^|[^A-Za-z0-9_])active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_.]*)/);
            return m ? m[1] : null;
        }
        // Число: литерал, необязательное ключевое слово default (-> def), либо имя переменной-числа
        function parseNumberField(block, vars, field, def, allowDefaultKeyword) {
            const num = '-?[\\d.]+(?:[eE][+-]?\\d+)?';
            const alt = allowDefaultKeyword ? num + '|default|[a-zA-Z_][a-zA-Z0-9_]*' : num + '|[a-zA-Z_][a-zA-Z0-9_]*';
            const m = block.match(new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*(' + alt + ')'));
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
                    pauseOnDrag: true, layer: 40, hidden: true,
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
            const re = new RegExp('(?:^|[^A-Za-z0-9_])' + field + '\\s*=\\s*');
            const m = re.exec(block);
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
                        const listMatch = valueStr.match(/\(([^)]+)\)/);
                        if (listMatch) {
                            const items = listMatch[1].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
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
                const typeMatch = block.match(/type\s*=\s*(button|toggle|input|slider)/);
                if (!typeMatch) return null;
                const type = typeMatch[1];

                const labelMatch = block.match(/label\s*=\s*"([^"]*)"/);
                const label = labelMatch ? labelMatch[1] : '';

                let defaultColor, defaultTextcolor;
                if (type === 'button') {
                    defaultColor = '#000000';
                    defaultTextcolor = '#ffffff';
                } else {
                    defaultColor = '#000000';
                    defaultTextcolor = '#000000';
                }

                const color = parseColorField(block, vars, 'color', defaultColor);

                const textcolor = parseColorField(block, vars, 'textcolor', defaultTextcolor);

                const active = parseBoolField(block, vars, 'active', true);

                let variable = null;
                // Имя переменной допускается как без кавычек (variable = amplitude),
                // так и в кавычках (variable = "amplitude") — раньше вариант с кавычками
                // молча не распознавался, и контрол оказывался ни с чем не связан.
                const varMatch = block.match(/variable\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_.]*)"?/);
                if (varMatch) variable = varMatch[1]; // может содержать точки

                let funcName = null;
                const funcNameMatch = block.match(/funcName\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_]*)"?/);
                if (funcNameMatch) funcName = funcNameMatch[1];

                let defaultValue = null;
                const defaultMatch = block.match(/default\s*=\s*([^,;\n]+)/);
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
                const actionMatch = block.match(/action\s*=\s*"([^"]*)"/);
                if (actionMatch) action = actionMatch[1];

                let inputtype = 'text';
                if (type === 'input') {
                    const itMatch = block.match(/inputtype\s*=\s*(number|text|formula)/);
                    if (itMatch) inputtype = itMatch[1];
                }

                let min = null, max = null, step = null;
                if ((type === 'input' && inputtype === 'number') || type === 'slider') {
                    const minMatch = block.match(/min\s*=\s*([\d.-]+)/);
                    if (minMatch) min = parseFloat(minMatch[1]);
                    const maxMatch = block.match(/max\s*=\s*([\d.-]+)/);
                    if (maxMatch) max = parseFloat(maxMatch[1]);
                    const stepMatch = block.match(/step\s*=\s*([\d.]+)/);
                    if (stepMatch) step = parseFloat(stepMatch[1]);
                }
                if (type === 'slider') {
                    if (min === null) min = 0;
                    if (max === null) max = 100;
                    if (step === null) step = 1;
                }

                const x = parseNumberField(block, vars, 'x', null, false);
                const y = parseNumberField(block, vars, 'y', null, false);
                const uiWidth = parseNumberField(block, vars, 'width', null, false);
                const uiHeight = parseNumberField(block, vars, 'height', null, false);
                const radius = parseNumberField(block, vars, 'radius', 4, false);
                const stepper = parseBoolField(block, vars, 'stepper', true);
                const layer = parseNumberField(block, vars, 'layer', 100, false);

                return { type, label, color, textcolor, active, variable, funcName, default: defaultValue, action, inputtype, min, max, step, stepper, x, y, width: uiWidth, height: uiHeight, radius, layer };
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

            const measurecolor = parseColorField(block, vars, 'measurecolor', null);

            let radius = 1.0;
            const radiusMatch = block.match(/radius\s*=\s*([\d.]+|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (radiusMatch) {
                let r = radiusMatch[1];
                if (!isNaN(parseFloat(r))) {
                    radius = parseFloat(r);
                } else if (vars[r] !== undefined) {
                    if (typeof vars[r] === 'number') radius = vars[r];
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

            const layer = parseNumberField(block, vars, 'layer', 90, false);
            return { name, angleName, arc, measure, arccolor, measurecolor, radius, side, fractions, count, layer };
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
    const layer = parseNumberField(block, vars, 'layer', 80, false);

    return { name, edges, type, color, layer };
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

    const length = parseNumberField(block, vars, 'length', null, true);

    const thickness = parseNumberField(block, vars, 'thickness', null, true);

    const layer = parseNumberField(block, vars, 'layer', 70, false);
    return { name, edge, pos, direct, color, length, thickness, layer };
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

    const thickness = parseNumberField(block, vars, 'thickness', null, true);

    const dotline = parseBoolField(block, vars, 'dotline', false);

    const layer = parseNumberField(block, vars, 'layer', 50, false);
    return { name, edge, limit, color, thickness, dotline, layer };
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
    let opacity = parseNumberField(block, vars, 'opacity', 0.35, false);
    if (opacity < 0) opacity = 0;
    if (opacity > 1) opacity = 1;
    const size = parseNumberField(block, vars, 'size', null, false);
    const grid = parseBoolField(block, vars, 'grid', false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 25, false);
    return { name, figure, points, color, opacity, size, grid, active, activeExpr: parseActiveExpr(block), layer };
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

    if (!figure && !line && !circle && !arc) return null;
    if (line && !side) return null; // для полуплоскости обязательно указать сторону точкой
    if (circle && (!from || !to)) return null; // для сектора/сегмента обязательны from и to

    const color = parseColorField(block, vars, 'color', null);

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
    return { name, figure, line, side, circle, from, to, arc, shape, color, mode, layer, opacity, activeExpr: parseActiveExpr(block) };
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

    const thickness = parseNumberField(block, vars, 'thickness', null, true);

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
    return { name, edge, color, thickness, pattern, layer };
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
            let textEnabled = false;
            let textValue = null;
            const textMatch = block.match(/text\s*=\s*(true\s*\(([^)]*)\)|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
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
            const dynamic = parseBoolField(block, vars, 'dynamic', false);
            const active = parseBoolField(block, vars, 'active', true);
            const activeExpr = parseActiveExpr(block);
            const size = parseNumberField(block, vars, 'size', 1, false);
            let shape = 'circle';
            const shapeMatch = block.match(/shape\s*=\s*(circle|square|cross|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (shapeMatch) {
                const s = shapeMatch[1];
                if (s === 'circle' || s === 'square' || s === 'cross') shape = s;
                else if (vars[s] !== undefined && ['circle', 'square', 'cross'].includes(vars[s])) shape = vars[s];
            }
            const textSize = parseNumberField(block, vars, 'textSize', 1, false);
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

            return {
                color, textEnabled, textValue, textColor, dynamic, active, activeExpr, size, shape, textSize, pauseOnDrag, layer,
                collision, collisionGroup, collisionMask, collisionMargin,
                collideWithPoints, collideWithLines, collideWithCurves, collideWithCircles, collideWithEllipses, collideWithArcs,
                collideWithFigures, collideWithClusters, collideWithBoundary,
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
                return { ...base, pos: { x: 0, y: 0 }, transform: 'reflect', transformSource: reflectSrc, transformOver: over };
            }
            const rotateSrc = parsePointRefField(block, vars, 'rotate');
            if (rotateSrc) {
                const around = parsePointRefField(block, vars, 'around');
                const angleExpr = captureExprField(block, 'angle');
                if (!around || angleExpr === null) return null;
                return { ...base, pos: { x: 0, y: 0 }, transform: 'rotate', transformSource: rotateSrc, transformAround: around, transformExpr: angleExpr };
            }
            const homothetySrc = parsePointRefField(block, vars, 'homothety');
            if (homothetySrc) {
                const center = parsePointRefField(block, vars, 'center');
                const ratioExpr = captureExprField(block, 'ratio');
                if (!center || ratioExpr === null) return null;
                const ratioYExpr = captureExprField(block, 'ratioY');
                return { ...base, pos: { x: 0, y: 0 }, transform: 'homothety', transformSource: homothetySrc, transformCenter: center, transformExpr: ratioExpr, transformExprY: ratioYExpr };
            }
            const translateSrc = parsePointRefField(block, vars, 'translate');
            if (translateSrc) {
                const dxExpr = captureExprField(block, 'dx');
                const dyExpr = captureExprField(block, 'dy');
                if (dxExpr === null || dyExpr === null) return null;
                return { ...base, pos: { x: 0, y: 0 }, transform: 'translate', transformSource: translateSrc, transformDx: dxExpr, transformDy: dyExpr };
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
                        pauseOnDrag: true, layer: 40, hidden: true,
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
            const thickness = parseNumberField(block, vars, 'thickness', 2.5, true);

            const interact = parseBoolField(block, vars, 'interact', false);

            const active = parseBoolField(block, vars, 'active', true);
            const layer = parseNumberField(block, vars, 'layer', 10, false);
            const collisionFields = parseGeneralCollisionFields(block, vars, false);

            return { name, pointA, pointB, color, thickness, interact, active, activeExpr: parseActiveExpr(block), layer, ...collisionFields };
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
    const width = parseNumberField(block, vars, 'width', edge, false);
    const height = parseNumberField(block, vars, 'height', 2, false);
    const depth = parseNumberField(block, vars, 'depth', edge, false);
    const radius = parseNumberField(block, vars, 'radius', 1.5, false);
    const tube = parseNumberField(block, vars, 'tube', radius * 0.35, false);
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

    return {
        name, type, pos, rotateDeg,
        edge, width, height, depth, radius, tube, sides,
        color, opacity, wireframe, active, activeExpr, showInfo, textColor, textSize,
        volume, area,
    };
}

// ---- Сечения (new Section) и булевы операции (new Boolean) над примитивами ----
// Оба блока — «производные» объекты: их геометрия строится в рантайме (в браузере)
// из уже построенных THREE-геометрий примитивов/других производных объектов,
// поэтому здесь на этапе компиляции разбираются только декларативные параметры.
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
    const capColor = parseColorField(block, vars, 'capColor', null);
    let opacity = parseNumberField(block, vars, 'opacity', 1, false);
    if (isNaN(opacity)) opacity = 1;
    opacity = Math.max(0, Math.min(1, opacity));
    const wireframe = parseBoolField(block, vars, 'wireframe', false);
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);
    const showInfo = parseBoolField(block, vars, 'showInfo', false);
    const hideSource = parseBoolField(block, vars, 'hideSource', true);
    const textColor = parseColorField(block, vars, 'textColor', null);
    const textSize = parseNumberField(block, vars, 'textSize', 1, false);

    return {
        name, source, normal, offset, keep, explode,
        color, capColor, opacity, wireframe, active, activeExpr, showInfo, hideSource, textColor, textSize,
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
    let opacity = parseNumberField(block, vars, 'opacity', 1, false);
    if (isNaN(opacity)) opacity = 1;
    opacity = Math.max(0, Math.min(1, opacity));
    const wireframe = parseBoolField(block, vars, 'wireframe', false);
    const active = parseBoolField(block, vars, 'active', true);
    const activeExpr = parseActiveExpr(block);
    const showInfo = parseBoolField(block, vars, 'showInfo', false);
    const hideSource = parseBoolField(block, vars, 'hideSource', true);
    const textColor = parseColorField(block, vars, 'textColor', null);
    const textSize = parseNumberField(block, vars, 'textSize', 1, false);

    return { name, op, parts, color, opacity, wireframe, active, activeExpr, showInfo, hideSource, textColor, textSize };
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
const ANGLE3D_TYPES = ['lineLine', 'linePlane', 'planePlane', 'dihedral'];
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
    } else { // dihedral
        const edge = parseVertexRefListField3D(block, vars, 'edge');
        const point1 = parseVertexRefField3D(block, vars, 'point1');
        const point2 = parseVertexRefField3D(block, vars, 'point2');
        if (edge && edge.length === 2 && point1 && point2) {
            refs = { a: edge[0], b: edge[1], c: point1, d: point2 };
        }
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
    const thickness = parseNumberField(block, vars, 'thickness', 1.5, false);

    if (type === 'FromRadius') {
        const centerName = parsePointRefField(block, vars, 'center');
        if (!centerName) return null;

        let radius = null;
        // Ищем радиус: число, точка по имени, или буквальные координаты (x, y)
        const radiusRaw = block.match(/radius\s*=\s*(\([^)]*\)|"[^"]*"|[\d.]+|[a-zA-Z_][a-zA-Z0-9_]*)/);
        if (radiusRaw) {
            const r = radiusRaw[1];
            if (!isNaN(parseFloat(r))) {
                radius = parseFloat(r);
            } else if (vars[r] !== undefined && typeof vars[r] === 'number') {
                radius = vars[r];
            } else {
                radius = resolvePointRef(r, vars); // имя точки (или буквальные координаты) — радиус = расстояние до неё
            }
        }
        if (radius === null) return null;
        const layer = parseNumberField(block, vars, 'layer', 20, false);
        const collisionFields = parseGeneralCollisionFields(block, vars, false);
        return { name, type, centerName, radius, color, thickness, layer, ...collisionFields };
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
        return { name, type, pointNames, color, thickness, layer, ...collisionFields };
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
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const common = { name, type, color, thickness, active, layer, ...parseGeneralCollisionFields(block, vars, false) };

    if (type === 'ThreePoints') {
        const pointNames = parsePointRefList(block, vars, 'points');
        if (!pointNames || pointNames.length !== 3) return null;
        return { ...common, pointNames };
    }

    const centerName = parsePointRefField(block, vars, 'center');
    if (!centerName) return null;

    let radius = null;
    const radiusRaw = block.match(/radius\s*=\s*(\([^)]*\)|"[^"]*"|[\d.]+|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (radiusRaw) {
        const r = radiusRaw[1];
        if (!isNaN(parseFloat(r))) radius = parseFloat(r);
        else if (vars[r] !== undefined && typeof vars[r] === 'number') radius = vars[r];
        else radius = resolvePointRef(r, vars); // радиус = расстояние от центра до этой точки
    }

    const from = parsePointRefField(block, vars, 'from');
    const to = parsePointRefField(block, vars, 'to');
    if (radius === null || !from || !to) return null;

    return { ...common, centerName, radius, from, to };
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
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const active = parseBoolField(block, vars, 'active', true);
    const dynamic = parseBoolField(block, vars, 'dynamic', false);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const common = { name, type, color, thickness, active, dynamic, layer, ...parseGeneralCollisionFields(block, vars, false) };

    if (type === 'FromPoints') {
        const pointNames = parsePointRefList(block, vars, 'points');
        if (!pointNames || pointNames.length !== 5) return null;
        return { ...common, pointNames };
    }
    if (type === 'ByFoci') {
        const focus1 = parsePointRefField(block, vars, 'focus1');
        const focus2 = parsePointRefField(block, vars, 'focus2');
        const aMatch = block.match(/(?:^|[,{])\s*a\s*=\s*([^,;\n]+)/);
        if (!focus1 || !focus2 || !aMatch) return null;
        return { ...common, focus1, focus2, aExpr: aMatch[1].trim() };
    }

    // FromCenter (по умолчанию)
    const centerName = parsePointRefField(block, vars, 'center');
    if (!centerName) return null;
    const aMatch = block.match(/(?:^|[,{])\s*a\s*=\s*([^,;\n]+)/);
    const bMatch = block.match(/(?:^|[,{])\s*b\s*=\s*([^,;\n]+)/);
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

    const segments = parseNumberField(block, vars, 'segments', 50, false);
    const color = parseColorField(block, vars, 'color', null);
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const collisionFields = parseGeneralCollisionFields(block, vars, false);

    return {
        name, type, controlPoints, xExpr, yExpr, zExpr, segments, color, thickness, active, activeExpr: parseActiveExpr(block), layer,
        centerName, a: curveA, b: curveB, radius: curveRadius, turns, ...collisionFields
    };
}

// draw Function — график функции одной переменной, объявленной через func
function parseFunctionGraphBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const fMatch = block.match(/f\s*=\s*"([^"]*)"/);
    if (!fMatch) return null;
    const funcName = fMatch[1];

    const xmin = parseNumberField(block, vars, 'xmin', -10, false);
    const xmax = parseNumberField(block, vars, 'xmax', 10, false);
    const segments = parseNumberField(block, vars, 'segments', 100, false);
    const color = parseColorField(block, vars, 'color', null);
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    const grid = parseBoolField(block, vars, 'grid', false);
    const gridStep = parseNumberField(block, vars, 'gridStep', 1, false);

    return { name, funcName, xmin, xmax, segments, color, thickness, active, layer, grid, gridStep };
}

// draw Surface — график функции двух переменных: contour (изолинии) или псевдо-3D (в 2D);
// в 3D дополнительно поддерживается настоящая параметрическая поверхность x(u,v), y(u,v), z(u,v) —
// та же конвенция полей x/y/z, что у параметрической кривой (new Curve { type = parametric }),
// только с двумя параметрами u, v вместо одного t.
function parseSurfaceBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let type = 'heightfield';
    const typeMatch = block.match(/type\s*=\s*"?(heightfield|parametric)"?/);
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
    // umin/umax/vmin/vmax — область определения параметров u, v для параметрической поверхности
    const umin = parseNumberField(block, vars, 'umin', -5, false);
    const umax = parseNumberField(block, vars, 'umax', 5, false);
    const vmin = parseNumberField(block, vars, 'vmin', -5, false);
    const vmax = parseNumberField(block, vars, 'vmax', 5, false);
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

    return { name, type, funcName, xExpr, yExpr, zExpr, xmin, xmax, ymin, ymax, umin, umax, vmin, vmax, grid, mode, color, opacity, active, activeExpr: parseActiveExpr(block), layer, angle, levels, level };
}

// draw Chart — диаграммы: scatter / line строятся в координатах поля,
// bar / pie / box — в прямоугольнике (pos + width/height либо radius).
//   draw Chart { name = "s", type = scatter, data = pts, regression = true };
function parseChartBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const typeM = block.match(/(?:^|[^A-Za-z0-9_])type\s*=\s*"?(scatter|line|bar|pie|box)"?/);
    const type = typeM ? typeM[1] : 'scatter';
    const dataExpr = captureExprField(block, 'data');
    if (dataExpr === null) return null;
    const labelsExpr = captureExprField(block, 'labels');
    let posXExpr = null, posYExpr = null;
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = splitTopLevelList(posMatch[1]);
        if (parts.length === 2) { posXExpr = parts[0].trim(); posYExpr = parts[1].trim(); }
    }
    return {
        name, type, dataExpr, labelsExpr, posXExpr, posYExpr,
        width: parseNumberField(block, vars, 'width', 10, false),
        height: parseNumberField(block, vars, 'height', 6, false),
        radius: parseNumberField(block, vars, 'radius', 4, false),
        pointSize: parseNumberField(block, vars, 'pointSize', 4, false),
        color: parseColorField(block, vars, 'color', '#4a90d9'),
        regression: parseBoolField(block, vars, 'regression', false),
        showValues: parseBoolField(block, vars, 'showValues', false),
        showAxes: parseBoolField(block, vars, 'showAxes', true),
        markers: parseBoolField(block, vars, 'markers', false),
        horizontal: parseBoolField(block, vars, 'horizontal', false),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 22, false)
    };
}

// draw Tree — дерево из вложенных списков [метка, [потомки...]].
// Хорошо сочетается с exprTree(): draw Tree { data = exprTree("x^2 + 1") };
function parseTreeBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const dataExpr = captureExprField(block, 'data');
    if (dataExpr === null) return null;
    let posXExpr = '0', posYExpr = '0';
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = splitTopLevelList(posMatch[1]);
        if (parts.length === 2) { posXExpr = parts[0].trim(); posYExpr = parts[1].trim(); }
    }
    return {
        name, dataExpr, posXExpr, posYExpr,
        spacing: parseNumberField(block, vars, 'spacing', 2.2, false),
        levelGap: parseNumberField(block, vars, 'levelGap', 2.2, false),
        nodeRadius: parseNumberField(block, vars, 'nodeRadius', 11, false),
        color: parseColorField(block, vars, 'color', '#37474f'),
        edgeColor: parseColorField(block, vars, 'edgeColor', '#90a4ae'),
        labelColor: parseColorField(block, vars, 'labelColor', '#ffffff'),
        boxed: parseBoolField(block, vars, 'boxed', false),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 22, false)
    };
}

// draw Table — таблица из двумерного списка, привязанная к координатам поля.
function parseTableBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const dataExpr = captureExprField(block, 'data');
    if (dataExpr === null) return null;
    let posXExpr = '0', posYExpr = '0';
    const posMatch = block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const parts = splitTopLevelList(posMatch[1]);
        if (parts.length === 2) { posXExpr = parts[0].trim(); posYExpr = parts[1].trim(); }
    }
    const alignM = block.match(/(?:^|[^A-Za-z0-9_])align\s*=\s*"?(left|center|right)"?/);
    return {
        name, dataExpr, posXExpr, posYExpr,
        cellWidth: parseNumberField(block, vars, 'cellWidth', 3, false),
        cellHeight: parseNumberField(block, vars, 'cellHeight', 1.4, false),
        header: parseBoolField(block, vars, 'header', true),
        borders: parseBoolField(block, vars, 'borders', true),
        align: alignM ? alignM[1] : 'center',
        color: parseColorField(block, vars, 'color', null),
        headerBg: parseColorField(block, vars, 'headerBg', '#eceff1'),
        borderColor: parseColorField(block, vars, 'borderColor', '#90a4ae'),
        fontSize: parseNumberField(block, vars, 'fontSize', 1, false),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 22, false)
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
    const color = parseColorField(block, vars, 'color', null);
    const bg = parseColorField(block, vars, 'background', 'transparent');
    const alignM = block.match(/(?:^|[^A-Za-z0-9_])align\s*=\s*"?(left|center|right)"?/);
    const align = alignM ? alignM[1] : 'center';
    const display = parseBoolField(block, vars, 'display', false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 60, false);
    return { name, posXExpr, posYExpr, latexExpr, size, color, bg, align, display, active, layer };
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
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const dashed = parseBoolField(block, vars, 'dashed', false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 18, false);
    return { name, pointName, driverName, samples, from, to, color, thickness, dashed, active, layer };
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
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const fade = parseBoolField(block, vars, 'fade', true);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 18, false);
    return { name, pointName, maxPoints, minDist, color, thickness, fade, active, layer };
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
    const opacity = parseNumberField(block, vars, 'opacity', 0.35, false);
    const quality = parseNumberField(block, vars, 'quality', 3, false);
    const border = parseBoolField(block, vars, 'border', true);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 5, false);
    return {
        name, funcName: fM[1], op: opM ? opM[1] : '<',
        level: parseNumberField(block, vars, 'level', 0, false),
        func2Name: f2M ? f2M[1] : null, op2: op2M ? op2M[1] : '<',
        level2: parseNumberField(block, vars, 'level2', 0, false),
        combine: combineM ? combineM[1] : 'and',
        color, opacity, quality, border, active, layer
    };
}

// draw Bifurcation — бифуркационная диаграмма семейства x -> f(r, x).
function parseBifurcationBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const fM = block.match(/(?:^|[^A-Za-z0-9_])f\s*=\s*"([^"]*)"/);
    if (!fM) return null;
    return {
        name, funcName: fM[1],
        rmin: parseNumberField(block, vars, 'rmin', 2.4, false),
        rmax: parseNumberField(block, vars, 'rmax', 4, false),
        ymin: parseNumberField(block, vars, 'ymin', 0, false),
        ymax: parseNumberField(block, vars, 'ymax', 1, false),
        x0: parseNumberField(block, vars, 'x0', 0.5, false),
        skip: parseNumberField(block, vars, 'skip', 200, false),
        keep: parseNumberField(block, vars, 'keep', 120, false),
        quality: parseNumberField(block, vars, 'quality', 2, false),
        color: parseColorField(block, vars, 'color', '#1a237e'),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 15, false)
    };
}

// draw Cobweb — паутинная диаграмма итераций x -> f(x) вместе с прямой y = x.
function parseCobwebBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const fM = block.match(/(?:^|[^A-Za-z0-9_])f\s*=\s*"([^"]*)"/);
    if (!fM) return null;
    return {
        name, funcName: fM[1],
        x0Expr: captureExprField(block, 'x0'),
        steps: parseNumberField(block, vars, 'steps', 40, false),
        xmin: parseNumberField(block, vars, 'xmin', 0, false),
        xmax: parseNumberField(block, vars, 'xmax', 1, false),
        color: parseColorField(block, vars, 'color', '#c62828'),
        curveColor: parseColorField(block, vars, 'curveColor', '#1565c0'),
        showDiagonal: parseBoolField(block, vars, 'showDiagonal', true),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 16, false)
    };
}

// draw IFS — система итерированных функций (игра хаоса): папоротник, ковёр и т.п.
// maps = [[a,b,c,d,e,f,p], ...] — аффинные отображения с вероятностями.
function parseIFSBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const mapsExpr = captureExprField(block, 'maps');
    if (mapsExpr === null) return null;
    return {
        name, mapsExpr,
        iterations: parseNumberField(block, vars, 'iterations', 40000, false),
        color: parseColorField(block, vars, 'color', '#1b5e20'),
        pointSize: parseNumberField(block, vars, 'pointSize', 1, false),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 14, false)
    };
}

// draw Automaton — клеточные автоматы: элементарные (правила Вольфрама) и «Жизнь».
function parseAutomatonBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const typeM = block.match(/(?:^|[^A-Za-z0-9_])type\s*=\s*"?(elementary|life)"?/);
    return {
        name, type: typeM ? typeM[1] : 'elementary',
        rule: parseNumberField(block, vars, 'rule', 30, false),
        cells: parseNumberField(block, vars, 'cells', 101, false),
        steps: parseNumberField(block, vars, 'steps', 60, false),
        cellSize: parseNumberField(block, vars, 'cellSize', 0.25, false),
        initExpr: captureExprField(block, 'init'),
        generationExpr: captureExprField(block, 'generation'),
        posXExpr: (block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/) ? splitTopLevelList(block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/)[1])[0].trim() : '0'),
        posYExpr: (block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/) ? splitTopLevelList(block.match(/(?:^|[^A-Za-z0-9_])pos\s*=\s*\(([^)]*)\)/)[1])[1].trim() : '0'),
        color: parseColorField(block, vars, 'color', '#212121'),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 16, false)
    };
}

// draw Voronoi — диаграмма Вороного / триангуляция Делоне / выпуклая оболочка.
function parseVoronoiBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const sitesExpr = captureExprField(block, 'sites');
    const modeM = block.match(/(?:^|[^A-Za-z0-9_])mode\s*=\s*"?(voronoi|delaunay|hull)"?/);
    return {
        name, sitesExpr, mode: modeM ? modeM[1] : 'voronoi',
        quality: parseNumberField(block, vars, 'quality', 3, false),
        color: parseColorField(block, vars, 'color', '#37474f'),
        showSites: parseBoolField(block, vars, 'showSites', true),
        filled: parseBoolField(block, vars, 'filled', true),
        opacity: parseNumberField(block, vars, 'opacity', 0.45, false),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 8, false)
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
        circleColor: parseColorField(block, vars, 'circleColor', '#9e9e9e'),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 24, false)
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
        name, nodesExpr, arrowsExpr,
        acceptingExpr: captureExprField(block, 'accepting'),
        nodeRadius: parseNumberField(block, vars, 'nodeRadius', 14, false),
        boxed: parseBoolField(block, vars, 'boxed', false),
        curved: parseBoolField(block, vars, 'curved', true),
        color: parseColorField(block, vars, 'color', '#263238'),
        arrowColor: parseColorField(block, vars, 'arrowColor', '#455a64'),
        labelColor: parseColorField(block, vars, 'labelColor', '#ffffff'),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 24, false)
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
    return {
        name, funcName: fM[1], mode: modeM ? modeM[1] : 'domain',
        quality: parseNumberField(block, vars, 'quality', 2, false),
        contours: parseBoolField(block, vars, 'contours', true),
        opacity: parseNumberField(block, vars, 'opacity', 1, false),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', -90, false)
    };
}

// draw Hyperbolic — геометрия Лобачевского в модели Пуанкаре (круг или полуплоскость).
// Умеет: границу абсолюта, геодезические между точками, правильное замощение {p,q}.
function parseHyperbolicBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const modelM = block.match(/(?:^|[^A-Za-z0-9_])model\s*=\s*"?(disk|halfplane)"?/);
    const tilingM = block.match(/(?:^|[^A-Za-z0-9_])tiling\s*=\s*"\{?\s*(\d+)\s*,\s*(\d+)\s*\}?"/);
    const geodesicsExpr = captureExprField(block, 'geodesics');
    const pointsExpr = captureExprField(block, 'points');
    return {
        name, model: modelM ? modelM[1] : 'disk',
        tilingP: tilingM ? parseInt(tilingM[1], 10) : 0,
        tilingQ: tilingM ? parseInt(tilingM[2], 10) : 0,
        depth: parseNumberField(block, vars, 'depth', 3, false),
        radius: parseNumberField(block, vars, 'radius', 8, false),
        geodesicsExpr, pointsExpr,
        showBoundary: parseBoolField(block, vars, 'showBoundary', true),
        color: parseColorField(block, vars, 'color', '#2c3e50'),
        tileColor: parseColorField(block, vars, 'tileColor', '#5b8db8'),
        thickness: parseNumberField(block, vars, 'thickness', 1.4, false),
        active: parseBoolField(block, vars, 'active', true),
        layer: parseNumberField(block, vars, 'layer', 12, false)
    };
}

// draw Fractal — эскейп-тайм фракталы: Мандельброт, Жюлиа, «Горящий корабль».
// Для julia параметры cRe/cIm — ВЫРАЖЕНИЯ мини-языка (например, cRe = C.pos.x),
// что позволяет привязать фрактал к перетаскиваемой точке и менять его динамически.
function parseFractalBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    let type = 'mandelbrot';
    const typeMatch = block.match(/(?:^|[^A-Za-z0-9_])type\s*=\s*"?(mandelbrot|julia|burningship)"?/);
    if (typeMatch) type = typeMatch[1];
    const cReExpr = captureExprField(block, 'cRe');
    const cImExpr = captureExprField(block, 'cIm');
    if (type === 'julia' && (cReExpr === null || cImExpr === null)) return null;
    const maxIter = parseNumberField(block, vars, 'maxIter', 80, false);
    const quality = parseNumberField(block, vars, 'quality', 2, false);
    const paletteMatch = block.match(/(?:^|[^A-Za-z0-9_])palette\s*=\s*"?(fire|ocean|gray|rainbow)"?/);
    const palette = paletteMatch ? paletteMatch[1] : 'ocean';
    const opacity = parseNumberField(block, vars, 'opacity', 1, false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', -100, false);
    return { name, type, cReExpr, cImExpr, maxIter, quality, palette, opacity, active, layer };
}

// draw Image — асинхронно загружаемое растровое изображение (Задача 3)
function parseImageBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const srcMatch = block.match(/src\s*=\s*"([^"]*)"/);
    if (!srcMatch) return null;
    const src = srcMatch[1];

    const posName = parsePointRefField(block, vars, 'pos');
    if (!posName) return null;

    const width = parseNumberField(block, vars, 'width', 5, false);
    const height = parseNumberField(block, vars, 'height', 5, false);
    const opacity = parseNumberField(block, vars, 'opacity', 1, false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 15, false);

    return { name, src, posName, width, height, opacity, active, layer };
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
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    return { name, dataExpr, bins, color, active, layer };
}

// draw Field — векторное поле (Задача 4): P(x,y), Q(x,y)
function parseFieldBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const pMatch = block.match(/(?:^|[,{])\s*P\s*=\s*"([^"]*)"/);
    const qMatch = block.match(/(?:^|[,{])\s*Q\s*=\s*"([^"]*)"/);
    if (!pMatch || !qMatch) return null;
    // R — третья (вертикальная) компонента поля, только для 3D; если не задана,
    // поле считается плоским (лежащим в срезе z = 0), как и было в 2D.
    const rMatch = block.match(/(?:^|[,{])\s*R\s*=\s*"([^"]*)"/);
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
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 10, false);
    return { name, pExpr: pMatch[1], qExpr: qMatch[1], rExpr, xmin, xmax, ymin, ymax, zmin, zmax, grid, scale, color, active, activeExpr: parseActiveExpr(block), layer };
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
            const pMatch = block.match(/(?:^|[,{])\s*P\s*=\s*"([^"]*)"/);
            const qMatch = block.match(/(?:^|[,{])\s*Q\s*=\s*"([^"]*)"/);
            if (!pMatch || !qMatch) return null;
            pExpr = pMatch[1]; qExpr = qMatch[1];
            const rMatch = block.match(/(?:^|[,{])\s*R\s*=\s*"([^"]*)"/);
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
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 15, false);
    return { name, systemName, fieldName, pExpr, qExpr, rExpr, start: startParts, steps, dt, color, thickness, active, activeExpr: parseActiveExpr(block), layer };
}

// draw Graph — визуализация графа (Задача 5), graph — имя переменной, созданной через newGraph()/addNode/addEdge
function parseGraphDrawBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;
    const graphMatch = block.match(/graph\s*=\s*"([^"]*)"/);
    if (!graphMatch) return null;
    const color = parseColorField(block, vars, 'color', null);
    const nodeColor = parseColorField(block, vars, 'nodeColor', null);
    const edgeColor = parseColorField(block, vars, 'edgeColor', null);
    const labelColor = parseColorField(block, vars, 'labelColor', '#ffffff');
    const nodeRadius = parseNumberField(block, vars, 'nodeRadius', 9, false);
    const directed = parseBoolField(block, vars, 'directed', false);
    const showWeights = parseBoolField(block, vars, 'showWeights', true);
    const labels = parseBoolField(block, vars, 'labels', true);
    // Выражения, вычисляемые каждый кадр: списки подсвечиваемых вершин/рёбер
    const highlightExpr = captureExprField(block, 'highlight');
    const highlightEdgesExpr = captureExprField(block, 'highlightEdges');
    const highlightColor = parseColorField(block, vars, 'highlightColor', '#e8590c');
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);
    return {
        name, graphVar: graphMatch[1], color, nodeColor, edgeColor, labelColor, nodeRadius,
        directed, showWeights, labels, highlightExpr, highlightEdgesExpr, highlightColor, active, layer
    };
}

function parseDrawTextBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    // Сохраняем ВСЕ поля как сырые строки выражений
    let posXExpr = null, posYExpr = null, posZExpr = null;
    const posMatch = block.match(/pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const coordsStr = posMatch[1].trim();
        const parts = coordsStr.split(',').map(s => s.trim());
        if (parts.length === 2) {
            posXExpr = parts[0];
            posYExpr = parts[1];
        } else if (parts.length === 3) {
            // Третья координата — только для 3D-сцен; в 2D просто не используется.
            posXExpr = parts[0];
            posYExpr = parts[1];
            posZExpr = parts[2];
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

    let colorExpr = '#000000';
    const colorMatch = block.match(/(?:^|[^A-Za-z0-9_])color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (colorMatch) {
        colorExpr = colorMatch[1];
    }

    let sizeExpr = '1';
    const sizeMatch = block.match(/(?:^|[^A-Za-z0-9_])size\s*=\s*(-?[\d.]+|default|[a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (sizeMatch) {
        sizeExpr = sizeMatch[1];
    }

    let activeExpr = 'true';
    const activeMatch = block.match(/active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (activeMatch) {
        activeExpr = activeMatch[1];
    }

    const layer = parseNumberField(block, vars, 'layer', 45, false);
    return { name, posXExpr, posYExpr, posZExpr, textExpr, colorExpr, sizeExpr, activeExpr, layer };
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
            const rotate3D = parseXYZField(block, vars, 'rotate', { x: 0, y: 0, z: rotate || 0 });
            const interact = parseBoolField(block, vars, 'interact', true);
            const collisionFields = parseGeneralCollisionFields(block, vars, false);

            return { name, elements, active, rotate, rotate3D, interact, ...collisionFields };
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
    const errors = [];

    // Все объектные блоки извлекаются балансным сканером (findHeaderedBlocks):
    // вложенные { } и '};' внутри строковых значений больше не обрывают блок.
    const blockDefs = [
        { header: '\\bnew\\s+Point\\b',        label: 'Point',           parse: parsePointBlock,        target: points,          err: 'пропущены обязательные поля (name, pos или line/circle/graph/...)' },
        { header: '\\bnew\\s+Line\\b',         label: 'Line',            parse: parseLineBlock,         target: lines,           err: 'пропущены обязательные поля (name, pos)' },
        { header: '\\bnew\\s+Figure\\b',       label: 'Figure',          parse: parseFigureBlock,       target: figures,         err: 'пропущены обязательные поля (name, elements)' },
        { header: '\\bnew\\s+Primitive\\b',    label: 'Primitive',       parse: parsePrimitiveBlock,    target: primitives,      err: 'пропущены обязательные поля (name, type — один из: ' + PRIMITIVE_TYPES.join(', ') + ')' },
        { header: '\\bnew\\s+Section\\b',      label: 'Section',         parse: parseSectionBlock,      target: sections,        err: 'пропущены обязательные поля (name, source)', trackPos: true },
        { header: '\\bnew\\s+Boolean\\b',      label: 'Boolean',         parse: parseBooleanBlock,      target: booleans,        err: 'пропущены обязательные поля (name, op — union/intersect/subtract, parts — минимум 2 элемента)', trackPos: true },
        { header: '\\bnew\\s+Angle3D\\b',      label: 'Angle3D',         parse: parseAngle3DBlock,      target: angles3D,        err: 'пропущены обязательные поля (name, type — один из: ' + ANGLE3D_TYPES.join(', ') + ', и соответствующие точки/линии/плоскости)' },
        { header: '\\bnew\\s+Claster\\b',      label: 'Claster',         parse: parseClasterBlock,      target: clusters,        err: 'пропущены обязательные поля (name, elements)' },
        { header: '\\bnew\\s+Angle\\b',        label: 'Angle',           parse: parseAngleBlock,        target: angles,          err: 'пропущены обязательные поля (name, lines)' },
        { header: '\\bdraw\\s+Angle\\b',       label: 'draw Angle',      parse: parseDrawAngleBlock,    target: drawAngles,      err: 'пропущено обязательное поле (angle)' },
        { header: '\\bdraw\\s+EquallySing\\b', label: 'draw EquallySing',parse: parseEquallySingBlock,  target: drawEqually,     err: 'пропущены обязательные поля (edges)' },
        { header: '\\bdraw\\s+Vector\\b',      label: 'draw Vector',     parse: parseVectorBlock,       target: drawVectors,     err: 'пропущены обязательные поля (edge)' },
        { header: '\\bdraw\\s+InfLine\\b',     label: 'draw InfLine',    parse: parseInfLineBlock,      target: drawInfLines,    err: 'пропущены обязательные поля (line)' },
        { header: '\\bdraw\\s+InfPlane\\b',    label: 'draw InfPlane',   parse: parseInfPlaneBlock,     target: drawInfPlanes,   err: 'пропущены обязательные поля (name и figure/points)' },
        { header: '\\bdraw\\s+Filling\\b',     label: 'draw Filling',    parse: parseFillingBlock,      target: drawFillings,    err: 'пропущены обязательные поля (figure или line+side или circle+from+to)' },
        { header: '\\bdraw\\s+Punctir\\b',     label: 'draw Punctir',    parse: parsePunctirBlock,      target: drawPunctirs,    err: 'пропущены обязательные поля (line)' },
        { header: '\\bdraw\\s+Text\\b',        label: 'draw Text',       parse: parseDrawTextBlock,     target: drawTexts,       err: 'пропущены обязательные поля (name, pos)' },
        { header: '\\bnew\\s+UI\\b',           label: 'UI',              parse: parseUIBlock,           target: uiElements,      err: 'пропущены обязательные поля (type и его параметры)' },
        { header: '\\bnew\\s+Circle\\b',       label: 'Circle',          parse: parseCircleBlock,       target: circles,         err: 'пропущены обязательные поля (name, center, radius)' },
        { header: '\\bdraw\\s+Arc\\b',         label: 'draw Arc',        parse: parseArcBlock,          target: arcs,            err: 'пропущены обязательные поля (name и center+from+to или points)' },
        { header: '\\bnew\\s+Ellipse\\b',      label: 'Ellipse',         parse: parseEllipseBlock,      target: ellipses,        err: 'пропущены обязательные поля (name, center, a, b или points/foci)' },
        { header: '\\bnew\\s+Curve\\b',        label: 'Curve',           parse: parseCurveBlock,        target: curves,          err: 'пропущены обязательные поля (name и points или x+y)' },
        { header: '\\bdraw\\s+Function\\b',    label: 'draw Function',   parse: parseFunctionGraphBlock,target: drawFunctions,   err: 'пропущены обязательные поля (name, f)' },
        { header: '\\bdraw\\s+Surface\\b',     label: 'draw Surface',    parse: parseSurfaceBlock,      target: drawSurfaces,    err: 'пропущены обязательные поля (name, f)' },
        { header: '\\bdraw\\s+Image\\b',       label: 'draw Image',      parse: parseImageBlock,        target: drawImages,      err: 'пропущены обязательные поля (name, src, pos)' },
        { header: '\\bdraw\\s+Histogram\\b',   label: 'draw Histogram',  parse: parseHistogramBlock,    target: drawHistograms,  err: 'пропущены обязательные поля (name, data)' },
        { header: '\\bdraw\\s+Field\\b',       label: 'draw Field',      parse: parseFieldBlock,        target: drawFields,      err: 'пропущены обязательные поля (name, P, Q)' },
        { header: '\\bdraw\\s+Trajectory\\b',  label: 'draw Trajectory', parse: parseTrajectoryBlock,   target: drawTrajectories,err: 'пропущены обязательные поля (name, start, и один из: system / field / P+Q)' },
        { header: '\\bdraw\\s+Graph\\b',       label: 'draw Graph',      parse: parseGraphDrawBlock,    target: drawGraphs,      err: 'пропущены обязательные поля (name, graph)' },
        { header: '\\bdraw\\s+Fractal\\b',     label: 'draw Fractal',    parse: parseFractalBlock,      target: drawFractals,    err: 'пропущены обязательные поля (name; для julia — cRe и cIm)' },
        { header: '\\bdraw\\s+Formula\\b',     label: 'draw Formula',    parse: parseFormulaBlock,      target: drawFormulas,    err: 'пропущены обязательные поля (name, pos, latex)' },
        { header: '\\bdraw\\s+Locus\\b',       label: 'draw Locus',      parse: parseLocusBlock,        target: drawLoci,        err: 'пропущены обязательные поля (name, point, driver)' },
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
        { header: '\\bdraw\\s+Fourier\\b', label: 'draw Fourier', parse: parseFourierBlock, target: drawFouriers, err: 'пропущены обязательные поля (name, path)' },
        { header: '\\bdraw\\s+Diagram\\b', label: 'draw Diagram', parse: parseDiagramBlock, target: drawDiagrams, err: 'пропущены обязательные поля (name, nodes)' }
    ];
    for (const def of blockDefs) {
        for (const b of findHeaderedBlocks(codeBlock, def.header)) {
            const parsed = def.parse(b.body, vars);
            if (parsed) { if (def.trackPos) parsed.__pos = b.start; def.target.push(parsed); }
            else errors.push({ line: '--', message: `Ошибка в блоке ${def.label}: ${def.err}` });
        }
    }

    // Скрытые точки, порождённые буквальными координатами (x, y) вместо имени точки — везде, где ожидалась точка
    points.push(...syntheticPoints);

    // ----- Валидации -----
    for (let l of lines) {
        const pA = points.find(p => p.name === l.pointA);
        const pB = points.find(p => p.name === l.pointB);
        if (!pA || !pB) errors.push({ line: '--', message: `Линия "${l.name}" ссылается на несуществующую точку.` });
    }

    for (let p of points) {
        if (p.line) {
            const line = lines.find(l => l.name === p.line);
            if (!line) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую линию "${p.line}"` });
        }
        if (p.circle) {
            const circle = circles.find(c => c.name === p.circle);
            if (!circle) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую окружность "${p.circle}"` });
        }
        if (p.graph) {
            const g = drawFunctions.find(d => d.name === p.graph);
            if (!g) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующий график функции "${p.graph}"` });
        }
        if (p.ellipse) {
            const ellipse = ellipses.find(e => e.name === p.ellipse);
            if (!ellipse) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующий эллипс "${p.ellipse}"` });
        }
        if (p.curve) {
            const curve = curves.find(c => c.name === p.curve);
            if (!curve) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую кривую "${p.curve}"` });
        }
        if (p.arc) {
            const arc = arcs.find(a => a.name === p.arc);
            if (!arc) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую дугу "${p.arc}"` });
        }
        if (p.transform) {
            if (p.transformSourceLine) {
                if (!lines.find(l => l.name === p.transformSourceLine)) {
                    errors.push({ line: '--', message: `Линия ссылается на несуществующую исходную линию "${p.transformSourceLine}"` });
                }
            } else if (!points.find(pp => pp.name === p.transformSource)) {
                errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую исходную точку "${p.transformSource}"` });
            }
            const ref = p.transformOver || p.transformAround || p.transformCenter;
            if (ref && !points.find(pp => pp.name === ref) && !lines.find(l => l.name === ref)) {
                errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующую точку/линию "${ref}"` });
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
            errors.push({ line: '--', message: `Фигура "${f.name}" содержит неизвестный элемент "${elem}"` });
        }
        f.pointNames = allPointNames;
        for (let pn of allPointNames) {
            if (!points.find(p => p.name === pn)) errors.push({ line: '--', message: `Фигура "${f.name}" ссылается на несуществующую точку "${pn}"` });
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
    ].sort((a, b) => a.__pos - b.__pos);

    {
        const primitiveNames = new Set(primitives.map(p => p.name));
        const posByName = new Map();
        for (const op of derivedOps) posByName.set(op.name, op.__pos);
        for (const op of derivedOps) {
            const refs = (op.kind === 'section') ? [op.source] : op.parts;
            const label = (op.kind === 'section') ? 'Section' : 'Boolean';
            if (op.kind === 'section' && op.source === op.name) {
                errors.push({ line: '--', message: `Section "${op.name}" не может ссылаться сам на себя` });
                continue;
            }
            if (op.kind === 'boolean' && op.parts.includes(op.name)) {
                errors.push({ line: '--', message: `Boolean "${op.name}" не может ссылаться сам на себя` });
                continue;
            }
            for (const refName of refs) {
                if (primitiveNames.has(refName)) continue;
                if (posByName.has(refName)) {
                    if (posByName.get(refName) >= op.__pos) {
                        errors.push({ line: '--', message: `${label} "${op.name}" ссылается на "${refName}", объявленный позже (Section/Boolean должны ссылаться только на ранее объявленные Primitive/Section/Boolean)` });
                    }
                    continue;
                }
                errors.push({ line: '--', message: `${label} "${op.name}" ссылается на неизвестный объект "${refName}"` });
            }
        }
    }

    // Валидация кластеров – теперь с учётом всех draw-элементов
    for (let c of clusters) {
        const allElements = [];
        for (let elem of c.elements) {
            const found = points.find(p => p.name === elem) ||
                          lines.find(l => l.name === elem) ||
                          figures.find(f => f.name === elem) ||
                          primitives.find(pr => pr.name === elem) ||
                          derivedOps.find(op => op.name === elem) ||
                          circles.find(cir => cir.name === elem) ||
                          arcs.find(ar => ar.name === elem) ||
                          ellipses.find(el => el.name === elem) ||
                          curves.find(cv => cv.name === elem) ||
                          angles.find(a => a.name === elem) ||
                          drawAngles.find(d => d.name === elem) ||
                          drawEqually.find(d => d.name === elem) ||
                          drawVectors.find(d => d.name === elem) ||
                          drawInfLines.find(d => d.name === elem) ||
                          drawFillings.find(d => d.name === elem) ||
                          drawPunctirs.find(d => d.name === elem) ||
                          drawTexts.find(d => d.name === elem);
            if (found) allElements.push(elem);
            else errors.push({ line: '--', message: `Кластер "${c.name}" содержит неизвестный элемент "${elem}"` });
        }
        c.elements = allElements;
    }

    for (let pr of primitives) {
        if (pr.width <= 0 || pr.height <= 0 || pr.depth <= 0 || pr.edge <= 0 || pr.radius <= 0 || pr.tube <= 0) {
            errors.push({ line: '--', message: `Примитив "${pr.name}" (${pr.type}): размеры должны быть положительными числами` });
        }
    }

    for (let a3 of angles3D) {
        const allRefs = Object.values(a3.refs).concat(a3.vertexOverride ? [a3.vertexOverride] : []);
        for (const r of allRefs) {
            if (r.point && !points.find(p => p.name === r.point)) {
                errors.push({ line: '--', message: `Angle3D "${a3.name}" ссылается на несуществующую точку "${r.point}"` });
            }
        }
    }

    for (let a of angles) {
        const l1 = lines.find(l => l.name === a.lineNames[0]);
        const l2 = lines.find(l => l.name === a.lineNames[1]);
        if (!l1 || !l2) {
            errors.push({ line: '--', message: `Угол "${a.name}" ссылается на несуществующую линию.` });
            continue;
        }
        const p1 = points.find(p => p.name === l1.pointA);
        const p2 = points.find(p => p.name === l1.pointB);
        const p3 = points.find(p => p.name === l2.pointA);
        const p4 = points.find(p => p.name === l2.pointB);
        const common = [p1, p2].find(p => p === p3 || p === p4);
        if (!common) errors.push({ line: '--', message: `Линии угла "${a.name}" не имеют общей вершины.` });
    }

    for (let d of drawAngles) {
        const angle = angles.find(a => a.name === d.angleName);
        if (!angle) errors.push({ line: '--', message: `draw Angle "${d.name}" ссылается на неизвестный угол "${d.angleName}"` });
    }

    for (let c of circles) {
        if (c.type === 'FromRadius') {
            const centerPoint = points.find(p => p.name === c.centerName);
            if (!centerPoint) errors.push({ line: '--', message: `Окружность "${c.name}" ссылается на несуществующую точку "${c.centerName}"` });
            if (typeof c.radius === 'string') {
                const radiusPoint = points.find(p => p.name === c.radius);
                if (!radiusPoint) errors.push({ line: '--', message: `Окружность "${c.name}" использует радиус-точку "${c.radius}", которая не найдена` });
            }
        } else if (c.type === 'FromPoints') {
            for (let pn of c.pointNames) {
                if (!points.find(p => p.name === pn)) errors.push({ line: '--', message: `Окружность "${c.name}" ссылается на несуществующую точку "${pn}"` });
            }
        }
    }

    for (let a of arcs) {
        if (a.type === 'ThreePoints') {
            for (let pn of a.pointNames) {
                if (!points.find(p => p.name === pn)) errors.push({ line: '--', message: `Дуга "${a.name}" (ThreePoints) ссылается на несуществующую точку "${pn}"` });
            }
            continue;
        }
        if (!points.find(p => p.name === a.centerName)) errors.push({ line: '--', message: `Дуга "${a.name}" ссылается на несуществующую точку центра "${a.centerName}"` });
        if (!points.find(p => p.name === a.from)) errors.push({ line: '--', message: `Дуга "${a.name}" ссылается на несуществующую точку "from"` });
        if (!points.find(p => p.name === a.to)) errors.push({ line: '--', message: `Дуга "${a.name}" ссылается на несуществующую точку "to"` });
        if (typeof a.radius === 'string' && !points.find(p => p.name === a.radius)) {
            errors.push({ line: '--', message: `Дуга "${a.name}" использует радиус-точку "${a.radius}", которая не найдена` });
        }
    }

    for (let e of ellipses) {
        if (e.type === 'FromPoints') {
            for (let pn of e.pointNames) {
                if (!points.find(p => p.name === pn)) errors.push({ line: '--', message: `Эллипс "${e.name}" (FromPoints) ссылается на несуществующую точку "${pn}"` });
            }
        } else if (e.type === 'ByFoci') {
            if (!points.find(p => p.name === e.focus1)) errors.push({ line: '--', message: `Эллипс "${e.name}" (ByFoci) ссылается на несуществующий фокус "${e.focus1}"` });
            if (!points.find(p => p.name === e.focus2)) errors.push({ line: '--', message: `Эллипс "${e.name}" (ByFoci) ссылается на несуществующий фокус "${e.focus2}"` });
        } else {
            if (!points.find(p => p.name === e.centerName)) errors.push({ line: '--', message: `Эллипс "${e.name}" ссылается на несуществующую точку центра "${e.centerName}"` });
        }
    }

    for (let cv of curves) {
        if (cv.type === 'bezier') {
            for (let pn of cv.controlPoints) {
                if (!points.find(p => p.name === pn)) errors.push({ line: '--', message: `Кривая "${cv.name}" ссылается на несуществующую контрольную точку "${pn}"` });
            }
        } else if (cv.type === 'spiral' || cv.type === 'cycloid' || cv.type === 'involute') {
            if (!points.find(p => p.name === cv.centerName)) errors.push({ line: '--', message: `Кривая "${cv.name}" ссылается на несуществующую опорную точку "${cv.centerName}"` });
        }
    }

    for (let im of drawImages) {
        if (!points.find(p => p.name === im.posName)) errors.push({ line: '--', message: `Изображение "${im.name}" ссылается на несуществующую точку "${im.posName}"` });
    }

    for (let tr of drawTrajectories) {
        if (tr.fieldName && !drawFields.find(f => f.name === tr.fieldName)) {
            errors.push({ line: '--', message: `Траектория "${tr.name}" ссылается на несуществующее поле "${tr.fieldName}"` });
        }
    }

    return {
        points, lines, figures, primitives, derivedOps: derivedOps.map(({ __pos, ...rest }) => rest), clusters, angles, angles3D,
        drawAngles, drawEqually, drawVectors, drawInfLines, drawInfPlanes, drawFillings, drawPunctirs, drawTexts,
        uiElements, circles, arcs, ellipses, curves, drawFunctions, drawSurfaces, drawImages,
        drawHistograms, drawFields, drawTrajectories, drawGraphs, drawFractals,
        drawFormulas, drawLoci, drawTraces, drawRegions, drawCharts, drawTrees, drawTables,
        drawComplexes, drawHyperbolics, drawBifurcations, drawCobwebs, drawIFSs, drawAutomata, drawVoronois, drawFouriers, drawDiagrams, errors
    };
}

        // ========== ГЕНЕРАТОР 2D с динамическими окружностями ==========
function generate2D(params, pointsData, linesData, figuresData, clustersData, anglesData,
                    drawAnglesData, drawEquallyData, drawVectorsData, drawInfLinesData, drawFillingsData, drawPunctirsData,
                    drawTextsData, uiData, circlesData, arcsData, ellipsesData, curvesData, drawFunctionsData, drawSurfacesData, drawImagesData,
                    drawHistogramsData, drawFieldsData, drawTrajectoriesData, drawGraphsData, drawFractalsData,
                    drawFormulasData, drawLociData, drawTracesData, drawRegionsData,
                    drawChartsData, drawTreesData, drawTablesData, drawComplexesData, drawHyperbolicsData,
                    drawBifurcationsData, drawCobwebsData, drawIFSsData, drawAutomataData, drawVoronoisData, drawFouriersData, drawDiagramsData,
                    funcsData, procsData, userVars, startCodes, updateCodes) {
    try {
        const title = params.title || '';
        const undertitle = params.undertitle || '';
        const description = params.description || '';

        // Тема оформления (по умолчанию — тёмная); задаёт цвет фона, рамки и цвета "по умолчанию",
        // если автор явно не указал их в конфиге. Явно указанные значения всегда в приоритете
        // и не переопределяются при смене темы из родительского окна (см. __gcApplyThemeVars ниже).
        const themeName = (params.theme === 'light' || params.theme === 'dark') ? params.theme : 'dark';
        const theme = THEME_PRESETS[themeName];

        const fieldWidth = (typeof params['field width'] === 'number') ? params['field width'] : 50;
        const fieldHeight = (typeof params['field height'] === 'number') ? params['field height'] : 30;
        const fieldColor = params['field color'] || theme.fieldColor;
        const frameColor = params['frame color'] || theme.frameColor;
        const frameWidth = (typeof params['frame width'] === 'number') ? params['frame width'] : 1;
        const titleColor = params['title color'] || theme.titleColor;
        const titleSize = (typeof params['title size'] === 'number') ? params['title size'] : 1.3;
        const subColor = params['undertitle color'] || theme.subColor;
        const subSize = (typeof params['undertitle size'] === 'number') ? params['undertitle size'] : 0.7;
        const descColor = params['description color'] || theme.descColor;
        const descSize = (typeof params['description size'] === 'number') ? params['description size'] : 0.85;
        const footerColor = params['footer color'] || theme.footerColor;
        const footerSize = (typeof params['footer size'] === 'number') ? params['footer size'] : 0.65;

        // Явные переопределения цвета автором примера — при смене темы из iframe эти
        // значения не должны затираться пресетом.
        const themeOverrides = {
            field: !!params['field color'],
            frame: !!params['frame color'],
            title: !!params['title color'],
            sub: !!params['undertitle color'],
            desc: !!params['description color'],
            footer: !!params['footer color'],
        };
        const themesJson = jsonForScript(THEME_PRESETS);
        const themeNameJson = jsonForScript(themeName);
        const themeOverridesJson = jsonForScript(themeOverrides);

        const cameraZoomLimits = Array.isArray(params['camera zoom limits']) ? params['camera zoom limits'] : [0.2, 5];
        const cameraStartZoom = (typeof params['camera start zoom'] === 'number') ? params['camera start zoom'] : 1;
        const cameraStartOffset = Array.isArray(params['camera start offset']) ? params['camera start offset'] : [0, 0];

        // ---- Привязка (snap) при перетаскивании: к другим точкам, к их осям (умные
        // направляющие) и к сетке. snap — общий переключатель, остальные два — тонкая
        // настройка шага сетки и радиуса "магнита" в пикселях экрана. ----
        const snapEnabled = params.snap !== false;
        const snapGridStep = (typeof params['snap grid'] === 'number' && params['snap grid'] > 0) ? params['snap grid'] : 1;
        const snapDistancePx = (typeof params['snap distance'] === 'number' && params['snap distance'] >= 0) ? params['snap distance'] : 10;

        const footer = params.footer ? escapeHtml(params.footer) : `Поле ${fieldWidth}×${fieldHeight} · Перетаскивайте точки, линии и окружности · камера: ${params.space}`;

        const pointsJson = jsonForScript(pointsData);
        const linesJson = jsonForScript(linesData);
        const figuresJson = jsonForScript(figuresData);
        const clustersJson = jsonForScript(clustersData);
        const anglesJson = jsonForScript(anglesData);
        const drawAnglesJson = jsonForScript(drawAnglesData);
        const drawEquallyJson = jsonForScript(drawEquallyData);
        const drawVectorsJson = jsonForScript(drawVectorsData);
        const drawInfLinesJson = jsonForScript(drawInfLinesData);
        const drawFillingsJson = jsonForScript(drawFillingsData);
        const drawPunctirsJson = jsonForScript(drawPunctirsData);
        const drawTextsJson = jsonForScript(drawTextsData);
        const uiJson = jsonForScript(uiData);
        const circlesJson = jsonForScript(circlesData);
        const arcsJson = jsonForScript(arcsData);
        const ellipsesJson = jsonForScript(ellipsesData);
        const curvesJson = jsonForScript(curvesData);
        const drawFunctionsJson = jsonForScript(drawFunctionsData);
        const drawSurfacesJson = jsonForScript(drawSurfacesData);
        const drawImagesJson = jsonForScript(drawImagesData);
        const drawHistogramsJson = jsonForScript(drawHistogramsData);
        const drawFieldsJson = jsonForScript(drawFieldsData);
        const drawTrajectoriesJson = jsonForScript(drawTrajectoriesData);
        const drawGraphsJson = jsonForScript(drawGraphsData);
        const funcsJson = jsonForScript(funcsData);
        const procsJson = jsonForScript(procsData || []);
        const varsJson = jsonForScript(userVars);
        const drawFractalsJson = jsonForScript(drawFractalsData || []);
        const drawFormulasJson = jsonForScript(drawFormulasData || []);
        const drawLociJson = jsonForScript(drawLociData || []);
        const drawTracesJson = jsonForScript(drawTracesData || []);
        const drawRegionsJson = jsonForScript(drawRegionsData || []);
        const drawChartsJson = jsonForScript(drawChartsData || []);
        const drawTreesJson = jsonForScript(drawTreesData || []);
        const drawTablesJson = jsonForScript(drawTablesData || []);
        const drawComplexesJson = jsonForScript(drawComplexesData || []);
        const drawHyperbolicsJson = jsonForScript(drawHyperbolicsData || []);
        const drawBifurcationsJson = jsonForScript(drawBifurcationsData || []);
        const drawCobwebsJson = jsonForScript(drawCobwebsData || []);
        const drawIFSsJson = jsonForScript(drawIFSsData || []);
        const drawAutomataJson = jsonForScript(drawAutomataData || []);
        const drawVoronoisJson = jsonForScript(drawVoronoisData || []);
        const drawFouriersJson = jsonForScript(drawFouriersData || []);
        const drawDiagramsJson = jsonForScript(drawDiagramsData || []);

        const startCodeCombined = (startCodes || []).filter(s => s.trim()).join('; ');
        const updateCodeCombined = (updateCodes || []).filter(s => s.trim()).join('; ');
        const startCodeEscaped = jsonForScript(startCodeCombined);
        const updateCodeEscaped = jsonForScript(updateCodeCombined);

        const parts = [
            '<!DOCTYPE html>\n',
            '<html lang="ru">\n',
            '<head>\n',
            '  <meta charset="UTF-8">\n',
            '  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">\n',
            '  <title>', title, '</title>\n',
            // KaTeX через CDN (абсолютные URL — работают в файле, открытом откуда угодно, включая blob URL)
            '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">\n',
            '  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>\n',
            ' <' + 'style>\n',
            '    :root {\n',
            '      --gc-field:', fieldColor, ';\n',
            '      --gc-frame:', frameColor, ';\n',
            '      --gc-title:', titleColor, ';\n',
            '      --gc-sub:', subColor, ';\n',
            '      --gc-desc:', descColor, ';\n',
            '      --gc-desc-bg:', theme.panelBg, ';\n',
            '      --gc-footer:', footerColor, ';\n',
            '      --gc-footer-border:', theme.footerBorder, ';\n',
            '      --gc-control-bg:', theme.controlBg, ';\n',
            '      --gc-control-border:', theme.controlBorder, ';\n',
            '      --gc-control-text:', theme.controlText, ';\n',
            '      --gc-button-text:', theme.buttonText, ';\n',
            '      --gc-input-bg:', theme.inputBg, ';\n',
            '      --gc-accent:', theme.accent, ';\n',
            '    }\n',
            '    * { margin:0; padding:0; box-sizing:border-box; user-select:none; -webkit-tap-highlight-color:transparent; }\n',
            '    body {\n',
            '      min-height:100vh;\n',
            '      background:transparent;\n',
            '      font-family:\'Segoe UI\',\'Montserrat\',system-ui,sans-serif;\n',
            '      display:flex;\n',
            '      justify-content:center;\n',
            '      align-items:center;\n',
            '      padding:1rem;\n',
            '      touch-action:pan-x pan-y;\n',
            '    }\n',
            '    .container { max-width:1000px; width:100%; background:transparent; }\n',
            '    .title { font-family:\'Montserrat\',\'Arial Black\',sans-serif; font-weight:900; font-size:', String(titleSize), 'rem; letter-spacing:0.05em; text-transform:uppercase; text-align:center; margin-bottom:0.3rem; color:var(--gc-title); }\n',
            '    .sub { text-align:center; font-size:', String(subSize), 'rem; margin-bottom:1rem; color:var(--gc-sub); }\n',
            '    .canvas-wrapper { border:', String(frameWidth), 'px solid var(--gc-frame); display:block; width:100%; max-width:800px; margin:0 auto; background:var(--gc-field); cursor:default; position:relative; overflow:hidden; }\n',
            '    canvas { background:transparent; display:block; margin:0 auto; width:100%; height:auto; border:none; touch-action:none; }\n',
            '    .info-panel { font-size:', String(descSize), 'rem; margin-top:0.6rem; font-family:monospace; text-align:center; background:var(--gc-desc-bg); padding:8px; border-radius:4px; line-height:1.5; color:var(--gc-desc); }\n',
            '    .footer { margin-top:0.8rem; font-size:', String(footerSize), 'rem; text-align:center; border-top:1px solid var(--gc-footer-border); padding-top:0.5rem; color:var(--gc-footer); }\n',
            '    .controls { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-top:12px; }\n',
            '    .controls button {\n',
            '      padding:4px 12px;\n',
            '      border:1px solid var(--gc-control-border);\n',
            '      border-radius:4px;\n',
            '      background:var(--gc-control-bg);\n',
            '      color:var(--gc-button-text);\n',
            '      font-size:0.85rem;\n',
            '      cursor:pointer;\n',
            '      font-family: inherit;\n',
            '    }\n',
            '    .controls button:hover { opacity:0.8; }\n',
            '    .controls input[type="checkbox"] {\n',
            '      width:18px; height:18px;\n',
            '      accent-color:var(--gc-accent);\n',
            '    }\n',
            '    .controls input[type="number"],\n',
            '    .controls input[type="text"] {\n',
            '      padding:4px 8px;\n',
            '      border:1px solid var(--gc-control-border);\n',
            '      border-radius:4px;\n',
            '      font-size:0.85rem;\n',
            '      width:100px;\n',
            '      background:var(--gc-input-bg);\n',
            '      color:var(--gc-control-text);\n',
            '      font-family: inherit;\n',
            '    }\n',
            '    .controls label {\n',
            '      font-size:0.85rem;\n',
            '      color:var(--gc-control-text);\n',
            '    }\n',
            '    .controls .ui-item { display:flex; align-items:center; gap:6px; }\n',
            '    .controls input.no-stepper::-webkit-inner-spin-button,\n',
            '    .controls input.no-stepper::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }\n',
            '    .controls input.no-stepper { -moz-appearance:textfield; }\n',
            '    @media (max-width:700px) {\n',
            '      .title { font-size:1rem; }\n',
            '      .sub { font-size:0.6rem; }\n',
            '      .info-panel { font-size:0.7rem; }\n',
            '      .controls { gap:8px; }\n',
            '      .controls input[type="number"], .controls input[type="text"] { width:80px; }\n',
            '    }\n',
            '  <' + '/style>\n',
            '</head>\n',
            '<body>\n',
            '<div class="container">\n',
            '  <div class="title">', title, '</div>\n',
            '  <div class="sub">', undertitle, '</div>\n',
            '  <div class="canvas-wrapper">\n',
            '    <canvas id="mainCanvas"></canvas>\n',
            '    <div id="formulaOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; z-index:10;"></div>\n',
            '    <div id="uiOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; z-index:11;"></div>\n',
            '  </div>\n',
            '  <div class="controls" id="uiContainer"></div>\n',
            '  <div class="info-panel" id="infoText">', description, '</div>\n',
            '  <div class="footer">', footer, '</div>\n',
            '</div>\n',
            '<script>\n',
            '  (function() {\n',
            '    const canvas = document.getElementById(\'mainCanvas\');\n',
            '    const ctx = canvas.getContext(\'2d\');\n',
            '    const infoPanel = document.getElementById(\'infoText\');\n',
            '    const uiContainer = document.getElementById(\'uiContainer\');\n',
            '    const uiOverlay = document.getElementById(\'uiOverlay\');\n',
            '\n',
            '    // ========== ТЕМЫ ОФОРМЛЕНИЯ (рантайм) ==========\n',
            '    // Доступны только заранее определённые темы (light/dark). Родительская страница,\n',
            '    // в которую этот пример вставлен через <iframe>, может переключить тему сообщением:\n',
            '    //   iframe.contentWindow.postMessage({ type: \'geocompiler-set-theme\', theme: \'light\' }, \'*\')\n',
            '    const GC_THEMES = ', themesJson, ';\n',
            '    const GC_THEME_OVERRIDES = ', themeOverridesJson, ';\n',
            '    let gcThemeName = ', themeNameJson, ';\n',
            '    function __gcDefaultColor() {\n',
            '      const t = GC_THEMES[gcThemeName] || GC_THEMES.dark;\n',
            '      return t.defaultColor;\n',
            '    }\n',
            '    function __gcApplyThemeVars(t) {\n',
            '      const root = document.documentElement.style;\n',
            '      if (!GC_THEME_OVERRIDES.field) root.setProperty(\'--gc-field\', t.fieldColor);\n',
            '      if (!GC_THEME_OVERRIDES.frame) root.setProperty(\'--gc-frame\', t.frameColor);\n',
            '      if (!GC_THEME_OVERRIDES.title) root.setProperty(\'--gc-title\', t.titleColor);\n',
            '      if (!GC_THEME_OVERRIDES.sub) root.setProperty(\'--gc-sub\', t.subColor);\n',
            '      if (!GC_THEME_OVERRIDES.desc) root.setProperty(\'--gc-desc\', t.descColor);\n',
            '      if (!GC_THEME_OVERRIDES.footer) root.setProperty(\'--gc-footer\', t.footerColor);\n',
            '      root.setProperty(\'--gc-desc-bg\', t.panelBg);\n',
            '      root.setProperty(\'--gc-footer-border\', t.footerBorder);\n',
            '      root.setProperty(\'--gc-control-bg\', t.controlBg);\n',
            '      root.setProperty(\'--gc-control-border\', t.controlBorder);\n',
            '      root.setProperty(\'--gc-control-text\', t.controlText);\n',
            '      root.setProperty(\'--gc-button-text\', t.buttonText);\n',
            '      root.setProperty(\'--gc-input-bg\', t.inputBg);\n',
            '      root.setProperty(\'--gc-accent\', t.accent);\n',
            '    }\n',
            '    // Переключить тему программно (доступна и из того же документа, и из iframe-сообщения).\n',
            '    // Принимает только имя уже определённой темы — произвольные цвета так задать нельзя.\n',
            '    window.geocompilerSetTheme = function(name) {\n',
            '      if (!GC_THEMES[name]) { glLogSafe(\'Неизвестная тема: \' + name); return false; }\n',
            '      gcThemeName = name;\n',
            '      __gcApplyThemeVars(GC_THEMES[name]);\n',
            '      if (typeof draw === \'function\') draw();\n',
            '      return true;\n',
            '    };\n',
            '    function glLogSafe(msg) { try { if (window.logLevel !== \'silent\') console.warn(msg); } catch (e) {} }\n',
            '    window.addEventListener(\'message\', function(ev) {\n',
            '      const data = ev && ev.data;\n',
            '      if (!data || data.type !== \'geocompiler-set-theme\') return;\n',
            '      window.geocompilerSetTheme(data.theme);\n',
            '    });\n',
            '\n',
            '    const pointsData = ', pointsJson, ';\n',
            '    const linesData = ', linesJson, ';\n',
            '    const figuresData = ', figuresJson, ';\n',
            '    const clustersData = ', clustersJson, ';\n',
            '    const anglesData = ', anglesJson, ';\n',
            '    const drawAnglesData = ', drawAnglesJson, ';\n',
            '    const drawEquallyData = ', drawEquallyJson, ';\n',
            '    const drawVectorsData = ', drawVectorsJson, ';\n',
            '    const drawInfLinesData = ', drawInfLinesJson, ';\n',
            '    const drawFillingsData = ', drawFillingsJson, ';\n',
            '    const drawPunctirsData = ', drawPunctirsJson, ';\n',
            '    const drawTextsData = ', drawTextsJson, ';\n',
            '    const uiData = ', uiJson, ';\n',
            '    const circlesData = ', circlesJson, ';\n',
            '    const arcsData = ', arcsJson, ';\n',
            '    const ellipsesData = ', ellipsesJson, ';\n',
            '    const curvesData = ', curvesJson, ';\n',
            '    const drawFunctionsData = ', drawFunctionsJson, ';\n',
            '    const drawSurfacesData = ', drawSurfacesJson, ';\n',
            '    const drawImagesData = ', drawImagesJson, ';\n',
            '    const drawHistogramsData = ', drawHistogramsJson, ';\n',
            '    const drawFieldsData = ', drawFieldsJson, ';\n',
            '    const drawTrajectoriesData = ', drawTrajectoriesJson, ';\n',
            '    const drawGraphsData = ', drawGraphsJson, ';\n',
            '    const drawFractalsData = ', drawFractalsJson, ';\n',
            '    const drawFormulasData = ', drawFormulasJson, ';\n',
            '    const drawLociData = ', drawLociJson, ';\n',
            '    const drawTracesData = ', drawTracesJson, ';\n',
            '    const drawRegionsData = ', drawRegionsJson, ';\n',
            '    const drawChartsData = ', drawChartsJson, ';\n',
            '    const drawTreesData = ', drawTreesJson, ';\n',
            '    const drawTablesData = ', drawTablesJson, ';\n',
            '    const drawComplexesData = ', drawComplexesJson, ';\n',
            '    const drawHyperbolicsData = ', drawHyperbolicsJson, ';\n',
            '    const drawBifurcationsData = ', drawBifurcationsJson, ';\n',
            '    const drawCobwebsData = ', drawCobwebsJson, ';\n',
            '    const drawIFSsData = ', drawIFSsJson, ';\n',
            '    const drawAutomataData = ', drawAutomataJson, ';\n',
            '    const drawVoronoisData = ', drawVoronoisJson, ';\n',
            '    const drawFouriersData = ', drawFouriersJson, ';\n',
            '    const drawDiagramsData = ', drawDiagramsJson, ';\n',
            '    const funcsData = ', funcsJson, ';\n',
            '    const procsData = ', procsJson, ';\n',
            '    const userVars = ', varsJson, ';\n',
            '\n',
            '    window.logLevel = \'warn\'; // \'silent\' | \'error\' | \'warn\' | \'verbose\'\n',
            '    var GL_LOG_LEVELS = { silent: 0, error: 1, warn: 2, verbose: 3 };\n',
            '    function glLog(level, msg) {\n',
            '      const cur = GL_LOG_LEVELS[window.logLevel] !== undefined ? GL_LOG_LEVELS[window.logLevel] : GL_LOG_LEVELS.warn;\n',
            '      const msgLevel = GL_LOG_LEVELS[level] !== undefined ? GL_LOG_LEVELS[level] : GL_LOG_LEVELS.warn;\n',
            '      if (msgLevel > cur) return;\n',
            '      if (level === \'error\') console.error(msg); else if (level === \'warn\') console.warn(msg); else console.log(msg);\n',
            '    }\n',
            '    for (let [key, val] of Object.entries(userVars)) {\n',
            '      if (window[key] === undefined) {\n',
            '        window[key] = val;\n',
            '      } else {\n',
            '        window[key] = val; // системное свойство window (например, name/length) — перекрываем значением пользователя\n',
            '        glLog(\'verbose\', "Переменная "+key+" перекрыла одноимённое свойство window");\n',
            '      }\n',
            '    }\n',
            '\n',
            '    const FIELD_WIDTH = ', String(fieldWidth), ';\n',
            '    const FIELD_HEIGHT = ', String(fieldHeight), ';\n',
            '    const EDGE_MARGIN = 0;\n',
            '    const VERTEX_RADIUS = 7;\n',
            '    const HIT_THRESHOLD = 22;\n',
            '    const EDGE_HIT_THRESHOLD = 16;\n',
            '    const MIN_DIST = 1.0;\n',
            '    const FIGURE_HIT_PADDING = 30;\n',
            '\n',
            '    let width = 800, height = 500;\n',
            '    const camera = { zoom: ', String(cameraStartZoom), ', offsetX: ', String(cameraStartOffset[0]), ', offsetY: ', String(cameraStartOffset[1]), ', zoomMin: ', String(cameraZoomLimits[0]), ', zoomMax: ', String(cameraZoomLimits[1]), ' };\n',
            '    window.camera = camera;\n',
            '    window.autoRedraw = true;\n',
            '    window.collisionsEnabled = true;\n',
            '    window.snapEnabled = ', String(snapEnabled), ';\n',
            '    const SNAP_GRID_STEP = ', String(snapGridStep), ';\n',
            '    const SNAP_DISTANCE_PX = ', String(snapDistancePx), ';\n',
            '    window.coordinateSystem = \'cartesian\'; // \'cartesian\' | \'polar\' — влияет на вид сетки/осей (draw Function { grid=true })\n',

            '    let points = [];\n',
            '    let lines = [];\n',
            '    let drawFractals = [];\n',
            '    let drawFormulas = [];\n',
            '    let drawLoci = [];\n',
            '    let drawTraces = [];\n',
            '    let drawRegions = [];\n',
            '    let drawCharts = [];\n',
            '    let drawTrees = [];\n',
            '    let drawTables = [];\n',
            '    let drawComplexes = [];\n',
            '    let drawHyperbolics = [];\n',
            '    let drawBifurcations = [];\n',
            '    let drawCobwebs = [];\n',
            '    let drawIFSs = [];\n',
            '    let drawAutomata = [];\n',
            '    let drawVoronois = [];\n',
            '    let drawFouriers = [];\n',
            '    let drawDiagrams = [];\n',
            '    let figures = [];\n',
            '    let clusters = [];\n',
            '    let angles = [];\n',
            '    let drawAngles = [];\n',
            '    let drawEqually = [];\n',
            '    let drawVectors = [];\n',
            '    let drawInfLines = [];\n',
            '    let drawFillings = [];\n',
            '    let elapsedTime = 0;\n',
            '    let glStartTime = performance.now();\n',
            '    let fillingOffCanvas = null, fillingOffCtx = null;\n',
            '    let drawPunctirs = [];\n',
            '    let drawTexts = [];\n',
            '    let circles = [];\n',
            '    let arcs = [];\n',
            '    let ellipses = [];\n',
            '    let curves = [];\n',
            '    let drawFunctions = [];\n',
            '    let drawSurfaces = [];\n',
            '    let drawImages = [];\n',
            '    let drawHistograms = [];\n',
            '    let drawFields = [];\n',
            '    let drawTrajectories = [];\n',
            '    let drawGraphs = [];\n',
            '    let isDragging = false;\n',
            '    let draggedPointIndex = -1;\n',
            '\n',
            '    function isObjectActive(obj) {\n',
            '      if (!obj) return false;\n',
            '      for (let c of clusters) {\n',
            '        if (c.elements.includes(obj)) {\n',
            '          if (!c.active) return false;\n',
            '          break;\n',
            '        }\n',
            '      }\n',
            '      return obj.active !== undefined ? obj.active : true;\n',
            '    }\n',
            '\n',
            '    function isPointLocked(point) {\n',
            '      for (let a of angles) {\n',
            '        if (!a.lock) continue;\n',
            '        if (a.vertex === point) return true;\n',
            '        if (a.line1 && (a.line1.pA === point || a.line1.pB === point)) return true;\n',
            '        if (a.line2 && (a.line2.pA === point || a.line2.pB === point)) return true;\n',
            '      }\n',
            '      return false;\n',
            '    }\n',
            '\n',
            '    function getLockedAngleForPoint(point) {\n',
            '      for (let a of angles) {\n',
            '        if (!a.lock) continue;\n',
            '        if (a.vertex === point) return a;\n',
            '        if (a.line1 && (a.line1.pA === point || a.line1.pB === point)) return a;\n',
            '        if (a.line2 && (a.line2.pA === point || a.line2.pB === point)) return a;\n',
            '      }\n',
            '      return null;\n',
            '    }\n',
            '\n',
            '    function getLockedAngleForLine(line) {\n',
            '      for (let a of angles) {\n',
            '        if (!a.lock) continue;\n',
            '        if (a.line1 === line || a.line2 === line) return a;\n',
            '      }\n',
            '      return null;\n',
            '    }\n',
            '\n',
            '    function moveLockedAngle(angle, dx, dy, mode, line) {\n',
            '      const vertex = angle.vertex;\n',
            '      const p1 = (angle.line1.pA === vertex) ? angle.line1.pB : angle.line1.pA;\n',
            '      const p2 = (angle.line2.pA === vertex) ? angle.line2.pB : angle.line2.pA;\n',
            '      const oldV = {x: vertex.pos.x, y: vertex.pos.y};\n',
            '      const oldP1 = {x: p1.pos.x, y: p1.pos.y};\n',
            '      const oldP2 = {x: p2.pos.x, y: p2.pos.y};\n',
            '      if (mode === \'free\') {\n',
            '        vertex.pos.x += dx;\n',
            '        vertex.pos.y += dy;\n',
            '        p1.pos.x += dx;\n',
            '        p1.pos.y += dy;\n',
            '        p2.pos.x += dx;\n',
            '        p2.pos.y += dy;\n',
            '      } else if (mode === \'line\' && line) {\n',
            '        const dirX = line.pB.pos.x - line.pA.pos.x;\n',
            '        const dirY = line.pB.pos.y - line.pA.pos.y;\n',
            '        const len = Math.hypot(dirX, dirY);\n',
            '        if (len < 0.001) return false;\n',
            '        const normX = -dirY / len;\n',
            '        const normY = dirX / len;\n',
            '        const proj = dx * normX + dy * normY;\n',
            '        const moveX = proj * normX;\n',
            '        const moveY = proj * normY;\n',
            '        vertex.pos.x += moveX;\n',
            '        vertex.pos.y += moveY;\n',
            '        p1.pos.x += moveX;\n',
            '        p1.pos.y += moveY;\n',
            '        p2.pos.x += moveX;\n',
            '        p2.pos.y += moveY;\n',
            '      } else if (mode === \'pointOnSide\') {\n',
            '        return false;\n',
            '      }\n',
            '      clampFieldPoint(vertex.pos);\n',
            '      clampFieldPoint(p1.pos);\n',
            '      clampFieldPoint(p2.pos);\n',
            '      const pointsToCheck = [vertex, p1, p2];\n',
            '      let collision = false;\n',
            '      for (let i = 0; i < points.length; i++) {\n',
            '        if (pointsToCheck.includes(points[i])) continue;\n',
            '        for (let pt of pointsToCheck) {\n',
            '          if (distance(pt.pos, points[i].pos) < MIN_DIST) {\n',
            '            collision = true;\n',
            '            break;\n',
            '          }\n',
            '        }\n',
            '        if (collision) break;\n',
            '      }\n',
            '      if (!collision) {\n',
            '        if (distance(p1.pos, vertex.pos) < MIN_DIST || distance(p2.pos, vertex.pos) < MIN_DIST || distance(p1.pos, p2.pos) < MIN_DIST) {\n',
            '          collision = true;\n',
            '        }\n',
            '      }\n',
            '      if (collision) {\n',
            '        vertex.pos.x = oldV.x;\n',
            '        vertex.pos.y = oldV.y;\n',
            '        p1.pos.x = oldP1.x;\n',
            '        p1.pos.y = oldP1.y;\n',
            '        p2.pos.x = oldP2.x;\n',
            '        p2.pos.y = oldP2.y;\n',
            '        return false;\n',
            '      }\n',
            '      const idx1 = points.indexOf(p1);\n',
            '      const idx2 = points.indexOf(p2);\n',
            '      const idxV = points.indexOf(vertex);\n',
            '      if (idx1 !== -1) updateFiguresForPoint(idx1);\n',
            '      if (idx1 !== -1) updateClustersForPoint(idx1);\n',
            '      if (idx2 !== -1) updateFiguresForPoint(idx2);\n',
            '      if (idx2 !== -1) updateClustersForPoint(idx2);\n',
            '      if (idxV !== -1) updateFiguresForPoint(idxV);\n',
            '      if (idxV !== -1) updateClustersForPoint(idxV);\n',
            '      return true;\n',
            '    }\n',
            '\n',
            '    function updatePointsOnLinesAndCircles() {\n',
            '      for (let p of points) {\n',
            '        if (p.lineName) {\n',
            '          const line = lines.find(l => l.name === p.lineName);\n',
            '          if (!line) continue;\n',
            '          const pA = line.pA.pos;\n',
            '          const pB = line.pB.pos;\n',
            '          const t = p.extend ? p.t : Math.min(1, Math.max(0, p.t));\n',
            '          p.pos.x = pA.x + (pB.x - pA.x) * t;\n',
            '          p.pos.y = pA.y + (pB.y - pA.y) * t;\n',
            '        } else if (p.circleName) {\n',
            '          const circle = circles.find(c => c.name === p.circleName);\n',
            '          if (!circle) continue;\n',
            '          const angle = p.t * 2 * Math.PI;\n',
            '          p.pos.x = circle.center.x + circle.radius * Math.cos(angle);\n',
            '          p.pos.y = circle.center.y + circle.radius * Math.sin(angle);\n',
            '        } else if (p.graphName) {\n',
            '          const g = drawFunctions.find(d => d.name === p.graphName);\n',
            '          if (!g || !GL_USER_FUNCS[g.funcName]) continue;\n',
            '          const gx = g.xmin + (g.xmax - g.xmin) * Math.min(1, Math.max(0, p.t));\n',
            '          let gy;\n',
            '          try { gy = glCallUserFunc(g.funcName, [gx]); } catch (e) { gy = NaN; }\n',
            '          if (typeof gy === \'number\' && isFinite(gy)) { p.pos.x = gx; p.pos.y = gy; }\n',
            '        } else if (p.ellipseName) {\n',
            '          const ellipse = ellipses.find(e => e.name === p.ellipseName);\n',
            '          if (!ellipse || !ellipse.centerPoint) continue;\n',
            '          const cx = ellipse.centerPoint.pos.x, cy = ellipse.centerPoint.pos.y;\n',
            '          const rotRad = (ellipse.rotate || 0) * Math.PI / 180;\n',
            '          const cs = Math.cos(rotRad), sn = Math.sin(rotRad);\n',
            '          let lx, ly;\n',
            '          if (p.axis === \'a\') { lx = ellipse.a; ly = 0; }\n',
            '          else if (p.axis === \'b\') { lx = 0; ly = ellipse.b; }\n',
            '          else { const ang = p.t * 2 * Math.PI; lx = ellipse.a * Math.cos(ang); ly = ellipse.b * Math.sin(ang); }\n',
            '          p.pos.x = cx + lx * cs - ly * sn;\n',
            '          p.pos.y = cy + lx * sn + ly * cs;\n',
            '        } else if (p.curveName) {\n',
            '          const curve = curves.find(c => c.name === p.curveName);\n',
            '          if (!curve) continue;\n',
            '          const cp = curvePointAt(curve, p.t);\n',
            '          if (cp) { p.pos.x = cp.x; p.pos.y = cp.y; }\n',
            '        } else if (p.arcName) {\n',
            '          const arc = arcs.find(a => a.name === p.arcName);\n',
            '          if (!arc || !arc.centerPoint) continue;\n',
            '          const radius = arc.type === \'ThreePoints\' ? arc.radius : (arc.radiusNum !== null ? arc.radiusNum : (arc.radiusPoint ? Math.hypot(arc.radiusPoint.pos.x - arc.centerPoint.pos.x, arc.radiusPoint.pos.y - arc.centerPoint.pos.y) : 0));\n',
            '          if (!(radius > 0)) continue;\n',
            '          const centerPix = fieldToPixel(arc.centerPoint.pos.x, arc.centerPoint.pos.y);\n',
            '          const rPix = radius * fieldScale();\n',
            '          const p1x = fieldToPixel(arc.fromPoint.pos.x, arc.fromPoint.pos.y);\n',
            '          const p2x = fieldToPixel(arc.toPoint.pos.x, arc.toPoint.pos.y);\n',
            '          const ang1 = Math.atan2(p1x.y - centerPix.y, p1x.x - centerPix.x);\n',
            '          const ang2 = Math.atan2(p2x.y - centerPix.y, p2x.x - centerPix.x);\n',
            '          const TAU = Math.PI * 2;\n',
            '          const norm = (x) => ((x % TAU) + TAU) % TAU;\n',
            '          const sweep = norm(ang2 - ang1);\n',
            '          let anticw = false;\n',
            '          if (arc.type === \'ThreePoints\' && arc.midPoint) {\n',
            '            const pm = fieldToPixel(arc.midPoint.pos.x, arc.midPoint.pos.y);\n',
            '            const angM = Math.atan2(pm.y - centerPix.y, pm.x - centerPix.x);\n',
            '            if (norm(angM - ang1) > sweep) anticw = true;\n',
            '          }\n',
            '          const effSweep = anticw ? -(TAU - sweep) : sweep;\n',
            '          const ang = ang1 + effSweep * p.t;\n',
            '          const px = centerPix.x + rPix * Math.cos(ang), py = centerPix.y + rPix * Math.sin(ang);\n',
            '          const fp = pixelToField(px, py);\n',
            '          p.pos.x = fp.x; p.pos.y = fp.y;\n',
            '        } else if (p.transform) {\n',
            '          let srcPos = null;\n',
            '          if (p.transformSourceLine) {\n',
            '            const srcLine = lines.find(l => l.name === p.transformSourceLine);\n',
            '            if (srcLine) srcPos = p.transformSourceEnd === \'B\' ? srcLine.pB.pos : srcLine.pA.pos;\n',
            '          } else {\n',
            '            const src = points.find(pp => pp.name === p.transformSource);\n',
            '            if (src) srcPos = src.pos;\n',
            '          }\n',
            '          if (!srcPos) continue;\n',
            '          if (p.transform === \'reflect\') {\n',
            '            const overLine = lines.find(l => l.name === p.transformOver);\n',
            '            if (overLine) {\n',
            '              const A = overLine.pA.pos, B = overLine.pB.pos;\n',
            '              const dx = B.x - A.x, dy = B.y - A.y;\n',
            '              const len2 = dx * dx + dy * dy;\n',
            '              const apx = srcPos.x - A.x, apy = srcPos.y - A.y;\n',
            '              const tt = len2 < 1e-12 ? 0 : (apx * dx + apy * dy) / len2;\n',
            '              const projx = A.x + dx * tt, projy = A.y + dy * tt;\n',
            '              p.pos.x = 2 * projx - srcPos.x;\n',
            '              p.pos.y = 2 * projy - srcPos.y;\n',
            '            } else {\n',
            '              const overPoint = points.find(pp => pp.name === p.transformOver);\n',
            '              if (overPoint) {\n',
            '                p.pos.x = 2 * overPoint.pos.x - srcPos.x;\n',
            '                p.pos.y = 2 * overPoint.pos.y - srcPos.y;\n',
            '              }\n',
            '            }\n',
            '          } else if (p.transform === \'rotate\') {\n',
            '            const around = points.find(pp => pp.name === p.transformAround);\n',
            '            if (around) {\n',
            '              const angleDeg = evaluate(p.transformExpr);\n',
            '              const rad = (typeof angleDeg === \'number\' ? angleDeg : 0) * Math.PI / 180;\n',
            '              const cs = Math.cos(rad), sn = Math.sin(rad);\n',
            '              const rx = srcPos.x - around.pos.x, ry = srcPos.y - around.pos.y;\n',
            '              p.pos.x = around.pos.x + rx * cs - ry * sn;\n',
            '              p.pos.y = around.pos.y + rx * sn + ry * cs;\n',
            '            }\n',
            '          } else if (p.transform === \'homothety\') {\n',
            '            const center = points.find(pp => pp.name === p.transformCenter);\n',
            '            if (center) {\n',
            '              const ratioVal = evaluate(p.transformExpr);\n',
            '              const k = typeof ratioVal === \'number\' ? ratioVal : 1;\n',
            '              let ky = k;\n',
            '              if (p.transformExprY) { const ratioValY = evaluate(p.transformExprY); if (typeof ratioValY === \'number\') ky = ratioValY; }\n',
            '              p.pos.x = center.pos.x + k * (srcPos.x - center.pos.x);\n',
            '              p.pos.y = center.pos.y + ky * (srcPos.y - center.pos.y);\n',
            '            }\n',
            '          } else if (p.transform === \'translate\') {\n',
            '            const dxVal = evaluate(p.transformDx);\n',
            '            const dyVal = evaluate(p.transformDy);\n',
            '            p.pos.x = srcPos.x + (typeof dxVal === \'number\' ? dxVal : 0);\n',
            '            p.pos.y = srcPos.y + (typeof dyVal === \'number\' ? dyVal : 0);\n',
            '          }\n',
            '        } else if (p.construct) {\n',
            '          const vertex = points.find(pp => pp.name === p.vertex);\n',
            '          const base = lines.find(l => l.name === p.base);\n',
            '          if (!vertex || !base) continue;\n',
            '          const A = vertex.pos, B = base.pA.pos, C = base.pB.pos;\n',
            '          if (p.construct === \'median\') {\n',
            '            p.pos.x = (B.x + C.x) / 2; p.pos.y = (B.y + C.y) / 2;\n',
            '          } else if (p.construct === \'altitude\') {\n',
            '            const dx = C.x - B.x, dy = C.y - B.y;\n',
            '            const len2 = dx * dx + dy * dy;\n',
            '            const tt = len2 < 1e-12 ? 0 : ((A.x - B.x) * dx + (A.y - B.y) * dy) / len2;\n',
            '            p.pos.x = B.x + dx * tt; p.pos.y = B.y + dy * tt;\n',
            '          } else if (p.construct === \'bisector\') {\n',
            '            const ab = Math.hypot(A.x - B.x, A.y - B.y);\n',
            '            const ac = Math.hypot(A.x - C.x, A.y - C.y);\n',
            '            const sum = ab + ac;\n',
            '            const tt = sum < 1e-12 ? 0.5 : ab / sum;\n',
            '            p.pos.x = B.x + (C.x - B.x) * tt; p.pos.y = B.y + (C.y - B.y) * tt;\n',
            '          }\n',
            '        }\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function updateCircles() {\n',
            '      for (let c of circles) {\n',
            '        if (c.type === \'FromRadius\') {\n',
            '          const centerPoint = points.find(p => p.name === c._centerName);\n',
            '          if (!centerPoint) continue;\n',
            '          let radiusVal = c._radius;\n',
            '          if (typeof radiusVal === \'string\') {\n',
            '            const radiusPoint = points.find(p => p.name === radiusVal);\n',
            '            if (radiusPoint) {\n',
            '              radiusVal = Math.hypot(radiusPoint.pos.x - centerPoint.pos.x, radiusPoint.pos.y - centerPoint.pos.y);\n',
            '            } else {\n',
            '              radiusVal = 1;\n',
            '            }\n',
            '          } else if (typeof radiusVal !== \'number\') {\n',
            '            radiusVal = 1;\n',
            '          }\n',
            '          c.center = { x: centerPoint.pos.x, y: centerPoint.pos.y };\n',
            '          c.radius = radiusVal;\n',
            '        } else if (c.type === \'FromPoints\') {\n',
            '          const pts = c._pointNames.map(name => points.find(p => p.name === name)).filter(p => p !== undefined);\n',
            '          if (pts.length !== 3) continue;\n',
            '          const [p1, p2, p3] = pts;\n',
            '          const ax = p1.pos.x, ay = p1.pos.y;\n',
            '          const bx = p2.pos.x, by = p2.pos.y;\n',
            '          const cx = p3.pos.x, cy = p3.pos.y;\n',
            '          const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));\n',
            '          if (Math.abs(d) < 1e-10) continue;\n',
            '          const ux = ((ax*ax + ay*ay) * (by - cy) + (bx*bx + by*by) * (cy - ay) + (cx*cx + cy*cy) * (ay - by)) / d;\n',
            '          const uy = ((ax*ax + ay*ay) * (cx - bx) + (bx*bx + by*by) * (ax - cx) + (cx*cx + cy*cy) * (bx - ax)) / d;\n',
            '          c.center = { x: ux, y: uy };\n',
            '          c.radius = Math.hypot(ux - ax, uy - ay);\n',
            '        }\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function updateScene() {\n',
            '      markSceneChanged();\n',
            '      if (!glLocusSweeping) updateTraces();\n',
            '      updateCircles();\n',
            '      updateEllipses();\n',
            '      updateArcs();\n',
            '      updatePointsOnLinesAndCircles();\n',
            '      for (let a of angles) { computeAngleMeasure(a); }\n',
            '    }\n',
            '\n',
            '    // ----- ИНИЦИАЛИЗАЦИЯ -----\n',
            '    function initPoints() {\n',
            '      points = pointsData.map(p => {\n',
            '        const obj = { ...p, px: 0, py: 0, lineName: p.line || null, circleName: p.circle || null, ellipseName: p.ellipse || null, curveName: p.curve || null, arcName: p.arc || null, graphName: p.graph || null, t: (typeof p.t === \'number\' ? p.t : 0.5) };\n',
            '        if (obj.lineName || obj.circleName || obj.ellipseName || obj.curveName || obj.arcName || obj.graphName) {\n',
            '          obj.pos = { x: 0, y: 0 };\n',
            '        }\n',
            '        return obj;\n',
            '      });\n',
            '    }\n',
            '\n',
            '    function initLines() {\n',
            '      lines = linesData.map(l => {\n',
            '        let pA = points.find(p => p.name === l.pointA);\n',
            '        let pB = points.find(p => p.name === l.pointB);\n',
            '        if (!pA || !pB) return null;\n',

            '        const lineObj = { ...l, pA, pB };\n',
            '        Object.defineProperty(lineObj, \'length\', {\n',
            '          get: function() {\n',
            '            return Math.hypot(this.pB.pos.x - this.pA.pos.x, this.pB.pos.y - this.pA.pos.y);\n',
            '          },\n',
            '          enumerable: true,\n',
            '          configurable: true\n',
            '        });\n',
            '        Object.defineProperty(lineObj, \'midpoint\', {\n',
            '          get: function() {\n',
            '            return { x: (this.pA.pos.x + this.pB.pos.x) / 2, y: (this.pA.pos.y + this.pB.pos.y) / 2 };\n',
            '          },\n',
            '          enumerable: true,\n',
            '          configurable: true\n',
            '        });\n',
            '        return lineObj;\n',
            '      }).filter(l => l !== null);\n',
            '    }\n',
            '\n',
            '    function initCircles() {\n',
            '      circles = circlesData.map(c => {\n',
            '        const obj = { ...c };\n',
            '        obj._centerName = c.centerName || null;\n',
            '        obj._radius = c.radius || null;\n',
            '        obj._pointNames = c.pointNames || null;\n',
            '        obj.center = { x: 0, y: 0 };\n',
            '        obj.radius = 0;\n',
            '        Object.defineProperty(obj, \'circumference\', { get: function() { return 2 * Math.PI * this.radius; }, enumerable: true, configurable: true });\n',
            '        Object.defineProperty(obj, \'area\', { get: function() { return Math.PI * this.radius * this.radius; }, enumerable: true, configurable: true });\n',
            '        return obj;\n',
            '      }).filter(c => c !== null);\n',
            '    }\n',
            '\n',
            '    function initArcs() {\n',
            '      arcs = arcsData.map(a => {\n',
            '        if (a.type === \'ThreePoints\') {\n',
            '          const pts = a.pointNames.map(n => points.find(p => p.name === n)).filter(p => p !== undefined);\n',
            '          if (pts.length !== 3) return null;\n',
            '          return {\n',
            '            name: a.name, type: \'ThreePoints\',\n',
            '            fromPoint: pts[0], midPoint: pts[1], toPoint: pts[2],\n',
            '            centerPoint: { pos: { x: 0, y: 0 } }, radius: 0,\n',
            '            color: a.color || __gcDefaultColor(), thickness: a.thickness || 2,\n',
            '            active: a.active !== false,\n',
            '            layer: (a.layer !== undefined && a.layer !== null) ? a.layer : 20,\n',
            '            collision: a.collision || false, collisionGroup: a.collisionGroup || 0, collisionMask: a.collisionMask || null, collisionMargin: a.collisionMargin || 0,\n',
            '            collideWithPoints: a.collideWithPoints || false, collideWithLines: a.collideWithLines || false, collideWithCurves: a.collideWithCurves || false,\n',
            '            collideWithCircles: a.collideWithCircles || false, collideWithEllipses: a.collideWithEllipses || false, collideWithArcs: a.collideWithArcs || false,\n',
            '            collideWithFigures: a.collideWithFigures || false, collideWithBoundary: a.collideWithBoundary || false,\n',
            '          };\n',
            '        }\n',
            '        const centerPoint = points.find(p => p.name === a.centerName);\n',
            '        const fromPoint = points.find(p => p.name === a.from);\n',
            '        const toPoint = points.find(p => p.name === a.to);\n',
            '        if (!centerPoint || !fromPoint || !toPoint) return null;\n',
            '        let radiusNum = null, radiusPoint = null;\n',
            '        if (typeof a.radius === \'number\') radiusNum = a.radius;\n',
            '        else radiusPoint = points.find(p => p.name === a.radius);\n',
            '        return {\n',
            '          name: a.name, type: \'CenterRadius\', centerPoint, fromPoint, toPoint, radiusNum, radiusPoint,\n',
            '          color: a.color || __gcDefaultColor(), thickness: a.thickness || 2,\n',
            '          active: a.active !== false,\n',
            '          layer: (a.layer !== undefined && a.layer !== null) ? a.layer : 20,\n',
            '          collision: a.collision || false, collisionGroup: a.collisionGroup || 0, collisionMask: a.collisionMask || null, collisionMargin: a.collisionMargin || 0,\n',
            '          collideWithPoints: a.collideWithPoints || false, collideWithLines: a.collideWithLines || false, collideWithCurves: a.collideWithCurves || false,\n',
            '          collideWithCircles: a.collideWithCircles || false, collideWithEllipses: a.collideWithEllipses || false, collideWithArcs: a.collideWithArcs || false,\n',
            '          collideWithFigures: a.collideWithFigures || false, collideWithBoundary: a.collideWithBoundary || false,\n',
            '        };\n',
            '      }).filter(a => a !== null);\n',
            '    }\n',
            '\n',
            '    function updateArcs() {\n',
            '      for (let a of arcs) {\n',
            '        if (a.type === \'ThreePoints\') {\n',
            '          const cc = glCircumcircle(a.fromPoint.pos, a.midPoint.pos, a.toPoint.pos);\n',
            '          if (cc) { a.centerPoint.pos.x = cc.cx; a.centerPoint.pos.y = cc.cy; a.radius = cc.r; }\n',
            '          // если три точки почти на одной прямой — оставляем предыдущий радиус/центр, не дёргаем картинку\n',
            '        }\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function initEllipses() {\n',
            '      ellipses = ellipsesData.map(e => {\n',
            '        const common = {\n',
            '          name: e.name, type: e.type,\n',
            '          color: e.color || __gcDefaultColor(), thickness: e.thickness || 2,\n',
            '          active: e.active !== false, dynamic: e.dynamic || false,\n',
            '          layer: (e.layer !== undefined && e.layer !== null) ? e.layer : 20,\n',
            '          collision: e.collision || false, collisionGroup: e.collisionGroup || 0, collisionMask: e.collisionMask || null, collisionMargin: e.collisionMargin || 0,\n',
            '          collideWithPoints: e.collideWithPoints || false, collideWithLines: e.collideWithLines || false, collideWithCurves: e.collideWithCurves || false,\n',
            '          collideWithCircles: e.collideWithCircles || false, collideWithEllipses: e.collideWithEllipses || false, collideWithArcs: e.collideWithArcs || false,\n',
            '          collideWithFigures: e.collideWithFigures || false, collideWithBoundary: e.collideWithBoundary || false,\n',
            '        };\n',
            '        if (e.type === \'FromPoints\') {\n',
            '          const fitPoints = e.pointNames.map(n => points.find(p => p.name === n)).filter(p => p !== undefined);\n',
            '          if (fitPoints.length !== 5) return null;\n',
            '          const obj = { ...common, fitPoints, centerPoint: { pos: { x: 0, y: 0 } }, a: 1, b: 1, rotate: 0 };\n',
            '          Object.defineProperty(obj, \'area\', { get: function() { return Math.PI * this.a * this.b; }, enumerable: true, configurable: true });\n',
            '          return obj;\n',
            '        }\n',
            '        if (e.type === \'ByFoci\') {\n',
            '          const focus1Point = points.find(p => p.name === e.focus1);\n',
            '          const focus2Point = points.find(p => p.name === e.focus2);\n',
            '          if (!focus1Point || !focus2Point) return null;\n',
            '          const obj = { ...common, focus1Point, focus2Point, aExpr: e.aExpr, centerPoint: { pos: { x: 0, y: 0 } }, a: 1, b: 1, rotate: 0 };\n',
            '          Object.defineProperty(obj, \'area\', { get: function() { return Math.PI * this.a * this.b; }, enumerable: true, configurable: true });\n',
            '          return obj;\n',
            '        }\n',
            '        const centerPoint = points.find(p => p.name === e.centerName);\n',
            '        if (!centerPoint) return null;\n',
            '        if (e.dynamic) centerPoint.dynamic = true;\n',
            '        const obj = { ...common, centerPoint, aExpr: e.aExpr, bExpr: e.bExpr, a: 1, b: 1, rotate: e.rotate || 0 };\n',
            '        Object.defineProperty(obj, \'area\', { get: function() { return Math.PI * this.a * this.b; }, enumerable: true, configurable: true });\n',
            '        return obj;\n',
            '      }).filter(e => e !== null);\n',
            '    }\n',
            '\n',
            '    function updateEllipses() {\n',
            '      for (let e of ellipses) {\n',
            '        if (e.type === \'FromPoints\') {\n',
            '          const fit = glFitEllipse5(e.fitPoints.map(p => p.pos));\n',
            '          if (fit) {\n',
            '            e.centerPoint.pos.x = fit.cx; e.centerPoint.pos.y = fit.cy;\n',
            '            e.a = fit.a; e.b = fit.b; e.rotate = fit.rotateDeg;\n',
            '          }\n',
            '          // если 5 точек не образуют эллипс (вырождение/гипербола) — оставляем предыдущие параметры\n',
            '        } else if (e.type === \'ByFoci\') {\n',
            '          const f1 = e.focus1Point.pos, f2 = e.focus2Point.pos;\n',
            '          const c = Math.hypot(f2.x - f1.x, f2.y - f1.y) / 2;\n',
            '          const aVal = evaluate(e.aExpr);\n',
            '          const a = (typeof aVal === \'number\' && !isNaN(aVal)) ? aVal : e.a;\n',
            '          const bSq = a * a - c * c;\n',
            '          e.centerPoint.pos.x = (f1.x + f2.x) / 2; e.centerPoint.pos.y = (f1.y + f2.y) / 2;\n',
            '          e.a = a; e.b = bSq > 0 ? Math.sqrt(bSq) : 0;\n',
            '          e.rotate = Math.atan2(f2.y - f1.y, f2.x - f1.x) * 180 / Math.PI;\n',
            '        } else {\n',
            '          const aVal = evaluate(e.aExpr);\n',
            '          const bVal = evaluate(e.bExpr);\n',
            '          if (typeof aVal === \'number\' && !isNaN(aVal)) e.a = aVal;\n',
            '          if (typeof bVal === \'number\' && !isNaN(bVal)) e.b = bVal;\n',
            '        }\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function initCurves() {\n',
            '      curves = curvesData.map(cv => {\n',
            '        let controlPoints = null;\n',
            '        let centerPoint = null;\n',
            '        if (cv.type === \'bezier\') {\n',
            '          controlPoints = cv.controlPoints.map(name => points.find(p => p.name === name)).filter(p => p !== undefined);\n',
            '          if (controlPoints.length < 2) return null;\n',
            '        } else if (cv.type === \'spiral\' || cv.type === \'cycloid\' || cv.type === \'involute\') {\n',
            '          centerPoint = points.find(p => p.name === cv.centerName);\n',
            '          if (!centerPoint) return null;\n',
            '        }\n',
            '        return {\n',
            '          name: cv.name, type: cv.type, controlPoints, centerPoint,\n',
            '          xExpr: cv.xExpr, yExpr: cv.yExpr,\n',
            '          a: cv.a, b: cv.b, radius: cv.radius, turns: (cv.turns === undefined || cv.turns === null) ? 3 : cv.turns,\n',
            '          segments: cv.segments || 50,\n',
            '          color: cv.color || __gcDefaultColor(), thickness: cv.thickness || 2,\n',
            '          active: cv.active !== false,\n',
            '          layer: (cv.layer !== undefined && cv.layer !== null) ? cv.layer : 20,\n',
            '          collision: cv.collision || false, collisionGroup: cv.collisionGroup || 0, collisionMask: cv.collisionMask || null, collisionMargin: cv.collisionMargin || 0,\n',
            '          collideWithPoints: cv.collideWithPoints || false, collideWithLines: cv.collideWithLines || false, collideWithCurves: cv.collideWithCurves || false,\n',
            '          collideWithCircles: cv.collideWithCircles || false, collideWithEllipses: cv.collideWithEllipses || false, collideWithArcs: cv.collideWithArcs || false,\n',
            '          collideWithFigures: cv.collideWithFigures || false, collideWithBoundary: cv.collideWithBoundary || false,\n',
            '        };\n',
            '      }).filter(cv => cv !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawFunctions() {\n',
            '      drawFunctions = drawFunctionsData.map(d => ({\n',
            '        name: d.name, funcName: d.funcName,\n',
            '        xmin: d.xmin, xmax: d.xmax, segments: Math.max(2, d.segments || 100),\n',
            '        color: d.color || __gcDefaultColor(), thickness: d.thickness || 2,\n',
            '        grid: d.grid || false, gridStep: d.gridStep || 1,\n',
            '        active: d.active !== false,\n',
            '        layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 20,\n',
            '      }));\n',
            '    }\n',
            '\n',
            '    function initDrawSurfaces() {\n',
            '      drawSurfaces = drawSurfacesData.map(d => ({\n',
            '        name: d.name, funcName: d.funcName,\n',
            '        xmin: d.xmin, xmax: d.xmax, ymin: d.ymin, ymax: d.ymax, grid: Math.max(2, d.grid || 20),\n',
            '        mode: d.mode || \'contour\', color: d.color || __gcDefaultColor(), angle: (d.angle === undefined || d.angle === null) ? 30 : d.angle,\n',
            '        active: d.active !== false,\n',
            '        layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 20,\n',
            '      }));\n',
            '    }\n',
            '\n',
            '    function initDrawImages() {\n',
            '      drawImages = drawImagesData.map(d => {\n',
            '        const posPoint = points.find(p => p.name === d.posName);\n',
            '        if (!posPoint) return null;\n',
            '        const obj = {\n',
            '          name: d.name, posPoint, src: d.src,\n',
            '          width: d.width || 5, height: d.height || 5, opacity: (d.opacity === undefined || d.opacity === null) ? 1 : d.opacity,\n',
            '          active: d.active !== false,\n',
            '          layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 15,\n',
            '          img: null, loaded: false, dirty: true,\n',
            '        };\n',
            '        const imgEl = new Image();\n',
            '        imgEl.onload = function() { obj.loaded = true; markDirty(obj); markSceneChanged(); draw(); };\n',
            '        imgEl.onerror = function() { glLog(\'warn\', \'Не удалось загрузить изображение: \' + d.src); };\n',
            '        imgEl.src = d.src;\n',
            '        obj.img = imgEl;\n',
            '        return obj;\n',
            '      }).filter(d => d !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawHistograms() {\n',
            '      drawHistograms = drawHistogramsData.map(d => ({\n',
            '        name: d.name, dataExpr: d.dataExpr, bins: Math.max(1, d.bins || 10),\n',
            '        color: d.color || \'#4a90d9\', active: d.active !== false,\n',
            '        layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 20,\n',
            '      }));\n',
            '    }\n',
            '\n',
            '    function initDrawFields() {\n',
            '      drawFields = drawFieldsData.map(d => ({ ...d }));\n',
            '    }\n',
            '\n',
            '    function initDrawTrajectories() {\n',
            '      drawTrajectories = drawTrajectoriesData.map(d => {\n',
            '        let field = null;\n',
            '        if (d.fieldName) { field = drawFields.find(f => f.name === d.fieldName); if (!field) return null; }\n',
            '        return { ...d, field };\n',
            '      }).filter(d => d !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawGraphs() {\n',
            '      drawGraphs = drawGraphsData.map(d => ({ ...d }));\n',
            '    }\n',
            '\n',
            '    function initDrawLoci() {\n',
            '      drawLoci = drawLociData.map(d => ({ ...d, _pts: null, _key: null }));\n',
            '      drawTraces = drawTracesData.map(d => ({ ...d, _pts: [] }));\n',
            '      drawRegions = drawRegionsData.map(d => ({ ...d, _cache: null, _cacheKey: null }));\n',
            '      drawCharts = drawChartsData.map(d => ({ ...d }));\n',
            '      drawTrees = drawTreesData.map(d => ({ ...d }));\n',
            '      drawTables = drawTablesData.map(d => ({ ...d }));\n',
            '      drawComplexes = drawComplexesData.map(d => ({ ...d, _cache: null, _cacheKey: null }));\n',
            '      drawHyperbolics = drawHyperbolicsData.map(d => ({ ...d, _tiles: null, _tileKey: null }));\n',
            '      drawBifurcations = drawBifurcationsData.map(d => ({ ...d, _cache: null, _cacheKey: null, _grid: null }));\n',
            '      drawCobwebs = drawCobwebsData.map(d => ({ ...d, _cache: null, _cacheKey: null, _grid: null }));\n',
            '      drawIFSs = drawIFSsData.map(d => ({ ...d, _cache: null, _cacheKey: null, _grid: null }));\n',
            '      drawAutomata = drawAutomataData.map(d => ({ ...d, _cache: null, _cacheKey: null, _grid: null }));\n',
            '      drawVoronois = drawVoronoisData.map(d => ({ ...d, _cache: null, _cacheKey: null, _grid: null }));\n',
            '      drawFouriers = drawFouriersData.map(d => ({ ...d, _cache: null, _cacheKey: null, _grid: null }));\n',
            '      drawDiagrams = drawDiagramsData.map(d => ({ ...d, _cache: null, _cacheKey: null, _grid: null }));\n',
            '    }\n',
            '\n',
            '    function initDrawFractals() {\n',
            '      drawFractals = drawFractalsData.map(d => ({ ...d, _cache: null, _cacheKey: \'\' }));\n',
            '    }\n',
            '\n',
            '    function initFigures() {\n',
            '      figures = figuresData.map(f => {\n',
            '        const pts = f.elements.map(name => points.find(p => p.name === name)).filter(p => p !== undefined);\n',
            '        const filtered = pts.filter(p => !p.lineName && !p.circleName && !p.ellipseName && !p.curveName && !p.arcName && !p.graphName && !p.construct && !p.transform);\n',
            '        if (filtered.length === 0) return null;\n',
            '        let cx = 0, cy = 0;\n',
            '        for (let p of filtered) { cx += p.pos.x; cy += p.pos.y; }\n',
            '        cx /= filtered.length; cy /= filtered.length;\n',
            '        const relVectors = filtered.map(p => ({ x: p.pos.x - cx, y: p.pos.y - cy }));\n',
            '        return {\n',
            '          name: f.name,\n',
            '          elements: f.elements,\n',
            '          points: filtered,\n',
            '          relVectors: relVectors,\n',
            '          center: { x: cx, y: cy },\n',
            '          rotate: f.rotate || 0,\n',
            '          size: f.size || 1,\n',
            '          sizeX: f.sizeX,\n',
            '          sizeY: f.sizeY,\n',
            '          flipX: f.flipX || false,\n',
            '          flipY: f.flipY || false,\n',
            '          interact: f.interact !== undefined ? f.interact : true,\n',
            '          active: f.active !== undefined ? f.active : true,\n',
            '          collision: f.collision || false, collisionGroup: f.collisionGroup || 0, collisionMask: f.collisionMask || null, collisionMargin: f.collisionMargin || 0,\n',
            '          collideWithPoints: f.collideWithPoints || false, collideWithLines: f.collideWithLines || false, collideWithCurves: f.collideWithCurves || false,\n',
            '          collideWithCircles: f.collideWithCircles || false, collideWithEllipses: f.collideWithEllipses || false, collideWithArcs: f.collideWithArcs || false,\n',
            '          collideWithFigures: f.collideWithFigures || false, collideWithClusters: f.collideWithClusters || false, collideWithBoundary: f.collideWithBoundary || false,\n',
            '        };\n',
            '      }).filter(f => f !== null);\n',
            '      for (let f of figures) { applyFigureTransform(f); }\n',
            '    }\n',
            '\n',
            '    // ---- Жёсткая трансформация составных тел (кластеров) ----\n',
            '    // "Независимая" точка — та, что не вычисляется из другой геометрии\n',
            '    // (не сидит на линии/окружности/эллипсе/кривой/дуге/графике и не является\n',
            '    // результатом construct/transform). Именно такие точки двигает жёсткое тело.\n',
            '    function isRigidPoint(p) {\n',
            '      return !!p && !!p.pos && !p.lineName && !p.circleName && !p.ellipseName &&\n',
            '             !p.curveName && !p.arcName && !p.graphName && !p.construct && !p.transform;\n',
            '    }\n',
            '    function collectClusterRigidPoints(elements) {\n',
            '      const result = [];\n',
            '      const seen = new Set();\n',
            '      function add(p) { if (isRigidPoint(p) && !seen.has(p)) { seen.add(p); result.push(p); } }\n',
            '      for (let el of elements) {\n',
            '        if (!el) continue;\n',
            '        if (el.pA !== undefined && el.pB !== undefined) { add(el.pA); add(el.pB); }\n',
            '        else if (Array.isArray(el.points)) { el.points.forEach(add); }\n',
            '        else if (el._centerName !== undefined) {\n',
            '          add(points.find(p => p.name === el._centerName));\n',
            '          if (typeof el._radius === \'string\') add(points.find(p => p.name === el._radius));\n',
            '          if (Array.isArray(el._pointNames)) el._pointNames.forEach(n => add(points.find(p => p.name === n)));\n',
            '        }\n',
            '        else if (el.type === \'ThreePoints\' && el.fromPoint) { add(el.fromPoint); add(el.midPoint); add(el.toPoint); }\n',
            '        else if (el.fromPoint !== undefined && el.toPoint !== undefined) { add(el.centerPoint); add(el.fromPoint); add(el.toPoint); if (el.radiusPoint) add(el.radiusPoint); }\n',
            '        else if (Array.isArray(el.fitPoints)) { el.fitPoints.forEach(add); }\n',
            '        else if (el.focus1Point !== undefined) { add(el.focus1Point); add(el.focus2Point); }\n',
            '        else if (Array.isArray(el.controlPoints)) { el.controlPoints.forEach(add); }\n',
            '        else if (el.centerPoint !== undefined) { add(el.centerPoint); }\n',
            '        else { add(el); }\n',
            '      }\n',
            '      return result;\n',
            '    }\n',
            '    function applyClusterTransform(c) {\n',
            '      if (!c || !c.points || !c.relVectors || c.points.length !== c.relVectors.length) return;\n',
            '      const angleRad = (c.rotate || 0) * Math.PI / 180;\n',
            '      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);\n',
            '      for (let i = 0; i < c.points.length; i++) {\n',
            '        const p = c.points[i];\n',
            '        if (!p || !p.pos) continue;\n',
            '        const rel = c.relVectors[i];\n',
            '        p.pos.x = c.center.x + (rel.x * cos - rel.y * sin);\n',
            '        p.pos.y = c.center.y + (rel.x * sin + rel.y * cos);\n',
            '      }\n',
            '    }\n',
            '    // Пересобрать «опорную форму» кластера (относительные векторы точек от текущего\n',
            '    // центра масс), не меняя фактических текущих позиций — вызывается после ручной\n',
            '    // правки одной из точек кластера (аналог updateFiguresForPoint для фигур).\n',
            '    function rebaseClusterShape(c) {\n',
            '      if (!c.points || c.points.length === 0) return;\n',
            '      let cx = 0, cy = 0;\n',
            '      for (let p of c.points) { cx += p.pos.x; cy += p.pos.y; }\n',
            '      cx /= c.points.length; cy /= c.points.length;\n',
            '      const angleRad = (c.rotate || 0) * Math.PI / 180;\n',
            '      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);\n',
            '      c.relVectors = c.points.map(p => {\n',
            '        const dx = p.pos.x - cx, dy = p.pos.y - cy;\n',
            '        return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };\n',
            '      });\n',
            '      c.center = { x: cx, y: cy };\n',
            '    }\n',
            '    function updateClustersForPoint(pointIndex) {\n',
            '      const pt = points[pointIndex];\n',
            '      if (!pt) return;\n',
            '      for (let c of clusters) {\n',
            '        if (!c.points || !c.points.includes(pt)) continue;\n',
            '        rebaseClusterShape(c);\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function initClusters() {\n',
            '      clusters = clustersData.map(c => {\n',
            '        const elements = c.elements.map(name => {\n',
            '          return points.find(p => p.name === name) ||\n',
            '                 lines.find(l => l.name === name) ||\n',
            '                 figures.find(f => f.name === name) ||\n',
            '                 circles.find(cir => cir.name === name) ||\n',
            '                 arcs.find(a => a.name === name) ||\n',
            '                 ellipses.find(e => e.name === name) ||\n',
            '                 curves.find(cv => cv.name === name);\n',
            '        }).filter(el => el !== undefined);\n',
            '        const rigidPoints = collectClusterRigidPoints(elements);\n',
            '        let cx = 0, cy = 0;\n',
            '        for (let p of rigidPoints) { cx += p.pos.x; cy += p.pos.y; }\n',
            '        if (rigidPoints.length > 0) { cx /= rigidPoints.length; cy /= rigidPoints.length; }\n',
            '        const relVectors = rigidPoints.map(p => ({ x: p.pos.x - cx, y: p.pos.y - cy }));\n',
            '        return {\n',
            '          name: c.name,\n',
            '          elements: elements,\n',
            '          points: rigidPoints,\n',
            '          relVectors: relVectors,\n',
            '          center: { x: cx, y: cy },\n',
            '          rotate: c.rotate || 0,\n',
            '          interact: c.interact !== undefined ? c.interact : true,\n',
            '          active: c.active !== undefined ? c.active : true,\n',
            '          collision: c.collision || false, collisionGroup: c.collisionGroup || 0, collisionMask: c.collisionMask || null, collisionMargin: c.collisionMargin || 0,\n',
            '          collideWithPoints: c.collideWithPoints || false, collideWithLines: c.collideWithLines || false, collideWithCurves: c.collideWithCurves || false,\n',
            '          collideWithCircles: c.collideWithCircles || false, collideWithEllipses: c.collideWithEllipses || false, collideWithArcs: c.collideWithArcs || false,\n',
            '          collideWithFigures: c.collideWithFigures || false, collideWithClusters: c.collideWithClusters || false, collideWithBoundary: c.collideWithBoundary || false,\n',
            '        };\n',
            '      });\n',
            '      for (let c of clusters) {\n',
            '        applyClusterTransform(c);\n',
            '        if (window[c.name] !== undefined) glLog(\'warn\', "Кластер "+c.name+" уже существует в window");\n',
            '        window[c.name] = c;\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function initAngles() {\n',
            '      angles = anglesData.map(a => {\n',
            '        const l1 = lines.find(l => l.name === a.lineNames[0]);\n',
            '        const l2 = lines.find(l => l.name === a.lineNames[1]);\n',
            '        if (!l1 || !l2) return null;\n',
            '        const common = [l1.pA, l1.pB].find(p => p === l2.pA || p === l2.pB);\n',
            '        if (!common) return null;\n',
            '        return {\n',
            '          name: a.name,\n',
            '          line1: l1,\n',
            '          line2: l2,\n',
            '          vertex: common,\n',
            '          lock: a.lock || false,\n',
            '          measure: 0,\n',
            '        };\n',
            '      }).filter(a => a !== null);\n',
            '      for (let a of angles) { computeAngleMeasure(a); }\n',
            '      for (let a of angles) {\n',
            '        if (window[a.name] !== undefined) glLog(\'warn\', "Угол "+a.name+" уже существует в window");\n',
            '        window[a.name] = a;\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function computeAngleMeasure(angle) {\n',
            '      const v = angle.vertex;\n',
            '      const p1 = (angle.line1.pA === v) ? angle.line1.pB : angle.line1.pA;\n',
            '      const p2 = (angle.line2.pA === v) ? angle.line2.pB : angle.line2.pA;\n',
            '      const dx1 = p1.pos.x - v.pos.x;\n',
            '      const dy1 = p1.pos.y - v.pos.y;\n',
            '      const dx2 = p2.pos.x - v.pos.x;\n',
            '      const dy2 = p2.pos.y - v.pos.y;\n',
            '      const len1 = Math.hypot(dx1, dy1);\n',
            '      const len2 = Math.hypot(dx2, dy2);\n',
            '      if (len1 < 0.001 || len2 < 0.001) { angle.measure = 0; return; }\n',
            '      const dot = (dx1*dx2 + dy1*dy2) / (len1 * len2);\n',
            '      let angleRad = Math.acos(Math.min(1, Math.max(-1, dot)));\n',
            '      angle.measure = angleRad * 180 / Math.PI;\n',
            '    }\n',
            '\n',
            '    function initDrawAngles() {\n',
            '      drawAngles = drawAnglesData.map(d => {\n',
            '        const angle = angles.find(a => a.name === d.angleName);\n',
            '        if (!angle) return null;\n',
            '        return {\n',
            '          name: d.name,\n',
            '          angle: angle,\n',
            '          arc: d.arc !== undefined ? d.arc : true,\n',
            '          measure: d.measure !== undefined ? d.measure : true,\n',
            '          arccolor: d.arccolor || __gcDefaultColor(),\n',
            '          measurecolor: d.measurecolor || __gcDefaultColor(),\n',
            '          radius: d.radius || 1,\n',
            '          side: d.side || 1,\n',
            '          fractions: d.fractions || false,\n',
            '          count: Math.min(3, Math.max(1, d.count || 1)),\n',
            '          layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 90,\n',
            '          active: true,\n',
            '        };\n',
            '      }).filter(d => d !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawEqually() {\n',
            '      drawEqually = drawEquallyData.map(d => {\n',
            '        const edges = d.edges.map(name => lines.find(l => l.name === name)).filter(l => l !== undefined);\n',
            '        if (edges.length === 0) return null;\n',
            '        return {\n',
            '          name: d.name,\n',
            '          edges: edges,\n',
            '          type: d.type || 1,\n',
            '          color: d.color || __gcDefaultColor(),\n',
            '          layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 80,\n',
            '          active: true,\n',
            '        };\n',
            '      }).filter(d => d !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawVectors() {\n',
            '      drawVectors = drawVectorsData.map(d => {\n',
            '        const line = lines.find(l => l.name === d.edge);\n',
            '        if (!line) return null;\n',
            '        return {\n',
            '          name: d.name,\n',
            '          line: line,\n',
            '          pos: d.pos || 0,\n',
            '          direct: d.direct || 1,\n',
            '          color: d.color || __gcDefaultColor(),\n',
            '          length: d.length || 12,\n',
            '          thickness: d.thickness || line.thickness || 2,\n',
            '          layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 70,\n',
            '          active: true,\n',
            '        };\n',
            '      }).filter(d => d !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawInfLines() {\n',
            '      drawInfLines = drawInfLinesData.map(d => {\n',
            '        const line = lines.find(l => l.name === d.edge);\n',
            '        if (!line) return null;\n',
            '        let limitPoint = null;\n',
            '        if (d.limit && d.limit !== \'none\') {\n',
            '          limitPoint = points.find(p => p.name === d.limit);\n',
            '        }\n',
            '        return {\n',
            '          name: d.name,\n',
            '          line: line,\n',
            '          limit: limitPoint || null,\n',
            '          color: d.color || null,\n',
            '          thickness: d.thickness || null,\n',
            '          dotline: d.dotline || false,\n',
            '          layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 50,\n',
            '          active: true,\n',
            '        };\n',
            '      }).filter(d => d !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawFillings() {\n',
            '      drawFillings = drawFillingsData.map(d => {\n',
            '        if (d.line) {\n',
            '          const ln = lines.find(l => l.name === d.line);\n',
            '          const sidePt = points.find(p => p.name === d.side);\n',
            '          if (!ln || !sidePt) return null;\n',
            '          return { name: d.name, kind: \'halfplane\', line: ln, sidePoint: sidePt, color: d.color || __gcDefaultColor(), mode: d.mode || \'full\', layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, opacity: (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity, active: true };\n',
            '        }\n',
            '        if (d.arc) {\n',
            '          const arcObj = arcs.find(a => a.name === d.arc);\n',
            '          if (!arcObj) return null;\n',
            '          const pseudoCircle = {\n',
            '            get center() { return { x: arcObj.centerPoint.pos.x, y: arcObj.centerPoint.pos.y }; },\n',
            '            get radius() { return arcObj.radiusNum !== null ? arcObj.radiusNum : (arcObj.radiusPoint ? Math.hypot(arcObj.radiusPoint.pos.x - arcObj.centerPoint.pos.x, arcObj.radiusPoint.pos.y - arcObj.centerPoint.pos.y) : 0); },\n',
            '          };\n',
            '          return { name: d.name, kind: \'circleSector\', circle: pseudoCircle, fromPoint: arcObj.fromPoint, toPoint: arcObj.toPoint, shape: d.shape || \'sector\', color: d.color || __gcDefaultColor(), layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, opacity: (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity, active: true };\n',
            '        }\n',
            '        if (d.circle) {\n',
            '          const c = circles.find(cc => cc.name === d.circle);\n',
            '          const fromPt = points.find(p => p.name === d.from);\n',
            '          const toPt = points.find(p => p.name === d.to);\n',
            '          if (!c || !fromPt || !toPt) return null;\n',
            '          return { name: d.name, kind: \'circleSector\', circle: c, fromPoint: fromPt, toPoint: toPt, shape: d.shape || \'sector\', color: d.color || __gcDefaultColor(), layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, opacity: (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity, active: true };\n',
            '        }\n',
            '        const fig = figures.find(f => f.name === d.figure);\n',
            '        if (!fig) return null;\n',
            '        return {\n',
            '          name: d.name,\n',
            '          kind: \'polygon\',\n',
            '          figure: fig,\n',
            '          color: d.color || __gcDefaultColor(),\n',
            '          mode: d.mode || \'full\',\n',
            '          layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30,\n',
            '          opacity: (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity,\n',
            '          active: true,\n',
            '        };\n',
            '      }).filter(d => d !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawPunctirs() {\n',
            '      drawPunctirs = drawPunctirsData.map(d => {\n',
            '        const line = lines.find(l => l.name === d.edge);\n',
            '        if (!line) return null;\n',
            '        return {\n',
            '          name: d.name,\n',
            '          line: line,\n',
            '          color: d.color || null,\n',
            '          thickness: d.thickness || null,\n',
            '          pattern: d.pattern || [6, 6],\n',
            '          layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 60,\n',
            '          active: true,\n',
            '        };\n',
            '      }).filter(d => d !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawTexts() {\n',
            '      drawTexts = drawTextsData.map(d => ({ ...d, active: true }));\n',
            '    }\n',
            '\n',
            '    function applyFigureTransform(fig) {\n',
            '      if (!fig || !fig.points || !fig.relVectors || fig.points.length !== fig.relVectors.length) return;\n',
            '      const angleRad = fig.rotate * Math.PI / 180;\n',
            '      const cos = Math.cos(angleRad);\n',
            '      const sin = Math.sin(angleRad);\n',
            '      const sx = (fig.sizeX !== undefined && fig.sizeX !== null ? fig.sizeX : fig.size) * (fig.flipX ? -1 : 1);\n',
            '      const sy = (fig.sizeY !== undefined && fig.sizeY !== null ? fig.sizeY : fig.size) * (fig.flipY ? -1 : 1);\n',
            '      for (let i = 0; i < fig.points.length; i++) {\n',
            '        const p = fig.points[i];\n',
            '        const rel = fig.relVectors[i];\n',
            '        const lx = rel.x * sx, ly = rel.y * sy;\n',
            '        p.pos.x = fig.center.x + (lx * cos - ly * sin);\n',
            '        p.pos.y = fig.center.y + (lx * sin + ly * cos);\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function updateFiguresForPoint(pointIndex) {\n',
            '      const pt = points[pointIndex];\n',
            '      if (!pt) return;\n',
            '      for (let fig of figures) {\n',
            '        if (!fig.points.includes(pt)) continue;\n',
            '        let cx = 0, cy = 0;\n',
            '        for (let p of fig.points) { cx += p.pos.x; cy += p.pos.y; }\n',
            '        cx /= fig.points.length;\n',
            '        cy /= fig.points.length;\n',
            '        const angleRad = fig.rotate * Math.PI / 180;\n',
            '        const cos = Math.cos(angleRad);\n',
            '        const sin = Math.sin(angleRad);\n',
            '        const sxF = (fig.sizeX !== undefined && fig.sizeX !== null ? fig.sizeX : fig.size) * (fig.flipX ? -1 : 1);\n',
            '        const syF = (fig.sizeY !== undefined && fig.sizeY !== null ? fig.sizeY : fig.size) * (fig.flipY ? -1 : 1);\n',
            '        const invSx = Math.abs(sxF) < 1e-9 ? 0 : 1 / sxF;\n',
            '        const invSy = Math.abs(syF) < 1e-9 ? 0 : 1 / syF;\n',
            '        for (let i = 0; i < fig.points.length; i++) {\n',
            '          const p = fig.points[i];\n',
            '          const dx = p.pos.x - cx;\n',
            '          const dy = p.pos.y - cy;\n',
            '          fig.relVectors[i] = { \n',
            '            x: (dx * cos + dy * sin) * invSx, \n',
            '            y: (-dx * sin + dy * cos) * invSy \n',
            '          };\n',
            '        }\n',
            '        fig.center = { x: cx, y: cy };\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function fieldScale() {\n',
            '      const usableWidth = width - 2 * EDGE_MARGIN;\n',
            '      const usableHeight = height - 2 * EDGE_MARGIN;\n',
            '      return Math.min(usableWidth / FIELD_WIDTH, usableHeight / FIELD_HEIGHT) * (camera.zoom || 1);\n',
            '    }\n',
            '\n',
            '    function fieldToPixel(fx, fy) {\n',
            '      if (isNaN(fx) || isNaN(fy)) return { x: 0, y: 0 };\n',
            '      const scale = fieldScale();\n',
            '      if (scale <= 0) return { x: 0, y: 0 };\n',
            '      return {\n',
            '        x: width / 2 + (fx - camera.offsetX) * scale,\n',
            '        y: height / 2 - (fy - camera.offsetY) * scale\n',
            '      };\n',
            '    }\n',
            '\n',
            '    function pixelToField(px, py) {\n',
            '      if (isNaN(px) || isNaN(py)) return { x: 0, y: 0 };\n',
            '      const scale = fieldScale();\n',
            '      if (scale <= 0) return { x: 0, y: 0 };\n',
            '      return {\n',
            '        x: (px - width / 2) / scale + camera.offsetX,\n',
            '        y: -(py - height / 2) / scale + camera.offsetY\n',
            '      };\n',
            '    }\n',
            '\n',
            '    function distance(p1, p2) { return Math.hypot(p1.x - p2.x, p1.y - p2.y); }\n',
            '\n',
            '    // ---- Система коллизий (Задача 6) ----\n',
            '    function canCollideWith(a, b) {\n',
            '      const groupA = a.collisionGroup || 0, groupB = b.collisionGroup || 0;\n',
            '      if (a.collisionMask && a.collisionMask.length > 0 && !a.collisionMask.includes(groupB)) return false;\n',
            '      if (b.collisionMask && b.collisionMask.length > 0 && !b.collisionMask.includes(groupA)) return false;\n',
            '      return true;\n',
            '    }\n',
            '    function closestPointOnSegment(p, a, b) {\n',
            '      const dx = b.x - a.x, dy = b.y - a.y;\n',
            '      const len2 = dx * dx + dy * dy;\n',
            '      let t = len2 < 1e-12 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;\n',
            '      t = Math.max(0, Math.min(1, t));\n',
            '      return { x: a.x + dx * t, y: a.y + dy * t };\n',
            '    }\n',
            '    function closestPointOnPolyline(p, pts) {\n',
            '      let best = null, bestD = Infinity;\n',
            '      for (let i = 0; i < pts.length - 1; i++) {\n',
            '        const c = closestPointOnSegment(p, pts[i], pts[i + 1]);\n',
            '        const d = distance(p, c);\n',
            '        if (d < bestD) { bestD = d; best = c; }\n',
            '      }\n',
            '      return best;\n',
            '    }\n',
            '    // Контур фигуры для проверки столкновений — точки в порядке elements, замкнутые\n',
            '    // в многоугольник (как их и рисует draw Filling/сама фигура).\n',
            '    function figureBoundaryPoints(fig) {\n',
            '      if (!fig || !fig.points || fig.points.length < 2) return null;\n',
            '      const pts = fig.points.map(p => p.pos);\n',
            '      return pts.concat([pts[0]]);\n',
            '    }\n',
            '    // Контур кластера (составного тела) для столкновений — строится как выпуклая\n',
            '    // оболочка всех входящих в него независимых точек: даёт разумную приближённую\n',
            '    // границу произвольной по составу группы объектов без привязки к порядку elements.\n',
            '    function clusterBoundaryPoints(c) {\n',
            '      if (!c || !c.points) return null;\n',
            '      if (c.points.length < 2) return null;\n',
            '      if (c.points.length === 2) return [c.points[0].pos, c.points[1].pos];\n',
            '      const hull = glConvexHull(c.points.map(p => p.pos));\n',
            '      if (!hull || hull.length < 2) return null;\n',
            '      return hull.concat([hull[0]]);\n',
            '    }\n',
            '\n',
            '    // ---- Привязка (snap) при перетаскивании ----\n',
            '    // Приоритет: 1) точное совпадение с другой точкой, 2) выравнивание по оси X\n',
            '    // и/или Y с другой точкой ("умные направляющие"), 3) привязка к сетке.\n',
            '    // activeSnapGuides используется только для подсказки-подсветки при отрисовке.\n',
            '    function computeSnap(fieldPos, excludePoints) {\n',
            '      activeSnapGuides = [];\n',
            '      if (!window.snapEnabled) return { x: fieldPos.x, y: fieldPos.y };\n',
            '      const scale = fieldScale();\n',
            '      if (!(scale > 0)) return { x: fieldPos.x, y: fieldPos.y };\n',
            '      const threshold = SNAP_DISTANCE_PX / scale;\n',
            '      let bestPoint = null, bestPointD = threshold;\n',
            '      for (const other of points) {\n',
            '        if (!other || !other.pos || other.hidden) continue;\n',
            '        if (excludePoints && excludePoints.includes(other)) continue;\n',
            '        const d = Math.hypot(other.pos.x - fieldPos.x, other.pos.y - fieldPos.y);\n',
            '        if (d < bestPointD) { bestPointD = d; bestPoint = other; }\n',
            '      }\n',
            '      if (bestPoint) {\n',
            '        activeSnapGuides.push({ type: \'point\', x: bestPoint.pos.x, y: bestPoint.pos.y });\n',
            '        return { x: bestPoint.pos.x, y: bestPoint.pos.y };\n',
            '      }\n',
            '      let x = fieldPos.x, y = fieldPos.y;\n',
            '      let bestX = null, bestXD = threshold, bestY = null, bestYD = threshold;\n',
            '      for (const other of points) {\n',
            '        if (!other || !other.pos || other.hidden) continue;\n',
            '        if (excludePoints && excludePoints.includes(other)) continue;\n',
            '        const dx = Math.abs(other.pos.x - fieldPos.x);\n',
            '        if (dx < bestXD) { bestXD = dx; bestX = other; }\n',
            '        const dy = Math.abs(other.pos.y - fieldPos.y);\n',
            '        if (dy < bestYD) { bestYD = dy; bestY = other; }\n',
            '      }\n',
            '      if (bestX) { x = bestX.pos.x; activeSnapGuides.push({ type: \'vLine\', x }); }\n',
            '      if (bestY) { y = bestY.pos.y; activeSnapGuides.push({ type: \'hLine\', y }); }\n',
            '      if (bestX || bestY) return { x, y };\n',
            '      if (SNAP_GRID_STEP > 0) {\n',
            '        const gx = Math.round(fieldPos.x / SNAP_GRID_STEP) * SNAP_GRID_STEP;\n',
            '        const gy = Math.round(fieldPos.y / SNAP_GRID_STEP) * SNAP_GRID_STEP;\n',
            '        if (Math.abs(gx - fieldPos.x) < threshold) x = gx;\n',
            '        if (Math.abs(gy - fieldPos.y) < threshold) y = gy;\n',
            '      }\n',
            '      return { x, y };\n',
            '    }\n',
            '    // То же самое, но для жёсткого тела (Figure/Claster) целиком: ищет лучшую\n',
            '    // привязку среди ВСЕХ точек тела к чужим точкам/осям/сетке и возвращает единый\n',
            '    // сдвиг (dx, dy), который затем применяется как трансляция центра тела —\n',
            '    // форма и текущий поворот тела при этом не меняются.\n',
            '    function computeBodySnapDelta(bodyPoints) {\n',
            '      activeSnapGuides = [];\n',
            '      if (!window.snapEnabled || !bodyPoints || bodyPoints.length === 0) return { dx: 0, dy: 0 };\n',
            '      const scale = fieldScale();\n',
            '      if (!(scale > 0)) return { dx: 0, dy: 0 };\n',
            '      const threshold = SNAP_DISTANCE_PX / scale;\n',
            '      let best = null, bestD = threshold;\n',
            '      for (const bp of bodyPoints) {\n',
            '        for (const other of points) {\n',
            '          if (!other || !other.pos || other.hidden || bodyPoints.includes(other)) continue;\n',
            '          const d = Math.hypot(other.pos.x - bp.pos.x, other.pos.y - bp.pos.y);\n',
            '          if (d < bestD) { bestD = d; best = { dx: other.pos.x - bp.pos.x, dy: other.pos.y - bp.pos.y, x: other.pos.x, y: other.pos.y }; }\n',
            '        }\n',
            '      }\n',
            '      if (best) {\n',
            '        activeSnapGuides.push({ type: \'point\', x: best.x, y: best.y });\n',
            '        return { dx: best.dx, dy: best.dy };\n',
            '      }\n',
            '      let bestX = null, bestXD = threshold, bestY = null, bestYD = threshold;\n',
            '      for (const bp of bodyPoints) {\n',
            '        for (const other of points) {\n',
            '          if (!other || !other.pos || other.hidden || bodyPoints.includes(other)) continue;\n',
            '          const dx = Math.abs(other.pos.x - bp.pos.x);\n',
            '          if (dx < bestXD) { bestXD = dx; bestX = { dx: other.pos.x - bp.pos.x, x: other.pos.x }; }\n',
            '          const dy = Math.abs(other.pos.y - bp.pos.y);\n',
            '          if (dy < bestYD) { bestYD = dy; bestY = { dy: other.pos.y - bp.pos.y, y: other.pos.y }; }\n',
            '        }\n',
            '      }\n',
            '      let dx = 0, dy = 0;\n',
            '      if (bestX) { dx = bestX.dx; activeSnapGuides.push({ type: \'vLine\', x: bestX.x }); }\n',
            '      if (bestY) { dy = bestY.dy; activeSnapGuides.push({ type: \'hLine\', y: bestY.y }); }\n',
            '      if (bestX || bestY) return { dx, dy };\n',
            '      if (SNAP_GRID_STEP > 0) {\n',
            '        let cx = 0, cy = 0;\n',
            '        for (const bp of bodyPoints) { cx += bp.pos.x; cy += bp.pos.y; }\n',
            '        cx /= bodyPoints.length; cy /= bodyPoints.length;\n',
            '        const gx = Math.round(cx / SNAP_GRID_STEP) * SNAP_GRID_STEP;\n',
            '        const gy = Math.round(cy / SNAP_GRID_STEP) * SNAP_GRID_STEP;\n',
            '        if (Math.abs(gx - cx) < threshold) dx = gx - cx;\n',
            '        if (Math.abs(gy - cy) < threshold) dy = gy - cy;\n',
            '      }\n',
            '      return { dx, dy };\n',
            '    }\n',
            '    function drawSnapGuides() {\n',
            '      if (!isDragging || !activeSnapGuides || activeSnapGuides.length === 0) return;\n',
            '      ctx.save();\n',
            '      ctx.strokeStyle = \'', theme.accent, '\';\n',
            '      ctx.lineWidth = 1;\n',
            '      for (const g of activeSnapGuides) {\n',
            '        if (g.type === \'vLine\') {\n',
            '          ctx.setLineDash([5, 4]);\n',
            '          const top = fieldToPixel(g.x, FIELD_HEIGHT / 2), bottom = fieldToPixel(g.x, -FIELD_HEIGHT / 2);\n',
            '          ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bottom.x, bottom.y); ctx.stroke();\n',
            '        } else if (g.type === \'hLine\') {\n',
            '          ctx.setLineDash([5, 4]);\n',
            '          const left = fieldToPixel(-FIELD_WIDTH / 2, g.y), right = fieldToPixel(FIELD_WIDTH / 2, g.y);\n',
            '          ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();\n',
            '        } else if (g.type === \'point\') {\n',
            '          ctx.setLineDash([]);\n',
            '          const p = fieldToPixel(g.x, g.y);\n',
            '          ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.stroke();\n',
            '        }\n',
            '      }\n',
            '      ctx.setLineDash([]);\n',
            '      ctx.restore();\n',
            '    }\n',
            '    function closestPointOnCircleBoundary(p, center, radius) {\n',
            '      const dx = p.x - center.x, dy = p.y - center.y;\n',
            '      const len = Math.hypot(dx, dy);\n',
            '      if (len < 1e-9) return { x: center.x + radius, y: center.y };\n',
            '      return { x: center.x + dx / len * radius, y: center.y + dy / len * radius };\n',
            '    }\n',
            '    function ellipseBoundaryPointField(e, theta) {\n',
            '      const lx = e.a * Math.cos(theta), ly = e.b * Math.sin(theta);\n',
            '      const rot = (e.rotate || 0) * Math.PI / 180;\n',
            '      const cs = Math.cos(rot), sn = Math.sin(rot);\n',
            '      return { x: e.centerPoint.pos.x + lx * cs - ly * sn, y: e.centerPoint.pos.y + lx * sn + ly * cs };\n',
            '    }\n',
            '    function closestPointOnEllipseBoundary(p, e) {\n',
            '      if (!e.centerPoint) return null;\n',
            '      const N = 72;\n',
            '      let bestTheta = 0, bestD = Infinity;\n',
            '      for (let i = 0; i <= N; i++) {\n',
            '        const theta = i / N * 2 * Math.PI;\n',
            '        const pt = ellipseBoundaryPointField(e, theta);\n',
            '        const d = (pt.x - p.x) * (pt.x - p.x) + (pt.y - p.y) * (pt.y - p.y);\n',
            '        if (d < bestD) { bestD = d; bestTheta = theta; }\n',
            '      }\n',
            '      let lo = bestTheta - 2 * Math.PI / N, hi = bestTheta + 2 * Math.PI / N;\n',
            '      const distAt = (th) => { const pt = ellipseBoundaryPointField(e, th); return (pt.x - p.x) * (pt.x - p.x) + (pt.y - p.y) * (pt.y - p.y); };\n',
            '      for (let iter = 0; iter < 20; iter++) {\n',
            '        const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;\n',
            '        if (distAt(m1) < distAt(m2)) hi = m2; else lo = m1;\n',
            '      }\n',
            '      return ellipseBoundaryPointField(e, (lo + hi) / 2);\n',
            '    }\n',
            '    function arcFieldAngleRange(arc) {\n',
            '      if (!arc.centerPoint || !arc.fromPoint || !arc.toPoint) return null;\n',
            '      const cx = arc.centerPoint.pos.x, cy = arc.centerPoint.pos.y;\n',
            '      const ang1 = Math.atan2(arc.fromPoint.pos.y - cy, arc.fromPoint.pos.x - cx);\n',
            '      const ang2 = Math.atan2(arc.toPoint.pos.y - cy, arc.toPoint.pos.x - cx);\n',
            '      const TAU = Math.PI * 2;\n',
            '      const norm = (x) => ((x % TAU) + TAU) % TAU;\n',
            '      const sweep = norm(ang2 - ang1);\n',
            '      let anticw = false;\n',
            '      if (arc.type === \'ThreePoints\' && arc.midPoint) {\n',
            '        const angM = Math.atan2(arc.midPoint.pos.y - cy, arc.midPoint.pos.x - cx);\n',
            '        if (norm(angM - ang1) > sweep) anticw = true;\n',
            '      }\n',
            '      return { ang1, effSweep: anticw ? -(TAU - sweep) : sweep };\n',
            '    }\n',
            '    function arcFieldRadius(arc) {\n',
            '      return arc.type === \'ThreePoints\' ? arc.radius : (arc.radiusNum !== null ? arc.radiusNum : (arc.radiusPoint ? Math.hypot(arc.radiusPoint.pos.x - arc.centerPoint.pos.x, arc.radiusPoint.pos.y - arc.centerPoint.pos.y) : 0));\n',
            '    }\n',
            '    function arcPointAtT(arc, t) {\n',
            '      const range = arcFieldAngleRange(arc);\n',
            '      if (!range) return null;\n',
            '      const radius = arcFieldRadius(arc);\n',
            '      if (!(radius > 0)) return null;\n',
            '      const ang = range.ang1 + range.effSweep * t;\n',
            '      return { x: arc.centerPoint.pos.x + radius * Math.cos(ang), y: arc.centerPoint.pos.y + radius * Math.sin(ang) };\n',
            '    }\n',
            '    function closestPointOnArcBoundary(p, arc) {\n',
            '      const N = 60;\n',
            '      let bestPt = null, bestD = Infinity, bestT = 0;\n',
            '      for (let i = 0; i <= N; i++) {\n',
            '        const t = i / N;\n',
            '        const pt = arcPointAtT(arc, t);\n',
            '        if (!pt) continue;\n',
            '        const d = (pt.x - p.x) * (pt.x - p.x) + (pt.y - p.y) * (pt.y - p.y);\n',
            '        if (d < bestD) { bestD = d; bestPt = pt; bestT = t; }\n',
            '      }\n',
            '      if (!bestPt) return null;\n',
            '      let lo = Math.max(0, bestT - 1 / N), hi = Math.min(1, bestT + 1 / N);\n',
            '      const distAt = (t) => { const pt = arcPointAtT(arc, t); if (!pt) return Infinity; return (pt.x - p.x) * (pt.x - p.x) + (pt.y - p.y) * (pt.y - p.y); };\n',
            '      for (let iter = 0; iter < 20; iter++) {\n',
            '        const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;\n',
            '        if (distAt(m1) < distAt(m2)) hi = m2; else lo = m1;\n',
            '      }\n',
            '      return arcPointAtT(arc, (lo + hi) / 2);\n',
            '    }\n',
            '    function pushAwayFrom(pos, obstaclePoint, minDist) {\n',
            '      const dx = pos.x - obstaclePoint.x, dy = pos.y - obstaclePoint.y;\n',
            '      const len = Math.hypot(dx, dy);\n',
            '      if (len >= minDist) return pos;\n',
            '      if (len < 1e-6) return { x: obstaclePoint.x + minDist, y: obstaclePoint.y };\n',
            '      const scale = minDist / len;\n',
            '      return { x: obstaclePoint.x + dx * scale, y: obstaclePoint.y + dy * scale };\n',
            '    }\n',
            '    function resolveCollision(index, newPos) {\n',
            '      const p = points[index];\n',
            '      if (!p) return newPos;\n',
            '      let pos = { x: newPos.x, y: newPos.y };\n',
            '      if (p.collision === false || window.collisionsEnabled === false) return pos;\n',
            '      const margin = p.collisionMargin || 0;\n',
            '      for (let iter = 0; iter < 3; iter++) {\n',
            '        if (p.collideWithPoints !== false) {\n',
            '          for (let i = 0; i < points.length; i++) {\n',
            '            if (i === index) continue;\n',
            '            const other = points[i];\n',
            '            if (!other || !other.pos || other.hidden) continue;\n',
            '            if (other.collision === false || other.collideWithPoints === false) continue;\n',
            '            if (!canCollideWith(p, other)) continue;\n',
            '            pos = pushAwayFrom(pos, other.pos, MIN_DIST + margin + (other.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithLines) {\n',
            '          for (let l of lines) {\n',
            '            if (l.collision === false) continue;\n',
            '            if (!canCollideWith(p, l)) continue;\n',
            '            const c = closestPointOnSegment(pos, l.pA.pos, l.pB.pos);\n',
            '            pos = pushAwayFrom(pos, c, MIN_DIST + margin + (l.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithCurves) {\n',
            '          for (let cv of curves) {\n',
            '            if (cv.collision === false) continue;\n',
            '            if (!canCollideWith(p, cv)) continue;\n',
            '            const pts = [];\n',
            '            for (let i = 0; i <= 30; i++) { const pt = curvePointAt(cv, i / 30); if (pt) pts.push(pt); }\n',
            '            if (pts.length < 2) continue;\n',
            '            const c = closestPointOnPolyline(pos, pts);\n',
            '            if (c) pos = pushAwayFrom(pos, c, MIN_DIST + margin + (cv.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithCircles) {\n',
            '          for (let c of circles) {\n',
            '            if (c.collision === false || !c.center) continue;\n',
            '            if (!canCollideWith(p, c)) continue;\n',
            '            const cc = closestPointOnCircleBoundary(pos, c.center, c.radius);\n',
            '            pos = pushAwayFrom(pos, cc, MIN_DIST + margin + (c.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithEllipses) {\n',
            '          for (let e of ellipses) {\n',
            '            if (e.collision === false) continue;\n',
            '            if (!canCollideWith(p, e)) continue;\n',
            '            const cc = closestPointOnEllipseBoundary(pos, e);\n',
            '            if (cc) pos = pushAwayFrom(pos, cc, MIN_DIST + margin + (e.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithArcs) {\n',
            '          for (let a of arcs) {\n',
            '            if (a.collision === false) continue;\n',
            '            if (!canCollideWith(p, a)) continue;\n',
            '            const cc = closestPointOnArcBoundary(pos, a);\n',
            '            if (cc) pos = pushAwayFrom(pos, cc, MIN_DIST + margin + (a.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithFigures) {\n',
            '          for (let f of figures) {\n',
            '            if (f.collision === false) continue;\n',
            '            if (f.points && f.points.includes(p)) continue;\n',
            '            if (!canCollideWith(p, f)) continue;\n',
            '            const boundary = figureBoundaryPoints(f);\n',
            '            if (!boundary) continue;\n',
            '            const cc = closestPointOnPolyline(pos, boundary);\n',
            '            if (cc) pos = pushAwayFrom(pos, cc, MIN_DIST + margin + (f.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithClusters) {\n',
            '          for (let c of clusters) {\n',
            '            if (c.collision === false) continue;\n',
            '            if (c.points && c.points.includes(p)) continue;\n',
            '            if (!canCollideWith(p, c)) continue;\n',
            '            const boundary = clusterBoundaryPoints(c);\n',
            '            if (!boundary) continue;\n',
            '            const cc = closestPointOnPolyline(pos, boundary);\n',
            '            if (cc) pos = pushAwayFrom(pos, cc, MIN_DIST + margin + (c.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithBoundary !== false) {\n',
            '          clampFieldPoint(pos);\n',
            '        }\n',
            '      }\n',
            '      return pos;\n',
            '    }\n',
            '\n',
            '    // ===== ОТРИСОВКА =====\n',
            '    function drawAngleArc(drawObj) {\n',
            '      const angle = drawObj.angle;\n',
            '      if (!angle || !angle.vertex || !angle.line1 || !angle.line2) return;\n',
            '      const v = angle.vertex;\n',
            '      const p1 = (angle.line1.pA === v) ? angle.line1.pB : angle.line1.pA;\n',
            '      const p2 = (angle.line2.pA === v) ? angle.line2.pB : angle.line2.pA;\n',
            '      const vPix = fieldToPixel(v.pos.x, v.pos.y);\n',
            '      const p1Pix = fieldToPixel(p1.pos.x, p1.pos.y);\n',
            '      const p2Pix = fieldToPixel(p2.pos.x, p2.pos.y);\n',
            '      const dx1 = p1Pix.x - vPix.x;\n',
            '      const dy1 = p1Pix.y - vPix.y;\n',
            '      const dx2 = p2Pix.x - vPix.x;\n',
            '      const dy2 = p2Pix.y - vPix.y;\n',
            '      const len1 = Math.hypot(dx1, dy1);\n',
            '      const len2 = Math.hypot(dx2, dy2);\n',
            '      if (len1 < 0.001 || len2 < 0.001) return;\n',
            '      let angle1 = Math.atan2(dy1, dx1);\n',
            '      let angle2 = Math.atan2(dy2, dx2);\n',
            '      let diff = angle2 - angle1;\n',
            '      diff = ((diff % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;\n',
            '      let start, end, ccw;\n',
            '      if (diff >= 0) {\n',
            '        start = angle1;\n',
            '        end = angle2;\n',
            '        ccw = false;\n',
            '      } else {\n',
            '        start = angle2;\n',
            '        end = angle1;\n',
            '        ccw = false;\n',
            '      }\n',
            '      if (drawObj.side === -1) ccw = true;\n',
            '      const scale = fieldScale();\n',
            '      let radiusVal = drawObj.radius;\n',
            '      if (typeof radiusVal === \'string\') {\n',
            '        const point = points.find(p => p.name === radiusVal);\n',
            '        if (point) radiusVal = Math.hypot(point.pos.x - v.pos.x, point.pos.y - v.pos.y);\n',
            '        else radiusVal = 1.0;\n',
            '      }\n',
            '      if (typeof radiusVal !== \'number\' || isNaN(radiusVal)) radiusVal = 1.0;\n',
            '      const arcRadius = radiusVal * scale;\n',
            '      let measureVal = angle.measure;\n',
            '      if (drawObj.side === -1) measureVal = 360 - measureVal;\n',
            '      const isRightAngle = Math.abs(measureVal - 90) < 0.5;\n',
            '      if (drawObj.arc) {\n',
            '        const arcCount = Math.min(3, Math.max(1, drawObj.count || 1));\n',
            '        const arcGap = 4;\n',
            '        for (let k = 0; k < arcCount; k++) {\n',
            '        const rK = arcRadius - k * arcGap;\n',
            '        if (rK <= 0) continue;\n',
            '        if (isRightAngle) {\n',
            '          const r = rK * 0.8;\n',
            '          const dir1 = { x: Math.cos(start), y: Math.sin(start) };\n',
            '          const dir2 = { x: Math.cos(end), y: Math.sin(end) };\n',
            '          const pA = { x: vPix.x + r * dir1.x, y: vPix.y + r * dir1.y };\n',
            '          const pB = { x: vPix.x + r * dir2.x, y: vPix.y + r * dir2.y };\n',
            '          const cross = dir1.x * dir2.y - dir1.y * dir2.x;\n',
            '          let n1, n2;\n',
            '          if (cross > 0) { n1 = { x: -dir1.y, y: dir1.x }; n2 = { x: dir2.y, y: -dir2.x }; }\n',
            '          else { n1 = { x: dir1.y, y: -dir1.x }; n2 = { x: -dir2.y, y: dir2.x }; }\n',
            '          if (drawObj.side === -1) { n1 = { x: -n1.x, y: -n1.y }; n2 = { x: -n2.x, y: -n2.y }; }\n',
            '          const q1 = { x: pA.x + r * n1.x, y: pA.y + r * n1.y };\n',
            '          const q2 = { x: pB.x + r * n2.x, y: pB.y + r * n2.y };\n',
            '          ctx.beginPath();\n',
            '          ctx.moveTo(pA.x, pA.y);\n',
            '          ctx.lineTo(q1.x, q1.y);\n',
            '          ctx.lineTo(q2.x, q2.y);\n',
            '          ctx.lineTo(pB.x, pB.y);\n',
            '          ctx.strokeStyle = drawObj.arccolor || __gcDefaultColor();\n',
            '          ctx.lineWidth = 1.5;\n',
            '          ctx.stroke();\n',
            '        } else {\n',
            '          ctx.beginPath();\n',
            '          ctx.arc(vPix.x, vPix.y, rK, start, end, ccw);\n',
            '          ctx.strokeStyle = drawObj.arccolor || __gcDefaultColor();\n',
            '          ctx.lineWidth = 1.5;\n',
            '          ctx.stroke();\n',
            '        }\n',
            '        }\n',
            '      }\n',
            '      if (drawObj.measure) {\n',
            '        let midAngle;\n',
            '        if (drawObj.side === 1) midAngle = start + (end - start) / 2;\n',
            '        else midAngle = start + (end - start) / 2 + Math.PI;\n',
            '        midAngle = ((midAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);\n',
            '        const textRadius = arcRadius * 1.2;\n',
            '        const tx = vPix.x + textRadius * Math.cos(midAngle);\n',
            '        const ty = vPix.y + textRadius * Math.sin(midAngle);\n',
            '        if (!drawObj.fractions) measureVal = Math.round(measureVal);\n',
            '        else measureVal = parseFloat(measureVal.toFixed(2));\n',
            '        ctx.fillStyle = drawObj.measurecolor || __gcDefaultColor();\n',
            '        ctx.font = \'14px sans-serif\';\n',
            '        ctx.textAlign = \'center\';\n',
            '        ctx.textBaseline = \'middle\';\n',
            '        ctx.fillText(measureVal + "°", tx, ty);\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function drawCircle(circle) {\n',
            '      if (!circle || !circle.center || circle.radius === undefined) return;\n',
            '      if (!(circle.radius > 0) || !isFinite(circle.radius)) return;\n',
            '      const centerPix = fieldToPixel(circle.center.x, circle.center.y);\n',
            '      const scale = fieldScale();\n',
            '      const radiusPix = circle.radius * scale;\n',
            '      ctx.beginPath();\n',
            '      ctx.arc(centerPix.x, centerPix.y, radiusPix, 0, 2 * Math.PI);\n',
            '      ctx.strokeStyle = circle.color || __gcDefaultColor();\n',
            '      ctx.lineWidth = circle.thickness || 1.5;\n',
            '      ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function drawArc(a) {\n',
            '      if (!a || !a.centerPoint) return;\n',
            '      const radius = a.type === \'ThreePoints\' ? a.radius : (a.radiusNum !== null ? a.radiusNum : (a.radiusPoint ? Math.hypot(a.radiusPoint.pos.x - a.centerPoint.pos.x, a.radiusPoint.pos.y - a.centerPoint.pos.y) : 0));\n',
            '      if (!(radius > 0)) return;\n',
            '      const centerPix = fieldToPixel(a.centerPoint.pos.x, a.centerPoint.pos.y);\n',
            '      const r = radius * fieldScale();\n',
            '      const p1 = fieldToPixel(a.fromPoint.pos.x, a.fromPoint.pos.y);\n',
            '      const p2 = fieldToPixel(a.toPoint.pos.x, a.toPoint.pos.y);\n',
            '      const a1 = Math.atan2(p1.y - centerPix.y, p1.x - centerPix.x);\n',
            '      const a2 = Math.atan2(p2.y - centerPix.y, p2.x - centerPix.x);\n',
            '      let anticlockwise = false;\n',
            '      if (a.type === \'ThreePoints\' && a.midPoint) {\n',
            '        const pm = fieldToPixel(a.midPoint.pos.x, a.midPoint.pos.y);\n',
            '        const aM = Math.atan2(pm.y - centerPix.y, pm.x - centerPix.x);\n',
            '        const TAU = Math.PI * 2;\n',
            '        const norm = (x) => ((x % TAU) + TAU) % TAU;\n',
            '        if (norm(aM - a1) > norm(a2 - a1)) anticlockwise = true;\n',
            '      }\n',
            '      ctx.beginPath();\n',
            '      ctx.arc(centerPix.x, centerPix.y, r, a1, a2, anticlockwise);\n',
            '      ctx.strokeStyle = a.color || __gcDefaultColor();\n',
            '      ctx.lineWidth = a.thickness || 2;\n',
            '      ctx.lineCap = \'round\';\n',
            '      ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function drawEllipse(e) {\n',
            '      if (!e || !e.centerPoint) return;\n',
            '      const centerPix = fieldToPixel(e.centerPoint.pos.x, e.centerPoint.pos.y);\n',
            '      const scale = fieldScale();\n',
            '      const rx = Math.abs(e.a) * scale, ry = Math.abs(e.b) * scale;\n',
            '      if (!(rx > 0) || !(ry > 0)) return;\n',
            '      const rotRad = -(e.rotate || 0) * Math.PI / 180;\n',
            '      ctx.beginPath();\n',
            '      ctx.ellipse(centerPix.x, centerPix.y, rx, ry, rotRad, 0, 2 * Math.PI);\n',
            '      ctx.strokeStyle = e.color || __gcDefaultColor();\n',
            '      ctx.lineWidth = e.thickness || 2;\n',
            '      ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function bezierPoint(cps, t) {\n',
            '      let pts = cps.map(p => ({ x: p.x, y: p.y }));\n',
            '      while (pts.length > 1) {\n',
            '        const next = [];\n',
            '        for (let i = 0; i < pts.length - 1; i++) {\n',
            '          next.push({ x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t });\n',
            '        }\n',
            '        pts = next;\n',
            '      }\n',
            '      return pts[0];\n',
            '    }\n',
            '\n',
            '    function curvePointAt(curve, t) {\n',
            '      if (curve.type === \'bezier\') {\n',
            '        if (!curve.controlPoints || curve.controlPoints.length < 2) return null;\n',
            '        return bezierPoint(curve.controlPoints.map(q => ({ x: q.pos.x, y: q.pos.y })), t);\n',
            '      }\n',
            '      if (curve.type === \'spiral\' || curve.type === \'cycloid\' || curve.type === \'involute\') {\n',
            '        if (!curve.centerPoint) return null;\n',
            '        const cx = curve.centerPoint.pos.x, cy = curve.centerPoint.pos.y;\n',
            '        const theta = t * (curve.turns || 3) * 2 * Math.PI;\n',
            '        if (curve.type === \'spiral\') {\n',
            '          const r = (curve.a || 0) + (curve.b === undefined || curve.b === null ? 1 : curve.b) * theta;\n',
            '          return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };\n',
            '        }\n',
            '        const R = curve.radius === undefined || curve.radius === null ? 2 : curve.radius;\n',
            '        if (curve.type === \'cycloid\') {\n',
            '          return { x: cx + R * (theta - Math.sin(theta)), y: cy + R * (1 - Math.cos(theta)) };\n',
            '        }\n',
            '        // involute (эвольвента окружности)\n',
            '        return { x: cx + R * (Math.cos(theta) + theta * Math.sin(theta)), y: cy + R * (Math.sin(theta) - theta * Math.cos(theta)) };\n',
            '      }\n',
            '      const x = evaluate(curve.xExpr, { t });\n',
            '      const y = evaluate(curve.yExpr, { t });\n',
            '      if (typeof x !== \'number\' || typeof y !== \'number\' || isNaN(x) || isNaN(y)) return null;\n',
            '      return { x, y };\n',
            '    }\n',
            '\n',
            '    function findNearestTOnCurve(curve, target) {\n',
            '      const N = 200;\n',
            '      let bestT = 0, bestDist = Infinity;\n',
            '      for (let i = 0; i <= N; i++) {\n',
            '        const t = i / N;\n',
            '        const pt = curvePointAt(curve, t);\n',
            '        if (!pt) continue;\n',
            '        const d = (pt.x - target.x) * (pt.x - target.x) + (pt.y - target.y) * (pt.y - target.y);\n',
            '        if (d < bestDist) { bestDist = d; bestT = t; }\n',
            '      }\n',
            '      // Уточнение тройным поиском вокруг найденного грубого приближения\n',
            '      let lo = Math.max(0, bestT - 1 / N), hi = Math.min(1, bestT + 1 / N);\n',
            '      const distAt = (t) => { const pt = curvePointAt(curve, t); if (!pt) return Infinity; return (pt.x - target.x) * (pt.x - target.x) + (pt.y - target.y) * (pt.y - target.y); };\n',
            '      for (let iter = 0; iter < 20; iter++) {\n',
            '        const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;\n',
            '        if (distAt(m1) < distAt(m2)) hi = m2; else lo = m1;\n',
            '      }\n',
            '      return (lo + hi) / 2;\n',
            '    }\n',
            '\n',
            '    function drawCurve(cv) {\n',
            '      const n = Math.max(2, cv.segments || 50);\n',
            '      const pts = [];\n',
            '      for (let i = 0; i <= n; i++) {\n',
            '        const p = curvePointAt(cv, i / n);\n',
            '        if (p) pts.push(p);\n',
            '      }\n',
            '      if (pts.length < 2) return;\n',
            '      ctx.beginPath();\n',
            '      const p0 = fieldToPixel(pts[0].x, pts[0].y);\n',
            '      ctx.moveTo(p0.x, p0.y);\n',
            '      for (let i = 1; i < pts.length; i++) { const p = fieldToPixel(pts[i].x, pts[i].y); ctx.lineTo(p.x, p.y); }\n',
            '      ctx.strokeStyle = cv.color || __gcDefaultColor();\n',
            '      ctx.lineWidth = cv.thickness || 2;\n',
            '      ctx.lineCap = \'round\';\n',
            '      ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function drawAxesGrid(step) {\n',
            '      if (window.coordinateSystem === \'polar\') drawPolarGrid(step); else drawCartesianGrid(step);\n',
            '    }\n',
            '    function glClampGridStep(step, span, maxLines) {\n',
            '      if (!(step > 0)) return 1;\n',
            '      if (span / step > maxLines) return span / maxLines;\n',
            '      return step;\n',
            '    }\n',
            '    function drawCartesianGrid(step) {\n',
            '      const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '      const xMin = Math.min(tl.x, br.x), xMax = Math.max(tl.x, br.x);\n',
            '      const yMin = Math.min(tl.y, br.y), yMax = Math.max(tl.y, br.y);\n',
            '      if (!(step > 0)) step = 1;\n',
            '      step = glClampGridStep(step, Math.max(xMax - xMin, yMax - yMin), 400);\n',
            '      ctx.save();\n',
            '      ctx.strokeStyle = \'rgba(0,0,0,0.15)\'; ctx.lineWidth = 1;\n',
            '      ctx.beginPath();\n',
            '      for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) { const p1 = fieldToPixel(x, yMin), p2 = fieldToPixel(x, yMax); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); }\n',
            '      for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) { const p1 = fieldToPixel(xMin, y), p2 = fieldToPixel(xMax, y); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); }\n',
            '      ctx.stroke();\n',
            '      ctx.strokeStyle = \'rgba(0,0,0,0.45)\'; ctx.lineWidth = 1.5;\n',
            '      ctx.beginPath();\n',
            '      const ax1 = fieldToPixel(xMin, 0), ax2 = fieldToPixel(xMax, 0);\n',
            '      ctx.moveTo(ax1.x, ax1.y); ctx.lineTo(ax2.x, ax2.y);\n',
            '      const ay1 = fieldToPixel(0, yMin), ay2 = fieldToPixel(0, yMax);\n',
            '      ctx.moveTo(ay1.x, ay1.y); ctx.lineTo(ay2.x, ay2.y);\n',
            '      ctx.stroke();\n',
            '      ctx.fillStyle = \'#555\'; ctx.font = \'10px sans-serif\';\n',
            '      ctx.textAlign = \'center\'; ctx.textBaseline = \'top\';\n',
            '      for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {\n',
            '        if (Math.abs(x) < step / 1000) continue;\n',
            '        const p = fieldToPixel(x, 0); ctx.fillText(String(Math.round(x * 100) / 100), p.x, p.y + 4);\n',
            '      }\n',
            '      ctx.textAlign = \'left\'; ctx.textBaseline = \'middle\';\n',
            '      for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) {\n',
            '        if (Math.abs(y) < step / 1000) continue;\n',
            '        const p = fieldToPixel(0, y); ctx.fillText(String(Math.round(y * 100) / 100), p.x + 4, p.y);\n',
            '      }\n',
            '      ctx.restore();\n',
            '    }\n',
            '    function drawPolarGrid(step) {\n',
            '      const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '      const xMin = Math.min(tl.x, br.x), xMax = Math.max(tl.x, br.x);\n',
            '      const yMin = Math.min(tl.y, br.y), yMax = Math.max(tl.y, br.y);\n',
            '      const maxR = Math.max(Math.abs(xMin), Math.abs(xMax), Math.abs(yMin), Math.abs(yMax));\n',
            '      if (!(step > 0)) step = 1;\n',
            '      step = glClampGridStep(step, maxR, 200);\n',
            '      ctx.save();\n',
            '      ctx.strokeStyle = \'rgba(0,0,0,0.15)\'; ctx.lineWidth = 1;\n',
            '      for (let r = step; r <= maxR; r += step) {\n',
            '        ctx.beginPath();\n',
            '        const N = 72;\n',
            '        for (let i = 0; i <= N; i++) {\n',
            '          const ang = i / N * 2 * Math.PI;\n',
            '          const p = fieldToPixel(r * Math.cos(ang), r * Math.sin(ang));\n',
            '          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);\n',
            '        }\n',
            '        ctx.stroke();\n',
            '      }\n',
            '      for (let deg = 0; deg < 360; deg += 30) {\n',
            '        const ang = deg * Math.PI / 180;\n',
            '        const p1 = fieldToPixel(0, 0), p2 = fieldToPixel(maxR * Math.cos(ang), maxR * Math.sin(ang));\n',
            '        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();\n',
            '      }\n',
            '      ctx.strokeStyle = \'rgba(0,0,0,0.45)\'; ctx.lineWidth = 1.5;\n',
            '      ctx.beginPath();\n',
            '      const ax1 = fieldToPixel(xMin, 0), ax2 = fieldToPixel(xMax, 0);\n',
            '      ctx.moveTo(ax1.x, ax1.y); ctx.lineTo(ax2.x, ax2.y);\n',
            '      const ay1 = fieldToPixel(0, yMin), ay2 = fieldToPixel(0, yMax);\n',
            '      ctx.moveTo(ay1.x, ay1.y); ctx.lineTo(ay2.x, ay2.y);\n',
            '      ctx.stroke();\n',
            '      ctx.fillStyle = \'#555\'; ctx.font = \'10px sans-serif\';\n',
            '      ctx.textAlign = \'center\'; ctx.textBaseline = \'top\';\n',
            '      for (let r = step; r <= maxR; r += step) {\n',
            '        const p = fieldToPixel(r, 0);\n',
            '        ctx.fillText(\'r=\' + (Math.round(r * 100) / 100), p.x, p.y + 4);\n',
            '      }\n',
            '      ctx.textAlign = \'center\'; ctx.textBaseline = \'middle\';\n',
            '      for (let deg = 0; deg < 360; deg += 30) {\n',
            '        const ang = deg * Math.PI / 180;\n',
            '        const p = fieldToPixel(maxR * 1.06 * Math.cos(ang), maxR * 1.06 * Math.sin(ang));\n',
            '        ctx.fillText(deg + \'\\u00b0\', p.x, p.y);\n',
            '      }\n',
            '      ctx.restore();\n',
            '    }\n',
            '\n',
            '    function drawFunctionGraph(d) {\n',
            '      if (!GL_USER_FUNCS[d.funcName]) return;\n',
            '      if (d.grid) drawAxesGrid(d.gridStep || 1);\n',
            '      const pts = [];\n',
            '      for (let i = 0; i <= d.segments; i++) {\n',
            '        const x = d.xmin + (d.xmax - d.xmin) * i / d.segments;\n',
            '        let y;\n',
            '        try { y = glCallUserFunc(d.funcName, [x]); } catch (e) { y = NaN; }\n',
            '        pts.push((typeof y === \'number\' && isFinite(y)) ? { x, y } : null);\n',
            '      }\n',
            '      ctx.strokeStyle = d.color || __gcDefaultColor();\n',
            '      ctx.lineWidth = d.thickness || 2;\n',
            '      ctx.lineCap = \'round\';\n',
            '      ctx.beginPath();\n',
            '      let started = false;\n',
            '      let prevPix = null;\n',
            '      for (let p of pts) {\n',
            '        if (!p) { started = false; prevPix = null; continue; }\n',
            '        const pix = fieldToPixel(p.x, p.y);\n',
            '        // разрыв на асимптоте: скачок больше трёх высот экрана между соседними сэмплами\n',
            '        if (prevPix && Math.abs(pix.y - prevPix.y) > height * 3) started = false;\n',
            '        if (!started) { ctx.moveTo(pix.x, pix.y); started = true; } else { ctx.lineTo(pix.x, pix.y); }\n',
            '        prevPix = pix;\n',
            '      }\n',
            '      ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function hexToRgbSurface(hex) {\n',
            '      hex = String(hex || \'#4a90d9\').replace(\'#\', \'\');\n',
            '      if (hex.length === 3) hex = hex.split(\'\').map(c => c + c).join(\'\');\n',
            '      const num = parseInt(hex, 16) || 0x4a90d9;\n',
            '      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };\n',
            '    }\n',
            '    function drawSurfaceContour(d, xs, ys, Z, zmin, zmax) {\n',
            '      if (!isFinite(zmin) || !isFinite(zmax)) return;\n',
            '      const hasSingleLevel = d.level !== null && d.level !== undefined;\n',
            '      if (!hasSingleLevel && zmax - zmin < 1e-12) return;\n',
            '      const levelList = [];\n',
            '      if (hasSingleLevel) levelList.push(d.level);\n',
            '      else { const levels = Math.max(1, Math.floor(d.levels || 8)); for (let L = 1; L < levels + 1; L++) levelList.push(zmin + (zmax - zmin) * L / (levels + 1)); }\n',
            '      ctx.strokeStyle = d.color || __gcDefaultColor();\n',
            '      ctx.lineWidth = hasSingleLevel ? 2 : 1.2;\n',
            '      for (const level of levelList) {\n',
            '        ctx.beginPath();\n',
            '        for (let j = 0; j < ys.length - 1; j++) {\n',
            '          for (let i = 0; i < xs.length - 1; i++) {\n',
            '            const z00 = Z[j][i], z10 = Z[j][i + 1], z01 = Z[j + 1][i], z11 = Z[j + 1][i + 1];\n',
            '            if (![z00, z10, z01, z11].every(isFinite)) continue;\n',
            '            const corners = [\n',
            '              { x: xs[i], y: ys[j], z: z00 }, { x: xs[i + 1], y: ys[j], z: z10 },\n',
            '              { x: xs[i + 1], y: ys[j + 1], z: z11 }, { x: xs[i], y: ys[j + 1], z: z01 },\n',
            '            ];\n',
            '            const edgePts = [];\n',
            '            for (let k = 0; k < 4; k++) {\n',
            '              const a = corners[k], b = corners[(k + 1) % 4];\n',
            '              if ((a.z - level) * (b.z - level) < 0) {\n',
            '                const t = (level - a.z) / (b.z - a.z);\n',
            '                edgePts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });\n',
            '              }\n',
            '            }\n',
            '            if (edgePts.length === 2 || edgePts.length === 4) {\n',
            '              for (let k = 0; k + 1 < edgePts.length; k += 2) {\n',
            '                const p0 = fieldToPixel(edgePts[k].x, edgePts[k].y);\n',
            '                const p1 = fieldToPixel(edgePts[k + 1].x, edgePts[k + 1].y);\n',
            '                ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);\n',
            '              }\n',
            '            }\n',
            '          }\n',
            '        }\n',
            '        ctx.stroke();\n',
            '      }\n',
            '    }\n',
            '    function drawSurface3D(d, xs, ys, Z, zmin, zmax) {\n',
            '      if (!isFinite(zmin) || !isFinite(zmax)) return;\n',
            '      const zrange = Math.max(1e-9, zmax - zmin);\n',
            '      const isoAngle = ((d.angle === undefined || d.angle === null) ? 30 : d.angle) * Math.PI / 180;\n',
            '      const heightScale = (0.5 * Math.min(FIELD_WIDTH, FIELD_HEIGHT)) / zrange;\n',
            '      const project = (x, y, z) => {\n',
            '        const zz = isFinite(z) ? z : zmin;\n',
            '        return {\n',
            '          x: (x - y) * Math.cos(isoAngle),\n',
            '          y: (x + y) * Math.sin(isoAngle) - (zz - zmin) * heightScale * 0.6,\n',
            '        };\n',
            '      };\n',
            '      const rgb = hexToRgbSurface(d.color);\n',
            '      const quads = [];\n',
            '      for (let j = 0; j < ys.length - 1; j++) {\n',
            '        for (let i = 0; i < xs.length - 1; i++) {\n',
            '          const z00 = Z[j][i], z10 = Z[j][i + 1], z01 = Z[j + 1][i], z11 = Z[j + 1][i + 1];\n',
            '          if (![z00, z10, z01, z11].every(isFinite)) continue;\n',
            '          const avgZ = (z00 + z10 + z01 + z11) / 4;\n',
            '          const dzdx = z10 - z00, dzdy = z01 - z00;\n',
            '          const shade = Math.max(0.25, Math.min(1, 0.65 - dzdx * 0.15 - dzdy * 0.15 + (avgZ - zmin) / zrange * 0.3));\n',
            '          quads.push({ depth: xs[i] + ys[j], i, j, z00, z10, z01, z11, shade });\n',
            '        }\n',
            '      }\n',
            '      quads.sort((a, b) => a.depth - b.depth);\n',
            '      for (let q of quads) {\n',
            '        const p00 = fieldToPixel_(project(xs[q.i], ys[q.j], q.z00));\n',
            '        const p10 = fieldToPixel_(project(xs[q.i + 1], ys[q.j], q.z10));\n',
            '        const p11 = fieldToPixel_(project(xs[q.i + 1], ys[q.j + 1], q.z11));\n',
            '        const p01 = fieldToPixel_(project(xs[q.i], ys[q.j + 1], q.z01));\n',
            '        ctx.beginPath();\n',
            '        ctx.moveTo(p00.x, p00.y); ctx.lineTo(p10.x, p10.y); ctx.lineTo(p11.x, p11.y); ctx.lineTo(p01.x, p01.y); ctx.closePath();\n',
            '        ctx.fillStyle = \'rgb(\' + Math.round(rgb.r * q.shade) + \',\' + Math.round(rgb.g * q.shade) + \',\' + Math.round(rgb.b * q.shade) + \')\';\n',
            '        ctx.fill();\n',
            '        ctx.strokeStyle = \'rgba(0,0,0,0.15)\'; ctx.lineWidth = 0.5; ctx.stroke();\n',
            '      }\n',
            '    }\n',
            '    function fieldToPixel_(pt) { return fieldToPixel(pt.x, pt.y); }\n',
            '    function drawSurface(d) {\n',
            '      if (!GL_USER_FUNCS[d.funcName]) return;\n',
            '      const n = d.grid;\n',
            '      const xs = [], ys = [];\n',
            '      for (let i = 0; i <= n; i++) { xs.push(d.xmin + (d.xmax - d.xmin) * i / n); ys.push(d.ymin + (d.ymax - d.ymin) * i / n); }\n',
            '      const Z = []; let zmin = Infinity, zmax = -Infinity;\n',
            '      for (let j = 0; j <= n; j++) {\n',
            '        const row = [];\n',
            '        for (let i = 0; i <= n; i++) {\n',
            '          let z;\n',
            '          try { z = glCallUserFunc(d.funcName, [xs[i], ys[j]]); } catch (e) { z = NaN; }\n',
            '          if (typeof z !== \'number\' || !isFinite(z)) z = NaN;\n',
            '          else { if (z < zmin) zmin = z; if (z > zmax) zmax = z; }\n',
            '          row.push(z);\n',
            '        }\n',
            '        Z.push(row);\n',
            '      }\n',
            '      if (d.mode === \'3d\') drawSurface3D(d, xs, ys, Z, zmin, zmax);\n',
            '      else drawSurfaceContour(d, xs, ys, Z, zmin, zmax);\n',
            '    }\n',
            '\n',
            '    function drawImageElement(d) {\n',
            '      if (!d.loaded || !d.img) return;\n',
            '      const center = fieldToPixel(d.posPoint.pos.x, d.posPoint.pos.y);\n',
            '      const scale = fieldScale();\n',
            '      const wPix = d.width * scale, hPix = d.height * scale;\n',
            '      ctx.save();\n',
            '      ctx.globalAlpha = Math.max(0, Math.min(1, d.opacity));\n',
            '      ctx.drawImage(d.img, center.x - wPix / 2, center.y - hPix / 2, wPix, hPix);\n',
            '      ctx.restore();\n',
            '    }\n',
            '\n',
            '    function drawHistogram(d) {\n',
            '      let data;\n',
            '      try { data = evaluate(d.dataExpr); } catch (e) { return; }\n',
            '      if (!Array.isArray(data) || data.length === 0) return;\n',
            '      const bins = d.bins;\n',
            '      let dmin = Infinity, dmax = -Infinity;\n',
            '      for (let v of data) { if (typeof v === \'number\' && isFinite(v)) { if (v < dmin) dmin = v; if (v > dmax) dmax = v; } }\n',
            '      if (!isFinite(dmin)) return;\n',
            '      const range = (dmax - dmin) || 1;\n',
            '      const counts = new Array(bins).fill(0);\n',
            '      for (let v of data) {\n',
            '        if (typeof v !== \'number\' || !isFinite(v)) continue;\n',
            '        let idx = Math.floor((v - dmin) / range * bins);\n',
            '        if (idx >= bins) idx = bins - 1; if (idx < 0) idx = 0;\n',
            '        counts[idx]++;\n',
            '      }\n',
            '      let maxCount = 1;\n',
            '      for (let c of counts) if (c > maxCount) maxCount = c;\n',
            '      const chartX = 20, chartBottom = height - 20, chartW = width * 0.4, chartH = height * 0.3;\n',
            '      const barW = chartW / bins;\n',
            '      ctx.save();\n',
            '      ctx.fillStyle = d.color || \'#4a90d9\';\n',
            '      for (let i = 0; i < bins; i++) {\n',
            '        const barH = (counts[i] / maxCount) * chartH;\n',
            '        ctx.fillRect(chartX + i * barW, chartBottom - barH, Math.max(1, barW - 1), barH);\n',
            '      }\n',
            '      ctx.strokeStyle = \'#333333\'; ctx.lineWidth = 1;\n',
            '      ctx.strokeRect(chartX, chartBottom - chartH, chartW, chartH);\n',
            '      ctx.fillStyle = \'#333333\'; ctx.font = \'10px sans-serif\'; ctx.textAlign = \'left\'; ctx.textBaseline = \'top\';\n',
            '      ctx.fillText(dmin.toFixed(2) + \' .. \' + dmax.toFixed(2) + \'  (n=\' + data.length + \')\', chartX, chartBottom + 2);\n',
            '      ctx.restore();\n',
            '    }\n',
            '\n',
            '    function drawField(d) {\n',
            '      const nGrid = Math.max(1, d.grid || 15);\n',
            '      const stepX = (d.xmax - d.xmin) / nGrid, stepY = (d.ymax - d.ymin) / nGrid;\n',
            '      const cellSize = Math.min(Math.abs(stepX), Math.abs(stepY));\n',
            '      ctx.save();\n',
            '      ctx.strokeStyle = d.color || \'#888888\'; ctx.lineWidth = 1;\n',
            '      for (let i = 0; i <= nGrid; i++) {\n',
            '        for (let j = 0; j <= nGrid; j++) {\n',
            '          const x = d.xmin + i * stepX, y = d.ymin + j * stepY;\n',
            '          let px, py;\n',
            '          try { px = evaluate(d.pExpr, { x, y }); py = evaluate(d.qExpr, { x, y }); } catch (e) { continue; }\n',
            '          if (typeof px !== \'number\' || typeof py !== \'number\' || !isFinite(px) || !isFinite(py)) continue;\n',
            '          const mag = Math.hypot(px, py);\n',
            '          if (mag < 1e-9) continue;\n',
            '          const arrowLen = cellSize * 0.4 * (d.scale || 1);\n',
            '          const dx = px / mag * arrowLen, dy = py / mag * arrowLen;\n',
            '          const p1 = fieldToPixel(x - dx / 2, y - dy / 2);\n',
            '          const p2 = fieldToPixel(x + dx / 2, y + dy / 2);\n',
            '          const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);\n',
            '          const headLen = 4;\n',
            '          ctx.beginPath();\n',
            '          ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);\n',
            '          ctx.lineTo(p2.x - headLen * Math.cos(ang - Math.PI / 6), p2.y - headLen * Math.sin(ang - Math.PI / 6));\n',
            '          ctx.moveTo(p2.x, p2.y);\n',
            '          ctx.lineTo(p2.x - headLen * Math.cos(ang + Math.PI / 6), p2.y - headLen * Math.sin(ang + Math.PI / 6));\n',
            '          ctx.stroke();\n',
            '        }\n',
            '      }\n',
            '      ctx.restore();\n',
            '    }\n',
            '\n',
            '    function computeTrajectoryPoints(d) {\n',
            '      const dt = d.dt || 0.05;\n',
            '      const steps = d.steps || 200;\n',
            '      let system;\n',
            '      if (d.systemName) {\n',
            '        system = glMakeFuncWrapper(d.systemName);\n',
            '      } else {\n',
            '        const pExpr = d.field ? d.field.pExpr : d.pExpr;\n',
            '        const qExpr = d.field ? d.field.qExpr : d.qExpr;\n',
            '        system = (t, x, y) => {\n',
            '          let px, py;\n',
            '          try { px = evaluate(pExpr, { x, y }); py = evaluate(qExpr, { x, y }); } catch (e) { return [NaN, NaN]; }\n',
            '          if (typeof px !== \'number\' || typeof py !== \'number\') return [NaN, NaN];\n',
            '          return [px, py];\n',
            '        };\n',
            '      }\n',
            '      let result;\n',
            '      try { result = glOdeSolve(system, [d.start[0], d.start[1]], [0, steps * dt], steps); }\n',
            '      catch (e) { return [{ x: d.start[0], y: d.start[1] }]; }\n',
            '      const pts = [];\n',
            '      for (let s of result) {\n',
            '        if (!isFinite(s[0]) || !isFinite(s[1])) break;\n',
            '        pts.push({ x: s[0], y: s[1] });\n',
            '      }\n',
            '      return pts;\n',
            '    }\n',
            '    function drawTrajectory(d) {\n',
            '      const pts = computeTrajectoryPoints(d);\n',
            '      if (pts.length < 2) return;\n',
            '      ctx.save();\n',
            '      ctx.strokeStyle = d.color || \'#ff0000\'; ctx.lineWidth = d.thickness || 2; ctx.lineCap = \'round\';\n',
            '      ctx.beginPath();\n',
            '      const p0 = fieldToPixel(pts[0].x, pts[0].y);\n',
            '      ctx.moveTo(p0.x, p0.y);\n',
            '      for (let i = 1; i < pts.length; i++) { const p = fieldToPixel(pts[i].x, pts[i].y); ctx.lineTo(p.x, p.y); }\n',
            '      ctx.stroke();\n',
            '      ctx.restore();\n',
            '    }\n',
            '\n',
            '\n',
            '// ---- draw Fractal: эскейп-тайм фракталы (Мандельброт / Жюлиа / «Горящий корабль») ----\n',
            '// Кэш инвалидируется при изменении камеры, параметров или размеров холста, поэтому\n',
            '// перетаскивание точки, к которой привязан cRe/cIm фрактала Жюлиа, анимирует фрактал вживую.\n',
            'function glHslToRgb(h, s, l) {\n',
            '    const c = (1 - Math.abs(2 * l - 1)) * s;\n',
            '    const hp = (((h % 360) + 360) % 360) / 60;\n',
            '    const x = c * (1 - Math.abs(hp % 2 - 1));\n',
            '    let r = 0, g = 0, b = 0;\n',
            '    if (hp < 1) { r = c; g = x; } else if (hp < 2) { r = x; g = c; }\n',
            '    else if (hp < 3) { g = c; b = x; } else if (hp < 4) { g = x; b = c; }\n',
            '    else if (hp < 5) { r = x; b = c; } else { r = c; b = x; }\n',
            '    const m = l - c / 2;\n',
            '    return [Math.round(255 * (r + m)), Math.round(255 * (g + m)), Math.round(255 * (b + m))];\n',
            '}\n',
            'function fractalPalette(name, t) {\n',
            '    if (name === \'gray\') { const v = Math.round(255 * t); return [v, v, v]; }\n',
            '    if (name === \'fire\') {\n',
            '        return [Math.round(255 * Math.min(1, t * 2.2)),\n',
            '                Math.round(255 * Math.max(0, Math.min(1, t * 2 - 0.45))),\n',
            '                Math.round(255 * Math.max(0, t * 4 - 3))];\n',
            '    }\n',
            '    if (name === \'rainbow\') return glHslToRgb(360 * t, 0.9, 0.5);\n',
            '    // ocean (по умолчанию)\n',
            '    return [Math.round(15 + 90 * t), Math.round(45 + 160 * t), Math.round(110 + 145 * t)];\n',
            '}\n',
            'function drawFractal(d) {\n',
            '    const q = Math.max(1, Math.floor(d.quality || 2));\n',
            '    const w = Math.max(2, Math.floor(width / q)), h = Math.max(2, Math.floor(height / q));\n',
            '    let cRe = 0, cIm = 0;\n',
            '    if (d.type === \'julia\') {\n',
            '        const rV = evaluate(d.cReExpr), iV = evaluate(d.cImExpr);\n',
            '        cRe = (typeof rV === \'number\' && isFinite(rV)) ? rV : -0.7;\n',
            '        cIm = (typeof iV === \'number\' && isFinite(iV)) ? iV : 0.27015;\n',
            '    }\n',
            '    const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '    const key = [d.type, cRe.toFixed(6), cIm.toFixed(6), d.maxIter, d.palette, w, h,\n',
            '        tl.x.toFixed(6), tl.y.toFixed(6), br.x.toFixed(6), br.y.toFixed(6)].join(\'|\');\n',
            '    if (!d._cache || d._cacheKey !== key) {\n',
            '        const off = document.createElement(\'canvas\'); off.width = w; off.height = h;\n',
            '        const octx = off.getContext(\'2d\');\n',
            '        const imgData = octx.createImageData(w, h);\n',
            '        const data = imgData.data;\n',
            '        const maxIter = Math.max(5, Math.floor(d.maxIter || 80));\n',
            '        for (let py = 0; py < h; py++) {\n',
            '            const y0 = tl.y + (br.y - tl.y) * (py + 0.5) / h;\n',
            '            for (let px = 0; px < w; px++) {\n',
            '                const x0 = tl.x + (br.x - tl.x) * (px + 0.5) / w;\n',
            '                let zx, zy, cx, cy;\n',
            '                if (d.type === \'julia\') { zx = x0; zy = y0; cx = cRe; cy = cIm; }\n',
            '                else { zx = 0; zy = 0; cx = x0; cy = y0; }\n',
            '                let iter = 0;\n',
            '                while (iter < maxIter && zx * zx + zy * zy <= 4) {\n',
            '                    let nx, ny;\n',
            '                    if (d.type === \'burningship\') {\n',
            '                        const ax = Math.abs(zx), ay = Math.abs(zy);\n',
            '                        nx = ax * ax - ay * ay + cx; ny = 2 * ax * ay + cy;\n',
            '                    } else {\n',
            '                        nx = zx * zx - zy * zy + cx; ny = 2 * zx * zy + cy;\n',
            '                    }\n',
            '                    zx = nx; zy = ny; iter++;\n',
            '                }\n',
            '                const idx = (py * w + px) * 4;\n',
            '                if (iter >= maxIter) { data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; data[idx + 3] = 255; }\n',
            '                else {\n',
            '                    const mag = Math.sqrt(zx * zx + zy * zy);\n',
            '                    const smooth = iter + 1 - Math.log(Math.log(Math.max(mag, 1.0000001))) / Math.LN2;\n',
            '                    const t = Math.min(0.999, Math.max(0, smooth / maxIter));\n',
            '                    const rgb = fractalPalette(d.palette, t);\n',
            '                    data[idx] = rgb[0]; data[idx + 1] = rgb[1]; data[idx + 2] = rgb[2]; data[idx + 3] = 255;\n',
            '                }\n',
            '            }\n',
            '        }\n',
            '        octx.putImageData(imgData, 0, 0);\n',
            '        d._cache = off; d._cacheKey = key;\n',
            '    }\n',
            '    ctx.save();\n',
            '    ctx.globalAlpha = Math.max(0, Math.min(1, (d.opacity === undefined || d.opacity === null) ? 1 : d.opacity));\n',
            '    ctx.imageSmoothingEnabled = q > 1;\n',
            '    ctx.drawImage(d._cache, 0, 0, width, height);\n',
            '    ctx.restore();\n',
            '}\n',
            '\n',
            '    // ---- draw Region: заливка области, заданной неравенством ----\n',
            '    // Рендерится в offscreen-канву пониженного разрешения и растягивается,\n',
            '    // кэш инвалидируется при смене камеры/параметров.\n',
            '    function glRegionTest(op, v, level) {\n',
            '        if (typeof v !== \'number\' || !isFinite(v)) return false;\n',
            '        if (op === \'<\') return v < level;\n',
            '        if (op === \'<=\') return v <= level;\n',
            '        if (op === \'>\') return v > level;\n',
            '        return v >= level;\n',
            '    }\n',
            '    function drawRegion(d) {\n',
            '        if (!GL_USER_FUNCS[d.funcName]) return;\n',
            '        const q = Math.max(1, Math.floor(d.quality || 3));\n',
            '        const w = Math.max(2, Math.floor(width / q)), h = Math.max(2, Math.floor(height / q));\n',
            '        const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '        const key = [d.funcName, d.op, d.level, d.func2Name, d.op2, d.level2, d.combine, w, h,\n',
            '            tl.x.toFixed(5), tl.y.toFixed(5), br.x.toFixed(5), br.y.toFixed(5), d.color, glUserFuncVersion].join(\'|\');\n',
            '        if (!d._cache || d._cacheKey !== key) {\n',
            '            const off = document.createElement(\'canvas\');\n',
            '            off.width = w; off.height = h;\n',
            '            const octx = off.getContext(\'2d\');\n',
            '            const img = octx.createImageData(w, h);\n',
            '            const data = img.data;\n',
            '            const rgb = hexToRgbSurface(d.color || \'#4a90d9\');\n',
            '            const has2 = !!(d.func2Name && GL_USER_FUNCS[d.func2Name]);\n',
            '            for (let py = 0; py < h; py++) {\n',
            '                const fy = tl.y + (br.y - tl.y) * (py + 0.5) / h;\n',
            '                for (let px = 0; px < w; px++) {\n',
            '                    const fx = tl.x + (br.x - tl.x) * (px + 0.5) / w;\n',
            '                    let ok;\n',
            '                    try {\n',
            '                        ok = glRegionTest(d.op, glCallUserFunc(d.funcName, [fx, fy]), d.level);\n',
            '                        if (has2) {\n',
            '                            const ok2 = glRegionTest(d.op2, glCallUserFunc(d.func2Name, [fx, fy]), d.level2);\n',
            '                            ok = (d.combine === \'or\') ? (ok || ok2) : (ok && ok2);\n',
            '                        }\n',
            '                    } catch (e) { ok = false; }\n',
            '                    if (ok) {\n',
            '                        const i4 = (py * w + px) * 4;\n',
            '                        data[i4] = rgb.r; data[i4 + 1] = rgb.g; data[i4 + 2] = rgb.b; data[i4 + 3] = 255;\n',
            '                    }\n',
            '                }\n',
            '            }\n',
            '            octx.putImageData(img, 0, 0);\n',
            '            d._cache = off; d._cacheKey = key;\n',
            '        }\n',
            '        ctx.save();\n',
            '        ctx.globalAlpha = Math.max(0, Math.min(1, d.opacity === undefined ? 0.35 : d.opacity));\n',
            '        ctx.imageSmoothingEnabled = false;\n',
            '        ctx.drawImage(d._cache, 0, 0, width, height);\n',
            '        ctx.restore();\n',
            '        // граница области — изолиния f = level\n',
            '        if (d.border) {\n',
            '            const gridN = 90;\n',
            '            const xs = [], ys = [];\n',
            '            for (let i = 0; i <= gridN; i++) {\n',
            '                xs.push(tl.x + (br.x - tl.x) * i / gridN);\n',
            '                ys.push(tl.y + (br.y - tl.y) * i / gridN);\n',
            '            }\n',
            '            const Z = [];\n',
            '            for (let j = 0; j <= gridN; j++) {\n',
            '                const row = [];\n',
            '                for (let i = 0; i <= gridN; i++) {\n',
            '                    let v;\n',
            '                    try { v = glCallUserFunc(d.funcName, [xs[i], ys[j]]); } catch (e) { v = NaN; }\n',
            '                    row.push(v);\n',
            '                }\n',
            '                Z.push(row);\n',
            '            }\n',
            '            drawSurfaceContour({ color: d.color, level: d.level, levels: 1 }, xs, ys, Z, d.level - 1, d.level + 1);\n',
            '        }\n',
            '    }\n',
            '\n',
            '    // ---- draw Locus: геометрическое место точек ----\n',
            '    // Ведущая точка (driver) пробегает свой параметр t, сцена пересчитывается,\n',
            '    // траектория зависимой точки запоминается. Пересчёт только при изменении сцены.\n',
            '    function glLocusStateKey(d, tracked, driver) {\n',
            '        const parts = [];\n',
            '        for (const p of points) {\n',
            '            if (p === driver || p === tracked) continue;\n',
            '            parts.push(p.pos.x.toFixed(4), p.pos.y.toFixed(4));\n',
            '        }\n',
            '        parts.push(String(d.samples), String(d.from), String(d.to), String(glUserFuncVersion));\n',
            '        return parts.join(\',\');\n',
            '    }\n',
            '    function drawLocus(d) {\n',
            '        const tracked = points.find(p => p.name === d.pointName);\n',
            '        const driver = points.find(p => p.name === d.driverName);\n',
            '        if (!tracked || !driver) return;\n',
            '        const driverParam = driver.lineName || driver.circleName || driver.ellipseName ||\n',
            '                            driver.curveName || driver.arcName || driver.graphName;\n',
            '        const key = glLocusStateKey(d, tracked, driver);\n',
            '        if (!d._pts || d._key !== key) {\n',
            '            const pts = [];\n',
            '            const n = Math.max(2, Math.min(2000, Math.floor(d.samples || 200)));\n',
            '            if (driverParam) {\n',
            '                const savedT = driver.t;\n',
            '                glLocusSweeping = true;\n',
            '                for (let i = 0; i <= n; i++) {\n',
            '                    driver.t = d.from + (d.to - d.from) * i / n;\n',
            '                    updateScene();\n',
            '                    if (isFinite(tracked.pos.x) && isFinite(tracked.pos.y)) {\n',
            '                        pts.push({ x: tracked.pos.x, y: tracked.pos.y });\n',
            '                    }\n',
            '                }\n',
            '                driver.t = savedT;\n',
            '                glLocusSweeping = false;\n',
            '                updateScene();\n',
            '            }\n',
            '            d._pts = pts; d._key = key;\n',
            '        }\n',
            '        if (!d._pts.length) return;\n',
            '        ctx.save();\n',
            '        ctx.strokeStyle = d.color || \'#d9534f\';\n',
            '        ctx.lineWidth = d.thickness || 2;\n',
            '        if (d.dashed) ctx.setLineDash([6, 5]);\n',
            '        ctx.beginPath();\n',
            '        let started = false, prev = null;\n',
            '        for (const p of d._pts) {\n',
            '            const pix = fieldToPixel(p.x, p.y);\n',
            '            if (prev && Math.hypot(pix.x - prev.x, pix.y - prev.y) > Math.max(width, height)) started = false;\n',
            '            if (!started) { ctx.moveTo(pix.x, pix.y); started = true; } else { ctx.lineTo(pix.x, pix.y); }\n',
            '            prev = pix;\n',
            '        }\n',
            '        ctx.stroke();\n',
            '        ctx.setLineDash([]);\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- draw Trace: след точки во времени ----\n',
            '    function updateTraces() {\n',
            '        for (const d of drawTraces) {\n',
            '            if (!d.active) continue;\n',
            '            const p = points.find(q => q.name === d.pointName);\n',
            '            if (!p) continue;\n',
            '            if (!d._pts) d._pts = [];\n',
            '            const last = d._pts[d._pts.length - 1];\n',
            '            if (!last || Math.hypot(p.pos.x - last.x, p.pos.y - last.y) >= (d.minDist || 0.05)) {\n',
            '                d._pts.push({ x: p.pos.x, y: p.pos.y });\n',
            '                const cap = Math.max(2, Math.floor(d.maxPoints || 400));\n',
            '                while (d._pts.length > cap) d._pts.shift();\n',
            '            }\n',
            '        }\n',
            '    }\n',
            '    function drawTrace(d) {\n',
            '        if (!d._pts || d._pts.length < 2) return;\n',
            '        ctx.save();\n',
            '        ctx.lineWidth = d.thickness || 2;\n',
            '        ctx.lineCap = \'round\';\n',
            '        if (d.fade) {\n',
            '            for (let i = 1; i < d._pts.length; i++) {\n',
            '                const a = fieldToPixel(d._pts[i - 1].x, d._pts[i - 1].y);\n',
            '                const b = fieldToPixel(d._pts[i].x, d._pts[i].y);\n',
            '                ctx.globalAlpha = i / d._pts.length;\n',
            '                ctx.strokeStyle = d.color || \'#0275d8\';\n',
            '                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();\n',
            '            }\n',
            '        } else {\n',
            '            ctx.strokeStyle = d.color || \'#0275d8\';\n',
            '            ctx.beginPath();\n',
            '            for (let i = 0; i < d._pts.length; i++) {\n',
            '                const pix = fieldToPixel(d._pts[i].x, d._pts[i].y);\n',
            '                if (i === 0) ctx.moveTo(pix.x, pix.y); else ctx.lineTo(pix.x, pix.y);\n',
            '            }\n',
            '            ctx.stroke();\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '    function clearTrace(name) {\n',
            '        for (const d of drawTraces) if (!name || d.name === name) d._pts = [];\n',
            '    }\n',
            '\n',
            '    // ---- draw Formula: LaTeX поверх холста ----\n',
            '    // Canvas не умеет рендерить LaTeX, поэтому формулы живут в HTML-слое,\n',
            '    // позиционируемом по координатам поля на каждом кадре.\n',
            '    function initDrawFormulas() {\n',
            '        drawFormulas = drawFormulasData.map(d => ({ ...d, _el: null, _lastTex: null }));\n',
            '    }\n',
            '    function updateFormulas() {\n',
            '        if (typeof uiOverlay === \'undefined\' || !uiOverlay) return;\n',
            '        for (const d of drawFormulas) {\n',
            '            let visible = d.active;\n',
            '            if (visible && !d._el) {\n',
            '                const el = document.createElement(\'div\');\n',
            '                el.style.position = \'absolute\';\n',
            '                el.style.pointerEvents = \'none\';\n',
            '                el.style.whiteSpace = \'nowrap\';\n',
            '                el.style.transformOrigin = \'center center\';\n',
            '                uiOverlay.appendChild(el);\n',
            '                d._el = el;\n',
            '            }\n',
            '            if (!d._el) continue;\n',
            '            if (!visible) { d._el.style.display = \'none\'; continue; }\n',
            '            let tex, fx, fy;\n',
            '            try {\n',
            '                tex = evaluate(d.latexExpr);\n',
            '                fx = evaluate(d.posXExpr);\n',
            '                fy = evaluate(d.posYExpr);\n',
            '            } catch (e) { d._el.style.display = \'none\'; continue; }\n',
            '            if (typeof fx !== \'number\' || typeof fy !== \'number\' || !isFinite(fx) || !isFinite(fy)) {\n',
            '                d._el.style.display = \'none\'; continue;\n',
            '            }\n',
            '            d._el.style.display = \'block\';\n',
            '            const texStr = String(tex === undefined || tex === null ? \'\' : tex);\n',
            '            if (texStr !== d._lastTex) {\n',
            '                if (typeof katex !== \'undefined\' && katex.renderToString) {\n',
            '                    try {\n',
            '                        d._el.innerHTML = katex.renderToString(texStr, {\n',
            '                            throwOnError: false, displayMode: !!d.display\n',
            '                        });\n',
            '                    } catch (e) { d._el.textContent = texStr; }\n',
            '                } else {\n',
            '                    d._el.textContent = texStr; // KaTeX не загрузился — показываем как текст\n',
            '                }\n',
            '                d._lastTex = texStr;\n',
            '            }\n',
            '            const pix = fieldToPixel(fx, fy);\n',
            '            d._el.style.color = d.color || __gcDefaultColor();\n',
            '            d._el.style.background = d.bg && d.bg !== \'transparent\' ? d.bg : \'transparent\';\n',
            '            d._el.style.fontSize = (16 * (d.size || 1)) + \'px\';\n',
            '            d._el.style.zIndex = String(d.layer === undefined ? 60 : d.layer);\n',
            '            d._el.style.left = pix.x + \'px\';\n',
            '            d._el.style.top = pix.y + \'px\';\n',
            '            const shiftX = d.align === \'left\' ? \'0%\' : (d.align === \'right\' ? \'-100%\' : \'-50%\');\n',
            '            d._el.style.transform = \'translate(\' + shiftX + \', -50%)\';\n',
            '        }\n',
            '    }\n',
            '\n',
            '\n',
            '\n',
            '    // ---- Палитра для секторов/серий ----\n',
            '    function glChartColor(i, base) {\n',
            '        if (i === 0 && base) return base;\n',
            '        const rgb = glHslToRgb((i * 47 + 200) % 360, 0.55, 0.55);\n',
            '        return \'rgb(\' + rgb[0] + \',\' + rgb[1] + \',\' + rgb[2] + \')\';\n',
            '    }\n',
            '    function glChartPairs(raw) {\n',
            '        // Принимает [[x,y],...] либо [y1,y2,...] (тогда x — индекс)\n',
            '        const out = [];\n',
            '        if (!Array.isArray(raw)) return out;\n',
            '        for (let i = 0; i < raw.length; i++) {\n',
            '            const it = raw[i];\n',
            '            if (Array.isArray(it) && it.length >= 2) {\n',
            '                if (typeof it[0] === \'number\' && typeof it[1] === \'number\') out.push({ x: it[0], y: it[1] });\n',
            '            } else if (typeof it === \'number\') {\n',
            '                out.push({ x: i, y: it });\n',
            '            } else if (it && typeof it.x === \'number\' && typeof it.y === \'number\') {\n',
            '                out.push({ x: it.x, y: it.y });\n',
            '            }\n',
            '        }\n',
            '        return out;\n',
            '    }\n',
            '    function glChartNumbers(raw) {\n',
            '        const out = [];\n',
            '        if (!Array.isArray(raw)) return out;\n',
            '        for (const v of raw) if (typeof v === \'number\' && isFinite(v)) out.push(v);\n',
            '        return out;\n',
            '    }\n',
            '\n',
            '    function drawChart(d) {\n',
            '        let raw, labels = null;\n',
            '        try { raw = evaluate(d.dataExpr); } catch (e) { return; }\n',
            '        if (d.labelsExpr) { try { labels = evaluate(d.labelsExpr); } catch (e) { labels = null; } }\n',
            '        if (!Array.isArray(raw)) return;\n',
            '        if (d.type === \'scatter\' || d.type === \'line\') return drawChartXY(d, raw);\n',
            '        // bar / pie / box строятся в прямоугольнике\n',
            '        let ax = 0, ay = 0;\n',
            '        try {\n',
            '            if (d.posXExpr) ax = evaluate(d.posXExpr);\n',
            '            if (d.posYExpr) ay = evaluate(d.posYExpr);\n',
            '        } catch (e) { ax = 0; ay = 0; }\n',
            '        if (typeof ax !== \'number\' || !isFinite(ax)) ax = 0;\n',
            '        if (typeof ay !== \'number\' || !isFinite(ay)) ay = 0;\n',
            '        if (d.type === \'bar\') return drawChartBar(d, glChartNumbers(raw), labels, ax, ay);\n',
            '        if (d.type === \'pie\') return drawChartPie(d, glChartNumbers(raw), labels, ax, ay);\n',
            '        if (d.type === \'box\') return drawChartBox(d, raw, labels, ax, ay);\n',
            '    }\n',
            '\n',
            '    // Диаграмма рассеяния / ломаная — прямо в координатах поля\n',
            '    function drawChartXY(d, raw) {\n',
            '        const pts = glChartPairs(raw);\n',
            '        if (!pts.length) return;\n',
            '        ctx.save();\n',
            '        if (d.type === \'line\') {\n',
            '            ctx.strokeStyle = d.color || \'#4a90d9\';\n',
            '            ctx.lineWidth = 2;\n',
            '            ctx.beginPath();\n',
            '            for (let i = 0; i < pts.length; i++) {\n',
            '                const p = fieldToPixel(pts[i].x, pts[i].y);\n',
            '                if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);\n',
            '            }\n',
            '            ctx.stroke();\n',
            '        }\n',
            '        if (d.type === \'scatter\' || d.markers) {\n',
            '            ctx.fillStyle = d.color || \'#4a90d9\';\n',
            '            const r = Math.max(1, d.pointSize || 4);\n',
            '            for (const pt of pts) {\n',
            '                const p = fieldToPixel(pt.x, pt.y);\n',
            '                ctx.beginPath();\n',
            '                ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);\n',
            '                ctx.fill();\n',
            '            }\n',
            '        }\n',
            '        // Линия регрессии методом наименьших квадратов\n',
            '        if (d.regression && pts.length >= 2) {\n',
            '            let sx = 0, sy = 0, sxy = 0, sxx = 0;\n',
            '            for (const p of pts) { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; }\n',
            '            const n = pts.length;\n',
            '            const den = n * sxx - sx * sx;\n',
            '            if (Math.abs(den) > 1e-12) {\n',
            '                const slope = (n * sxy - sx * sy) / den;\n',
            '                const inter = (sy - slope * sx) / n;\n',
            '                let minX = pts[0].x, maxX = pts[0].x;\n',
            '                for (const p of pts) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; }\n',
            '                const a = fieldToPixel(minX, slope * minX + inter);\n',
            '                const b = fieldToPixel(maxX, slope * maxX + inter);\n',
            '                ctx.strokeStyle = \'#e8590c\';\n',
            '                ctx.lineWidth = 2;\n',
            '                ctx.setLineDash([7, 4]);\n',
            '                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();\n',
            '                ctx.setLineDash([]);\n',
            '            }\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    function drawChartBar(d, vals, labels, ax, ay) {\n',
            '        if (!vals.length) return;\n',
            '        const scale = fieldScale();\n',
            '        const origin = fieldToPixel(ax, ay);\n',
            '        const W = d.width * scale, H = d.height * scale;\n',
            '        let mx = 0;\n',
            '        for (const v of vals) if (Math.abs(v) > mx) mx = Math.abs(v);\n',
            '        if (mx < 1e-12) mx = 1;\n',
            '        const bw = W / vals.length;\n',
            '        ctx.save();\n',
            '        for (let i = 0; i < vals.length; i++) {\n',
            '            const h = (vals[i] / mx) * H;\n',
            '            const x = origin.x + i * bw;\n',
            '            ctx.fillStyle = glChartColor(i, d.color);\n',
            '            ctx.fillRect(x + bw * 0.12, origin.y - h, bw * 0.76, h);\n',
            '            if (d.showValues) {\n',
            '                ctx.fillStyle = \'#333333\';\n',
            '                ctx.font = \'11px sans-serif\';\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'bottom\';\n',
            '                ctx.fillText(String(Math.round(vals[i] * 100) / 100), x + bw / 2, origin.y - h - 3);\n',
            '            }\n',
            '            if (labels && labels[i] !== undefined) {\n',
            '                ctx.fillStyle = \'#333333\';\n',
            '                ctx.font = \'11px sans-serif\';\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'top\';\n',
            '                ctx.fillText(String(labels[i]), x + bw / 2, origin.y + 4);\n',
            '            }\n',
            '        }\n',
            '        if (d.showAxes) {\n',
            '            ctx.strokeStyle = \'#666666\';\n',
            '            ctx.lineWidth = 1.5;\n',
            '            ctx.beginPath();\n',
            '            ctx.moveTo(origin.x, origin.y - H);\n',
            '            ctx.lineTo(origin.x, origin.y);\n',
            '            ctx.lineTo(origin.x + W, origin.y);\n',
            '            ctx.stroke();\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    function drawChartPie(d, vals, labels, ax, ay) {\n',
            '        let total = 0;\n',
            '        for (const v of vals) total += Math.abs(v);\n',
            '        if (total < 1e-12) return;\n',
            '        const scale = fieldScale();\n',
            '        const c = fieldToPixel(ax, ay);\n',
            '        const R = d.radius * scale;\n',
            '        let a0 = -Math.PI / 2;\n',
            '        ctx.save();\n',
            '        for (let i = 0; i < vals.length; i++) {\n',
            '            const frac = Math.abs(vals[i]) / total;\n',
            '            const a1 = a0 + frac * 2 * Math.PI;\n',
            '            ctx.fillStyle = glChartColor(i, d.color);\n',
            '            ctx.beginPath();\n',
            '            ctx.moveTo(c.x, c.y);\n',
            '            ctx.arc(c.x, c.y, R, a0, a1);\n',
            '            ctx.closePath();\n',
            '            ctx.fill();\n',
            '            ctx.strokeStyle = \'#ffffff\';\n',
            '            ctx.lineWidth = 2;\n',
            '            ctx.stroke();\n',
            '            const mid = (a0 + a1) / 2;\n',
            '            if (d.showValues || labels) {\n',
            '                const lx = c.x + Math.cos(mid) * R * 0.65;\n',
            '                const ly = c.y + Math.sin(mid) * R * 0.65;\n',
            '                ctx.fillStyle = \'#ffffff\';\n',
            '                ctx.font = \'bold 12px sans-serif\';\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'middle\';\n',
            '                let txt = \'\';\n',
            '                if (labels && labels[i] !== undefined) txt = String(labels[i]);\n',
            '                if (d.showValues) txt = (txt ? txt + \' \' : \'\') + Math.round(frac * 100) + \'%\';\n',
            '                if (txt) ctx.fillText(txt, lx, ly);\n',
            '            }\n',
            '            a0 = a1;\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // Ящик с усами: медиана, квартили, полуторный межквартильный размах, выбросы\n',
            '    function drawChartBox(d, raw, labels, ax, ay) {\n',
            '        let series = [];\n',
            '        if (Array.isArray(raw) && raw.length && Array.isArray(raw[0])) {\n',
            '            for (const s of raw) series.push(glChartNumbers(s));\n',
            '        } else {\n',
            '            series = [glChartNumbers(raw)];\n',
            '        }\n',
            '        series = series.filter(s => s.length > 0);\n',
            '        if (!series.length) return;\n',
            '        const scale = fieldScale();\n',
            '        const origin = fieldToPixel(ax, ay);\n',
            '        const W = d.width * scale, H = d.height * scale;\n',
            '        let lo = Infinity, hi = -Infinity;\n',
            '        for (const s of series) for (const v of s) { if (v < lo) lo = v; if (v > hi) hi = v; }\n',
            '        if (!isFinite(lo) || hi - lo < 1e-12) { hi = lo + 1; }\n',
            '        const pad = (hi - lo) * 0.1;\n',
            '        lo -= pad; hi += pad;\n',
            '        const toY = (v) => origin.y - ((v - lo) / (hi - lo)) * H;\n',
            '        const slotW = W / series.length;\n',
            '        ctx.save();\n',
            '        for (let s = 0; s < series.length; s++) {\n',
            '            const a = series[s].slice().sort((p, q) => p - q);\n',
            '            const q = (f) => {\n',
            '                const pos = (a.length - 1) * f;\n',
            '                const l = Math.floor(pos), h2 = Math.ceil(pos);\n',
            '                return a[l] + (a[h2] - a[l]) * (pos - l);\n',
            '            };\n',
            '            const q1 = q(0.25), med = q(0.5), q3 = q(0.75);\n',
            '            const iqr = q3 - q1;\n',
            '            let wLo = q1 - 1.5 * iqr, wHi = q3 + 1.5 * iqr;\n',
            '            let loW = Infinity, hiW = -Infinity;\n',
            '            for (const v of a) { if (v >= wLo && v < loW) loW = v; if (v <= wHi && v > hiW) hiW = v; }\n',
            '            if (!isFinite(loW)) loW = a[0];\n',
            '            if (!isFinite(hiW)) hiW = a[a.length - 1];\n',
            '            const cx = origin.x + slotW * (s + 0.5);\n',
            '            const bw = slotW * 0.5;\n',
            '            ctx.strokeStyle = \'#37474f\';\n',
            '            ctx.lineWidth = 1.5;\n',
            '            ctx.fillStyle = glChartColor(s, d.color);\n',
            '            // коробка Q1..Q3\n',
            '            ctx.beginPath();\n',
            '            ctx.rect(cx - bw / 2, toY(q3), bw, Math.max(1, toY(q1) - toY(q3)));\n',
            '            ctx.fill();\n',
            '            ctx.stroke();\n',
            '            // медиана\n',
            '            ctx.beginPath();\n',
            '            ctx.moveTo(cx - bw / 2, toY(med));\n',
            '            ctx.lineTo(cx + bw / 2, toY(med));\n',
            '            ctx.lineWidth = 2.5;\n',
            '            ctx.stroke();\n',
            '            // усы\n',
            '            ctx.lineWidth = 1.5;\n',
            '            ctx.beginPath();\n',
            '            ctx.moveTo(cx, toY(q3)); ctx.lineTo(cx, toY(hiW));\n',
            '            ctx.moveTo(cx - bw / 4, toY(hiW)); ctx.lineTo(cx + bw / 4, toY(hiW));\n',
            '            ctx.moveTo(cx, toY(q1)); ctx.lineTo(cx, toY(loW));\n',
            '            ctx.moveTo(cx - bw / 4, toY(loW)); ctx.lineTo(cx + bw / 4, toY(loW));\n',
            '            ctx.stroke();\n',
            '            // выбросы\n',
            '            ctx.fillStyle = \'#e8590c\';\n',
            '            for (const v of a) {\n',
            '                if (v < loW || v > hiW) {\n',
            '                    ctx.beginPath();\n',
            '                    ctx.arc(cx, toY(v), 3, 0, 2 * Math.PI);\n',
            '                    ctx.fill();\n',
            '                }\n',
            '            }\n',
            '            if (labels && labels[s] !== undefined) {\n',
            '                ctx.fillStyle = \'#333333\';\n',
            '                ctx.font = \'11px sans-serif\';\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'top\';\n',
            '                ctx.fillText(String(labels[s]), cx, origin.y + 4);\n',
            '            }\n',
            '        }\n',
            '        if (d.showAxes) {\n',
            '            ctx.strokeStyle = \'#666666\';\n',
            '            ctx.lineWidth = 1.5;\n',
            '            ctx.beginPath();\n',
            '            ctx.moveTo(origin.x, origin.y - H);\n',
            '            ctx.lineTo(origin.x, origin.y);\n',
            '            ctx.stroke();\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Деревья ----\n',
            '    // Узел: [метка, [потомки...]] либо просто метка (лист).\n',
            '    function glTreeNorm(node) {\n',
            '        if (node === null || node === undefined) return null;\n',
            '        if (Array.isArray(node)) {\n',
            '            if (node.length === 0) return null;\n',
            '            const label = node[0];\n',
            '            const kids = [];\n',
            '            if (node.length > 1 && Array.isArray(node[1])) {\n',
            '                for (const c of node[1]) {\n',
            '                    const nc = glTreeNorm(c);\n',
            '                    if (nc) kids.push(nc);\n',
            '                }\n',
            '            } else {\n',
            '                for (let i = 1; i < node.length; i++) {\n',
            '                    const nc = glTreeNorm(node[i]);\n',
            '                    if (nc) kids.push(nc);\n',
            '                }\n',
            '            }\n',
            '            return { label: String(label), children: kids };\n',
            '        }\n',
            '        return { label: String(node), children: [] };\n',
            '    }\n',
            '    // Компактная раскладка: лист занимает слот, родитель центрируется над потомками\n',
            '    function glTreeLayout(root, spacing, levelGap) {\n',
            '        let cursor = 0;\n',
            '        (function assign(n, depth) {\n',
            '            n.depth = depth;\n',
            '            if (!n.children.length) { n.x = cursor * spacing; cursor++; }\n',
            '            else {\n',
            '                for (const c of n.children) assign(c, depth + 1);\n',
            '                n.x = (n.children[0].x + n.children[n.children.length - 1].x) / 2;\n',
            '            }\n',
            '            n.y = -depth * levelGap;\n',
            '        })(root, 0);\n',
            '        return root;\n',
            '    }\n',
            '    function drawTreeDiagram(d) {\n',
            '        let raw;\n',
            '        try { raw = evaluate(d.dataExpr); } catch (e) { return; }\n',
            '        const root = glTreeNorm(raw);\n',
            '        if (!root) return;\n',
            '        let ax = 0, ay = 0;\n',
            '        try { ax = evaluate(d.posXExpr); ay = evaluate(d.posYExpr); } catch (e) { ax = 0; ay = 0; }\n',
            '        if (typeof ax !== \'number\' || !isFinite(ax)) ax = 0;\n',
            '        if (typeof ay !== \'number\' || !isFinite(ay)) ay = 0;\n',
            '        glTreeLayout(root, d.spacing || 2.2, d.levelGap || 2.2);\n',
            '        // центрируем дерево по горизонтали относительно точки привязки\n',
            '        let minX = Infinity, maxX = -Infinity;\n',
            '        (function bounds(n) {\n',
            '            if (n.x < minX) minX = n.x;\n',
            '            if (n.x > maxX) maxX = n.x;\n',
            '            for (const c of n.children) bounds(c);\n',
            '        })(root);\n',
            '        const shift = ax - (minX + maxX) / 2;\n',
            '        ctx.save();\n',
            '        // рёбра\n',
            '        ctx.strokeStyle = d.edgeColor || \'#90a4ae\';\n',
            '        ctx.lineWidth = 1.8;\n',
            '        (function edges(n) {\n',
            '            const p = fieldToPixel(n.x + shift, n.y + ay);\n',
            '            for (const c of n.children) {\n',
            '                const q = fieldToPixel(c.x + shift, c.y + ay);\n',
            '                ctx.beginPath();\n',
            '                ctx.moveTo(p.x, p.y);\n',
            '                ctx.lineTo(q.x, q.y);\n',
            '                ctx.stroke();\n',
            '                edges(c);\n',
            '            }\n',
            '        })(root);\n',
            '        // узлы\n',
            '        const R = d.nodeRadius || 11;\n',
            '        (function nodes(n) {\n',
            '            const p = fieldToPixel(n.x + shift, n.y + ay);\n',
            '            ctx.fillStyle = d.color || \'#37474f\';\n',
            '            if (d.boxed) {\n',
            '                const w = Math.max(R * 2, ctx.measureText(n.label).width + 14);\n',
            '                ctx.beginPath();\n',
            '                ctx.rect(p.x - w / 2, p.y - R, w, R * 2);\n',
            '                ctx.fill();\n',
            '            } else {\n',
            '                ctx.beginPath();\n',
            '                ctx.arc(p.x, p.y, R, 0, 2 * Math.PI);\n',
            '                ctx.fill();\n',
            '            }\n',
            '            ctx.fillStyle = d.labelColor || \'#ffffff\';\n',
            '            ctx.font = Math.max(10, R) + \'px sans-serif\';\n',
            '            ctx.textAlign = \'center\';\n',
            '            ctx.textBaseline = \'middle\';\n',
            '            ctx.fillText(n.label, p.x, p.y);\n',
            '            for (const c of n.children) nodes(c);\n',
            '        })(root);\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Таблицы ----\n',
            '    function drawTable(d) {\n',
            '        let raw;\n',
            '        try { raw = evaluate(d.dataExpr); } catch (e) { return; }\n',
            '        if (!Array.isArray(raw) || !raw.length) return;\n',
            '        const rows = raw.map(r => Array.isArray(r) ? r : [r]);\n',
            '        let cols = 0;\n',
            '        for (const r of rows) if (r.length > cols) cols = r.length;\n',
            '        if (!cols) return;\n',
            '        let ax = 0, ay = 0;\n',
            '        try { ax = evaluate(d.posXExpr); ay = evaluate(d.posYExpr); } catch (e) { ax = 0; ay = 0; }\n',
            '        if (typeof ax !== \'number\' || !isFinite(ax)) ax = 0;\n',
            '        if (typeof ay !== \'number\' || !isFinite(ay)) ay = 0;\n',
            '        const scale = fieldScale();\n',
            '        const cw = d.cellWidth * scale, ch = d.cellHeight * scale;\n',
            '        const origin = fieldToPixel(ax, ay);\n',
            '        ctx.save();\n',
            '        ctx.font = Math.max(9, 13 * (d.fontSize || 1)) + \'px sans-serif\';\n',
            '        ctx.textBaseline = \'middle\';\n',
            '        for (let r = 0; r < rows.length; r++) {\n',
            '            for (let c = 0; c < cols; c++) {\n',
            '                const x = origin.x + c * cw;\n',
            '                const y = origin.y + r * ch;\n',
            '                if (d.header && r === 0 && d.headerBg && d.headerBg !== \'transparent\') {\n',
            '                    ctx.fillStyle = d.headerBg;\n',
            '                    ctx.fillRect(x, y, cw, ch);\n',
            '                }\n',
            '                if (d.borders) {\n',
            '                    ctx.strokeStyle = d.borderColor || \'#90a4ae\';\n',
            '                    ctx.lineWidth = 1;\n',
            '                    ctx.strokeRect(x, y, cw, ch);\n',
            '                }\n',
            '                const val = rows[r][c];\n',
            '                if (val === undefined || val === null) continue;\n',
            '                ctx.fillStyle = d.color || __gcDefaultColor();\n',
            '                if (d.header && r === 0) ctx.font = \'bold \' + Math.max(9, 13 * (d.fontSize || 1)) + \'px sans-serif\';\n',
            '                else ctx.font = Math.max(9, 13 * (d.fontSize || 1)) + \'px sans-serif\';\n',
            '                let tx = x + cw / 2;\n',
            '                ctx.textAlign = \'center\';\n',
            '                if (d.align === \'left\') { tx = x + 6; ctx.textAlign = \'left\'; }\n',
            '                else if (d.align === \'right\') { tx = x + cw - 6; ctx.textAlign = \'right\'; }\n',
            '                ctx.fillText(String(val), tx, y + ch / 2);\n',
            '            }\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '\n',
            '    // ---- draw Complex: раскраска области значений (domain coloring) ----\n',
            '    // Стандартный приём комплексного анализа: оттенок = arg f(z), светлота = |f(z)|.\n',
            '    // Нули видны как точки схождения всех цветов, полюса — как расхождение.\n',
            '    function drawComplexDomain(d) {\n',
            '        if (!GL_USER_FUNCS[d.funcName]) return;\n',
            '        const q = Math.max(1, Math.floor(d.quality || 2));\n',
            '        const w = Math.max(2, Math.floor(width / q)), h = Math.max(2, Math.floor(height / q));\n',
            '        const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '        const key = [d.funcName, d.mode, d.contours, w, h, glUserFuncVersion,\n',
            '            tl.x.toFixed(5), tl.y.toFixed(5), br.x.toFixed(5), br.y.toFixed(5)].join(\'|\');\n',
            '        if (!d._cache || d._cacheKey !== key) {\n',
            '            const off = document.createElement(\'canvas\');\n',
            '            off.width = w; off.height = h;\n',
            '            const octx = off.getContext(\'2d\');\n',
            '            const img = octx.createImageData(w, h);\n',
            '            const data = img.data;\n',
            '            for (let py = 0; py < h; py++) {\n',
            '                const zy = tl.y + (br.y - tl.y) * (py + 0.5) / h;\n',
            '                for (let px = 0; px < w; px++) {\n',
            '                    const zx = tl.x + (br.x - tl.x) * (px + 0.5) / w;\n',
            '                    let val;\n',
            '                    try { val = glCallUserFunc(d.funcName, [glComplex(zx, zy)]); } catch (e) { val = null; }\n',
            '                    const i4 = (py * w + px) * 4;\n',
            '                    if (val === null || val === undefined) { data[i4 + 3] = 0; continue; }\n',
            '                    const c = glToComplex(val);\n',
            '                    if (!isFinite(c.re) || !isFinite(c.im)) { data[i4 + 3] = 0; continue; }\n',
            '                    const mod = Math.hypot(c.re, c.im);\n',
            '                    const arg = Math.atan2(c.im, c.re);\n',
            '                    let hue = (arg * 180 / Math.PI + 360) % 360;\n',
            '                    let light = 0.5, sat = 0.95;\n',
            '                    if (d.mode === \'modulus\') { hue = 0; sat = 0; light = 1 - 1 / (1 + mod * 0.3); }\n',
            '                    else if (d.mode === \'phase\') { light = 0.5; }\n',
            '                    else {\n',
            '                        // светлота растёт с модулем, полосы отмечают степени двойки\n',
            '                        const lg = Math.log2(mod + 1e-12);\n',
            '                        const frac = lg - Math.floor(lg);\n',
            '                        light = 0.28 + 0.5 * (1 - 1 / (1 + mod * 0.5));\n',
            '                        if (d.contours) light *= (0.82 + 0.18 * frac);\n',
            '                    }\n',
            '                    const rgb = glHslToRgb(hue, sat, Math.max(0, Math.min(1, light)));\n',
            '                    data[i4] = rgb[0]; data[i4 + 1] = rgb[1]; data[i4 + 2] = rgb[2]; data[i4 + 3] = 255;\n',
            '                }\n',
            '            }\n',
            '            octx.putImageData(img, 0, 0);\n',
            '            d._cache = off; d._cacheKey = key;\n',
            '        }\n',
            '        ctx.save();\n',
            '        ctx.globalAlpha = Math.max(0, Math.min(1, d.opacity === undefined ? 1 : d.opacity));\n',
            '        ctx.imageSmoothingEnabled = q > 1;\n',
            '        ctx.drawImage(d._cache, 0, 0, width, height);\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Геометрия Лобачевского ----\n',
            '    // Геодезическая модели Пуанкаре — дуга окружности, ортогональной абсолюту.\n',
            '    // Через инверсию: окружность проходит через z1, z2 и точку, обратную z1.\n',
            '    function glCircum3(a, b, c) {\n',
            '        const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));\n',
            '        if (Math.abs(d) < 1e-12) return null; // точки коллинеарны\n',
            '        const ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) + (b.x * b.x + b.y * b.y) * (c.y - a.y) +\n',
            '                    (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;\n',
            '        const uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) + (b.x * b.x + b.y * b.y) * (a.x - c.x) +\n',
            '                    (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;\n',
            '        return { x: ux, y: uy, r: Math.hypot(a.x - ux, a.y - uy) };\n',
            '    }\n',
            '    function glHypGeodesicCircle(z1, z2) {\n',
            '        const n1 = z1.x * z1.x + z1.y * z1.y;\n',
            '        if (n1 < 1e-12) return null; // через центр — прямая (диаметр)\n',
            '        const inv = { x: z1.x / n1, y: z1.y / n1 }; // точка, обратная относительно абсолюта\n',
            '        const cross = z1.x * z2.y - z1.y * z2.x;\n',
            '        if (Math.abs(cross) < 1e-12) return null; // коллинеарны с центром — диаметр\n',
            '        return glCircum3(z1, z2, inv);\n',
            '    }\n',
            '    function glHypInvert(circle, z) {\n',
            '        const dx = z.x - circle.x, dy = z.y - circle.y;\n',
            '        const d2 = dx * dx + dy * dy;\n',
            '        if (d2 < 1e-15) return { x: z.x, y: z.y };\n',
            '        const k = circle.r * circle.r / d2;\n',
            '        return { x: circle.x + dx * k, y: circle.y + dy * k };\n',
            '    }\n',
            '    // Расстояние Пуанкаре в круге\n',
            '    function glHypDistance(z1, z2) {\n',
            '        const dx = z1.x - z2.x, dy = z1.y - z2.y;\n',
            '        const d2 = dx * dx + dy * dy;\n',
            '        const n1 = 1 - z1.x * z1.x - z1.y * z1.y;\n',
            '        const n2 = 1 - z2.x * z2.x - z2.y * z2.y;\n',
            '        if (n1 <= 0 || n2 <= 0) return Infinity;\n',
            '        return Math.acosh(1 + 2 * d2 / (n1 * n2));\n',
            '    }\n',
            '    // Замощение {p,q}: центральный правильный p-угольник и его отражения\n',
            '    function glHypTiling(p, q, depth) {\n',
            '        if (p < 3 || q < 3 || (p - 2) * (q - 2) <= 4) return []; // не гиперболическое\n',
            '        const num = Math.cos(Math.PI / p + Math.PI / q);\n',
            '        const den = Math.cos(Math.PI / p - Math.PI / q);\n',
            '        if (num / den < 0) return [];\n',
            '        const R = Math.sqrt(num / den);\n',
            '        const base = [];\n',
            '        for (let k = 0; k < p; k++) {\n',
            '            const a = 2 * Math.PI * k / p;\n',
            '            base.push({ x: R * Math.cos(a), y: R * Math.sin(a) });\n',
            '        }\n',
            '        const polys = [base];\n',
            '        const seen = {};\n',
            '        const keyOf = (poly) => {\n',
            '            let cx = 0, cy = 0;\n',
            '            for (const v of poly) { cx += v.x; cy += v.y; }\n',
            '            return (cx / poly.length).toFixed(4) + \',\' + (cy / poly.length).toFixed(4);\n',
            '        };\n',
            '        seen[keyOf(base)] = true;\n',
            '        let frontier = [base];\n',
            '        const maxDepth = Math.max(0, Math.min(6, Math.floor(depth)));\n',
            '        for (let step = 0; step < maxDepth; step++) {\n',
            '            const next = [];\n',
            '            for (const poly of frontier) {\n',
            '                for (let i = 0; i < poly.length; i++) {\n',
            '                    const a = poly[i], b = poly[(i + 1) % poly.length];\n',
            '                    const circ = glHypGeodesicCircle(a, b);\n',
            '                    if (!circ) continue;\n',
            '                    const reflected = poly.map(v => glHypInvert(circ, v));\n',
            '                    let ok = true;\n',
            '                    for (const v of reflected) {\n',
            '                        if (!isFinite(v.x) || !isFinite(v.y) || v.x * v.x + v.y * v.y > 0.9995) { ok = false; break; }\n',
            '                    }\n',
            '                    if (!ok) continue;\n',
            '                    const k = keyOf(reflected);\n',
            '                    if (seen[k]) continue;\n',
            '                    seen[k] = true;\n',
            '                    polys.push(reflected);\n',
            '                    next.push(reflected);\n',
            '                    if (polys.length > 1200) return polys;\n',
            '                }\n',
            '            }\n',
            '            frontier = next;\n',
            '            if (!frontier.length) break;\n',
            '        }\n',
            '        return polys;\n',
            '    }\n',
            '    // Рисует геодезический отрезок между двумя точками единичного круга\n',
            '    function glDrawHypSegment(d, z1, z2, cx, cy, scale) {\n',
            '        const circ = glHypGeodesicCircle(z1, z2);\n',
            '        const toPix = (z) => fieldToPixel(cx + z.x * scale, cy + z.y * scale);\n',
            '        if (!circ) {\n',
            '            const p1 = toPix(z1), p2 = toPix(z2);\n',
            '            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);\n',
            '            return;\n',
            '        }\n',
            '        let a1 = Math.atan2(z1.y - circ.y, z1.x - circ.x);\n',
            '        let a2 = Math.atan2(z2.y - circ.y, z2.x - circ.x);\n',
            '        let diff = a2 - a1;\n',
            '        while (diff > Math.PI) diff -= 2 * Math.PI;\n',
            '        while (diff < -Math.PI) diff += 2 * Math.PI;\n',
            '        const steps = 24;\n',
            '        for (let i = 0; i <= steps; i++) {\n',
            '            const a = a1 + diff * i / steps;\n',
            '            const pt = { x: circ.x + circ.r * Math.cos(a), y: circ.y + circ.r * Math.sin(a) };\n',
            '            const pix = toPix(pt);\n',
            '            if (i === 0) ctx.moveTo(pix.x, pix.y); else ctx.lineTo(pix.x, pix.y);\n',
            '        }\n',
            '    }\n',
            '    function drawHyperbolic(d) {\n',
            '        const scale = d.radius || 8;\n',
            '        const cx = 0, cy = 0;\n',
            '        ctx.save();\n',
            '        if (d.model === \'halfplane\') {\n',
            '            // Полуплоскость: геодезические — вертикальные лучи и полуокружности с центром на оси\n',
            '            ctx.strokeStyle = d.color || \'#2c3e50\';\n',
            '            ctx.lineWidth = d.thickness || 1.4;\n',
            '            const p1 = fieldToPixel(-FIELD_WIDTH / 2, 0), p2 = fieldToPixel(FIELD_WIDTH / 2, 0);\n',
            '            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();\n',
            '            let pairs = null;\n',
            '            try { if (d.geodesicsExpr) pairs = evaluate(d.geodesicsExpr); } catch (e) { pairs = null; }\n',
            '            if (Array.isArray(pairs)) {\n',
            '                ctx.beginPath();\n',
            '                for (const pr of pairs) {\n',
            '                    if (!Array.isArray(pr) || pr.length < 2) continue;\n',
            '                    const A = pr[0], B = pr[1];\n',
            '                    if (!Array.isArray(A) || !Array.isArray(B)) continue;\n',
            '                    if (Math.abs(A[0] - B[0]) < 1e-9) {\n',
            '                        const q1 = fieldToPixel(A[0], A[1]), q2 = fieldToPixel(B[0], B[1]);\n',
            '                        ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y);\n',
            '                    } else {\n',
            '                        const c = (A[0] * A[0] + A[1] * A[1] - B[0] * B[0] - B[1] * B[1]) / (2 * (A[0] - B[0]));\n',
            '                        const r = Math.hypot(A[0] - c, A[1]);\n',
            '                        let a1 = Math.atan2(A[1], A[0] - c), a2 = Math.atan2(B[1], B[0] - c);\n',
            '                        const steps = 30;\n',
            '                        for (let i = 0; i <= steps; i++) {\n',
            '                            const a = a1 + (a2 - a1) * i / steps;\n',
            '                            const pix = fieldToPixel(c + r * Math.cos(a), r * Math.sin(a));\n',
            '                            if (i === 0) ctx.moveTo(pix.x, pix.y); else ctx.lineTo(pix.x, pix.y);\n',
            '                        }\n',
            '                    }\n',
            '                }\n',
            '                ctx.stroke();\n',
            '            }\n',
            '            ctx.restore();\n',
            '            return;\n',
            '        }\n',
            '        // Модель круга Пуанкаре\n',
            '        if (d.showBoundary) {\n',
            '            const c0 = fieldToPixel(cx, cy);\n',
            '            const rPix = scale * fieldScale();\n',
            '            ctx.strokeStyle = d.color || \'#2c3e50\';\n',
            '            ctx.lineWidth = 2;\n',
            '            ctx.beginPath();\n',
            '            ctx.arc(c0.x, c0.y, rPix, 0, 2 * Math.PI);\n',
            '            ctx.stroke();\n',
            '        }\n',
            '        if (d.tilingP >= 3 && d.tilingQ >= 3) {\n',
            '            const key = d.tilingP + \',\' + d.tilingQ + \',\' + d.depth;\n',
            '            if (!d._tiles || d._tileKey !== key) {\n',
            '                d._tiles = glHypTiling(d.tilingP, d.tilingQ, d.depth);\n',
            '                d._tileKey = key;\n',
            '            }\n',
            '            ctx.strokeStyle = d.tileColor || \'#5b8db8\';\n',
            '            ctx.lineWidth = d.thickness || 1.4;\n',
            '            ctx.beginPath();\n',
            '            for (const poly of d._tiles) {\n',
            '                for (let i = 0; i < poly.length; i++) {\n',
            '                    glDrawHypSegment(d, poly[i], poly[(i + 1) % poly.length], cx, cy, scale);\n',
            '                }\n',
            '            }\n',
            '            ctx.stroke();\n',
            '        }\n',
            '        let pairs = null;\n',
            '        try { if (d.geodesicsExpr) pairs = evaluate(d.geodesicsExpr); } catch (e) { pairs = null; }\n',
            '        if (Array.isArray(pairs) && pairs.length) {\n',
            '            ctx.strokeStyle = d.color || \'#2c3e50\';\n',
            '            ctx.lineWidth = (d.thickness || 1.4) + 0.8;\n',
            '            ctx.beginPath();\n',
            '            for (const pr of pairs) {\n',
            '                if (!Array.isArray(pr) || pr.length < 2) continue;\n',
            '                const A = pr[0], B = pr[1];\n',
            '                if (!Array.isArray(A) || !Array.isArray(B)) continue;\n',
            '                glDrawHypSegment(d, { x: A[0], y: A[1] }, { x: B[0], y: B[1] }, cx, cy, scale);\n',
            '            }\n',
            '            ctx.stroke();\n',
            '        }\n',
            '        let pts = null;\n',
            '        try { if (d.pointsExpr) pts = evaluate(d.pointsExpr); } catch (e) { pts = null; }\n',
            '        if (Array.isArray(pts)) {\n',
            '            ctx.fillStyle = d.color || \'#2c3e50\';\n',
            '            for (const P of pts) {\n',
            '                if (!Array.isArray(P)) continue;\n',
            '                const pix = fieldToPixel(cx + P[0] * scale, cy + P[1] * scale);\n',
            '                ctx.beginPath();\n',
            '                ctx.arc(pix.x, pix.y, 4, 0, 2 * Math.PI);\n',
            '                ctx.fill();\n',
            '            }\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '\n',
            '    // ---- Бифуркационная диаграмма ----\n',
            '    function drawBifurcation(d) {\n',
            '        if (!GL_USER_FUNCS[d.funcName]) return;\n',
            '        const q = Math.max(1, Math.floor(d.quality || 2));\n',
            '        const w = Math.max(2, Math.floor(width / q)), h = Math.max(2, Math.floor(height / q));\n',
            '        const key = [d.funcName, d.rmin, d.rmax, d.ymin, d.ymax, d.x0, d.skip, d.keep, w, h, glUserFuncVersion].join(\'|\');\n',
            '        if (!d._cache || d._cacheKey !== key) {\n',
            '            const off = document.createElement(\'canvas\');\n',
            '            off.width = w; off.height = h;\n',
            '            const octx = off.getContext(\'2d\');\n',
            '            const img = octx.createImageData(w, h);\n',
            '            const data = img.data;\n',
            '            const rgb = hexToRgbSurface(d.color || \'#1a237e\');\n',
            '            const skip = Math.max(0, Math.floor(d.skip)), keep = Math.max(1, Math.floor(d.keep));\n',
            '            for (let px = 0; px < w; px++) {\n',
            '                const r = d.rmin + (d.rmax - d.rmin) * px / (w - 1);\n',
            '                let x = d.x0;\n',
            '                let bad = false;\n',
            '                for (let i = 0; i < skip; i++) {\n',
            '                    try { x = glCallUserFunc(d.funcName, [r, x]); } catch (e) { bad = true; break; }\n',
            '                    if (typeof x !== \'number\' || !isFinite(x)) { bad = true; break; }\n',
            '                }\n',
            '                if (bad) continue;\n',
            '                for (let i = 0; i < keep; i++) {\n',
            '                    try { x = glCallUserFunc(d.funcName, [r, x]); } catch (e) { break; }\n',
            '                    if (typeof x !== \'number\' || !isFinite(x)) break;\n',
            '                    const py = Math.round((1 - (x - d.ymin) / (d.ymax - d.ymin)) * (h - 1));\n',
            '                    if (py < 0 || py >= h) continue;\n',
            '                    const i4 = (py * w + px) * 4;\n',
            '                    data[i4] = rgb.r; data[i4 + 1] = rgb.g; data[i4 + 2] = rgb.b;\n',
            '                    data[i4 + 3] = Math.min(255, data[i4 + 3] + 90);\n',
            '                }\n',
            '            }\n',
            '            octx.putImageData(img, 0, 0);\n',
            '            d._cache = off; d._cacheKey = key;\n',
            '        }\n',
            '        ctx.save();\n',
            '        ctx.imageSmoothingEnabled = false;\n',
            '        ctx.drawImage(d._cache, 0, 0, width, height);\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Паутинная диаграмма ----\n',
            '    function drawCobweb(d) {\n',
            '        if (!GL_USER_FUNCS[d.funcName]) return;\n',
            '        const f = (x) => glCallUserFunc(d.funcName, [x]);\n',
            '        ctx.save();\n',
            '        // график функции\n',
            '        ctx.strokeStyle = d.curveColor || \'#1565c0\';\n',
            '        ctx.lineWidth = 2;\n',
            '        ctx.beginPath();\n',
            '        const N = 200;\n',
            '        let started = false;\n',
            '        for (let i = 0; i <= N; i++) {\n',
            '            const x = d.xmin + (d.xmax - d.xmin) * i / N;\n',
            '            let y;\n',
            '            try { y = f(x); } catch (e) { started = false; continue; }\n',
            '            if (typeof y !== \'number\' || !isFinite(y)) { started = false; continue; }\n',
            '            const p = fieldToPixel(x, y);\n',
            '            if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);\n',
            '        }\n',
            '        ctx.stroke();\n',
            '        // диагональ y = x\n',
            '        if (d.showDiagonal) {\n',
            '            ctx.strokeStyle = \'#9e9e9e\';\n',
            '            ctx.lineWidth = 1;\n',
            '            ctx.setLineDash([5, 4]);\n',
            '            const a = fieldToPixel(d.xmin, d.xmin), b = fieldToPixel(d.xmax, d.xmax);\n',
            '            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();\n',
            '            ctx.setLineDash([]);\n',
            '        }\n',
            '        // лестница итераций\n',
            '        let x0 = 0.5;\n',
            '        try { if (d.x0Expr) x0 = evaluate(d.x0Expr); } catch (e) { x0 = 0.5; }\n',
            '        if (typeof x0 !== \'number\' || !isFinite(x0)) x0 = 0.5;\n',
            '        ctx.strokeStyle = d.color || \'#c62828\';\n',
            '        ctx.lineWidth = 1.4;\n',
            '        ctx.beginPath();\n',
            '        let x = x0;\n',
            '        let p0 = fieldToPixel(x, 0);\n',
            '        ctx.moveTo(p0.x, p0.y);\n',
            '        const steps = Math.max(1, Math.min(500, Math.floor(d.steps)));\n',
            '        for (let i = 0; i < steps; i++) {\n',
            '            let y;\n',
            '            try { y = f(x); } catch (e) { break; }\n',
            '            if (typeof y !== \'number\' || !isFinite(y)) break;\n',
            '            const pv = fieldToPixel(x, y);\n',
            '            ctx.lineTo(pv.x, pv.y);          // вертикально до кривой\n',
            '            const ph = fieldToPixel(y, y);\n',
            '            ctx.lineTo(ph.x, ph.y);          // горизонтально до диагонали\n',
            '            x = y;\n',
            '        }\n',
            '        ctx.stroke();\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Система итерированных функций (игра хаоса) ----\n',
            '    function drawIFS(d) {\n',
            '        let maps;\n',
            '        try { maps = evaluate(d.mapsExpr); } catch (e) { return; }\n',
            '        if (!Array.isArray(maps) || !maps.length) return;\n',
            '        const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '        const key = [JSON.stringify(maps), d.iterations, width, height,\n',
            '            tl.x.toFixed(4), tl.y.toFixed(4), br.x.toFixed(4), br.y.toFixed(4)].join(\'|\');\n',
            '        if (!d._cache || d._cacheKey !== key) {\n',
            '            const off = document.createElement(\'canvas\');\n',
            '            off.width = width; off.height = height;\n',
            '            const octx = off.getContext(\'2d\');\n',
            '            const img = octx.createImageData(width, height);\n',
            '            const data = img.data;\n',
            '            const rgb = hexToRgbSurface(d.color || \'#1b5e20\');\n',
            '            // нормируем вероятности\n',
            '            let total = 0;\n',
            '            for (const m of maps) total += (m.length > 6 ? m[6] : 1);\n',
            '            const cum = [];\n',
            '            let acc = 0;\n',
            '            for (const m of maps) { acc += (m.length > 6 ? m[6] : 1) / total; cum.push(acc); }\n',
            '            let x = 0, y = 0;\n',
            '            const iters = Math.max(1000, Math.min(400000, Math.floor(d.iterations)));\n',
            '            for (let i = 0; i < iters; i++) {\n',
            '                const u = Math.random();\n',
            '                let k = 0;\n',
            '                while (k < cum.length - 1 && u > cum[k]) k++;\n',
            '                const m = maps[k];\n',
            '                const nx = m[0] * x + m[1] * y + m[4];\n',
            '                const ny = m[2] * x + m[3] * y + m[5];\n',
            '                x = nx; y = ny;\n',
            '                if (i < 20) continue; // даём аттрактору установиться\n',
            '                const px = Math.round((x - tl.x) / (br.x - tl.x) * width);\n',
            '                const py = Math.round((y - tl.y) / (br.y - tl.y) * height);\n',
            '                if (px < 0 || px >= width || py < 0 || py >= height) continue;\n',
            '                const i4 = (py * width + px) * 4;\n',
            '                data[i4] = rgb.r; data[i4 + 1] = rgb.g; data[i4 + 2] = rgb.b;\n',
            '                data[i4 + 3] = Math.min(255, data[i4 + 3] + 60);\n',
            '            }\n',
            '            octx.putImageData(img, 0, 0);\n',
            '            d._cache = off; d._cacheKey = key;\n',
            '        }\n',
            '        ctx.drawImage(d._cache, 0, 0);\n',
            '    }\n',
            '\n',
            '    // ---- Клеточные автоматы ----\n',
            '    function drawAutomaton(d) {\n',
            '        let ax = 0, ay = 0;\n',
            '        try { ax = evaluate(d.posXExpr); ay = evaluate(d.posYExpr); } catch (e) { ax = 0; ay = 0; }\n',
            '        if (typeof ax !== \'number\' || !isFinite(ax)) ax = 0;\n',
            '        if (typeof ay !== \'number\' || !isFinite(ay)) ay = 0;\n',
            '        const cs = d.cellSize || 0.25;\n',
            '        ctx.save();\n',
            '        ctx.fillStyle = d.color || \'#212121\';\n',
            '        const scale = fieldScale();\n',
            '        const pxSize = Math.max(1, cs * scale);\n',
            '        if (d.type === \'life\') {\n',
            '            let grid = null;\n',
            '            try { if (d.generationExpr) grid = evaluate(d.generationExpr); } catch (e) { grid = null; }\n',
            '            if (!Array.isArray(grid)) { ctx.restore(); return; }\n',
            '            for (let r = 0; r < grid.length; r++) {\n',
            '                const row = grid[r];\n',
            '                if (!Array.isArray(row)) continue;\n',
            '                for (let c = 0; c < row.length; c++) {\n',
            '                    if (!row[c]) continue;\n',
            '                    const p = fieldToPixel(ax + c * cs, ay - r * cs);\n',
            '                    ctx.fillRect(p.x, p.y, pxSize, pxSize);\n',
            '                }\n',
            '            }\n',
            '            ctx.restore();\n',
            '            return;\n',
            '        }\n',
            '        // элементарный автомат: строим историю по правилу Вольфрама\n',
            '        const cells = Math.max(3, Math.floor(d.cells));\n',
            '        const steps = Math.max(1, Math.floor(d.steps));\n',
            '        const rule = Math.max(0, Math.min(255, Math.floor(d.rule)));\n',
            '        const key = [rule, cells, steps, d.initExpr].join(\'|\');\n',
            '        if (!d._grid || d._gridKey !== key) {\n',
            '            let row = new Uint8Array(cells);\n',
            '            let initArr = null;\n',
            '            try { if (d.initExpr) initArr = evaluate(d.initExpr); } catch (e) { initArr = null; }\n',
            '            if (Array.isArray(initArr)) {\n',
            '                for (let i = 0; i < Math.min(cells, initArr.length); i++) row[i] = initArr[i] ? 1 : 0;\n',
            '            } else {\n',
            '                row[Math.floor(cells / 2)] = 1; // одна живая клетка в центре\n',
            '            }\n',
            '            const hist = [row];\n',
            '            for (let s = 1; s < steps; s++) {\n',
            '                const next = new Uint8Array(cells);\n',
            '                for (let i = 0; i < cells; i++) {\n',
            '                    const l = row[(i - 1 + cells) % cells], c = row[i], r = row[(i + 1) % cells];\n',
            '                    const idx = (l << 2) | (c << 1) | r;\n',
            '                    next[i] = (rule >> idx) & 1;\n',
            '                }\n',
            '                hist.push(next);\n',
            '                row = next;\n',
            '            }\n',
            '            d._grid = hist; d._gridKey = key;\n',
            '        }\n',
            '        for (let s = 0; s < d._grid.length; s++) {\n',
            '            const row = d._grid[s];\n',
            '            for (let i = 0; i < row.length; i++) {\n',
            '                if (!row[i]) continue;\n',
            '                const p = fieldToPixel(ax + (i - row.length / 2) * cs, ay - s * cs);\n',
            '                ctx.fillRect(p.x, p.y, pxSize, pxSize);\n',
            '            }\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Вычислительная геометрия ----\n',
            '    // Выпуклая оболочка берётся из основной библиотеки (glConvexHull)\n',
            '    // Триангуляция Делоне: наивный O(n^4) тест пустой окружности — для учебных объёмов точек\n',
            '    function glDelaunay(pts) {\n',
            '        const tris = [];\n',
            '        const n = pts.length;\n',
            '        for (let i = 0; i < n; i++) {\n',
            '            for (let j = i + 1; j < n; j++) {\n',
            '                for (let k = j + 1; k < n; k++) {\n',
            '                    const cc = glCircum3(pts[i], pts[j], pts[k]);\n',
            '                    if (!cc) continue;\n',
            '                    let empty = true;\n',
            '                    for (let m = 0; m < n; m++) {\n',
            '                        if (m === i || m === j || m === k) continue;\n',
            '                        if (Math.hypot(pts[m].x - cc.x, pts[m].y - cc.y) < cc.r - 1e-9) { empty = false; break; }\n',
            '                    }\n',
            '                    if (empty) tris.push([i, j, k]);\n',
            '                }\n',
            '            }\n',
            '        }\n',
            '        return tris;\n',
            '    }\n',
            '    function glReadPoints(raw) {\n',
            '        const out = [];\n',
            '        if (!Array.isArray(raw)) return out;\n',
            '        for (const it of raw) {\n',
            '            if (Array.isArray(it) && it.length >= 2) out.push({ x: it[0], y: it[1] });\n',
            '            else if (it && typeof it.pos === \'object\') out.push({ x: it.pos.x, y: it.pos.y });\n',
            '            else if (it && typeof it.x === \'number\') out.push({ x: it.x, y: it.y });\n',
            '        }\n',
            '        return out;\n',
            '    }\n',
            '    function drawVoronoi(d) {\n',
            '        let raw;\n',
            '        try { raw = evaluate(d.sitesExpr); } catch (e) { return; }\n',
            '        const sites = glReadPoints(raw);\n',
            '        if (sites.length < 1) return;\n',
            '        ctx.save();\n',
            '        if (d.mode === \'hull\') {\n',
            '            const hull = glConvexHull(raw);\n',
            '            ctx.strokeStyle = d.color || \'#37474f\';\n',
            '            ctx.lineWidth = 2;\n',
            '            ctx.beginPath();\n',
            '            for (let i = 0; i < hull.length; i++) {\n',
            '                const p = fieldToPixel(hull[i].x, hull[i].y);\n',
            '                if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);\n',
            '            }\n',
            '            ctx.closePath();\n',
            '            ctx.stroke();\n',
            '        } else if (d.mode === \'delaunay\') {\n',
            '            const tris = glDelaunay(sites);\n',
            '            ctx.strokeStyle = d.color || \'#37474f\';\n',
            '            ctx.lineWidth = 1.2;\n',
            '            ctx.beginPath();\n',
            '            for (const t of tris) {\n',
            '                for (let i = 0; i < 3; i++) {\n',
            '                    const a = sites[t[i]], b = sites[t[(i + 1) % 3]];\n',
            '                    const pa = fieldToPixel(a.x, a.y), pb = fieldToPixel(b.x, b.y);\n',
            '                    ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);\n',
            '                }\n',
            '            }\n',
            '            ctx.stroke();\n',
            '        } else {\n',
            '            // Вороной растром: цвет пикселя = ближайший сайт\n',
            '            const q = Math.max(1, Math.floor(d.quality || 3));\n',
            '            const w = Math.max(2, Math.floor(width / q)), h = Math.max(2, Math.floor(height / q));\n',
            '            const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '            const key = [JSON.stringify(sites), w, h, tl.x.toFixed(4), br.x.toFixed(4), d.filled].join(\'|\');\n',
            '            if (!d._cache || d._cacheKey !== key) {\n',
            '                const off = document.createElement(\'canvas\');\n',
            '                off.width = w; off.height = h;\n',
            '                const octx = off.getContext(\'2d\');\n',
            '                const img = octx.createImageData(w, h);\n',
            '                const data = img.data;\n',
            '                const cols = sites.map((_, i) => glHslToRgb((i * 67) % 360, 0.5, 0.6));\n',
            '                const owner = new Int32Array(w * h);\n',
            '                for (let py = 0; py < h; py++) {\n',
            '                    const fy = tl.y + (br.y - tl.y) * (py + 0.5) / h;\n',
            '                    for (let px = 0; px < w; px++) {\n',
            '                        const fx = tl.x + (br.x - tl.x) * (px + 0.5) / w;\n',
            '                        let best = 0, bd = Infinity;\n',
            '                        for (let s = 0; s < sites.length; s++) {\n',
            '                            const dd = (sites[s].x - fx) * (sites[s].x - fx) + (sites[s].y - fy) * (sites[s].y - fy);\n',
            '                            if (dd < bd) { bd = dd; best = s; }\n',
            '                        }\n',
            '                        owner[py * w + px] = best;\n',
            '                        const i4 = (py * w + px) * 4;\n',
            '                        if (d.filled) {\n',
            '                            const c = cols[best];\n',
            '                            data[i4] = c[0]; data[i4 + 1] = c[1]; data[i4 + 2] = c[2]; data[i4 + 3] = 255;\n',
            '                        }\n',
            '                    }\n',
            '                }\n',
            '                // границы ячеек — там, где сосед принадлежит другому сайту\n',
            '                for (let py = 1; py < h; py++) {\n',
            '                    for (let px = 1; px < w; px++) {\n',
            '                        const o = owner[py * w + px];\n',
            '                        if (o !== owner[py * w + px - 1] || o !== owner[(py - 1) * w + px]) {\n',
            '                            const i4 = (py * w + px) * 4;\n',
            '                            data[i4] = 40; data[i4 + 1] = 45; data[i4 + 2] = 50; data[i4 + 3] = 255;\n',
            '                        }\n',
            '                    }\n',
            '                }\n',
            '                octx.putImageData(img, 0, 0);\n',
            '                d._cache = off; d._cacheKey = key;\n',
            '            }\n',
            '            ctx.globalAlpha = Math.max(0, Math.min(1, d.opacity === undefined ? 0.45 : d.opacity));\n',
            '            ctx.imageSmoothingEnabled = false;\n',
            '            ctx.drawImage(d._cache, 0, 0, width, height);\n',
            '            ctx.globalAlpha = 1;\n',
            '        }\n',
            '        if (d.showSites) {\n',
            '            ctx.fillStyle = d.color || \'#37474f\';\n',
            '            for (const s of sites) {\n',
            '                const p = fieldToPixel(s.x, s.y);\n',
            '                ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, 2 * Math.PI); ctx.fill();\n',
            '            }\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Ряд Фурье и эпициклы ----\n',
            '    // Коэффициенты c_k = (1/N) Σ z_j exp(-2πi k j / N) по замкнутой ломаной.\n',
            '    function glFourierCoeffs(pts, terms) {\n',
            '        const N = pts.length;\n',
            '        const out = [];\n',
            '        const half = Math.floor(terms / 2);\n',
            '        for (let k = -half; k <= half; k++) {\n',
            '            let re = 0, im = 0;\n',
            '            for (let j = 0; j < N; j++) {\n',
            '                const ang = -2 * Math.PI * k * j / N;\n',
            '                const c = Math.cos(ang), s = Math.sin(ang);\n',
            '                re += pts[j].x * c - pts[j].y * s;\n',
            '                im += pts[j].x * s + pts[j].y * c;\n',
            '            }\n',
            '            out.push({ k: k, re: re / N, im: im / N });\n',
            '        }\n',
            '        out.sort((a, b) => Math.hypot(b.re, b.im) - Math.hypot(a.re, a.im));\n',
            '        return out;\n',
            '    }\n',
            '    function drawFourier(d) {\n',
            '        let raw;\n',
            '        try { raw = evaluate(d.pathExpr); } catch (e) { return; }\n',
            '        const pts = glReadPoints(raw);\n',
            '        if (pts.length < 4) return;\n',
            '        const key = JSON.stringify(pts) + \'|\' + d.terms;\n',
            '        if (!d._coeffs || d._coeffKey !== key) {\n',
            '            d._coeffs = glFourierCoeffs(pts, Math.max(3, Math.floor(d.terms)));\n',
            '            d._coeffKey = key;\n',
            '            d._trail = [];\n',
            '        }\n',
            '        const t = elapsedTime * (d.speed || 0.25);\n',
            '        let cx = 0, cy = 0;\n',
            '        ctx.save();\n',
            '        ctx.strokeStyle = d.circleColor || \'#9e9e9e\';\n',
            '        ctx.lineWidth = 1;\n',
            '        for (const c of d._coeffs) {\n',
            '            const ang = 2 * Math.PI * c.k * t;\n',
            '            const cosA = Math.cos(ang), sinA = Math.sin(ang);\n',
            '            const dx = c.re * cosA - c.im * sinA;\n',
            '            const dy = c.re * sinA + c.im * cosA;\n',
            '            const r = Math.hypot(c.re, c.im);\n',
            '            if (d.showCircles && r > 1e-3) {\n',
            '                const ctr = fieldToPixel(cx, cy);\n',
            '                ctx.beginPath();\n',
            '                ctx.arc(ctr.x, ctr.y, r * fieldScale(), 0, 2 * Math.PI);\n',
            '                ctx.stroke();\n',
            '            }\n',
            '            const from = fieldToPixel(cx, cy);\n',
            '            cx += dx; cy += dy;\n',
            '            const to = fieldToPixel(cx, cy);\n',
            '            if (d.showCircles) {\n',
            '                ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();\n',
            '            }\n',
            '        }\n',
            '        if (!d._trail) d._trail = [];\n',
            '        d._trail.push({ x: cx, y: cy });\n',
            '        if (d._trail.length > 1200) d._trail.shift();\n',
            '        ctx.strokeStyle = d.color || \'#ad1457\';\n',
            '        ctx.lineWidth = 2;\n',
            '        ctx.beginPath();\n',
            '        for (let i = 0; i < d._trail.length; i++) {\n',
            '            const p = fieldToPixel(d._trail[i].x, d._trail[i].y);\n',
            '            if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);\n',
            '        }\n',
            '        ctx.stroke();\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Помеченные диаграммы: категории, автоматы, цепи Маркова ----\n',
            '    function drawDiagram(d) {\n',
            '        let nodes, arrows = [], accepting = [];\n',
            '        try { nodes = evaluate(d.nodesExpr); } catch (e) { return; }\n',
            '        try { if (d.arrowsExpr) arrows = evaluate(d.arrowsExpr) || []; } catch (e) { arrows = []; }\n',
            '        try { if (d.acceptingExpr) accepting = evaluate(d.acceptingExpr) || []; } catch (e) { accepting = []; }\n',
            '        if (!Array.isArray(nodes)) return;\n',
            '        const pos = {};\n',
            '        for (const nd of nodes) {\n',
            '            if (!Array.isArray(nd) || nd.length < 3) continue;\n',
            '            pos[String(nd[0])] = { x: nd[1], y: nd[2] };\n',
            '        }\n',
            '        const accSet = {};\n',
            '        if (Array.isArray(accepting)) for (const a of accepting) accSet[String(a)] = true;\n',
            '        const R = d.nodeRadius || 14;\n',
            '        ctx.save();\n',
            '        // стрелки\n',
            '        const pairSeen = {};\n',
            '        for (const ar of (Array.isArray(arrows) ? arrows : [])) {\n',
            '            if (!Array.isArray(ar) || ar.length < 2) continue;\n',
            '            const a = pos[String(ar[0])], b = pos[String(ar[1])];\n',
            '            if (!a || !b) continue;\n',
            '            const label = ar.length > 2 ? String(ar[2]) : \'\';\n',
            '            const pk = String(ar[0]) + \'~\' + String(ar[1]);\n',
            '            pairSeen[pk] = (pairSeen[pk] || 0) + 1;\n',
            '            const ord = pairSeen[pk];\n',
            '            const p1 = fieldToPixel(a.x, a.y), p2 = fieldToPixel(b.x, b.y);\n',
            '            ctx.strokeStyle = d.arrowColor || \'#455a64\';\n',
            '            ctx.fillStyle = d.arrowColor || \'#455a64\';\n',
            '            ctx.lineWidth = 1.6;\n',
            '            let mx, my, angEnd;\n',
            '            if (String(ar[0]) === String(ar[1])) {\n',
            '                // петля над вершиной\n',
            '                ctx.beginPath();\n',
            '                ctx.arc(p1.x, p1.y - R * 1.5, R, 0.6 * Math.PI, 2.4 * Math.PI);\n',
            '                ctx.stroke();\n',
            '                mx = p1.x; my = p1.y - R * 3;\n',
            '                angEnd = 0.35 * Math.PI;\n',
            '            } else {\n',
            '                const dx = p2.x - p1.x, dy = p2.y - p1.y;\n',
            '                const len = Math.hypot(dx, dy) || 1;\n',
            '                const ux = dx / len, uy = dy / len;\n',
            '                const sx = p1.x + ux * R, sy = p1.y + uy * R;\n',
            '                const ex = p2.x - ux * R, ey = p2.y - uy * R;\n',
            '                const bend = d.curved ? (ord - 1) * 26 : 0;\n',
            '                if (bend === 0) {\n',
            '                    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();\n',
            '                    mx = (sx + ex) / 2; my = (sy + ey) / 2;\n',
            '                    angEnd = Math.atan2(ey - sy, ex - sx);\n',
            '                } else {\n',
            '                    const mxC = (sx + ex) / 2 - uy * bend, myC = (sy + ey) / 2 + ux * bend;\n',
            '                    ctx.beginPath();\n',
            '                    ctx.moveTo(sx, sy);\n',
            '                    ctx.quadraticCurveTo(mxC, myC, ex, ey);\n',
            '                    ctx.stroke();\n',
            '                    mx = (sx + 2 * mxC + ex) / 4; my = (sy + 2 * myC + ey) / 4;\n',
            '                    angEnd = Math.atan2(ey - myC, ex - mxC);\n',
            '                }\n',
            '                // наконечник\n',
            '                const ah = 10;\n',
            '                ctx.beginPath();\n',
            '                ctx.moveTo(ex, ey);\n',
            '                ctx.lineTo(ex - ah * Math.cos(angEnd - 0.4), ey - ah * Math.sin(angEnd - 0.4));\n',
            '                ctx.lineTo(ex - ah * Math.cos(angEnd + 0.4), ey - ah * Math.sin(angEnd + 0.4));\n',
            '                ctx.closePath();\n',
            '                ctx.fill();\n',
            '            }\n',
            '            if (label) {\n',
            '                ctx.fillStyle = __gcDefaultColor();\n',
            '                ctx.font = \'13px sans-serif\';\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'bottom\';\n',
            '                ctx.fillText(label, mx, my - 5);\n',
            '            }\n',
            '        }\n',
            '        // вершины\n',
            '        for (const nd of nodes) {\n',
            '            if (!Array.isArray(nd) || nd.length < 3) continue;\n',
            '            const label = String(nd[0]);\n',
            '            const p = fieldToPixel(nd[1], nd[2]);\n',
            '            ctx.fillStyle = d.color || \'#263238\';\n',
            '            if (d.boxed) {\n',
            '                const w2 = Math.max(R * 2, ctx.measureText(label).width + 16);\n',
            '                ctx.fillRect(p.x - w2 / 2, p.y - R, w2, R * 2);\n',
            '            } else {\n',
            '                ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 2 * Math.PI); ctx.fill();\n',
            '            }\n',
            '            if (accSet[label]) {\n',
            '                // двойной контур — принимающее состояние автомата\n',
            '                ctx.strokeStyle = d.color || \'#263238\';\n',
            '                ctx.lineWidth = 1.5;\n',
            '                ctx.beginPath(); ctx.arc(p.x, p.y, R + 4, 0, 2 * Math.PI); ctx.stroke();\n',
            '            }\n',
            '            ctx.fillStyle = d.labelColor || \'#ffffff\';\n',
            '            ctx.font = Math.max(10, R * 0.85) + \'px sans-serif\';\n',
            '            ctx.textAlign = \'center\';\n',
            '            ctx.textBaseline = \'middle\';\n',
            '            ctx.fillText(label, p.x, p.y);\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    function drawGraph(d) {\n',
            '        const g = window[d.graphVar];\n',
            '        if (!g || !g.nodes) return;\n',
            '        let hlNodes = [], hlEdges = [];\n',
            '        try { if (d.highlightExpr) hlNodes = evaluate(d.highlightExpr) || []; } catch (e) { hlNodes = []; }\n',
            '        try { if (d.highlightEdgesExpr) hlEdges = evaluate(d.highlightEdgesExpr) || []; } catch (e) { hlEdges = []; }\n',
            '        // Терпимо к форме: shortestPath возвращает {path, distance}, bfs/dfs — массив\n',
            '        if (hlNodes && !Array.isArray(hlNodes) && Array.isArray(hlNodes.path)) hlNodes = hlNodes.path;\n',
            '        if (hlEdges && !Array.isArray(hlEdges) && Array.isArray(hlEdges.path)) {\n',
            '            const pth = hlEdges.path;\n',
            '            const conv = [];\n',
            '            for (let i = 1; i < pth.length; i++) conv.push([pth[i - 1], pth[i]]);\n',
            '            hlEdges = conv;\n',
            '        }\n',
            '        if (!Array.isArray(hlNodes)) hlNodes = [hlNodes];\n',
            '        const hlSet = {};\n',
            '        for (const v of hlNodes) hlSet[String(v)] = true;\n',
            '        const edgeKey = (a, b) => a + \'~\' + b;\n',
            '        const hlEdgeSet = {};\n',
            '        if (Array.isArray(hlEdges)) {\n',
            '            for (const e of hlEdges) {\n',
            '                if (Array.isArray(e) && e.length >= 2) { hlEdgeSet[edgeKey(e[0], e[1])] = true; hlEdgeSet[edgeKey(e[1], e[0])] = true; }\n',
            '                else if (e && e.a !== undefined) { hlEdgeSet[edgeKey(e.a, e.b)] = true; hlEdgeSet[edgeKey(e.b, e.a)] = true; }\n',
            '            }\n',
            '        }\n',
            '        const base = d.color || __gcDefaultColor();\n',
            '        const eCol = d.edgeColor || base;\n',
            '        const nCol = d.nodeColor || base;\n',
            '        const R = d.nodeRadius === undefined ? 9 : d.nodeRadius;\n',
            '        ctx.save();\n',
            '        // кратные рёбра между одной парой разводим дугами\n',
            '        const pairCount = {}, pairSeen = {};\n',
            '        for (const e of g.edges) {\n',
            '            const k = edgeKey(e.a < e.b ? e.a : e.b, e.a < e.b ? e.b : e.a);\n',
            '            pairCount[k] = (pairCount[k] || 0) + 1;\n',
            '        }\n',
            '        for (const e of g.edges) {\n',
            '            const na = g.nodes[e.a], nb = g.nodes[e.b];\n',
            '            if (!na || !nb) continue;\n',
            '            const p1 = fieldToPixel(na.pos[0], na.pos[1]);\n',
            '            const p2 = fieldToPixel(nb.pos[0], nb.pos[1]);\n',
            '            const pk = edgeKey(e.a < e.b ? e.a : e.b, e.a < e.b ? e.b : e.a);\n',
            '            pairSeen[pk] = (pairSeen[pk] || 0) + 1;\n',
            '            const total = pairCount[pk], ord = pairSeen[pk];\n',
            '            const isHl = !!hlEdgeSet[edgeKey(e.a, e.b)];\n',
            '            ctx.strokeStyle = isHl ? (d.highlightColor || \'#e8590c\') : eCol;\n',
            '            ctx.lineWidth = isHl ? 3.5 : 2;\n',
            '            let mx, my;\n',
            '            if (e.a === e.b) {\n',
            '                // петля\n',
            '                ctx.beginPath();\n',
            '                ctx.arc(p1.x, p1.y - R * 1.6, R * 1.4, 0, 2 * Math.PI);\n',
            '                ctx.stroke();\n',
            '                mx = p1.x; my = p1.y - R * 3;\n',
            '            } else if (total > 1) {\n',
            '                const off = (ord - (total + 1) / 2) * 22;\n',
            '                const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;\n',
            '                const dxE = p2.x - p1.x, dyE = p2.y - p1.y;\n',
            '                const len = Math.hypot(dxE, dyE) || 1;\n',
            '                const cxE = midX - (dyE / len) * off, cyE = midY + (dxE / len) * off;\n',
            '                ctx.beginPath();\n',
            '                ctx.moveTo(p1.x, p1.y);\n',
            '                ctx.quadraticCurveTo(cxE, cyE, p2.x, p2.y);\n',
            '                ctx.stroke();\n',
            '                mx = (p1.x + 2 * cxE + p2.x) / 4; my = (p1.y + 2 * cyE + p2.y) / 4;\n',
            '            } else {\n',
            '                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();\n',
            '                mx = (p1.x + p2.x) / 2; my = (p1.y + p2.y) / 2;\n',
            '            }\n',
            '            // стрелка для ориентированного графа\n',
            '            if (d.directed && e.a !== e.b) {\n',
            '                const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);\n',
            '                const tipX = p2.x - Math.cos(ang) * R;\n',
            '                const tipY = p2.y - Math.sin(ang) * R;\n',
            '                const ah = 11;\n',
            '                ctx.fillStyle = isHl ? (d.highlightColor || \'#e8590c\') : eCol;\n',
            '                ctx.beginPath();\n',
            '                ctx.moveTo(tipX, tipY);\n',
            '                ctx.lineTo(tipX - ah * Math.cos(ang - 0.4), tipY - ah * Math.sin(ang - 0.4));\n',
            '                ctx.lineTo(tipX - ah * Math.cos(ang + 0.4), tipY - ah * Math.sin(ang + 0.4));\n',
            '                ctx.closePath();\n',
            '                ctx.fill();\n',
            '            }\n',
            '            if (d.showWeights && e.weight !== undefined && e.weight !== 1) {\n',
            '                ctx.fillStyle = \'#333333\';\n',
            '                ctx.font = \'11px sans-serif\';\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'bottom\';\n',
            '                ctx.fillText(String(e.weight), mx, my - 4);\n',
            '            }\n',
            '        }\n',
            '        for (const key in g.nodes) {\n',
            '            const n = g.nodes[key];\n',
            '            const p = fieldToPixel(n.pos[0], n.pos[1]);\n',
            '            const isHl = !!hlSet[String(n.label)];\n',
            '            ctx.fillStyle = isHl ? (d.highlightColor || \'#e8590c\') : (n.color || nCol);\n',
            '            ctx.beginPath();\n',
            '            ctx.arc(p.x, p.y, R, 0, 2 * Math.PI);\n',
            '            ctx.fill();\n',
            '            if (isHl) {\n',
            '                ctx.strokeStyle = \'#ffffff\';\n',
            '                ctx.lineWidth = 2;\n',
            '                ctx.stroke();\n',
            '            }\n',
            '            if (d.labels) {\n',
            '                ctx.fillStyle = d.labelColor || \'#ffffff\';\n',
            '                ctx.font = Math.max(9, R * 1.1) + \'px sans-serif\';\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'middle\';\n',
            '                ctx.fillText(String(n.label), p.x, p.y);\n',
            '            }\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    const markSize = 22;\n',
            '    const half = markSize / 2;\n',
            '\n',
            '    function drawEquallySing(d) {\n',
            '        const edges = d.edges;\n',
            '        const type = d.type;\n',
            '        const color = d.color;\n',
            '        for (let line of edges) {\n',
            '            const pA = line.pA.pos, pB = line.pB.pos;\n',
            '            const midX = (pA.x + pB.x) / 2, midY = (pA.y + pB.y) / 2;\n',
            '            const dx = pB.x - pA.x, dy = pB.y - pA.y;\n',
            '            const len = Math.hypot(dx, dy);\n',
            '            if (len < 0.001) continue;\n',
            '            const centerPix = fieldToPixel(midX, midY);\n',
            '            const p1 = fieldToPixel(pA.x, pA.y);\n',
            '            const p2 = fieldToPixel(pB.x, pB.y);\n',
            '            const dxPix = p2.x - p1.x, dyPix = p2.y - p1.y;\n',
            '            const lenPix = Math.hypot(dxPix, dyPix);\n',
            '            if (lenPix < 1) continue;\n',
            '            const angle = Math.atan2(dyPix, dxPix);\n',
            '            ctx.save();\n',
            '            ctx.translate(centerPix.x, centerPix.y);\n',
            '            ctx.rotate(angle);\n',
            '            ctx.strokeStyle = color;\n',
            '            ctx.lineWidth = 2.8;\n',
            '            ctx.lineCap = \'round\';\n',
            '            switch(type) {\n',
            '                case 1: ctx.beginPath(); ctx.moveTo(0, -half); ctx.lineTo(0, half); ctx.stroke(); break;\n',
            '                case 2: const gap2 = 5; ctx.beginPath(); ctx.moveTo(-gap2, -half); ctx.lineTo(-gap2, half); ctx.stroke(); ctx.beginPath(); ctx.moveTo(gap2, -half); ctx.lineTo(gap2, half); ctx.stroke(); break;\n',
            '                case 3: const gap3 = 6; ctx.beginPath(); for (let off2 of [-gap3, 0, gap3]) { ctx.moveTo(off2, -half); ctx.lineTo(off2, half); } ctx.stroke(); break;\n',
            '                case 4: const amp4 = 5, cycles4 = 2.5; ctx.beginPath(); for (let t = -half; t <= half; t += 0.5) { const x = amp4 * Math.sin(cycles4 * (t / half) * Math.PI); t === -half ? ctx.moveTo(x, t) : ctx.lineTo(x, t); } ctx.stroke(); break;\n',
            '                case 5: const peaks5 = 5, amp5 = 6; const step5 = markSize / peaks5; ctx.beginPath(); for (let i = 0; i <= peaks5; i++) { const t = -half + i * step5; const x = (i % 2 === 0) ? -amp5 : amp5; i === 0 ? ctx.moveTo(x, t) : ctx.lineTo(x, t); } ctx.stroke(); break;\n',
            '                case 6: const amp6 = 6, cycles6 = 3; ctx.beginPath(); for (let t = -half; t <= half; t += 0.5) { const phase = (t / half) * cycles6 * Math.PI; const x = amp6 * Math.sin(phase) * (1 - 0.2 * Math.abs(t) / half); t === -half ? ctx.moveTo(x, t) : ctx.lineTo(x, t); } ctx.stroke(); break;\n',
            '                case 7: const amp7 = 7, loops7 = 2.5; ctx.beginPath(); for (let t = -half; t <= half; t += 0.5) { const phase = (t / half) * loops7 * 2 * Math.PI; const x = amp7 * Math.sin(phase) * (0.7 + 0.3 * Math.cos(phase * 0.5)); t === -half ? ctx.moveTo(x, t) : ctx.lineTo(x, t); } ctx.stroke(); break;\n',
            '                case 8: const maxR8 = half * 0.65, turns8 = 3.2; ctx.beginPath(); for (let i = 0; i <= 80; i++) { const frac = i / 80; const r = frac * maxR8; const angle = frac * turns8 * 2 * Math.PI; const x = r * Math.cos(angle); const y = r * Math.sin(angle) * 1.5; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); break;\n',
            '                case 9: const amp9 = 5, cycles9 = 2.8, gap9 = 6; ctx.beginPath(); for (let off of [-gap9, gap9]) { for (let t = -half; t <= half; t += 0.5) { const x = off + amp9 * Math.sin(cycles9 * (t / half) * Math.PI); (t === -half && off === -gap9) ? ctx.moveTo(x, t) : ctx.lineTo(x, t); } } ctx.stroke(); break;\n',
            '                case 10: const amp10 = 7, cycles10 = 4; ctx.beginPath(); for (let t = -half; t <= half; t += 0.5) { const frac = t / half; const phase = frac * cycles10 * Math.PI; const env = 1 - 0.3 * frac * frac; const x = amp10 * Math.sin(phase + 0.5 * Math.cos(phase * 0.7)) * env; t === -half ? ctx.moveTo(x, t) : ctx.lineTo(x, t); } ctx.stroke(); break;\n',
            '                default: ctx.beginPath(); ctx.moveTo(0, -half); ctx.lineTo(0, half); ctx.stroke();\n',
            '            }\n',
            '            ctx.restore();\n',
            '        }\n',
            '    }\n',
            '\n',
            '    function drawInfLine(d) {\n',
            '        const line = d.line;\n',
            '        if (!line) return;\n',
            '        const pA = line.pA.pos, pB = line.pB.pos;\n',
            '        const dx = pB.x - pA.x, dy = pB.y - pA.y;\n',
            '        const len = Math.hypot(dx, dy);\n',
            '        if (len < 0.001) return;\n',
            '        const ext = 100;\n',
            '        let startX, startY, endX, endY;\n',
            '        if (d.limit) {\n',
            '            const lim = d.limit.pos;\n',
            '            const dxLim = lim.x - pA.x, dyLim = lim.y - pA.y;\n',
            '            const proj = (dxLim * dx + dyLim * dy) / (len * len);\n',
            '            if (proj > 0) {\n',
            '                startX = pA.x; startY = pA.y;\n',
            '                endX = pA.x + dx * ext; endY = pA.y + dy * ext;\n',
            '            } else {\n',
            '                startX = pA.x - dx * ext; startY = pA.y - dy * ext;\n',
            '                endX = pA.x; endY = pA.y;\n',
            '            }\n',
            '        } else {\n',
            '            startX = pA.x - dx * ext; startY = pA.y - dy * ext;\n',
            '            endX = pB.x + dx * ext; endY = pB.y + dy * ext;\n',
            '        }\n',
            '        const pStart = fieldToPixel(startX, startY);\n',
            '        const pEnd = fieldToPixel(endX, endY);\n',
            '        ctx.strokeStyle = d.color || line.color || __gcDefaultColor();\n',
            '        ctx.lineWidth = d.thickness || line.thickness || 2;\n',
            '        if (d.dotline) { ctx.setLineDash([6, 6]); } else { ctx.setLineDash([]); }\n',
            '        ctx.beginPath(); ctx.moveTo(pStart.x, pStart.y); ctx.lineTo(pEnd.x, pEnd.y); ctx.stroke();\n',
            '        ctx.setLineDash([]);\n',
            '    }\n',
            '\n',
            '    function drawVector(d) {\n',
            '        const line = d.line;\n',
            '        if (!line) return;\n',
            '        const pA = line.pA.pos, pB = line.pB.pos;\n',
            '        const t = (d.pos + 1) / 2;\n',
            '        const x = pA.x + (pB.x - pA.x) * t;\n',
            '        const y = pA.y + (pB.y - pA.y) * t;\n',
            '        const dx = pB.x - pA.x, dy = pB.y - pA.y;\n',
            '        const len = Math.hypot(dx, dy);\n',
            '        if (len < 0.001) return;\n',
            '        const dir = d.direct;\n',
            '        const angle = Math.atan2(dy, dx) + (dir < 0 ? Math.PI : 0);\n',
            '        const arrowLen = d.length || 12;\n',
            '        const angleOffset = 0.45;\n',
            '        const p = fieldToPixel(x, y);\n',
            '        const tipOff = 0.3;\n',
            '        const tipX = x + Math.cos(angle) * tipOff;\n',
            '        const tipY = y + Math.sin(angle) * tipOff;\n',
            '        const tip = fieldToPixel(tipX, tipY);\n',
            '        ctx.strokeStyle = d.color;\n',
            '        ctx.lineWidth = d.thickness || line.thickness || 2;\n',
            '        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();\n',
            '        const ang = Math.atan2(tip.y - p.y, tip.x - p.x);\n',
            '        const a1 = ang + angleOffset, a2 = ang - angleOffset;\n',
            '        const arrowLenPix = arrowLen;\n',
            '        ctx.beginPath();\n',
            '        ctx.moveTo(tip.x, tip.y);\n',
            '        ctx.lineTo(tip.x - arrowLenPix * Math.cos(a1), tip.y - arrowLenPix * Math.sin(a1));\n',
            '        ctx.moveTo(tip.x, tip.y);\n',
            '        ctx.lineTo(tip.x - arrowLenPix * Math.cos(a2), tip.y - arrowLenPix * Math.sin(a2));\n',
            '        ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function drawFilling(d) {\n',
            '        ctx.save();\n',
            '        ctx.globalAlpha = (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity;\n',
            '        ctx.fillStyle = d.color;\n',
            '        if (d.kind === \'halfplane\') {\n',
            '            const poly = computeHalfPlanePolygon(d.line, d.sidePoint);\n',
            '            if (poly.length >= 3) {\n',
            '                const path = new Path2D();\n',
            '                const p0 = fieldToPixel(poly[0].x, poly[0].y);\n',
            '                path.moveTo(p0.x, p0.y);\n',
            '                for (let i = 1; i < poly.length; i++) { const p = fieldToPixel(poly[i].x, poly[i].y); path.lineTo(p.x, p.y); }\n',
            '                path.closePath();\n',
            '                ctx.fill(path, \'nonzero\');\n',
            '            }\n',
            '            ctx.restore();\n',
            '            return;\n',
            '        }\n',
            '        if (d.kind === \'circleSector\') {\n',
            '            const c = d.circle;\n',
            '            if (!c || !c.center || c.radius === undefined) { ctx.restore(); return; }\n',
            '            const centerPix = fieldToPixel(c.center.x, c.center.y);\n',
            '            const r = c.radius * fieldScale();\n',
            '            const p1 = fieldToPixel(d.fromPoint.pos.x, d.fromPoint.pos.y);\n',
            '            const p2 = fieldToPixel(d.toPoint.pos.x, d.toPoint.pos.y);\n',
            '            const a1 = Math.atan2(p1.y - centerPix.y, p1.x - centerPix.x);\n',
            '            const a2 = Math.atan2(p2.y - centerPix.y, p2.x - centerPix.x);\n',
            '            const path = new Path2D();\n',
            '            if (d.shape === \'segment\') {\n',
            '                path.arc(centerPix.x, centerPix.y, r, a1, a2);\n',
            '                path.closePath();\n',
            '            } else {\n',
            '                path.moveTo(centerPix.x, centerPix.y);\n',
            '                path.arc(centerPix.x, centerPix.y, r, a1, a2);\n',
            '                path.closePath();\n',
            '            }\n',
            '            ctx.fill(path, \'nonzero\');\n',
            '            ctx.restore();\n',
            '            return;\n',
            '        }\n',
            '        const fig = d.figure;\n',
            '        if (!fig || !fig.points || fig.points.length < 3) { ctx.restore(); return; }\n',
            '        const mode = d.mode || \'full\';\n',
            '        const pts = fig.points.map(p => fieldToPixel(p.pos.x, p.pos.y));\n',
            '        const path = new Path2D();\n',
            '        path.moveTo(pts[0].x, pts[0].y);\n',
            '        for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x, pts[i].y);\n',
            '        path.closePath();\n',
            '        // full = nonzero (вся площадь фигуры, включая самопересечения);\n',
            '        // inside = evenodd (только "простая" внутренняя область без учёта повторной намотки);\n',
            '        // outside = участки, которые входят в фигуру дважды (появляются только при самопересечении сторон)\n',
            '        if (mode === \'inside\') {\n',
            '            ctx.fill(path, \'evenodd\');\n',
            '        } else if (mode === \'outside\') {\n',
            '            if (!fillingOffCanvas || fillingOffCanvas.width !== width || fillingOffCanvas.height !== height) {\n',
            '                fillingOffCanvas = document.createElement(\'canvas\');\n',
            '                fillingOffCanvas.width = width; fillingOffCanvas.height = height;\n',
            '                fillingOffCtx = fillingOffCanvas.getContext(\'2d\');\n',
            '            }\n',
            '            fillingOffCtx.clearRect(0, 0, width, height);\n',
            '            fillingOffCtx.globalCompositeOperation = \'source-over\';\n',
            '            fillingOffCtx.globalAlpha = 1;\n',
            '            fillingOffCtx.fillStyle = d.color;\n',
            '            fillingOffCtx.fill(path, \'nonzero\');\n',
            '            fillingOffCtx.globalCompositeOperation = \'destination-out\';\n',
            '            fillingOffCtx.fill(path, \'evenodd\');\n',
            '            ctx.drawImage(fillingOffCanvas, 0, 0);\n',
            '        } else {\n',
            '            ctx.fill(path, \'nonzero\');\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    function computeHalfPlanePolygon(line, sidePoint) {\n',
            '        const A = line.pA.pos, B = line.pB.pos;\n',
            '        const dx = B.x - A.x, dy = B.y - A.y;\n',
            '        if (dx === 0 && dy === 0) return [];\n',
            '        const f = (pt) => dx * (pt.y - A.y) - dy * (pt.x - A.x);\n',
            '        const sign = f(sidePoint.pos) >= 0 ? 1 : -1;\n',
            '        const M = 1000;\n',
            '        const rect = [{x:-M,y:-M},{x:M,y:-M},{x:M,y:M},{x:-M,y:M}];\n',
            '        const isInside = (pt) => sign * f(pt) >= -1e-9;\n',
            '        const inter = (p1, p2) => {\n',
            '            const f1 = sign * f(p1), f2 = sign * f(p2);\n',
            '            const t = f1 / (f1 - f2);\n',
            '            return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };\n',
            '        };\n',
            '        const out = [];\n',
            '        const n = rect.length;\n',
            '        for (let i = 0; i < n; i++) {\n',
            '            const cur = rect[i], prev = rect[(i - 1 + n) % n];\n',
            '            const curIn = isInside(cur), prevIn = isInside(prev);\n',
            '            if (curIn) { if (!prevIn) out.push(inter(prev, cur)); out.push(cur); }\n',
            '            else if (prevIn) { out.push(inter(prev, cur)); }\n',
            '        }\n',
            '        return out;\n',
            '    }\n',
            '\n',
            '    function drawPunctir(d) {\n',
            '        const line = d.line;\n',
            '        if (!line) return;\n',
            '        const pA = line.pA.pos, pB = line.pB.pos;\n',
            '        const posA = fieldToPixel(pA.x, pA.y);\n',
            '        const posB = fieldToPixel(pB.x, pB.y);\n',
            '        ctx.strokeStyle = d.color || line.color || __gcDefaultColor();\n',
            '        ctx.lineWidth = d.thickness || line.thickness || 2;\n',
            '        ctx.setLineDash(d.pattern || [6, 6]);\n',
            '        ctx.beginPath(); ctx.moveTo(posA.x, posA.y); ctx.lineTo(posB.x, posB.y); ctx.stroke();\n',
            '        ctx.setLineDash([]);\n',
            '    }\n',
            '\n',
            '    function drawFull() {\n',
            '      try { updateFormulas(); } catch (e) { glLog(\'warn\', \'draw Formula: \' + e.message); }\n',
            '      ctx.clearRect(0, 0, width, height);\n',
            '      updateCircles();\n',
            '      updateEllipses();\n',
            '      updateArcs();\n',
            '      for (let a of angles) { computeAngleMeasure(a); }\n',
            '\n',
            '      let anyVisible = false;\n',
            '      for (let p of points) if (!p.hidden && isObjectActive(p)) { anyVisible = true; break; }\n',
            '      if (!anyVisible) {\n',
            '        anyVisible = lines.length > 0 || circles.length > 0 || ellipses.length > 0 || arcs.length > 0 || curves.length > 0 || figures.length > 0 ||\n',
            '          drawFunctions.length > 0 || drawSurfaces.length > 0 || drawFractals.length > 0 || drawImages.length > 0 || drawHistograms.length > 0 ||\n',
            '          drawFields.length > 0 || drawTrajectories.length > 0 || drawGraphs.length > 0 || drawTexts.length > 0 || drawFillings.length > 0 ||\n',
            '          drawRegions.length > 0 || drawLoci.length > 0 || drawTraces.length > 0 || drawFormulas.length > 0 ||\n',
            '          drawCharts.length > 0 || drawTrees.length > 0 || drawTables.length > 0 ||\n',
            '          drawComplexes.length > 0 || drawHyperbolics.length > 0 ||\n',
            '          drawBifurcations.length > 0 || drawCobwebs.length > 0 || drawIFSs.length > 0 || drawAutomata.length > 0 || drawVoronois.length > 0 || drawFouriers.length > 0 || drawDiagrams.length > 0;\n',
            '      }\n',
            '      if (!anyVisible) {\n',
            '        ctx.fillStyle = \'#888888\';\n',
            '        ctx.font = \'18px sans-serif\';\n',
            '        ctx.textAlign = \'center\';\n',
            '        ctx.textBaseline = \'middle\';\n',
            '        ctx.fillText(\'Нет активных объектов для отображения\', width/2, height/2);\n',
            '        return;\n',
            '      }\n',
            '\n',
            '      // Единая очередь отрисовки, отсортированная по layer (управление слоями, запрос #7)\n',
            '      const renderQueue = [];\n',
            '      const push = (layer, fn) => renderQueue.push({ layer: (layer === undefined || layer === null) ? 0 : layer, fn });\n',
            '\n',
            '      for (let l of lines) {\n',
            '        if (!l || !l.pA || !l.pB) continue;\n',
            '        if (!isObjectActive(l)) continue;\n',
            '        const hasPunctir = drawPunctirs.some(d => d.active && d.line === l);\n',
            '        if (hasPunctir) continue;\n',
            '        push(l.layer, () => {\n',
            '          const posA = fieldToPixel(l.pA.pos.x, l.pA.pos.y);\n',
            '          const posB = fieldToPixel(l.pB.pos.x, l.pB.pos.y);\n',
            '          ctx.beginPath(); ctx.moveTo(posA.x, posA.y); ctx.lineTo(posB.x, posB.y);\n',
            '          ctx.strokeStyle = l.color || __gcDefaultColor();\n',
            '          ctx.lineWidth = l.thickness || 2.5;\n',
            '          ctx.lineCap = \'round\';\n',
            '          ctx.stroke();\n',
            '        });\n',
            '      }\n',
            '\n',
            '      for (let c of circles) {\n',
            '        if (!isObjectActive(c)) continue;\n',
            '        push(c.layer, () => drawCircle(c));\n',
            '      }\n',
            '\n',
            '      for (let a of arcs) {\n',
            '        if (!isObjectActive(a)) continue;\n',
            '        push(a.layer, () => drawArc(a));\n',
            '      }\n',
            '\n',
            '      for (let e of ellipses) {\n',
            '        if (!isObjectActive(e)) continue;\n',
            '        push(e.layer, () => drawEllipse(e));\n',
            '      }\n',
            '\n',
            '      for (let cv of curves) {\n',
            '        if (!cv.active) continue;\n',
            '        push(cv.layer, () => drawCurve(cv));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFunctions) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawFunctionGraph(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawSurfaces) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawSurface(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawImages) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawImageElement(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFractals) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawFractal(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawRegions) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawRegion(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawLoci) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawLocus(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawTraces) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawTrace(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawCharts) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawChart(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawTrees) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawTreeDiagram(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawTables) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawTable(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawComplexes) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawComplexDomain(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawHyperbolics) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawHyperbolic(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawBifurcations) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawBifurcation(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawCobwebs) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawCobweb(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawIFSs) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawIFS(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawAutomata) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawAutomaton(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawVoronois) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawVoronoi(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFouriers) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawFourier(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawDiagrams) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawDiagram(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFields) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawField(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawTrajectories) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawTrajectory(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawGraphs) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawGraph(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawHistograms) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawHistogram(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFillings) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawFilling(d));\n',
            '      }\n',
            '\n',
            '      for (let p of points) {\n',
            '        if (!p || !p.pos || isNaN(p.pos.x) || isNaN(p.pos.y)) continue;\n',
            '        if (p.hidden) continue;\n',
            '        if (!isObjectActive(p)) continue;\n',
            '        push(p.layer, () => {\n',
            '          const pos = fieldToPixel(p.pos.x, p.pos.y);\n',
            '          if (isNaN(pos.x) || isNaN(pos.y)) return;\n',
            '          p.px = pos.x; p.py = pos.y;\n',
            '          const r = VERTEX_RADIUS * (p.size || 1);\n',
            '          const shape = p.shape || \'circle\';\n',
            '          ctx.fillStyle = p.color || __gcDefaultColor();\n',
            '          if (shape === \'square\') {\n',
            '            ctx.fillRect(pos.x - r, pos.y - r, r * 2, r * 2);\n',
            '            ctx.strokeStyle = \'#ffffff\'; ctx.lineWidth = 1.5; ctx.strokeRect(pos.x - r, pos.y - r, r * 2, r * 2);\n',
            '            ctx.fillStyle = \'#ffffff\'; ctx.fillRect(pos.x - r/2.5, pos.y - r/2.5, r/1.25, r/1.25);\n',
            '          } else if (shape === \'cross\') {\n',
            '            ctx.strokeStyle = p.color || __gcDefaultColor(); ctx.lineWidth = Math.max(2, r * 0.5); ctx.lineCap = \'round\';\n',
            '            ctx.beginPath(); ctx.moveTo(pos.x - r, pos.y - r); ctx.lineTo(pos.x + r, pos.y + r);\n',
            '            ctx.moveTo(pos.x + r, pos.y - r); ctx.lineTo(pos.x - r, pos.y + r); ctx.stroke();\n',
            '          } else {\n',
            '            ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, 2*Math.PI); ctx.fill();\n',
            '            ctx.strokeStyle = \'#ffffff\'; ctx.lineWidth = 1.5; ctx.stroke();\n',
            '            ctx.fillStyle = \'#ffffff\'; ctx.beginPath(); ctx.arc(pos.x, pos.y, r/2.5, 0, 2*Math.PI); ctx.fill();\n',
            '          }\n',
            '          if (p.textEnabled && p.textValue) {\n',
            '            ctx.fillStyle = p.textColor || __gcDefaultColor();\n',
            '            ctx.font = (14 * (p.textSize || 1)) + \'px sans-serif\';\n',
            '            ctx.textAlign = \'center\';\n',
            '            ctx.textBaseline = \'bottom\';\n',
            '            ctx.fillText(p.textValue, pos.x - 10, pos.y - 8 - r + VERTEX_RADIUS);\n',
            '          }\n',
            '        });\n',
            '      }\n',
            '\n',
            '      for (let d of drawInfLines) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawInfLine(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawPunctirs) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawPunctir(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawVectors) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawVector(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawEqually) {\n',
            '        if (!d.active) continue;\n',
            '        push(d.layer, () => drawEquallySing(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawAngles) {\n',
            '        if (!d.active) continue;\n',
            '        const angleObj = d.angle;\n',
            '        if (!angleObj) continue;\n',
            '        if (!isObjectActive(angleObj.vertex)) continue;\n',
            '        if (!isObjectActive(angleObj.line1) || !isObjectActive(angleObj.line2)) continue;\n',
            '        push(d.layer, () => drawAngleArc(d));\n',
            '      }\n',
            '\n',
            '      // draw Text (LaTeX-формулы уходят в отдельный DOM-оверлей поверх canvas — им нужен настоящий DOM,\n',
            '      // поэтому слой у них всегда самый верхний; обычный текст без \\( \\) / \\[ \\] рисуется прямо на canvas\n',
            '      // и полноценно участвует в общей очереди слоёв (например, может быть ниже точки).\n',
            '      const overlay = document.getElementById(\'formulaOverlay\');\n',
            '      while (overlay.firstChild) overlay.removeChild(overlay.firstChild);\n',
            '      for (let d of drawTexts) {\n',
            '        const posX = evaluate(d.posXExpr);\n',
            '        const posY = evaluate(d.posYExpr);\n',
            '        const text = evaluate(d.textExpr);\n',
            '        let color = evaluate(d.colorExpr);\n',
            '        if (color === \'default\') color = __gcDefaultColor();\n',
            '        const size = evaluate(d.sizeExpr);\n',
            '        const active = evaluate(d.activeExpr);\n',
            '        if (!active) continue;\n',
            '        if (posX === undefined || posY === undefined || text === undefined) continue;\n',
            '        const isFormula = typeof katex !== \'undefined\' && typeof text === \'string\' && (text.includes(\'\\\\(\') || text.includes(\'\\\\[\'));\n',
            '        if (isFormula) {\n',
            '          const pos = fieldToPixel(posX, posY);\n',
            '          const fontSize = 14 * (size || 1);\n',
            '          const el = document.createElement(\'div\');\n',
            '          el.style.position = \'absolute\';\n',
            '          el.style.left = pos.x + \'px\';\n',
            '          el.style.top = pos.y + \'px\';\n',
            '          el.style.transform = \'translate(-50%, -50%)\';\n',
            '          el.style.pointerEvents = \'none\';\n',
            '          el.style.color = color || __gcDefaultColor();\n',
            '          el.style.fontSize = fontSize + \'px\';\n',
            '          el.style.fontFamily = \'sans-serif\';\n',
            '          el.style.whiteSpace = \'nowrap\';\n',
            '          try { el.innerHTML = renderKaTeX(text); } catch (e) { el.textContent = text; }\n',
            '          overlay.appendChild(el);\n',
            '        } else {\n',
            '          push(d.layer, () => {\n',
            '            const pos = fieldToPixel(posX, posY);\n',
            '            ctx.fillStyle = color || __gcDefaultColor();\n',
            '            ctx.font = (14 * (size || 1)) + \'px sans-serif\';\n',
            '            ctx.textAlign = \'center\';\n',
            '            ctx.textBaseline = \'middle\';\n',
            '            ctx.fillText(text, pos.x, pos.y);\n',
            '          });\n',
            '        }\n',
            '      }\n',
            '\n',
            '      renderQueue.sort((a, b) => a.layer - b.layer);\n',
            '      for (let item of renderQueue) item.fn();\n',
            '    }\n',
            '\n',
            '    // ---- Задача 4: офскрин-буфер сцены + флаги dirty ----\n',
            '    let sceneSnapshot = null;\n',
            '    let sceneChangedThisFrame = true;\n',
            '    function markDirty(obj) { if (obj) obj.dirty = true; }\n',
            '    function markSceneChanged() { sceneChangedThisFrame = true; }\n',
            '    function draw() {\n',
            '      const stale = !sceneSnapshot || sceneSnapshot.width !== width || sceneSnapshot.height !== height;\n',
            '      const needsFull = isDragging || sceneChangedThisFrame || stale;\n',
            '      if (!needsFull) {\n',
            '        ctx.clearRect(0, 0, width, height);\n',
            '        ctx.drawImage(sceneSnapshot, 0, 0);\n',
            '        return;\n',
            '      }\n',
            '      drawFull();\n',
            '      if (stale) {\n',
            '        sceneSnapshot = document.createElement(\'canvas\');\n',
            '        sceneSnapshot.width = width; sceneSnapshot.height = height;\n',
            '      }\n',
            '      const snapCtx = sceneSnapshot.getContext(\'2d\');\n',
            '      snapCtx.clearRect(0, 0, width, height);\n',
            '      snapCtx.drawImage(canvas, 0, 0);\n',
            '      drawSnapGuides();\n',
            '      sceneChangedThisFrame = false;\n',
            '    }\n',
            '\n',
            '    // ===== DRAG & DROP =====\n',
            '    let dragMode = null;\n',
            '    let dragTarget = null;\n',
            '    let dragOffsetX = 0, dragOffsetY = 0;\n',
            '    let lineDragStartMouseField = { x: 0, y: 0 };\n',
            '    let lineDragStartPosA = { x: 0, y: 0 };\n',
            '    let lineDragStartPosB = { x: 0, y: 0 };\n',
            '    let figureDragStartCenter = { x: 0, y: 0 };\n',
            '    let clusterDragStartCenter = { x: 0, y: 0 };\n',
            '    let activeSnapGuides = [];\n',
            '    let lockedAngleDrag = null;\n',
            '    let dragStartPos = { x: 0, y: 0 };\n',
            '    let lockedAngleDragMode = \'free\';\n',
            '    let lockedAngleDragLine = null;\n',
            '    let lockedPointTarget = null;\n',
            '    let pointOnLinePoint = null;\n',
            '    let pointOnLineLine = null;\n',
            '    let pointOnCirclePoint = null;\n',
            '    let pointOnCircleCircle = null;\n',
            '    let pointOnCircleStartT = 0;\n',
            '    let pointOnEllipsePoint = null;\n',
            '    let pointOnEllipseEllipse = null;\n',
            '    let ellipseAxisPoint = null;\n',
            '    let ellipseAxisEllipse = null;\n',
            '    let pointOnCurvePoint = null;\n',
            '    let pointOnCurveCurve = null;\n',
            '    let pointOnArcPoint = null;\n',
            '    let pointOnArcArc = null;\n',
            '    let pointOnLineStartT = 0;\n',
            '    let pointOnGraphPoint = null;\n',
            '    let pointOnGraphGraph = null;\n',
            '\n',
            '    function getPointerPos(e) {\n',
            '        const rect = canvas.getBoundingClientRect();\n',
            '        const scaleX = canvas.width / rect.width;\n',
            '        const scaleY = canvas.height / rect.height;\n',
            '        let clientX, clientY;\n',
            '        if (e.touches) { \n',
            '            clientX = e.touches[0].clientX; \n',
            '            clientY = e.touches[0].clientY; \n',
            '            e.preventDefault(); \n',
            '        } else { \n',
            '            clientX = e.clientX; \n',
            '            clientY = e.clientY; \n',
            '        }\n',
            '        return { \n',
            '            x: (clientX - rect.left) * scaleX, \n',
            '            y: (clientY - rect.top) * scaleY \n',
            '        };\n',
            '    }\n',
            '\n',
            '    function onPointerDown(e) {\n',
            '        const pos = getPointerPos(e);\n',
            '        for (let i = 0; i < points.length; i++) {\n',
            '            const p = points[i];\n',
            '            if (!p || !p.dynamic) continue;\n',
            '            if (!isObjectActive(p)) continue;\n',
            '            const dx = pos.x - p.px, dy = pos.y - p.py;\n',
            '            if (dx*dx + dy*dy >= HIT_THRESHOLD*HIT_THRESHOLD) continue;\n',
            '            if (p.lineName) {\n',
            '                const line = lines.find(l => l.name === p.lineName);\n',
            '                if (line) {\n',
            '                    dragMode = \'pointOnLine\';\n',
            '                    pointOnLinePoint = p;\n',
            '                    pointOnLineLine = line;\n',
            '                    pointOnLineStartT = p.t;\n',
            '                    isDragging = true;\n',
            '                    return;\n',
            '                }\n',
            '            }\n',
            '            if (p.circleName) {\n',
            '                const circle = circles.find(c => c.name === p.circleName);\n',
            '                if (circle) {\n',
            '                    dragMode = \'pointOnCircle\';\n',
            '                    pointOnCirclePoint = p;\n',
            '                    pointOnCircleCircle = circle;\n',
            '                    pointOnCircleStartT = p.t;\n',
            '                    isDragging = true;\n',
            '                    return;\n',
            '                }\n',
            '            }\n',
            '            if (p.ellipseName) {\n',
            '                const ellipse = ellipses.find(e => e.name === p.ellipseName);\n',
            '                if (ellipse) {\n',
            '                    if (p.axis === \'a\' || p.axis === \'b\') {\n',
            '                        dragMode = \'ellipseAxisHandle\';\n',
            '                        ellipseAxisPoint = p;\n',
            '                        ellipseAxisEllipse = ellipse;\n',
            '                    } else {\n',
            '                        dragMode = \'pointOnEllipse\';\n',
            '                        pointOnEllipsePoint = p;\n',
            '                        pointOnEllipseEllipse = ellipse;\n',
            '                    }\n',
            '                    isDragging = true;\n',
            '                    return;\n',
            '                }\n',
            '            }\n',
            '            if (p.curveName) {\n',
            '                const curve = curves.find(c => c.name === p.curveName);\n',
            '                if (curve) {\n',
            '                    dragMode = \'pointOnCurve\';\n',
            '                    pointOnCurvePoint = p;\n',
            '                    pointOnCurveCurve = curve;\n',
            '                    isDragging = true;\n',
            '                    return;\n',
            '                }\n',
            '            }\n',
            '            if (p.graphName) {\n',
            '                const g = drawFunctions.find(d => d.name === p.graphName);\n',
            '                if (g) {\n',
            '                    dragMode = \'pointOnGraph\';\n',
            '                    pointOnGraphPoint = p;\n',
            '                    pointOnGraphGraph = g;\n',
            '                    isDragging = true;\n',
            '                    return;\n',
            '                }\n',
            '            }\n',
            '            if (p.arcName) {\n',
            '                const arc = arcs.find(a => a.name === p.arcName);\n',
            '                if (arc) {\n',
            '                    dragMode = \'pointOnArc\';\n',
            '                    pointOnArcPoint = p;\n',
            '                    pointOnArcArc = arc;\n',
            '                    isDragging = true;\n',
            '                    return;\n',
            '                }\n',
            '            }\n',
            '            const lockedAngle = getLockedAngleForPoint(p);\n',
            '            if (lockedAngle) {\n',
            '                if (p === lockedAngle.vertex) {\n',
            '                    dragMode = \'lockedAngle\';\n',
            '                    lockedAngleDrag = lockedAngle;\n',
            '                    lockedAngleDragMode = \'free\';\n',
            '                    lockedAngleDragLine = null;\n',
            '                    dragStartPos = { x: pos.x, y: pos.y };\n',
            '                    isDragging = true;\n',
            '                    return;\n',
            '                } else {\n',
            '                    let line = null;\n',
            '                    if (lockedAngle.line1.pA === p || lockedAngle.line1.pB === p) line = lockedAngle.line1;\n',
            '                    else if (lockedAngle.line2.pA === p || lockedAngle.line2.pB === p) line = lockedAngle.line2;\n',
            '                    if (line) {\n',
            '                        dragMode = \'lockedPointOnSide\';\n',
            '                        lockedAngleDrag = lockedAngle;\n',
            '                        lockedPointTarget = p;\n',
            '                        lockedAngleDragLine = line;\n',
            '                        dragStartPos = { x: pos.x, y: pos.y };\n',
            '                        isDragging = true;\n',
            '                        return;\n',
            '                    }\n',
            '                }\n',
            '            }\n',
            '            dragMode = \'point\';\n',
            '            dragTarget = i;\n',
            '            draggedPointIndex = i;\n',
            '            isDragging = true;\n',
            '            dragOffsetX = pos.x - p.px;\n',
            '            dragOffsetY = pos.y - p.py;\n',
            '            return;\n',
            '        }\n',
            '        for (let i = 0; i < lines.length; i++) {\n',
            '            const l = lines[i];\n',
            '            if (!l || !l.interact) continue;\n',
            '            if (!isObjectActive(l)) continue;\n',
            '            const lockedAngle = getLockedAngleForLine(l);\n',
            '            if (lockedAngle) {\n',
            '                const pA = fieldToPixel(l.pA.pos.x, l.pA.pos.y);\n',
            '                const pB = fieldToPixel(l.pB.pos.x, l.pB.pos.y);\n',
            '                const dx = pB.x - pA.x, dy = pB.y - pA.y;\n',
            '                const len = Math.hypot(dx, dy);\n',
            '                if (len < 0.001) continue;\n',
            '                const t = ((pos.x - pA.x)*dx + (pos.y - pA.y)*dy) / (len*len);\n',
            '                if (t < 0 || t > 1) continue;\n',
            '                const projX = pA.x + t*dx, projY = pA.y + t*dy;\n',
            '                const dist = distance(pos, {x: projX, y: projY});\n',
            '                if (dist < EDGE_HIT_THRESHOLD) {\n',
            '                    dragMode = \'lockedAngle\';\n',
            '                    lockedAngleDrag = lockedAngle;\n',
            '                    lockedAngleDragMode = \'line\';\n',
            '                    lockedAngleDragLine = l;\n',
            '                    dragStartPos = { x: pos.x, y: pos.y };\n',
            '                    isDragging = true;\n',
            '                    return;\n',
            '                }\n',
            '                continue;\n',
            '            }\n',
            '            if (!l.pA.dynamic || !l.pB.dynamic) continue;\n',
            '            if (isPointLocked(l.pA) || isPointLocked(l.pB)) continue;\n',
            '            const pA = fieldToPixel(l.pA.pos.x, l.pA.pos.y);\n',
            '            const pB = fieldToPixel(l.pB.pos.x, l.pB.pos.y);\n',
            '            const dx = pB.x - pA.x, dy = pB.y - pA.y;\n',
            '            const len = Math.hypot(dx, dy);\n',
            '            if (len < 0.001) continue;\n',
            '            const t = ((pos.x - pA.x)*dx + (pos.y - pA.y)*dy) / (len*len);\n',
            '            if (t < 0 || t > 1) continue;\n',
            '            const projX = pA.x + t*dx, projY = pA.y + t*dy;\n',
            '            const dist = distance(pos, {x: projX, y: projY});\n',
            '            if (dist < EDGE_HIT_THRESHOLD) {\n',
            '                dragMode = \'line\';\n',
            '                dragTarget = i;\n',
            '                isDragging = true;\n',
            '                draggedPointIndex = -1;\n',
            '                const mouseField = pixelToField(pos.x, pos.y);\n',
            '                lineDragStartMouseField = { x: mouseField.x, y: mouseField.y };\n',
            '                lineDragStartPosA = { x: l.pA.pos.x, y: l.pA.pos.y };\n',
            '                lineDragStartPosB = { x: l.pB.pos.x, y: l.pB.pos.y };\n',
            '                return;\n',
            '            }\n',
            '        }\n',
            '        for (let i = figures.length - 1; i >= 0; i--) {\n',
            '            const fig = figures[i];\n',
            '            if (!fig.interact) continue;\n',
            '            if (!isObjectActive(fig)) continue;\n',
            '            let locked = false;\n',
            '            for (let p of fig.points) { if (isPointLocked(p)) { locked = true; break; } }\n',
            '            if (locked) continue;\n',
            '            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;\n',
            '            for (let p of fig.points) {\n',
            '                const px = p.pos.x, py = p.pos.y;\n',
            '                if (px < minX) minX = px;\n',
            '                if (px > maxX) maxX = px;\n',
            '                if (py < minY) minY = py;\n',
            '                if (py > maxY) maxY = py;\n',
            '            }\n',
            '            const p1 = fieldToPixel(minX, minY);\n',
            '            const p2 = fieldToPixel(maxX, maxY);\n',
            '            const left = Math.min(p1.x, p2.x) - FIGURE_HIT_PADDING;\n',
            '            const right = Math.max(p1.x, p2.x) + FIGURE_HIT_PADDING;\n',
            '            const top = Math.min(p1.y, p2.y) - FIGURE_HIT_PADDING;\n',
            '            const bottom = Math.max(p1.y, p2.y) + FIGURE_HIT_PADDING;\n',
            '            if (pos.x >= left && pos.x <= right && pos.y >= top && pos.y <= bottom) {\n',
            '                let hitElement = false;\n',
            '                for (let p of fig.points) {\n',
            '                    if (!isObjectActive(p)) { hitElement = true; break; }\n',
            '                    if (distance(pos, {x: p.px, y: p.py}) < HIT_THRESHOLD) { hitElement = true; break; }\n',
            '                }\n',
            '                if (hitElement) continue;\n',
            '                for (let elem of fig.elements) {\n',
            '                    const line = lines.find(l => l.name === elem);\n',
            '                    if (line) {\n',
            '                        if (!isObjectActive(line)) { hitElement = true; break; }\n',
            '                        const pA = fieldToPixel(line.pA.pos.x, line.pA.pos.y);\n',
            '                        const pB = fieldToPixel(line.pB.pos.x, line.pB.pos.y);\n',
            '                        const dx = pB.x - pA.x, dy = pB.y - pA.y;\n',
            '                        const len = Math.hypot(dx, dy);\n',
            '                        if (len > 0.001) {\n',
            '                            const t = ((pos.x - pA.x)*dx + (pos.y - pA.y)*dy) / (len*len);\n',
            '                            if (t >= 0 && t <= 1) {\n',
            '                                const projX = pA.x + t*dx, projY = pA.y + t*dy;\n',
            '                                if (distance(pos, {x: projX, y: projY}) < EDGE_HIT_THRESHOLD) { hitElement = true; break; }\n',
            '                            }\n',
            '                        }\n',
            '                    }\n',
            '                }\n',
            '                if (hitElement) continue;\n',
            '                dragMode = \'figure\';\n',
            '                dragTarget = fig;\n',
            '                isDragging = true;\n',
            '                draggedPointIndex = -1;\n',
            '                const centerPixel = fieldToPixel(fig.center.x, fig.center.y);\n',
            '                dragOffsetX = pos.x - centerPixel.x;\n',
            '                dragOffsetY = pos.y - centerPixel.y;\n',
            '                figureDragStartCenter = { x: fig.center.x, y: fig.center.y };\n',
            '                return;\n',
            '            }\n',
            '        }\n',
            '        // Кластер (составное тело) — хватать можно за «пустое» место внутри его\n',
            '        // общего охвата; отдельные точки/линии/фигуры внутри него по-прежнему\n',
            '        // перетаскиваются индивидуально (см. проверку hitElement выше по циклу).\n',
            '        for (let i = clusters.length - 1; i >= 0; i--) {\n',
            '            const c = clusters[i];\n',
            '            if (!c.interact || !c.points || c.points.length === 0) continue;\n',
            '            if (!isObjectActive(c)) continue;\n',
            '            let locked = false;\n',
            '            for (let p of c.points) { if (isPointLocked(p)) { locked = true; break; } }\n',
            '            if (locked) continue;\n',
            '            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;\n',
            '            for (let p of c.points) {\n',
            '                const px = p.pos.x, py = p.pos.y;\n',
            '                if (px < minX) minX = px;\n',
            '                if (px > maxX) maxX = px;\n',
            '                if (py < minY) minY = py;\n',
            '                if (py > maxY) maxY = py;\n',
            '            }\n',
            '            const p1 = fieldToPixel(minX, minY);\n',
            '            const p2 = fieldToPixel(maxX, maxY);\n',
            '            const left = Math.min(p1.x, p2.x) - FIGURE_HIT_PADDING;\n',
            '            const right = Math.max(p1.x, p2.x) + FIGURE_HIT_PADDING;\n',
            '            const top = Math.min(p1.y, p2.y) - FIGURE_HIT_PADDING;\n',
            '            const bottom = Math.max(p1.y, p2.y) + FIGURE_HIT_PADDING;\n',
            '            if (pos.x >= left && pos.x <= right && pos.y >= top && pos.y <= bottom) {\n',
            '                let hitElement = false;\n',
            '                for (let p of c.points) {\n',
            '                    if (!isObjectActive(p)) { hitElement = true; break; }\n',
            '                    if (distance(pos, {x: p.px, y: p.py}) < HIT_THRESHOLD) { hitElement = true; break; }\n',
            '                }\n',
            '                if (hitElement) continue;\n',
            '                dragMode = \'cluster\';\n',
            '                dragTarget = c;\n',
            '                isDragging = true;\n',
            '                draggedPointIndex = -1;\n',
            '                const centerPixel = fieldToPixel(c.center.x, c.center.y);\n',
            '                dragOffsetX = pos.x - centerPixel.x;\n',
            '                dragOffsetY = pos.y - centerPixel.y;\n',
            '                clusterDragStartCenter = { x: c.center.x, y: c.center.y };\n',
            '                return;\n',
            '            }\n',
            '        }\n',
            '    }\n',
            '\n',
            '    function clampFieldPoint(pos) {\n',
            '        pos.x = Math.min(Math.max(pos.x, -FIELD_WIDTH/2), FIELD_WIDTH/2);\n',
            '        pos.y = Math.min(Math.max(pos.y, -FIELD_HEIGHT/2), FIELD_HEIGHT/2);\n',
            '    }\n',
            '\n',
            '    function checkCollisionAt(collider, pos) {\n',
            '      const margin = collider.collisionMargin || 0;\n',
            '      if (collider.collideWithPoints) {\n',
            '        for (let other of points) {\n',
            '          if (!other || !other.pos || other.hidden) continue;\n',
            '          if (other.collision === false || other.collideWithPoints === false) continue;\n',
            '          if (!canCollideWith(collider, other)) continue;\n',
            '          if (distance(pos, other.pos) < MIN_DIST + margin + (other.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithLines) {\n',
            '        for (let l of lines) {\n',
            '          if (l.collision === false) continue;\n',
            '          if (!canCollideWith(collider, l)) continue;\n',
            '          const c = closestPointOnSegment(pos, l.pA.pos, l.pB.pos);\n',
            '          if (distance(pos, c) < MIN_DIST + margin + (l.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithCircles) {\n',
            '        for (let c of circles) {\n',
            '          if (c.collision === false || !c.center) continue;\n',
            '          if (!canCollideWith(collider, c)) continue;\n',
            '          const cc = closestPointOnCircleBoundary(pos, c.center, c.radius);\n',
            '          if (distance(pos, cc) < MIN_DIST + margin + (c.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithEllipses) {\n',
            '        for (let e of ellipses) {\n',
            '          if (e.collision === false) continue;\n',
            '          if (!canCollideWith(collider, e)) continue;\n',
            '          const cc = closestPointOnEllipseBoundary(pos, e);\n',
            '          if (cc && distance(pos, cc) < MIN_DIST + margin + (e.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithArcs) {\n',
            '        for (let a of arcs) {\n',
            '          if (a.collision === false) continue;\n',
            '          if (!canCollideWith(collider, a)) continue;\n',
            '          const cc = closestPointOnArcBoundary(pos, a);\n',
            '          if (cc && distance(pos, cc) < MIN_DIST + margin + (a.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithCurves) {\n',
            '        for (let cv of curves) {\n',
            '          if (cv.collision === false) continue;\n',
            '          if (!canCollideWith(collider, cv)) continue;\n',
            '          const pts = [];\n',
            '          for (let i = 0; i <= 30; i++) { const pt = curvePointAt(cv, i / 30); if (pt) pts.push(pt); }\n',
            '          if (pts.length < 2) continue;\n',
            '          const c = closestPointOnPolyline(pos, pts);\n',
            '          if (c && distance(pos, c) < MIN_DIST + margin + (cv.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithFigures) {\n',
            '        for (let f of figures) {\n',
            '          if (f === collider || f.collision === false) continue;\n',
            '          if (f.points && f.points.includes(collider)) continue;\n',
            '          if (!canCollideWith(collider, f)) continue;\n',
            '          const boundary = figureBoundaryPoints(f);\n',
            '          if (!boundary) continue;\n',
            '          const cc = closestPointOnPolyline(pos, boundary);\n',
            '          if (cc && distance(pos, cc) < MIN_DIST + margin + (f.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithClusters) {\n',
            '        for (let c of clusters) {\n',
            '          if (c === collider || c.collision === false) continue;\n',
            '          if (c.points && c.points.includes(collider)) continue;\n',
            '          if (c.elements && c.elements.includes(collider)) continue;\n',
            '          if (!canCollideWith(collider, c)) continue;\n',
            '          const boundary = clusterBoundaryPoints(c);\n',
            '          if (!boundary) continue;\n',
            '          const cc = closestPointOnPolyline(pos, boundary);\n',
            '          if (cc && distance(pos, cc) < MIN_DIST + margin + (c.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      return false;\n',
            '    }\n',
            '    function objectViolatesCollision(collider, testPoints) {\n',
            '      if (collider.collision === false || window.collisionsEnabled === false) return false;\n',
            '      return testPoints.some(pos => checkCollisionAt(collider, pos));\n',
            '    }\n',
            '\n',
            '    function moveFigure(fig, mousePixel) {\n',
            '        const mouseField = pixelToField(mousePixel.x - dragOffsetX, mousePixel.y - dragOffsetY);\n',
            '        if (isNaN(mouseField.x) || isNaN(mouseField.y)) return false;\n',
            '        const oldCenter = { x: fig.center.x, y: fig.center.y };\n',
            '        fig.center = { x: mouseField.x, y: mouseField.y };\n',
            '        applyFigureTransform(fig);\n',
            '        const figSnap = computeBodySnapDelta(fig.points);\n',
            '        if (figSnap.dx !== 0 || figSnap.dy !== 0) {\n',
            '            fig.center.x += figSnap.dx; fig.center.y += figSnap.dy;\n',
            '            applyFigureTransform(fig);\n',
            '        }\n',
            '        let minDx = 0, maxDx = 0, minDy = 0, maxDy = 0;\n',
            '        for (let p of fig.points) {\n',
            '            const overLeft = -FIELD_WIDTH/2 - p.pos.x;\n',
            '            if (overLeft > 0 && overLeft > minDx) minDx = overLeft;\n',
            '            const overRight = p.pos.x - FIELD_WIDTH/2;\n',
            '            if (overRight > 0 && overRight > maxDx) maxDx = overRight;\n',
            '            const overBottom = -FIELD_HEIGHT/2 - p.pos.y;\n',
            '            if (overBottom > 0 && overBottom > minDy) minDy = overBottom;\n',
            '            const overTop = p.pos.y - FIELD_HEIGHT/2;\n',
            '            if (overTop > 0 && overTop > maxDy) maxDy = overTop;\n',
            '        }\n',
            '        const shiftX = minDx > 0 ? minDx : (maxDx > 0 ? -maxDx : 0);\n',
            '        const shiftY = minDy > 0 ? minDy : (maxDy > 0 ? -maxDy : 0);\n',
            '        if (shiftX !== 0 || shiftY !== 0) {\n',
            '            fig.center.x += shiftX;\n',
            '            fig.center.y += shiftY;\n',
            '            applyFigureTransform(fig);\n',
            '        }\n',
            '        if (objectViolatesCollision(fig, fig.points.map(p => p.pos))) {\n',
            '            fig.center = oldCenter;\n',
            '            applyFigureTransform(fig);\n',
            '            updateScene();\n',
            '            return false;\n',
            '        }\n',
            '        updateScene();\n',
            '        return true;\n',
            '    }\n',
            '\n',
            '    // Перетаскивание кластера как единого жёсткого тела: чистая трансляция —\n',
            '    // центр масс переносится под курсор, relVectors (и текущий rotate) не меняются,\n',
            '    // поэтому взаимные расстояния всех точек тела сохраняются в точности.\n',
            '    function moveCluster(c, mousePixel) {\n',
            '        const mouseField = pixelToField(mousePixel.x - dragOffsetX, mousePixel.y - dragOffsetY);\n',
            '        if (isNaN(mouseField.x) || isNaN(mouseField.y)) return false;\n',
            '        const oldCenter = { x: c.center.x, y: c.center.y };\n',
            '        c.center = { x: mouseField.x, y: mouseField.y };\n',
            '        applyClusterTransform(c);\n',
            '        const clusterSnap = computeBodySnapDelta(c.points);\n',
            '        if (clusterSnap.dx !== 0 || clusterSnap.dy !== 0) {\n',
            '            c.center.x += clusterSnap.dx; c.center.y += clusterSnap.dy;\n',
            '            applyClusterTransform(c);\n',
            '        }\n',
            '        let minDx = 0, maxDx = 0, minDy = 0, maxDy = 0;\n',
            '        for (let p of c.points) {\n',
            '            const overLeft = -FIELD_WIDTH/2 - p.pos.x;\n',
            '            if (overLeft > 0 && overLeft > minDx) minDx = overLeft;\n',
            '            const overRight = p.pos.x - FIELD_WIDTH/2;\n',
            '            if (overRight > 0 && overRight > maxDx) maxDx = overRight;\n',
            '            const overBottom = -FIELD_HEIGHT/2 - p.pos.y;\n',
            '            if (overBottom > 0 && overBottom > minDy) minDy = overBottom;\n',
            '            const overTop = p.pos.y - FIELD_HEIGHT/2;\n',
            '            if (overTop > 0 && overTop > maxDy) maxDy = overTop;\n',
            '        }\n',
            '        const shiftX = minDx > 0 ? minDx : (maxDx > 0 ? -maxDx : 0);\n',
            '        const shiftY = minDy > 0 ? minDy : (maxDy > 0 ? -maxDy : 0);\n',
            '        if (shiftX !== 0 || shiftY !== 0) {\n',
            '            c.center.x += shiftX;\n',
            '            c.center.y += shiftY;\n',
            '            applyClusterTransform(c);\n',
            '        }\n',
            '        if (objectViolatesCollision(c, c.points.map(p => p.pos))) {\n',
            '            c.center = oldCenter;\n',
            '            applyClusterTransform(c);\n',
            '            updateScene();\n',
            '            return false;\n',
            '        }\n',
            '        updateScene();\n',
            '        return true;\n',
            '    }\n',
            '\n',
            '    function moveLine(index, mousePosPixel) {\n',
            '        const l = lines[index];\n',
            '        if (!l) return false;\n',
            '        const mouseField = pixelToField(mousePosPixel.x, mousePosPixel.y);\n',
            '        if (isNaN(mouseField.x) || isNaN(mouseField.y)) return false;\n',
            '        const dx = lineDragStartPosB.x - lineDragStartPosA.x;\n',
            '        const dy = lineDragStartPosB.y - lineDragStartPosA.y;\n',
            '        const len = Math.hypot(dx, dy);\n',
            '        if (len < 0.001) return false;\n',
            '        const nx = -dy / len;\n',
            '        const ny = dx / len;\n',
            '        const deltaX = mouseField.x - lineDragStartMouseField.x;\n',
            '        const deltaY = mouseField.y - lineDragStartMouseField.y;\n',
            '        const move = deltaX * nx + deltaY * ny;\n',
            '        if (Math.abs(move) < 0.001) return true;\n',
            '        let newA = { x: lineDragStartPosA.x + move * nx, y: lineDragStartPosA.y + move * ny };\n',
            '        let newB = { x: lineDragStartPosB.x + move * nx, y: lineDragStartPosB.y + move * ny };\n',
            '        clampFieldPoint(newA); clampFieldPoint(newB);\n',
            '        const pA = l.pA, pB = l.pB;\n',
            '        const pAIndex = points.indexOf(pA);\n',
            '        const pBIndex = points.indexOf(pB);\n',
            '        if (pAIndex === -1 || pBIndex === -1) return false;\n',
            '        const oldA = { ...pA.pos }, oldB = { ...pB.pos };\n',
            '        pA.pos = newA; pB.pos = newB;\n',
            '        if (distance(pA.pos, pB.pos) < 0.01 || objectViolatesCollision(l, [pA.pos, pB.pos])) {\n',
            '            pA.pos = oldA; pB.pos = oldB;\n',
            '            return false;\n',
            '        }\n',
            '        updateFiguresForPoint(pAIndex); updateFiguresForPoint(pBIndex); updateClustersForPoint(pAIndex); updateClustersForPoint(pBIndex);\n',
            '        updateScene(); return true;\n',
            '    }\n',
            '\n',
            '    function handleLockedAngleMove(angle, mode, line, targetPoint, startPixel, currentPixel) {\n',
            '        const startField = pixelToField(startPixel.x, startPixel.y);\n',
            '        const currentField = pixelToField(currentPixel.x, currentPixel.y);\n',
            '        const dx = currentField.x - startField.x;\n',
            '        const dy = currentField.y - startField.y;\n',
            '        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return true;\n',
            '        if (mode === \'free\') {\n',
            '            return moveLockedAngle(angle, dx, dy, \'free\', null);\n',
            '        } else if (mode === \'line\' && line) {\n',
            '            return moveLockedAngle(angle, dx, dy, \'line\', line);\n',
            '        } else if (mode === \'pointOnSide\' && targetPoint && line) {\n',
            '            const vertex = angle.vertex;\n',
            '            const dirX = targetPoint.pos.x - vertex.pos.x;\n',
            '            const dirY = targetPoint.pos.y - vertex.pos.y;\n',
            '            const len = Math.hypot(dirX, dirY);\n',
            '            if (len < 0.001) return false;\n',
            '            const normX = dirX / len, normY = dirY / len;\n',
            '            const proj = dx * normX + dy * normY;\n',
            '            const oldPos = { x: targetPoint.pos.x, y: targetPoint.pos.y };\n',
            '            targetPoint.pos.x += proj * normX; targetPoint.pos.y += proj * normY;\n',
            '            clampFieldPoint(targetPoint.pos);\n',
            '            let collision = false;\n',
            '            for (let p of points) { if (p === targetPoint) continue; if (distance(targetPoint.pos, p.pos) < MIN_DIST) { collision = true; break; } }\n',
            '            if (collision || distance(targetPoint.pos, vertex.pos) < MIN_DIST) { targetPoint.pos = oldPos; return false; }\n',
            '            const idx = points.indexOf(targetPoint); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            computeAngleMeasure(angle); updateScene(); return true;\n',
            '        }\n',
            '        return false;\n',
            '    }\n',
            '\n',
            '    function onPointerMove(e) {\n',
            '        if (dragMode === null) return;\n',
            '        const pos = getPointerPos(e);\n',
            '        if (dragMode === \'pointOnLine\') {\n',
            '            const p = pointOnLinePoint, line = pointOnLineLine;\n',
            '            if (!p || !line) return;\n',
            '            const pA = line.pA.pos, pB = line.pB.pos;\n',
            '            const mouseField = pixelToField(pos.x, pos.y);\n',
            '            const dx = pB.x - pA.x, dy = pB.y - pA.y;\n',
            '            const lenSq = dx*dx + dy*dy;\n',
            '            if (lenSq < 0.0001) return;\n',
            '            const t = ((mouseField.x - pA.x)*dx + (mouseField.y - pA.y)*dy) / lenSq;\n',
            '            const clampedT = Math.min(1, Math.max(0, t));\n',
            '            p.t = clampedT;\n',
            '            p.pos.x = pA.x + dx * clampedT; p.pos.y = pA.y + dy * clampedT;\n',
            '            const idx = points.indexOf(p); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            updateScene(); draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'pointOnCircle\') {\n',
            '            const p = pointOnCirclePoint, circle = pointOnCircleCircle;\n',
            '            if (!p || !circle) return;\n',
            '            const mouseField = pixelToField(pos.x, pos.y);\n',
            '            const cx = circle.center.x, cy = circle.center.y;\n',
            '            const dx = mouseField.x - cx, dy = mouseField.y - cy;\n',
            '            const angle = Math.atan2(dy, dx);\n',
            '            let t = angle / (2 * Math.PI); if (t < 0) t += 1;\n',
            '            p.t = t;\n',
            '            p.pos.x = cx + circle.radius * Math.cos(angle);\n',
            '            p.pos.y = cy + circle.radius * Math.sin(angle);\n',
            '            const idx = points.indexOf(p); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            updateScene(); draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'pointOnEllipse\') {\n',
            '            const p = pointOnEllipsePoint, ellipse = pointOnEllipseEllipse;\n',
            '            if (!p || !ellipse || !ellipse.centerPoint) return;\n',
            '            const mouseField = pixelToField(pos.x, pos.y);\n',
            '            const cx = ellipse.centerPoint.pos.x, cy = ellipse.centerPoint.pos.y;\n',
            '            const rotRad = (ellipse.rotate || 0) * Math.PI / 180;\n',
            '            const cs = Math.cos(-rotRad), sn = Math.sin(-rotRad);\n',
            '            const dx = mouseField.x - cx, dy = mouseField.y - cy;\n',
            '            const lx = dx * cs - dy * sn, ly = dx * sn + dy * cs;\n',
            '            let t = Math.atan2(ly / (ellipse.b || 1), lx / (ellipse.a || 1)) / (2 * Math.PI);\n',
            '            if (t < 0) t += 1;\n',
            '            p.t = t;\n',
            '            const idx = points.indexOf(p); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            updateScene(); draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'ellipseAxisHandle\') {\n',
            '            const p = ellipseAxisPoint, ellipse = ellipseAxisEllipse;\n',
            '            if (!p || !ellipse || !ellipse.centerPoint) return;\n',
            '            const mouseField = pixelToField(pos.x, pos.y);\n',
            '            const cx = ellipse.centerPoint.pos.x, cy = ellipse.centerPoint.pos.y;\n',
            '            const rotRad = (ellipse.rotate || 0) * Math.PI / 180;\n',
            '            const cs = Math.cos(-rotRad), sn = Math.sin(-rotRad);\n',
            '            const dx = mouseField.x - cx, dy = mouseField.y - cy;\n',
            '            const lx = dx * cs - dy * sn, ly = dx * sn + dy * cs;\n',
            '            if (p.axis === \'a\') { ellipse.a = Math.max(0.1, Math.abs(lx)); ellipse.aExpr = String(ellipse.a); }\n',
            '            else { ellipse.b = Math.max(0.1, Math.abs(ly)); ellipse.bExpr = String(ellipse.b); }\n',
            '            updateScene(); draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'pointOnCurve\') {\n',
            '            const p = pointOnCurvePoint, curve = pointOnCurveCurve;\n',
            '            if (!p || !curve) return;\n',
            '            const mouseField = pixelToField(pos.x, pos.y);\n',
            '            p.t = findNearestTOnCurve(curve, mouseField);\n',
            '            const idx = points.indexOf(p); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            updateScene(); draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'pointOnGraph\') {\n',
            '            const p = pointOnGraphPoint, g = pointOnGraphGraph;\n',
            '            if (!p || !g) return;\n',
            '            const mouseField = pixelToField(pos.x, pos.y);\n',
            '            const span = g.xmax - g.xmin;\n',
            '            if (Math.abs(span) < 1e-12) return;\n',
            '            p.t = Math.min(1, Math.max(0, (mouseField.x - g.xmin) / span));\n',
            '            const idx = points.indexOf(p); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            updateScene(); draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'pointOnArc\') {\n',
            '            const p = pointOnArcPoint, arc = pointOnArcArc;\n',
            '            if (!p || !arc || !arc.centerPoint) return;\n',
            '            const radius = arc.type === \'ThreePoints\' ? arc.radius : (arc.radiusNum !== null ? arc.radiusNum : (arc.radiusPoint ? Math.hypot(arc.radiusPoint.pos.x - arc.centerPoint.pos.x, arc.radiusPoint.pos.y - arc.centerPoint.pos.y) : 0));\n',
            '            if (!(radius > 0)) return;\n',
            '            const centerPix = fieldToPixel(arc.centerPoint.pos.x, arc.centerPoint.pos.y);\n',
            '            const p1x = fieldToPixel(arc.fromPoint.pos.x, arc.fromPoint.pos.y);\n',
            '            const p2x = fieldToPixel(arc.toPoint.pos.x, arc.toPoint.pos.y);\n',
            '            const ang1 = Math.atan2(p1x.y - centerPix.y, p1x.x - centerPix.x);\n',
            '            const ang2 = Math.atan2(p2x.y - centerPix.y, p2x.x - centerPix.x);\n',
            '            const TAU = Math.PI * 2;\n',
            '            const norm = (x) => ((x % TAU) + TAU) % TAU;\n',
            '            const sweep = norm(ang2 - ang1);\n',
            '            let anticw = false;\n',
            '            if (arc.type === \'ThreePoints\' && arc.midPoint) {\n',
            '                const pm = fieldToPixel(arc.midPoint.pos.x, arc.midPoint.pos.y);\n',
            '                const angM = Math.atan2(pm.y - centerPix.y, pm.x - centerPix.x);\n',
            '                if (norm(angM - ang1) > sweep) anticw = true;\n',
            '            }\n',
            '            const effSweep = anticw ? -(TAU - sweep) : sweep;\n',
            '            const mouseAng = Math.atan2(pos.y - centerPix.y, pos.x - centerPix.x);\n',
            '            const normDiff = norm(mouseAng - ang1);\n',
            '            let t = effSweep >= 0 ? normDiff / effSweep : (normDiff - TAU) / effSweep;\n',
            '            p.t = Math.max(0, Math.min(1, t));\n',
            '            const idx = points.indexOf(p); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            updateScene(); draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'lockedAngle\') {\n',
            '            const moved = handleLockedAngleMove(lockedAngleDrag, lockedAngleDragMode, lockedAngleDragLine, null, dragStartPos, pos);\n',
            '            if (moved) { dragStartPos = { x: pos.x, y: pos.y }; }\n',
            '            draw(); return;\n',
            '        } else if (dragMode === \'lockedPointOnSide\') {\n',
            '            const moved = handleLockedAngleMove(lockedAngleDrag, \'pointOnSide\', lockedAngleDragLine, lockedPointTarget, dragStartPos, pos);\n',
            '            if (moved) { dragStartPos = { x: pos.x, y: pos.y }; }\n',
            '            draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'point\') {\n',
            '            let newPx = pos.x - dragOffsetX, newPy = pos.y - dragOffsetY;\n',
            '            let fieldPos = pixelToField(newPx, newPy);\n',
            '            if (isNaN(fieldPos.x) || isNaN(fieldPos.y)) return;\n',
            '            clampFieldPoint(fieldPos);\n',
            '            const p = points[dragTarget];\n',
            '            const snapped = computeSnap(fieldPos, [p]);\n',
            '            if (snapped.x !== fieldPos.x || snapped.y !== fieldPos.y) {\n',
            '                const snapPixel = fieldToPixel(snapped.x, snapped.y);\n',
            '                dragOffsetX = pos.x - snapPixel.x; dragOffsetY = pos.y - snapPixel.y;\n',
            '                fieldPos = snapped;\n',
            '            }\n',
            '            const correctedPos = resolveCollision(dragTarget, fieldPos);\n',
            '            if (correctedPos.x !== fieldPos.x || correctedPos.y !== fieldPos.y) {\n',
            '                const newPixel = fieldToPixel(correctedPos.x, correctedPos.y);\n',
            '                dragOffsetX = pos.x - newPixel.x; dragOffsetY = pos.y - newPixel.y;\n',
            '                fieldPos = correctedPos;\n',
            '            }\n',
            '            p.pos.x = fieldPos.x; p.pos.y = fieldPos.y;\n',
            '            p.dirty = true;\n',
            '            if (p.lineName) { p.lineName = null; p.t = undefined; }\n',
            '            if (p.circleName) { p.circleName = null; p.t = undefined; }\n',
            '            updateFiguresForPoint(dragTarget); updateClustersForPoint(dragTarget); updateScene(); draw();\n',
            '        } else if (dragMode === \'line\') {\n',
            '            if (moveLine(dragTarget, pos)) { draw(); }\n',
            '        } else if (dragMode === \'figure\') {\n',
            '            if (moveFigure(dragTarget, pos)) { draw(); }\n',
            '        } else if (dragMode === \'cluster\') {\n',
            '            if (moveCluster(dragTarget, pos)) { draw(); }\n',
            '        }\n',
            '    }\n',
            '\n',
            '    function onPointerUp(e) {\n',
            '        dragMode = null; dragTarget = null; lockedAngleDrag = null; lockedAngleDragLine = null; lockedPointTarget = null;\n',
            '        pointOnLinePoint = null; pointOnLineLine = null; pointOnCirclePoint = null; pointOnCircleCircle = null;\n',
            '        pointOnEllipsePoint = null; pointOnEllipseEllipse = null; ellipseAxisPoint = null; ellipseAxisEllipse = null;\n',
            '        pointOnCurvePoint = null; pointOnCurveCurve = null; pointOnArcPoint = null; pointOnArcArc = null;\n',
            '        pointOnGraphPoint = null; pointOnGraphGraph = null;\n',
            '        isDragging = false; draggedPointIndex = -1;\n',
            '        activeSnapGuides = [];\n',
            '        markSceneChanged();\n',
            '    }\n',
            '\n',
            '    canvas.addEventListener(\'mousedown\', onPointerDown);\n',
            '    window.addEventListener(\'mousemove\', onPointerMove);\n',
            '    window.addEventListener(\'mouseup\', onPointerUp);\n',
            '    canvas.addEventListener(\'touchstart\', onPointerDown, { passive: false });\n',
            '    window.addEventListener(\'touchmove\', onPointerMove, { passive: false });\n',
            '    window.addEventListener(\'touchend\', onPointerUp, { passive: false });\n',
            '\n',
            '    // ---- Камера: масштабирование колесом и панорамирование (Задача 3) ----\n',
            '    let isPanning = false;\n',
            '    let panStartPixel = { x: 0, y: 0 };\n',
            '    let panStartOffset = { x: 0, y: 0 };\n',
            '    function isPanTrigger(e) { return e.button === 1 || (e.button === 0 && e.ctrlKey); }\n',
            '    canvas.addEventListener(\'mousedown\', function(e) {\n',
            '        if (!isPanTrigger(e)) return;\n',
            '        e.preventDefault();\n',
            '        isPanning = true;\n',
            '        panStartPixel = getPointerPos(e);\n',
            '        panStartOffset = { x: camera.offsetX, y: camera.offsetY };\n',
            '        e.stopImmediatePropagation();\n',
            '    }, true);\n',
            '    window.addEventListener(\'mousemove\', function(e) {\n',
            '        if (!isPanning) return;\n',
            '        const cur = getPointerPos(e);\n',
            '        const scale = fieldScale();\n',
            '        if (scale <= 0) return;\n',
            '        camera.offsetX = panStartOffset.x - (cur.x - panStartPixel.x) / scale;\n',
            '        camera.offsetY = panStartOffset.y + (cur.y - panStartPixel.y) / scale;\n',
            '        markSceneChanged(); draw();\n',
            '    }, true);\n',
            '    window.addEventListener(\'mouseup\', function() { isPanning = false; }, true);\n',
            '    canvas.addEventListener(\'wheel\', function(e) {\n',
            '        e.preventDefault();\n',
            '        const factor = e.deltaY > 0 ? 0.9 : 1.1;\n',
            '        const mousePixel = getPointerPos(e);\n',
            '        const before = pixelToField(mousePixel.x, mousePixel.y);\n',
            '        camera.zoom = Math.max(camera.zoomMin, Math.min(camera.zoomMax, camera.zoom * factor));\n',
            '        const after = pixelToField(mousePixel.x, mousePixel.y);\n',
            '        camera.offsetX += before.x - after.x;\n',
            '        camera.offsetY += before.y - after.y;\n',
            '        markSceneChanged(); draw();\n',
            '    }, { passive: false });\n',
            '\n',
            '    function resizeCanvas() {\n',
            '        const wrapper = canvas.parentElement;\n',
            '        const maxWidth = Math.min(800, wrapper.clientWidth);\n',
            '        canvas.style.width = maxWidth + \'px\';\n',
            '        canvas.width = maxWidth;\n',
            '        const aspect = FIELD_HEIGHT / FIELD_WIDTH;\n',
            '        const newHeight = Math.floor(maxWidth * aspect);\n',
            '        canvas.style.height = newHeight + \'px\';\n',
            '        canvas.height = newHeight;\n',
            '        width = canvas.width; height = canvas.height;\n',
            '        draw();\n',
            '    }\n',
            '\n',
            '    window.addEventListener(\'resize\', resizeCanvas);\n',
            '\n',
            '    // ===== UI =====\n',
            '\n',
            '    // ==========================================================================\n',
            '    // СИМВОЛЬНАЯ МАТЕМАТИКА (CAS)\n',
            '    // Работает на AST мини-языка:\n',
            '    //   { type:\'num\', value } | { type:\'ident\', name } | { type:\'bin\', op, l, r }\n',
            '    //   { type:\'pow\', base, exp } | { type:\'neg\', expr } | { type:\'call\', name, args }\n',
            '    // ==========================================================================\n',
            '    var SYM_BS = String.fromCharCode(92);\n',
            '    function symTex(name) { return SYM_BS + name; }\n',
            '\n',
            '    function symParse(x) {\n',
            '        if (x && typeof x === \'object\' && x.type) return x;\n',
            '        return glParseExprOnly(String(x));\n',
            '    }\n',
            '    function symNum(v) { return { type: \'num\', value: v }; }\n',
            '    function symIdent(nm) { return { type: \'ident\', name: nm }; }\n',
            '    function symBin(op, l, r) { return { type: \'bin\', op: op, l: l, r: r }; }\n',
            '    function symPow(b, e) { return { type: \'pow\', base: b, exp: e }; }\n',
            '    function symNeg(e) { return { type: \'neg\', expr: e }; }\n',
            '    function symCall(nm, args) { return { type: \'call\', name: nm, args: args }; }\n',
            '    function symIsNum(n, v) {\n',
            '        return n && n.type === \'num\' && (v === undefined || Math.abs(n.value - v) < 1e-12);\n',
            '    }\n',
            '    // "Хорошее" число — целое или простая дробь: не превращаем 1/3 в 0.333...\n',
            '    function symNice(v) {\n',
            '        if (!isFinite(v)) return false;\n',
            '        for (var d = 1; d <= 24; d++) { if (Math.abs(v * d - Math.round(v * d)) < 1e-10) return true; }\n',
            '        return false;\n',
            '    }\n',
            '\n',
            '    // Канонический ключ узла — для группировки подобных членов\n',
            '    function symKey(n) {\n',
            '        if (!n) return \'nil\';\n',
            '        switch (n.type) {\n',
            '            case \'num\': return \'N\' + n.value;\n',
            '            case \'ident\': return \'I\' + n.name;\n',
            '            case \'str\': return \'S\' + n.value;\n',
            '            case \'neg\': return \'G(\' + symKey(n.expr) + \')\';\n',
            '            case \'bin\': return \'B\' + n.op + \'(\' + symKey(n.l) + \',\' + symKey(n.r) + \')\';\n',
            '            case \'pow\': return \'P(\' + symKey(n.base) + \',\' + symKey(n.exp) + \')\';\n',
            '            case \'call\': return \'C\' + n.name + \'(\' + n.args.map(symKey).join(\',\') + \')\';\n',
            '            default: return \'X\' + JSON.stringify(n);\n',
            '        }\n',
            '    }\n',
            '    function symEqual(a, b) { return symKey(a) === symKey(b); }\n',
            '\n',
            '    // Разворачивание вложенных сумм/произведений в плоские списки\n',
            '    function symFlatSum(n, sign, out) {\n',
            '        if (n.type === \'bin\' && n.op === \'+\') { symFlatSum(n.l, sign, out); symFlatSum(n.r, sign, out); return; }\n',
            '        if (n.type === \'bin\' && n.op === \'-\') { symFlatSum(n.l, sign, out); symFlatSum(n.r, -sign, out); return; }\n',
            '        if (n.type === \'neg\') { symFlatSum(n.expr, -sign, out); return; }\n',
            '        out.push({ sign: sign, node: n });\n',
            '    }\n',
            '    function symFlatProd(n, out) {\n',
            '        if (n.type === \'bin\' && n.op === \'*\') { symFlatProd(n.l, out); symFlatProd(n.r, out); return; }\n',
            '        out.push(n);\n',
            '    }\n',
            '    // Раскладывает узел на числовой коэффициент и остальную (символьную) часть\n',
            '    function symSplitCoef(node) {\n',
            '        var prod = [];\n',
            '        symFlatProd(node, prod);\n',
            '        var coef = 1;\n',
            '        var rest = [];\n',
            '        for (var i = 0; i < prod.length; i++) {\n',
            '            var f = prod[i];\n',
            '            if (f.type === \'neg\') { coef = -coef; f = f.expr; }\n',
            '            if (f.type === \'num\') { coef *= f.value; continue; }\n',
            '            rest.push(f);\n',
            '        }\n',
            '        if (rest.length === 0) return { coef: coef, rest: null };\n',
            '        var r = rest[0];\n',
            '        for (var j = 1; j < rest.length; j++) r = symBin(\'*\', r, rest[j]);\n',
            '        return { coef: coef, rest: r };\n',
            '    }\n',
            '\n',
            '    var SYM_NUM_FUNCS = {\n',
            '        sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos,\n',
            '        atan: Math.atan, exp: Math.exp, log: Math.log, sqrt: Math.sqrt, abs: Math.abs,\n',
            '        sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, cbrt: Math.cbrt,\n',
            '        floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign\n',
            '    };\n',
            '\n',
            '    // Степень монома по переменной v (для сортировки по убыванию)\n',
            '    function symDegreeOf(node, v) {\n',
            '        var sp = symSplitCoef(node);\n',
            '        if (sp.rest === null) return 0;\n',
            '        var fs = [];\n',
            '        symFlatProd(sp.rest, fs);\n',
            '        var deg = 0;\n',
            '        for (var i = 0; i < fs.length; i++) {\n',
            '            var f = fs[i];\n',
            '            if (f.type === \'ident\' && f.name === v) { deg += 1; continue; }\n',
            '            if (f.type === \'pow\' && f.base.type === \'ident\' && f.base.name === v &&\n',
            '                f.exp.type === \'num\') { deg += f.exp.value; continue; }\n',
            '        }\n',
            '        return deg;\n',
            '    }\n',
            '    // Главная переменная выражения — для осмысленной сортировки членов\n',
            '    function symMainVar(node) {\n',
            '        var seen = [];\n',
            '        (function walk(n) {\n',
            '            if (!n || typeof n !== \'object\') return;\n',
            '            if (n.type === \'ident\') { if (seen.indexOf(n.name) === -1) seen.push(n.name); return; }\n',
            '            if (n.type === \'bin\') { walk(n.l); walk(n.r); return; }\n',
            '            if (n.type === \'pow\') { walk(n.base); walk(n.exp); return; }\n',
            '            if (n.type === \'neg\') { walk(n.expr); return; }\n',
            '            if (n.type === \'call\') { for (var i = 0; i < n.args.length; i++) walk(n.args[i]); return; }\n',
            '        })(node);\n',
            '        if (seen.indexOf(\'x\') !== -1) return \'x\';\n',
            '        return seen.length ? seen[0] : \'x\';\n',
            '    }\n',
            '\n',
            '    // ---------- УПРОЩЕНИЕ ----------\n',
            '    function symSimplify(node, depth) {\n',
            '        depth = depth || 0;\n',
            '        if (!node || depth > 60) return node;\n',
            '        switch (node.type) {\n',
            '            case \'num\': case \'ident\': case \'str\': case \'bool\': return node;\n',
            '            case \'neg\': {\n',
            '                var e = symSimplify(node.expr, depth + 1);\n',
            '                if (e.type === \'num\') return symNum(-e.value);\n',
            '                if (e.type === \'neg\') return e.expr;\n',
            '                return symNeg(e);\n',
            '            }\n',
            '            case \'pow\': {\n',
            '                var b = symSimplify(node.base, depth + 1), ex = symSimplify(node.exp, depth + 1);\n',
            '                if (ex.type === \'num\') {\n',
            '                    if (Math.abs(ex.value) < 1e-12) return symNum(1);\n',
            '                    if (Math.abs(ex.value - 1) < 1e-12) return b;\n',
            '                    if (b.type === \'num\') {\n',
            '                        var pv = Math.pow(b.value, ex.value);\n',
            '                        if (symNice(pv)) return symNum(pv);\n',
            '                    }\n',
            '                    // (u^a)^b = u^(a*b)\n',
            '                    if (b.type === \'pow\' && b.exp.type === \'num\') {\n',
            '                        return symSimplify(symPow(b.base, symNum(b.exp.value * ex.value)), depth + 1);\n',
            '                    }\n',
            '                }\n',
            '                if (symIsNum(b, 1)) return symNum(1);\n',
            '                if (symIsNum(b, 0)) return symNum(0);\n',
            '                return symPow(b, ex);\n',
            '            }\n',
            '            case \'call\': {\n',
            '                var args = [];\n',
            '                for (var i = 0; i < node.args.length; i++) args.push(symSimplify(node.args[i], depth + 1));\n',
            '                // exp(log u) = u, log(exp u) = u\n',
            '                if (node.name === \'exp\' && args[0] && args[0].type === \'call\' && args[0].name === \'log\') return args[0].args[0];\n',
            '                if (node.name === \'log\' && args[0] && args[0].type === \'call\' && args[0].name === \'exp\') return args[0].args[0];\n',
            '                if (node.name === \'sqrt\' && args[0] && args[0].type === \'num\' && args[0].value >= 0) {\n',
            '                    var rt = Math.sqrt(args[0].value);\n',
            '                    if (Math.abs(rt - Math.round(rt)) < 1e-12) return symNum(Math.round(rt));\n',
            '                }\n',
            '                var allNum = args.length > 0;\n',
            '                for (var k = 0; k < args.length; k++) if (args[k].type !== \'num\') { allNum = false; break; }\n',
            '                if (allNum && SYM_NUM_FUNCS[node.name]) {\n',
            '                    var vals = [];\n',
            '                    for (var m = 0; m < args.length; m++) vals.push(args[m].value);\n',
            '                    var res = SYM_NUM_FUNCS[node.name].apply(null, vals);\n',
            '                    if (typeof res === \'number\' && isFinite(res) &&\n',
            '                        Math.abs(res - Math.round(res)) < 1e-12) return symNum(Math.round(res));\n',
            '                }\n',
            '                return symCall(node.name, args);\n',
            '            }\n',
            '            case \'bin\': {\n',
            '                if (node.op === \'+\' || node.op === \'-\') return symSimplifySum(node, depth);\n',
            '                if (node.op === \'*\') return symSimplifyProd(node, depth);\n',
            '                if (node.op === \'/\') return symSimplifyDiv(node, depth);\n',
            '                var l2 = symSimplify(node.l, depth + 1), r2 = symSimplify(node.r, depth + 1);\n',
            '                if (l2.type === \'num\' && r2.type === \'num\' && node.op === \'%\') return symNum(l2.value % r2.value);\n',
            '                return symBin(node.op, l2, r2);\n',
            '            }\n',
            '        }\n',
            '        return node;\n',
            '    }\n',
            '\n',
            '    function symSimplifySum(node, depth) {\n',
            '        var terms = [];\n',
            '        symFlatSum(node, 1, terms);\n',
            '        var constant = 0;\n',
            '        var groups = [];\n',
            '        var index = {};\n',
            '        for (var i = 0; i < terms.length; i++) {\n',
            '            var s = symSimplify(terms[i].node, depth + 1);\n',
            '            var sign = terms[i].sign;\n',
            '            if (s.type === \'neg\') { s = s.expr; sign = -sign; }\n',
            '            var sp = symSplitCoef(s);\n',
            '            var coef = sp.coef * sign;\n',
            '            if (sp.rest === null) { constant += coef; continue; }\n',
            '            var key = symKey(sp.rest);\n',
            '            if (index[key] === undefined) {\n',
            '                index[key] = groups.length;\n',
            '                groups.push({ coef: coef, node: sp.rest });\n',
            '            } else {\n',
            '                groups[index[key]].coef += coef;\n',
            '            }\n',
            '        }\n',
            '        var out = [];\n',
            '        for (var g = 0; g < groups.length; g++) {\n',
            '            var grp = groups[g];\n',
            '            if (Math.abs(grp.coef) < 1e-12) continue;\n',
            '            out.push({ coef: grp.coef, node: grp.node });\n',
            '        }\n',
            '        // сортировка по убыванию степени главной переменной — привычный вид многочлена\n',
            '        var mv = symMainVar(node);\n',
            '        out.sort(function (a, b) {\n',
            '            var da = symDegreeOf(a.node, mv), db = symDegreeOf(b.node, mv);\n',
            '            if (da !== db) return db - da;\n',
            '            return symKey(a.node) < symKey(b.node) ? -1 : 1;\n',
            '        });\n',
            '        var pieces = [];\n',
            '        for (var p = 0; p < out.length; p++) {\n',
            '            var c = out[p].coef, nd = out[p].node;\n',
            '            var body;\n',
            '            if (Math.abs(Math.abs(c) - 1) < 1e-12) body = nd;\n',
            '            else body = symSimplifyProd(symBin(\'*\', symNum(Math.abs(c)), nd), depth + 1);\n',
            '            pieces.push({ sign: c < 0 ? -1 : 1, node: body });\n',
            '        }\n',
            '        if (Math.abs(constant) > 1e-12) {\n',
            '            pieces.push({ sign: constant < 0 ? -1 : 1, node: symNum(Math.abs(constant)) });\n',
            '        }\n',
            '        if (pieces.length === 0) return symNum(0);\n',
            '        var acc = pieces[0].sign < 0 ? symNeg(pieces[0].node) : pieces[0].node;\n',
            '        for (var q = 1; q < pieces.length; q++) {\n',
            '            acc = symBin(pieces[q].sign < 0 ? \'-\' : \'+\', acc, pieces[q].node);\n',
            '        }\n',
            '        return acc;\n',
            '    }\n',
            '\n',
            '    function symSimplifyProd(node, depth) {\n',
            '        var prod = [];\n',
            '        symFlatProd(node, prod);\n',
            '        var coef = 1;\n',
            '        var bases = [];\n',
            '        var index = {};\n',
            '        for (var i = 0; i < prod.length; i++) {\n',
            '            var s = symSimplify(prod[i], depth + 1);\n',
            '            if (s.type === \'neg\') { coef = -coef; s = s.expr; }\n',
            '            if (s.type === \'num\') { coef *= s.value; continue; }\n',
            '            var base = s, ex = symNum(1);\n',
            '            if (s.type === \'pow\') { base = s.base; ex = s.exp; }\n',
            '            var key = symKey(base);\n',
            '            if (index[key] === undefined) {\n',
            '                index[key] = bases.length;\n',
            '                bases.push({ base: base, exp: ex });\n',
            '            } else {\n',
            '                var cur = bases[index[key]];\n',
            '                if (cur.exp.type === \'num\' && ex.type === \'num\') cur.exp = symNum(cur.exp.value + ex.value);\n',
            '                else cur.exp = symBin(\'+\', cur.exp, ex);\n',
            '            }\n',
            '        }\n',
            '        if (Math.abs(coef) < 1e-12) return symNum(0);\n',
            '        var factors = [];\n',
            '        for (var b = 0; b < bases.length; b++) {\n',
            '            var e2 = symSimplify(bases[b].exp, depth + 1);\n',
            '            if (e2.type === \'num\') {\n',
            '                if (Math.abs(e2.value) < 1e-12) continue;\n',
            '                if (Math.abs(e2.value - 1) < 1e-12) { factors.push(bases[b].base); continue; }\n',
            '            }\n',
            '            factors.push(symPow(bases[b].base, e2));\n',
            '        }\n',
            '        factors.sort(function (a, b2) { return symKey(a) < symKey(b2) ? -1 : 1; });\n',
            '        var acc = null;\n',
            '        for (var f = 0; f < factors.length; f++) acc = acc === null ? factors[f] : symBin(\'*\', acc, factors[f]);\n',
            '        if (acc === null) return symNum(coef);\n',
            '        if (Math.abs(coef - 1) < 1e-12) return acc;\n',
            '        if (Math.abs(coef + 1) < 1e-12) return symNeg(acc);\n',
            '        return symBin(\'*\', symNum(coef), acc);\n',
            '    }\n',
            '\n',
            '    function symSimplifyDiv(node, depth) {\n',
            '        var l = symSimplify(node.l, depth + 1);\n',
            '        var r = symSimplify(node.r, depth + 1);\n',
            '        if (symIsNum(r, 1)) return l;\n',
            '        if (symIsNum(l, 0)) return symNum(0);\n',
            '        if (r.type === \'num\') {\n',
            '            if (l.type === \'num\') {\n',
            '                var v = l.value / r.value;\n',
            '                if (symNice(v)) return symNum(v);\n',
            '                return symBin(\'/\', l, r);\n',
            '            }\n',
            '            var sp = symSplitCoef(l);\n',
            '            var c = sp.coef / r.value;\n',
            '            if (sp.rest !== null && symNice(c)) return symSimplifyProd(symBin(\'*\', symNum(c), sp.rest), depth + 1);\n',
            '            return symBin(\'/\', l, r);\n',
            '        }\n',
            '        // символьный знаменатель: u/w = u * w^(-1) — сокращение происходит само,\n',
            '        // так как показатели одинаковых оснований складываются\n',
            '        if (symEqual(l, r)) return symNum(1);\n',
            '        return symSimplifyProd(symBin(\'*\', l, symPow(r, symNum(-1))), depth + 1);\n',
            '    }\n',
            '\n',
            '    // ---------- РАСКРЫТИЕ СКОБОК ----------\n',
            '    function symExpand(node, depth) {\n',
            '        depth = depth || 0;\n',
            '        if (!node || depth > 40) return node;\n',
            '        if (node.type === \'neg\') return symSimplify(symNeg(symExpand(node.expr, depth + 1)), depth);\n',
            '        if (node.type === \'bin\' && (node.op === \'+\' || node.op === \'-\')) {\n',
            '            return symSimplifySum(symBin(node.op, symExpand(node.l, depth + 1), symExpand(node.r, depth + 1)), depth);\n',
            '        }\n',
            '        if (node.type === \'bin\' && node.op === \'*\') {\n',
            '            var l = symExpand(node.l, depth + 1), r = symExpand(node.r, depth + 1);\n',
            '            var lt = [], rt = [];\n',
            '            symFlatSum(l, 1, lt); symFlatSum(r, 1, rt);\n',
            '            var acc = null;\n',
            '            for (var i = 0; i < lt.length; i++) {\n',
            '                for (var j = 0; j < rt.length; j++) {\n',
            '                    var term = symSimplifyProd(symBin(\'*\', lt[i].node, rt[j].node), depth + 1);\n',
            '                    var piece = (lt[i].sign * rt[j].sign) < 0 ? symNeg(term) : term;\n',
            '                    acc = acc === null ? piece : symBin(\'+\', acc, piece);\n',
            '                }\n',
            '            }\n',
            '            return symSimplifySum(acc === null ? symNum(0) : acc, depth);\n',
            '        }\n',
            '        if (node.type === \'pow\') {\n',
            '            var b = symExpand(node.base, depth + 1), e = symSimplify(node.exp, depth + 1);\n',
            '            if (e.type === \'num\' && Math.abs(e.value - Math.round(e.value)) < 1e-12 &&\n',
            '                e.value >= 2 && e.value <= 12) {\n',
            '                var acc2 = b;\n',
            '                for (var k = 1; k < Math.round(e.value); k++) acc2 = symExpand(symBin(\'*\', acc2, b), depth + 1);\n',
            '                return acc2;\n',
            '            }\n',
            '            return symSimplify(symPow(b, e), depth);\n',
            '        }\n',
            '        if (node.type === \'bin\' && node.op === \'/\') {\n',
            '            var ln = symExpand(node.l, depth + 1), rn = symSimplify(node.r, depth + 1);\n',
            '            if (rn.type === \'num\') {\n',
            '                var terms = [];\n',
            '                symFlatSum(ln, 1, terms);\n',
            '                var acc3 = null;\n',
            '                for (var t = 0; t < terms.length; t++) {\n',
            '                    var piece2 = symSimplifyDiv(symBin(\'/\', terms[t].node, rn), depth + 1);\n',
            '                    if (terms[t].sign < 0) piece2 = symNeg(piece2);\n',
            '                    acc3 = acc3 === null ? piece2 : symBin(\'+\', acc3, piece2);\n',
            '                }\n',
            '                return symSimplifySum(acc3 === null ? symNum(0) : acc3, depth);\n',
            '            }\n',
            '            return symSimplifyDiv(symBin(\'/\', ln, rn), depth);\n',
            '        }\n',
            '        return symSimplify(node, depth);\n',
            '    }\n',
            '\n',
            '    // ---------- ПОДСТАНОВКА ----------\n',
            '    function symSubst(node, v, repl) {\n',
            '        if (!node || typeof node !== \'object\') return node;\n',
            '        if (node.type === \'ident\') return node.name === v ? repl : node;\n',
            '        if (node.type === \'bin\') return symBin(node.op, symSubst(node.l, v, repl), symSubst(node.r, v, repl));\n',
            '        if (node.type === \'pow\') return symPow(symSubst(node.base, v, repl), symSubst(node.exp, v, repl));\n',
            '        if (node.type === \'neg\') return symNeg(symSubst(node.expr, v, repl));\n',
            '        if (node.type === \'call\') {\n',
            '            var args = [];\n',
            '            for (var i = 0; i < node.args.length; i++) args.push(symSubst(node.args[i], v, repl));\n',
            '            return symCall(node.name, args);\n',
            '        }\n',
            '        return node;\n',
            '    }\n',
            '\n',
            '    // ---------- СИМВОЛЬНАЯ ПРОИЗВОДНАЯ ----------\n',
            '    var SYM_DIFF_RULES = {\n',
            '        sin: function (u) { return symCall(\'cos\', [u]); },\n',
            '        cos: function (u) { return symNeg(symCall(\'sin\', [u])); },\n',
            '        tan: function (u) { return symBin(\'/\', symNum(1), symPow(symCall(\'cos\', [u]), symNum(2))); },\n',
            '        exp: function (u) { return symCall(\'exp\', [u]); },\n',
            '        log: function (u) { return symBin(\'/\', symNum(1), u); },\n',
            '        sqrt: function (u) { return symBin(\'/\', symNum(1), symBin(\'*\', symNum(2), symCall(\'sqrt\', [u]))); },\n',
            '        asin: function (u) { return symBin(\'/\', symNum(1), symCall(\'sqrt\', [symBin(\'-\', symNum(1), symPow(u, symNum(2)))])); },\n',
            '        acos: function (u) { return symNeg(symBin(\'/\', symNum(1), symCall(\'sqrt\', [symBin(\'-\', symNum(1), symPow(u, symNum(2)))]))); },\n',
            '        atan: function (u) { return symBin(\'/\', symNum(1), symBin(\'+\', symNum(1), symPow(u, symNum(2)))); },\n',
            '        sinh: function (u) { return symCall(\'cosh\', [u]); },\n',
            '        cosh: function (u) { return symCall(\'sinh\', [u]); },\n',
            '        tanh: function (u) { return symBin(\'/\', symNum(1), symPow(symCall(\'cosh\', [u]), symNum(2))); },\n',
            '        abs: function (u) { return symBin(\'/\', u, symCall(\'abs\', [u])); }\n',
            '    };\n',
            '    function symDiff(node, v) {\n',
            '        if (!node) return symNum(0);\n',
            '        switch (node.type) {\n',
            '            case \'num\': return symNum(0);\n',
            '            case \'ident\': return symNum(node.name === v ? 1 : 0);\n',
            '            case \'neg\': return symNeg(symDiff(node.expr, v));\n',
            '            case \'bin\': {\n',
            '                if (node.op === \'+\' || node.op === \'-\') return symBin(node.op, symDiff(node.l, v), symDiff(node.r, v));\n',
            '                if (node.op === \'*\') {\n',
            '                    return symBin(\'+\', symBin(\'*\', symDiff(node.l, v), node.r),\n',
            '                                       symBin(\'*\', node.l, symDiff(node.r, v)));\n',
            '                }\n',
            '                if (node.op === \'/\') {\n',
            '                    return symBin(\'/\',\n',
            '                        symBin(\'-\', symBin(\'*\', symDiff(node.l, v), node.r), symBin(\'*\', node.l, symDiff(node.r, v))),\n',
            '                        symPow(node.r, symNum(2)));\n',
            '                }\n',
            '                return symNum(0);\n',
            '            }\n',
            '            case \'pow\': {\n',
            '                var u = node.base, w = node.exp;\n',
            '                var du = symDiff(u, v), dw = symDiff(w, v);\n',
            '                if (w.type === \'num\') {\n',
            '                    return symBin(\'*\', symBin(\'*\', symNum(w.value), symPow(u, symNum(w.value - 1))), du);\n',
            '                }\n',
            '                // общий случай: u^w * (w\' * ln u + w * u\'/u)\n',
            '                return symBin(\'*\', symPow(u, w),\n',
            '                    symBin(\'+\', symBin(\'*\', dw, symCall(\'log\', [u])), symBin(\'/\', symBin(\'*\', w, du), u)));\n',
            '            }\n',
            '            case \'call\': {\n',
            '                var rule = SYM_DIFF_RULES[node.name];\n',
            '                if (!rule || node.args.length !== 1) return symNum(0);\n',
            '                return symBin(\'*\', rule(node.args[0]), symDiff(node.args[0], v));\n',
            '            }\n',
            '        }\n',
            '        return symNum(0);\n',
            '    }\n',
            '\n',
            '    // ---------- СИМВОЛЬНОЕ ИНТЕГРИРОВАНИЕ (табличное + линейная замена) ----------\n',
            '    // Не полноценный алгоритм Риша: суммы, разности, умножение на константу, степенные\n',
            '    // функции и табличные функции (sin/cos/exp/log/sh/ch/tan/1/x) от линейного аргумента\n',
            '    // a*v+b. Возвращает null, если форма не распознана (нужны интегрирование по частям\n',
            '    // или замена, не покрываемые этим набором правил).\n',
            '    function symContainsVar(node, v) {\n',
            '        if (!node) return false;\n',
            '        switch (node.type) {\n',
            '            case \'num\': case \'str\': return false;\n',
            '            case \'ident\': return node.name === v;\n',
            '            case \'neg\': return symContainsVar(node.expr, v);\n',
            '            case \'call\': for (var i = 0; i < node.args.length; i++) if (symContainsVar(node.args[i], v)) return true; return false;\n',
            '            case \'pow\': return symContainsVar(node.base, v) || symContainsVar(node.exp, v);\n',
            '            case \'bin\': return symContainsVar(node.l, v) || symContainsVar(node.r, v);\n',
            '            default: return false;\n',
            '        }\n',
            '    }\n',
            '    // Если node = a*v + b (линейно по v), возвращает {a, b}; иначе null.\n',
            '    function symLinearCoeffs(node, v) {\n',
            '        if (!node) return null;\n',
            '        var coeffs = symPolyCoeffs(node, v);\n',
            '        if (!coeffs || coeffs.length > 2) return null;\n',
            '        var a = coeffs.length > 1 ? coeffs[1] : 0;\n',
            '        if (Math.abs(a) < 1e-12) return null;\n',
            '        return { a: a, b: coeffs[0] || 0 };\n',
            '    }\n',
            '    function symIntegrate(node, v) {\n',
            '        if (!node) return null;\n',
            '        switch (node.type) {\n',
            '            case \'num\': return symBin(\'*\', node, symIdent(v));\n',
            '            case \'ident\':\n',
            '                if (node.name === v) return symBin(\'/\', symPow(symIdent(v), symNum(2)), symNum(2));\n',
            '                return symBin(\'*\', node, symIdent(v));\n',
            '            case \'neg\': { var r0 = symIntegrate(node.expr, v); return r0 === null ? null : symNeg(r0); }\n',
            '            case \'bin\': {\n',
            '                if (node.op === \'+\' || node.op === \'-\') {\n',
            '                    var li = symIntegrate(node.l, v), ri = symIntegrate(node.r, v);\n',
            '                    return (li === null || ri === null) ? null : symBin(node.op, li, ri);\n',
            '                }\n',
            '                if (node.op === \'*\') {\n',
            '                    if (!symContainsVar(node.l, v)) { var r1 = symIntegrate(node.r, v); return r1 === null ? null : symBin(\'*\', node.l, r1); }\n',
            '                    if (!symContainsVar(node.r, v)) { var l1 = symIntegrate(node.l, v); return l1 === null ? null : symBin(\'*\', node.r, l1); }\n',
            '                    return null; // произведение двух множителей, зависящих от v — нужен метод по частям\n',
            '                }\n',
            '                if (node.op === \'/\') {\n',
            '                    if (!symContainsVar(node.r, v)) { var l2 = symIntegrate(node.l, v); return l2 === null ? null : symBin(\'/\', l2, node.r); }\n',
            '                    if (!symContainsVar(node.l, v)) {\n',
            '                        var lin0 = symLinearCoeffs(node.r, v);\n',
            '                        if (lin0) return symBin(\'*\', symBin(\'/\', node.l, symNum(lin0.a)), symCall(\'log\', [symCall(\'abs\', [node.r])]));\n',
            '                    }\n',
            '                    return null;\n',
            '                }\n',
            '                return null;\n',
            '            }\n',
            '            case \'pow\': {\n',
            '                if (node.exp.type === \'num\' && !symContainsVar(node.exp, v)) {\n',
            '                    var lin1 = symLinearCoeffs(node.base, v);\n',
            '                    if (!lin1) return null;\n',
            '                    var n1 = node.exp.value;\n',
            '                    if (Math.abs(n1 + 1) < 1e-12) return symBin(\'*\', symBin(\'/\', symNum(1), symNum(lin1.a)), symCall(\'log\', [symCall(\'abs\', [node.base])]));\n',
            '                    return symBin(\'/\', symPow(node.base, symNum(n1 + 1)), symNum(lin1.a * (n1 + 1)));\n',
            '                }\n',
            '                if (node.base.type === \'num\' && symContainsVar(node.exp, v)) {\n',
            '                    var lin2 = symLinearCoeffs(node.exp, v);\n',
            '                    if (lin2) return symBin(\'/\', node, symBin(\'*\', symNum(lin2.a), symCall(\'log\', [node.base])));\n',
            '                }\n',
            '                return null;\n',
            '            }\n',
            '            case \'call\': {\n',
            '                if (node.args.length !== 1) return null;\n',
            '                var lin3 = symLinearCoeffs(node.args[0], v);\n',
            '                if (!lin3) return null;\n',
            '                var u = node.args[0], anti = null;\n',
            '                switch (node.name) {\n',
            '                    case \'sin\': anti = symNeg(symCall(\'cos\', [u])); break;\n',
            '                    case \'cos\': anti = symCall(\'sin\', [u]); break;\n',
            '                    case \'exp\': anti = symCall(\'exp\', [u]); break;\n',
            '                    case \'sinh\': anti = symCall(\'cosh\', [u]); break;\n',
            '                    case \'cosh\': anti = symCall(\'sinh\', [u]); break;\n',
            '                    case \'tan\': anti = symNeg(symCall(\'log\', [symCall(\'abs\', [symCall(\'cos\', [u])])])); break;\n',
            '                    case \'log\': anti = symBin(\'-\', symBin(\'*\', u, symCall(\'log\', [u])), u); break;\n',
            '                    default: return null;\n',
            '                }\n',
            '                return symBin(\'/\', anti, symNum(lin3.a));\n',
            '            }\n',
            '        }\n',
            '        return null;\n',
            '    }\n',
            '    // Численное значение символьного выражения (строка или AST) в точке, без исключений.\n',
            '    function glSafeEvalAt(exprOrAst, v, val) {\n',
            '        try {\n',
            '            var ast = symParse(exprOrAst);\n',
            '            return glEvalExpr(symSubst(ast, v, symNum(Number(val))), {});\n',
            '        } catch (e) { return NaN; }\n',
            '    }\n',
            '\n',
            '    // ---------- МНОГОЧЛЕНЫ: коэффициенты, разложение, корни ----------\n',
            '    function symPolyCoeffs(node, v) {\n',
            '        var expanded = symExpand(symParse(node));\n',
            '        var terms = [];\n',
            '        symFlatSum(expanded, 1, terms);\n',
            '        var coeffs = [];\n',
            '        for (var i = 0; i < terms.length; i++) {\n',
            '            var sp = symSplitCoef(terms[i].node);\n',
            '            var c = sp.coef * terms[i].sign;\n',
            '            var deg = 0;\n',
            '            if (sp.rest !== null) {\n',
            '                var fs = [];\n',
            '                symFlatProd(sp.rest, fs);\n',
            '                for (var j = 0; j < fs.length; j++) {\n',
            '                    var f = fs[j];\n',
            '                    if (f.type === \'ident\' && f.name === v) { deg += 1; continue; }\n',
            '                    if (f.type === \'pow\' && f.base.type === \'ident\' && f.base.name === v &&\n',
            '                        f.exp.type === \'num\' && f.exp.value >= 0 &&\n',
            '                        Math.abs(f.exp.value - Math.round(f.exp.value)) < 1e-12) {\n',
            '                        deg += Math.round(f.exp.value); continue;\n',
            '                    }\n',
            '                    return null; // не многочлен по v\n',
            '                }\n',
            '            }\n',
            '            coeffs[deg] = (coeffs[deg] || 0) + c;\n',
            '        }\n',
            '        for (var k = 0; k < coeffs.length; k++) if (coeffs[k] === undefined) coeffs[k] = 0;\n',
            '        while (coeffs.length > 1 && Math.abs(coeffs[coeffs.length - 1]) < 1e-12) coeffs.pop();\n',
            '        return coeffs.length ? coeffs : [0];\n',
            '    }\n',
            '    function symPolyToNode(coeffs, v) {\n',
            '        var acc = null;\n',
            '        for (var d = coeffs.length - 1; d >= 0; d--) {\n',
            '            var c = coeffs[d];\n',
            '            if (Math.abs(c) < 1e-12) continue;\n',
            '            var pw = d === 0 ? null : (d === 1 ? symIdent(v) : symPow(symIdent(v), symNum(d)));\n',
            '            var term = pw === null ? symNum(Math.abs(c))\n',
            '                     : (Math.abs(Math.abs(c) - 1) < 1e-12 ? pw : symBin(\'*\', symNum(Math.abs(c)), pw));\n',
            '            if (acc === null) acc = c < 0 ? symNeg(term) : term;\n',
            '            else acc = symBin(c < 0 ? \'-\' : \'+\', acc, term);\n',
            '        }\n',
            '        return acc === null ? symNum(0) : acc;\n',
            '    }\n',
            '    // Рациональные корни многочлена с целыми коэффициентами (теорема о рац. корнях)\n',
            '    function symRationalRoots(coeffs) {\n',
            '        var scale = 1;\n',
            '        for (var i = 0; i < coeffs.length; i++) {\n',
            '            for (var d = 1; d <= 24; d++) {\n',
            '                if (Math.abs(coeffs[i] * d - Math.round(coeffs[i] * d)) < 1e-10) {\n',
            '                    scale = (scale * d) / glGcd(scale, d);\n',
            '                    break;\n',
            '                }\n',
            '            }\n',
            '        }\n',
            '        var ic = [];\n',
            '        for (var j = 0; j < coeffs.length; j++) ic.push(Math.round(coeffs[j] * scale));\n',
            '        var a0 = ic[0], an = ic[ic.length - 1];\n',
            '        if (an === 0) return [];\n',
            '        var roots = [];\n',
            '        var pDiv = glDivisors(Math.abs(a0) || 1);\n',
            '        var qDiv = glDivisors(Math.abs(an));\n',
            '        if (a0 === 0) pDiv = [0].concat(pDiv);\n',
            '        for (var p = 0; p < pDiv.length; p++) {\n',
            '            for (var q = 0; q < qDiv.length; q++) {\n',
            '                var cands = [pDiv[p] / qDiv[q], -pDiv[p] / qDiv[q]];\n',
            '                for (var t = 0; t < cands.length; t++) {\n',
            '                    var r = cands[t];\n',
            '                    var val = 0;\n',
            '                    for (var d2 = ic.length - 1; d2 >= 0; d2--) val = val * r + ic[d2];\n',
            '                    if (Math.abs(val) < 1e-9) {\n',
            '                        var dup = false;\n',
            '                        for (var z = 0; z < roots.length; z++) if (Math.abs(roots[z] - r) < 1e-12) dup = true;\n',
            '                        if (!dup) roots.push(r);\n',
            '                    }\n',
            '                }\n',
            '            }\n',
            '        }\n',
            '        return roots;\n',
            '    }\n',
            '    function symPolyDivideRoot(coeffs, r) {\n',
            '        // синтетическое деление на (x - r)\n',
            '        var n = coeffs.length - 1;\n',
            '        var out = new Array(n);\n',
            '        var carry = coeffs[n];\n',
            '        for (var i = n - 1; i >= 0; i--) {\n',
            '            out[i] = carry;\n',
            '            carry = coeffs[i] + carry * r;\n',
            '        }\n',
            '        return out;\n',
            '    }\n',
            '    function symFactor(node, v) {\n',
            '        v = v || \'x\';\n',
            '        var coeffs = symPolyCoeffs(node, v);\n',
            '        if (!coeffs || coeffs.length < 2) return symSimplify(symExpand(symParse(node)));\n',
            '        var work = coeffs.slice();\n',
            '        var factors = [];\n',
            '        // 1) общий числовой множитель и общая степень переменной\n',
            '        var lowest = 0;\n',
            '        while (lowest < work.length - 1 && Math.abs(work[lowest]) < 1e-12) lowest++;\n',
            '        if (lowest > 0) {\n',
            '            work = work.slice(lowest);\n',
            '            factors.push(lowest === 1 ? symIdent(v) : symPow(symIdent(v), symNum(lowest)));\n',
            '        }\n',
            '        // 2) рациональные корни\n',
            '        var guard = 0;\n',
            '        while (work.length > 1 && guard < 20) {\n',
            '            guard++;\n',
            '            var roots = symRationalRoots(work);\n',
            '            if (!roots.length) break;\n',
            '            var r = roots[0];\n',
            '            work = symPolyDivideRoot(work, r);\n',
            '            if (Math.abs(r) < 1e-12) factors.push(symIdent(v));\n',
            '            else if (r > 0) factors.push(symBin(\'-\', symIdent(v), symNum(r)));\n',
            '            else factors.push(symBin(\'+\', symIdent(v), symNum(-r)));\n',
            '        }\n',
            '        var remainder = symPolyToNode(work, v);\n',
            '        if (factors.length === 0) return symSimplify(symExpand(symParse(node)));\n',
            '        var acc = null;\n',
            '        if (!(work.length === 1 && Math.abs(work[0] - 1) < 1e-12)) acc = remainder;\n',
            '        for (var i = 0; i < factors.length; i++) acc = acc === null ? factors[i] : symBin(\'*\', acc, factors[i]);\n',
            '        return acc === null ? symNum(1) : acc;\n',
            '    }\n',
            '    // Символьное решение уравнения expr = 0\n',
            '    function symSolve(node, v) {\n',
            '        v = v || \'x\';\n',
            '        var coeffs = symPolyCoeffs(node, v);\n',
            '        if (!coeffs) return null;\n',
            '        var deg = coeffs.length - 1;\n',
            '        if (deg <= 0) return [];\n',
            '        if (deg === 1) return [-coeffs[0] / coeffs[1]];\n',
            '        if (deg === 2) {\n',
            '            var a = coeffs[2], b = coeffs[1], c = coeffs[0];\n',
            '            var D = b * b - 4 * a * c;\n',
            '            if (D < -1e-12) return [];\n',
            '            if (Math.abs(D) < 1e-12) return [-b / (2 * a)];\n',
            '            var sq = Math.sqrt(D);\n',
            '            var r1 = (-b - sq) / (2 * a), r2 = (-b + sq) / (2 * a);\n',
            '            return r1 <= r2 ? [r1, r2] : [r2, r1];\n',
            '        }\n',
            '        var rational = symRationalRoots(coeffs);\n',
            '        if (rational.length) return rational.sort(function (x, y) { return x - y; });\n',
            '        return GL_BUILTINS.findRoots(function (x) {\n',
            '            var s = 0;\n',
            '            for (var i = coeffs.length - 1; i >= 0; i--) s = s * x + coeffs[i];\n',
            '            return s;\n',
            '        }, -50, 50, 500);\n',
            '    }\n',
            '\n',
            '    // ---------- МАТРИЦЫ С СИМВОЛЬНЫМИ ЭЛЕМЕНТАМИ ----------\n',
            '    // В отличие от ratDet/ratRref (которые работают только с числами-дробями), эти функции\n',
            '    // принимают элементы-выражения (например, "x+1", "sin(t)") и оперируют над ними на уровне\n',
            '    // AST. Определитель — через разложение по первой строке (не требует деления, поэтому\n',
            '    // корректен для произвольных символьных элементов); rref для символьных матриц не\n',
            '    // реализован (требует деления с последующим сокращением, т.е. полноценного упрощения дробей).\n',
            '    function symMatDetNode(m) {\n',
            '        var n = m.length;\n',
            '        if (n === 0) return symNum(0);\n',
            '        if (n === 1) return m[0][0];\n',
            '        if (n === 2) return symSimplify(symBin(\'-\', symBin(\'*\', m[0][0], m[1][1]), symBin(\'*\', m[0][1], m[1][0])));\n',
            '        var acc = null;\n',
            '        for (var j = 0; j < n; j++) {\n',
            '            var minor = [];\n',
            '            for (var i = 1; i < n; i++) {\n',
            '                var row = [];\n',
            '                for (var k = 0; k < n; k++) if (k !== j) row.push(m[i][k]);\n',
            '                minor.push(row);\n',
            '            }\n',
            '            var cof = symMatDetNode(minor);\n',
            '            var term = symBin(\'*\', m[0][j], cof);\n',
            '            var signed = (j % 2 === 0) ? term : symNeg(term);\n',
            '            acc = acc === null ? signed : symBin(\'+\', acc, signed);\n',
            '        }\n',
            '        return symSimplify(acc);\n',
            '    }\n',
            '    function symMatMulNodes(A, B) {\n',
            '        var n = A.length, m = B[0].length, p = B.length, out = [];\n',
            '        for (var i = 0; i < n; i++) {\n',
            '            var row = [];\n',
            '            for (var j = 0; j < m; j++) {\n',
            '                var acc = null;\n',
            '                for (var k = 0; k < p; k++) {\n',
            '                    var term = symBin(\'*\', A[i][k], B[k][j]);\n',
            '                    acc = acc === null ? term : symBin(\'+\', acc, term);\n',
            '                }\n',
            '                row.push(symSimplify(acc === null ? symNum(0) : acc));\n',
            '            }\n',
            '            out.push(row);\n',
            '        }\n',
            '        return out;\n',
            '    }\n',
            '\n',
            '    // ---------- ВЫВОД: строка и LaTeX ----------\n',
            '    function symPrec(n) {\n',
            '        if (!n) return 9;\n',
            '        if (n.type === \'bin\') {\n',
            '            if (n.op === \'+\' || n.op === \'-\') return 1;\n',
            '            return 2;\n',
            '        }\n',
            '        if (n.type === \'neg\') return 1;\n',
            '        if (n.type === \'pow\') return 3;\n',
            '        return 9;\n',
            '    }\n',
            '    function symNumStr(v) {\n',
            '        if (Math.abs(v - Math.round(v)) < 1e-12) return String(Math.round(v));\n',
            '        var s = String(Math.round(v * 1e10) / 1e10);\n',
            '        return s;\n',
            '    }\n',
            '    // Разделяет произведение на числитель и знаменатель (отрицательные степени вниз)\n',
            '    function symSplitFraction(n) {\n',
            '        var prod = [];\n',
            '        symFlatProd(n, prod);\n',
            '        var num = [], den = [];\n',
            '        for (var i = 0; i < prod.length; i++) {\n',
            '            var f = prod[i];\n',
            '            if (f.type === \'pow\' && f.exp.type === \'num\' && f.exp.value < 0) {\n',
            '                var e = -f.exp.value;\n',
            '                den.push(Math.abs(e - 1) < 1e-12 ? f.base : symPow(f.base, symNum(e)));\n',
            '            } else if (f.type === \'bin\' && f.op === \'/\') {\n',
            '                num.push(f.l); den.push(f.r);\n',
            '            } else num.push(f);\n',
            '        }\n',
            '        if (den.length === 0) return null;\n',
            '        var nAcc = null, dAcc = null;\n',
            '        for (var a = 0; a < num.length; a++) nAcc = nAcc === null ? num[a] : symBin(\'*\', nAcc, num[a]);\n',
            '        for (var b = 0; b < den.length; b++) dAcc = dAcc === null ? den[b] : symBin(\'*\', dAcc, den[b]);\n',
            '        return { num: nAcc === null ? symNum(1) : nAcc, den: dAcc };\n',
            '    }\n',
            '    function symToString(n, parentPrec) {\n',
            '        parentPrec = parentPrec || 0;\n',
            '        if (!n) return \'\';\n',
            '        var out;\n',
            '        switch (n.type) {\n',
            '            case \'num\': out = symNumStr(n.value); break;\n',
            '            case \'ident\': out = n.name; break;\n',
            '            case \'str\': out = JSON.stringify(n.value); break;\n',
            '            case \'neg\': out = \'-\' + symToString(n.expr, 2); break;\n',
            '            case \'call\': {\n',
            '                var parts = [];\n',
            '                for (var i = 0; i < n.args.length; i++) parts.push(symToString(n.args[i], 0));\n',
            '                out = n.name + \'(\' + parts.join(\', \') + \')\';\n',
            '                break;\n',
            '            }\n',
            '            case \'pow\': {\n',
            '                // отрицательная степень читается как дробь: x^-2 -> 1/x^2\n',
            '                if (n.exp.type === \'num\' && n.exp.value < 0) {\n',
            '                    var posE = -n.exp.value;\n',
            '                    var denS = Math.abs(posE - 1) < 1e-12 ? symToString(n.base, 4)\n',
            '                             : symToString(n.base, 4) + \'^\' + symNumStr(posE);\n',
            '                    out = \'1/\' + denS;\n',
            '                    break;\n',
            '                }\n',
            '                out = symToString(n.base, 4) + \'^\' + symToString(n.exp, 4);\n',
            '                break;\n',
            '            }\n',
            '            case \'bin\': {\n',
            '                if (n.op === \'*\') {\n',
            '                    var fr = symSplitFraction(n);\n',
            '                    if (fr) { out = symToString(fr.num, 2) + \'/\' + symToString(fr.den, 3); break; }\n',
            '                }\n',
            '                var rbump = (n.op === \'-\' || n.op === \'/\' || n.op === \'%\') ? 1 : 0;\n',
            '                out = symToString(n.l, symPrec(n)) + \' \' + n.op + \' \' + symToString(n.r, symPrec(n) + rbump);\n',
            '                break;\n',
            '            }\n',
            '            default: out = String(n.value !== undefined ? n.value : \'\');\n',
            '        }\n',
            '        if (symPrec(n) < parentPrec) return \'(\' + out + \')\';\n',
            '        return out;\n',
            '    }\n',
            '    var SYM_TEX_FUNCS = [\'sin\', \'cos\', \'tan\', \'log\', \'ln\', \'exp\', \'arcsin\', \'arccos\', \'arctan\',\n',
            '                         \'sinh\', \'cosh\', \'tanh\', \'max\', \'min\', \'det\'];\n',
            '    function symToLatex(n, parentPrec) {\n',
            '        parentPrec = parentPrec || 0;\n',
            '        if (!n) return \'\';\n',
            '        var out;\n',
            '        switch (n.type) {\n',
            '            case \'num\': out = symNumStr(n.value); break;\n',
            '            case \'ident\': {\n',
            '                var greek = [\'alpha\', \'beta\', \'gamma\', \'delta\', \'theta\', \'lambda\', \'mu\', \'pi\', \'sigma\', \'phi\', \'omega\'];\n',
            '                out = greek.indexOf(n.name) !== -1 ? symTex(n.name) : n.name;\n',
            '                break;\n',
            '            }\n',
            '            case \'str\': out = String(n.value); break;\n',
            '            case \'neg\': out = \'-\' + symToLatex(n.expr, 2); break;\n',
            '            case \'call\': {\n',
            '                if (n.name === \'sqrt\' && n.args.length === 1) {\n',
            '                    out = symTex(\'sqrt\') + \'{\' + symToLatex(n.args[0], 0) + \'}\';\n',
            '                    break;\n',
            '                }\n',
            '                if (n.name === \'abs\' && n.args.length === 1) {\n',
            '                    out = symTex(\'left|\') + symToLatex(n.args[0], 0) + symTex(\'right|\');\n',
            '                    break;\n',
            '                }\n',
            '                var argsTex = [];\n',
            '                for (var i = 0; i < n.args.length; i++) argsTex.push(symToLatex(n.args[i], 0));\n',
            '                var nm = n.name === \'log\' ? \'ln\' : n.name;\n',
            '                var head = SYM_TEX_FUNCS.indexOf(nm) !== -1 ? symTex(nm) : (symTex(\'mathrm\') + \'{\' + nm + \'}\');\n',
            '                out = head + symTex(\'left(\') + argsTex.join(\', \') + symTex(\'right)\');\n',
            '                break;\n',
            '            }\n',
            '            case \'pow\': {\n',
            '                if (n.exp.type === \'num\' && n.exp.value < 0) {\n',
            '                    var posEx = -n.exp.value;\n',
            '                    var denTex = Math.abs(posEx - 1) < 1e-12 ? symToLatex(n.base, 4)\n',
            '                               : symToLatex(n.base, 4) + \'^{\' + symNumStr(posEx) + \'}\';\n',
            '                    out = symTex(\'frac\') + \'{1}{\' + denTex + \'}\';\n',
            '                    break;\n',
            '                }\n',
            '                out = symToLatex(n.base, 4) + \'^{\' + symToLatex(n.exp, 0) + \'}\';\n',
            '                break;\n',
            '            }\n',
            '            case \'bin\': {\n',
            '                if (n.op === \'/\') {\n',
            '                    out = symTex(\'frac\') + \'{\' + symToLatex(n.l, 0) + \'}{\' + symToLatex(n.r, 0) + \'}\';\n',
            '                    break;\n',
            '                }\n',
            '                if (n.op === \'*\') {\n',
            '                    var fr = symSplitFraction(n);\n',
            '                    if (fr) {\n',
            '                        out = symTex(\'frac\') + \'{\' + symToLatex(fr.num, 0) + \'}{\' + symToLatex(fr.den, 0) + \'}\';\n',
            '                        break;\n',
            '                    }\n',
            '                    // неявное умножение, если справа не число\n',
            '                    var sep = (n.r.type === \'num\') ? (\' \' + symTex(\'cdot\') + \' \') : \' \';\n',
            '                    out = symToLatex(n.l, symPrec(n)) + sep + symToLatex(n.r, symPrec(n));\n',
            '                    break;\n',
            '                }\n',
            '                var rbumpL = (n.op === \'-\' || n.op === \'/\' || n.op === \'%\') ? 1 : 0;\n',
            '                out = symToLatex(n.l, symPrec(n)) + \' \' + n.op + \' \' + symToLatex(n.r, symPrec(n) + rbumpL);\n',
            '                break;\n',
            '            }\n',
            '            default: out = \'\';\n',
            '        }\n',
            '        if (symPrec(n) < parentPrec) return symTex(\'left(\') + out + symTex(\'right)\');\n',
            '        return out;\n',
            '    }\n',
            '\n',
            `
    // ===== Мини-язык для Start/Update/действий кнопок/выражений текста =====
    // Вместо eval() сырого JS: set <путь> = <выражение>; if (...) {...} else {...}; repeat (N) {...}; wait(сек);
    // for (x in points) {...}; vector v = [1,2,3]; matrix m = [[1,2],[3,4]]; intersection(type, a, b)
    const GL_BUILTINS = {
        sin: (x) => glIsComplex(x) ? glComplexSin(x) : Math.sin(x),
        cos: (x) => glIsComplex(x) ? glComplexCos(x) : Math.cos(x),
        tan: (x) => glIsComplex(x) ? glComplexDiv(glComplexSin(x), glComplexCos(x)) : Math.tan(x),
        abs: (x) => glIsComplex(x) ? glComplexAbs(x) : Math.abs(x),
        sqrt: (x) => glIsComplex(x) ? glComplexPow(x, 0.5) : Math.sqrt(x),
        exp: (x) => glIsComplex(x) ? glComplexExp(x) : Math.exp(x),
        log: (x) => glIsComplex(x) ? glComplexLog(x) : Math.log(x),
        round: Math.round, floor: Math.floor, ceil: Math.ceil,
        // min/max принимают как список аргументов, так и один массив: min(a, b) и min([...])
        min: (...a) => (a.length === 1 && Array.isArray(a[0])) ? Math.min.apply(null, a[0]) : Math.min.apply(null, a),
        max: (...a) => (a.length === 1 && Array.isArray(a[0])) ? Math.max.apply(null, a[0]) : Math.max.apply(null, a),
        pow: (a, b) => (glIsComplex(a) || glIsComplex(b)) ? glComplexPow(a, b) : Math.pow(a, b),
        asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
        radians: (deg) => deg * Math.PI / 180, degrees: (rad) => rad * 180 / Math.PI,
        sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
        // Задача 2: преобразования координат точек/векторов
        rotate: (point, angle, center) => glRotatePoint(point, angle, center),
        translate: (point, dx, dy) => glTranslatePoint(point, dx, dy),
        scale: (point, sx, sy, center) => glScalePoint(point, sx, sy, center),
        reflect: (point, line) => glReflectPoint(point, line),
        transform: (point, matrix) => glTransformPoint(point, matrix),
        // Задача 3: полярные координаты (безопасно на уровне сценария; см. coordinateSystem для сетки/осей)
        polar: (r, phi) => ({ x: r * Math.cos(phi), y: r * Math.sin(phi) }),
        toPolar: (point) => { const p = glPointXY(point); return { r: Math.hypot(p.x, p.y), phi: Math.atan2(p.y, p.x) }; },
        // Задача 1 (новая): вычислительные функции
        distance: (p1, p2) => glDistance(p1, p2),
        pointDistance: (point, line) => glPointDistanceToLine(point, line),
        lineAngle: (line1, line2) => glLineAngle(line1, line2),
        areParallel: (line1, line2) => glAreParallel(line1, line2),
        arePerpendicular: (line1, line2) => glArePerpendicular(line1, line2),
        polygonArea: (pts) => glPolygonArea(pts),
        pointInPolygon: (point, polygon) => glPointInPolygon(point, polygon),
        closestPointOnLine: (point, line) => glClosestPointOnLine(point, line),
        intersectionSegment: (line1, line2) => glSegmentIntersect(line1, line2),
        // Задача 1 (новая): численное решение систем ОДУ
        odeSolve: (system, initial, tSpan, steps) => glOdeSolve(system, initial, tSpan, steps),
        // Задача 2 (новая): интерполяция и аппроксимация
        interpolate: (pts, method) => glInterpolate(pts, method),
        fitPolynomial: (pts, degree) => glFitPolynomial(pts, degree),
        fitLinear: (pts) => glFitLinear(pts),
        // Задача 1 (новая): выпуклая оболочка и операции над множествами точек
        convexHull: (pts) => glConvexHull(pts),
        pointSetOperations: (points1, points2, op) => glPointSetOperations(points1, points2, op),
        // Задача 3 (новая): булевы операции над выпуклыми многоугольниками
        polygonIntersection: (poly1, poly2) => glPolygonIntersection(poly1, poly2),
        polygonUnion: (poly1, poly2) => glPolygonUnion(poly1, poly2),
        polygonDifference: (poly1, poly2) => glPolygonDifference(poly1, poly2),
        random: (a, b) => (a === undefined ? Math.random() : a + Math.random() * ((b === undefined ? 1 : b) - a)),
        randomNormal: (mean, stddev) => {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
            return (mean === undefined ? 0 : mean) + z * (stddev === undefined ? 1 : stddev);
        },
        randomInt: (min, max) => Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min),
        randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],
        dot: (v, w) => v.reduce((s, x, i) => s + x * w[i], 0),
        norm: (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)),
        len: (v) => v.length,
        length: (v) => v.length,
        push: (arr, val) => { arr.push(val); return arr; },
        pop: (arr) => arr.pop(),
        transpose: (m) => m[0].map((_, j) => m.map(row => row[j])),
        // Задача 1: экспорт текущего кадра в PNG
        exportImage: (filename) => {
            const name = (filename ? String(filename) : 'export') + (String(filename || '').endsWith('.png') ? '' : '.png');
            canvas.toBlob(function(blob) {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = name;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }, 'image/png');
            return true;
        },
        // Задача 2: сохранение/восстановление прогресса (позиции свободных точек, пользовательские переменные, камера)
        saveState: () => {
            const state = { points: [], vars: {}, camera: { zoom: camera.zoom, offsetX: camera.offsetX, offsetY: camera.offsetY } };
            for (let p of points) {
                if (p.hidden) continue;
                state.points.push({ name: p.name, x: p.pos.x, y: p.pos.y, active: p.active, color: p.color });
            }
            for (let key of Object.keys(userVars)) {
                const v = window[key];
                const t = typeof v;
                if (t === 'number' || t === 'string' || t === 'boolean' || Array.isArray(v)) state.vars[key] = v;
            }
            return JSON.stringify(state);
        },
        loadState: (json) => {
            try {
                const state = JSON.parse(json);
                if (state.points) {
                    for (let sp of state.points) {
                        const p = points.find(pp => pp.name === sp.name);
                        if (!p) continue;
                        if (!p.lineName && !p.circleName && !p.ellipseName && !p.curveName && !p.arcName && !p.construct && !p.transform) {
                            p.pos.x = sp.x; p.pos.y = sp.y;
                        }
                        if (sp.active !== undefined) p.active = sp.active;
                        if (sp.color !== undefined) p.color = sp.color;
                    }
                }
                if (state.vars) { for (let k in state.vars) window[k] = state.vars[k]; }
                if (state.camera) { camera.zoom = state.camera.zoom; camera.offsetX = state.camera.offsetX; camera.offsetY = state.camera.offsetY; }
                figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw();
                return true;
            } catch (e) {
                glLog(\'warn\', 'loadState: ошибка разбора состояния: ' + e.message);
                return false;
            }
        },
        // Задача 4: принудительная перерисовка (для режима ручного управления)
        redraw: () => { draw(); return true; },
        // Доп. задача: det/inv для матриц произвольного размера N×N (метод Гаусса вместо разложения по 2x2/3x3)
        det: (m) => glMatDet(m),
        inv: (m) => glMatInverse(m),
        // Задача 2 (доп.): собственные значения/векторы (численно, для небольших матриц)
        eigenvalues: (m) => glEigenvalues(m),
        eigenvectors: (m) => glEigenvectors(m),
        // Задача 3: статистика
        mean: (arr) => arr.reduce((s, x) => s + x, 0) / arr.length,
        variance: (arr) => { const mu = arr.reduce((s, x) => s + x, 0) / arr.length; return arr.reduce((s, x) => s + (x - mu) * (x - mu), 0) / arr.length; },
        stddev: (arr) => Math.sqrt(GL_BUILTINS.variance(arr)),
        correlation: (a, b) => {
            const n = a.length;
            const ma = GL_BUILTINS.mean(a), mb = GL_BUILTINS.mean(b);
            let sab = 0, saa = 0, sbb = 0;
            for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sab += da * db; saa += da * da; sbb += db * db; }
            const denom = Math.sqrt(saa * sbb);
            return denom < 1e-12 ? 0 : sab / denom;
        },
        // Задача 1: комплексные числа
        complex: (re, im) => glComplex(re, im === undefined ? 0 : im),
        arg: (z) => glComplexArg(z),
        // === СИМВОЛЬНАЯ МАТЕМАТИКА ===
        // Все принимают строку-выражение и возвращают строку (или список).
        simplify: (e) => symToString(symSimplify(symParse(e))),
        expand: (e) => symToString(symExpand(symParse(e))),
        factorPoly: (e, v) => symToString(symFactor(symParse(e), v || 'x')),
        diff: (e, v) => symToString(symSimplify(symDiff(symParse(e), v || 'x'))),
        diffN: (e, v, n) => {
            let ast = symParse(e);
            const vv = v || 'x';
            for (let i = 0; i < (n === undefined ? 1 : n); i++) ast = symSimplify(symDiff(ast, vv));
            return symToString(ast);
        },
        subst: (e, v, val) => symToString(symSimplify(symSubst(symParse(e), v, symParse(String(val))))),
        polyCoeffs: (e, v) => symPolyCoeffs(e, v || 'x'),
        solveSymbolic: (e, v) => symSolve(symParse(e), v || 'x'),
        // LaTeX-представление (для draw Formula и подписей)
        latex: (e) => symToLatex(symParse(e)),
        simplifyLatex: (e) => symToLatex(symSimplify(symParse(e))),
        diffLatex: (e, v) => symToLatex(symSimplify(symDiff(symParse(e), v || 'x'))),
        expandLatex: (e) => symToLatex(symExpand(symParse(e))),
        factorLatex: (e, v) => symToLatex(symFactor(symParse(e), v || 'x')),
        // Численное значение символьного выражения в точке
        evalAt: (e, v, val) => {
            const ast = symSubst(symParse(e), v || 'x', symNum(Number(val)));
            return glEvalExpr(ast, { time: elapsedTime });
        },
        // Символьное интегрирование (табличное + линейная замена, см. symIntegrate).
        // Возвращает строку-первообразную (без "+ C") или null, если форма не распознана —
        // в этом случае стоит использовать численный integral(f, a, b).
        integrate: (e, v) => {
            const r = symIntegrate(symExpand(symParse(e)), v || 'x');
            return r === null ? null : symToString(symSimplify(r));
        },
        integrateLatex: (e, v) => {
            const r = symIntegrate(symExpand(symParse(e)), v || 'x');
            return r === null ? null : symToLatex(symSimplify(r)) + ' + C';
        },
        // Определённый интеграл: пробует символьную первообразную (точный результат по
        // формуле Ньютона—Лейбница), при неудаче — численный адаптивный Симпсон.
        integrateDefinite: (e, v, a, b) => {
            v = v || 'x';
            const F = symIntegrate(symExpand(symParse(e)), v);
            if (F !== null) {
                const fb = glSafeEvalAt(F, v, b), fa = glSafeEvalAt(F, v, a);
                if (isFinite(fb) && isFinite(fa)) return fb - fa;
            }
            return glAdaptiveSimpson((x) => glSafeEvalAt(e, v, x), Number(a), Number(b), 1e-8, 20);
        },
        // Предел при v -> point: прямая подстановка; при неопределённости 0/0 или ∞/∞ —
        // символьное правило Лопиталя (до 8 итераций); иначе — численная оценка одностороннего
        // приближения с экстраполяцией.
        limit: (e, v, point) => {
            v = v || 'x'; point = Number(point);
            const direct = glSafeEvalAt(e, v, point);
            if (isFinite(direct)) return direct;
            const ast = symParse(e);
            if (ast.type === 'bin' && ast.op === '/') {
                let curNum = ast.l, curDen = ast.r, guard = 0;
                while (guard < 8) {
                    const nv = glSafeEvalAt(curNum, v, point), dv = glSafeEvalAt(curDen, v, point);
                    const indeterminate = (Math.abs(nv) < 1e-9 && Math.abs(dv) < 1e-9) || (!isFinite(nv) && !isFinite(dv));
                    if (!indeterminate) {
                        if (Math.abs(dv) > 1e-9) return nv / dv;
                        break;
                    }
                    curNum = symSimplify(symDiff(curNum, v));
                    curDen = symSimplify(symDiff(curDen, v));
                    guard++;
                }
            }
            // численная оценка предела через сгущающуюся сетку и экстраполяцию Ричардсона
            const h0 = 1e-3;
            const fPlus1 = glSafeEvalAt(e, v, point + h0), fPlus2 = glSafeEvalAt(e, v, point + h0 / 2);
            const fMinus1 = glSafeEvalAt(e, v, point - h0), fMinus2 = glSafeEvalAt(e, v, point - h0 / 2);
            const okPlus = isFinite(fPlus1) && isFinite(fPlus2);
            const okMinus = isFinite(fMinus1) && isFinite(fMinus2);
            if (okPlus && okMinus) {
                const ep = 2 * fPlus2 - fPlus1, em = 2 * fMinus2 - fMinus1;
                if (Math.abs(ep - em) < 1e-4 * (Math.abs(ep) + 1)) return (ep + em) / 2;
                return NaN; // предел слева и справа не совпадают
            }
            if (okPlus) return 2 * fPlus2 - fPlus1;
            if (okMinus) return 2 * fMinus2 - fMinus1;
            return NaN;
        },
        // Ряд Тейлора порядка order в окрестности точки point, возвращает строку-многочлен.
        series: (e, v, point, order) => {
            v = v || 'x'; point = Number(point); order = order === undefined ? 5 : Math.round(order);
            let deriv = symParse(e), acc = null, fact = 1;
            for (let k = 0; k <= order; k++) {
                if (k > 0) { deriv = symSimplify(symDiff(deriv, v)); fact *= k; }
                const coeff = glSafeEvalAt(deriv, v, point) / fact;
                if (!isFinite(coeff) || Math.abs(coeff) < 1e-13) continue;
                const dx = Math.abs(point) < 1e-15 ? symIdent(v) : symBin('-', symIdent(v), symNum(point));
                const pw = k === 0 ? null : (k === 1 ? dx : symPow(dx, symNum(k)));
                const term = pw === null ? symNum(coeff) : symBin('*', symNum(coeff), pw);
                acc = acc === null ? term : symBin('+', acc, term);
            }
            return acc === null ? '0' : symToString(symSimplify(acc));
        },
        // Задача 5: графы
        newGraph: () => ({ __type: 'graph', nodes: {}, edges: [] }),
        addNode: (g, label, pos) => { g.nodes[label] = { label, pos: pos || [0, 0] }; return g; },
        addEdge: (g, a, b, weight) => { g.edges.push({ a, b, weight: weight === undefined ? 1 : weight }); return g; },
        // === ВЫЧИСЛИТЕЛЬНАЯ ГЕОМЕТРИЯ ===
        delaunay: (pts) => glDelaunay(glReadPoints(pts)),
        polygonCentroid: (pts) => {
            const p = glReadPoints(pts);
            let cx = 0, cy = 0, a = 0;
            for (let i = 0; i < p.length; i++) {
                const q = p[(i + 1) % p.length];
                const cr = p[i].x * q.y - q.x * p[i].y;
                a += cr; cx += (p[i].x + q.x) * cr; cy += (p[i].y + q.y) * cr;
            }
            a *= 0.5;
            return Math.abs(a) < 1e-12 ? [0, 0] : [cx / (6 * a), cy / (6 * a)];
        },
        // === ПРЕОБРАЗОВАНИЕ ФУРЬЕ ===
        fourierCoeffs: (pts, terms) => glFourierCoeffs(glReadPoints(pts), terms || 24)
            .map(c => [c.k, c.re, c.im]),
        dft: (arr) => {
            const N = arr.length, out = [];
            for (let k = 0; k < N; k++) {
                let re = 0, im = 0;
                for (let j = 0; j < N; j++) {
                    const a = -2 * Math.PI * k * j / N;
                    re += arr[j] * Math.cos(a); im += arr[j] * Math.sin(a);
                }
                out.push([re / N, im / N]);
            }
            return out;
        },

        // === КЛЕТОЧНЫЕ АВТОМАТЫ ===
        lifeStep: (grid) => {
            const rows = grid.length, cols = grid[0].length;
            const out = [];
            for (let r = 0; r < rows; r++) {
                const row = [];
                for (let c = 0; c < cols; c++) {
                    let n = 0;
                    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const rr = r + dr, cc = c + dc;
                        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr][cc]) n++;
                    }
                    row.push((grid[r][c] && (n === 2 || n === 3)) || (!grid[r][c] && n === 3) ? 1 : 0);
                }
                out.push(row);
            }
            return out;
        },
        elementaryStep: (row, rule) => {
            const n = row.length, out = [];
            for (let i = 0; i < n; i++) {
                const l = row[(i - 1 + n) % n], c = row[i], r = row[(i + 1) % n];
                out.push((rule >> ((l << 2) | (c << 1) | r)) & 1);
            }
            return out;
        },

        // === ГЕОМЕТРИЯ ЛОБАЧЕВСКОГО ===
        hypDistance: (a, b) => glHypDistance({ x: a[0], y: a[1] }, { x: b[0], y: b[1] }),
        hypTiling: (p, q, depth) => glHypTiling(p, q, depth === undefined ? 3 : depth),
        // Дробно-линейное преобразование (z*a+b)/(z*c+d) — движения плоскости Лобачевского
        mobiusTransform: (a, b, c, dd, z) => {
            const num = glComplexAdd(glComplexMul(glToComplex(a), glToComplex(z)), glToComplex(b));
            const den = glComplexAdd(glComplexMul(glToComplex(c), glToComplex(z)), glToComplex(dd));
            return glComplexDiv(num, den);
        },
        // Перенос круга Пуанкаре, переводящий точку a в центр
        hypTranslate: (a, z) => {
            const A = glToComplex(a), Z = glToComplex(z);
            const num = glComplexSub(Z, A);
            const den = glComplexSub(glComplex(1, 0), glComplexMul(glComplex(A.re, -A.im), Z));
            return glComplexDiv(num, den);
        },

        // === ГРУППЫ ===
        cyclicGroup: (n) => glCyclicGroup(n),
        dihedralGroup: (n) => glDihedralGroup(n),
        symmetricGroup: (n) => glSymmetricGroup(n),
        alternatingGroup: (n) => glAlternatingGroup(n),
        unitsGroup: (n) => glUnitsGroup(n),
        groupElements: (g) => g.els,
        groupOrder: (g) => g.els.length,
        groupMul: (g, a, b) => g.mul(a, b),
        groupInverse: (g, a) => glGroupInv(g, a),
        groupElementOrder: (g, a) => glGroupElementOrder(g, a),
        groupIsAbelian: (g) => glGroupIsAbelian(g),
        groupTable: (g) => glGroupTable(g),
        groupGenerated: (g, gens) => glGroupGenerated(g, gens),
        groupSubgroups: (g) => glGroupSubgroups(g),
        groupCosets: (g, sub, side) => glGroupCosets(g, sub, side),
        groupIsNormal: (g, sub) => glGroupIsNormal(g, sub),
        groupCenter: (g) => glGroupCenter(g),
        groupConjugacyClasses: (g) => glGroupConjugacyClasses(g),
        groupQuotient: (g, sub) => glGroupQuotient(g, sub),
        groupIsomorphic: (a, b) => glGroupIsomorphic(a, b),
        cayleyGraph: (g, gens) => glCayleyGraph(g, gens),

        // === ПЕРЕСТАНОВКИ ===
        permCompose: (a, b) => glPermCompose(a, b),
        permInverse: (a) => glPermInverse(a),
        permCycles: (a) => glPermCycles(a),
        permSign: (a) => glPermSign(a),
        permOrder: (a) => glPermOrder(a),
        permFromCycles: (c, n) => glPermFromCycles(c, n),

        // === КОНЕЧНЫЕ ПОЛЯ И МНОГОЧЛЕНЫ ===
        galoisField: (p, n) => glGaloisField(p, n),
        fieldElements: (F) => F.els,
        fieldAdd: (F, a, b) => F.add(a, b),
        fieldMul: (F, a, b) => F.mul(a, b),
        fieldInverse: (F, a) => glFieldInv(F, a),
        polyAddMod: (a, b, m) => glPolyAddMod(a, b, m),
        polyMulMod: (a, b, m) => glPolyMulMod(a, b, m),
        polyDivMod: (a, b, m) => glPolyDivModP(a, b, m),
        polyGcdMod: (a, b, m) => glPolyGcdMod(a, b, m),
        polyIsIrreducible: (p, m) => glPolyIsIrreducible(p, m),
        cyclotomic: (n) => glCyclotomic(n),

        // === ТОЧНАЯ ЛИНЕЙНАЯ АЛГЕБРА НАД ℚ ===
        ratDet: (m) => glRatDet(m),
        ratDetStr: (m) => glRatToString(glRatDet(m)),
        ratInv: (m) => { const r = glRatMatInv(m); return r === null ? null : glRatMatToStr(r); },
        ratRref: (m) => glRatMatToStr(glRatRref(m).matrix),
        ratRank: (m) => glRatRref(m).rank,
        ratNullspace: (m) => glRatNullspace(m).map(v => v.map(glRatToString)),
        charPoly: (m) => glCharPoly(m).map(glRatToString),
        smithNormalForm: (m) => glSmithNormalForm(m).map(String),

        // === МАТРИЦЫ С СИМВОЛЬНЫМИ ЭЛЕМЕНТАМИ ===
        // Элементы — строки-выражения (например, "x+1", "sin(t)"), а не только числа.
        // Определитель — через разложение по первой строке (годится для произвольных
        // символьных элементов, т.к. не требует деления). rref/обращение для символьных
        // матриц не реализованы — это требует деления с сокращением дробей выражений.
        symDet: (m) => symToString(symMatDetNode(m.map(row => row.map(x => symParse(x))))),
        symMatMul: (a, b) => symMatMulNodes(a.map(row => row.map(x => symParse(x))), b.map(row => row.map(x => symParse(x))))
            .map(row => row.map(symToString)),
        symMatAdd: (a, b) => a.map((row, i) => row.map((x, j) => symToString(symSimplify(symBin('+', symParse(x), symParse(b[i][j])))))),
        symMatSub: (a, b) => a.map((row, i) => row.map((x, j) => symToString(symSimplify(symBin('-', symParse(x), symParse(b[i][j])))))),

        // === ТОПОЛОГИЯ: СИМПЛИЦИАЛЬНЫЕ ГОМОЛОГИИ ===
        complexFaces: (mx) => glComplexFaces(mx),
        boundaryMatrix: (mx, k) => glBoundaryMatrix(glComplexFaces(mx), k),
        bettiNumbers: (mx) => glBettiNumbers(mx),
        eulerCharacteristic: (mx) => glEulerCharacteristic(mx),
        // Полные группы гомологий (числа Бетти + кручение), а не только числа Бетти:
        // используют ту же нормальную форму Смита, что и bettiNumbers, но, в отличие от
        // него, сохраняют сами инвариантные множители, а не только количество ненулевых —
        // диагональные элементы > 1 в SNF(∂_{k+1}) и есть кручение в H_k.
        homologyGroups: (mx) => glHomologyGroups(mx),
        homologyString: (mx) => glHomologyGroups(mx).map((h) => {
            const parts = [];
            for (let i = 0; i < h.betti; i++) parts.push('Z');
            for (const t of h.torsion) parts.push('Z/' + t + 'Z');
            return 'H_' + h.dim + ' = ' + (parts.length ? parts.join(' \u2295 ') : '0');
        }).join(', '),

        // === ЧУМ И РЕШЁТКИ ===
        divisorLattice: (n) => glDivisorLattice(n),
        subsetLattice: (n) => glSubsetLattice(n),
        posetElements: (p) => p.els,
        posetHasse: (p) => glPosetHasse(p),
        posetJoin: (p, a, b) => glPosetJoin(p, a, b),
        posetMeet: (p, a, b) => glPosetMeet(p, a, b),
        posetIsLattice: (p) => glPosetIsLattice(p),
        posetRank: (p, x) => glPosetRank(p, x),

        // === ТОЧНАЯ АРИФМЕТИКА ℚ ===
        rat: (p, q) => glRatMake(BigInt(Math.round(Number(p))), q === undefined ? 1n : BigInt(Math.round(Number(q)))),
        ratStr: (a) => glRatToString(a),
        ratNum: (a) => glRatToNumber(a),
        numer: (a) => glToRat(a).n,
        denom: (a) => glToRat(a).d,
        isRat: (a) => glIsRat(a),
        bestRational: (x, maxDen) => glBestRational(Number(x), maxDen || 10000),
        big: (x) => glToBig(x),
        bigStr: (x) => String(glToBig(x)),

        // === ТЕОРИЯ ЧИСЕЛ ===
        modPow: (a, e, m) => glModPow(a, e, m),
        modInv: (a, m) => glModInv(a, m),
        egcd: (a, b) => glEgcd(a, b),
        crt: (rems, mods) => glCRT(rems, mods),
        isPrimeBig: (n) => glIsPrimeBig(n),
        nextPrime: (n) => glNextPrime(n),
        primesUpTo: (n) => {
            n = Math.floor(Number(n));
            const sieve = new Uint8Array(n + 1);
            const out = [];
            for (let i = 2; i <= n; i++) {
                if (sieve[i]) continue;
                out.push(i);
                for (let j = i * i; j <= n; j += i) sieve[j] = 1;
            }
            return out;
        },
        factorize: (n) => glFactorize(n),
        factorMap: (n) => glFactorMap(n),
        eulerPhi: (n) => glEulerPhi(n),
        mobius: (n) => glMobius(n),
        orderMod: (a, n) => glOrderMod(a, n),
        primitiveRoot: (p) => glPrimitiveRoot(p),
        discreteLog: (g, h, p) => glDiscreteLog(g, h, p),
        legendreSymbol: (a, p) => glLegendre(a, p),
        jacobiSymbol: (a, n) => glJacobi(a, n),
        sqrtMod: (a, p) => glSqrtMod(a, p),
        pAdicValuation: (n, p) => glPAdicValuation(n, p),
        continuedFraction: (x, n) => glContinuedFraction(Number(x), n),
        cfToRational: (cf) => glCfToRational(cf),
        divisorSigma: (n, k) => {
            const ds = glDivisors(Number(n));
            let s = 0;
            for (const d of ds) s += Math.pow(d, k === undefined ? 1 : Number(k));
            return s;
        },

        // === КОМБИНАТОРИКА ===
        bigFactorial: (n) => glBigFactorial(n),
        bigBinom: (n, k) => glBigBinom(n, k),
        partitionCount: (n) => glPartitionCount(n),
        partitionsList: (n) => glPartitionsList(n),
        stirling1: (n, k) => glStirling1(n, k),
        stirling2: (n, k) => glStirling2(n, k),
        bell: (n) => glBellNumber(n),
        catalan: (n) => glCatalan(n),
        derangements: (n) => glDerangements(n),
        permutationsOf: (arr) => glPermutationsOf(arr),
        combinationsOf: (arr, k) => glCombinationsOf(arr, k),
        powerSet: (arr) => glPowerSet(arr),

        // === СПЕЦИАЛЬНЫЕ ФУНКЦИИ ===
        zeta: (s) => glZeta(Number(s)),
        besselJ: (n, x) => glBesselJ(n, Number(x)),
        legendreP: (n, x) => glLegendreP(n, Number(x)),
        chebyshevT: (n, x) => glChebyshevT(n, Number(x)),
        hermiteH: (n, x) => glHermiteH(n, Number(x)),
        laguerreL: (n, x) => glLaguerreL(n, Number(x)),
        ellipticK: (m) => glEllipticK(Number(m)),
        ellipticE: (m) => glEllipticE(Number(m)),
        digamma: (x) => glDigamma(Number(x)),
        lambertW: (x) => glLambertW(Number(x)),
        beta: (a, b) => glGamma(Number(a)) * glGamma(Number(b)) / glGamma(Number(a) + Number(b)),
        airyAi: (x) => glAiryAi(Number(x)),

        // Дерево разбора выражения — прямая связка CAS с draw Tree:
        //   draw Tree { data = exprTree("x^2 + 2*x + 1") };
        exprTree: (e) => glExprToTree(symParse(e)),
        pascalTriangle: (n) => {
            const rows = [];
            for (let i = 0; i < Math.max(1, Math.floor(n)); i++) {
                const row = [];
                for (let k = 0; k <= i; k++) row.push(glBinom(i, k));
                rows.push(row);
            }
            return rows;
        },
        // --- Раскладка вершин ---
        graphLayoutCircle: (g, r, cx, cy) => glGraphLayoutCircle(g, r, cx, cy),
        graphLayoutGrid: (g, cols, spacing) => glGraphLayoutGrid(g, cols, spacing),
        graphLayoutForce: (g, iters, spread) => glGraphLayoutForce(g, iters, spread),
        graphLayoutTree: (g, root, spacing, levelGap) => glGraphLayoutTree(g, root, spacing, levelGap),
        // --- Анализ ---
        graphNodes: (g) => Object.keys(g.nodes),
        graphDegree: (g, v) => {
            let d = 0;
            for (const e of g.edges) { if (e.a === v) d++; if (e.b === v) d++; }
            return d;
        },
        graphNeighbors: (g, v) => {
            const out = [];
            for (const e of g.edges) {
                if (e.a === v && out.indexOf(e.b) === -1) out.push(e.b);
                if (e.b === v && out.indexOf(e.a) === -1) out.push(e.a);
            }
            return out;
        },
        graphAdjacency: (g) => glGraphAdjacency(g),
        graphComponents: (g) => glGraphComponents(g),
        graphIsBipartite: (g) => glGraphBipartite(g) !== null,
        graphColoring: (g) => glGraphBipartite(g),
        graphMST: (g) => glGraphMST(g),
        graphTopoSort: (g) => glGraphTopoSort(g),
        graphHasCycle: (g) => glGraphTopoSort(g) === null,
        bfs: (g, start) => glGraphBFS(g, start),
        dfs: (g, start) => glGraphDFS(g, start),
        shortestPath: (g, start, end) => glGraphDijkstra(g, start, end),
        // Задача 2: численные методы
        derivative: (f, x) => {
            const h = Math.max(1e-6, Math.abs(x) * 1e-6);
            return (f(x + h) - f(x - h)) / (2 * h);
        },
        integral: (f, a, b) => glAdaptiveSimpson(f, a, b, 1e-8, 20),
        solve: (f, x0) => glNewtonSolve(typeof f === 'string' ? glMakeFuncWrapper(f) : f, x0),
        solveSystem: (fs, x0) => glNewtonSolveSystem(fs.map(f => typeof f === 'string' ? glMakeFuncWrapper(f) : f), x0),

        // === Числа и утилиты ===
        sign: Math.sign, trunc: Math.trunc, cbrt: Math.cbrt, hypot: Math.hypot,
        log2: Math.log2, log10: Math.log10, logBase: (x, b) => Math.log(x) / Math.log(b),
        clamp: (x, a, b) => Math.min(b, Math.max(a, x)),
        lerp: (a, b, t) => a + (b - a) * t,
        fract: (x) => x - Math.floor(x),
        roundTo: (x, d) => { const k = Math.pow(10, d === undefined ? 0 : d); return Math.round(x * k) / k; },
        format: (x, d) => (typeof x === 'number' && isFinite(x)) ? x.toFixed(d === undefined ? 2 : d) : String(x),
        str: (x) => {
            if (glIsComplex(x)) return x.re + (x.im >= 0 ? '+' : '') + x.im + 'i';
            if (glIsRat(x)) return glRatToString(x);
            if (typeof x === 'bigint') return String(x);
            return String(x);
        },
        num: (s) => parseFloat(s),
        mod: (a, b) => ((a % b) + b) % b, // истинный модуль: mod(-1, 5) = 4

        // === Теория чисел и комбинаторика ===
        gcd: (a, b) => glGcd(a, b),
        lcm: (a, b) => { const g = glGcd(a, b); return g === 0 ? 0 : Math.abs(Math.round(a) * Math.round(b)) / g; },
        isPrime: (nv) => glIsPrime(nv),
        primeFactors: (nv) => glPrimeFactors(nv),
        divisors: (nv) => glDivisors(nv),
        gamma: (x) => glGamma(x),
        factorial: (nv) => glFactorial(nv),
        nCr: (nv, kv) => glBinom(nv, kv),
        nPr: (nv, kv) => { kv = Math.round(kv); if (kv < 0) return 0; let r = 1; for (let ii = 0; ii < kv; ii++) r *= (nv - ii); return r; },

        // === Теория вероятностей ===
        binomialPmf: (k, nv, p) => glBinom(nv, k) * Math.pow(p, k) * Math.pow(1 - p, nv - k),
        poissonPmf: (k, lambda) => Math.exp(-lambda) * Math.pow(lambda, k) / glFactorial(k),
        erf: (x) => glErf(x),
        normalPdf: (x, mu, sigma) => { mu = mu || 0; sigma = (sigma === undefined) ? 1 : sigma; const z = (x - mu) / sigma; return Math.exp(-z * z / 2) / (sigma * Math.sqrt(2 * Math.PI)); },
        normalCdf: (x, mu, sigma) => { mu = mu || 0; sigma = (sigma === undefined) ? 1 : sigma; return 0.5 * (1 + glErf((x - mu) / (sigma * Math.SQRT2))); },

        // === Массивы и статистика ===
        sum: (arr) => arr.reduce((s, x) => s + x, 0),
        prod: (arr) => arr.reduce((s, x) => s * x, 1),
        minOf: (arr) => { let m = Infinity; for (const v of arr) if (v < m) m = v; return m; },
        maxOf: (arr) => { let m = -Infinity; for (const v of arr) if (v > m) m = v; return m; },
        median: (arr) => { const a = arr.slice().sort((x, y) => x - y); const mI = a.length >> 1; return a.length % 2 ? a[mI] : (a[mI - 1] + a[mI]) / 2; },
        quantile: (arr, q) => { const a = arr.slice().sort((x, y) => x - y); const pos = (a.length - 1) * q; const lo = Math.floor(pos), hi = Math.ceil(pos); return a[lo] + (a[hi] - a[lo]) * (pos - lo); },
        sortAsc: (arr) => arr.slice().sort((x, y) => x - y),
        reverse: (arr) => arr.slice().reverse(),
        unique: (arr) => Array.from(new Set(arr)),
        linspace: (a, b, nv) => { const out = []; const m = Math.max(2, Math.floor(nv || 50)); for (let ii = 0; ii < m; ii++) out.push(a + (b - a) * ii / (m - 1)); return out; },
        range: (a, b, step) => { const out = []; const st = (step === undefined || step === 0) ? 1 : step; if (st > 0) { for (let x = a; x < b - 1e-12; x += st) out.push(x); } else { for (let x = a; x > b + 1e-12; x += st) out.push(x); } return out; },
        map: (arr, exprStr) => { const ast = glParseExprOnly(String(exprStr)); return arr.map((it, iIdx) => glEvalExpr(ast, { it: it, i: iIdx, time: elapsedTime })); },

        // === Ряды, пределы, корни, производные высших порядков ===
        sumSeries: (f, a, b) => { const fn = typeof f === 'string' ? glMakeFuncWrapper(f) : f; let s = 0; const hi = Math.min(b, a + 1e6); for (let k = Math.ceil(a); k <= hi; k++) s += fn(k); return s; },
        prodSeries: (f, a, b) => { const fn = typeof f === 'string' ? glMakeFuncWrapper(f) : f; let s = 1; const hi = Math.min(b, a + 1e6); for (let k = Math.ceil(a); k <= hi; k++) s *= fn(k); return s; },
        derivative2: (f, x) => { const fn = typeof f === 'string' ? glMakeFuncWrapper(f) : f; const h = Math.max(1e-4, Math.abs(x) * 1e-4); return (fn(x + h) - 2 * fn(x) + fn(x - h)) / (h * h); },
        limitAt: (f, x0, dir) => { const fn = typeof f === 'string' ? glMakeFuncWrapper(f) : f; const sgn = dir === 'left' ? -1 : 1; let prev = NaN; for (let k = 3; k <= 9; k++) { let v; try { v = fn(x0 + sgn * Math.pow(10, -k)); } catch (e) { continue; } if (typeof v === 'number' && isFinite(v)) prev = v; } return prev; },
        bisect: (f, a, b) => { const fn = typeof f === 'string' ? glMakeFuncWrapper(f) : f; let fa = fn(a), fb = fn(b); if (fa === 0) return a; if (fb === 0) return b; if (fa * fb > 0) return null; for (let ii = 0; ii < 200; ii++) { const m = (a + b) / 2; const fm = fn(m); if (fm === 0 || (b - a) / 2 < 1e-12) return m; if (fa * fm < 0) { b = m; } else { a = m; fa = fm; } } return (a + b) / 2; },
        findRoots: (f, a, b, nv) => {
            const fn = typeof f === 'string' ? glMakeFuncWrapper(f) : f;
            const m = Math.max(10, Math.floor(nv || 200));
            const roots = [];
            let px = a, pv = fn(a);
            for (let ii = 1; ii <= m; ii++) {
                const x = a + (b - a) * ii / m;
                const v = fn(x);
                if (typeof pv === 'number' && typeof v === 'number' && isFinite(pv) && isFinite(v)) {
                    if (pv === 0) roots.push(px);
                    else if (pv * v < 0) { const r = GL_BUILTINS.bisect(fn, px, x); if (r !== null) roots.push(r); }
                }
                px = x; pv = v;
            }
            if (typeof pv === 'number' && pv === 0) roots.push(px);
            return roots.filter((r, i2) => i2 === 0 || Math.abs(r - roots[i2 - 1]) > 1e-9);
        },

        // === Векторы ===
        cross: (v, w) => { const a = Array.isArray(v) ? { x: v[0], y: v[1] } : glPointXY(v); const bp = Array.isArray(w) ? { x: w[0], y: w[1] } : glPointXY(w); return a.x * bp.y - a.y * bp.x; },
        normalize: (v) => { const nv = Math.sqrt(v.reduce((s, x) => s + x * x, 0)); return nv < 1e-12 ? v.map(() => 0) : v.map(x => x / nv); },
        vecAngle: (v, w) => { const dp = v.reduce((s, x, ii) => s + x * w[ii], 0); const n1 = Math.sqrt(v.reduce((s, x) => s + x * x, 0)); const n2 = Math.sqrt(w.reduce((s, x) => s + x * x, 0)); if (n1 < 1e-12 || n2 < 1e-12) return 0; return Math.acos(Math.max(-1, Math.min(1, dp / (n1 * n2)))); },

        // === Комплексные числа (дополнительно) ===
        conj: (z) => { z = glToComplex(z); return glComplex(z.re, -z.im); },
        re: (z) => glToComplex(z).re,
        im: (z) => glToComplex(z).im,
        cpow: (a, b) => glComplexPow(a, b),
        fromPolar: (r, phi) => glComplex(r * Math.cos(phi), r * Math.sin(phi)),

        // === Матрицы (дополнительно) ===
        identity: (nv) => Array.from({ length: nv }, (_, ii) => Array.from({ length: nv }, (_, jj) => ii === jj ? 1 : 0)),
        trace: (m) => m.reduce((s, row, ii) => s + row[ii], 0),
        rank: (m) => glMatRank(m),
        solveLinear: (M, rhs) => glSolveLinear(M.map(r => r.slice()), rhs.slice()),
    };
    function glSimpson(f, a, b) { const c = (a + b) / 2; return (b - a) / 6 * (f(a) + 4 * f(c) + f(b)); }
    function glAdaptiveSimpsonRec(f, a, b, eps, whole, depth) {
        const c = (a + b) / 2;
        const left = glSimpson(f, a, c), right = glSimpson(f, c, b);
        if (depth <= 0 || Math.abs(left + right - whole) < 15 * eps) return left + right + (left + right - whole) / 15;
        return glAdaptiveSimpsonRec(f, a, c, eps / 2, left, depth - 1) + glAdaptiveSimpsonRec(f, c, b, eps / 2, right, depth - 1);
    }
    function glAdaptiveSimpson(f, a, b, eps, maxDepth) { return glAdaptiveSimpsonRec(f, a, b, eps, glSimpson(f, a, b), maxDepth); }
    function glNewtonSolve(f, x0) {
        let x = x0;
        for (let i = 0; i < 100; i++) {
            const fx = f(x);
            if (Math.abs(fx) < 1e-10) return x;
            const h = Math.max(1e-6, Math.abs(x) * 1e-6);
            const dfx = (f(x + h) - f(x - h)) / (2 * h);
            if (Math.abs(dfx) < 1e-12) return null;
            const nx = x - fx / dfx;
            if (!isFinite(nx)) return null;
            if (Math.abs(nx - x) < 1e-10) return nx;
            x = nx;
        }
        return null;
    }
    function glNewtonSolveSystem(fs, x0) {
        let x = x0.slice();
        const n = x.length;
        if (fs.length !== n) throw new Error('solveSystem: число уравнений должно совпадать с числом переменных');
        for (let iter = 0; iter < 50; iter++) {
            const fx = fs.map(f => f(...x));
            if (fx.every(v => Math.abs(v) < 1e-9)) return x;
            const J = [];
            for (let eq = 0; eq < n; eq++) {
                const row = [];
                for (let vi = 0; vi < n; vi++) {
                    const h = Math.max(1e-6, Math.abs(x[vi]) * 1e-6);
                    const xp = x.slice(); xp[vi] += h;
                    const xm = x.slice(); xm[vi] -= h;
                    row.push((fs[eq](...xp) - fs[eq](...xm)) / (2 * h));
                }
                J.push(row);
            }
            const negFx = fx.map(v => -v);
            const delta = glSolveLinear(J, negFx);
            if (!delta) return null;
            for (let i = 0; i < n; i++) x[i] += delta[i];
            if (delta.every(d => Math.abs(d) < 1e-10)) return x;
        }
        return null;
    }
    function glIsVec(x) { return Array.isArray(x) && x.every(v => typeof v === 'number'); }
    function glIsMat(x) { return Array.isArray(x) && x.every(row => glIsVec(row)); }
    function glElementwise(a, b, op) {
        if (glIsVec(a) && glIsVec(b) && a.length === b.length) return a.map((v, i) => op(v, b[i]));
        if (glIsMat(a) && glIsMat(b) && a.length === b.length) return a.map((row, i) => glElementwise(row, b[i], op));
        throw new Error('Несовместимые размеры операндов');
    }
    // ---- Задача 1: комплексные числа ----
    function glIsComplex(x) { return x !== null && typeof x === 'object' && x.__type === 'complex'; }
    function glComplex(re, im) { return { __type: 'complex', re: re, im: im === undefined ? 0 : im }; }
    function glToComplex(x) { return glIsComplex(x) ? x : glComplex(typeof x === 'number' ? x : NaN, 0); }
    function glComplexAdd(a, b) { a = glToComplex(a); b = glToComplex(b); return glComplex(a.re + b.re, a.im + b.im); }
    function glComplexSub(a, b) { a = glToComplex(a); b = glToComplex(b); return glComplex(a.re - b.re, a.im - b.im); }
    function glComplexMul(a, b) { a = glToComplex(a); b = glToComplex(b); return glComplex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
    function glComplexDiv(a, b) {
        a = glToComplex(a); b = glToComplex(b);
        const d = b.re * b.re + b.im * b.im;
        if (d < 1e-300) throw new Error('Деление на ноль (комплексное)');
        return glComplex((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
    }
    function glComplexAbs(z) { z = glToComplex(z); return Math.hypot(z.re, z.im); }
    function glComplexArg(z) { z = glToComplex(z); return Math.atan2(z.im, z.re); }
    function glComplexExp(z) { z = glToComplex(z); const e = Math.exp(z.re); return glComplex(e * Math.cos(z.im), e * Math.sin(z.im)); }
    function glComplexLog(z) { z = glToComplex(z); return glComplex(Math.log(glComplexAbs(z)), glComplexArg(z)); }
    function glComplexSin(z) { z = glToComplex(z); return glComplex(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im)); }
    function glComplexCos(z) { z = glToComplex(z); return glComplex(Math.cos(z.re) * Math.cosh(z.im), -Math.sin(z.re) * Math.sinh(z.im)); }

    // ---- Задача 2: преобразования координат точек/векторов ----
    function glPointXY(p) {
        if (p && p.pos && typeof p.pos.x === 'number' && typeof p.pos.y === 'number') return { x: p.pos.x, y: p.pos.y };
        if (p && typeof p.x === 'number' && typeof p.y === 'number') return { x: p.x, y: p.y };
        if (Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number') return { x: p[0], y: p[1] };
        throw new Error('Ожидалась точка (объект с полями x,y или pos.x,pos.y, либо [x, y])');
    }
    function glRotatePoint(point, angle, center) {
        const p = glPointXY(point);
        const c = center !== undefined ? glPointXY(center) : { x: 0, y: 0 };
        const cs = Math.cos(angle), sn = Math.sin(angle);
        const dx = p.x - c.x, dy = p.y - c.y;
        return { x: c.x + dx * cs - dy * sn, y: c.y + dx * sn + dy * cs };
    }
    function glTranslatePoint(point, dx, dy) {
        const p = glPointXY(point);
        return { x: p.x + dx, y: p.y + dy };
    }
    function glScalePoint(point, sx, sy, center) {
        const p = glPointXY(point);
        const c = center !== undefined ? glPointXY(center) : { x: 0, y: 0 };
        const syy = sy === undefined ? sx : sy;
        return { x: c.x + (p.x - c.x) * sx, y: c.y + (p.y - c.y) * syy };
    }
    function glReflectPoint(point, line) {
        const p = glPointXY(point);
        let A, B;
        if (typeof line === 'string') {
            const l = window[line];
            if (!l || !l.pA || !l.pB) throw new Error('reflect(): линия "' + line + '" не найдена');
            A = l.pA.pos; B = l.pB.pos;
        } else if (line && line.pA && line.pB) { A = line.pA.pos; B = line.pB.pos; }
        else if (line && line.a && line.b) { A = line.a; B = line.b; }
        else throw new Error('reflect(): ожидалась линия (имя, объект линии или {a,b})');
        const dx = B.x - A.x, dy = B.y - A.y;
        const len2 = dx * dx + dy * dy;
        const t = len2 < 1e-12 ? 0 : ((p.x - A.x) * dx + (p.y - A.y) * dy) / len2;
        const projx = A.x + dx * t, projy = A.y + dy * t;
        return { x: 2 * projx - p.x, y: 2 * projy - p.y };
    }
    function glTransformPoint(point, matrix) {
        const p = glPointXY(point);
        if (!Array.isArray(matrix) || matrix.length !== 2 || !Array.isArray(matrix[0])) throw new Error('transform(): ожидается матрица 2×2');
        return { x: matrix[0][0] * p.x + matrix[0][1] * p.y, y: matrix[1][0] * p.x + matrix[1][1] * p.y };
    }

    // ---- Задача 1 (новая): вычислительные функции над точками/линиями/многоугольниками ----
    function glResolveLineAB(line) {
        if (typeof line === 'string') {
            const l = window[line];
            if (!l || !l.pA || !l.pB) throw new Error('Линия "' + line + '" не найдена');
            return { a: l.pA.pos, b: l.pB.pos };
        }
        if (line && line.pA && line.pB) return { a: line.pA.pos, b: line.pB.pos };
        if (line && line.a && line.b) return { a: glPointXY(line.a), b: glPointXY(line.b) };
        throw new Error('Ожидалась линия (имя, объект линии или {a, b})');
    }
    function glResolvePointArrayItem(item) {
        if (typeof item === 'string') {
            const p = window[item];
            if (!p) throw new Error('Точка "' + item + '" не найдена');
            return glPointXY(p);
        }
        return glPointXY(item);
    }
    function glDistance(p1, p2) {
        const a = glPointXY(p1), b = glPointXY(p2);
        return Math.hypot(a.x - b.x, a.y - b.y);
    }
    function glPointDistanceToLine(point, line) {
        const p = glPointXY(point);
        const { a, b } = glResolveLineAB(line);
        const dx = b.x - a.x, dy = b.y - a.y;
        const len2 = dx * dx + dy * dy;
        if (len2 < 1e-12) return Math.hypot(p.x - a.x, p.y - a.y);
        const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2; // без зажима в [0,1] — расстояние до прямой, не до отрезка
        return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
    }
    function glClosestPointOnLine(point, line) {
        const p = glPointXY(point);
        const { a, b } = glResolveLineAB(line);
        const dx = b.x - a.x, dy = b.y - a.y;
        const len2 = dx * dx + dy * dy;
        if (len2 < 1e-12) return { x: a.x, y: a.y };
        const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
        return { x: a.x + dx * t, y: a.y + dy * t };
    }
    function glLineDirAngleData(line) {
        const { a, b } = glResolveLineAB(line);
        return { x: b.x - a.x, y: b.y - a.y };
    }
    function glLineAngle(line1, line2) {
        const d1 = glLineDirAngleData(line1), d2 = glLineDirAngleData(line2);
        const mag1 = Math.hypot(d1.x, d1.y), mag2 = Math.hypot(d2.x, d2.y);
        if (mag1 < 1e-12 || mag2 < 1e-12) return 0;
        let cosAngle = (d1.x * d2.x + d1.y * d2.y) / (mag1 * mag2);
        cosAngle = Math.max(-1, Math.min(1, cosAngle));
        let angle = Math.acos(cosAngle);
        if (angle > Math.PI / 2) angle = Math.PI - angle; // угол между прямыми — всегда меньший (0..pi/2)
        return angle;
    }
    function glAreParallel(line1, line2) {
        const d1 = glLineDirAngleData(line1), d2 = glLineDirAngleData(line2);
        const mag = Math.hypot(d1.x, d1.y) * Math.hypot(d2.x, d2.y);
        if (mag < 1e-12) return false;
        return Math.abs((d1.x * d2.y - d1.y * d2.x) / mag) < 1e-6;
    }
    function glArePerpendicular(line1, line2) {
        const d1 = glLineDirAngleData(line1), d2 = glLineDirAngleData(line2);
        const mag = Math.hypot(d1.x, d1.y) * Math.hypot(d2.x, d2.y);
        if (mag < 1e-12) return false;
        return Math.abs((d1.x * d2.x + d1.y * d2.y) / mag) < 1e-6;
    }
    function glPolygonArea(pts) {
        const P = pts.map(glResolvePointArrayItem);
        let area = 0;
        for (let i = 0; i < P.length; i++) { const j = (i + 1) % P.length; area += P[i].x * P[j].y - P[j].x * P[i].y; }
        return Math.abs(area) / 2;
    }
    function glPointInPolygon(point, polygon) {
        const p = glPointXY(point);
        const P = polygon.map(glResolvePointArrayItem);
        let inside = false;
        for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
            const xi = P[i].x, yi = P[i].y, xj = P[j].x, yj = P[j].y;
            const intersect = ((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
    function glSegmentIntersect(line1, line2) {
        const l1 = glResolveLineAB(line1), l2 = glResolveLineAB(line2);
        const p = l1.a, r = { x: l1.b.x - l1.a.x, y: l1.b.y - l1.a.y };
        const q = l2.a, s = { x: l2.b.x - l2.a.x, y: l2.b.y - l2.a.y };
        const rxs = r.x * s.y - r.y * s.x;
        const qmp = { x: q.x - p.x, y: q.y - p.y };
        if (Math.abs(rxs) < 1e-12) return null; // параллельны/коллинеарны — пересечения отрезков нет (или неоднозначно)
        const t = (qmp.x * s.y - qmp.y * s.x) / rxs;
        const u = (qmp.x * r.y - qmp.y * r.x) / rxs;
        if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null;
        return { x: p.x + t * r.x, y: p.y + t * r.y };
    }

    // ---- Задача 1 (новая): выпуклая оболочка и операции над множествами точек ----
    function glCrossSign(A, B, P) { return (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x); }
    function glConvexHull(pts) {
        const P0 = pts.map(glResolvePointArrayItem);
        const sorted = P0.slice().sort((a, b) => a.x - b.x || a.y - b.y);
        const uniq = [];
        for (let p of sorted) {
            if (uniq.length === 0 || Math.abs(uniq[uniq.length - 1].x - p.x) > 1e-9 || Math.abs(uniq[uniq.length - 1].y - p.y) > 1e-9) uniq.push(p);
        }
        const n = uniq.length;
        if (n < 3) return uniq.map(p => ({ x: p.x, y: p.y }));
        const lower = [];
        for (let p of uniq) {
            while (lower.length >= 2 && glCrossSign(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
            lower.push(p);
        }
        const upper = [];
        for (let i = n - 1; i >= 0; i--) {
            const p = uniq[i];
            while (upper.length >= 2 && glCrossSign(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
            upper.push(p);
        }
        lower.pop(); upper.pop();
        return lower.concat(upper).map(p => ({ x: p.x, y: p.y }));
    }
    function glPointsEqual(a, b, eps) { return Math.hypot(a.x - b.x, a.y - b.y) < (eps || 1e-6); }
    function glPointSetOperations(points1, points2, op) {
        const P1 = points1.map(glResolvePointArrayItem);
        const P2 = points2.map(glResolvePointArrayItem);
        if (op === 'union') {
            const result = P1.map(p => ({ x: p.x, y: p.y }));
            for (let p of P2) { if (!result.some(q => glPointsEqual(q, p))) result.push({ x: p.x, y: p.y }); }
            return result;
        }
        if (op === 'intersection') return P1.filter(p => P2.some(q => glPointsEqual(p, q))).map(p => ({ x: p.x, y: p.y }));
        if (op === 'difference') return P1.filter(p => !P2.some(q => glPointsEqual(p, q))).map(p => ({ x: p.x, y: p.y }));
        throw new Error('pointSetOperations(): неизвестная операция "' + op + '" (union/intersection/difference)');
    }

    // ---- Задача 3 (новая): булевы операции над выпуклыми многоугольниками ----
    function glEnsureCCW(poly) {
        let area = 0;
        for (let i = 0; i < poly.length; i++) { const j = (i + 1) % poly.length; area += poly[i].x * poly[j].y - poly[j].x * poly[i].y; }
        return area < 0 ? poly.slice().reverse() : poly;
    }
    function glClipLineIntersect(A, B, P, Q) {
        // пересечение БЕСКОНЕЧНОЙ прямой AB с отрезком PQ (для отсечения по Сазерленду-Ходжману)
        const A1 = B.y - A.y, B1 = A.x - B.x, C1 = A1 * A.x + B1 * A.y;
        const A2 = Q.y - P.y, B2 = P.x - Q.x, C2 = A2 * P.x + B2 * P.y;
        const det = A1 * B2 - A2 * B1;
        if (Math.abs(det) < 1e-12) return { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
        return { x: (B2 * C1 - B1 * C2) / det, y: (A1 * C2 - A2 * C1) / det };
    }
    function glPolygonIntersection(poly1, poly2) {
        let output = glEnsureCCW(poly1.map(glResolvePointArrayItem));
        const clip = glEnsureCCW(poly2.map(glResolvePointArrayItem));
        const n = clip.length;
        for (let i = 0; i < n && output.length > 0; i++) {
            const A = clip[i], B = clip[(i + 1) % n];
            const input = output;
            output = [];
            for (let j = 0; j < input.length; j++) {
                const cur = input[j], prev = input[(j - 1 + input.length) % input.length];
                const curIn = glCrossSign(A, B, cur) >= -1e-9;
                const prevIn = glCrossSign(A, B, prev) >= -1e-9;
                if (curIn) {
                    if (!prevIn) output.push(glClipLineIntersect(A, B, prev, cur));
                    output.push(cur);
                } else if (prevIn) {
                    output.push(glClipLineIntersect(A, B, prev, cur));
                }
            }
        }
        return output.map(p => ({ x: p.x, y: p.y }));
    }
    function glPolygonUnion(poly1, poly2) {
        // Точное объединение двух произвольных выпуклых многоугольников не обязано быть выпуклым (например, непересекающиеся);
        // здесь — практическое приближение: выпуклая оболочка объединения вершин (корректно, когда многоугольники пересекаются/касаются).
        return glConvexHull(poly1.concat(poly2));
    }
    function glPolygonDifference(poly1, poly2) {
        // Разность A \ B для выпуклых A, B (Weiler-Atherton для односвязного случая: когда B не лежит целиком
        // внутри A без касания границы — тогда результат был бы с дырой, что не выражается простым многоугольником).
        const A = glEnsureCCW(poly1.map(glResolvePointArrayItem));
        const B = glEnsureCCW(poly2.map(glResolvePointArrayItem));
        const nA = A.length, nB = B.length;
        if (nA < 3) return A.map(p => ({ x: p.x, y: p.y }));
        const insideB = (p) => B.every((_, i) => glCrossSign(B[i], B[(i + 1) % nB], p) >= -1e-9);

        const hits = []; // { pt, edgeA, tA, edgeB, tB }
        for (let i = 0; i < nA; i++) {
            const a1 = A[i], a2 = A[(i + 1) % nA];
            for (let j = 0; j < nB; j++) {
                const b1 = B[j], b2 = B[(j + 1) % nB];
                const ip = glSegmentIntersect({ a: a1, b: a2 }, { a: b1, b: b2 });
                if (ip) hits.push({ pt: ip, edgeA: i, tA: Math.hypot(ip.x - a1.x, ip.y - a1.y), edgeB: j, tB: Math.hypot(ip.x - b1.x, ip.y - b1.y) });
            }
        }
        if (hits.length === 0) {
            if (insideB(A[0])) return []; // A целиком внутри B
            return A.map(p => ({ x: p.x, y: p.y })); // не пересекаются
        }

        const aByEdge = Array.from({ length: nA }, () => []);
        const bByEdge = Array.from({ length: nB }, () => []);
        for (let h of hits) { aByEdge[h.edgeA].push({ t: h.tA, pt: h.pt, ref: h }); bByEdge[h.edgeB].push({ t: h.tB, pt: h.pt, ref: h }); }
        function buildExtended(poly, n, byEdge) {
            const list = [];
            for (let i = 0; i < n; i++) {
                list.push({ pt: poly[i], isHit: false });
                const hs = byEdge[i].slice().sort((a, b) => a.t - b.t);
                for (let h of hs) list.push({ pt: h.pt, isHit: true, ref: h.ref });
            }
            return list;
        }
        const aList = buildExtended(A, nA, aByEdge);
        const bList = buildExtended(B, nB, bByEdge);
        for (let node of aList) { if (node.isHit) node.otherIdx = bList.findIndex(x => x.isHit && x.ref === node.ref); }
        for (let node of bList) { if (node.isHit) node.otherIdx = aList.findIndex(x => x.isHit && x.ref === node.ref); }

        let startIdx = -1;
        for (let i = 0; i < aList.length; i++) { if (!aList[i].isHit && !insideB(aList[i].pt)) { startIdx = i; break; } }
        if (startIdx === -1) return []; // все вершины A внутри B — вырожденный/дырчатый случай, не поддерживается

        const result = [];
        let onA = true, idx = startIdx;
        let guard = 0;
        do {
            const list = onA ? aList : bList;
            const node = list[idx];
            result.push({ x: node.pt.x, y: node.pt.y });
            if (node.isHit) { idx = node.otherIdx; onA = !onA; }
            const curList = onA ? aList : bList;
            idx = (idx + (onA ? 1 : -1) + curList.length) % curList.length;
            guard++;
        } while (!(onA && idx === startIdx) && guard < 1000);
        return result;
    }

    // ---- Задача 1 (новая): численное решение систем ОДУ первого порядка (Рунге-Кутта 4) ----
    function glOdeSolve(system, initial, tSpan, steps) {
        const n = initial.length;
        const f = typeof system === 'string' ? glMakeFuncWrapper(system) : system;
        if (typeof f !== 'function') throw new Error('odeSolve(): system должен быть именем функции или функцией');
        const nSteps = steps === undefined || steps === null ? 100 : Math.max(1, Math.floor(steps));
        const t0 = tSpan[0], t1 = tSpan[1];
        const dt = (t1 - t0) / nSteps;
        let state = initial.slice();
        let t = t0;
        const result = [state.slice()];
        for (let i = 0; i < nSteps; i++) {
            const k1 = f(t, ...state);
            const k2 = f(t + dt / 2, ...state.map((x, j) => x + dt / 2 * k1[j]));
            const k3 = f(t + dt / 2, ...state.map((x, j) => x + dt / 2 * k2[j]));
            const k4 = f(t + dt, ...state.map((x, j) => x + dt * k3[j]));
            state = state.map((x, j) => x + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
            t += dt;
            result.push(state.slice());
        }
        return result;
    }

    // ---- Задача 2 (новая): интерполяция и аппроксимация ----
    function glInterpolate(pts, method) {
        const P = pts.map(glResolvePointArrayItem).slice().sort((a, b) => a.x - b.x);
        method = method || 'linear';
        if (P.length < 2) throw new Error('interpolate(): нужно минимум 2 точки');
        if (method === 'linear') {
            return (x) => {
                if (x <= P[0].x) return P[0].y;
                if (x >= P[P.length - 1].x) return P[P.length - 1].y;
                for (let i = 0; i < P.length - 1; i++) {
                    if (x >= P[i].x && x <= P[i + 1].x) {
                        const t = (x - P[i].x) / (P[i + 1].x - P[i].x);
                        return P[i].y + t * (P[i + 1].y - P[i].y);
                    }
                }
                return NaN;
            };
        }
        if (method === 'lagrange') {
            return (x) => {
                let sum = 0;
                for (let i = 0; i < P.length; i++) {
                    let term = P[i].y;
                    for (let j = 0; j < P.length; j++) { if (j !== i) term *= (x - P[j].x) / (P[i].x - P[j].x); }
                    sum += term;
                }
                return sum;
            };
        }
        if (method === 'cubic') {
            // Натуральный кубический сплайн (стандартный трёхдиагональный алгоритм)
            const n = P.length;
            const xs = P.map(p => p.x), ys = P.map(p => p.y);
            const h = []; for (let i = 0; i < n - 1; i++) h.push(xs[i + 1] - xs[i]);
            const alpha = new Array(n).fill(0);
            for (let i = 1; i < n - 1; i++) alpha[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
            const l = new Array(n).fill(1), mu = new Array(n).fill(0), z = new Array(n).fill(0);
            for (let i = 1; i < n - 1; i++) {
                l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
                mu[i] = h[i] / l[i];
                z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
            }
            const c = new Array(n).fill(0), b = new Array(n).fill(0), d = new Array(n).fill(0);
            for (let j = n - 2; j >= 0; j--) {
                c[j] = z[j] - mu[j] * c[j + 1];
                b[j] = (ys[j + 1] - ys[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
                d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
            }
            return (x) => {
                let i = 0;
                if (x <= xs[0]) i = 0;
                else if (x >= xs[n - 1]) i = n - 2;
                else { for (let k = 0; k < n - 1; k++) { if (x >= xs[k] && x <= xs[k + 1]) { i = k; break; } } }
                const dx = x - xs[i];
                return ys[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
            };
        }
        throw new Error('interpolate(): неизвестный метод "' + method + '" (ожидается linear/cubic/lagrange)');
    }
    function glFitPolynomial(pts, degree) {
        const P = pts.map(glResolvePointArrayItem);
        const n = Math.max(1, Math.floor(degree)) + 1;
        const XtX = Array.from({ length: n }, () => new Array(n).fill(0));
        const Xty = new Array(n).fill(0);
        for (let p of P) {
            const powers = []; for (let k = 0; k < n; k++) powers.push(Math.pow(p.x, k));
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) XtX[i][j] += powers[i] * powers[j];
                Xty[i] += powers[i] * p.y;
            }
        }
        const coeffs = glSolveLinear(XtX, Xty);
        if (!coeffs) throw new Error('fitPolynomial(): система вырождена (слишком высокая степень для числа точек?)');
        return coeffs; // [c0, c1, c2, ...] для c0 + c1*x + c2*x^2 + ...
    }
    function glFitLinear(pts) {
        const P = pts.map(glResolvePointArrayItem);
        const n = P.length;
        const sx = P.reduce((s, p) => s + p.x, 0), sy = P.reduce((s, p) => s + p.y, 0);
        const sxx = P.reduce((s, p) => s + p.x * p.x, 0), sxy = P.reduce((s, p) => s + p.x * p.y, 0);
        const denom = n * sxx - sx * sx;
        if (Math.abs(denom) < 1e-12) throw new Error('fitLinear(): вырожденные данные (все точки на одной вертикали?)');
        const k = (n * sxy - sx * sy) / denom;
        const b = (sy - k * sx) / n;
        return { k, b };
    }

    // ---- Задача 2 (доп.): матрицы произвольного размера — det/inv/собственные значения и векторы ----
    function glMatDet(m) {
        const n = m.length;
        const A = m.map(row => row.slice());
        let d = 1;
        for (let col = 0; col < n; col++) {
            let piv = col;
            for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
            if (Math.abs(A[piv][col]) < 1e-12) return 0;
            if (piv !== col) { const tmp = A[col]; A[col] = A[piv]; A[piv] = tmp; d = -d; }
            d *= A[col][col];
            for (let r = col + 1; r < n; r++) {
                const factor = A[r][col] / A[col][col];
                for (let c = col; c < n; c++) A[r][c] -= factor * A[col][c];
            }
        }
        return d;
    }
    function glMatInverse(m) {
        const n = m.length;
        const A = m.map((row, i) => row.concat(row.map((_, j) => i === j ? 1 : 0)));
        for (let col = 0; col < n; col++) {
            let piv = col;
            for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
            if (Math.abs(A[piv][col]) < 1e-12) throw new Error('Матрица вырождена');
            const tmp = A[col]; A[col] = A[piv]; A[piv] = tmp;
            const pivVal = A[col][col];
            for (let c = 0; c < 2 * n; c++) A[col][c] /= pivVal;
            for (let r = 0; r < n; r++) {
                if (r === col) continue;
                const factor = A[r][col];
                for (let c = 0; c < 2 * n; c++) A[r][c] -= factor * A[col][c];
            }
        }
        return A.map(row => row.slice(n));
    }
    function glQRDecompose(A) {
        // Модифицированный Грам-Шмидт
        const n = A.length, m = A[0].length;
        const cols = []; for (let j = 0; j < m; j++) cols.push(A.map(row => row[j]));
        const Qc = [], R = Array.from({ length: m }, () => new Array(m).fill(0));
        for (let j = 0; j < m; j++) {
            let v = cols[j].slice();
            for (let i = 0; i < j; i++) {
                const q = Qc[i];
                const dp = v.reduce((s, x, k) => s + x * q[k], 0);
                R[i][j] = dp;
                for (let k = 0; k < n; k++) v[k] -= dp * q[k];
            }
            const nrm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
            R[j][j] = nrm;
            Qc.push(nrm > 1e-12 ? v.map(x => x / nrm) : v.map(() => 0));
        }
        const Q = [];
        for (let i = 0; i < n; i++) { const row = []; for (let j = 0; j < m; j++) row.push(Qc[j][i]); Q.push(row); }
        return { Q, R };
    }
    function glEigenvalues(A) {
        // Неявный QR-алгоритм без сдвигов — численно, для небольших матриц с вещественными собственными значениями
        const n = A.length;
        let Ak = A.map(row => row.slice());
        for (let iter = 0; iter < 300; iter++) {
            const { Q, R } = glQRDecompose(Ak);
            Ak = glMatMatMul(R, Q);
        }
        const eigs = [];
        for (let i = 0; i < n; i++) eigs.push(Ak[i][i]);
        return eigs;
    }
    function glEigenvectors(A) {
        const n = A.length;
        const eigs = glEigenvalues(A);
        return eigs.map((lambda0, k) => {
            const lambda = lambda0 + 1e-8; // сдвиг, чтобы избежать точного вырождения при обращении
            const M = A.map((row, i) => row.map((v, j) => v - (i === j ? lambda : 0)));
            // Несимметричный, зависящий от k стартовый вектор — единичный [1,1,...,1] может оказаться
            // точно ортогонален искомому собственному вектору для симметричных матриц и "схлопнуться" в 0.
            let v = new Array(n).fill(0).map((_, i) => Math.cos(0.7 * (i + 1) + 1.9 * (k + 1)) + 2);
            try {
                const Minv = glMatInverse(M);
                for (let iter = 0; iter < 60; iter++) {
                    let nv = glMatVecMul(Minv, v);
                    let nrm = Math.sqrt(nv.reduce((s, x) => s + x * x, 0));
                    if (nrm < 1e-9) {
                        // вектор схлопнулся (случайно оказался ортогонален направлению) — пробуем другой старт
                        v = v.map((x, i) => x + (i % 2 === 0 ? 0.37 : -0.53) + 0.11 * iter);
                        continue;
                    }
                    v = nv.map(x => x / nrm);
                }
            } catch (e) { v = new Array(n).fill(0); }
            return v;
        });
    }

    // ---- Задача 5: графы ----
    function glGraphNeighbors(g, node) {
        const out = [];
        for (let e of g.edges) {
            if (e.a === node) out.push({ node: e.b, weight: e.weight });
            else if (e.b === node) out.push({ node: e.a, weight: e.weight });
        }
        return out;
    }
    function glGraphBFS(g, start) {
        const visited = new Set([start]);
        const order = [start];
        const queue = [start];
        while (queue.length) {
            const cur = queue.shift();
            for (let nb of glGraphNeighbors(g, cur)) {
                if (!visited.has(nb.node)) { visited.add(nb.node); order.push(nb.node); queue.push(nb.node); }
            }
        }
        return order;
    }
    function glGraphDFS(g, start) {
        const visited = new Set();
        const order = [];
        function visit(node) {
            if (visited.has(node)) return;
            visited.add(node); order.push(node);
            for (let nb of glGraphNeighbors(g, node)) visit(nb.node);
        }
        visit(start);
        return order;
    }
    function glGraphDijkstra(g, start, end) {
        const dist = {}, prev = {}, visited = new Set();
        for (let key in g.nodes) dist[key] = Infinity;
        dist[start] = 0;
        while (true) {
            let u = null, best = Infinity;
            for (let key in dist) { if (!visited.has(key) && dist[key] < best) { best = dist[key]; u = key; } }
            if (u === null) break;
            if (u === end) break;
            visited.add(u);
            for (let nb of glGraphNeighbors(g, u)) {
                const alt = dist[u] + nb.weight;
                if (alt < (dist[nb.node] === undefined ? Infinity : dist[nb.node])) { dist[nb.node] = alt; prev[nb.node] = u; }
            }
        }
        if (dist[end] === undefined || !isFinite(dist[end])) return null;
        const path = [end];
        let cur = end;
        while (prev[cur] !== undefined) { cur = prev[cur]; path.unshift(cur); }
        return { path, distance: dist[end] };
    }

    // ---- Расширенная математика: теория чисел, гамма, erf, ранг матрицы ----
    function glGcd(a, b) {
        a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
        while (b) { const t = a % b; a = b; b = t; }
        return a;
    }
    function glIsPrime(n) {
        n = Math.round(n);
        if (n < 2) return false;
        if (n % 2 === 0) return n === 2;
        if (n % 3 === 0) return n === 3;
        for (let i = 5; i * i <= n; i += 6) { if (n % i === 0 || n % (i + 2) === 0) return false; }
        return true;
    }
    function glPrimeFactors(n) {
        n = Math.abs(Math.round(n));
        const out = [];
        for (let p = 2; p * p <= n; p += (p === 2 ? 1 : 2)) { while (n % p === 0) { out.push(p); n /= p; } }
        if (n > 1) out.push(n);
        return out;
    }
    function glDivisors(n) {
        n = Math.abs(Math.round(n));
        const out = [];
        for (let d = 1; d * d <= n; d++) { if (n % d === 0) { out.push(d); if (d !== n / d) out.push(n / d); } }
        return out.sort((a, b) => a - b);
    }
    function glGamma(x) {
        // Аппроксимация Ланцоша (g = 7); для x < 0.5 — формула отражения
        if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * glGamma(1 - x));
        x -= 1;
        const C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
            -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        let a = C[0];
        const t = x + 7.5;
        for (let i = 1; i < 9; i++) a += C[i] / (x + i);
        return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
    }
    function glFactorial(n) {
        if (typeof n !== 'number' || isNaN(n)) return NaN;
        if (n < 0) return NaN;
        if (Math.abs(n - Math.round(n)) > 1e-9) return glGamma(n + 1); // нецелые — через гамма-функцию
        n = Math.round(n);
        if (n > 170) return Infinity;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    }
    function glBinom(n, k) {
        k = Math.round(k);
        if (k < 0) return 0;
        if (Number.isInteger(n) && n >= 0 && k > n) return 0;
        let r = 1;
        for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
        return Math.abs(r - Math.round(r)) < 1e-6 ? Math.round(r) : r;
    }
    function glErf(x) {
        // Абрамовиц-Стиган 7.1.26, точность ~1.5e-7
        const sgn = x < 0 ? -1 : 1;
        x = Math.abs(x);
        const t = 1 / (1 + 0.3275911 * x);
        const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
        return sgn * y;
    }
    function glMatRank(m) {
        const A = m.map(r => r.slice());
        const rows = A.length, cols = A[0].length;
        let rank = 0;
        for (let col = 0; col < cols && rank < rows; col++) {
            let piv = -1, best = 1e-10;
            for (let r = rank; r < rows; r++) if (Math.abs(A[r][col]) > best) { best = Math.abs(A[r][col]); piv = r; }
            if (piv === -1) continue;
            const tmp = A[rank]; A[rank] = A[piv]; A[piv] = tmp;
            for (let r = 0; r < rows; r++) {
                if (r === rank) continue;
                const f = A[r][col] / A[rank][col];
                for (let c = col; c < cols; c++) A[r][c] -= f * A[rank][c];
            }
            rank++;
        }
        return rank;
    }
    function glComplexPow(a, b) {
        a = glToComplex(a); b = glToComplex(b);
        if (Math.abs(a.re) < 1e-300 && Math.abs(a.im) < 1e-300) {
            return (Math.abs(b.re) < 1e-300 && Math.abs(b.im) < 1e-300) ? glComplex(1, 0) : glComplex(0, 0);
        }
        return glComplexExp(glComplexMul(b, glComplexLog(a)));
    }


    // Преобразует AST выражения в структуру для draw Tree: [метка, [потомки]]
    function glExprToTree(n) {
        if (!n) return ['?', []];
        switch (n.type) {
            case 'num': return [symNumStr(n.value), []];
            case 'ident': return [n.name, []];
            case 'str': return [String(n.value), []];
            case 'neg': return ['-', [glExprToTree(n.expr)]];
            case 'bin': return [n.op, [glExprToTree(n.l), glExprToTree(n.r)]];
            case 'pow': return ['^', [glExprToTree(n.base), glExprToTree(n.exp)]];
            case 'call': return [n.name, n.args.map(glExprToTree)];
            default: return ['?', []];
        }
    }

    // ---- Алгоритмы над графами ----
    function glGraphLayoutCircle(g, r, cx, cy) {
        const keys = Object.keys(g.nodes);
        const R = (r === undefined || r === null) ? Math.min(FIELD_WIDTH, FIELD_HEIGHT) * 0.35 : r;
        const CX = cx || 0, CY = cy || 0;
        for (let i = 0; i < keys.length; i++) {
            const a = -Math.PI / 2 + 2 * Math.PI * i / keys.length;
            g.nodes[keys[i]].pos = [CX + R * Math.cos(a), CY + R * Math.sin(a)];
        }
        return g;
    }
    function glGraphLayoutGrid(g, cols, spacing) {
        const keys = Object.keys(g.nodes);
        const c = Math.max(1, Math.floor(cols || Math.ceil(Math.sqrt(keys.length))));
        const s = spacing || 3;
        const rows = Math.ceil(keys.length / c);
        for (let i = 0; i < keys.length; i++) {
            const col = i % c, row = Math.floor(i / c);
            g.nodes[keys[i]].pos = [(col - (c - 1) / 2) * s, ((rows - 1) / 2 - row) * s];
        }
        return g;
    }
    // Силовая раскладка Фрюхтермана–Рейнгольда: рёбра притягивают, вершины отталкиваются
    function glGraphLayoutForce(g, iters, spread) {
        const keys = Object.keys(g.nodes);
        const n = keys.length;
        if (n === 0) return g;
        const area = (spread || Math.min(FIELD_WIDTH, FIELD_HEIGHT) * 0.8);
        const k = area / Math.sqrt(n);
        const idx = {};
        for (let i = 0; i < n; i++) {
            idx[keys[i]] = i;
            const a = 2 * Math.PI * i / n;
            g.nodes[keys[i]].pos = [area * 0.3 * Math.cos(a), area * 0.3 * Math.sin(a)];
        }
        const N = Math.max(1, Math.floor(iters || 120));
        let temp = area * 0.1;
        for (let it = 0; it < N; it++) {
            const dx = new Array(n).fill(0), dy = new Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const pi = g.nodes[keys[i]].pos, pj = g.nodes[keys[j]].pos;
                    let ddx = pi[0] - pj[0], ddy = pi[1] - pj[1];
                    let dist = Math.hypot(ddx, ddy);
                    if (dist < 1e-6) { ddx = (Math.random() - 0.5) * 0.01; ddy = (Math.random() - 0.5) * 0.01; dist = 0.01; }
                    const rep = (k * k) / dist;
                    const ux = ddx / dist, uy = ddy / dist;
                    dx[i] += ux * rep; dy[i] += uy * rep;
                    dx[j] -= ux * rep; dy[j] -= uy * rep;
                }
            }
            for (const e of g.edges) {
                const ia = idx[e.a], ib = idx[e.b];
                if (ia === undefined || ib === undefined) continue;
                const pa = g.nodes[e.a].pos, pb = g.nodes[e.b].pos;
                let ddx = pa[0] - pb[0], ddy = pa[1] - pb[1];
                let dist = Math.hypot(ddx, ddy);
                if (dist < 1e-6) continue;
                const att = (dist * dist) / k;
                const ux = ddx / dist, uy = ddy / dist;
                dx[ia] -= ux * att; dy[ia] -= uy * att;
                dx[ib] += ux * att; dy[ib] += uy * att;
            }
            for (let i = 0; i < n; i++) {
                const d = Math.hypot(dx[i], dy[i]);
                if (d < 1e-9) continue;
                const lim = Math.min(d, temp);
                const p = g.nodes[keys[i]].pos;
                p[0] += (dx[i] / d) * lim;
                p[1] += (dy[i] / d) * lim;
                p[0] = Math.max(-FIELD_WIDTH / 2, Math.min(FIELD_WIDTH / 2, p[0]));
                p[1] = Math.max(-FIELD_HEIGHT / 2, Math.min(FIELD_HEIGHT / 2, p[1]));
            }
            temp *= 0.95;
        }
        return g;
    }
    // Слоистая раскладка дерева от корня (BFS по уровням)
    function glGraphLayoutTree(g, root, spacing, levelGap) {
        const keys = Object.keys(g.nodes);
        if (!keys.length) return g;
        const start = (root !== undefined && root !== null && g.nodes[root]) ? root : keys[0];
        const adj = glGraphAdjacency(g);
        const level = {}, order = [];
        const seen = {};
        let queue = [start];
        seen[start] = true; level[start] = 0;
        while (queue.length) {
            const cur = queue.shift();
            order.push(cur);
            const nb = adj[cur] || [];
            for (const v of nb) {
                if (!seen[v]) { seen[v] = true; level[v] = level[cur] + 1; queue.push(v); }
            }
        }
        for (const kk of keys) if (!seen[kk]) { level[kk] = 0; order.push(kk); }
        const byLevel = {};
        for (const v of order) {
            const L = level[v] || 0;
            if (!byLevel[L]) byLevel[L] = [];
            byLevel[L].push(v);
        }
        const s = spacing || 3;
        const gap = levelGap || 2.5;
        const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
        for (const L of levels) {
            const row = byLevel[L];
            for (let i = 0; i < row.length; i++) {
                g.nodes[row[i]].pos = [(i - (row.length - 1) / 2) * s, (levels.length - 1) / 2 * gap - L * gap];
            }
        }
        return g;
    }
    function glGraphAdjacency(g) {
        const adj = {};
        for (const k in g.nodes) adj[k] = [];
        for (const e of g.edges) {
            if (adj[e.a] && adj[e.a].indexOf(e.b) === -1) adj[e.a].push(e.b);
            if (adj[e.b] && adj[e.b].indexOf(e.a) === -1) adj[e.b].push(e.a);
        }
        return adj;
    }
    function glGraphComponents(g) {
        const adj = glGraphAdjacency(g);
        const seen = {}, comps = [];
        for (const k in g.nodes) {
            if (seen[k]) continue;
            const comp = [], stack = [k];
            seen[k] = true;
            while (stack.length) {
                const cur = stack.pop();
                comp.push(cur);
                for (const v of (adj[cur] || [])) if (!seen[v]) { seen[v] = true; stack.push(v); }
            }
            comps.push(comp);
        }
        return comps;
    }
    // Двудольная раскраска: возвращает {вершина: 0|1} или null, если есть нечётный цикл
    function glGraphBipartite(g) {
        const adj = glGraphAdjacency(g);
        const color = {};
        for (const k in g.nodes) {
            if (color[k] !== undefined) continue;
            color[k] = 0;
            const queue = [k];
            while (queue.length) {
                const cur = queue.shift();
                for (const v of (adj[cur] || [])) {
                    if (color[v] === undefined) { color[v] = 1 - color[cur]; queue.push(v); }
                    else if (color[v] === color[cur]) return null;
                }
            }
        }
        return color;
    }
    // Остовное дерево минимального веса (Краскал + СНМ)
    function glGraphMST(g) {
        const parent = {};
        for (const k in g.nodes) parent[k] = k;
        function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
        const sorted = g.edges.slice().sort((a, b) => (a.weight || 1) - (b.weight || 1));
        const out = [];
        for (const e of sorted) {
            const ra = find(e.a), rb = find(e.b);
            if (ra === undefined || rb === undefined || ra === rb) continue;
            parent[ra] = rb;
            out.push(e);
        }
        return out;
    }
    // Топологическая сортировка (рёбра трактуются как направленные a -> b)
    function glGraphTopoSort(g) {
        const indeg = {}, adj = {};
        for (const k in g.nodes) { indeg[k] = 0; adj[k] = []; }
        for (const e of g.edges) {
            if (adj[e.a] === undefined || indeg[e.b] === undefined) continue;
            adj[e.a].push(e.b);
            indeg[e.b]++;
        }
        const queue = [];
        for (const k in indeg) if (indeg[k] === 0) queue.push(k);
        const out = [];
        while (queue.length) {
            const cur = queue.shift();
            out.push(cur);
            for (const v of adj[cur]) { indeg[v]--; if (indeg[v] === 0) queue.push(v); }
        }
        return out.length === Object.keys(g.nodes).length ? out : null;
    }


    // ======================================================================
    // ТОЧНАЯ РАЦИОНАЛЬНАЯ АРИФМЕТИКА (ℚ) на BigInt
    // Числа с плавающей точкой не годятся для алгебры и теории чисел:
    // 1/3 + 1/3 + 1/3 обязано быть ровно 1, а определитель матрицы над ℚ — точным.
    // ======================================================================
    function glBigAbs(a) { return a < 0n ? -a : a; }
    function glBigGcd(a, b) {
        a = glBigAbs(a); b = glBigAbs(b);
        while (b) { const t = a % b; a = b; b = t; }
        return a;
    }
    function glIsRat(x) { return x !== null && typeof x === 'object' && x.__type === 'rat'; }
    function glRatMake(n, d) {
        n = BigInt(n); d = (d === undefined ? 1n : BigInt(d));
        if (d === 0n) throw new Error('Рациональное число: нулевой знаменатель');
        if (d < 0n) { n = -n; d = -d; }
        const g = glBigGcd(n, d) || 1n;
        return { __type: 'rat', n: n / g, d: d / g };
    }
    // Перевод произвольного значения в точную дробь.
    // Нецелые float приближаются цепной дробью — иначе 0.1 дало бы чудовищную дробь.
    function glToRat(x) {
        if (glIsRat(x)) return x;
        if (typeof x === 'bigint') return glRatMake(x, 1n);
        if (typeof x === 'number') {
            if (!isFinite(x)) throw new Error('Рациональное число: значение не конечно');
            if (Math.abs(x - Math.round(x)) < 1e-12) return glRatMake(BigInt(Math.round(x)), 1n);
            return glBestRational(x, 1000000000);
        }
        if (typeof x === 'string') {
            const parts = x.split('/');
            if (parts.length === 2) return glRatMake(BigInt(parts[0].trim()), BigInt(parts[1].trim()));
            return glToRat(parseFloat(x));
        }
        throw new Error('Не удаётся привести к рациональному: ' + typeof x);
    }
    function glRatAdd(a, b) { a = glToRat(a); b = glToRat(b); return glRatMake(a.n * b.d + b.n * a.d, a.d * b.d); }
    function glRatSub(a, b) { a = glToRat(a); b = glToRat(b); return glRatMake(a.n * b.d - b.n * a.d, a.d * b.d); }
    function glRatMul(a, b) { a = glToRat(a); b = glToRat(b); return glRatMake(a.n * b.n, a.d * b.d); }
    function glRatDiv(a, b) {
        a = glToRat(a); b = glToRat(b);
        if (b.n === 0n) throw new Error('Рациональное число: деление на ноль');
        return glRatMake(a.n * b.d, a.d * b.n);
    }
    function glRatPow(a, e) {
        a = glToRat(a);
        let k = BigInt(Math.round(Number(e)));
        if (k === 0n) return glRatMake(1n, 1n);
        const inv = k < 0n;
        if (inv) k = -k;
        let bn = 1n, bd = 1n;
        for (let i = 0n; i < k; i++) { bn *= a.n; bd *= a.d; }
        return inv ? glRatMake(bd, bn) : glRatMake(bn, bd);
    }
    function glRatCmp(a, b) {
        a = glToRat(a); b = glToRat(b);
        const l = a.n * b.d, r = b.n * a.d;
        return l < r ? -1 : (l > r ? 1 : 0);
    }
    function glRatToNumber(a) { a = glToRat(a); return Number(a.n) / Number(a.d); }
    function glRatToString(a) { a = glToRat(a); return a.d === 1n ? String(a.n) : (String(a.n) + '/' + String(a.d)); }
    // Наилучшее рациональное приближение с ограниченным знаменателем (цепная дробь)
    function glBestRational(x, maxDen) {
        maxDen = maxDen || 10000;
        const neg = x < 0;
        x = Math.abs(x);
        let h0 = 0n, h1 = 1n, k0 = 1n, k1 = 0n;
        let v = x;
        for (let i = 0; i < 64; i++) {
            const a = Math.floor(v);
            const aB = BigInt(a);
            const h2 = aB * h1 + h0, k2 = aB * k1 + k0;
            if (k2 > BigInt(maxDen)) break;
            h0 = h1; h1 = h2; k0 = k1; k1 = k2;
            const frac = v - a;
            if (frac < 1e-15) break;
            v = 1 / frac;
        }
        if (k1 === 0n) return glRatMake(BigInt(Math.round(x)), 1n);
        return glRatMake(neg ? -h1 : h1, k1);
    }

    // ======================================================================
    // ТЕОРИЯ ЧИСЕЛ (BigInt): модулярная арифметика, простота, факторизация
    // ======================================================================
    function glToBig(x) {
        if (typeof x === 'bigint') return x;
        if (glIsRat(x)) { if (x.d !== 1n) throw new Error('Ожидалось целое, получена дробь'); return x.n; }
        return BigInt(Math.round(Number(x)));
    }
    function glModPow(base, exp, mod) {
        base = glToBig(base); exp = glToBig(exp); mod = glToBig(mod);
        if (mod === 1n) return 0n;
        let result = 1n;
        base = ((base % mod) + mod) % mod;
        while (exp > 0n) {
            if (exp & 1n) result = (result * base) % mod;
            base = (base * base) % mod;
            exp >>= 1n;
        }
        return result;
    }
    // Расширенный Евклид: возвращает [g, x, y] с a*x + b*y = g
    function glEgcd(a, b) {
        a = glToBig(a); b = glToBig(b);
        let old_r = a, r = b, old_s = 1n, s = 0n, old_t = 0n, t = 1n;
        while (r !== 0n) {
            const q = old_r / r;
            [old_r, r] = [r, old_r - q * r];
            [old_s, s] = [s, old_s - q * s];
            [old_t, t] = [t, old_t - q * t];
        }
        return [old_r, old_s, old_t];
    }
    function glModInv(a, m) {
        a = glToBig(a); m = glToBig(m);
        const [g, x] = glEgcd(((a % m) + m) % m, m);
        if (glBigAbs(g) !== 1n) return null; // обратного не существует
        return ((x % m) + m) % m;
    }
    // Тест Миллера–Рабина с детерминированным набором свидетелей
    function glIsPrimeBig(n) {
        n = glToBig(n);
        if (n < 2n) return false;
        const small = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
        for (const p of small) { if (n === p) return true; if (n % p === 0n) return false; }
        let d = n - 1n, r = 0n;
        while (d % 2n === 0n) { d /= 2n; r++; }
        for (const a of small) {
            let x = glModPow(a, d, n);
            if (x === 1n || x === n - 1n) continue;
            let composite = true;
            for (let i = 0n; i < r - 1n; i++) {
                x = (x * x) % n;
                if (x === n - 1n) { composite = false; break; }
            }
            if (composite) return false;
        }
        return true;
    }
    function glNextPrime(n) {
        n = glToBig(n) + 1n;
        if (n <= 2n) return 2n;
        if (n % 2n === 0n) n++;
        while (!glIsPrimeBig(n)) n += 2n;
        return n;
    }
    // ро-алгоритм Полларда — факторизация чисел, неподъёмных перебором
    function glPollardRho(n) {
        if (n % 2n === 0n) return 2n;
        let x = 2n, y = 2n, d = 1n, c = 1n;
        const f = (v) => (v * v + c) % n;
        while (true) {
            x = f(x); y = f(f(y));
            d = glBigGcd(glBigAbs(x - y), n);
            if (d === n) { c++; x = 2n; y = 2n; d = 1n; continue; }
            if (d > 1n) return d;
        }
    }
    function glFactorize(n) {
        n = glToBig(n);
        if (n < 0n) n = -n;
        const out = [];
        if (n <= 1n) return out;
        const stack = [n];
        while (stack.length) {
            const cur = stack.pop();
            if (cur === 1n) continue;
            if (glIsPrimeBig(cur)) { out.push(cur); continue; }
            const d = glPollardRho(cur);
            stack.push(d, cur / d);
        }
        out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
        return out;
    }
    function glFactorMap(n) {
        const fs2 = glFactorize(n);
        const out = [];
        for (const p of fs2) {
            const last = out[out.length - 1];
            if (last && last[0] === p) last[1]++;
            else out.push([p, 1]);
        }
        return out;
    }
    function glEulerPhi(n) {
        n = glToBig(n);
        if (n <= 0n) return 0n;
        let result = n;
        for (const [p] of glFactorMap(n)) result = result / p * (p - 1n);
        return result;
    }
    function glMobius(n) {
        n = glToBig(n);
        if (n <= 0n) return 0;
        const fm = glFactorMap(n);
        for (const [, e] of fm) if (e > 1) return 0;
        return fm.length % 2 === 0 ? 1 : -1;
    }
    // Китайская теорема об остатках
    function glCRT(rems, mods) {
        let R = glToBig(rems[0]), M = glToBig(mods[0]);
        for (let i = 1; i < mods.length; i++) {
            const r2 = glToBig(rems[i]), m2 = glToBig(mods[i]);
            const [g, p] = glEgcd(M, m2);
            if ((r2 - R) % g !== 0n) return null; // система несовместна
            const lcm = M / g * m2;
            const tmp = ((r2 - R) / g % (m2 / g)) * (p % (m2 / g)) % (m2 / g);
            R = ((R + M * tmp) % lcm + lcm) % lcm;
            M = lcm;
        }
        return [R, M];
    }
    function glOrderMod(a, n) {
        a = glToBig(a); n = glToBig(n);
        if (glBigGcd(a, n) !== 1n) return null;
        const phi = glEulerPhi(n);
        let best = phi;
        for (const [p, e] of glFactorMap(phi)) {
            for (let i = 0; i < e; i++) {
                if (glModPow(a, best / p, n) === 1n) best = best / p;
                else break;
            }
        }
        return best;
    }
    function glPrimitiveRoot(p) {
        p = glToBig(p);
        if (p === 2n) return 1n;
        const phi = glEulerPhi(p);
        const facs = glFactorMap(phi).map(f => f[0]);
        for (let g = 2n; g < p; g++) {
            let ok = true;
            for (const q of facs) if (glModPow(g, phi / q, p) === 1n) { ok = false; break; }
            if (ok) return g;
        }
        return null;
    }
    // Дискретный логарифм: baby-step giant-step
    function glDiscreteLog(g, h, p) {
        g = glToBig(g); h = glToBig(h); p = glToBig(p);
        const m = BigInt(Math.ceil(Math.sqrt(Number(p))));
        const table = new Map();
        let e = 1n;
        for (let j = 0n; j < m; j++) { if (!table.has(e)) table.set(e, j); e = (e * g) % p; }
        const factor = glModPow(glModInv(g, p), m, p);
        let gamma = h % p;
        for (let i = 0n; i < m; i++) {
            if (table.has(gamma)) return i * m + table.get(gamma);
            gamma = (gamma * factor) % p;
        }
        return null;
    }
    function glLegendre(a, p) {
        a = glToBig(a); p = glToBig(p);
        const ls = glModPow(((a % p) + p) % p, (p - 1n) / 2n, p);
        return ls === p - 1n ? -1 : Number(ls);
    }
    function glJacobi(a, n) {
        a = glToBig(a); n = glToBig(n);
        if (n <= 0n || n % 2n === 0n) return 0;
        a = ((a % n) + n) % n;
        let result = 1;
        while (a !== 0n) {
            while (a % 2n === 0n) {
                a /= 2n;
                const r = n % 8n;
                if (r === 3n || r === 5n) result = -result;
            }
            [a, n] = [n, a];
            if (a % 4n === 3n && n % 4n === 3n) result = -result;
            a %= n;
        }
        return n === 1n ? result : 0;
    }
    // Квадратный корень по модулю простого (Тонелли–Шенкс)
    function glSqrtMod(a, p) {
        a = glToBig(a); p = glToBig(p);
        a = ((a % p) + p) % p;
        if (a === 0n) return 0n;
        if (p === 2n) return a;
        if (glLegendre(a, p) !== 1) return null; // не квадратичный вычет
        if (p % 4n === 3n) return glModPow(a, (p + 1n) / 4n, p);
        let q = p - 1n, s = 0n;
        while (q % 2n === 0n) { q /= 2n; s++; }
        let z = 2n;
        while (glLegendre(z, p) !== -1) z++;
        let m = s, c = glModPow(z, q, p), t = glModPow(a, q, p), r = glModPow(a, (q + 1n) / 2n, p);
        while (t !== 1n) {
            let i = 0n, tt = t;
            while (tt !== 1n) { tt = (tt * tt) % p; i++; }
            let b = c;
            for (let j = 0n; j < m - i - 1n; j++) b = (b * b) % p;
            m = i; c = (b * b) % p; t = (t * c) % p; r = (r * b) % p;
        }
        return r;
    }
    function glPAdicValuation(n, p) {
        n = glToBig(n); p = glToBig(p);
        if (n === 0n) return Infinity;
        let v = 0;
        while (n % p === 0n) { n /= p; v++; }
        return v;
    }
    // Разложение в цепную дробь
    function glContinuedFraction(x, n) {
        n = n || 12;
        const out = [];
        let v = x;
        for (let i = 0; i < n; i++) {
            const a = Math.floor(v);
            out.push(a);
            const frac = v - a;
            if (Math.abs(frac) < 1e-12) break;
            v = 1 / frac;
        }
        return out;
    }
    function glCfToRational(cf) {
        let n = 1n, d = 0n;
        for (let i = cf.length - 1; i >= 0; i--) {
            const a = BigInt(Math.round(cf[i]));
            [n, d] = [a * n + d, n];
        }
        return glRatMake(n, d);
    }

    // ======================================================================
    // КОМБИНАТОРИКА
    // ======================================================================
    function glBigFactorial(n) {
        n = glToBig(n);
        let r = 1n;
        for (let i = 2n; i <= n; i++) r *= i;
        return r;
    }
    function glBigBinom(n, k) {
        n = glToBig(n); k = glToBig(k);
        if (k < 0n || k > n) return 0n;
        if (k > n - k) k = n - k;
        let r = 1n;
        for (let i = 0n; i < k; i++) r = r * (n - i) / (i + 1n);
        return r;
    }
    function glPartitionCount(n) {
        n = Math.floor(Number(n));
        if (n < 0) return 0n;
        const dp = new Array(n + 1).fill(0n);
        dp[0] = 1n;
        for (let k = 1; k <= n; k++) {
            for (let i = k; i <= n; i++) dp[i] += dp[i - k];
        }
        return dp[n];
    }
    function glPartitionsList(n) {
        n = Math.floor(Number(n));
        const out = [];
        (function rec(remaining, maxPart, current) {
            if (remaining === 0) { out.push(current.slice()); return; }
            for (let p = Math.min(remaining, maxPart); p >= 1; p--) {
                current.push(p);
                rec(remaining - p, p, current);
                current.pop();
            }
        })(n, n, []);
        return out;
    }
    function glStirling2(n, k) {
        n = Math.floor(Number(n)); k = Math.floor(Number(k));
        if (k === 0) return n === 0 ? 1n : 0n;
        if (k > n) return 0n;
        const dp = [];
        for (let i = 0; i <= n; i++) dp.push(new Array(k + 1).fill(0n));
        dp[0][0] = 1n;
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= Math.min(i, k); j++) {
                dp[i][j] = BigInt(j) * dp[i - 1][j] + dp[i - 1][j - 1];
            }
        }
        return dp[n][k];
    }
    function glStirling1(n, k) {
        n = Math.floor(Number(n)); k = Math.floor(Number(k));
        if (k > n) return 0n;
        const dp = [];
        for (let i = 0; i <= n; i++) dp.push(new Array(k + 1).fill(0n));
        dp[0][0] = 1n;
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= Math.min(i, k); j++) {
                dp[i][j] = dp[i - 1][j - 1] - BigInt(i - 1) * dp[i - 1][j];
            }
        }
        return dp[n][k];
    }
    function glBellNumber(n) {
        n = Math.floor(Number(n));
        let row = [1n];
        for (let i = 1; i <= n; i++) {
            const next = [row[row.length - 1]];
            for (let j = 0; j < row.length; j++) next.push(next[j] + row[j]);
            row = next;
        }
        return row[0];
    }
    function glCatalan(n) { n = glToBig(n); return glBigBinom(2n * n, n) / (n + 1n); }
    function glDerangements(n) {
        n = Math.floor(Number(n));
        let a = 1n, b = 0n;
        if (n === 0) return 1n;
        for (let i = 2; i <= n; i++) { const c = BigInt(i - 1) * (a + b); a = b; b = c; }
        return b;
    }
    function glPermutationsOf(arr) {
        const out = [];
        const a = arr.slice();
        (function rec(k) {
            if (k === a.length) { out.push(a.slice()); return; }
            for (let i = k; i < a.length; i++) {
                [a[k], a[i]] = [a[i], a[k]];
                rec(k + 1);
                [a[k], a[i]] = [a[i], a[k]];
            }
        })(0);
        return out;
    }
    function glCombinationsOf(arr, k) {
        k = Math.floor(Number(k));
        const out = [];
        (function rec(start, cur) {
            if (cur.length === k) { out.push(cur.slice()); return; }
            for (let i = start; i < arr.length; i++) { cur.push(arr[i]); rec(i + 1, cur); cur.pop(); }
        })(0, []);
        return out;
    }
    function glPowerSet(arr) {
        const out = [[]];
        for (const x of arr) {
            const cur = out.length;
            for (let i = 0; i < cur; i++) out.push(out[i].concat([x]));
        }
        return out;
    }

    // ======================================================================
    // СПЕЦИАЛЬНЫЕ ФУНКЦИИ
    // ======================================================================
    function glZeta(s) {
        if (s === 1) return Infinity;
        if (s < 0.5) {
            // функциональное уравнение для продолжения в левую полуплоскость
            return Math.pow(2, s) * Math.pow(Math.PI, s - 1) *
                   Math.sin(Math.PI * s / 2) * glGamma(1 - s) * glZeta(1 - s);
        }
        // ускорение сходимости методом Эйлера–Маклорена
        const N = 20;
        let sum = 0;
        for (let k = 1; k < N; k++) sum += Math.pow(k, -s);
        sum += Math.pow(N, 1 - s) / (s - 1) + 0.5 * Math.pow(N, -s);
        let term = s * Math.pow(N, -s - 1) / 12;
        sum += term;
        term = s * (s + 1) * (s + 2) * Math.pow(N, -s - 3) / 720;
        sum -= term;
        return sum;
    }
    function glBesselJ(n, x) {
        n = Math.round(Number(n));
        let sum = 0;
        for (let k = 0; k < 40; k++) {
            const num = Math.pow(-1, k) * Math.pow(x / 2, 2 * k + n);
            const den = glFactorial(k) * glGamma(k + n + 1);
            if (!isFinite(den) || den === 0) break;
            sum += num / den;
        }
        return sum;
    }
    function glLegendreP(n, x) {
        n = Math.round(Number(n));
        if (n === 0) return 1;
        if (n === 1) return x;
        let p0 = 1, p1 = x;
        for (let k = 2; k <= n; k++) {
            const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k;
            p0 = p1; p1 = p2;
        }
        return p1;
    }
    function glChebyshevT(n, x) {
        n = Math.round(Number(n));
        if (n === 0) return 1;
        if (n === 1) return x;
        let t0 = 1, t1 = x;
        for (let k = 2; k <= n; k++) { const t2 = 2 * x * t1 - t0; t0 = t1; t1 = t2; }
        return t1;
    }
    function glHermiteH(n, x) {
        n = Math.round(Number(n));
        if (n === 0) return 1;
        if (n === 1) return 2 * x;
        let h0 = 1, h1 = 2 * x;
        for (let k = 2; k <= n; k++) { const h2 = 2 * x * h1 - 2 * (k - 1) * h0; h0 = h1; h1 = h2; }
        return h1;
    }
    function glLaguerreL(n, x) {
        n = Math.round(Number(n));
        if (n === 0) return 1;
        if (n === 1) return 1 - x;
        let l0 = 1, l1 = 1 - x;
        for (let k = 2; k <= n; k++) {
            const l2 = ((2 * k - 1 - x) * l1 - (k - 1) * l0) / k;
            l0 = l1; l1 = l2;
        }
        return l1;
    }
    // Полные эллиптические интегралы через среднее арифметико-геометрическое
    function glEllipticK(m) {
        let a = 1, b = Math.sqrt(1 - m);
        for (let i = 0; i < 60; i++) {
            const a2 = (a + b) / 2, b2 = Math.sqrt(a * b);
            if (Math.abs(a2 - b2) < 1e-15) break;
            a = a2; b = b2;
        }
        return Math.PI / (a + b);
    }
    function glEllipticE(m) {
        let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m);
        let sum = c * c / 2, pow2 = 1;
        for (let i = 0; i < 60; i++) {
            const a2 = (a + b) / 2, b2 = Math.sqrt(a * b);
            c = (a - b) / 2;
            pow2 *= 2;
            sum += pow2 * c * c / 2;
            if (Math.abs(a2 - b2) < 1e-15) break;
            a = a2; b = b2;
        }
        return glEllipticK(m) * (1 - sum);
    }
    function glDigamma(x) {
        let result = 0;
        while (x < 6) { result -= 1 / x; x++; }
        const inv = 1 / x, inv2 = inv * inv;
        result += Math.log(x) - 0.5 * inv;
        result -= inv2 * (1 / 12 - inv2 * (1 / 120 - inv2 / 252));
        return result;
    }
    function glLambertW(x) {
        if (x < -1 / Math.E) return NaN;
        let w = x < 1 ? x : Math.log(x);
        for (let i = 0; i < 60; i++) {
            const ew = Math.exp(w);
            const f = w * ew - x;
            const dw = f / (ew * (w + 1) - (w + 2) * f / (2 * w + 2));
            w -= dw;
            if (Math.abs(dw) < 1e-15) break;
        }
        return w;
    }
    function glAiryAi(x) {
        // через модифицированные функции Бесселя порядка 1/3
        if (Math.abs(x) < 1e-9) return 0.3550280538878172;
        const z = 2 / 3 * Math.pow(Math.abs(x), 1.5);
        if (x > 0) {
            let sum = 0;
            for (let k = 0; k < 60; k++) {
                const t = Math.pow(z / 2, 2 * k - 1 / 3) / (glFactorial(k) * glGamma(k + 1 - 1 / 3));
                const t2 = Math.pow(z / 2, 2 * k + 1 / 3) / (glFactorial(k) * glGamma(k + 1 + 1 / 3));
                sum += t - t2;
            }
            return Math.sqrt(x / 3) * sum / Math.PI * Math.PI / 3 * 3;
        }
        const j13 = glBesselJ(1 / 3, z), jm13 = glBesselJ(-1 / 3, z);
        return Math.sqrt(-x) / 3 * (j13 + jm13);
    }


    // ======================================================================
    // АБСТРАКТНАЯ АЛГЕБРА: конечные группы
    // Группа задаётся носителем и операцией; все алгоритмы (подгруппы, смежные
    // классы, центр, классы сопряжённости) работают через них универсально.
    // ======================================================================
    function glGKey(x) { return typeof x === 'object' ? JSON.stringify(x) : String(x); }
    function glMakeGroup(els, mul, id, name) {
        const g = { __type: 'group', els: els, mul: mul, id: id, name: name || 'G' };
        g.index = {};
        for (let i = 0; i < els.length; i++) g.index[glGKey(els[i])] = i;
        return g;
    }
    function glGroupInv(g, a) {
        for (const x of g.els) if (glGKey(g.mul(a, x)) === glGKey(g.id)) return x;
        return null;
    }
    function glCyclicGroup(n) {
        n = Math.max(1, Math.floor(Number(n)));
        const els = [];
        for (let i = 0; i < n; i++) els.push(i);
        return glMakeGroup(els, (a, b) => (a + b) % n, 0, 'Z' + n);
    }
    // Диэдральная: элемент [s, k] означает (отражение^s)·(поворот^k)
    function glDihedralGroup(n) {
        n = Math.max(1, Math.floor(Number(n)));
        const els = [];
        for (let s = 0; s < 2; s++) for (let k = 0; k < n; k++) els.push([s, k]);
        const mul = (a, b) => {
            const s1 = a[0], k1 = a[1], s2 = b[0], k2 = b[1];
            if (s1 === 0) return [s2, (k1 + k2) % n];
            return [(1 + s2) % 2, ((k1 - k2) % n + n) % n];
        };
        return glMakeGroup(els, mul, [0, 0], 'D' + n);
    }
    function glSymmetricGroup(n) {
        n = Math.max(1, Math.floor(Number(n)));
        const base = [];
        for (let i = 0; i < n; i++) base.push(i);
        const els = glPermutationsOf(base);
        const mul = (a, b) => a.map((_, i) => a[b[i]]);
        return glMakeGroup(els, mul, base.slice(), 'S' + n);
    }
    function glAlternatingGroup(n) {
        const s = glSymmetricGroup(n);
        const els = s.els.filter(p => glPermSign(p) === 1);
        return glMakeGroup(els, s.mul, s.id, 'A' + n);
    }
    // Мультипликативная группа обратимых вычетов
    function glUnitsGroup(n) {
        n = Math.max(1, Math.floor(Number(n)));
        const els = [];
        for (let i = 1; i < n; i++) if (glGcd(i, n) === 1) els.push(i);
        return glMakeGroup(els, (a, b) => (a * b) % n, 1, 'U(' + n + ')');
    }
    function glGroupTable(g) {
        const out = [];
        for (const a of g.els) {
            const row = [];
            for (const b of g.els) row.push(g.index[glGKey(g.mul(a, b))]);
            out.push(row);
        }
        return out;
    }
    function glGroupElementOrder(g, a) {
        let cur = a, k = 1;
        while (glGKey(cur) !== glGKey(g.id)) {
            cur = g.mul(cur, a); k++;
            if (k > g.els.length + 1) return -1;
        }
        return k;
    }
    function glGroupIsAbelian(g) {
        for (const a of g.els) for (const b of g.els) {
            if (glGKey(g.mul(a, b)) !== glGKey(g.mul(b, a))) return false;
        }
        return true;
    }
    // Замыкание набора образующих относительно операции
    function glGroupGenerated(g, gens) {
        const seen = {}, out = [];
        const push = (x) => { const k = glGKey(x); if (!seen[k]) { seen[k] = true; out.push(x); } };
        push(g.id);
        for (const x of gens) push(x);
        let changed = true;
        while (changed) {
            changed = false;
            for (let i = 0; i < out.length; i++) {
                for (const gg of gens) {
                    const p = g.mul(out[i], gg);
                    if (!seen[glGKey(p)]) { push(p); changed = true; }
                }
            }
        }
        return out;
    }
    function glGroupSubgroups(g) {
        const found = {}, out = [];
        const n = g.els.length;
        if (n > 24) {
            // для больших групп ограничиваемся циклическими подгруппами
            for (const a of g.els) {
                const sub = glGroupGenerated(g, [a]);
                const key = sub.map(glGKey).sort().join('|');
                if (!found[key]) { found[key] = true; out.push(sub); }
            }
            return out;
        }
        for (const a of g.els) {
            for (const b of g.els) {
                const sub = glGroupGenerated(g, [a, b]);
                const key = sub.map(glGKey).sort().join('|');
                if (!found[key]) { found[key] = true; out.push(sub); }
            }
        }
        out.sort((x, y) => x.length - y.length);
        return out;
    }
    function glGroupCosets(g, sub, side) {
        const subKeys = {};
        for (const s of sub) subKeys[glGKey(s)] = true;
        const seen = {}, out = [];
        for (const a of g.els) {
            if (seen[glGKey(a)]) continue;
            const coset = sub.map(s => (side === 'right' ? g.mul(s, a) : g.mul(a, s)));
            for (const c of coset) seen[glGKey(c)] = true;
            out.push(coset);
        }
        return out;
    }
    function glGroupIsNormal(g, sub) {
        const subKeys = {};
        for (const s of sub) subKeys[glGKey(s)] = true;
        for (const a of g.els) {
            const ai = glGroupInv(g, a);
            for (const s of sub) {
                if (!subKeys[glGKey(g.mul(g.mul(a, s), ai))]) return false;
            }
        }
        return true;
    }
    function glGroupCenter(g) {
        const out = [];
        for (const a of g.els) {
            let ok = true;
            for (const b of g.els) if (glGKey(g.mul(a, b)) !== glGKey(g.mul(b, a))) { ok = false; break; }
            if (ok) out.push(a);
        }
        return out;
    }
    function glGroupConjugacyClasses(g) {
        const seen = {}, out = [];
        for (const a of g.els) {
            if (seen[glGKey(a)]) continue;
            const cls = [];
            for (const b of g.els) {
                const bi = glGroupInv(g, b);
                const c = g.mul(g.mul(b, a), bi);
                if (!seen[glGKey(c)]) { seen[glGKey(c)] = true; cls.push(c); }
            }
            out.push(cls);
        }
        return out;
    }
    // Фактор-группа по нормальной подгруппе: элементы — смежные классы
    function glGroupQuotient(g, sub) {
        if (!glGroupIsNormal(g, sub)) return null;
        const cosets = glGroupCosets(g, sub, 'left');
        const repOf = {};
        for (let i = 0; i < cosets.length; i++) for (const x of cosets[i]) repOf[glGKey(x)] = i;
        const els = cosets.map((c, i) => i);
        const mul = (i, j) => repOf[glGKey(g.mul(cosets[i][0], cosets[j][0]))];
        return glMakeGroup(els, mul, repOf[glGKey(g.id)], 'G/N');
    }
    // Изоморфизм малых групп: сначала отсекаем по спектру порядков элементов
    function glGroupIsomorphic(g1, g2) {
        if (g1.els.length !== g2.els.length) return false;
        const spec = (g) => g.els.map(a => glGroupElementOrder(g, a)).sort((a, b) => a - b).join(',');
        if (spec(g1) !== spec(g2)) return false;
        if (g1.els.length > 8) return true; // эвристика: дальше не проверяем
        const perms = glPermutationsOf(g2.els.map((_, i) => i));
        for (const p of perms) {
            const map = {};
            for (let i = 0; i < g1.els.length; i++) map[glGKey(g1.els[i])] = g2.els[p[i]];
            if (glGKey(map[glGKey(g1.id)]) !== glGKey(g2.id)) continue;
            let ok = true;
            for (const a of g1.els) {
                for (const b of g1.els) {
                    const lhs = map[glGKey(g1.mul(a, b))];
                    const rhs = g2.mul(map[glGKey(a)], map[glGKey(b)]);
                    if (glGKey(lhs) !== glGKey(rhs)) { ok = false; break; }
                }
                if (!ok) break;
            }
            if (ok) return true;
        }
        return false;
    }
    // Граф Кэли — сразу в формате draw Graph
    function glCayleyGraph(g, gens) {
        const graph = { __type: 'graph', nodes: {}, edges: [] };
        const label = (x) => glGKey(x);
        for (const a of g.els) graph.nodes[label(a)] = { label: label(a), pos: [0, 0] };
        for (const a of g.els) {
            for (const s of gens) {
                graph.edges.push({ a: label(a), b: label(g.mul(a, s)), weight: 1 });
            }
        }
        return graph;
    }

    // ---- Перестановки ----
    function glPermCompose(a, b) { return a.map((_, i) => a[b[i]]); }
    function glPermInverse(a) {
        const out = new Array(a.length);
        for (let i = 0; i < a.length; i++) out[a[i]] = i;
        return out;
    }
    function glPermCycles(a) {
        const seen = new Array(a.length).fill(false);
        const out = [];
        for (let i = 0; i < a.length; i++) {
            if (seen[i]) continue;
            const cyc = [];
            let j = i;
            while (!seen[j]) { seen[j] = true; cyc.push(j); j = a[j]; }
            if (cyc.length > 1) out.push(cyc);
        }
        return out;
    }
    function glPermSign(a) {
        const cycles = glPermCycles(a);
        let transpositions = 0;
        for (const c of cycles) transpositions += c.length - 1;
        return transpositions % 2 === 0 ? 1 : -1;
    }
    function glPermOrder(a) {
        const cycles = glPermCycles(a);
        if (!cycles.length) return 1;
        let l = 1;
        for (const c of cycles) l = l / glGcd(l, c.length) * c.length;
        return l;
    }
    function glPermFromCycles(cycles, n) {
        const out = [];
        for (let i = 0; i < n; i++) out.push(i);
        for (const c of cycles) {
            for (let i = 0; i < c.length; i++) out[c[i]] = c[(i + 1) % c.length];
        }
        return out;
    }

    // ======================================================================
    // МНОГОЧЛЕНЫ НАД ПОЛЕМ И КОНЕЧНЫЕ ПОЛЯ
    // Многочлен — массив коэффициентов от младшей степени: [a0, a1, a2, ...]
    // ======================================================================
    function glPolyTrim(p) {
        const out = p.slice();
        while (out.length > 1 && out[out.length - 1] === 0) out.pop();
        return out;
    }
    function glPolyAddMod(a, b, m) {
        const n = Math.max(a.length, b.length);
        const out = [];
        for (let i = 0; i < n; i++) out.push((((a[i] || 0) + (b[i] || 0)) % m + m) % m);
        return glPolyTrim(out);
    }
    function glPolyMulMod(a, b, m) {
        const out = new Array(a.length + b.length - 1).fill(0);
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b.length; j++) out[i + j] = (out[i + j] + a[i] * b[j]) % m;
        }
        return glPolyTrim(out.map(v => ((v % m) + m) % m));
    }
    function glPolyDivModP(a, b, m) {
        a = glPolyTrim(a.slice()); b = glPolyTrim(b);
        const q = new Array(Math.max(1, a.length - b.length + 1)).fill(0);
        const invLead = Number(glModInv(BigInt(b[b.length - 1]), BigInt(m)));
        while (a.length >= b.length && !(a.length === 1 && a[0] === 0)) {
            const d = a.length - b.length;
            const c = (a[a.length - 1] * invLead) % m;
            q[d] = c;
            for (let i = 0; i < b.length; i++) {
                a[d + i] = ((a[d + i] - c * b[i]) % m + m) % m;
            }
            a = glPolyTrim(a);
            if (a.length - 1 < b.length - 1) break;
        }
        return { q: glPolyTrim(q), r: glPolyTrim(a) };
    }
    function glPolyGcdMod(a, b, m) {
        a = glPolyTrim(a); b = glPolyTrim(b);
        while (!(b.length === 1 && b[0] === 0)) {
            const r = glPolyDivModP(a, b, m).r;
            a = b; b = r;
        }
        const lead = a[a.length - 1];
        if (lead !== 1 && lead !== 0) {
            const inv = Number(glModInv(BigInt(lead), BigInt(m)));
            a = a.map(c => (c * inv) % m);
        }
        return a;
    }
    function glPolyIsIrreducible(p, mod) {
        p = glPolyTrim(p);
        const deg = p.length - 1;
        if (deg <= 0) return false;
        if (deg === 1) return true;
        // x^(mod^k) - x должен быть взаимно прост с p для k < deg
        let xp = [0, 1];
        for (let k = 1; k <= Math.floor(deg / 2); k++) {
            let acc = [1];
            let base = xp.slice();
            let e = mod;
            while (e > 0) {
                if (e & 1) acc = glPolyDivModP(glPolyMulMod(acc, base, mod), p, mod).r;
                base = glPolyDivModP(glPolyMulMod(base, base, mod), p, mod).r;
                e >>= 1;
            }
            xp = acc;
            const diff = glPolyAddMod(xp, [0, mod - 1], mod);
            const g = glPolyGcdMod(p, diff, mod);
            if (!(g.length === 1)) return false;
        }
        return true;
    }
    // Конечное поле GF(p^n): элементы — многочлены степени < n по модулю неприводимого
    function glGaloisField(p, n) {
        p = Math.floor(Number(p)); n = Math.floor(Number(n || 1));
        let modPoly = null;
        if (n > 1) {
            const total = Math.pow(p, n);
            for (let code = 0; code < total * p; code++) {
                const c = [];
                let v = code;
                for (let i = 0; i < n; i++) { c.push(v % p); v = Math.floor(v / p); }
                c.push(1);
                if (glPolyIsIrreducible(c, p)) { modPoly = c; break; }
            }
            if (!modPoly) return null;
        }
        const els = [];
        const total = Math.pow(p, n);
        for (let code = 0; code < total; code++) {
            const c = [];
            let v = code;
            for (let i = 0; i < n; i++) { c.push(v % p); v = Math.floor(v / p); }
            els.push(glPolyTrim(c));
        }
        return {
            __type: 'field', p: p, n: n, modPoly: modPoly, els: els,
            add: (a, b) => glPolyAddMod(a, b, p),
            mul: (a, b) => n === 1 ? glPolyTrim([(a[0] * b[0]) % p])
                                   : glPolyDivModP(glPolyMulMod(a, b, p), modPoly, p).r,
            zero: [0], one: [1]
        };
    }
    function glFieldInv(F, a) {
        for (const x of F.els) {
            const pr = F.mul(a, x);
            if (pr.length === 1 && pr[0] === 1) return x;
        }
        return null;
    }
    // Круговой многочлен Φ_n через деление x^n - 1 на предыдущие
    function glCyclotomic(n) {
        n = Math.floor(Number(n));
        let num = new Array(n + 1).fill(0);
        num[0] = -1; num[n] = 1;
        for (let d = 1; d < n; d++) {
            if (n % d !== 0) continue;
            const div = glCyclotomic(d);
            num = glPolyDivExact(num, div);
        }
        return num;
    }
    function glPolyDivExact(a, b) {
        a = a.slice();
        const q = new Array(Math.max(1, a.length - b.length + 1)).fill(0);
        while (a.length >= b.length) {
            const d = a.length - b.length;
            const c = a[a.length - 1] / b[b.length - 1];
            q[d] = c;
            for (let i = 0; i < b.length; i++) a[d + i] -= c * b[i];
            while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-9) a.pop();
            if (a.length < b.length) break;
        }
        return q;
    }

    // ======================================================================
    // ТОЧНАЯ ЛИНЕЙНАЯ АЛГЕБРА НАД ℚ
    // ======================================================================
    function glRatMatrix(m) { return m.map(row => row.map(x => glToRat(x))); }
    function glRatMatToStr(m) { return m.map(row => row.map(glRatToString)); }
    // Приведение к ступенчатому виду: возвращает матрицу, ранг и опорные столбцы
    function glRatRref(mIn) {
        const m = glRatMatrix(mIn);
        const rows = m.length, cols = m[0].length;
        let r = 0;
        const pivots = [];
        for (let c = 0; c < cols && r < rows; c++) {
            let sel = -1;
            for (let i = r; i < rows; i++) if (m[i][c].n !== 0n) { sel = i; break; }
            if (sel === -1) continue;
            [m[r], m[sel]] = [m[sel], m[r]];
            const inv = glRatDiv(glRatMake(1n, 1n), m[r][c]);
            for (let j = c; j < cols; j++) m[r][j] = glRatMul(m[r][j], inv);
            for (let i = 0; i < rows; i++) {
                if (i === r || m[i][c].n === 0n) continue;
                const f = m[i][c];
                for (let j = c; j < cols; j++) m[i][j] = glRatSub(m[i][j], glRatMul(f, m[r][j]));
            }
            pivots.push(c);
            r++;
        }
        return { matrix: m, rank: r, pivots: pivots };
    }
    function glRatDet(mIn) {
        const m = glRatMatrix(mIn);
        const n = m.length;
        let det = glRatMake(1n, 1n);
        for (let c = 0; c < n; c++) {
            let sel = -1;
            for (let i = c; i < n; i++) if (m[i][c].n !== 0n) { sel = i; break; }
            if (sel === -1) return glRatMake(0n, 1n);
            if (sel !== c) { [m[c], m[sel]] = [m[sel], m[c]]; det = glRatMul(det, glRatMake(-1n, 1n)); }
            det = glRatMul(det, m[c][c]);
            const inv = glRatDiv(glRatMake(1n, 1n), m[c][c]);
            for (let i = c + 1; i < n; i++) {
                const f = glRatMul(m[i][c], inv);
                for (let j = c; j < n; j++) m[i][j] = glRatSub(m[i][j], glRatMul(f, m[c][j]));
            }
        }
        return det;
    }
    function glRatMatInv(mIn) {
        const n = mIn.length;
        const aug = glRatMatrix(mIn).map((row, i) => {
            const ext = row.slice();
            for (let j = 0; j < n; j++) ext.push(glRatMake(i === j ? 1n : 0n, 1n));
            return ext;
        });
        const res = glRatRref(aug);
        if (res.rank < n) return null; // вырожденная
        return res.matrix.map(row => row.slice(n));
    }
    function glRatNullspace(mIn) {
        const res = glRatRref(mIn);
        const cols = mIn[0].length;
        const pivotSet = {};
        for (const p of res.pivots) pivotSet[p] = true;
        const basis = [];
        for (let c = 0; c < cols; c++) {
            if (pivotSet[c]) continue;
            const v = new Array(cols).fill(null).map(() => glRatMake(0n, 1n));
            v[c] = glRatMake(1n, 1n);
            for (let i = 0; i < res.pivots.length; i++) {
                v[res.pivots[i]] = glRatMul(res.matrix[i][c], glRatMake(-1n, 1n));
            }
            basis.push(v);
        }
        return basis;
    }
    // Характеристический многочлен, метод Фаддеева–Леверье (точно, над ℚ)
    function glCharPoly(mIn) {
        const n = mIn.length;
        const A = glRatMatrix(mIn);
        const zero = () => {
            const z = [];
            for (let i = 0; i < n; i++) z.push(new Array(n).fill(null).map(() => glRatMake(0n, 1n)));
            return z;
        };
        const matmul = (X, Y) => {
            const out = zero();
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
                let s = glRatMake(0n, 1n);
                for (let k = 0; k < n; k++) s = glRatAdd(s, glRatMul(X[i][k], Y[k][j]));
                out[i][j] = s;
            }
            return out;
        };
        let M = zero();
        for (let i = 0; i < n; i++) M[i][i] = glRatMake(1n, 1n);
        const coeffs = [glRatMake(1n, 1n)];
        let Mk = M;
        for (let k = 1; k <= n; k++) {
            Mk = matmul(A, Mk);
            let tr = glRatMake(0n, 1n);
            for (let i = 0; i < n; i++) tr = glRatAdd(tr, Mk[i][i]);
            const c = glRatMul(tr, glRatMake(-1n, BigInt(k)));
            coeffs.push(c);
            for (let i = 0; i < n; i++) Mk[i][i] = glRatAdd(Mk[i][i], c);
        }
        return coeffs.reverse(); // от свободного члена к старшему
    }
    // Нормальная форма Смита над ℤ — основа вычисления гомологий
    function glSmithNormalForm(mIn) {
        const m = mIn.map(row => row.map(x => BigInt(Math.round(Number(x)))));
        const rows = m.length, cols = rows ? m[0].length : 0;
        const diag = [];
        let t = 0;
        while (t < rows && t < cols) {
            // ищем ненулевой минимальный по модулю опорный элемент
            let pi = -1, pj = -1, best = null;
            for (let i = t; i < rows; i++) for (let j = t; j < cols; j++) {
                const v = m[i][j] < 0n ? -m[i][j] : m[i][j];
                if (v !== 0n && (best === null || v < best)) { best = v; pi = i; pj = j; }
            }
            if (pi === -1) break;
            [m[t], m[pi]] = [m[pi], m[t]];
            for (let i = 0; i < rows; i++) { const tmp = m[i][t]; m[i][t] = m[i][pj]; m[i][pj] = tmp; }
            let done = false;
            while (!done) {
                done = true;
                for (let i = t + 1; i < rows; i++) {
                    if (m[i][t] === 0n) continue;
                    const q = m[i][t] / m[t][t];
                    for (let j = t; j < cols; j++) m[i][j] -= q * m[t][j];
                    if (m[i][t] !== 0n) { [m[t], m[i]] = [m[i], m[t]]; done = false; }
                }
                for (let j = t + 1; j < cols; j++) {
                    if (m[t][j] === 0n) continue;
                    const q = m[t][j] / m[t][t];
                    for (let i = t; i < rows; i++) m[i][j] -= q * m[i][t];
                    if (m[t][j] !== 0n) {
                        for (let i = 0; i < rows; i++) { const tmp = m[i][t]; m[i][t] = m[i][j]; m[i][j] = tmp; }
                        done = false;
                    }
                }
            }
            diag.push(m[t][t] < 0n ? -m[t][t] : m[t][t]);
            t++;
        }
        return diag;
    }

    // ======================================================================
    // СИМПЛИЦИАЛЬНЫЕ КОМПЛЕКСЫ И ГОМОЛОГИИ
    // Комплекс задаётся списком максимальных симплексов: [[0,1,2],[2,3]]
    // ======================================================================
    function glSimplexKey(s) { return s.slice().sort((a, b) => a - b).join(','); }
    function glComplexFaces(maximal) {
        const byDim = {};
        const seen = {};
        const addFace = (f) => {
            const k = glSimplexKey(f);
            if (seen[k]) return;
            seen[k] = true;
            const d = f.length - 1;
            if (!byDim[d]) byDim[d] = [];
            byDim[d].push(f.slice().sort((a, b) => a - b));
            if (f.length > 1) {
                for (let i = 0; i < f.length; i++) {
                    addFace(f.filter((_, j) => j !== i));
                }
            }
        };
        for (const s of maximal) addFace(s.slice().sort((a, b) => a - b));
        for (const d in byDim) byDim[d].sort((a, b) => glSimplexKey(a) < glSimplexKey(b) ? -1 : 1);
        return byDim;
    }
    // Матрица границы ∂_k: из k-мерных симплексов в (k-1)-мерные
    function glBoundaryMatrix(byDim, k) {
        const src2 = byDim[k] || [], dst = byDim[k - 1] || [];
        const idx = {};
        for (let i = 0; i < dst.length; i++) idx[glSimplexKey(dst[i])] = i;
        const m = [];
        for (let i = 0; i < dst.length; i++) m.push(new Array(src2.length).fill(0));
        for (let j = 0; j < src2.length; j++) {
            const s = src2[j];
            for (let i = 0; i < s.length; i++) {
                const face = s.filter((_, t) => t !== i);
                const r = idx[glSimplexKey(face)];
                if (r !== undefined) m[r][j] = (i % 2 === 0) ? 1 : -1;
            }
        }
        return m;
    }
    function glMatRankInt(m) {
        if (!m.length || !m[0].length) return 0;
        return glSmithNormalForm(m).filter(d => d !== 0n).length;
    }
    // Числа Бетти: b_k = dim ker ∂_k - rank ∂_{k+1}
    function glBettiNumbers(maximal) {
        const byDim = glComplexFaces(maximal);
        const dims = Object.keys(byDim).map(Number).sort((a, b) => a - b);
        const maxDim = dims.length ? dims[dims.length - 1] : 0;
        const rank = {};
        for (let k = 1; k <= maxDim + 1; k++) {
            const bm = glBoundaryMatrix(byDim, k);
            rank[k] = (bm.length && bm[0].length) ? glMatRankInt(bm) : 0;
        }
        const betti = [];
        for (let k = 0; k <= maxDim; k++) {
            const nk = (byDim[k] || []).length;
            const kerDim = nk - (rank[k + 1 - 1 + 1] !== undefined ? 0 : 0) - (rank[k] || 0);
            betti.push(nk - (rank[k] || 0) - (rank[k + 1] || 0));
        }
        return betti;
    }
    function glEulerCharacteristic(maximal) {
        const byDim = glComplexFaces(maximal);
        let chi = 0;
        for (const d in byDim) chi += (Number(d) % 2 === 0 ? 1 : -1) * byDim[d].length;
        return chi;
    }
    // Полные группы гомологий H_k = Z^{betti_k} ⊕ (кручение), k = 0..maxDim.
    // Свободный ранг betti_k = n_k - rank(∂_k) - rank(∂_{k+1}), как и в glBettiNumbers.
    // Кручение H_k — это диагональные элементы нормальной формы Смита матрицы ∂_{k+1},
    // которые строго больше 1 (единичные множители дают тривиальные, "невидимые" слагаемые
    // Z/1Z = 0 и потому отбрасываются). Именно эта информация терялась в glBettiNumbers,
    // где от SNF бралось только количество ненулевых диагональных элементов (ранг).
    function glHomologyGroups(maximal) {
        const byDim = glComplexFaces(maximal);
        const dims = Object.keys(byDim).map(Number).sort((a, b) => a - b);
        const maxDim = dims.length ? dims[dims.length - 1] : 0;
        const snfDiag = {}, rank = {};
        for (let k = 1; k <= maxDim + 1; k++) {
            const bm = glBoundaryMatrix(byDim, k);
            if (bm.length && bm[0].length) {
                const diag = glSmithNormalForm(bm);
                snfDiag[k] = diag;
                rank[k] = diag.filter(d => d !== 0n).length;
            } else { snfDiag[k] = []; rank[k] = 0; }
        }
        const result = [];
        for (let k = 0; k <= maxDim; k++) {
            const nk = (byDim[k] || []).length;
            const betti = nk - (rank[k] || 0) - (rank[k + 1] || 0);
            const torsion = (snfDiag[k + 1] || []).filter(d => d > 1n).map(d => d.toString());
            result.push({ dim: k, betti: betti, torsion: torsion });
        }
        return result;
    }

    // ======================================================================
    // ЧАСТИЧНО УПОРЯДОЧЕННЫЕ МНОЖЕСТВА И РЕШЁТКИ
    // ======================================================================
    function glMakePoset(els, leq) {
        return { __type: 'poset', els: els, leq: leq };
    }
    function glDivisorLattice(n) {
        const ds = glDivisors(Number(n));
        return glMakePoset(ds, (a, b) => b % a === 0);
    }
    function glSubsetLattice(n) {
        const base = [];
        for (let i = 0; i < n; i++) base.push(i);
        const els = glPowerSet(base);
        return glMakePoset(els, (a, b) => a.every(x => b.indexOf(x) !== -1));
    }
    // Диаграмма Хассе: только покрывающие отношения, сразу как граф
    function glPosetHasse(p) {
        const graph = { __type: 'graph', nodes: {}, edges: [] };
        const lbl = (x) => Array.isArray(x) ? ('{' + x.join(',') + '}') : String(x);
        for (const e of p.els) graph.nodes[lbl(e)] = { label: lbl(e), pos: [0, 0] };
        for (const a of p.els) {
            for (const b of p.els) {
                if (glGKey(a) === glGKey(b) || !p.leq(a, b)) continue;
                let covers = true;
                for (const c of p.els) {
                    if (glGKey(c) === glGKey(a) || glGKey(c) === glGKey(b)) continue;
                    if (p.leq(a, c) && p.leq(c, b)) { covers = false; break; }
                }
                if (covers) graph.edges.push({ a: lbl(a), b: lbl(b), weight: 1 });
            }
        }
        return graph;
    }
    function glPosetJoin(p, a, b) {
        const ups = p.els.filter(x => p.leq(a, x) && p.leq(b, x));
        for (const u of ups) if (ups.every(v => p.leq(u, v))) return u;
        return null;
    }
    function glPosetMeet(p, a, b) {
        const downs = p.els.filter(x => p.leq(x, a) && p.leq(x, b));
        for (const d of downs) if (downs.every(v => p.leq(v, d))) return d;
        return null;
    }
    function glPosetIsLattice(p) {
        for (const a of p.els) for (const b of p.els) {
            if (glPosetJoin(p, a, b) === null || glPosetMeet(p, a, b) === null) return false;
        }
        return true;
    }
    // Слоистая раскладка ЧУМ по длине максимальной цепи снизу
    function glPosetRank(p, x) {
        let best = 0;
        for (const y of p.els) {
            if (glGKey(y) === glGKey(x) || !p.leq(y, x)) continue;
            best = Math.max(best, glPosetRank(p, y) + 1);
        }
        return best;
    }

    function glMatVecMul(m, v) { return m.map(row => row.reduce((s, x, i) => s + x * v[i], 0)); }
    function glMatMatMul(m1, m2) {
        const rows = m1.length, inner = m2.length, cols = m2[0].length;
        const out = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) { let s = 0; for (let k = 0; k < inner; k++) s += m1[i][k] * m2[k][j]; row.push(s); }
            out.push(row);
        }
        return out;
    }

    // ---- Подгонка кривых по точкам ----
    function glSolveLinear(M, rhs) {
        // Метод Гаусса с выбором ведущего элемента. M — n×n, rhs — n. Возвращает решение или null, если система вырождена.
        const n = rhs.length;
        const A = M.map((row, i) => row.slice().concat(rhs[i]));
        for (let col = 0; col < n; col++) {
            let piv = col;
            for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
            if (Math.abs(A[piv][col]) < 1e-10) return null;
            const tmp = A[col]; A[col] = A[piv]; A[piv] = tmp;
            for (let r = 0; r < n; r++) {
                if (r === col) continue;
                const factor = A[r][col] / A[col][col];
                for (let c = col; c <= n; c++) A[r][c] -= factor * A[col][c];
            }
        }
        return A.map((row, i) => row[n] / row[i]);
    }
    function glFitEllipse5(pts) {
        // Общее уравнение конического сечения Ax²+Bxy+Cy²+Dx+Ey+F=0, нормировка F=-1 (5 точек -> 5 уравнений на A..E)
        if (!pts || pts.length !== 5) return null;
        const M = pts.map(p => [p.x * p.x, p.x * p.y, p.y * p.y, p.x, p.y]);
        const sol = glSolveLinear(M, [1, 1, 1, 1, 1]);
        if (!sol) return null;
        const [A, B, C, D, E] = sol;
        const F = -1;
        const centerSol = glSolveLinear([[2 * A, B], [B, 2 * C]], [-D, -E]);
        if (!centerSol) return null;
        const [cx, cy] = centerSol;
        const F0 = A * cx * cx + B * cx * cy + C * cy * cy + D * cx + E * cy + F;
        const theta = 0.5 * Math.atan2(B, A - C);
        const cs = Math.cos(theta), sn = Math.sin(theta);
        const Ap = A * cs * cs + B * cs * sn + C * sn * sn;
        const Cp = A * sn * sn - B * cs * sn + C * cs * cs;
        const aSq = -F0 / Ap, bSq = -F0 / Cp;
        if (!(aSq > 1e-9) || !(bSq > 1e-9)) return null; // не эллипс (гипербола/вырождение при этих 5 точках)
        return { cx, cy, a: Math.sqrt(aSq), b: Math.sqrt(bSq), rotateDeg: theta * 180 / Math.PI };
    }
    function glCircumcircle(p1, p2, p3) {
        // Центр и радиус окружности, проходящей через три точки
        const ax = p1.x, ay = p1.y, bx = p2.x, by = p2.y, cx = p3.x, cy = p3.y;
        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 1e-9) return null; // три точки на одной прямой
        const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
        const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
        return { cx: ux, cy: uy, r: Math.hypot(ax - ux, ay - uy) };
    }

    // ---- Геометрия пересечений (Задача 1) ----
    function glLineLineIntersect(l1, l2) {
        const p1 = l1.pA.pos, p2 = l1.pB.pos, p3 = l2.pA.pos, p4 = l2.pB.pos;
        const d1x = p2.x - p1.x, d1y = p2.y - p1.y, d2x = p4.x - p3.x, d2y = p4.y - p3.y;
        const denom = d1x * d2y - d1y * d2x;
        if (Math.abs(denom) < 1e-12) return null;
        const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
        return { x: p1.x + d1x * t, y: p1.y + d1y * t };
    }
    function glLineCircleIntersect(line, circle) {
        const A = line.pA.pos, B = line.pB.pos;
        const cx = circle.center.x, cy = circle.center.y, r = circle.radius;
        const dx = B.x - A.x, dy = B.y - A.y;
        const fx = A.x - cx, fy = A.y - cy;
        const a = dx * dx + dy * dy, b = 2 * (fx * dx + fy * dy), c = fx * fx + fy * fy - r * r;
        if (a < 1e-12) return [];
        const disc = b * b - 4 * a * c;
        if (disc < 0) return [];
        const sq = Math.sqrt(disc);
        const pts = [], seen = new Set();
        for (const t of [(-b - sq) / (2 * a), (-b + sq) / (2 * a)]) {
            const key = t.toFixed(9); if (seen.has(key)) continue; seen.add(key);
            pts.push({ x: A.x + dx * t, y: A.y + dy * t });
        }
        return pts;
    }
    function glCircleCircleIntersect(c1, c2) {
        const x1 = c1.center.x, y1 = c1.center.y, r1 = c1.radius;
        const x2 = c2.center.x, y2 = c2.center.y, r2 = c2.radius;
        const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
        if (d < 1e-9 || d > r1 + r2 || d < Math.abs(r1 - r2)) return [];
        const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
        const hSq = r1 * r1 - a * a;
        const h = hSq > 0 ? Math.sqrt(hSq) : 0;
        const xm = x1 + a * dx / d, ym = y1 + a * dy / d;
        const p1 = { x: xm + h * dy / d, y: ym - h * dx / d };
        const p2 = { x: xm - h * dy / d, y: ym + h * dx / d };
        return h < 1e-9 ? [p1] : [p1, p2];
    }
    function glEllipseToLocal(ellipse, p) {
        const cx = ellipse.centerPoint.pos.x, cy = ellipse.centerPoint.pos.y;
        const rot = (ellipse.rotate || 0) * Math.PI / 180;
        const cs = Math.cos(-rot), sn = Math.sin(-rot);
        const dx = p.x - cx, dy = p.y - cy;
        return { x: dx * cs - dy * sn, y: dx * sn + dy * cs };
    }
    function glEllipseFromLocal(ellipse, lp) {
        const cx = ellipse.centerPoint.pos.x, cy = ellipse.centerPoint.pos.y;
        const rot = (ellipse.rotate || 0) * Math.PI / 180;
        const cs = Math.cos(rot), sn = Math.sin(rot);
        return { x: cx + lp.x * cs - lp.y * sn, y: cy + lp.x * sn + lp.y * cs };
    }
    function glLineEllipseIntersect(line, ellipse) {
        const a0 = glEllipseToLocal(ellipse, line.pA.pos), b0 = glEllipseToLocal(ellipse, line.pB.pos);
        const dx = b0.x - a0.x, dy = b0.y - a0.y;
        const a = ellipse.a || 1, b = ellipse.b || 1;
        const A2 = (dx * dx) / (a * a) + (dy * dy) / (b * b);
        const B2 = 2 * (a0.x * dx) / (a * a) + 2 * (a0.y * dy) / (b * b);
        const C2 = (a0.x * a0.x) / (a * a) + (a0.y * a0.y) / (b * b) - 1;
        if (A2 < 1e-12) return [];
        const disc = B2 * B2 - 4 * A2 * C2;
        if (disc < 0) return [];
        const sq = Math.sqrt(disc);
        const pts = [], seen = new Set();
        for (const t of [(-B2 - sq) / (2 * A2), (-B2 + sq) / (2 * A2)]) {
            const key = t.toFixed(9); if (seen.has(key)) continue; seen.add(key);
            pts.push(glEllipseFromLocal(ellipse, { x: a0.x + t * dx, y: a0.y + t * dy }));
        }
        return pts;
    }
    function glEllipseImplicit(ellipse, pt) {
        const lp = glEllipseToLocal(ellipse, pt);
        const a = ellipse.a || 1, b = ellipse.b || 1;
        return (lp.x * lp.x) / (a * a) + (lp.y * lp.y) / (b * b) - 1;
    }
    function glEllipseBoundaryPoint(ellipse, theta) {
        const a = ellipse.a || 1, b = ellipse.b || 1;
        return glEllipseFromLocal(ellipse, { x: a * Math.cos(theta), y: b * Math.sin(theta) });
    }
    function glEllipseEllipseIntersect(e1, e2) {
        // Численно: сэмплируем контур e1, ищем смену знака неявной функции e2, уточняем бисекцией
        const N = 720;
        const pts = [];
        let prevTheta = 0, prevVal = glEllipseImplicit(e2, glEllipseBoundaryPoint(e1, 0));
        for (let i = 1; i <= N; i++) {
            const theta = (i / N) * 2 * Math.PI;
            const val = glEllipseImplicit(e2, glEllipseBoundaryPoint(e1, theta));
            if ((prevVal <= 0 && val > 0) || (prevVal >= 0 && val < 0)) {
                let lo = prevTheta, hi = theta;
                for (let k = 0; k < 40; k++) {
                    const mid = (lo + hi) / 2;
                    const mv = glEllipseImplicit(e2, glEllipseBoundaryPoint(e1, mid));
                    if ((mv > 0) === (val > 0)) hi = mid; else lo = mid;
                }
                pts.push(glEllipseBoundaryPoint(e1, (lo + hi) / 2));
            }
            prevTheta = theta; prevVal = val;
        }
        return pts.slice(0, 4);
    }
    function glIntersection(type, n1, n2) {
        const o1 = (typeof n1 === 'string') ? window[n1] : n1;
        const o2 = (typeof n2 === 'string') ? window[n2] : n2;
        if (!o1 || !o2) return type === 'lines' ? null : [];
        if (type === 'lines') return glLineLineIntersect(o1, o2);
        if (type === 'line_circle') return glLineCircleIntersect(o1, o2);
        if (type === 'circles') return glCircleCircleIntersect(o1, o2);
        if (type === 'line_ellipse') return glLineEllipseIntersect(o1, o2);
        if (type === 'ellipse_ellipse') return glEllipseEllipseIntersect(o1, o2);
        throw new Error('Неизвестный тип пересечения: ' + type);
    }

    function glTokenize(src) {
        const toks = []; let i = 0; const n = src.length;
        while (i < n) {
            const c = src[i];
            if (c === ' ' || c === '\\t' || c === '\\n' || c === '\\r') { i++; continue; }
            if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\\n') i++; continue; }
            if (c === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
            if (c === '"' || c === "'") {
                const quote = c; let j = i + 1; let str = '';
                while (j < n && src[j] !== quote) { if (src[j] === '\\\\' && j + 1 < n) { str += src[j + 1]; j += 2; } else { str += src[j]; j++; } }
                toks.push({ type: 'string', value: str }); i = j + 1; continue;
            }
            if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
                let j = i; while (j < n && /[0-9.]/.test(src[j])) j++;
                if ((src[j] === 'e' || src[j] === 'E') && /[0-9+\-]/.test(src[j + 1] || '')) {
                    j++;
                    if (src[j] === '+' || src[j] === '-') j++;
                    while (j < n && /[0-9]/.test(src[j])) j++;
                }
                toks.push({ type: 'number', value: parseFloat(src.slice(i, j)) }); i = j; continue;
            }
            if (/[a-zA-Z_]/.test(c)) {
                let j = i; while (j < n && /[a-zA-Z0-9_]/.test(src[j])) j++;
                toks.push({ type: 'ident', value: src.slice(i, j) }); i = j; continue;
            }
            const two = src.substr(i, 2);
            if (['==', '!=', '<=', '>=', '&&', '||', '+=', '-=', '*=', '/='].includes(two)) { toks.push({ type: 'op', value: two }); i += 2; continue; }
            if ('+-*/%^(){}[].,;=<>!#?:'.includes(c)) { toks.push({ type: 'op', value: c }); i++; continue; }
            i++;
        }
        toks.push({ type: 'eof', value: null });
        return toks;
    }

    function glCreateParser(tokens) {
        let pos = 0;
        const peek = () => tokens[pos];
        const next = () => tokens[pos++];
        const atOp = (v) => { const t = peek(); return t.type === 'op' && t.value === v; };
        const atIdent = (v) => { const t = peek(); return t.type === 'ident' && t.value === v; };
        function expectOp(v) { const t = next(); if (t.type !== 'op' || t.value !== v) throw new Error('Ожидался "' + v + '"'); }

        function parseProgram() { const s = []; while (peek().type !== 'eof') { if (atOp(';')) { next(); continue; } s.push(parseStatement()); } return s; }
        function parseBlock() { expectOp('{'); const s = []; while (!atOp('}')) { if (atOp(';')) { next(); continue; } s.push(parseStatement()); } expectOp('}'); return s; }
        function parsePath() {
            const t = next(); if (t.type !== 'ident') throw new Error('Ожидался идентификатор');
            const parts = [t.value];
            while (atOp('.')) { next(); const p = next(); if (p.type !== 'ident') throw new Error('Ожидалось имя поля после "."'); parts.push(p.value); }
            return parts;
        }
        function parseStatement() {
            if (atIdent('if')) {
                next(); expectOp('('); const cond = parseExpr(); expectOp(')');
                const thenB = parseBlock(); let elseB = null;
                if (atIdent('else')) { next(); elseB = parseBlock(); }
                return { type: 'if', cond, thenB, elseB };
            }
            if (atIdent('repeat')) {
                next(); expectOp('('); const count = parseExpr(); expectOp(')');
                return { type: 'repeat', count, body: parseBlock() };
            }
            if (atIdent('for')) {
                next(); expectOp('(');
                const varTok = next(); if (varTok.type !== 'ident') throw new Error('Ожидался идентификатор после "for ("');
                if (!atIdent('in')) throw new Error('Ожидалось "in" в цикле for');
                next();
                const coll = parseExpr();
                expectOp(')');
                return { type: 'forEach', varName: varTok.value, coll, body: parseBlock() };
            }
            if (atIdent('wait')) {
                next(); expectOp('('); const arg = parseExpr(); expectOp(')'); if (atOp(';')) next();
                return { type: 'wait', arg };
            }
            if (atIdent('return')) {
                next();
                let expr = null;
                if (!atOp(';') && peek().type !== 'eof' && !atOp('}')) expr = parseExpr();
                if (atOp(';')) next();
                return { type: 'return', expr };
            }
            if (atIdent('func')) {
                next();
                const nameTok = next(); if (nameTok.type !== 'ident') throw new Error('Ожидалось имя функции после "func"');
                expectOp('(');
                const params = [];
                if (!atOp(')')) {
                    const p0 = next(); if (p0.type !== 'ident') throw new Error('Ожидалось имя параметра'); params.push(p0.value);
                    while (atOp(',')) { next(); const p = next(); if (p.type !== 'ident') throw new Error('Ожидалось имя параметра'); params.push(p.value); }
                }
                expectOp(')');
                const eqTok = next(); if (eqTok.type !== 'op' || eqTok.value !== '=') throw new Error('Ожидался "=" в определении функции');
                const body = parseExpr(); if (atOp(';')) next();
                return { type: 'funcDef', name: nameTok.value, params, body };
            }
            if (atIdent('set') || atIdent('vector') || atIdent('matrix') || atIdent('graph') || atIdent('complex')) {
                next(); const path = parsePath(); const t = next();
                if (t.type !== 'op' || !['=', '+=', '-=', '*=', '/='].includes(t.value)) throw new Error('Ожидался оператор присваивания');
                const expr = parseExpr(); if (atOp(';')) next();
                return { type: 'assign', path, op: t.value, expr };
            }
            const startPos = pos;
            try {
                const path = parsePath();
                if (peek().type === 'op' && ['=', '+=', '-=', '*=', '/='].includes(peek().value)) {
                    const t = next(); const expr = parseExpr(); if (atOp(';')) next();
                    return { type: 'assign', path, op: t.value, expr };
                }
                pos = startPos;
            } catch (e) { pos = startPos; }
            const expr = parseExpr(); if (atOp(';')) next();
            return { type: 'expr', expr };
        }
        function parseExpr() {
            const cond = parseOr();
            if (atOp('?')) {
                next();
                const a = parseExpr();
                expectOp(':');
                const b = parseExpr();
                return { type: 'ternary', cond, a, b };
            }
            return cond;
        }
        function parseOr() { let l = parseAnd(); while (atOp('||')) { next(); l = { type: 'logic', op: '||', l, r: parseAnd() }; } return l; }
        function parseAnd() { let l = parseEquality(); while (atOp('&&')) { next(); l = { type: 'logic', op: '&&', l, r: parseEquality() }; } return l; }
        function parseEquality() { let l = parseRelational(); while (atOp('==') || atOp('!=')) { const op = next().value; l = { type: 'cmp', op, l, r: parseRelational() }; } return l; }
        function parseRelational() { let l = parseAdditive(); while (atOp('<') || atOp('>') || atOp('<=') || atOp('>=')) { const op = next().value; l = { type: 'cmp', op, l, r: parseAdditive() }; } return l; }
        function parseAdditive() { let l = parseMultiplicative(); while (atOp('+') || atOp('-')) { const op = next().value; l = { type: 'bin', op, l, r: parseMultiplicative() }; } return l; }
        function parseMultiplicative() { let l = parseUnary(); while (atOp('*') || atOp('/') || atOp('%')) { const op = next().value; l = { type: 'bin', op, l, r: parseUnary() }; } return l; }
        function parseUnary() {
            if (atOp('-')) { next(); return { type: 'neg', expr: parseUnary() }; }
            if (atOp('!')) { next(); return { type: 'not', expr: parseUnary() }; }
            return parsePower();
        }
        function parsePower() {
            const base = parsePostfix();
            if (atOp('^')) { next(); const exp = parseUnary(); return { type: 'pow', base, exp }; }
            return base;
        }
        function parsePostfix() {
            let e = parsePrimary();
            while (true) {
                if (atOp('.')) { next(); const p = next(); if (p.type !== 'ident') throw new Error('Ожидалось имя поля'); e = { type: 'member', obj: e, prop: p.value }; }
                else if (atOp('[')) { next(); const idx = parseExpr(); expectOp(']'); e = { type: 'index', obj: e, idx }; }
                else break;
            }
            return e;
        }
        function parsePrimary() {
            const t = peek();
            if (t.type === 'number') { next(); return { type: 'num', value: t.value }; }
            if (t.type === 'string') { next(); return { type: 'str', value: t.value }; }
            if (atOp('#')) {
                next(); let hex = '#'; while (peek().type === 'ident' || peek().type === 'number') { hex += String(next().value); }
                return { type: 'str', value: hex };
            }
            if (atOp('[')) {
                next(); const items = [];
                if (!atOp(']')) { items.push(parseExpr()); while (atOp(',')) { next(); items.push(parseExpr()); } }
                expectOp(']');
                return { type: 'array', items };
            }
            if (atOp('(')) { next(); const e = parseExpr(); expectOp(')'); return e; }
            if (t.type === 'ident') {
                next();
                if (t.value === 'true') return { type: 'bool', value: true };
                if (t.value === 'false') return { type: 'bool', value: false };
                if (t.value === 'null') return { type: 'null' };
                if (atOp('(')) {
                    next(); const args = [];
                    if (!atOp(')')) { args.push(parseExpr()); while (atOp(',')) { next(); args.push(parseExpr()); } }
                    expectOp(')');
                    return { type: 'call', name: t.value, args };
                }
                return { type: 'ident', name: t.value };
            }
            throw new Error('Неожиданный токен в выражении');
        }
        return { parseProgram, parseExpr };
    }

    function glParseProgram(src) { return glCreateParser(glTokenize(src)).parseProgram(); }
    function glParseExprOnly(src) { return glCreateParser(glTokenize(src)).parseExpr(); }

    // Задача 1: пользовательские функции func f(x) = ...;
    const GL_USER_FUNCS = {};
    let glUserFuncVersion = 0;
    let glLocusSweeping = false; // во время обхода ГМТ следы не накапливаются
    function glCallUserFunc(name, args) {
        const fn = GL_USER_FUNCS[name];
        if (!fn) throw new Error('Неизвестная функция: ' + name);
        const localCtx = { time: elapsedTime };
        fn.params.forEach((p, i) => { localCtx[p] = args[i]; });
        if (fn.bodyStmts) {
            // Function/Void: многострочное тело со statements; возврат значения — через
            // исключение GLReturnSignal (перехватывается здесь же). Void без явного
            // return просто возвращает undefined — как и положено процедуре.
            try { glExecStatementsSync(fn.bodyStmts, localCtx); }
            catch (e) { if (e instanceof GLReturnSignal) return e.value; throw e; }
            return undefined;
        }
        return glEvalExpr(fn.bodyAst, localCtx);
    }
    function glMakeFuncWrapper(name) { return (...args) => glCallUserFunc(name, args); }
    function initUserFuncs() {
        for (let f of funcsData) {
            try {
                GL_USER_FUNCS[f.name] = { params: f.params, bodyAst: glParseExprOnly(f.bodyExpr) };
            } catch (e) {
                glLog(\'warn\', 'Ошибка в определении функции "' + f.name + '": ' + e.message);
            }
        }
        // Function/Void — полноценные многострочные функции/процедуры.
        for (let p of (typeof procsData !== 'undefined' ? procsData : [])) {
            try {
                GL_USER_FUNCS[p.name] = { params: p.params, bodyStmts: glParseProgram(p.body), isVoid: p.isVoid };
            } catch (e) {
                glLog(\'warn\', 'Ошибка в определении ' + (p.isVoid ? 'Void' : 'Function') + ' "' + p.name + '": ' + e.message);
            }
        }
    }

    function glEvalExpr(node, ctx) {
        switch (node.type) {
            case 'num': case 'str': case 'bool': return node.value;
            case 'null': return null;
            case 'array': return node.items.map(it => glEvalExpr(it, ctx));
            case 'ternary':
                return glEvalExpr(node.cond, ctx) ? glEvalExpr(node.a, ctx) : glEvalExpr(node.b, ctx);
            case 'ident':
                if (node.name in ctx) return ctx[node.name];
                if (GL_USER_FUNCS[node.name]) return glMakeFuncWrapper(node.name);
                if (window[node.name] !== undefined) return window[node.name];
                // математические константы (пользовательские set pi = ... имеют приоритет через window)
                if (node.name === 'pi' || node.name === 'PI') return Math.PI;
                if (node.name === 'tau') return 2 * Math.PI;
                if (node.name === 'E') return Math.E;
                if (node.name === 'i') return glComplex(0, 1);
                if (node.name === 'infinity' || node.name === 'Infinity') return Infinity;
                throw new Error('Неизвестный идентификатор: ' + node.name);
            case 'member': {
                const obj = glEvalExpr(node.obj, ctx);
                if (obj === undefined || obj === null) throw new Error('Обращение к полю "' + node.prop + '" у пустого значения');
                return obj[node.prop];
            }
            case 'index': {
                const obj = glEvalExpr(node.obj, ctx);
                const idx = glEvalExpr(node.idx, ctx);
                if (obj === undefined || obj === null) throw new Error('Индексация пустого значения');
                return obj[idx];
            }
            case 'call': {
                if (node.name === 'intersection') {
                    const args = node.args.map(a => glEvalExpr(a, ctx));
                    return glIntersection(args[0], args[1], args[2]);
                }
                if (node.name === 'filter') {
                    const arr = glEvalExpr(node.args[0], ctx);
                    const condStr = glEvalExpr(node.args[1], ctx);
                    const condAst = glParseExprOnly(String(condStr));
                    return arr.filter(it => glEvalExpr(condAst, Object.assign({}, ctx, { it })));
                }
                if (GL_USER_FUNCS[node.name]) {
                    return glCallUserFunc(node.name, node.args.map(a => glEvalExpr(a, ctx)));
                }
                const fn = GL_BUILTINS[node.name];
                if (fn) return fn(...node.args.map(a => glEvalExpr(a, ctx)));
                // значение-функция, сохранённое через set/vector (например, результат interpolate())
                const stored = (node.name in ctx) ? ctx[node.name] : window[node.name];
                if (typeof stored === 'function') return stored(...node.args.map(a => glEvalExpr(a, ctx)));
                throw new Error('Неизвестная функция: ' + node.name);
            }
            case 'neg': {
                const v = glEvalExpr(node.expr, ctx);
                if (glIsComplex(v)) return glComplex(-v.re, -v.im);
                if (Array.isArray(v)) return v.map(x => Array.isArray(x) ? x.map(y => -y) : -x);
                return -v;
            }
            case 'pow': {
                const b = glEvalExpr(node.base, ctx), e = glEvalExpr(node.exp, ctx);
                if (glIsComplex(b) || glIsComplex(e)) return glComplexPow(b, e);
                if (glIsRat(b)) return glRatPow(b, glIsRat(e) ? glRatToNumber(e) : Number(e));
                if (typeof b === 'bigint') {
                    const k = typeof e === 'bigint' ? e : BigInt(Math.round(Number(e)));
                    if (k >= 0n) { let acc = 1n; for (let i = 0n; i < k; i++) acc *= b; return acc; }
                    return glRatPow(glRatMake(b, 1n), Number(k));
                }
                return Math.pow(b, e);
            }
            case 'not': return !glEvalExpr(node.expr, ctx);
            case 'bin': {
                const l = glEvalExpr(node.l, ctx), r = glEvalExpr(node.r, ctx);
                return glBinaryOp(l, r, node.op);
            }
            case 'cmp': {
                const l = glEvalExpr(node.l, ctx), r = glEvalExpr(node.r, ctx);
                if (glIsComplex(l) || glIsComplex(r)) {
                    const lc = glToComplex(l), rc = glToComplex(r);
                    const eq = Math.abs(lc.re - rc.re) < 1e-9 && Math.abs(lc.im - rc.im) < 1e-9;
                    if (node.op === '==') return eq; if (node.op === '!=') return !eq;
                    throw new Error('Операция "' + node.op + '" не поддерживается для complex');
                }
                // Точные дроби и большие целые сравниваются без приведения к float
                if (glIsRat(l) || glIsRat(r)) {
                    const c = glRatCmp(l, r);
                    if (node.op === '==') return c === 0; if (node.op === '!=') return c !== 0;
                    if (node.op === '<') return c < 0; if (node.op === '>') return c > 0;
                    if (node.op === '<=') return c <= 0; return c >= 0;
                }
                if (typeof l === 'bigint' || typeof r === 'bigint') {
                    const lb = typeof l === 'bigint' ? l : BigInt(Math.round(Number(l)));
                    const rb = typeof r === 'bigint' ? r : BigInt(Math.round(Number(r)));
                    if (node.op === '==') return lb === rb; if (node.op === '!=') return lb !== rb;
                    if (node.op === '<') return lb < rb; if (node.op === '>') return lb > rb;
                    if (node.op === '<=') return lb <= rb; return lb >= rb;
                }
                if (node.op === '==') return l === r; if (node.op === '!=') return l !== r;
                if (node.op === '<') return l < r; if (node.op === '>') return l > r;
                if (node.op === '<=') return l <= r; return l >= r;
            }
            case 'logic':
                return node.op === '&&' ? (glEvalExpr(node.l, ctx) && glEvalExpr(node.r, ctx)) : (glEvalExpr(node.l, ctx) || glEvalExpr(node.r, ctx));
        }
        throw new Error('Неизвестный узел выражения');
    }

    function glBinaryOp(l, r, op) {
        // Точные дроби: если хоть один операнд рациональный, считаем без потери точности
        if (glIsRat(l) || glIsRat(r)) {
            const bothOk = (v) => glIsRat(v) || typeof v === 'bigint' ||
                (typeof v === 'number' && isFinite(v));
            if (bothOk(l) && bothOk(r)) {
                if (op === '+') return glRatAdd(l, r);
                if (op === '-') return glRatSub(l, r);
                if (op === '*') return glRatMul(l, r);
                if (op === '/') return glRatDiv(l, r);
                if (op === '^') return glRatPow(l, glIsRat(r) ? glRatToNumber(r) : Number(r));
                if (op === '%') {
                    const a = glToRat(l), b = glToRat(r);
                    return glRatSub(a, glRatMul(b, glRatMake(BigInt(Math.floor(glRatToNumber(glRatDiv(a, b)))), 1n)));
                }
            }
        }
        if (typeof l === 'bigint' && typeof r === 'bigint') {
            if (op === '+') return l + r; if (op === '-') return l - r;
            if (op === '*') return l * r;
            if (op === '/') return (l % r === 0n) ? l / r : glRatMake(l, r);
            if (op === '%') return ((l % r) + r) % r;
            if (op === '^') { let acc = 1n; for (let i = 0n; i < r; i++) acc *= l; return acc; }
        }
        if (typeof l === 'bigint' && typeof r === 'number' && Number.isInteger(r)) return glBinaryOp(l, BigInt(r), op);
        if (typeof r === 'bigint' && typeof l === 'number' && Number.isInteger(l)) return glBinaryOp(BigInt(l), r, op);
        if (typeof l === 'number' && typeof r === 'number') {
            if (op === '+') return l + r; if (op === '-') return l - r;
            if (op === '*') return l * r; if (op === '/') return l / r;
            if (op === '^') return Math.pow(l, r);
            return l % r;
        }
        if (glIsComplex(l) || glIsComplex(r)) {
            if (op === '+') return glComplexAdd(l, r);
            if (op === '-') return glComplexSub(l, r);
            if (op === '*') return glComplexMul(l, r);
            if (op === '/') return glComplexDiv(l, r);
            if (op === '^') return glComplexPow(l, r);
            throw new Error('Операция "' + op + '" не поддерживается для complex');
        }
        if (op === '+' && (glIsVec(l) || glIsMat(l))) return glElementwise(l, r, (a, b) => a + b);
        if (op === '-' && (glIsVec(l) || glIsMat(l))) return glElementwise(l, r, (a, b) => a - b);
        if (op === '*') {
            if (typeof l === 'number' && (glIsVec(r) || glIsMat(r))) return glIsMat(r) ? r.map(row => row.map(x => x * l)) : r.map(x => x * l);
            if (typeof r === 'number' && (glIsVec(l) || glIsMat(l))) return glIsMat(l) ? l.map(row => row.map(x => x * r)) : l.map(x => x * r);
            if (glIsMat(l) && glIsVec(r)) return glMatVecMul(l, r);
            if (glIsMat(l) && glIsMat(r)) return glMatMatMul(l, r);
        }
        if (op === '/' && typeof r === 'number' && (glIsVec(l) || glIsMat(l))) return glIsMat(l) ? l.map(row => row.map(x => x / r)) : l.map(x => x / r);
        if (op === '+') return l + r; // строковая конкатенация как раньше
        throw new Error('Неподдерживаемая операция "' + op + '" для данных операндов');
    }
    function glApplyCompound(cur, val, op) {
        if (op === '=') return val;
        return glBinaryOp(cur, val, op[0]);
    }
    function glResolvePath(parts, ctx) {
        let obj = (ctx && parts[0] in ctx) ? ctx[parts[0]] : window[parts[0]];
        if (obj === undefined) throw new Error('Неизвестный объект: ' + parts[0]);
        for (let i = 1; i < parts.length - 1; i++) { if (obj === undefined || obj === null) throw new Error('Некорректный путь: ' + parts.join('.')); obj = obj[parts[i]]; }
        return { obj, lastKey: parts[parts.length - 1] };
    }
    async function glExecStatements(stmts, ctx) { for (const s of stmts) await glExecStatement(s, ctx); }
    // Сигнал возврата значения из Function/Void: используется исключение вместо обычного
    // return, т.к. глубина вложенности блоков (if/repeat/forEach) произвольна, а нужно
    // прервать выполнение сразу до самого вызова функции.
    class GLReturnSignal { constructor(value) { this.value = value; } }
    async function glExecStatement(s, ctx) {
        switch (s.type) {
            case 'assign': {
                const val = glEvalExpr(s.expr, ctx);
                if (s.path.length === 1) {
                    const name = s.path[0];
                    if (ctx && name in ctx) {
                        ctx[name] = s.op === '=' ? val : glApplyCompound(ctx[name], val, s.op);
                        if (ctx[name] && typeof ctx[name] === 'object' && 'dirty' in ctx[name]) ctx[name].dirty = true;
                    } else {
                        window[name] = s.op === '=' ? val : glApplyCompound(window[name], val, s.op);
                        if (window[name] && typeof window[name] === 'object' && 'dirty' in window[name]) window[name].dirty = true;
                    }
                } else {
                    const { obj, lastKey } = glResolvePath(s.path, ctx);
                    obj[lastKey] = s.op === '=' ? val : glApplyCompound(obj[lastKey], val, s.op);
                    const rootName = s.path[0];
                    const root = (ctx && rootName in ctx) ? ctx[rootName] : window[rootName];
                    if (root && typeof root === 'object' && 'dirty' in root) root.dirty = true;
                }
                break;
            }
            case 'if':
                if (glEvalExpr(s.cond, ctx)) await glExecStatements(s.thenB, ctx);
                else if (s.elseB) await glExecStatements(s.elseB, ctx);
                break;
            case 'repeat': {
                const cnt = Math.max(0, Math.floor(glEvalExpr(s.count, ctx)));
                for (let i = 0; i < cnt; i++) await glExecStatements(s.body, Object.assign({}, ctx, { i }));
                break;
            }
            case 'forEach': {
                const coll = glEvalExpr(s.coll, ctx);
                if (Array.isArray(coll)) {
                    for (const item of coll) await glExecStatements(s.body, Object.assign({}, ctx, { [s.varName]: item }));
                }
                break;
            }
            case 'wait':
                await new Promise(resolve => setTimeout(resolve, Math.max(0, glEvalExpr(s.arg, ctx)) * 1000));
                break;
            case 'funcDef':
                GL_USER_FUNCS[s.name] = { params: s.params, bodyAst: s.body };
                break;
            case 'return':
                throw new GLReturnSignal(s.expr ? glEvalExpr(s.expr, ctx) : undefined);
            case 'expr': glEvalExpr(s.expr, ctx); break;
        }
    }
    // Синхронный исполнитель для тел Function/Void: glCallUserFunc вызывается из
    // glEvalExpr (синхронно, в т.ч. во время рендера), поэтому await здесь недопустим.
    // wait() внутри такой функции не поддержан (это не имеет смысла синхронно) — просто
    // логируется предупреждение и пропускается.
    function glExecStatementsSync(stmts, ctx) { for (const s of stmts) glExecStatementSync(s, ctx); }
    function glExecStatementSync(s, ctx) {
        switch (s.type) {
            case 'assign': {
                const val = glEvalExpr(s.expr, ctx);
                if (s.path.length === 1) {
                    const name = s.path[0];
                    if (ctx && name in ctx) {
                        ctx[name] = s.op === '=' ? val : glApplyCompound(ctx[name], val, s.op);
                        if (ctx[name] && typeof ctx[name] === 'object' && 'dirty' in ctx[name]) ctx[name].dirty = true;
                    } else {
                        window[name] = s.op === '=' ? val : glApplyCompound(window[name], val, s.op);
                        if (window[name] && typeof window[name] === 'object' && 'dirty' in window[name]) window[name].dirty = true;
                    }
                } else {
                    const { obj, lastKey } = glResolvePath(s.path, ctx);
                    obj[lastKey] = s.op === '=' ? val : glApplyCompound(obj[lastKey], val, s.op);
                    const rootName = s.path[0];
                    const root = (ctx && rootName in ctx) ? ctx[rootName] : window[rootName];
                    if (root && typeof root === 'object' && 'dirty' in root) root.dirty = true;
                }
                break;
            }
            case 'if':
                if (glEvalExpr(s.cond, ctx)) glExecStatementsSync(s.thenB, ctx);
                else if (s.elseB) glExecStatementsSync(s.elseB, ctx);
                break;
            case 'repeat': {
                const cnt = Math.max(0, Math.floor(glEvalExpr(s.count, ctx)));
                for (let i = 0; i < cnt; i++) glExecStatementsSync(s.body, Object.assign({}, ctx, { i }));
                break;
            }
            case 'forEach': {
                const coll = glEvalExpr(s.coll, ctx);
                if (Array.isArray(coll)) {
                    for (const item of coll) glExecStatementsSync(s.body, Object.assign({}, ctx, { [s.varName]: item }));
                }
                break;
            }
            case 'wait':
                glLog('warn', 'wait() нельзя использовать внутри Function/Void — вызов проигнорирован');
                break;
            case 'funcDef':
                GL_USER_FUNCS[s.name] = { params: s.params, bodyAst: s.body };
                break;
            case 'return':
                throw new GLReturnSignal(s.expr ? glEvalExpr(s.expr, ctx) : undefined);
            case 'expr': glEvalExpr(s.expr, ctx); break;
        }
    }
    const glProgramCache = new Map();
    async function glRun(sourceCode, extraCtx) {
        if (!sourceCode || !sourceCode.trim()) return;
        let stmts = glProgramCache.get(sourceCode);
        if (!stmts) {
            try { stmts = glParseProgram(sourceCode); }
            catch (e) { console.error('Ошибка разбора сценария:', e.message); return; }
            if (glProgramCache.size > 200) glProgramCache.clear();
            glProgramCache.set(sourceCode, stmts);
        }
        try { await glExecStatements(stmts, Object.assign({ time: elapsedTime }, extraCtx || {})); }
        catch (e) { if (e instanceof GLReturnSignal) return; console.error('Ошибка выполнения сценария:', e.message); }
    }

`,
            '    function getNestedValue(obj, path) {\n',
            '        const parts = path.split(\'.\');\n',
            '        let current = obj;\n',
            '        for (let part of parts) { if (current === undefined || current === null) return undefined; current = current[part]; }\n',
            '        return current;\n',
            '    }\n',
            '    function setNestedValue(obj, path, value) {\n',
            '        const parts = path.split(\'.\');\n',
            '        let current = obj;\n',
            '        for (let i = 0; i < parts.length - 1; i++) { const part = parts[i]; if (current[part] === undefined) current[part] = {}; current = current[part]; }\n',
            '        current[parts[parts.length - 1]] = value;\n',
            '    }\n',
            '\n',
            '    const glWarnedExprs = new Set();\n',
            '    const glExprAstCache = new Map();\n',
            '    function glParseExprCached(exprSrc) {\n',
            '      let ast = glExprAstCache.get(exprSrc);\n',
            '      if (!ast) {\n',
            '        ast = glParseExprOnly(exprSrc);\n',
            '        if (glExprAstCache.size > 500) glExprAstCache.clear();\n',
            '        glExprAstCache.set(exprSrc, ast);\n',
            '      }\n',
            '      return ast;\n',
            '    }\n',
            '    function evaluate(expr, extraCtx) {\n',
            '      if (expr === undefined || expr === null) return expr;\n',
            '      try {\n',
            '        return glEvalExpr(glParseExprCached(String(expr)), Object.assign({ time: elapsedTime }, extraCtx || {}));\n',
            '      } catch (e) {\n',
            '        const isKnownLiteral = /^(#[0-9A-Fa-f]+|default|true|false)$/.test(String(expr).trim());\n',
            '        if (!isKnownLiteral && !glWarnedExprs.has(expr)) {\n',
            '          glWarnedExprs.add(expr);\n',
            '          glLog(\'warn\', \'Не удалось вычислить выражение "\' + expr + \'": \' + e.message + \'. Используется как есть.\');\n',
            '        }\n',
            '        return expr;\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function createUI() {\n',
            '        uiContainer.innerHTML = \'\';\n',
            '        for (let ui of uiData) {\n',
            '            const wrapper = document.createElement(\'div\'); wrapper.className = \'ui-item\';\n',
            '            if (ui.active === false) wrapper.style.display = \'none\';\n',
            '            const positioned = ui.x !== null && ui.x !== undefined && ui.y !== null && ui.y !== undefined;\n',
            '            if (positioned) {\n',
            '                wrapper.style.position = \'absolute\';\n',
            '                wrapper.style.left = ui.x + \'%\';\n',
            '                wrapper.style.top = ui.y + \'%\';\n',
            '                wrapper.style.pointerEvents = \'auto\';\n',
            '                wrapper.style.zIndex = (ui.layer !== undefined && ui.layer !== null) ? ui.layer : 100;\n',
            '                if (ui.width) wrapper.style.width = ui.width + \'px\';\n',
            '                if (ui.height) wrapper.style.height = ui.height + \'px\';\n',
            '            }\n',
            '            if (ui.type === \'button\') {\n',
            '                const btn = document.createElement(\'button\');\n',
            '                btn.textContent = ui.label || \'Button\';\n',
            '                btn.style.backgroundColor = ui.color || __gcDefaultColor();\n',
            '                btn.style.color = ui.textcolor || \'#ffffff\';\n',
            '                btn.style.borderRadius = (ui.radius !== null && ui.radius !== undefined ? ui.radius : 4) + \'px\';\n',
            '                if (positioned) { btn.style.width = \'100%\'; btn.style.height = \'100%\'; }\n',
            '                btn.addEventListener(\'click\', async function() {\n',
            '                    await glRun(ui.action || \'\');\n',
            '                    figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw();\n',
            '                });\n',
            '                wrapper.appendChild(btn);\n',
            '            } else if (ui.type === \'toggle\') {\n',
            '                const checkbox = document.createElement(\'input\'); checkbox.type = \'checkbox\';\n',
            '                let initialChecked = ui.default !== undefined ? ui.default : false;\n',
            '                if (ui.variable) { const val = getNestedValue(window, ui.variable); if (val !== undefined) initialChecked = !!val; }\n',
            '                checkbox.checked = initialChecked;\n',
            '                if (ui.variable) {\n',
            '                    const varPath = ui.variable;\n',
            '                    if (getNestedValue(window, varPath) === undefined) setNestedValue(window, varPath, initialChecked);\n',
            '                    checkbox.addEventListener(\'change\', function() {\n',
            '                        setNestedValue(window, varPath, this.checked);\n',
            '                        figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw();\n',
            '                    });\n',
            '                }\n',
            '                const label = document.createElement(\'label\'); label.textContent = ui.label || \'\'; label.style.color = ui.textcolor || __gcDefaultColor();\n',
            '                wrapper.appendChild(checkbox); wrapper.appendChild(label);\n',
            '            } else if (ui.type === \'input\') {\n',
            '                const input = document.createElement(\'input\'); input.type = ui.inputtype === \'formula\' ? \'text\' : (ui.inputtype || \'text\');\n',
            '                if (input.type === \'number\') {\n',
            '                    if (ui.min !== null) input.min = ui.min;\n',
            '                    if (ui.max !== null) input.max = ui.max;\n',
            '                    input.step = (ui.step !== null && ui.step !== undefined) ? ui.step : \'any\';\n',
            '                    if (ui.stepper === false) input.classList.add(\'no-stepper\');\n',
            '                }\n',
            '                if (ui.inputtype === \'formula\') {\n',
            '                    const funcName = ui.funcName || ui.variable || \'userFunc\';\n',
            '                    const defaultExpr = (ui.default !== undefined && ui.default !== null) ? String(ui.default) : \'x\';\n',
            '                    input.value = defaultExpr;\n',
            '                    input.placeholder = \'например: x^2 + sin(x)\';\n',
            '                    const errLabel = document.createElement(\'div\');\n',
            '                    errLabel.style.color = \'#ff0000\'; errLabel.style.fontSize = \'0.75rem\'; errLabel.style.marginTop = \'2px\'; errLabel.style.display = \'none\';\n',
            '                    let lastErrMsg = null;\n',
            '                    function registerFormula() {\n',
            '                        try {\n',
            '                            const ast = glParseExprOnly(input.value);\n',
            '                            GL_USER_FUNCS[funcName] = { params: [\'x\'], bodyAst: ast };\n',
            '                            glUserFuncVersion++;\n',
            '                            input.style.borderColor = \'\';\n',
            '                            errLabel.style.display = \'none\';\n',
            '                            lastErrMsg = null;\n',
            '                        } catch (e) {\n',
            '                            input.style.borderColor = \'#ff0000\';\n',
            '                            errLabel.textContent = \'Ошибка: \' + e.message;\n',
            '                            errLabel.style.display = \'block\';\n',
            '                            if (e.message !== lastErrMsg) { glLog(\'warn\', \'Формула "\' + funcName + \'" (поле "\' + (ui.label || \'\') + \'"): \' + e.message); lastErrMsg = e.message; }\n',
            '                        }\n',
            '                        figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw();\n',
            '                    }\n',
            '                    registerFormula();\n',
            '                    input.addEventListener(\'input\', registerFormula); input.addEventListener(\'change\', registerFormula);\n',
            '                    const label = document.createElement(\'label\'); label.textContent = ui.label || \'\'; label.style.color = ui.textcolor || __gcDefaultColor();\n',
            '                    wrapper.appendChild(label); wrapper.appendChild(input); wrapper.appendChild(errLabel);\n',
            '                    if (positioned) uiOverlay.appendChild(wrapper); else uiContainer.appendChild(wrapper);\n',
            '                    continue;\n',
            '                }\n',
            '                let defaultVal = ui.default !== undefined ? ui.default : (input.type === \'number\' ? 0 : \'\');\n',
            '                if (ui.variable) { const val = getNestedValue(window, ui.variable); if (val !== undefined) defaultVal = val; }\n',
            '                input.value = defaultVal;\n',
            '                if (ui.variable) {\n',
            '                    const varPath = ui.variable;\n',
            '                    if (getNestedValue(window, varPath) === undefined) setNestedValue(window, varPath, defaultVal);\n',
            '                    function clampAndUpdate() {\n',
            '                        let val = input.value;\n',
            '                        if (input.type === \'number\') {\n',
            '                            let num = parseFloat(val);\n',
            '                            if (isNaN(num)) { const currentVal = getNestedValue(window, varPath); if (currentVal !== undefined) { input.value = currentVal; } else { input.value = defaultVal; } return; }\n',
            '                            if (ui.min !== null && num < ui.min) num = ui.min;\n',
            '                            if (ui.max !== null && num > ui.max) num = ui.max;\n',
            '                            if (ui.step !== null && ui.step > 0) {\n',
            '                                const minVal = ui.min !== null ? ui.min : 0;\n',
            '                                const remainder = (num - minVal) % ui.step;\n',
            '                                if (Math.abs(remainder) > 0.0001) { if (remainder > ui.step / 2) num += ui.step - remainder; else num -= remainder; num = parseFloat(num.toFixed(10)); }\n',
            '                            }\n',
            '                            input.value = num; setNestedValue(window, varPath, num);\n',
            '                        } else { setNestedValue(window, varPath, val); }\n',
            '                        figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw();\n',
            '                    }\n',
            '                    input.addEventListener(\'input\', clampAndUpdate); input.addEventListener(\'blur\', clampAndUpdate); input.addEventListener(\'change\', clampAndUpdate);\n',
            '                }\n',
            '                const label = document.createElement(\'label\'); label.textContent = ui.label || \'\'; label.style.color = ui.textcolor || __gcDefaultColor();\n',
            '                wrapper.appendChild(label); wrapper.appendChild(input);\n',
            '            } else if (ui.type === \'slider\') {\n',
            '                const input = document.createElement(\'input\'); input.type = \'range\';\n',
            '                input.min = ui.min; input.max = ui.max; input.step = ui.step || 1;\n',
            '                let defaultVal = (ui.default !== undefined && ui.default !== null) ? ui.default : ui.min;\n',
            '                if (ui.variable) { const val = getNestedValue(window, ui.variable); if (val !== undefined) defaultVal = val; }\n',
            '                input.value = defaultVal;\n',
            '                input.style.accentColor = ui.color || __gcDefaultColor();\n',
            '                if (positioned) { input.style.width = \'100%\'; }\n',
            '                const valueLabel = document.createElement(\'span\'); valueLabel.textContent = String(defaultVal); valueLabel.style.color = ui.textcolor || __gcDefaultColor(); valueLabel.style.marginLeft = \'6px\';\n',
            '                if (ui.variable) {\n',
            '                    const varPath = ui.variable;\n',
            '                    if (getNestedValue(window, varPath) === undefined) setNestedValue(window, varPath, defaultVal);\n',
            '                    input.addEventListener(\'input\', function() {\n',
            '                        const num = parseFloat(this.value);\n',
            '                        setNestedValue(window, varPath, num);\n',
            '                        valueLabel.textContent = String(num);\n',
            '                        figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw();\n',
            '                    });\n',
            '                }\n',
            '                const label2 = document.createElement(\'label\'); label2.textContent = ui.label || \'\'; label2.style.color = ui.textcolor || __gcDefaultColor();\n',
            '                wrapper.appendChild(label2); wrapper.appendChild(input); wrapper.appendChild(valueLabel);\n',
            '            }\n',
            '            if (positioned) uiOverlay.appendChild(wrapper); else uiContainer.appendChild(wrapper);\n',
            '        }\n',
            '    }\n',
            '\n',
            '    let startCode = ' + startCodeEscaped + ';\n',
            '    let updateCode = ' + updateCodeEscaped + ';\n',
            '\n',
            '    for (let f of figures) { if (window[f.name] !== undefined) glLog(\'warn\', "Фигура "+f.name+" уже существует в window"); window[f.name] = f; }\n',
            '    let Start = async function() { await glRun(startCode); };\n',
            '    let Update = async function() { elapsedTime = (performance.now() - glStartTime) / 1000; await glRun(updateCode); };\n',
            '\n',
            '    initUserFuncs(); initPoints(); initLines(); initCircles(); initArcs(); initEllipses(); initCurves(); initDrawFunctions(); initDrawSurfaces(); initDrawImages(); initDrawHistograms(); initDrawFields(); initDrawTrajectories(); initDrawGraphs(); initDrawFractals(); initDrawLoci(); initDrawFormulas(); initFigures(); initClusters(); initAngles();\n',
            '    initDrawAngles(); initDrawEqually(); initDrawVectors(); initDrawInfLines(); initDrawFillings(); initDrawPunctirs();\n',
            '    initDrawTexts();\n',
            '    for (let coll of [points, lines, circles, ellipses, arcs, curves, figures, drawFunctions, drawSurfaces, drawImages, drawFillings, drawTexts, drawVectors, drawInfLines, drawPunctirs, drawEqually, drawAngles, drawHistograms, drawFields, drawTrajectories, drawGraphs]) {\n',
            '      for (let o of coll) { if (o && o.dirty === undefined) o.dirty = true; }\n',
            '    }\n',
            '    for (let coll of [drawFractals]) {\n',
            '      for (let o of coll) { if (o && o.dirty === undefined) o.dirty = true; }\n',
            '    }\n',
            '    updateScene();\n',
            '    for (let p of points) { if (window[p.name] !== undefined) glLog(\'warn\', "Точка "+p.name+" уже существует в window"); window[p.name] = p; }\n',
            '    for (let l of lines) { if (window[l.name] !== undefined) glLog(\'warn\', "Линия "+l.name+" уже существует в window"); window[l.name] = l; }\n',
            '    for (let c of circles) { if (window[c.name] !== undefined) glLog(\'warn\', "Окружность "+c.name+" уже существует в window"); window[c.name] = c; }\n',
            '    for (let a of arcs) { if (window[a.name] !== undefined) glLog(\'warn\', "Дуга "+a.name+" уже существует в window"); window[a.name] = a; }\n',
            '    for (let e of ellipses) { if (window[e.name] !== undefined) glLog(\'warn\', "Эллипс "+e.name+" уже существует в window"); window[e.name] = e; }\n',
            '    for (let cv of curves) { if (window[cv.name] !== undefined) glLog(\'warn\', "Кривая "+cv.name+" уже существует в window"); window[cv.name] = cv; }\n',
            '    for (let d of drawFunctions) { if (window[d.name] !== undefined) glLog(\'warn\', "График функции "+d.name+" уже существует в window"); window[d.name] = d; }\n',
            '    for (let d of drawSurfaces) { if (window[d.name] !== undefined) glLog(\'warn\', "Поверхность "+d.name+" уже существует в window"); window[d.name] = d; }\n',
            '    for (let d of drawImages) { if (window[d.name] !== undefined) glLog(\'warn\', "Изображение "+d.name+" уже существует в window"); window[d.name] = d; }\n',
            '    for (let d of drawHistograms) { if (window[d.name] !== undefined) glLog(\'warn\', "Гистограмма "+d.name+" уже существует в window"); window[d.name] = d; }\n',
            '    for (let d of drawFields) { if (window[d.name] !== undefined) glLog(\'warn\', "Поле "+d.name+" уже существует в window"); window[d.name] = d; }\n',
            '    for (let d of drawTrajectories) { if (window[d.name] !== undefined) glLog(\'warn\', "Траектория "+d.name+" уже существует в window"); window[d.name] = d; }\n',
            '    for (let d of drawGraphs) { if (window[d.name] !== undefined) glLog(\'warn\', "Отрисовка графа "+d.name+" уже существует в window"); window[d.name] = d; }\n',
            '    for (let d of drawFractals) { if (window[d.name] !== undefined) glLog(\'warn\', "Фрактал "+d.name+" уже существует в window"); window[d.name] = d; }\n',
            '    for (let d of drawRegions) { window[d.name] = d; }\n',
            '    for (let d of drawLoci) { window[d.name] = d; }\n',
            '    for (let d of drawTraces) { window[d.name] = d; }\n',
            '    for (let d of drawFormulas) { window[d.name] = d; }\n',
            '    for (let d of drawCharts) { window[d.name] = d; }\n',
            '    for (let d of drawTrees) { window[d.name] = d; }\n',
            '    for (let d of drawTables) { window[d.name] = d; }\n',
            '    for (let d of drawComplexes) { window[d.name] = d; }\n',
            '    for (let d of drawHyperbolics) { window[d.name] = d; }\n',
            '    for (let d of drawBifurcations) { window[d.name] = d; }\n',
            '    for (let d of drawCobwebs) { window[d.name] = d; }\n',
            '    for (let d of drawIFSs) { window[d.name] = d; }\n',
            '    for (let d of drawAutomata) { window[d.name] = d; }\n',
            '    for (let d of drawVoronois) { window[d.name] = d; }\n',
            '    for (let d of drawFouriers) { window[d.name] = d; }\n',
            '    for (let d of drawDiagrams) { window[d.name] = d; }\n',
            '    // Коллекции целиком доступны в мини-языке для for (x in points) {...} и т.п. (Задача 4)\n',
            '    if (window.points === undefined) window.points = points;\n',
            '    if (window.lines === undefined) window.lines = lines;\n',
            '    if (window.figures === undefined) window.figures = figures;\n',
            '    if (window.circles === undefined) window.circles = circles;\n',
            '    if (window.ellipses === undefined) window.ellipses = ellipses;\n',
            '    if (window.curves === undefined) window.curves = curves;\n',
            '\n',
            '    resizeCanvas(); createUI();\n',
            '    if (startCode && startCode.trim()) { (async function() { await Start(); figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw(); })(); }\n',
            '    if (updateCode && updateCode.trim()) {\n',
            '      let updateRunning = false;\n',
            '      async function runUpdate() {\n',
            '        if (updateRunning) return; updateRunning = true;\n',
            '        try {\n',
            '          const draggedPt = draggedPointIndex !== -1 ? points[draggedPointIndex] : null;\n',
            '          if (isDragging && draggedPt && draggedPt.pauseOnDrag !== false) { /* пауза анимации на время перетаскивания этой точки */ } else {\n',
            '            await Update();\n',
            '            for (let p of points) {\n',
            '              if (p.hidden || p.lineName || p.circleName || p.ellipseName || p.curveName || p.arcName || p.graphName || p.construct || p.transform) continue;\n',
            '              if (p.pos.x < -FIELD_WIDTH/2) p.pos.x = -FIELD_WIDTH/2; if (p.pos.x > FIELD_WIDTH/2) p.pos.x = FIELD_WIDTH/2;\n',
            '              if (p.pos.y < -FIELD_HEIGHT/2) p.pos.y = -FIELD_HEIGHT/2; if (p.pos.y > FIELD_HEIGHT/2) p.pos.y = FIELD_HEIGHT/2;\n',
            '            }\n',
            '            figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene();\n',
            '            if (window.autoRedraw !== false) draw();\n',
            '          }\n',
            '        } catch(e) { console.error(\'Ошибка в цикле Update:\', e); }\n',
            '        updateRunning = false; requestAnimationFrame(runUpdate);\n',
            '      }\n',
            '      runUpdate();\n',
            '    }\n',
            '\n',
            '    // ---- Рендеринг формул KaTeX (ручной) ----\n',
    '    function renderKaTeX(text) {\n',
    '      if (typeof katex === \'undefined\') return text;\n',
    '      text = text.replace(/\\\\\\\\/g, \'\\\\\');\n',
    '      return text.replace(/\\\\\\(([\\s\\S]*?)\\\\\\)/g, function(match, p1) {\n',
    '        return katex.renderToString(p1, {throwOnError: false});\n',
    '      }).replace(/\\\\\\[([\\s\\S]*?)\\\\\\]/g, function(match, p1) {\n',
    '        return katex.renderToString(p1, {throwOnError: false, displayMode: true});\n',
    '      });\n',
    '    }\n',
    '    function renderInfoText() {\n',
    '      var infoText = document.getElementById(\'infoText\');\n',
    '      if (infoText) {\n',
    '        infoText.innerHTML = renderKaTeX(infoText.innerHTML);\n',
    '      }\n',
    '    }\n',
    '    if (typeof katex !== \'undefined\') {\n',
    '      renderInfoText();\n',
    '    } else {\n',
    '      // ждём загрузку KaTeX\n',
    '      var checkInterval = setInterval(function() {\n',
    '        if (typeof katex !== \'undefined\') {\n',
    '          clearInterval(checkInterval);\n',
    '          renderInfoText();\n',
    '          // также перерендерим формулы в overlay при необходимости\n',
    '          markSceneChanged();\n',
    '          draw();\n',
    '        }\n',
    '      }, 50);\n',
    '      // запасной таймаут, чтобы не висело вечно\n',
    '      setTimeout(function() { clearInterval(checkInterval); }, 5000);\n',
    '    }\n',
            '  })();\n',
            '<' + '/script>\n',
            '</body>\n',
            '</html>'
        ];
        return parts.join('');
    } catch (e) {
        console.error('Ошибка в generate2D:', e);
        return null;
    }
}

// ========== ГЕНЕРАЦИЯ 3D-СЦЕНЫ (СТЕРЕОМЕТРИЯ) ==========
// Этап 1: базовый движок на Three.js — сцена, орбитальная камера (вращение/зум),
// оси, сетка, точки, отрезки, плоские многоугольники (грани многогранников).
// Остальные типы объектов (углы, поля, поверхности, графики и т.д.) подключаются
// на следующих этапах; здесь они молча игнорируются, если встречаются в 3D-сцене.
function generate3D(params, pointsData, linesData, figuresData, clustersData, drawFillingsData, anglesData, drawAnglesData, drawVectorsData, drawSurfacesData, drawFieldsData, curvesData, drawTrajectoriesData, drawTextsData, uiData, drawInfPlanesData, funcsData, procsData, userVars, startCodes, updateCodes, primitivesData, derivedOpsData, angles3DData) {
    try {
        const title = params.title || '';
        const undertitle = params.undertitle || '';
        const description = params.description || '';

        const themeName = (params.theme === 'light' || params.theme === 'dark') ? params.theme : 'dark';
        const theme = THEME_PRESETS[themeName];

        const fieldWidth = (typeof params['field width'] === 'number') ? params['field width'] : 50;
        const fieldHeight = (typeof params['field height'] === 'number') ? params['field height'] : 30;
        const fieldDepth = (typeof params['field depth'] === 'number') ? params['field depth'] : fieldWidth;
        const fieldColor = params['field color'] || theme.fieldColor;
        const frameColor = params['frame color'] || theme.frameColor;
        const frameWidth = (typeof params['frame width'] === 'number') ? params['frame width'] : 1;
        const titleColor = params['title color'] || theme.titleColor;
        const titleSize = (typeof params['title size'] === 'number') ? params['title size'] : 1.3;
        const subColor = params['undertitle color'] || theme.subColor;
        const subSize = (typeof params['undertitle size'] === 'number') ? params['undertitle size'] : 0.7;
        const descColor = params['description color'] || theme.descColor;
        const descSize = (typeof params['description size'] === 'number') ? params['description size'] : 0.85;
        const footerColor = params['footer color'] || theme.footerColor;
        const footerSize = (typeof params['footer size'] === 'number') ? params['footer size'] : 0.65;

        const themesJson = jsonForScript(THEME_PRESETS);
        const themeNameJson = jsonForScript(themeName);

        const canRotateCamera = params['can rotate camera'] !== false;
        const canZoomCamera = params['can zoom camera'] !== false;
        const zoomLimits = Array.isArray(params['zoom limits']) ? params['zoom limits'] : [0.3, 4];
        const cameraStartZoom = (typeof params['camera start zoom'] === 'number') ? params['camera start zoom'] : 1;
        const cameraStartRot = Array.isArray(params['camera start rot']) ? params['camera start rot'] : [45, 60];

        // Оси и сетка: общий рубильник + по каждой оси отдельно, плюс своя дальность отображения.
        const showAxesMaster = params['show axes'] !== false;
        const showAxisX = (params['show axis x'] !== undefined) ? (params['show axis x'] !== false) : showAxesMaster;
        const showAxisY = (params['show axis y'] !== undefined) ? (params['show axis y'] !== false) : showAxesMaster;
        const showAxisZ = (params['show axis z'] !== undefined) ? (params['show axis z'] !== false) : showAxesMaster;
        const axesSize = (typeof params['axes size'] === 'number') ? params['axes size'] : Math.max(fieldWidth, fieldHeight, fieldDepth);

        const showGridMaster = params['show grid'] !== false;
        const showGridX = (params['show grid x'] !== undefined) ? (params['show grid x'] !== false) : showGridMaster;
        const showGridY = (params['show grid y'] !== undefined) ? (params['show grid y'] !== false) : showGridMaster;
        const showGridZ = (params['show grid z'] !== undefined) ? (params['show grid z'] !== false) : showGridMaster;
        const gridSize = (typeof params['grid size'] === 'number') ? params['grid size'] : Math.max(fieldWidth, fieldHeight, fieldDepth);

        const footer = params.footer ? escapeHtml(params.footer) : `Сцена ${fieldWidth}×${fieldHeight}×${fieldDepth} · Вращайте камеру мышью, колесо — зум · перетаскивайте интерактивные точки · пространство: 3D`;

        const pointsJson = jsonForScript(pointsData);
        const linesJson = jsonForScript(linesData);
        const figuresJson = jsonForScript(figuresData);
        const clustersJson = jsonForScript(clustersData);
        const fillingsJson = jsonForScript(drawFillingsData || []);
        const anglesJson = jsonForScript((anglesData || []).map(a => ({ name: a.name, lineNames: a.lineNames, lock: a.lock })));
        const drawAnglesJson = jsonForScript(drawAnglesData || []);
        const drawVectorsJson = jsonForScript(drawVectorsData || []);
        const drawSurfacesJson = jsonForScript(drawSurfacesData || []);
        const drawFieldsJson = jsonForScript(drawFieldsData || []);
        const curvesJson = jsonForScript(curvesData || []);
        const drawTrajectoriesJson = jsonForScript(drawTrajectoriesData || []);
        const drawTextsJson = jsonForScript(drawTextsData || []);
        const uiJson = jsonForScript(uiData || []);
        const infPlanesJson = jsonForScript(drawInfPlanesData || []);
        const primitivesJson = jsonForScript(primitivesData || []);
        const derivedOpsJson = jsonForScript(derivedOpsData || []);
        const angles3DJson = jsonForScript(angles3DData || []);
        const funcsJson = jsonForScript(funcsData);
        const procsJson = jsonForScript(procsData || []);
        const varsJson = jsonForScript(userVars);
        const startCodeCombined = (startCodes || []).filter(s => s.trim()).join('; ');
        const updateCodeCombined = (updateCodes || []).filter(s => s.trim()).join('; ');
        const startCodeEscaped = jsonForScript(startCodeCombined);
        const updateCodeEscaped = jsonForScript(updateCodeCombined);

        const parts = [
            '<!DOCTYPE html>\n',
            '<html lang="ru">\n',
            '<head>\n',
            '  <meta charset="UTF-8">\n',
            '  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">\n',
            '  <title>', title, '</title>\n',
            '  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>\n',
            ' <' + 'style>\n',
            '    :root {\n',
            '      --gc-field:', fieldColor, ';\n',
            '      --gc-frame:', frameColor, ';\n',
            '      --gc-title:', titleColor, ';\n',
            '      --gc-sub:', subColor, ';\n',
            '      --gc-desc:', descColor, ';\n',
            '      --gc-desc-bg:', theme.panelBg, ';\n',
            '      --gc-footer:', footerColor, ';\n',
            '      --gc-footer-border:', theme.footerBorder, ';\n',
            '      --gc-control-bg:', theme.controlBg, ';\n',
            '      --gc-control-border:', theme.controlBorder, ';\n',
            '      --gc-control-text:', theme.controlText, ';\n',
            '      --gc-button-text:', theme.buttonText, ';\n',
            '      --gc-input-bg:', theme.inputBg, ';\n',
            '      --gc-accent:', theme.accent, ';\n',
            '    }\n',
            '    * { margin:0; padding:0; box-sizing:border-box; user-select:none; -webkit-tap-highlight-color:transparent; }\n',
            '    body {\n',
            '      min-height:100vh;\n',
            '      background:transparent;\n',
            '      font-family:\'Segoe UI\',\'Montserrat\',system-ui,sans-serif;\n',
            '      display:flex;\n',
            '      justify-content:center;\n',
            '      align-items:center;\n',
            '      padding:1rem;\n',
            '      touch-action:pan-x pan-y;\n',
            '    }\n',
            '    .container { max-width:1000px; width:100%; background:transparent; }\n',
            '    .title { font-family:\'Montserrat\',\'Arial Black\',sans-serif; font-weight:900; font-size:', String(titleSize), 'rem; letter-spacing:0.05em; text-transform:uppercase; text-align:center; margin-bottom:0.3rem; color:var(--gc-title); }\n',
            '    .sub { text-align:center; font-size:', String(subSize), 'rem; margin-bottom:1rem; color:var(--gc-sub); }\n',
            '    .canvas-wrapper { border:', String(frameWidth), 'px solid var(--gc-frame); display:block; width:100%; max-width:800px; aspect-ratio:5/3; margin:0 auto; background:var(--gc-field); cursor:grab; position:relative; overflow:hidden; }\n',
            '    .canvas-wrapper.dragging-cam { cursor:grabbing; }\n',
            '    .canvas-wrapper.dragging-point { cursor:pointer; }\n',
            '    canvas { background:transparent; display:block; width:100%; height:100%; border:none; touch-action:none; }\n',
            '    #labelLayer { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; z-index:10; }\n',
            '    #labelLayer .gc3-label { position:absolute; transform:translate(-50%,-120%); font-size:0.8rem; font-family:monospace; white-space:nowrap; text-shadow:0 0 3px rgba(0,0,0,0.8), 0 0 3px rgba(0,0,0,0.8); will-change:left,top; }\n',
            '    #textLayer { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; z-index:10; }\n',
            '    #textLayer .gc3-text { position:absolute; transform:translate(-50%,-50%); font-family:monospace; white-space:nowrap; }\n',
            '    #uiOverlay { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; z-index:11; }\n',
            '    .controls { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-top:12px; }\n',
            '    .controls button {\n',
            '      padding:4px 12px; border:1px solid var(--gc-control-border); border-radius:4px;\n',
            '      background:var(--gc-control-bg); color:var(--gc-button-text); font-size:0.85rem; cursor:pointer; font-family:inherit;\n',
            '    }\n',
            '    .controls button:hover { opacity:0.8; }\n',
            '    .controls input[type="checkbox"] { width:18px; height:18px; accent-color:var(--gc-accent); }\n',
            '    .controls input[type="number"], .controls input[type="text"] {\n',
            '      padding:4px 8px; border:1px solid var(--gc-control-border); border-radius:4px; font-size:0.85rem;\n',
            '      width:100px; background:var(--gc-input-bg); color:var(--gc-control-text); font-family:inherit;\n',
            '    }\n',
            '    .controls label { font-size:0.85rem; color:var(--gc-control-text); }\n',
            '    .controls .ui-item { display:flex; align-items:center; gap:6px; }\n',
            '    .info-panel { font-size:', String(descSize), 'rem; margin-top:0.6rem; font-family:monospace; text-align:center; background:var(--gc-desc-bg); padding:8px; border-radius:4px; line-height:1.5; color:var(--gc-desc); }\n',
            '    .footer { margin-top:0.8rem; font-size:', String(footerSize), 'rem; text-align:center; border-top:1px solid var(--gc-footer-border); padding-top:0.5rem; color:var(--gc-footer); }\n',
            '    @media (max-width:700px) {\n',
            '      .title { font-size:1rem; }\n',
            '      .sub { font-size:0.6rem; }\n',
            '      .info-panel { font-size:0.7rem; }\n',
            '      .controls { gap:8px; }\n',
            '      .controls input[type="number"], .controls input[type="text"] { width:80px; }\n',
            '    }\n',
            '  <' + '/style>\n',
            '</head>\n',
            '<body>\n',
            '<div class="container">\n',
            '  <div class="title">', title, '</div>\n',
            '  <div class="sub">', undertitle, '</div>\n',
            '  <div class="canvas-wrapper" id="canvasWrapper">\n',
            '    <canvas id="mainCanvas"></canvas>\n',
            '    <div id="labelLayer"></div>\n',
            '    <div id="textLayer"></div>\n',
            '    <div id="uiOverlay"></div>\n',
            '  </div>\n',
            '  <div class="controls" id="uiContainer"></div>\n',
            '  <div class="info-panel" id="infoText">', description, '</div>\n',
            '  <div class="footer">', footer, '</div>\n',
            '</div>\n',
            '<script>\n',
            '(function() {\n',
            '  const THEMES = ', themesJson, ';\n',
            '  let themeName = ', themeNameJson, ';\n',
            '  const wrapper = document.getElementById(\'canvasWrapper\');\n',
            '  const canvas = document.getElementById(\'mainCanvas\');\n',
            '  const labelLayer = document.getElementById(\'labelLayer\');\n',
            '  const textLayer = document.getElementById(\'textLayer\');\n',
            '  const uiOverlay = document.getElementById(\'uiOverlay\');\n',
            '  const uiContainer = document.getElementById(\'uiContainer\');\n',
            '\n',
            '  const pointsData = ', pointsJson, ';\n',
            '  const linesData = ', linesJson, ';\n',
            '  const figuresData = ', figuresJson, ';\n',
            '  const clustersData = ', clustersJson, ';\n',
            '  const fillingsData = ', fillingsJson, ';\n',
            '  const anglesData = ', anglesJson, ';\n',
            '  const drawAnglesData = ', drawAnglesJson, ';\n',
            '  const drawVectorsData = ', drawVectorsJson, ';\n',
            '  const drawSurfacesData = ', drawSurfacesJson, ';\n',
            '  const drawFieldsData = ', drawFieldsJson, ';\n',
            '  const curvesData = ', curvesJson, ';\n',
            '  const drawTrajectoriesData = ', drawTrajectoriesJson, ';\n',
            '  const drawTextsData = ', drawTextsJson, ';\n',
            '  const uiData = ', uiJson, ';\n',
            '  const infPlanesData = ', infPlanesJson, ';\n',
            '  const primitivesData = ', primitivesJson, ';\n',
            '  const derivedOpsData = ', derivedOpsJson, ';\n',
            '  const angles3DData = ', angles3DJson, ';\n',
            '  const funcsData = ', funcsJson, ';\n',
            '  const procsData = ', procsJson, ';\n',
            '  const userVars = ', varsJson, ';\n',
            '  const startCode = ', startCodeEscaped, ';\n',
            '  const updateCode = ', updateCodeEscaped, ';\n',
            '\n',
            '  const fieldW = ', String(fieldWidth), ', fieldH = ', String(fieldHeight), ', fieldD = ', String(fieldDepth), ';\n',
            '  const canRotateCamera = ', String(canRotateCamera), ';\n',
            '  const canZoomCamera = ', String(canZoomCamera), ';\n',
            '  const zoomMin = ', String(zoomLimits[0]), ', zoomMax = ', String(zoomLimits[1]), ';\n',
            '  let camZoom = ', String(cameraStartZoom), ';\n',
            '  let theta = (', String(cameraStartRot[0]), ') * Math.PI / 180;\n',
            '  let phi = (', String(cameraStartRot[1]), ') * Math.PI / 180;\n',
            '  const showAxisX = ', String(showAxisX), ', showAxisY = ', String(showAxisY), ', showAxisZ = ', String(showAxisZ), ';\n',
            '  const axesSize = ', String(axesSize), ';\n',
            '  const showGridX = ', String(showGridX), ', showGridY = ', String(showGridY), ', showGridZ = ', String(showGridZ), ';\n',
            '  const gridSize = ', String(gridSize), ';\n',
            '\n',
            '  // ---------- Три.js: сцена, камера, рендерер ----------\n',
            '  const scene = new THREE.Scene();\n',
            '  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);\n',
            '  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });\n',
            '  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));\n',
            '\n',
            '  scene.add(new THREE.AmbientLight(0xffffff, 0.65));\n',
            '  const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);\n',
            '  keyLight.position.set(1, 1.4, 1);\n',
            '  scene.add(keyLight);\n',
            '  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);\n',
            '  fillLight.position.set(-1, -0.5, -1);\n',
            '  scene.add(fillLight);\n',
            '\n',
            '  const baseRadius = Math.max(fieldW, fieldH, fieldD) * 1.6;\n',
            '  const target = new THREE.Vector3(0, 0, 0);\n',
            '\n',
            '  function clampPhi(p) { const eps = 0.02; return Math.max(eps, Math.min(Math.PI - eps, p)); }\n',
            '  phi = clampPhi(phi);\n',
            '\n',
            '  function updateCameraPosition() {\n',
            '    camZoom = Math.max(zoomMin, Math.min(zoomMax, camZoom));\n',
            '    const r = baseRadius / camZoom;\n',
            '    const x = target.x + r * Math.sin(phi) * Math.sin(theta);\n',
            '    const y = target.y + r * Math.cos(phi);\n',
            '    const z = target.z + r * Math.sin(phi) * Math.cos(theta);\n',
            '    camera.position.set(x, y, z);\n',
            '    camera.lookAt(target);\n',
            '    camera.updateMatrixWorld();\n',
            '  }\n',
            '\n',
            '  // ---------- Оси (каждая по отдельности включаемая, своя дальность) ----------\n',
            '  const axesGroup = new THREE.Group();\n',
            '  function axisLine(dir, color) {\n',
            '    const half = dir.clone().multiplyScalar(0.5);\n',
            '    const geo = new THREE.BufferGeometry().setFromPoints([half.clone().negate(), half]);\n',
            '    const mat = new THREE.LineBasicMaterial({ color: color });\n',
            '    return new THREE.Line(geo, mat);\n',
            '  }\n',
            '  if (showAxisX) axesGroup.add(axisLine(new THREE.Vector3(axesSize, 0, 0), 0xff5555));\n',
            '  if (showAxisY) axesGroup.add(axisLine(new THREE.Vector3(0, axesSize, 0), 0x55ff77));\n',
            '  if (showAxisZ) axesGroup.add(axisLine(new THREE.Vector3(0, 0, axesSize), 0x5599ff));\n',
            '  scene.add(axesGroup);\n',
            '\n',
            '  // ---------- Сетка: три независимые плоскости (по одной на каждую ось-нормаль).\n',
            '  // Материал сделан полностью непрозрачным (приглушённым цветом, а не альфой):\n',
            '  // иначе сетка попадает в ту же очередь прозрачных объектов, что и заливки граней,\n',
            '  // и из-за непредсказуемой сортировки по глубине либо "просвечивает" сквозь них,\n',
            '  // либо смешивает цвета в неверном порядке. ----------\n',
            '  const gridGroup = new THREE.Group();\n',
            '  function makeGrid(rotAxis) {\n',
            '    const divisions = Math.max(2, Math.min(40, Math.round(gridSize)));\n',
            '    const g = new THREE.GridHelper(gridSize, divisions, 0x555555, 0x333333);\n',
            '    if (rotAxis === \'x\') g.rotation.z = Math.PI / 2; // сетка в плоскости YZ (нормаль X)\n',
            '    if (rotAxis === \'z\') g.rotation.x = Math.PI / 2; // сетка в плоскости XY (нормаль Z)\n',
            '    return g; // rotAxis === \'y\' -> плоскость XZ ("пол"), без поворота\n',
            '  }\n',
            '  if (showGridX) gridGroup.add(makeGrid(\'x\'));\n',
            '  if (showGridY) gridGroup.add(makeGrid(\'y\'));\n',
            '  if (showGridZ) gridGroup.add(makeGrid(\'z\'));\n',
            '  scene.add(gridGroup);\n',
            '\n',
            '  // ---------- Точки ----------\n',
            '  const worldScale = Math.max(fieldW, fieldH, fieldD) / 20;\n',
            '  const pointObjs = pointsData.map(function(p) {\n',
            '    const color = p.color || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '    const r = Math.max(0.16 * (p.size || 1) * worldScale, 0.03);\n',
            '    let geo;\n',
            '    if (p.shape === \'square\') geo = new THREE.BoxGeometry(r * 1.7, r * 1.7, r * 1.7);\n',
            '    else geo = new THREE.SphereGeometry(r, 16, 12);\n',
            '    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.05 });\n',
            '    const mesh = new THREE.Mesh(geo, mat);\n',
            '    const pos = p.pos || { x: 0, y: 0, z: 0 };\n',
            '    mesh.position.set(pos.x, pos.y, pos.z || 0);\n',
            '    mesh.visible = p.active !== false;\n',
            '    mesh.userData.hitRadius = r * 1.8;\n',
            '    scene.add(mesh);\n',
            '    let label = null;\n',
            '    if (p.name && p.textEnabled !== false) {\n',
            '      label = document.createElement(\'div\');\n',
            '      label.className = \'gc3-label\';\n',
            '      label.textContent = (p.textEnabled && p.textValue) ? p.textValue : p.name;\n',
            '      label.style.color = p.textColor || color;\n',
            '      label.style.fontSize = (0.8 * (p.textSize || 1)) + \'rem\';\n',
            '      labelLayer.appendChild(label);\n',
            '    }\n',
            '    return { name: p.name, mesh: mesh, label: label, active: p.active !== false, activeExpr: p.activeExpr, dynamic: !!p.dynamic };\n',
            '  });\n',
            '  function findPoint(name) { return pointObjs.find(function(o) { return o.name === name; }); }\n',
            '\n',
            '  // ---------- Отрезки (в виде тонких цилиндров) ----------\n',
            '  const lineObjs = linesData.map(function(l) {\n',
            '    const a = findPoint(l.pointA), b = findPoint(l.pointB);\n',
            '    if (!a || !b) return null;\n',
            '    const color = l.color || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '    const radius = Math.max(0.035 * (l.thickness || 2.5) / 2.5 * worldScale, 0.008);\n',
            '    const geo = new THREE.CylinderGeometry(radius, radius, 1, 8, 1);\n',
            '    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });\n',
            '    const mesh = new THREE.Mesh(geo, mat);\n',
            '    mesh.visible = l.active !== false;\n',
            '    scene.add(mesh);\n',
            '    return { name: l.name, a: a, b: b, mesh: mesh, active: l.active !== false, activeExpr: l.activeExpr };\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '\n',
            '  function updateLineMesh(lo) {\n',
            '    const pa = lo.a.mesh.position, pb = lo.b.mesh.position;\n',
            '    const dir = new THREE.Vector3().subVectors(pb, pa);\n',
            '    const len = dir.length();\n',
            '    lo.mesh.scale.set(1, len || 0.0001, 1);\n',
            '    lo.mesh.position.copy(pa).add(pb).multiplyScalar(0.5);\n',
            '    const up = new THREE.Vector3(0, 1, 0);\n',
            '    if (len > 1e-6) {\n',
            '      const dn = dir.clone().normalize();\n',
            '      const axis = new THREE.Vector3().crossVectors(up, dn);\n',
            '      const angle = Math.acos(Math.max(-1, Math.min(1, up.dot(dn))));\n',
            '      if (axis.lengthSq() < 1e-8) { lo.mesh.quaternion.identity(); if (angle > 3) lo.mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI); }\n',
            '      else { lo.mesh.quaternion.setFromAxisAngle(axis.normalize(), angle); }\n',
            '    }\n',
            '  }\n',
            '\n',
            '  // ---------- Figure: как и в 2D — просто именованная группа ссылок на объекты,\n',
            '  // без собственной геометрии (для заливки граней используется draw Filling).\n',
            '  const figureObjs = figuresData.map(function(f) {\n',
            '    const elements = (f.elements || []).map(function(name) {\n',
            '      return findPoint(name) || lineObjs.find(function(l) { return l.name === name; });\n',
            '    }).filter(function(x) { return x !== undefined; });\n',
            '    return { name: f.name, elements: elements, active: f.active !== false };\n',
            '  });\n',
            '\n',
            '  // ---------- draw Filling: плоская грань по списку точек фигуры (elements) ----------\n',
            '  const fillingObjs = fillingsData.map(function(d) {\n',
            '    if (!d.figure) return null;\n',
            '    const fig = figuresData.find(function(f) { return f.name === d.figure; });\n',
            '    if (!fig) return null;\n',
            '    const pts = (fig.elements || []).map(findPoint).filter(function(x) { return x; });\n',
            '    if (pts.length < 3) return null;\n',
            '    const color = d.color || \'', theme.accent, '\';\n',
            '    const opacity = (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity;\n',
            '    const geo = new THREE.BufferGeometry();\n',
            '    // depthWrite: true — грань корректно пишет свою глубину, поэтому сетка, оси\n',
            '    // и другие грани позади неё больше не "просвечивают" сквозь неё, а соседние\n',
            '    // полупрозрачные грани не смешивают цвета в произвольном порядке.\n',
            '    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6, transparent: opacity < 1, opacity: opacity, side: THREE.DoubleSide, depthWrite: true });\n',
            '    const mesh = new THREE.Mesh(geo, mat);\n',
            '    scene.add(mesh);\n',
            '    return { name: d.name, pts: pts, mesh: mesh, activeExpr: d.activeExpr, active: d.active !== false };\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '\n',
            '  function updateFillingMesh(fo) {\n',
            '    const positions = fo.pts.map(function(p) { return p.mesh.position; });\n',
            '    const vertsFlat = [];\n',
            '    for (let i = 0; i < positions.length; i++) { vertsFlat.push(positions[i].x, positions[i].y, positions[i].z); }\n',
            '    const idx = [];\n',
            '    for (let i = 1; i < positions.length - 1; i++) { idx.push(0, i, i + 1); }\n',
            '    const geo = fo.mesh.geometry;\n',
            '    geo.setAttribute(\'position\', new THREE.Float32BufferAttribute(vertsFlat, 3));\n',
            '    geo.setIndex(idx);\n',
            '    geo.computeVertexNormals();\n',
            '  }\n',
            '\n',
            '  // ---------- draw Vector: стрелка-указатель направления вдоль отрезка ----------\n',
            '  // Синтаксис (edge, pos, direct, color, length, thickness) — тот же, что в 2D.\n',
            '  // length/thickness трактуются как мировые единицы (а не пиксели, как в 2D),\n',
            '  // по умолчанию считаются от того же масштаба, что размер точек/линий.\n',
            '  const vectorObjs = drawVectorsData.map(function(d) {\n',
            '    const lineObj = lineObjs.find(function(l) { return l.name === d.edge; });\n',
            '    if (!lineObj) return null;\n',
            '    const color = d.color || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '    const length = (typeof d.length === \'number\') ? d.length : worldScale * 0.6;\n',
            '    const thick = (typeof d.thickness === \'number\') ? d.thickness : worldScale * 0.16;\n',
            '    const geo = new THREE.ConeGeometry(Math.max(thick, 0.01), Math.max(length, 0.02), 12);\n',
            '    geo.translate(0, Math.max(length, 0.02) / 2, 0);\n',
            '    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });\n',
            '    const mesh = new THREE.Mesh(geo, mat);\n',
            '    scene.add(mesh);\n',
            '    const t = ((typeof d.pos === \'number\') ? d.pos : 0) * 0.5 + 0.5;\n',
            '    const direct = (d.direct < 0) ? -1 : 1;\n',
            '    return { name: d.name, line: lineObj, t: t, direct: direct, mesh: mesh };\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '\n',
            '  function updateVectorMesh(vo) {\n',
            '    const a = vo.line.a.mesh.position, b = vo.line.b.mesh.position;\n',
            '    const dir = new THREE.Vector3().subVectors(b, a);\n',
            '    if (dir.lengthSq() < 1e-10) { vo.mesh.visible = false; return; }\n',
            '    vo.mesh.visible = true;\n',
            '    const base = new THREE.Vector3().lerpVectors(a, b, vo.t);\n',
            '    dir.normalize().multiplyScalar(vo.direct);\n',
            '    vo.mesh.position.copy(base);\n',
            '    const up = new THREE.Vector3(0, 1, 0);\n',
            '    const axis = new THREE.Vector3().crossVectors(up, dir);\n',
            '    const angle = Math.acos(Math.max(-1, Math.min(1, up.dot(dir))));\n',
            '    if (axis.lengthSq() < 1e-8) { vo.mesh.quaternion.identity(); if (angle > 3) vo.mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI); }\n',
            '    else vo.mesh.quaternion.setFromAxisAngle(axis.normalize(), angle);\n',
            '  }\n',
            '\n',
            '  // ---------- Готовые объёмные примитивы (new Primitive): куб, прямоугольный\n',
            '  // параллелепипед, шар, цилиндр, конус, правильные пирамида/призма (через\n',
            '  // ConeGeometry/CylinderGeometry с radialSegments = sides), правильные\n',
            '  // многогранники и тор. Площадь и объём уже посчитаны на этапе компиляции\n',
            '  // (см. primitivesData[i].area / .volume) и здесь только отображаются. ----------\n',
            '  function buildPrimitiveGeometry(pr) {\n',
            '    switch (pr.type) {\n',
            '      case \'cube\': return new THREE.BoxGeometry(pr.edge, pr.edge, pr.edge);\n',
            '      case \'box\': return new THREE.BoxGeometry(pr.width, pr.height, pr.depth);\n',
            '      case \'sphere\': return new THREE.SphereGeometry(pr.radius, 24, 16);\n',
            '      case \'cylinder\': return new THREE.CylinderGeometry(pr.radius, pr.radius, pr.height, 24);\n',
            '      case \'cone\': return new THREE.ConeGeometry(pr.radius, pr.height, 24);\n',
            '      case \'pyramid\': return new THREE.ConeGeometry(pr.radius, pr.height, pr.sides);\n',
            '      case \'prism\': return new THREE.CylinderGeometry(pr.radius, pr.radius, pr.height, pr.sides);\n',
            '      case \'tetrahedron\': return new THREE.TetrahedronGeometry(pr.edge * Math.sqrt(6) / 4);\n',
            '      case \'octahedron\': return new THREE.OctahedronGeometry(pr.edge * Math.SQRT2 / 2);\n',
            '      case \'dodecahedron\': return new THREE.DodecahedronGeometry(pr.edge * Math.sqrt(3) * (1 + Math.sqrt(5)) / 4);\n',
            '      case \'icosahedron\': return new THREE.IcosahedronGeometry(pr.edge * Math.sqrt(10 + 2 * Math.sqrt(5)) / 4);\n',
            '      case \'torus\': return new THREE.TorusGeometry(pr.radius, pr.tube, 16, 100);\n',
            '      default: return new THREE.BoxGeometry(1, 1, 1);\n',
            '    }\n',
            '  }\n',
            '  function fmtMetric(v) {\n',
            '    if (!isFinite(v)) return \'—\';\n',
            '    if (v === 0) return \'0\';\n',
            '    const a = Math.abs(v);\n',
            '    const digits = (a >= 100) ? 1 : (a >= 1 ? 2 : 4);\n',
            '    return v.toFixed(digits).replace(/\\.?0+$/, \'\');\n',
            '  }\n',
            '  const primitiveObjs = primitivesData.map(function(pr) {\n',
            '    const color = pr.color || \'', theme.accent, '\';\n',
            '    const geo = buildPrimitiveGeometry(pr);\n',
            '    const mat = new THREE.MeshStandardMaterial({\n',
            '      color: color, roughness: 0.45, metalness: 0.05, wireframe: !!pr.wireframe,\n',
            '      transparent: pr.opacity < 1, opacity: (typeof pr.opacity === \'number\') ? pr.opacity : 1, side: THREE.DoubleSide,\n',
            '    });\n',
            '    const mesh = new THREE.Mesh(geo, mat);\n',
            '    const pos = pr.pos || { x: 0, y: 0, z: 0 };\n',
            '    mesh.position.set(pos.x, pos.y, pos.z || 0);\n',
            '    const rot = pr.rotateDeg || { x: 0, y: 0, z: 0 };\n',
            '    mesh.rotation.set(rot.x * Math.PI / 180, rot.y * Math.PI / 180, rot.z * Math.PI / 180);\n',
            '    mesh.visible = pr.active !== false;\n',
            '    scene.add(mesh);\n',
            '    let label = null;\n',
            '    if (pr.showInfo) {\n',
            '      label = document.createElement(\'div\');\n',
            '      label.className = \'gc3-label\';\n',
            '      label.style.color = pr.textColor || color;\n',
            '      label.style.fontSize = (0.8 * (pr.textSize || 1)) + \'rem\';\n',
            '      label.textContent = pr.name + \': S = \' + fmtMetric(pr.area) + \', V = \' + fmtMetric(pr.volume);\n',
            '      labelLayer.appendChild(label);\n',
            '    }\n',
            '    return { name: pr.name, type: pr.type, mesh: mesh, label: label, active: pr.active !== false, activeExpr: pr.activeExpr, area: pr.area, volume: pr.volume, colorHex: color, hiddenByDerived: false };\n',
            '  });\n',
            '\n',
            '  // ---------- Сечения (new Section) и булевы операции (new Boolean) над объёмными\n',
            '  // примитивами. Оба типа реализованы поверх треугольных сеток в мировых координатах:\n',
            '  // Section — попарное отсечение треугольников плоскостью + заделка среза веером\n',
            '  // от центроида контура; Boolean — классический BSP-алгоритм (Evan Wallace, csg.js).\n',
            '  // Площадь/объём считаются численно по итоговой сетке (теорема о дивергенции для\n',
            '  // объёма, сумма площадей треугольников для площади) — точно для гранных тел и с\n',
            '  // точностью тесселяции для тел с кривыми поверхностями (шар, цилиндр, конус, тор).\n',
            '  function meshWorldTriangles(mesh) {\n',
            '    mesh.updateMatrixWorld(true);\n',
            '    const geo = mesh.geometry;\n',
            '    const posAttr = geo.attributes.position;\n',
            '    const idx = geo.index;\n',
            '    const mat = mesh.matrixWorld;\n',
            '    const tris = [];\n',
            '    function vAt(i) { return new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)).applyMatrix4(mat); }\n',
            '    if (idx) {\n',
            '      for (let i = 0; i < idx.count; i += 3) tris.push([vAt(idx.getX(i)), vAt(idx.getX(i + 1)), vAt(idx.getX(i + 2))]);\n',
            '    } else {\n',
            '      for (let i = 0; i < posAttr.count; i += 3) tris.push([vAt(i), vAt(i + 1), vAt(i + 2)]);\n',
            '    }\n',
            '    return tris;\n',
            '  }\n',
            '  function trianglesVolumeArea(tris) {\n',
            '    let vol = 0, area = 0;\n',
            '    for (const t of tris) {\n',
            '      const a = t[0], b = t[1], c = t[2];\n',
            '      vol += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;\n',
            '      area += new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).length() / 2;\n',
            '    }\n',
            '    return { volume: Math.abs(vol), area: area };\n',
            '  }\n',
            '  function trianglesToBufferGeometry(tris) {\n',
            '    const geo = new THREE.BufferGeometry();\n',
            '    const arr = new Float32Array(tris.length * 9);\n',
            '    for (let i = 0; i < tris.length; i++) {\n',
            '      const a = tris[i][0], b = tris[i][1], c = tris[i][2];\n',
            '      arr.set([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z], i * 9);\n',
            '    }\n',
            '    geo.setAttribute(\'position\', new THREE.BufferAttribute(arr, 3));\n',
            '    if (tris.length) { geo.computeVertexNormals(); geo.computeBoundingSphere(); }\n',
            '    return geo;\n',
            '  }\n',
            '  // ---- BSP CSG (порт классического алгоритма Evan Wallace, csg.js, общественное достояние) ----\n',
            '  const CSG3 = (function () {\n',
            '    const EPS = 1e-5;\n',
            '    function CVertex(pos, normal) { this.pos = pos.clone(); this.normal = normal ? normal.clone() : new THREE.Vector3(); }\n',
            '    CVertex.prototype.clone = function () { return new CVertex(this.pos, this.normal); };\n',
            '    CVertex.prototype.flip = function () { this.normal.multiplyScalar(-1); };\n',
            '    CVertex.prototype.interpolate = function (other, t) {\n',
            '      return new CVertex(this.pos.clone().lerp(other.pos, t), this.normal.clone().lerp(other.normal, t));\n',
            '    };\n',
            '    function CPlane(normal, w) { this.normal = normal; this.w = w; }\n',
            '    CPlane.fromPoints = function (a, b, c) {\n',
            '      const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();\n',
            '      return new CPlane(n, n.dot(a));\n',
            '    };\n',
            '    CPlane.prototype.clone = function () { return new CPlane(this.normal.clone(), this.w); };\n',
            '    CPlane.prototype.flip = function () { this.normal.multiplyScalar(-1); this.w = -this.w; };\n',
            '    CPlane.prototype.splitPolygon = function (polygon, coplanarFront, coplanarBack, front, back) {\n',
            '      const COPLANAR = 0, FRONT = 1, BACK = 2, SPANNING = 3;\n',
            '      let polygonType = 0;\n',
            '      const types = [];\n',
            '      for (let i = 0; i < polygon.vertices.length; i++) {\n',
            '        const t = this.normal.dot(polygon.vertices[i].pos) - this.w;\n',
            '        const type = (t < -EPS) ? BACK : (t > EPS) ? FRONT : COPLANAR;\n',
            '        polygonType |= type;\n',
            '        types.push(type);\n',
            '      }\n',
            '      if (polygonType === COPLANAR) {\n',
            '        (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);\n',
            '      } else if (polygonType === FRONT) {\n',
            '        front.push(polygon);\n',
            '      } else if (polygonType === BACK) {\n',
            '        back.push(polygon);\n',
            '      } else {\n',
            '        const f = [], b = [];\n',
            '        for (let i = 0; i < polygon.vertices.length; i++) {\n',
            '          const j = (i + 1) % polygon.vertices.length;\n',
            '          const ti = types[i], tj = types[j];\n',
            '          const vi = polygon.vertices[i], vj = polygon.vertices[j];\n',
            '          if (ti !== BACK) f.push(vi);\n',
            '          if (ti !== FRONT) b.push(ti !== BACK ? vi.clone() : vi);\n',
            '          if ((ti | tj) === SPANNING) {\n',
            '            const t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(new THREE.Vector3().subVectors(vj.pos, vi.pos));\n',
            '            const v = vi.interpolate(vj, t);\n',
            '            f.push(v); b.push(v.clone());\n',
            '          }\n',
            '        }\n',
            '        if (f.length >= 3) front.push(new CPolygon(f));\n',
            '        if (b.length >= 3) back.push(new CPolygon(b));\n',
            '      }\n',
            '    };\n',
            '    function CPolygon(vertices) { this.vertices = vertices; this.plane = CPlane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos); }\n',
            '    CPolygon.prototype.clone = function () { return new CPolygon(this.vertices.map(function (v) { return v.clone(); })); };\n',
            '    CPolygon.prototype.flip = function () { this.vertices.reverse(); for (const v of this.vertices) v.flip(); this.plane.flip(); };\n',
            '    function CNode(polygons) { this.plane = null; this.front = null; this.back = null; this.polygons = []; if (polygons) this.build(polygons); }\n',
            '    CNode.prototype.clone = function () {\n',
            '      const node = new CNode();\n',
            '      node.plane = this.plane && this.plane.clone();\n',
            '      node.front = this.front && this.front.clone();\n',
            '      node.back = this.back && this.back.clone();\n',
            '      node.polygons = this.polygons.map(function (p) { return p.clone(); });\n',
            '      return node;\n',
            '    };\n',
            '    CNode.prototype.invert = function () {\n',
            '      for (const p of this.polygons) p.flip();\n',
            '      this.plane.flip();\n',
            '      if (this.front) this.front.invert();\n',
            '      if (this.back) this.back.invert();\n',
            '      const tmp = this.front; this.front = this.back; this.back = tmp;\n',
            '    };\n',
            '    CNode.prototype.clipPolygons = function (polygons) {\n',
            '      if (!this.plane) return polygons.slice();\n',
            '      let front = [], back = [];\n',
            '      for (const p of polygons) this.plane.splitPolygon(p, front, back, front, back);\n',
            '      if (this.front) front = this.front.clipPolygons(front);\n',
            '      if (this.back) back = this.back.clipPolygons(back); else back = [];\n',
            '      return front.concat(back);\n',
            '    };\n',
            '    CNode.prototype.clipTo = function (bsp) {\n',
            '      this.polygons = bsp.clipPolygons(this.polygons);\n',
            '      if (this.front) this.front.clipTo(bsp);\n',
            '      if (this.back) this.back.clipTo(bsp);\n',
            '    };\n',
            '    CNode.prototype.allPolygons = function () {\n',
            '      let polygons = this.polygons.slice();\n',
            '      if (this.front) polygons = polygons.concat(this.front.allPolygons());\n',
            '      if (this.back) polygons = polygons.concat(this.back.allPolygons());\n',
            '      return polygons;\n',
            '    };\n',
            '    CNode.prototype.build = function (polygons) {\n',
            '      if (!polygons.length) return;\n',
            '      if (!this.plane) this.plane = polygons[0].plane.clone();\n',
            '      const front = [], back = [];\n',
            '      for (const p of polygons) this.plane.splitPolygon(p, this.polygons, this.polygons, front, back);\n',
            '      if (front.length) { if (!this.front) this.front = new CNode(); this.front.build(front); }\n',
            '      if (back.length) { if (!this.back) this.back = new CNode(); this.back.build(back); }\n',
            '    };\n',
            '    function trisToPolygons(tris) {\n',
            '      return tris.map(function (t) {\n',
            '        const n = new THREE.Vector3().subVectors(t[1], t[0]).cross(new THREE.Vector3().subVectors(t[2], t[0])).normalize();\n',
            '        return new CPolygon([new CVertex(t[0], n), new CVertex(t[1], n), new CVertex(t[2], n)]);\n',
            '      });\n',
            '    }\n',
            '    function polygonsToTris(polygons) {\n',
            '      const tris = [];\n',
            '      for (const poly of polygons) {\n',
            '        for (let i = 2; i < poly.vertices.length; i++) {\n',
            '          tris.push([poly.vertices[0].pos.clone(), poly.vertices[i - 1].pos.clone(), poly.vertices[i].pos.clone()]);\n',
            '        }\n',
            '      }\n',
            '      return tris;\n',
            '    }\n',
            '    function runOp(aTris, bTris, kind) {\n',
            '      const A = new CNode(trisToPolygons(aTris));\n',
            '      const B = new CNode(trisToPolygons(bTris));\n',
            '      if (kind === \'union\') {\n',
            '        A.clipTo(B); B.clipTo(A); B.invert(); B.clipTo(A); B.invert(); A.build(B.allPolygons());\n',
            '      } else if (kind === \'subtract\') {\n',
            '        A.invert(); A.clipTo(B); B.clipTo(A); B.invert(); B.clipTo(A); B.invert(); A.build(B.allPolygons()); A.invert();\n',
            '      } else {\n',
            '        A.invert(); B.clipTo(A); B.invert(); A.clipTo(B); B.clipTo(A); A.build(B.allPolygons()); A.invert();\n',
            '      }\n',
            '      return polygonsToTris(A.allPolygons());\n',
            '    }\n',
            '    return {\n',
            '      union: function (a, b) { return runOp(a, b, \'union\'); },\n',
            '      subtract: function (a, b) { return runOp(a, b, \'subtract\'); },\n',
            '      intersect: function (a, b) { return runOp(a, b, \'intersect\'); },\n',
            '    };\n',
            '  })();\n',
            '  // ---- Отсечение сетки плоскостью (для new Section) ----\n',
            '  function clipTrianglesByPlane(tris, normalV, offsetW, keepSign) {\n',
            '    const EPS = 1e-6;\n',
            '    const kept = [];\n',
            '    const boundaryEdges = [];\n',
            '    function side(v) { return (normalV.dot(v) - offsetW) * keepSign; }\n',
            '    for (const tri of tris) {\n',
            '      const a = tri[0], b = tri[1], c = tri[2];\n',
            '      const da = side(a), db = side(b), dc = side(c);\n',
            '      const ka = da >= -EPS, kb = db >= -EPS, kc = dc >= -EPS;\n',
            '      const cnt = (ka ? 1 : 0) + (kb ? 1 : 0) + (kc ? 1 : 0);\n',
            '      if (cnt === 3) { kept.push([a, b, c]); continue; }\n',
            '      if (cnt === 0) continue;\n',
            '      const verts = [a, b, c], flags = [ka, kb, kc], dist = [da, db, dc];\n',
            '      function interp(i, j) {\n',
            '        const t = dist[i] / (dist[i] - dist[j]);\n',
            '        return verts[i].clone().lerp(verts[j], t);\n',
            '      }\n',
            '      if (cnt === 1) {\n',
            '        const i = flags.indexOf(true);\n',
            '        const j = (i + 1) % 3, k = (i + 2) % 3;\n',
            '        const p1 = interp(i, j), p2 = interp(i, k);\n',
            '        kept.push([verts[i], p1, p2]);\n',
            '        boundaryEdges.push([p1, p2]);\n',
            '      } else {\n',
            '        const i = flags.indexOf(false);\n',
            '        const j = (i + 1) % 3, k = (i + 2) % 3;\n',
            '        const pij = interp(i, j), pki = interp(k, i);\n',
            '        kept.push([verts[j], verts[k], pki]);\n',
            '        kept.push([verts[j], pki, pij]);\n',
            '        boundaryEdges.push([pij, pki]);\n',
            '      }\n',
            '    }\n',
            '    return { kept: kept, boundaryEdges: boundaryEdges };\n',
            '  }\n',
            '  function chainBoundaryLoops(edges) {\n',
            '    const EPS = 1e-4;\n',
            '    function key(v) { return Math.round(v.x / EPS) + \'_\' + Math.round(v.y / EPS) + \'_\' + Math.round(v.z / EPS); }\n',
            '    const ptByKey = new Map();\n',
            '    const adj = new Map();\n',
            '    function reg(v) { const k = key(v); if (!ptByKey.has(k)) ptByKey.set(k, v.clone()); return k; }\n',
            '    for (const e of edges) {\n',
            '      const ka = reg(e[0]), kb = reg(e[1]);\n',
            '      if (ka === kb) continue;\n',
            '      if (!adj.has(ka)) adj.set(ka, []);\n',
            '      if (!adj.has(kb)) adj.set(kb, []);\n',
            '      adj.get(ka).push(kb);\n',
            '      adj.get(kb).push(ka);\n',
            '    }\n',
            '    const visited = new Set();\n',
            '    const loops = [];\n',
            '    for (const startKey of adj.keys()) {\n',
            '      if (visited.has(startKey)) continue;\n',
            '      const loopKeys = [startKey];\n',
            '      visited.add(startKey);\n',
            '      let prevKey = null, curKey = startKey;\n',
            '      let guard = 0;\n',
            '      while (guard++ < 100000) {\n',
            '        const neighbors = (adj.get(curKey) || []).filter(function (k) { return k !== prevKey; });\n',
            '        const nextKey = neighbors.find(function (k) { return !visited.has(k); });\n',
            '        if (nextKey === undefined) break;\n',
            '        loopKeys.push(nextKey);\n',
            '        visited.add(nextKey);\n',
            '        prevKey = curKey;\n',
            '        curKey = nextKey;\n',
            '      }\n',
            '      if (loopKeys.length >= 3) loops.push(loopKeys.map(function (k) { return ptByKey.get(k); }));\n',
            '    }\n',
            '    return loops;\n',
            '  }\n',
            '  function capFromLoop(loopPts, outwardNormal) {\n',
            '    if (loopPts.length < 3) return { tris: [], area: 0 };\n',
            '    const centroid = new THREE.Vector3();\n',
            '    for (const p of loopPts) centroid.add(p);\n',
            '    centroid.divideScalar(loopPts.length);\n',
            '    const n = new THREE.Vector3();\n',
            '    for (let i = 0; i < loopPts.length; i++) {\n',
            '      const cur = loopPts[i], nxt = loopPts[(i + 1) % loopPts.length];\n',
            '      n.x += (cur.y - nxt.y) * (cur.z + nxt.z);\n',
            '      n.y += (cur.z - nxt.z) * (cur.x + nxt.x);\n',
            '      n.z += (cur.x - nxt.x) * (cur.y + nxt.y);\n',
            '    }\n',
            '    n.normalize();\n',
            '    const pts = (n.dot(outwardNormal) < 0) ? loopPts.slice().reverse() : loopPts;\n',
            '    const tris = [];\n',
            '    let area = 0;\n',
            '    for (let i = 0; i < pts.length; i++) {\n',
            '      const a = centroid, b = pts[i], c = pts[(i + 1) % pts.length];\n',
            '      tris.push([a, b, c]);\n',
            '      area += new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).length() / 2;\n',
            '    }\n',
            '    return { tris: tris, area: area };\n',
            '  }\n',
            '  // ---- Единый (в порядке объявления в файле) проход по Section/Boolean ----\n',
            '  const derivedFallbackColor = \'', theme.accent, '\';\n',
            '  const derivedObjs = [];\n',
            '  function findDerivedTriSource(name) {\n',
            '    const pr = primitiveObjs.find(function (o) { return o.name === name; });\n',
            '    if (pr) return { tris: meshWorldTriangles(pr.mesh), colorHex: pr.colorHex };\n',
            '    const d = derivedObjs.find(function (o) { return o.name === name; });\n',
            '    if (d) return { tris: d.triangles, colorHex: d.colorHex };\n',
            '    return null;\n',
            '  }\n',
            '  function markHiddenByDerived(name) {\n',
            '    const pr = primitiveObjs.find(function (o) { return o.name === name; });\n',
            '    if (pr) { pr.hiddenByDerived = true; pr.mesh.visible = false; if (pr.label) pr.label.style.display = \'none\'; return; }\n',
            '    const d = derivedObjs.find(function (o) { return o.name === name; });\n',
            '    if (d) { d.hiddenByDerived = true; if (d.mesh) d.mesh.visible = false; if (d.capMesh) d.capMesh.visible = false; if (d.label) d.label.style.display = \'none\'; }\n',
            '  }\n',
            '  for (const opData of derivedOpsData) {\n',
            '    if (opData.kind === \'section\') {\n',
            '      const src = findDerivedTriSource(opData.source);\n',
            '      if (!src) continue;\n',
            '      const normalV = new THREE.Vector3(opData.normal.x, opData.normal.y, opData.normal.z);\n',
            '      const keepSign = (opData.keep === \'negative\') ? -1 : 1;\n',
            '      const clip = clipTrianglesByPlane(src.tris, normalV, opData.offset, keepSign);\n',
            '      const loops = chainBoundaryLoops(clip.boundaryEdges);\n',
            '      const outwardCapNormal = normalV.clone().multiplyScalar(-keepSign);\n',
            '      let capTris = [], cutArea = 0;\n',
            '      for (const loop of loops) {\n',
            '        const capResult = capFromLoop(loop, outwardCapNormal);\n',
            '        capTris = capTris.concat(capResult.tris);\n',
            '        cutArea += capResult.area;\n',
            '      }\n',
            '      let bodyTris = clip.kept, allCapTris = capTris;\n',
            '      if (opData.explode) {\n',
            '        const shift = normalV.clone().multiplyScalar(keepSign * opData.explode);\n',
            '        bodyTris = bodyTris.map(function (t) { return [t[0].clone().add(shift), t[1].clone().add(shift), t[2].clone().add(shift)]; });\n',
            '        allCapTris = allCapTris.map(function (t) { return [t[0].clone().add(shift), t[1].clone().add(shift), t[2].clone().add(shift)]; });\n',
            '      }\n',
            '      const closedTris = bodyTris.concat(allCapTris);\n',
            '      const metrics = trianglesVolumeArea(closedTris);\n',
            '      const color = opData.color || src.colorHex || derivedFallbackColor;\n',
            '      const capColor = opData.capColor || color;\n',
            '      let bodyMesh = null;\n',
            '      if (bodyTris.length) {\n',
            '        const bodyGeo = trianglesToBufferGeometry(bodyTris);\n',
            '        const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.45, metalness: 0.05, wireframe: !!opData.wireframe, transparent: opData.opacity < 1, opacity: (typeof opData.opacity === \'number\') ? opData.opacity : 1, side: THREE.DoubleSide });\n',
            '        bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);\n',
            '        bodyMesh.visible = opData.active !== false;\n',
            '        scene.add(bodyMesh);\n',
            '      }\n',
            '      let capMesh = null;\n',
            '      if (allCapTris.length) {\n',
            '        const capGeo = trianglesToBufferGeometry(allCapTris);\n',
            '        const capMat = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.35, metalness: 0.0, side: THREE.DoubleSide, transparent: opData.opacity < 1, opacity: (typeof opData.opacity === \'number\') ? opData.opacity : 1 });\n',
            '        capMesh = new THREE.Mesh(capGeo, capMat);\n',
            '        capMesh.visible = opData.active !== false;\n',
            '        scene.add(capMesh);\n',
            '      }\n',
            '      let label = null;\n',
            '      if (opData.showInfo) {\n',
            '        label = document.createElement(\'div\');\n',
            '        label.className = \'gc3-label\';\n',
            '        label.style.color = opData.textColor || capColor;\n',
            '        label.style.fontSize = (0.8 * (opData.textSize || 1)) + \'rem\';\n',
            '        label.textContent = opData.name + \': S(сеч.) = \' + fmtMetric(cutArea) + \', V = \' + fmtMetric(metrics.volume);\n',
            '        labelLayer.appendChild(label);\n',
            '      }\n',
            '      if (opData.hideSource !== false) markHiddenByDerived(opData.source);\n',
            '      derivedObjs.push({\n',
            '        name: opData.name, kind: \'section\', triangles: closedTris, mesh: bodyMesh, capMesh: capMesh, label: label,\n',
            '        active: opData.active !== false, activeExpr: opData.activeExpr, hiddenByDerived: false,\n',
            '        area: cutArea, volume: metrics.volume, colorHex: color,\n',
            '      });\n',
            '    } else {\n',
            '      let acc = null;\n',
            '      let firstColor = null;\n',
            '      let ok = true;\n',
            '      for (let i = 0; i < opData.parts.length; i++) {\n',
            '        const src = findDerivedTriSource(opData.parts[i]);\n',
            '        if (!src) { ok = false; break; }\n',
            '        if (i === 0) { firstColor = src.colorHex; acc = src.tris; continue; }\n',
            '        acc = CSG3[opData.op](acc, src.tris);\n',
            '      }\n',
            '      if (!ok || !acc) continue;\n',
            '      const metrics = trianglesVolumeArea(acc);\n',
            '      const color = opData.color || firstColor || derivedFallbackColor;\n',
            '      let mesh = null;\n',
            '      if (acc.length) {\n',
            '        const geo = trianglesToBufferGeometry(acc);\n',
            '        const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.45, metalness: 0.05, wireframe: !!opData.wireframe, transparent: opData.opacity < 1, opacity: (typeof opData.opacity === \'number\') ? opData.opacity : 1, side: THREE.DoubleSide });\n',
            '        mesh = new THREE.Mesh(geo, mat);\n',
            '        mesh.visible = opData.active !== false;\n',
            '        scene.add(mesh);\n',
            '      }\n',
            '      let label = null;\n',
            '      if (opData.showInfo) {\n',
            '        label = document.createElement(\'div\');\n',
            '        label.className = \'gc3-label\';\n',
            '        label.style.color = opData.textColor || color;\n',
            '        label.style.fontSize = (0.8 * (opData.textSize || 1)) + \'rem\';\n',
            '        label.textContent = opData.name + \': S = \' + fmtMetric(metrics.area) + \', V = \' + fmtMetric(metrics.volume);\n',
            '        labelLayer.appendChild(label);\n',
            '      }\n',
            '      if (opData.hideSource !== false) { for (const pName of opData.parts) markHiddenByDerived(pName); }\n',
            '      derivedObjs.push({\n',
            '        name: opData.name, kind: \'boolean\', triangles: acc, mesh: mesh, capMesh: null, label: label,\n',
            '        active: opData.active !== false, activeExpr: opData.activeExpr, hiddenByDerived: false,\n',
            '        area: metrics.area, volume: metrics.volume, colorHex: color,\n',
            '      });\n',
            '    }\n',
            '  }\n',
            '\n',
            '  // ---------- Углы: new Angle (вершина + два ребра, тот же синтаксис, что в 2D)\n',
            '  // и draw Angle (собственно дуга + подпись значения). Мера пересчитывается каждый\n',
            '  // кадр из текущих 3D-позиций точек, поэтому корректно следует за перетаскиванием.\n',
            '  // Параметр side, отвечающий в 2D за выбор стороны/рефлексного угла у плоской прямой,\n',
            '  // в 3D не имеет однозначного смысла (угол между двумя векторами в пространстве\n',
            '  // определён всегда ≤180° и однозначно), поэтому он не используется. ----------\n',
            '  const angleDefs = anglesData.map(function(a) {\n',
            '    const l1 = lineObjs.find(function(l) { return l.name === a.lineNames[0]; });\n',
            '    const l2 = lineObjs.find(function(l) { return l.name === a.lineNames[1]; });\n',
            '    if (!l1 || !l2) return null;\n',
            '    const vertex = [l1.a, l1.b].find(function(p) { return p === l2.a || p === l2.b; });\n',
            '    if (!vertex) return null;\n',
            '    const p1 = (l1.a === vertex) ? l1.b : l1.a;\n',
            '    const p2 = (l2.a === vertex) ? l2.b : l2.a;\n',
            '    return { name: a.name, vertex: vertex, p1: p1, p2: p2, measure: 0 };\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '  function findAngleDef(name) { return angleDefs.find(function(a) { return a.name === name; }); }\n',
            '\n',
            '  const angleObjs = drawAnglesData.map(function(d) {\n',
            '    const def = findAngleDef(d.angleName);\n',
            '    if (!def) return null;\n',
            '    const arcColor = d.arccolor || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '    const measureColor = d.measurecolor || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '    const arcGeo = new THREE.BufferGeometry();\n',
            '    const arcMat = new THREE.LineBasicMaterial({ color: arcColor });\n',
            '    const arcMesh = new THREE.LineSegments(arcGeo, arcMat);\n',
            '    scene.add(arcMesh);\n',
            '    const showMeasure = d.measure !== undefined ? d.measure : true;\n',
            '    let label = null;\n',
            '    if (showMeasure) {\n',
            '      label = document.createElement(\'div\');\n',
            '      label.className = \'gc3-label\';\n',
            '      label.style.color = measureColor;\n',
            '      labelLayer.appendChild(label);\n',
            '    }\n',
            '    return {\n',
            '      name: d.name, def: def,\n',
            '      showArc: d.arc !== undefined ? d.arc : true,\n',
            '      showMeasure: showMeasure,\n',
            '      radiusSpec: (d.radius === undefined || d.radius === null) ? 1 : d.radius,\n',
            '      fractions: !!d.fractions,\n',
            '      count: Math.min(3, Math.max(1, d.count || 1)),\n',
            '      mesh: arcMesh, label: label,\n',
            '      labelPos: new THREE.Vector3(),\n',
            '    };\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '\n',
            '  function resolveAngleRadius(ao) {\n',
            '    const r = ao.radiusSpec;\n',
            '    if (typeof r === \'string\') {\n',
            '      const pt = findPoint(r);\n',
            '      if (pt) return pt.mesh.position.distanceTo(ao.def.vertex.mesh.position);\n',
            '      return 1;\n',
            '    }\n',
            '    if (typeof r !== \'number\' || isNaN(r) || r <= 0) return 1;\n',
            '    return r;\n',
            '  }\n',
            '\n',
            '  function updateAngleObj(ao) {\n',
            '    const V = ao.def.vertex.mesh.position;\n',
            '    const d1raw = new THREE.Vector3().subVectors(ao.def.p1.mesh.position, V);\n',
            '    const d2raw = new THREE.Vector3().subVectors(ao.def.p2.mesh.position, V);\n',
            '    const len1 = d1raw.length(), len2 = d2raw.length();\n',
            '    if (len1 < 1e-6 || len2 < 1e-6) { ao.mesh.visible = false; if (ao.label) ao.label.style.display = \'none\'; return; }\n',
            '    ao.mesh.visible = true;\n',
            '    const d1 = d1raw.clone().normalize();\n',
            '    const d2 = d2raw.clone().normalize();\n',
            '    const dot = Math.max(-1, Math.min(1, d1.dot(d2)));\n',
            '    const theta = Math.acos(dot);\n',
            '    ao.def.measure = theta * 180 / Math.PI;\n',
            '    const r = resolveAngleRadius(ao);\n',
            '    function slerp(s) {\n',
            '      if (theta < 1e-6) return d1.clone();\n',
            '      const a = Math.sin((1 - s) * theta) / Math.sin(theta);\n',
            '      const b = Math.sin(s * theta) / Math.sin(theta);\n',
            '      return d1.clone().multiplyScalar(a).add(d2.clone().multiplyScalar(b));\n',
            '    }\n',
            '    const isRight = Math.abs(ao.def.measure - 90) < 0.5;\n',
            '    const segs = [];\n',
            '    if (ao.showArc) {\n',
            '      for (let k = 0; k < ao.count; k++) {\n',
            '        const rk = r - k * (r * 0.12);\n',
            '        if (rk <= 0) continue;\n',
            '        if (isRight) {\n',
            '          const p0 = V.clone().addScaledVector(d1, rk);\n',
            '          const p2c = V.clone().addScaledVector(d2, rk);\n',
            '          const mid = p0.clone().addScaledVector(d2, rk);\n',
            '          segs.push(p0.x, p0.y, p0.z, mid.x, mid.y, mid.z, mid.x, mid.y, mid.z, p2c.x, p2c.y, p2c.z);\n',
            '        } else {\n',
            '          const N = 20;\n',
            '          let prev = null;\n',
            '          for (let i = 0; i <= N; i++) {\n',
            '            const s = i / N;\n',
            '            const pt = V.clone().addScaledVector(slerp(s), rk);\n',
            '            if (prev) segs.push(prev.x, prev.y, prev.z, pt.x, pt.y, pt.z);\n',
            '            prev = pt;\n',
            '          }\n',
            '        }\n',
            '      }\n',
            '    }\n',
            '    ao.mesh.geometry.setAttribute(\'position\', new THREE.Float32BufferAttribute(segs, 3));\n',
            '    ao.mesh.geometry.computeBoundingSphere();\n',
            '    if (ao.label) {\n',
            '      if (ao.showMeasure) {\n',
            '        const midDir = slerp(0.5);\n',
            '        ao.labelPos.copy(V).addScaledVector(midDir, r * 1.3);\n',
            '        const val = ao.fractions ? Math.round(ao.def.measure * 100) / 100 : Math.round(ao.def.measure);\n',
            '        ao.label.textContent = val + \'\\u00b0\';\n',
            '        ao.label.style.display = \'\';\n',
            '      } else {\n',
            '        ao.label.style.display = \'none\';\n',
            '      }\n',
            '    }\n',
            '  }\n',
            '\n',
            '  // ---------- Углы, специфичные для 3D (new Angle3D): lineLine, linePlane, planePlane,\n',
            '  // dihedral. Каждый тип сводится к «вершина V + два единичных направления d1, d2», после\n',
            '  // чего используется тот же приём отрисовки дуги (slerp по сфере единичного радиуса),\n',
            '  // что и у обычного new Angle — см. updateAngleObj выше. ----------\n',
            '  function resolveVertexRef3D(ref) {\n',
            '    if (ref.point) {\n',
            '      const p = findPoint(ref.point);\n',
            '      if (p) return p.mesh.position;\n',
            '    }\n',
            '    return new THREE.Vector3(ref.pos.x, ref.pos.y, ref.pos.z);\n',
            '  }\n',
            '  function perpComponent3D(v, axis) {\n',
            '    const proj = axis.clone().multiplyScalar(v.dot(axis));\n',
            '    return new THREE.Vector3().subVectors(v, proj);\n',
            '  }\n',
            '  function computeAngle3D(def) {\n',
            '    const r = def.refs;\n',
            '    const A = resolveVertexRef3D(r.a);\n',
            '    let V, d1, d2;\n',
            '    if (def.type === \'lineLine\') {\n',
            '      const B = resolveVertexRef3D(r.b), C = resolveVertexRef3D(r.c), D = resolveVertexRef3D(r.d);\n',
            '      d1 = new THREE.Vector3().subVectors(B, A);\n',
            '      const d2raw = new THREE.Vector3().subVectors(D, C);\n',
            '      if (d1.lengthSq() < 1e-10 || d2raw.lengthSq() < 1e-10) return null;\n',
            '      d1.normalize(); d2raw.normalize();\n',
            '      const dot0 = Math.max(-1, Math.min(1, d1.dot(d2raw)));\n',
            '      if (Math.acos(dot0) > Math.PI / 2) d2raw.multiplyScalar(-1);\n',
            '      d2 = d2raw;\n',
            '      V = def.vertexOverride ? resolveVertexRef3D(def.vertexOverride) : A;\n',
            '    } else if (def.type === \'linePlane\') {\n',
            '      const B = resolveVertexRef3D(r.b), C = resolveVertexRef3D(r.c), Dp = resolveVertexRef3D(r.d), E = resolveVertexRef3D(r.e);\n',
            '      const lineDir = new THREE.Vector3().subVectors(B, A);\n',
            '      if (lineDir.lengthSq() < 1e-10) return null;\n',
            '      lineDir.normalize();\n',
            '      const e1 = new THREE.Vector3().subVectors(Dp, C), e2 = new THREE.Vector3().subVectors(E, C);\n',
            '      const normal = new THREE.Vector3().crossVectors(e1, e2);\n',
            '      if (normal.lengthSq() < 1e-10) return null;\n',
            '      normal.normalize();\n',
            '      let proj = perpComponent3D(lineDir, normal);\n',
            '      if (proj.lengthSq() < 1e-10) {\n',
            '        const arbitrary = Math.abs(normal.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);\n',
            '        proj = perpComponent3D(arbitrary, normal);\n',
            '      }\n',
            '      proj.normalize();\n',
            '      d1 = lineDir; d2 = proj;\n',
            '      V = def.vertexOverride ? resolveVertexRef3D(def.vertexOverride) : A;\n',
            '    } else if (def.type === \'planePlane\') {\n',
            '      const B = resolveVertexRef3D(r.b), C = resolveVertexRef3D(r.c);\n',
            '      const Dp = resolveVertexRef3D(r.d), E = resolveVertexRef3D(r.e), F = resolveVertexRef3D(r.f);\n',
            '      const n1 = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(B, A), new THREE.Vector3().subVectors(C, A));\n',
            '      const n2 = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(E, Dp), new THREE.Vector3().subVectors(F, Dp));\n',
            '      if (n1.lengthSq() < 1e-10 || n2.lengthSq() < 1e-10) return null;\n',
            '      n1.normalize(); n2.normalize();\n',
            '      const axis = new THREE.Vector3().crossVectors(n1, n2);\n',
            '      let v1, v2;\n',
            '      if (axis.lengthSq() < 1e-10) {\n',
            '        v1 = Math.abs(n1.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);\n',
            '        v1 = perpComponent3D(v1, n1).normalize();\n',
            '        v2 = v1.clone();\n',
            '      } else {\n',
            '        axis.normalize();\n',
            '        const B_A = new THREE.Vector3().subVectors(B, A), C_A = new THREE.Vector3().subVectors(C, A);\n',
            '        const E_D = new THREE.Vector3().subVectors(E, Dp), F_D = new THREE.Vector3().subVectors(F, Dp);\n',
            '        const p1a = perpComponent3D(B_A, axis), p1b = perpComponent3D(C_A, axis);\n',
            '        const p2a = perpComponent3D(E_D, axis), p2b = perpComponent3D(F_D, axis);\n',
            '        v1 = (p1a.lengthSq() >= p1b.lengthSq()) ? p1a : p1b;\n',
            '        v2 = (p2a.lengthSq() >= p2b.lengthSq()) ? p2a : p2b;\n',
            '        if (v1.lengthSq() < 1e-10 || v2.lengthSq() < 1e-10) return null;\n',
            '        v1.normalize(); v2.normalize();\n',
            '        const dot0 = Math.max(-1, Math.min(1, v1.dot(v2)));\n',
            '        if (Math.acos(dot0) > Math.PI / 2) v2.multiplyScalar(-1);\n',
            '      }\n',
            '      d1 = v1; d2 = v2;\n',
            '      V = def.vertexOverride ? resolveVertexRef3D(def.vertexOverride) : A;\n',
            '    } else { // dihedral\n',
            '      const B = resolveVertexRef3D(r.b);\n',
            '      const edgeDir = new THREE.Vector3().subVectors(B, A);\n',
            '      if (edgeDir.lengthSq() < 1e-10) return null;\n',
            '      edgeDir.normalize();\n',
            '      const P1 = resolveVertexRef3D(r.c), P2 = resolveVertexRef3D(r.d);\n',
            '      const v1 = perpComponent3D(new THREE.Vector3().subVectors(P1, A), edgeDir);\n',
            '      const v2 = perpComponent3D(new THREE.Vector3().subVectors(P2, A), edgeDir);\n',
            '      if (v1.lengthSq() < 1e-10 || v2.lengthSq() < 1e-10) return null;\n',
            '      v1.normalize(); v2.normalize();\n',
            '      d1 = v1; d2 = v2;\n',
            '      V = def.vertexOverride ? resolveVertexRef3D(def.vertexOverride) : A;\n',
            '    }\n',
            '    return { V: V, d1: d1, d2: d2 };\n',
            '  }\n',
            '  const angle3DObjs = angles3DData.map(function (d) {\n',
            '    const arcColor = d.arccolor || \'', theme.defaultColor, '\';\n',
            '    const measureColor = d.measurecolor || \'', theme.defaultColor, '\';\n',
            '    const arcGeo = new THREE.BufferGeometry();\n',
            '    const arcMat = new THREE.LineBasicMaterial({ color: arcColor });\n',
            '    const arcMesh = new THREE.LineSegments(arcGeo, arcMat);\n',
            '    scene.add(arcMesh);\n',
            '    let label = null;\n',
            '    if (d.showMeasure) {\n',
            '      label = document.createElement(\'div\');\n',
            '      label.className = \'gc3-label\';\n',
            '      label.style.color = measureColor;\n',
            '      labelLayer.appendChild(label);\n',
            '    }\n',
            '    return {\n',
            '      name: d.name, def: d, mesh: arcMesh, label: label,\n',
            '      active: d.active !== false, activeExpr: d.activeExpr,\n',
            '      measure: 0, labelPos: new THREE.Vector3(),\n',
            '    };\n',
            '  });\n',
            '  function updateAngle3DObj(ao) {\n',
            '    const def = ao.def;\n',
            '    const res = computeAngle3D(def);\n',
            '    if (!res) { ao.mesh.visible = false; if (ao.label) ao.label.style.display = \'none\'; return; }\n',
            '    ao.mesh.visible = true;\n',
            '    const V = res.V, d1 = res.d1, d2 = res.d2;\n',
            '    const dot = Math.max(-1, Math.min(1, d1.dot(d2)));\n',
            '    const theta = Math.acos(dot);\n',
            '    ao.measure = theta * 180 / Math.PI;\n',
            '    const r = (typeof def.radius === \'number\' && def.radius > 0) ? def.radius : 1;\n',
            '    function slerp(s) {\n',
            '      if (theta < 1e-6) return d1.clone();\n',
            '      const a = Math.sin((1 - s) * theta) / Math.sin(theta);\n',
            '      const b = Math.sin(s * theta) / Math.sin(theta);\n',
            '      return d1.clone().multiplyScalar(a).add(d2.clone().multiplyScalar(b));\n',
            '    }\n',
            '    const isRight = Math.abs(ao.measure - 90) < 0.5;\n',
            '    const segs = [];\n',
            '    if (def.showArc) {\n',
            '      for (let k = 0; k < def.count; k++) {\n',
            '        const rk = r - k * (r * 0.12);\n',
            '        if (rk <= 0) continue;\n',
            '        if (isRight) {\n',
            '          const p0 = V.clone().addScaledVector(d1, rk);\n',
            '          const p2c = V.clone().addScaledVector(d2, rk);\n',
            '          const mid = p0.clone().addScaledVector(d2, rk);\n',
            '          segs.push(p0.x, p0.y, p0.z, mid.x, mid.y, mid.z, mid.x, mid.y, mid.z, p2c.x, p2c.y, p2c.z);\n',
            '        } else {\n',
            '          const N = 20;\n',
            '          let prev = null;\n',
            '          for (let i = 0; i <= N; i++) {\n',
            '            const s = i / N;\n',
            '            const pt = V.clone().addScaledVector(slerp(s), rk);\n',
            '            if (prev) segs.push(prev.x, prev.y, prev.z, pt.x, pt.y, pt.z);\n',
            '            prev = pt;\n',
            '          }\n',
            '        }\n',
            '      }\n',
            '    }\n',
            '    ao.mesh.geometry.setAttribute(\'position\', new THREE.Float32BufferAttribute(segs, 3));\n',
            '    ao.mesh.geometry.computeBoundingSphere();\n',
            '    if (ao.label) {\n',
            '      if (def.showMeasure) {\n',
            '        const midDir = slerp(0.5);\n',
            '        ao.labelPos.copy(V).addScaledVector(midDir, r * 1.3);\n',
            '        const val = def.fractions ? Math.round(ao.measure * 100) / 100 : Math.round(ao.measure);\n',
            '        ao.label.textContent = def.name + \': \' + val + \'\\u00b0\';\n',
            '        ao.label.style.display = \'\';\n',
            '      } else {\n',
            '        ao.label.style.display = \'none\';\n',
            '      }\n',
            '    }\n',
            '  }\n',
            '\n',
            '  // ---------- Мини-интерпретатор арифметических выражений (для draw Surface / draw Field\n',
            '  // и пользовательских "func f(x, y) = ..."). Поддерживает + - * / % ^, скобки, унарный\n',
            '  // минус, стандартные математические функции и вызовы других объявленных func.\n',
            '  // Не путать с полным языком выражений 2D-сцены — здесь только числовая арифметика,\n',
            '  // этого достаточно для поверхностей и полей. ----------\n',
            '  // Фабрика парсера: один и тот же курсор по исходному тексту умеет разбирать\n',
            '  // как одиночное выражение (g3Parse — для f(x,y), P/Q/R, x(u,v) и т.п.), так и\n',
            '  // последовательность операторов (g3ParseProgram — тело Function/Void: if/else,\n',
            '  // return, присваивания, вызовы). Грамматика выражений: || > && > == != > < > <= >=\n',
            '  // > + - > * / % > ^ (право-ассоц.) > унарные - + ! > атом (число/идент/вызов/скобки).\n',
            '  function g3CreateParser(src) {\n',
            '    let i = 0; const n = src.length;\n',
            '    function skipWs() { while (i < n && /\\s/.test(src[i])) i++; }\n',
            '    function consumeKeyword(kw) {\n',
            '      skipWs();\n',
            '      const save = i;\n',
            '      let j = i; while (j < n && /[a-zA-Z0-9_]/.test(src[j])) j++;\n',
            '      if (src.slice(i, j) === kw) { i = j; return true; }\n',
            '      i = save; return false;\n',
            '    }\n',
            '    function parseNumber() {\n',
            '      let j = i; while (j < n && /[0-9.]/.test(src[j])) j++;\n',
            '      if ((src[j] === \'e\' || src[j] === \'E\') && /[0-9+-]/.test(src[j + 1] || \'\')) { j++; if (src[j] === \'+\' || src[j] === \'-\') j++; while (j < n && /[0-9]/.test(src[j])) j++; }\n',
            '      const v = parseFloat(src.slice(i, j)); i = j; return { type: \'num\', value: v };\n',
            '    }\n',
            '    function parseIdentOrCall() {\n',
            '      let j = i; while (j < n && /[a-zA-Z0-9_]/.test(src[j])) j++;\n',
            '      const name = src.slice(i, j); i = j; skipWs();\n',
            '      if (src[i] === \'(\') {\n',
            '        i++; const args = []; skipWs();\n',
            '        if (src[i] !== \')\') { args.push(parseExpr()); skipWs(); while (src[i] === \',\') { i++; args.push(parseExpr()); skipWs(); } }\n',
            '        skipWs(); if (src[i] === \')\') i++;\n',
            '        return { type: \'call\', name: name, args: args };\n',
            '      }\n',
            '      return { type: \'ident\', name: name };\n',
            '    }\n',
            '    function parseAtom() {\n',
            '      skipWs(); const c = src[i];\n',
            '      if (c === \'(\') { i++; const e = parseExpr(); skipWs(); if (src[i] === \')\') i++; return e; }\n',
            '      if (/[0-9.]/.test(c)) return parseNumber();\n',
            '      if (/[a-zA-Z_]/.test(c)) return parseIdentOrCall();\n',
            '      throw new Error(\'Неожиданный символ в выражении: \' + c);\n',
            '    }\n',
            '    function parseUnary() {\n',
            '      skipWs();\n',
            '      if (src[i] === \'-\') { i++; return { type: \'neg\', value: parseUnary() }; }\n',
            '      if (src[i] === \'+\') { i++; return parseUnary(); }\n',
            '      if (src[i] === \'!\' && src[i + 1] !== \'=\') { i++; return { type: \'not\', value: parseUnary() }; }\n',
            '      return parseAtom();\n',
            '    }\n',
            '    function parsePow() { const left = parseUnary(); skipWs(); if (src[i] === \'^\') { i++; const right = parsePow(); return { type: \'bin\', op: \'^\', left: left, right: right }; } return left; }\n',
            '    function parseTerm() { let left = parsePow(); skipWs(); while (src[i] === \'*\' || src[i] === \'/\' || src[i] === \'%\') { const op = src[i]; i++; const right = parsePow(); left = { type: \'bin\', op: op, left: left, right: right }; skipWs(); } return left; }\n',
            '    function parseAddSub() { let left = parseTerm(); skipWs(); while (src[i] === \'+\' || src[i] === \'-\') { const op = src[i]; i++; const right = parseTerm(); left = { type: \'bin\', op: op, left: left, right: right }; skipWs(); } return left; }\n',
            '    function parseComparison() {\n',
            '      let left = parseAddSub(); skipWs();\n',
            '      for (;;) {\n',
            '        const two = src.substr(i, 2);\n',
            '        if (two === \'<=\' || two === \'>=\') { i += 2; const right = parseAddSub(); left = { type: \'cmp\', op: two, left: left, right: right }; skipWs(); continue; }\n',
            '        if (src[i] === \'<\' || src[i] === \'>\') { const op = src[i]; i++; const right = parseAddSub(); left = { type: \'cmp\', op: op, left: left, right: right }; skipWs(); continue; }\n',
            '        break;\n',
            '      }\n',
            '      return left;\n',
            '    }\n',
            '    function parseEquality() {\n',
            '      let left = parseComparison(); skipWs();\n',
            '      while (src.substr(i, 2) === \'==\' || src.substr(i, 2) === \'!=\') { const op = src.substr(i, 2); i += 2; const right = parseComparison(); left = { type: \'cmp\', op: op, left: left, right: right }; skipWs(); }\n',
            '      return left;\n',
            '    }\n',
            '    function parseAnd() { let left = parseEquality(); skipWs(); while (src.substr(i, 2) === \'&&\') { i += 2; const right = parseEquality(); left = { type: \'logic\', op: \'&&\', left: left, right: right }; skipWs(); } return left; }\n',
            '    function parseOr() { let left = parseAnd(); skipWs(); while (src.substr(i, 2) === \'||\') { i += 2; const right = parseAnd(); left = { type: \'logic\', op: \'||\', left: left, right: right }; skipWs(); } return left; }\n',
            '    function parseExpr() { return parseOr(); }\n',
            '\n',
            '    function parseBlock() {\n',
            '      skipWs(); if (src[i] !== \'{\') throw new Error(\'Ожидалась "{"\'); i++;\n',
            '      const stmts = []; skipWs();\n',
            '      while (src[i] !== \'}\') { if (i >= n) throw new Error(\'Не закрыта фигурная скобка\'); stmts.push(parseStatement()); skipWs(); }\n',
            '      i++; return stmts;\n',
            '    }\n',
            '    function parseStatement() {\n',
            '      skipWs();\n',
            '      if (consumeKeyword(\'if\')) {\n',
            '        skipWs(); if (src[i] !== \'(\') throw new Error(\'Ожидалась "(" после if\'); i++;\n',
            '        const cond = parseExpr(); skipWs(); if (src[i] !== \')\') throw new Error(\'Ожидалась ")"\'); i++;\n',
            '        const thenB = parseBlock(); let elseB = null; skipWs();\n',
            '        if (consumeKeyword(\'else\')) {\n',
            '          skipWs();\n',
            '          let j = i; while (j < n && /[a-zA-Z0-9_]/.test(src[j])) j++;\n',
            '          if (src.slice(i, j) === \'if\') elseB = [parseStatement()];\n',
            '          else elseB = parseBlock();\n',
            '        }\n',
            '        return { type: \'if\', cond: cond, thenB: thenB, elseB: elseB };\n',
            '      }\n',
            '      if (consumeKeyword(\'return\')) {\n',
            '        skipWs();\n',
            '        let expr = null;\n',
            '        if (src[i] !== \';\' && src[i] !== \'}\' && i < n) expr = parseExpr();\n',
            '        skipWs(); if (src[i] === \';\') i++;\n',
            '        return { type: \'return\', expr: expr };\n',
            '      }\n',
            '      const save = i; skipWs();\n',
            '      if (/[a-zA-Z_]/.test(src[i] || \'\')) {\n',
            '        let j = i; while (j < n && /[a-zA-Z0-9_]/.test(src[j])) j++;\n',
            '        const name = src.slice(i, j);\n',
            '        let k = j; while (k < n && /\\s/.test(src[k])) k++;\n',
            '        const two = src.substr(k, 2);\n',
            '        if (two === \'+=\' || two === \'-=\' || two === \'*=\' || two === \'/=\') {\n',
            '          i = k + 2; const expr = parseExpr(); skipWs(); if (src[i] === \';\') i++;\n',
            '          return { type: \'assign\', name: name, op: two, expr: expr };\n',
            '        }\n',
            '        if (src[k] === \'=\' && src[k + 1] !== \'=\') {\n',
            '          i = k + 1; const expr = parseExpr(); skipWs(); if (src[i] === \';\') i++;\n',
            '          return { type: \'assign\', name: name, op: \'=\', expr: expr };\n',
            '        }\n',
            '      }\n',
            '      i = save;\n',
            '      const expr = parseExpr(); skipWs(); if (src[i] === \';\') i++;\n',
            '      return { type: \'expr\', expr: expr };\n',
            '    }\n',
            '    function parseProgram() { const stmts = []; skipWs(); while (i < n) { stmts.push(parseStatement()); skipWs(); } return stmts; }\n',
            '\n',
            '    return { parseExprEntry: parseExpr, parseProgramEntry: parseProgram };\n',
            '  }\n',
            '  function g3Parse(src) { return g3CreateParser(src).parseExprEntry(); }\n',
            '  function g3ParseProgram(src) { return g3CreateParser(src).parseProgramEntry(); }\n',
            '  const G3_BUILTINS = {\n',
            '    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,\n',
            '    sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp, log: Math.log, log2: Math.log2, log10: Math.log10,\n',
            '    min: Math.min, max: Math.max, pow: Math.pow, floor: Math.floor, ceil: Math.ceil, round: Math.round,\n',
            '    sign: Math.sign, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, hypot: Math.hypot,\n',
            '  };\n',
            '  // Сигнал возврата значения из Function/Void — исключение, перехватываемое в месте\n',
            '  // вызова (в g3Eval, case \'call\'), т.к. return может быть на любой глубине if. ----------\n',
            '  function G3ReturnSignal(value) { this.value = value; }\n',
            '  const G3_FUNCS = {};\n',
            '  for (const f of funcsData) { try { G3_FUNCS[f.name] = { params: f.params, ast: g3Parse(f.bodyExpr) }; } catch (e) { console.warn(\'Ошибка в функции \' + f.name, e); } }\n',
            '  // Function/Void — полноценные многострочные функции/процедуры (Задача: Void и Function).\n',
            '  for (const p of procsData) { try { G3_FUNCS[p.name] = { params: p.params, stmts: g3ParseProgram(p.body), isVoid: p.isVoid }; } catch (e) { console.warn(\'Ошибка в \' + (p.isVoid ? \'Void\' : \'Function\') + \' \' + p.name, e); } }\n',
            '  function g3ExecStatements(stmts, ctx) { for (const s of stmts) g3ExecStatement(s, ctx); }\n',
            '  function g3ExecStatement(s, ctx) {\n',
            '    switch (s.type) {\n',
            '      case \'assign\': {\n',
            '        const val = g3Eval(s.expr, ctx);\n',
            '        const hasLocal = ctx && Object.prototype.hasOwnProperty.call(ctx, s.name);\n',
            '        if (s.op === \'=\') { if (hasLocal) ctx[s.name] = val; else userVars[s.name] = val; }\n',
            '        else {\n',
            '          const cur = hasLocal ? ctx[s.name] : ((typeof userVars[s.name] === \'number\') ? userVars[s.name] : 0);\n',
            '          let nv = cur;\n',
            '          if (s.op === \'+=\') nv = cur + val; else if (s.op === \'-=\') nv = cur - val;\n',
            '          else if (s.op === \'*=\') nv = cur * val; else if (s.op === \'/=\') nv = cur / val;\n',
            '          if (hasLocal) ctx[s.name] = nv; else userVars[s.name] = nv;\n',
            '        }\n',
            '        break;\n',
            '      }\n',
            '      case \'if\':\n',
            '        if (g3Eval(s.cond, ctx)) g3ExecStatements(s.thenB, ctx);\n',
            '        else if (s.elseB) g3ExecStatements(s.elseB, ctx);\n',
            '        break;\n',
            '      case \'return\': throw new G3ReturnSignal(s.expr ? g3Eval(s.expr, ctx) : undefined);\n',
            '      case \'expr\': g3Eval(s.expr, ctx); break;\n',
            '    }\n',
            '  }\n',
            '  function g3Eval(node, ctx) {\n',
            '    switch (node.type) {\n',
            '      case \'num\': return node.value;\n',
            '      case \'neg\': return -g3Eval(node.value, ctx);\n',
            '      case \'not\': return !g3Eval(node.value, ctx);\n',
            '      case \'ident\':\n',
            '        if (node.name in ctx) return ctx[node.name];\n',
            '        if (node.name === \'pi\' || node.name === \'PI\') return Math.PI;\n',
            '        if (node.name === \'e\' || node.name === \'E\') return Math.E;\n',
            '        if (typeof userVars[node.name] === \'number\') return userVars[node.name];\n',
            '        return NaN;\n',
            '      case \'cmp\': {\n',
            '        const a = g3Eval(node.left, ctx), b = g3Eval(node.right, ctx);\n',
            '        if (node.op === \'==\') return a === b; if (node.op === \'!=\') return a !== b;\n',
            '        if (node.op === \'<\') return a < b; if (node.op === \'>\') return a > b;\n',
            '        if (node.op === \'<=\') return a <= b; if (node.op === \'>=\') return a >= b;\n',
            '        return false;\n',
            '      }\n',
            '      case \'logic\': {\n',
            '        if (node.op === \'&&\') { const a = g3Eval(node.left, ctx); return a ? g3Eval(node.right, ctx) : a; }\n',
            '        if (node.op === \'||\') { const a = g3Eval(node.left, ctx); return a ? a : g3Eval(node.right, ctx); }\n',
            '        return false;\n',
            '      }\n',
            '      case \'bin\': {\n',
            '        const a = g3Eval(node.left, ctx), b = g3Eval(node.right, ctx);\n',
            '        if (node.op === \'+\') return a + b; if (node.op === \'-\') return a - b;\n',
            '        if (node.op === \'*\') return a * b; if (node.op === \'/\') return a / b;\n',
            '        if (node.op === \'%\') return a % b; if (node.op === \'^\') return Math.pow(a, b);\n',
            '        return NaN;\n',
            '      }\n',
            '      case \'call\': {\n',
            '        const args = node.args.map(function(a) { return g3Eval(a, ctx); });\n',
            '        if (G3_BUILTINS[node.name]) return G3_BUILTINS[node.name].apply(null, args);\n',
            '        const fn = G3_FUNCS[node.name];\n',
            '        if (fn) {\n',
            '          const localCtx = {};\n',
            '          fn.params.forEach(function(p, idx) { localCtx[p] = args[idx]; });\n',
            '          if (fn.stmts) {\n',
            '            try { g3ExecStatements(fn.stmts, localCtx); }\n',
            '            catch (e) { if (e instanceof G3ReturnSignal) return e.value; throw e; }\n',
            '            return undefined;\n',
            '          }\n',
            '          return g3Eval(fn.ast, localCtx);\n',
            '        }\n',
            '        return NaN;\n',
            '      }\n',
            '    }\n',
            '    return NaN;\n',
            '  }\n',
            '  function g3SafeParse(src) { try { return g3Parse(src); } catch (e) { console.warn(\'Ошибка разбора выражения:\', src, e); return null; } }\n',
            '  // Единая точка вызова функции по имени с готовыми значениями аргументов (а не AST) —\n',
            '  // нужна там, где функция вызывается не через выражение с \'(\' (draw Surface { f = "..." },\n',
            '  // action кнопок и т.п.), а по имени напрямую. Работает одинаково для простых\n',
            '  // func/Function-выражений (fn.ast) и для блочных Function/Void с телом-statements\n',
            '  // (fn.stmts) — раньше это различие не учитывалось, и вызов блочной функции по имени\n',
            '  // молча возвращал NaN (например, если f = "wave" в draw Surface ссылалось на Function).\n',
            '  function g3CallNamed(name, argsObj) {\n',
            '    const fn = G3_FUNCS[name];\n',
            '    if (!fn) return undefined;\n',
            '    const localCtx = Object.assign({}, argsObj);\n',
            '    if (fn.stmts) {\n',
            '      try { g3ExecStatements(fn.stmts, localCtx); }\n',
            '      catch (e) { if (e instanceof G3ReturnSignal) return e.value; throw e; }\n',
            '      return undefined;\n',
            '    }\n',
            '    return g3Eval(fn.ast, localCtx);\n',
            '  }\n',
            '\n',
            '  // ---------- draw Surface: f(x, y) (через func) либо параметрическая x(u,v), y(u,v), z(u,v).\n',
            '  // Пересчитывается каждый кадр — поэтому поверхность может зависеть от переменных,\n',
            '  // изменяемых в Update (то есть быть анимированной), как и остальные объекты сцены. ----------\n',
            '  const surfaceObjs = drawSurfacesData.map(function(d) {\n',
            '    if (d.active === false && !d.activeExpr) return null;\n',
            '    const n = Math.max(2, Math.min(80, Math.round(d.grid || 20)));\n',
            '    const color = d.color || \'', theme.accent, '\';\n',
            '    const opacity = (d.opacity === undefined || d.opacity === null) ? 0.85 : d.opacity;\n',
            '    const geo = new THREE.BufferGeometry();\n',
            '    const idx = [];\n',
            '    for (let j = 0; j < n; j++) { for (let i = 0; i < n; i++) { const a0 = j * (n + 1) + i, b0 = a0 + 1, c0 = a0 + (n + 1), d0 = c0 + 1; idx.push(a0, c0, b0, b0, c0, d0); } }\n',
            '    geo.setIndex(idx);\n',
            '    geo.setAttribute(\'position\', new THREE.BufferAttribute(new Float32Array((n + 1) * (n + 1) * 3), 3));\n',
            '    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6, transparent: opacity < 1, opacity: opacity, side: THREE.DoubleSide, depthWrite: true });\n',
            '    const mesh = new THREE.Mesh(geo, mat);\n',
            '    scene.add(mesh);\n',
            '    const obj = { name: d.name, n: n, mesh: mesh, type: d.type || \'heightfield\', activeExpr: d.activeExpr, active: d.active !== false };\n',
            '    if (obj.type === \'parametric\') {\n',
            '      obj.xAst = g3SafeParse(d.xExpr); obj.yAst = g3SafeParse(d.yExpr); obj.zAst = g3SafeParse(d.zExpr);\n',
            '      obj.umin = d.umin; obj.umax = d.umax; obj.vmin = d.vmin; obj.vmax = d.vmax;\n',
            '    } else {\n',
            '      obj.funcName = d.funcName;\n',
            '      obj.xmin = d.xmin; obj.xmax = d.xmax; obj.ymin = d.ymin; obj.ymax = d.ymax;\n',
            '    }\n',
            '    return obj;\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '\n',
            '  function updateSurfaceMesh(so) {\n',
            '    const n = so.n;\n',
            '    const pos = so.mesh.geometry.attributes.position.array;\n',
            '    let k = 0;\n',
            '    if (so.type === \'parametric\') {\n',
            '      if (!so.xAst || !so.yAst || !so.zAst) return;\n',
            '      for (let j = 0; j <= n; j++) {\n',
            '        const v = so.vmin + (so.vmax - so.vmin) * j / n;\n',
            '        for (let i = 0; i <= n; i++) {\n',
            '          const u = so.umin + (so.umax - so.umin) * i / n;\n',
            '          const ctx = { u: u, v: v };\n',
            '          let x = g3Eval(so.xAst, ctx), y = g3Eval(so.yAst, ctx), z = g3Eval(so.zAst, ctx);\n',
            '          if (!isFinite(x)) x = 0; if (!isFinite(y)) y = 0; if (!isFinite(z)) z = 0;\n',
            '          pos[k++] = x; pos[k++] = y; pos[k++] = z;\n',
            '        }\n',
            '      }\n',
            '    } else {\n',
            '      for (let j = 0; j <= n; j++) {\n',
            '        const y = so.ymin + (so.ymax - so.ymin) * j / n;\n',
            '        for (let i = 0; i <= n; i++) {\n',
            '          const x = so.xmin + (so.xmax - so.xmin) * i / n;\n',
            '          let z = 0;\n',
            '          try { z = g3CallNamed(so.funcName, { x: x, y: y }); } catch (e) { z = 0; }\n',
            '          if (!isFinite(z)) z = 0;\n',
            '          pos[k++] = x; pos[k++] = y; pos[k++] = z;\n',
            '        }\n',
            '      }\n',
            '    }\n',
            '    so.mesh.geometry.attributes.position.needsUpdate = true;\n',
            '    so.mesh.geometry.computeVertexNormals();\n',
            '    so.mesh.geometry.computeBoundingSphere();\n',
            '  }\n',
            '\n',
            '  // ---------- draw Field: векторное поле P(x,y,z)/Q(x,y,z)/R(x,y,z) — стрелки на сетке.\n',
            '  // Без R поле плоское и рисуется в срезе z = 0 (как в 2D); с R — полноценная 3D-сетка\n',
            '  // (число узлов по каждой оси ограничено, чтобы не получить тысячи стрелок). ----------\n',
            '  const fieldObjs = drawFieldsData.map(function(d) {\n',
            '    if (d.active === false && !d.activeExpr) return null;\n',
            '    const pAst = g3SafeParse(d.pExpr), qAst = g3SafeParse(d.qExpr);\n',
            '    const rAst = d.rExpr ? g3SafeParse(d.rExpr) : null;\n',
            '    if (!pAst || !qAst) return null;\n',
            '    const color = d.color || \'#888888\';\n',
            '    const is3D = !!rAst;\n',
            '    const gridN = is3D ? Math.max(1, Math.min(9, Math.round(d.grid || 15))) : Math.max(1, Math.min(20, Math.round(d.grid || 15)));\n',
            '    const cellX = (d.xmax - d.xmin) / gridN, cellY = (d.ymax - d.ymin) / gridN, cellZ = is3D ? (d.zmax - d.zmin) / gridN : 0;\n',
            '    const cellSize = is3D ? Math.min(Math.abs(cellX), Math.abs(cellY), Math.abs(cellZ) || Infinity) : Math.min(Math.abs(cellX), Math.abs(cellY));\n',
            '    const arrowLen = Math.max(cellSize * 0.42 * (d.scale || 1), 0.001);\n',
            '    const arrows = [];\n',
            '    const zLayers = is3D ? gridN + 1 : 1;\n',
            '    for (let i = 0; i <= gridN; i++) {\n',
            '      for (let j = 0; j <= gridN; j++) {\n',
            '        for (let kk = 0; kk < zLayers; kk++) {\n',
            '          const geo = new THREE.ConeGeometry(Math.max(arrowLen * 0.22, 0.005), arrowLen, 8);\n',
            '          geo.translate(0, arrowLen / 2, 0);\n',
            '          const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });\n',
            '          const mesh = new THREE.Mesh(geo, mat);\n',
            '          mesh.visible = false;\n',
            '          scene.add(mesh);\n',
            '          arrows.push({ mesh: mesh, x: d.xmin + i * cellX, y: d.ymin + j * cellY, z: is3D ? d.zmin + kk * cellZ : 0 });\n',
            '        }\n',
            '      }\n',
            '    }\n',
            '    return { name: d.name, pAst: pAst, qAst: qAst, rAst: rAst, arrows: arrows, activeExpr: d.activeExpr, active: d.active !== false };\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '\n',
            '  function updateFieldObj(fo) {\n',
            '    const up = new THREE.Vector3(0, 1, 0);\n',
            '    for (const ar of fo.arrows) {\n',
            '      const ctx = { x: ar.x, y: ar.y, z: ar.z };\n',
            '      let px = g3Eval(fo.pAst, ctx), py = g3Eval(fo.qAst, ctx), pz = fo.rAst ? g3Eval(fo.rAst, ctx) : 0;\n',
            '      if (!isFinite(px)) px = 0; if (!isFinite(py)) py = 0; if (!isFinite(pz)) pz = 0;\n',
            '      const dir = new THREE.Vector3(px, py, pz);\n',
            '      const mag = dir.length();\n',
            '      if (mag < 1e-9) { ar.mesh.visible = false; continue; }\n',
            '      ar.mesh.visible = true;\n',
            '      dir.normalize();\n',
            '      ar.mesh.position.set(ar.x, ar.y, ar.z);\n',
            '      const axis = new THREE.Vector3().crossVectors(up, dir);\n',
            '      const angle = Math.acos(Math.max(-1, Math.min(1, up.dot(dir))));\n',
            '      if (axis.lengthSq() < 1e-8) { ar.mesh.quaternion.identity(); if (angle > 3) ar.mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI); }\n',
            '      else ar.mesh.quaternion.setFromAxisAngle(axis.normalize(), angle);\n',
            '    }\n',
            '  }\n',
            '\n',
            '  // ---------- new Curve: bezier (по 3D-точкам) или параметрическая x(t), y(t), z(t), t∈[0,1] —\n',
            '  // та же конвенция полей и диапазон параметра, что и в 2D. Типы spiral/cycloid/involute\n',
            '  // в 3D пока не поддержаны (это опорные 2D-кривые вокруг точки). ----------\n',
            '  const curveObjs = curvesData.map(function(cv) {\n',
            '    if (cv.active === false && !cv.activeExpr) return null;\n',
            '    const color = cv.color || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '    const n = Math.max(2, cv.segments || 50);\n',
            '    const geo = new THREE.BufferGeometry();\n',
            '    geo.setAttribute(\'position\', new THREE.BufferAttribute(new Float32Array((n + 1) * 3), 3));\n',
            '    const mat = new THREE.LineBasicMaterial({ color: color });\n',
            '    const mesh = new THREE.Line(geo, mat);\n',
            '    scene.add(mesh);\n',
            '    const obj = { name: cv.name, type: cv.type, n: n, mesh: mesh, activeExpr: cv.activeExpr, active: cv.active !== false };\n',
            '    if (cv.type === \'bezier\') {\n',
            '      obj.controlPoints = (cv.controlPoints || []).map(findPoint).filter(function(x) { return x; });\n',
            '      if (obj.controlPoints.length < 2) return null;\n',
            '    } else if (cv.type === \'parametric\') {\n',
            '      obj.xAst = g3SafeParse(cv.xExpr); obj.yAst = g3SafeParse(cv.yExpr); obj.zAst = cv.zExpr ? g3SafeParse(cv.zExpr) : null;\n',
            '      if (!obj.xAst || !obj.yAst) return null;\n',
            '    } else {\n',
            '      return null;\n',
            '    }\n',
            '    return obj;\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '\n',
            '  function bezierPoint3D(pts, t) {\n',
            '    let layer = pts.map(function(p) { return p.mesh.position.clone(); });\n',
            '    while (layer.length > 1) {\n',
            '      const next = [];\n',
            '      for (let i = 0; i < layer.length - 1; i++) next.push(layer[i].clone().lerp(layer[i + 1], t));\n',
            '      layer = next;\n',
            '    }\n',
            '    return layer[0];\n',
            '  }\n',
            '\n',
            '  function updateCurveMesh(co) {\n',
            '    const pos = co.mesh.geometry.attributes.position.array;\n',
            '    let k = 0;\n',
            '    for (let i = 0; i <= co.n; i++) {\n',
            '      const t = i / co.n;\n',
            '      let x, y, z;\n',
            '      if (co.type === \'bezier\') {\n',
            '        const p = bezierPoint3D(co.controlPoints, t);\n',
            '        x = p.x; y = p.y; z = p.z;\n',
            '      } else {\n',
            '        const ctx = { t: t };\n',
            '        x = g3Eval(co.xAst, ctx); y = g3Eval(co.yAst, ctx); z = co.zAst ? g3Eval(co.zAst, ctx) : 0;\n',
            '        if (!isFinite(x)) x = 0; if (!isFinite(y)) y = 0; if (!isFinite(z)) z = 0;\n',
            '      }\n',
            '      pos[k++] = x; pos[k++] = y; pos[k++] = z;\n',
            '    }\n',
            '    co.mesh.geometry.attributes.position.needsUpdate = true;\n',
            '    co.mesh.geometry.computeBoundingSphere();\n',
            '  }\n',
            '\n',
            '  // ---------- draw Trajectory: интегральная кривая векторного поля (RK4), состояние всегда\n',
            '  // трёхмерное (x, y, z) — если start задан двумя числами, z начинается с 0. Поддержаны\n',
            '  // режимы field="..." и инлайн P/Q/R; режим system="func" (векторнозначные пользовательские\n',
            '  // функции) в 3D-мини-языке выражений пока не реализован, т.к. он не умеет возвращать массивы. ----------\n',
            '  function trajectorySystemFn(tr) {\n',
            '    if (tr.systemName) { console.warn(\'draw Trajectory "\' + tr.name + \'": system="\' + tr.systemName + \'" пока не поддержан в 3D, используйте field= или P/Q/R\'); return null; }\n',
            '    let pAst, qAst, rAst;\n',
            '    if (tr.fieldName) {\n',
            '      const f = drawFieldsData.find(function(d) { return d.name === tr.fieldName; });\n',
            '      if (!f) return null;\n',
            '      pAst = g3SafeParse(f.pExpr); qAst = g3SafeParse(f.qExpr); rAst = f.rExpr ? g3SafeParse(f.rExpr) : null;\n',
            '    } else if (tr.pExpr) {\n',
            '      pAst = g3SafeParse(tr.pExpr); qAst = g3SafeParse(tr.qExpr); rAst = tr.rExpr ? g3SafeParse(tr.rExpr) : null;\n',
            '    } else {\n',
            '      return null;\n',
            '    }\n',
            '    if (!pAst || !qAst) return null;\n',
            '    return function(t, x, y, z) {\n',
            '      const ctx = { t: t, x: x, y: y, z: z };\n',
            '      let px = g3Eval(pAst, ctx), py = g3Eval(qAst, ctx), pz = rAst ? g3Eval(rAst, ctx) : 0;\n',
            '      if (!isFinite(px)) px = 0; if (!isFinite(py)) py = 0; if (!isFinite(pz)) pz = 0;\n',
            '      return [px, py, pz];\n',
            '    };\n',
            '  }\n',
            '  const trajectoryObjs = drawTrajectoriesData.map(function(tr) {\n',
            '    if (tr.active === false && !tr.activeExpr) return null;\n',
            '    const sys = trajectorySystemFn(tr);\n',
            '    if (!sys) return null;\n',
            '    const steps = Math.max(1, Math.min(2000, Math.round(tr.steps || 200)));\n',
            '    const geo = new THREE.BufferGeometry();\n',
            '    geo.setAttribute(\'position\', new THREE.BufferAttribute(new Float32Array((steps + 1) * 3), 3));\n',
            '    const mat = new THREE.LineBasicMaterial({ color: tr.color || \'#ff0000\' });\n',
            '    const mesh = new THREE.Line(geo, mat);\n',
            '    scene.add(mesh);\n',
            '    return { name: tr.name, sys: sys, steps: steps, dt: tr.dt || 0.05, start: tr.start, mesh: mesh, activeExpr: tr.activeExpr, active: tr.active !== false };\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '\n',
            '  function updateTrajectoryMesh(to) {\n',
            '    const dt = to.dt;\n',
            '    let state = [to.start[0], to.start[1], to.start.length > 2 ? to.start[2] : 0];\n',
            '    let t = 0;\n',
            '    const pos = to.mesh.geometry.attributes.position.array;\n',
            '    let k = 0;\n',
            '    pos[k++] = state[0]; pos[k++] = state[1]; pos[k++] = state[2];\n',
            '    let count = 1;\n',
            '    for (let i = 0; i < to.steps; i++) {\n',
            '      const k1 = to.sys(t, state[0], state[1], state[2]);\n',
            '      const s2 = [state[0] + dt / 2 * k1[0], state[1] + dt / 2 * k1[1], state[2] + dt / 2 * k1[2]];\n',
            '      const k2 = to.sys(t + dt / 2, s2[0], s2[1], s2[2]);\n',
            '      const s3 = [state[0] + dt / 2 * k2[0], state[1] + dt / 2 * k2[1], state[2] + dt / 2 * k2[2]];\n',
            '      const k3 = to.sys(t + dt / 2, s3[0], s3[1], s3[2]);\n',
            '      const s4 = [state[0] + dt * k3[0], state[1] + dt * k3[1], state[2] + dt * k3[2]];\n',
            '      const k4 = to.sys(t + dt, s4[0], s4[1], s4[2]);\n',
            '      const next = [\n',
            '        state[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),\n',
            '        state[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),\n',
            '        state[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),\n',
            '      ];\n',
            '      if (!isFinite(next[0]) || !isFinite(next[1]) || !isFinite(next[2])) break;\n',
            '      state = next; t += dt;\n',
            '      pos[k++] = state[0]; pos[k++] = state[1]; pos[k++] = state[2];\n',
            '      count++;\n',
            '    }\n',
            '    to.mesh.geometry.setDrawRange(0, count);\n',
            '    to.mesh.geometry.attributes.position.needsUpdate = true;\n',
            '    to.mesh.geometry.computeBoundingSphere();\n',
            '  }\n',
            '\n',
            '  // ---------- Мини-язык текстовых выражений (для draw Text и action у new UI):\n',
            '  // строковые литералы "...", конкатенация через +, format(expr, N), обращения вида\n',
            '  // ИмяТочки.x/.y/.z (или .pos.x/.pos.y/.pos.z), ИмяУгла.measure, переменные Update/Start.\n',
            '  // Это самостоятельный, более простой язык, чем g3Parse (тот — чисто числовой). ----------\n',
            '  const G3_DOTTED_RE = /^[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)+$/;\n',
            '  function g3ResolveDotted(path) {\n',
            '    const parts = path.split(\'.\');\n',
            '    const first = parts[0];\n',
            '    let cur;\n',
            '    const pt = findPoint(first);\n',
            '    if (pt) {\n',
            '      const p = pt.mesh.position;\n',
            '      cur = { x: p.x, y: p.y, z: p.z, pos: { x: p.x, y: p.y, z: p.z }, name: pt.name, active: pt.active };\n',
            '    } else {\n',
            '      const ad = angleDefs.find(function(a) { return a.name === first; });\n',
            '      if (ad) cur = { measure: ad.measure };\n',
            '      else if (typeof userVars[first] !== \'undefined\') cur = userVars[first];\n',
            '      else return undefined;\n',
            '    }\n',
            '    for (let i = 1; i < parts.length; i++) { if (cur === null || cur === undefined) return undefined; cur = cur[parts[i]]; }\n',
            '    return cur;\n',
            '  }\n',
            '  function g3EvalScalar(expr) {\n',
            '    const p = (expr || \'\').trim();\n',
            '    if (p === \'\') return 0;\n',
            '    if (G3_DOTTED_RE.test(p)) { const v = g3ResolveDotted(p); return (typeof v === \'number\') ? v : 0; }\n',
            '    const ast = g3SafeParse(p);\n',
            '    if (!ast) return 0;\n',
            '    const v = g3Eval(ast, {});\n',
            '    return isFinite(v) ? v : 0;\n',
            '  }\n',
            '  function g3SplitTopPlus(src) {\n',
            '    const out = []; let depth = 0, inStr = false, cur = \'\';\n',
            '    for (let i = 0; i < src.length; i++) {\n',
            '      const c = src[i];\n',
            '      if (inStr) { cur += c; if (c === \'"\') inStr = false; continue; }\n',
            '      if (c === \'"\') { inStr = true; cur += c; continue; }\n',
            '      if (c === \'(\') depth++;\n',
            '      if (c === \')\') depth--;\n',
            '      if (c === \'+\' && depth === 0) { out.push(cur); cur = \'\'; continue; }\n',
            '      cur += c;\n',
            '    }\n',
            '    if (cur.trim() !== \'\') out.push(cur);\n',
            '    return out;\n',
            '  }\n',
            '  function g3EvalTerm(raw) {\n',
            '    const p = raw.trim();\n',
            '    if (p.length >= 2 && p[0] === \'"\' && p[p.length - 1] === \'"\') return p.slice(1, -1);\n',
            '    if (p === \'true\') return true; if (p === \'false\') return false;\n',
            '    const fmt = p.match(/^format\\s*\\(([\\s\\S]*),\\s*(-?\\d+)\\s*\\)$/);\n',
            '    if (fmt) {\n',
            '      const val = g3EvalScalar(fmt[1].trim());\n',
            '      const dec = parseInt(fmt[2], 10);\n',
            '      return isFinite(val) ? val.toFixed(Math.max(0, dec)) : String(val);\n',
            '    }\n',
            '    if (G3_DOTTED_RE.test(p)) { const v = g3ResolveDotted(p); return (v === undefined || v === null) ? \'\' : v; }\n',
            '    const ast = g3SafeParse(p);\n',
            '    if (ast) { const v = g3Eval(ast, {}); return isFinite(v) ? v : \'\'; }\n',
            '    return \'\';\n',
            '  }\n',
            '  function g3EvalTextExpr(src) {\n',
            '    if (!src) return \'\';\n',
            '    return g3SplitTopPlus(src).map(function(p) { return String(g3EvalTerm(p)); }).join(\'\');\n',
            '  }\n',
            '  // Пересчёт поля active: если там стоит имя переменной, значение берётся из userVars\n',
            '  // каждый кадр, поэтому переключатель new UI реально скрывает/показывает объект.\n',
            '  function g3IsActive(activeExpr, fallback) {\n',
            '    if (activeExpr === undefined || activeExpr === null) return fallback !== false;\n',
            '    if (activeExpr === \'true\') return true;\n',
            '    if (activeExpr === \'false\') return false;\n',
            '    const raw = (activeExpr.indexOf(\'.\') >= 0) ? g3ResolveDotted(activeExpr) : userVars[activeExpr];\n',
            '    if (raw === undefined || raw === null) return fallback !== false;\n',
            '    return !(raw === false || raw === 0 || raw === \'\');\n',
            '  }\n',
            '  // Раннер action у кнопок: теперь это полноценный код на том же мини-языке, что и\n',
            '  // тела Function/Void — присваивания, if/else, и, главное, вызовы Void/Function\n',
            '  // (например, action = "resetAmplitude()"), а не только простые присваивания.\n',
            '  function g3RunAction(action) {\n',
            '    if (!action || !action.trim()) return;\n',
            '    try {\n',
            '      const stmts = g3ParseProgram(action);\n',
            '      try { g3ExecStatements(stmts, {}); }\n',
            '      catch (e) { if (!(e instanceof G3ReturnSignal)) throw e; }\n',
            '    } catch (e) {\n',
            '      console.warn(\'Ошибка в action UI:\', action, e);\n',
            '    }\n',
            '  }\n',
            '\n',
            '  // ---------- draw Text: подпись с вычисляемым текстом/позицией/цветом, как в 2D.\n',
            '  // Пересчитывается каждый кадр (может показывать текущие координаты точки, значение\n',
            '  // угла, переменную из Update и т.п.), позиция проецируется тем же способом, что и\n',
            '  // подписи точек/углов. ----------\n',
            '  const textObjs = drawTextsData.map(function(d) {\n',
            '    const div = document.createElement(\'div\');\n',
            '    div.className = \'gc3-text\';\n',
            '    textLayer.appendChild(div);\n',
            '    return { name: d.name, d: d, div: div, worldPos: new THREE.Vector3() };\n',
            '  });\n',
            '  function updateTextObj(to) {\n',
            '    const d = to.d;\n',
            '    let active = true;\n',
            '    if (d.activeExpr === \'false\') active = false;\n',
            '    else if (d.activeExpr && d.activeExpr !== \'true\') { const v = g3EvalTerm(d.activeExpr); active = !(v === false || v === \'\' || v === 0); }\n',
            '    if (!active) { to.div.style.display = \'none\'; return; }\n',
            '    const x = g3EvalScalar(d.posXExpr), y = g3EvalScalar(d.posYExpr), z = d.posZExpr ? g3EvalScalar(d.posZExpr) : 0;\n',
            '    to.worldPos.set(x, y, z);\n',
            '    const v = to.worldPos.clone().project(camera);\n',
            '    if (v.z > 1) { to.div.style.display = \'none\'; return; }\n',
            '    const rect = canvas.getBoundingClientRect();\n',
            '    const sx = (v.x * 0.5 + 0.5) * rect.width;\n',
            '    const sy = (-v.y * 0.5 + 0.5) * rect.height;\n',
            '    to.div.style.display = \'block\';\n',
            '    to.div.style.left = sx + \'px\';\n',
            '    to.div.style.top = sy + \'px\';\n',
            '    to.div.textContent = g3EvalTextExpr(d.textExpr);\n',
            '    to.div.style.color = (d.colorExpr && d.colorExpr !== \'default\' && !d.colorExpr.match(/^[a-zA-Z_]/)) ? d.colorExpr : (\'', THEME_PRESETS.dark.defaultColor, '\');\n',
            '    const sizeNum = parseFloat(d.sizeExpr); to.div.style.fontSize = (0.8 * (isFinite(sizeNum) ? sizeNum : 1)) + \'rem\';\n',
            '  }\n',
            '\n',
            '  // ---------- new UI: те же 4 типа контролов, что в 2D (button/toggle/input/slider),\n',
            '  // тот же синтаксис полей. Переменные читаются/пишутся в userVars (а не в window,\n',
            '  // как в 2D) — то есть в те же переменные, что видят блоки Start/Update. ----------\n',
            '  function g3GetVar(path) { return path.split(\'.\').reduce(function(o, k) { return (o === undefined || o === null) ? undefined : o[k]; }, userVars); }\n',
            '  function g3SetVar(path, value) {\n',
            '    const parts = path.split(\'.\'); let o = userVars;\n',
            '    for (let i = 0; i < parts.length - 1; i++) { if (typeof o[parts[i]] !== \'object\' || o[parts[i]] === null) o[parts[i]] = {}; o = o[parts[i]]; }\n',
            '    o[parts[parts.length - 1]] = value;\n',
            '  }\n',
            '  function createUI() {\n',
            '    uiContainer.innerHTML = \'\';\n',
            '    uiOverlay.innerHTML = \'\';\n',
            '    for (const ui of uiData) {\n',
            '      const wrapper = document.createElement(\'div\'); wrapper.className = \'ui-item\';\n',
            '      if (ui.active === false) wrapper.style.display = \'none\';\n',
            '      const positioned = ui.x !== null && ui.x !== undefined && ui.y !== null && ui.y !== undefined;\n',
            '      if (positioned) {\n',
            '        wrapper.style.position = \'absolute\';\n',
            '        wrapper.style.left = ui.x + \'%\'; wrapper.style.top = ui.y + \'%\';\n',
            '        wrapper.style.pointerEvents = \'auto\';\n',
            '        wrapper.style.zIndex = (ui.layer !== undefined && ui.layer !== null) ? ui.layer : 100;\n',
            '        if (ui.width) wrapper.style.width = ui.width + \'px\';\n',
            '        if (ui.height) wrapper.style.height = ui.height + \'px\';\n',
            '      }\n',
            '      if (ui.type === \'button\') {\n',
            '        const btn = document.createElement(\'button\');\n',
            '        btn.textContent = ui.label || \'Button\';\n',
            '        btn.style.backgroundColor = ui.color || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '        btn.style.color = ui.textcolor || \'#ffffff\';\n',
            '        btn.style.borderRadius = (ui.radius !== null && ui.radius !== undefined ? ui.radius : 4) + \'px\';\n',
            '        if (positioned) { btn.style.width = \'100%\'; btn.style.height = \'100%\'; }\n',
            '        btn.addEventListener(\'click\', function() { g3RunAction(ui.action || \'\'); });\n',
            '        wrapper.appendChild(btn);\n',
            '      } else if (ui.type === \'toggle\') {\n',
            '        const checkbox = document.createElement(\'input\'); checkbox.type = \'checkbox\';\n',
            '        let initialChecked = ui.default !== undefined ? ui.default : false;\n',
            '        if (ui.variable) { const val = g3GetVar(ui.variable); if (val !== undefined) initialChecked = !!val; }\n',
            '        checkbox.checked = initialChecked;\n',
            '        if (ui.variable) {\n',
            '          if (g3GetVar(ui.variable) === undefined) g3SetVar(ui.variable, initialChecked);\n',
            '          checkbox.addEventListener(\'change\', function() { g3SetVar(ui.variable, this.checked); });\n',
            '        }\n',
            '        const label = document.createElement(\'label\'); label.textContent = ui.label || \'\'; label.style.color = ui.textcolor || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '        wrapper.appendChild(checkbox); wrapper.appendChild(label);\n',
            '      } else if (ui.type === \'input\') {\n',
            '        const input = document.createElement(\'input\'); input.type = ui.inputtype === \'formula\' ? \'text\' : (ui.inputtype || \'text\');\n',
            '        if (input.type === \'number\') {\n',
            '          if (ui.min !== null) input.min = ui.min; if (ui.max !== null) input.max = ui.max;\n',
            '          input.step = (ui.step !== null && ui.step !== undefined) ? ui.step : \'any\';\n',
            '          if (ui.stepper === false) input.classList.add(\'no-stepper\');\n',
            '        }\n',
            '        if (ui.inputtype === \'formula\') {\n',
            '          const funcName = ui.funcName || ui.variable || \'userFunc\';\n',
            '          const defaultExpr = (ui.default !== undefined && ui.default !== null) ? String(ui.default) : \'x\';\n',
            '          input.value = defaultExpr; input.placeholder = \'например: x^2 + sin(x)\';\n',
            '          const errLabel = document.createElement(\'div\');\n',
            '          errLabel.style.color = \'#ff0000\'; errLabel.style.fontSize = \'0.75rem\'; errLabel.style.marginTop = \'2px\'; errLabel.style.display = \'none\';\n',
            '          function registerFormula() {\n',
            '            try {\n',
            '              const ast = g3Parse(input.value);\n',
            '              G3_FUNCS[funcName] = { params: [\'x\'], ast: ast };\n',
            '              input.style.borderColor = \'\'; errLabel.style.display = \'none\';\n',
            '            } catch (e) {\n',
            '              input.style.borderColor = \'#ff0000\';\n',
            '              errLabel.textContent = \'Ошибка: \' + e.message; errLabel.style.display = \'block\';\n',
            '            }\n',
            '          }\n',
            '          registerFormula();\n',
            '          input.addEventListener(\'input\', registerFormula); input.addEventListener(\'change\', registerFormula);\n',
            '          const label = document.createElement(\'label\'); label.textContent = ui.label || \'\'; label.style.color = ui.textcolor || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '          wrapper.appendChild(label); wrapper.appendChild(input); wrapper.appendChild(errLabel);\n',
            '          if (positioned) uiOverlay.appendChild(wrapper); else uiContainer.appendChild(wrapper);\n',
            '          continue;\n',
            '        }\n',
            '        let defaultVal = ui.default !== undefined ? ui.default : (input.type === \'number\' ? 0 : \'\');\n',
            '        if (ui.variable) { const val = g3GetVar(ui.variable); if (val !== undefined) defaultVal = val; }\n',
            '        input.value = defaultVal;\n',
            '        if (ui.variable) {\n',
            '          if (g3GetVar(ui.variable) === undefined) g3SetVar(ui.variable, defaultVal);\n',
            '          function clampAndUpdate() {\n',
            '            let val = input.value;\n',
            '            if (input.type === \'number\') {\n',
            '              let num = parseFloat(val);\n',
            '              if (isNaN(num)) { const cur = g3GetVar(ui.variable); input.value = (cur !== undefined) ? cur : defaultVal; return; }\n',
            '              if (ui.min !== null && num < ui.min) num = ui.min;\n',
            '              if (ui.max !== null && num > ui.max) num = ui.max;\n',
            '              val = num; input.value = num;\n',
            '            }\n',
            '            g3SetVar(ui.variable, val);\n',
            '          }\n',
            '          input.addEventListener(\'input\', clampAndUpdate); input.addEventListener(\'change\', clampAndUpdate);\n',
            '        }\n',
            '        const label = document.createElement(\'label\'); label.textContent = ui.label || \'\'; label.style.color = ui.textcolor || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '        wrapper.appendChild(label); wrapper.appendChild(input);\n',
            '      } else if (ui.type === \'slider\') {\n',
            '        const input = document.createElement(\'input\'); input.type = \'range\';\n',
            '        input.min = ui.min; input.max = ui.max; input.step = ui.step || 1;\n',
            '        let defaultVal = (ui.default !== undefined && ui.default !== null) ? ui.default : ui.min;\n',
            '        if (ui.variable) { const val = g3GetVar(ui.variable); if (val !== undefined) defaultVal = val; }\n',
            '        input.value = defaultVal;\n',
            '        input.style.accentColor = ui.color || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '        if (positioned) input.style.width = \'100%\';\n',
            '        const valueLabel = document.createElement(\'span\'); valueLabel.textContent = String(defaultVal); valueLabel.style.color = ui.textcolor || \'', THEME_PRESETS.dark.defaultColor, '\'; valueLabel.style.marginLeft = \'6px\';\n',
            '        if (ui.variable) {\n',
            '          if (g3GetVar(ui.variable) === undefined) g3SetVar(ui.variable, defaultVal);\n',
            '          input.addEventListener(\'input\', function() {\n',
            '            const num = parseFloat(this.value);\n',
            '            g3SetVar(ui.variable, num);\n',
            '            valueLabel.textContent = String(num);\n',
            '          });\n',
            '        }\n',
            '        const label2 = document.createElement(\'label\'); label2.textContent = ui.label || \'\'; label2.style.color = ui.textcolor || \'', THEME_PRESETS.dark.defaultColor, '\';\n',
            '        wrapper.appendChild(label2); wrapper.appendChild(input); wrapper.appendChild(valueLabel);\n',
            '      }\n',
            '      if (positioned) uiOverlay.appendChild(wrapper); else uiContainer.appendChild(wrapper);\n',
            '    }\n',
            '  }\n',
            '  createUI();\n',
            '\n',
            '  // ---------- draw InfPlane: плоскость по трём точкам (или по первым трём точкам\n',
            '  // фигуры), простирающаяся во все стороны на size. Как и draw InfLine, собственных\n',
            '  // вершин не имеет — пересчитывается из чужих точек каждый кадр. ----------\n',
            '  const infPlaneObjs = infPlanesData.map(function(d) {\n',
            '    if (d.active === false && !d.activeExpr) return null;\n',
            '    let names = d.points;\n',
            '    if (!names && d.figure) {\n',
            '      const fig = figuresData.find(function(f) { return f.name === d.figure; });\n',
            '      if (fig) names = fig.elements;\n',
            '    }\n',
            '    if (!names) return null;\n',
            '    const pts = names.map(findPoint).filter(function(x) { return x; });\n',
            '    if (pts.length < 3) return null;\n',
            '    const color = d.color || \'', theme.accent, '\';\n',
            '    const opacity = (d.opacity === undefined || d.opacity === null) ? 0.35 : d.opacity;\n',
            '    const size = (typeof d.size === \'number\' && d.size > 0) ? d.size : Math.max(fieldW, fieldH, fieldD);\n',
            '    const geo = new THREE.BufferGeometry();\n',
            '    geo.setAttribute(\'position\', new THREE.BufferAttribute(new Float32Array(4 * 3), 3));\n',
            '    geo.setIndex([0, 1, 2, 0, 2, 3]);\n',
            '    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6, transparent: opacity < 1, opacity: opacity, side: THREE.DoubleSide, depthWrite: opacity >= 1 });\n',
            '    const mesh = new THREE.Mesh(geo, mat);\n',
            '    scene.add(mesh);\n',
            '    let edges = null;\n',
            '    if (d.grid) {\n',
            '      const eGeo = new THREE.BufferGeometry();\n',
            '      eGeo.setAttribute(\'position\', new THREE.BufferAttribute(new Float32Array(4 * 3), 3));\n',
            '      edges = new THREE.LineLoop(eGeo, new THREE.LineBasicMaterial({ color: color }));\n',
            '      scene.add(edges);\n',
            '    }\n',
            '    return { name: d.name, pts: pts, mesh: mesh, edges: edges, size: size, activeExpr: d.activeExpr, active: d.active !== false };\n',
            '  }).filter(function(x) { return x !== null; });\n',
            '\n',
            '  function updateInfPlane(po) {\n',
            '    const A = po.pts[0].mesh.position, B = po.pts[1].mesh.position, C = po.pts[2].mesh.position;\n',
            '    const u = new THREE.Vector3().subVectors(B, A);\n',
            '    const w = new THREE.Vector3().subVectors(C, A);\n',
            '    const nrm = new THREE.Vector3().crossVectors(u, w);\n',
            '    if (nrm.lengthSq() < 1e-12) { po.mesh.visible = false; if (po.edges) po.edges.visible = false; return; }\n',
            '    // Ортонормированный базис плоскости: e1 вдоль AB, e2 — перпендикуляр в той же плоскости.\n',
            '    const e1 = u.clone().normalize();\n',
            '    const e2 = new THREE.Vector3().crossVectors(nrm.clone().normalize(), e1).normalize();\n',
            '    const center = A.clone().add(B).add(C).multiplyScalar(1 / 3);\n',
            '    const s = po.size;\n',
            '    const corners = [\n',
            '      center.clone().addScaledVector(e1, -s).addScaledVector(e2, -s),\n',
            '      center.clone().addScaledVector(e1, s).addScaledVector(e2, -s),\n',
            '      center.clone().addScaledVector(e1, s).addScaledVector(e2, s),\n',
            '      center.clone().addScaledVector(e1, -s).addScaledVector(e2, s),\n',
            '    ];\n',
            '    const arr = po.mesh.geometry.attributes.position.array;\n',
            '    for (let i = 0; i < 4; i++) { arr[i * 3] = corners[i].x; arr[i * 3 + 1] = corners[i].y; arr[i * 3 + 2] = corners[i].z; }\n',
            '    po.mesh.geometry.attributes.position.needsUpdate = true;\n',
            '    po.mesh.geometry.computeVertexNormals();\n',
            '    po.mesh.geometry.computeBoundingSphere();\n',
            '    if (po.edges) {\n',
            '      const ea = po.edges.geometry.attributes.position.array;\n',
            '      for (let i = 0; i < 4; i++) { ea[i * 3] = corners[i].x; ea[i * 3 + 1] = corners[i].y; ea[i * 3 + 2] = corners[i].z; }\n',
            '      po.edges.geometry.attributes.position.needsUpdate = true;\n',
            '      po.edges.geometry.computeBoundingSphere();\n',
            '    }\n',
            '  }\n',
            '\n',
            '  // ---------- Кластеры (именованные группы для скриптов, как в 2D) ----------\n',
            '  let draggedPoint = null; // объявлено заранее: используется в applyClusterTransform3D ниже\n',
            '  // Жёсткая трансформация в 3D: поворот (Эйлеровы углы XYZ, градусы) вокруг центра\n',
            '  // масс кластера + сохранение относительного положения всех входящих точек и\n',
            '  // объёмных примитивов (для примитивов дополнительно поворачивается сама их\n',
            '  // ориентация, чтобы тело поворачивалось как единое целое, а не только сдвигалось).\n',
            '  function collectClusterMembers3D(elements) {\n',
            '    const pts = []; const seenP = new Set();\n',
            '    const prims = []; const seenPr = new Set();\n',
            '    function addPoint(p) { if (p && !seenP.has(p)) { seenP.add(p); pts.push(p); } }\n',
            '    function addPrim(pr) { if (pr && !seenPr.has(pr)) { seenPr.add(pr); prims.push(pr); } }\n',
            '    function walk(el) {\n',
            '      if (!el) return;\n',
            '      if (pointObjs.indexOf(el) !== -1) { addPoint(el); return; }\n',
            '      if (lineObjs.indexOf(el) !== -1) { addPoint(el.a); addPoint(el.b); return; }\n',
            '      if (primitiveObjs.indexOf(el) !== -1) { addPrim(el); return; }\n',
            '      if (figureObjs.indexOf(el) !== -1) { (el.elements || []).forEach(walk); return; }\n',
            '    }\n',
            '    elements.forEach(walk);\n',
            '    return { points: pts, primitives: prims };\n',
            '  }\n',
            '  function applyClusterTransform3D(c) {\n',
            '    if (!c || (!c.points.length && !c.primitives.length)) return;\n',
            '    const rot = c.rotate3D || { x: 0, y: 0, z: 0 };\n',
            '    const euler = new THREE.Euler(rot.x * Math.PI / 180, rot.y * Math.PI / 180, rot.z * Math.PI / 180, \'XYZ\');\n',
            '    const quat = new THREE.Quaternion().setFromEuler(euler);\n',
            '    for (let i = 0; i < c.points.length; i++) {\n',
            '      const p = c.points[i];\n',
            '      if (p === draggedPoint) continue;\n',
            '      const rel = c.relVectors[i].clone().applyQuaternion(quat);\n',
            '      p.mesh.position.set(c.center.x + rel.x, c.center.y + rel.y, c.center.z + rel.z);\n',
            '    }\n',
            '    for (let i = 0; i < c.primitives.length; i++) {\n',
            '      const pr = c.primitives[i];\n',
            '      const rel = c.primRelVectors[i].clone().applyQuaternion(quat);\n',
            '      pr.mesh.position.set(c.center.x + rel.x, c.center.y + rel.y, c.center.z + rel.z);\n',
            '      pr.mesh.quaternion.copy(quat).multiply(c.primBaseQuats[i]);\n',
            '    }\n',
            '  }\n',
            '  const clusters = clustersData.map(function(c) {\n',
            '    const elements = (c.elements || []).map(function(name) {\n',
            '      return findPoint(name) || lineObjs.find(function(l) { return l.name === name; }) ||\n',
            '             figureObjs.find(function(f) { return f.name === name; }) ||\n',
            '             primitiveObjs.find(function(pr) { return pr.name === name; });\n',
            '    }).filter(function(x) { return x !== undefined; });\n',
            '    const members = collectClusterMembers3D(elements);\n',
            '    const allPos = members.points.map(function(p) { return p.mesh.position; })\n',
            '      .concat(members.primitives.map(function(pr) { return pr.mesh.position; }));\n',
            '    let cx = 0, cy = 0, cz = 0;\n',
            '    for (const pos of allPos) { cx += pos.x; cy += pos.y; cz += pos.z; }\n',
            '    if (allPos.length > 0) { cx /= allPos.length; cy /= allPos.length; cz /= allPos.length; }\n',
            '    const center = new THREE.Vector3(cx, cy, cz);\n',
            '    const relVectors = members.points.map(function(p) { return new THREE.Vector3().copy(p.mesh.position).sub(center); });\n',
            '    const primRelVectors = members.primitives.map(function(pr) { return new THREE.Vector3().copy(pr.mesh.position).sub(center); });\n',
            '    const primBaseQuats = members.primitives.map(function(pr) { return pr.mesh.quaternion.clone(); });\n',
            '    return {\n',
            '      name: c.name, elements: elements,\n',
            '      points: members.points, relVectors: relVectors,\n',
            '      primitives: members.primitives, primRelVectors: primRelVectors, primBaseQuats: primBaseQuats,\n',
            '      center: center,\n',
            '      rotate3D: c.rotate3D || { x: 0, y: 0, z: 0 },\n',
            '      active: c.active !== false,\n',
            '    };\n',
            '  });\n',
            '  for (const c of clusters) { applyClusterTransform3D(c); if (window[c.name] === undefined) window[c.name] = c; }\n',
            '  for (const p of pointObjs) { if (window[p.name] === undefined) window[p.name] = p; }\n',
            '  for (const l of lineObjs) { if (window[l.name] === undefined) window[l.name] = l; }\n',
            '  for (const f of figureObjs) { if (window[f.name] === undefined) window[f.name] = f; }\n',
            '  for (const ad of angleDefs) { if (window[ad.name] === undefined) window[ad.name] = ad; }\n',
            '  for (const vo of vectorObjs) { if (window[vo.name] === undefined) window[vo.name] = vo; }\n',
            '  for (const so of surfaceObjs) { if (window[so.name] === undefined) window[so.name] = so; }\n',
            '  for (const fo of fieldObjs) { if (window[fo.name] === undefined) window[fo.name] = fo; }\n',
            '  for (const co of curveObjs) { if (window[co.name] === undefined) window[co.name] = co; }\n',
            '  for (const to of trajectoryObjs) { if (window[to.name] === undefined) window[to.name] = to; }\n',
            '  for (const txo of textObjs) { if (window[txo.name] === undefined) window[txo.name] = txo; }\n',
            '  for (const po of infPlaneObjs) { if (window[po.name] === undefined) window[po.name] = po; }\n',
            '  for (const pr of primitiveObjs) { if (window[pr.name] === undefined) window[pr.name] = pr; }\n',
            '  for (const dr of derivedObjs) { if (window[dr.name] === undefined) window[dr.name] = dr; }\n',
            '  for (const a3 of angle3DObjs) { if (window[a3.name] === undefined) window[a3.name] = a3; }\n',
            '\n',
            '  // ---------- Проекция подписей точек и углов в 2D-слой поверх canvas ----------\n',
            '  function updateLabels() {\n',
            '    const rect = canvas.getBoundingClientRect();\n',
            '    for (const p of pointObjs) {\n',
            '      if (!p.label) continue;\n',
            '      if (!p.active) { p.label.style.display = \'none\'; continue; }\n',
            '      const v = p.mesh.position.clone().project(camera);\n',
            '      if (v.z > 1) { p.label.style.display = \'none\'; continue; }\n',
            '      const sx = (v.x * 0.5 + 0.5) * rect.width;\n',
            '      const sy = (-v.y * 0.5 + 0.5) * rect.height;\n',
            '      p.label.style.display = \'block\';\n',
            '      p.label.style.left = sx + \'px\';\n',
            '      p.label.style.top = sy + \'px\';\n',
            '    }\n',
            '    for (const ao of angleObjs) {\n',
            '      if (!ao.label || ao.label.style.display === \'none\') continue;\n',
            '      const v = ao.labelPos.clone().project(camera);\n',
            '      if (v.z > 1) { ao.label.style.display = \'none\'; continue; }\n',
            '      const sx = (v.x * 0.5 + 0.5) * rect.width;\n',
            '      const sy = (-v.y * 0.5 + 0.5) * rect.height;\n',
            '      ao.label.style.left = sx + \'px\';\n',
            '      ao.label.style.top = sy + \'px\';\n',
            '    }\n',
            '    for (const a3 of angle3DObjs) {\n',
            '      if (!a3.label || a3.label.style.display === \'none\' || !a3.active) { if (a3.label) a3.label.style.display = \'none\'; continue; }\n',
            '      const v = a3.labelPos.clone().project(camera);\n',
            '      if (v.z > 1) { a3.label.style.display = \'none\'; continue; }\n',
            '      const sx = (v.x * 0.5 + 0.5) * rect.width;\n',
            '      const sy = (-v.y * 0.5 + 0.5) * rect.height;\n',
            '      a3.label.style.left = sx + \'px\';\n',
            '      a3.label.style.top = sy + \'px\';\n',
            '    }\n',
            '    for (const pr of primitiveObjs) {\n',
            '      if (!pr.label) continue;\n',
            '      if (!pr.active || pr.hiddenByDerived) { pr.label.style.display = \'none\'; continue; }\n',
            '      const v = pr.mesh.position.clone().project(camera);\n',
            '      if (v.z > 1) { pr.label.style.display = \'none\'; continue; }\n',
            '      const sx = (v.x * 0.5 + 0.5) * rect.width;\n',
            '      const sy = (-v.y * 0.5 + 0.5) * rect.height;\n',
            '      pr.label.style.display = \'block\';\n',
            '      pr.label.style.left = sx + \'px\';\n',
            '      pr.label.style.top = sy + \'px\';\n',
            '    }\n',
            '    for (const dr of derivedObjs) {\n',
            '      if (!dr.label) continue;\n',
            '      if (!dr.active || dr.hiddenByDerived) { dr.label.style.display = \'none\'; continue; }\n',
            '      const refMesh = dr.capMesh || dr.mesh;\n',
            '      if (!refMesh || !refMesh.geometry.boundingSphere) { dr.label.style.display = \'none\'; continue; }\n',
            '      const v = refMesh.geometry.boundingSphere.center.clone().project(camera);\n',
            '      if (v.z > 1) { dr.label.style.display = \'none\'; continue; }\n',
            '      const sx = (v.x * 0.5 + 0.5) * rect.width;\n',
            '      const sy = (-v.y * 0.5 + 0.5) * rect.height;\n',
            '      dr.label.style.display = \'block\';\n',
            '      dr.label.style.left = sx + \'px\';\n',
            '      dr.label.style.top = sy + \'px\';\n',
            '    }\n',
            '  }\n',
            '\n',
            '  // ---------- Управление: вращение камеры мышью/тачем, зум колесом/пинчем,\n',
            '  // перетаскивание интерактивных точек (dynamic = true — так же, как включается\n',
            '  // интерактивность точки в 2D). Точка имеет приоритет над вращением камеры. ----------\n',
            '  const raycaster = new THREE.Raycaster();\n',
            '  const mouseNDC = new THREE.Vector2();\n',
            '  const dragPlane = new THREE.Plane();\n',
            '  const dragPlaneHit = new THREE.Vector3();\n',
            '  const dragOffset = new THREE.Vector3();\n',
            '  let camDragging = false, lastX = 0, lastY = 0;\n',
            '  let draggedCluster = null;\n',
            '  let lastPinch = null;\n',
            '\n',
            '  function setMouseNDC(clientX, clientY) {\n',
            '    const rect = canvas.getBoundingClientRect();\n',
            '    mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;\n',
            '    mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;\n',
            '  }\n',
            '\n',
            '  function hitTestPoint(clientX, clientY) {\n',
            '    setMouseNDC(clientX, clientY);\n',
            '    raycaster.setFromCamera(mouseNDC, camera);\n',
            '    const meshes = pointObjs.filter(function(p) { return p.dynamic && p.active; }).map(function(p) { return p.mesh; });\n',
            '    const hits = raycaster.intersectObjects(meshes, false);\n',
            '    if (hits.length === 0) return null;\n',
            '    return pointObjs.find(function(p) { return p.mesh === hits[0].object; }) || null;\n',
            '  }\n',
            '  // Хит-тест по мешам точек/примитивов, входящих в перетаскиваемые (interact=true)\n',
            '  // кластеры — позволяет схватить составное тело целиком и подвинуть его как единый\n',
            '  // жёсткий объект (без изменения его поворота, только трансляция центра масс).\n',
            '  function hitTestCluster(clientX, clientY) {\n',
            '    setMouseNDC(clientX, clientY);\n',
            '    raycaster.setFromCamera(mouseNDC, camera);\n',
            '    const meshes = []; const meshOwner = new Map();\n',
            '    for (const c of clusters) {\n',
            '      if (!c.interact || c.active === false) continue;\n',
            '      for (const p of c.points) { if (p.active) { meshes.push(p.mesh); meshOwner.set(p.mesh, c); } }\n',
            '      for (const pr of c.primitives) { if (pr.active) { meshes.push(pr.mesh); meshOwner.set(pr.mesh, c); } }\n',
            '    }\n',
            '    const hits = raycaster.intersectObjects(meshes, false);\n',
            '    if (hits.length === 0) return null;\n',
            '    return meshOwner.get(hits[0].object) || null;\n',
            '  }\n',
            '\n',
            '  function onDown(clientX, clientY) {\n',
            '    const hit = hitTestPoint(clientX, clientY);\n',
            '    if (hit) {\n',
            '      draggedPoint = hit;\n',
            '      const camDir = new THREE.Vector3();\n',
            '      camera.getWorldDirection(camDir);\n',
            '      dragPlane.setFromNormalAndCoplanarPoint(camDir, hit.mesh.position);\n',
            '      raycaster.ray.intersectPlane(dragPlane, dragPlaneHit);\n',
            '      dragOffset.copy(hit.mesh.position).sub(dragPlaneHit);\n',
            '      wrapper.classList.add(\'dragging-point\');\n',
            '      return;\n',
            '    }\n',
            '    const chit = hitTestCluster(clientX, clientY);\n',
            '    if (chit) {\n',
            '      draggedCluster = chit;\n',
            '      const camDir = new THREE.Vector3();\n',
            '      camera.getWorldDirection(camDir);\n',
            '      dragPlane.setFromNormalAndCoplanarPoint(camDir, chit.center);\n',
            '      raycaster.ray.intersectPlane(dragPlane, dragPlaneHit);\n',
            '      dragOffset.copy(chit.center).sub(dragPlaneHit);\n',
            '      wrapper.classList.add(\'dragging-point\');\n',
            '      return;\n',
            '    }\n',
            '    if (!canRotateCamera) return;\n',
            '    camDragging = true;\n',
            '    lastX = clientX; lastY = clientY;\n',
            '    wrapper.classList.add(\'dragging-cam\');\n',
            '  }\n',
            '  function onMove(clientX, clientY) {\n',
            '    if (draggedPoint) {\n',
            '      setMouseNDC(clientX, clientY);\n',
            '      raycaster.setFromCamera(mouseNDC, camera);\n',
            '      if (raycaster.ray.intersectPlane(dragPlane, dragPlaneHit)) {\n',
            '        draggedPoint.mesh.position.copy(dragPlaneHit).add(dragOffset);\n',
            '      }\n',
            '      return;\n',
            '    }\n',
            '    if (draggedCluster) {\n',
            '      setMouseNDC(clientX, clientY);\n',
            '      raycaster.setFromCamera(mouseNDC, camera);\n',
            '      if (raycaster.ray.intersectPlane(dragPlane, dragPlaneHit)) {\n',
            '        draggedCluster.center.copy(dragPlaneHit.clone().add(dragOffset));\n',
            '        applyClusterTransform3D(draggedCluster);\n',
            '      }\n',
            '      return;\n',
            '    }\n',
            '    if (!camDragging) return;\n',
            '    const dx = clientX - lastX, dy = clientY - lastY;\n',
            '    lastX = clientX; lastY = clientY;\n',
            '    theta -= dx * 0.008;\n',
            '    phi = clampPhi(phi - dy * 0.008);\n',
            '    updateCameraPosition();\n',
            '  }\n',
            '  function onUp() {\n',
            '    camDragging = false;\n',
            '    draggedPoint = null;\n',
            '    draggedCluster = null;\n',
            '    wrapper.classList.remove(\'dragging-cam\');\n',
            '    wrapper.classList.remove(\'dragging-point\');\n',
            '  }\n',
            '  canvas.addEventListener(\'mousedown\', function(e) { onDown(e.clientX, e.clientY); });\n',
            '  window.addEventListener(\'mousemove\', function(e) { onMove(e.clientX, e.clientY); });\n',
            '  window.addEventListener(\'mouseup\', onUp);\n',
            '  canvas.addEventListener(\'touchstart\', function(e) {\n',
            '    if (e.touches.length === 1) { onDown(e.touches[0].clientX, e.touches[0].clientY); }\n',
            '    lastPinch = null;\n',
            '  }, { passive: true });\n',
            '  canvas.addEventListener(\'touchmove\', function(e) {\n',
            '    if (e.touches.length === 1) { onMove(e.touches[0].clientX, e.touches[0].clientY); }\n',
            '    else if (e.touches.length === 2 && canZoomCamera) {\n',
            '      const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;\n',
            '      const dist = Math.sqrt(dx * dx + dy * dy);\n',
            '      if (lastPinch) { camZoom *= (dist / lastPinch); updateCameraPosition(); }\n',
            '      lastPinch = dist;\n',
            '    }\n',
            '  }, { passive: true });\n',
            '  canvas.addEventListener(\'touchend\', function() { onUp(); lastPinch = null; }, { passive: true });\n',
            '  canvas.addEventListener(\'wheel\', function(e) {\n',
            '    if (!canZoomCamera) return;\n',
            '    e.preventDefault();\n',
            '    camZoom *= Math.pow(1.0015, -e.deltaY);\n',
            '    updateCameraPosition();\n',
            '  }, { passive: false });\n',
            '\n',
            '  // ---------- Изменение размера ----------\n',
            '  function resize() {\n',
            '    const rect = wrapper.getBoundingClientRect();\n',
            '    const w = Math.max(1, Math.round(rect.width));\n',
            '    const h = Math.max(1, Math.round(rect.height));\n',
            '    renderer.setSize(w, h, false);\n',
            '    camera.aspect = w / h;\n',
            '    camera.updateProjectionMatrix();\n',
            '  }\n',
            '  window.addEventListener(\'resize\', resize);\n',
            '  resize();\n',
            '  updateCameraPosition();\n',
            '\n',
            '  // ---------- Скрипты Start/Update (упрощённая интеграция; доступны переменные и объекты сцены) ----------\n',
            '  try { if (startCode) { (new Function(\'vars\', \'with (vars) { \' + startCode + \' }\'))(userVars); } } catch (e) { console.error(\'Ошибка в Start:\', e); }\n',
            '  clusters.forEach(applyClusterTransform3D);\n',
            '\n',
            '  function animate() {\n',
            '    requestAnimationFrame(animate);\n',
            '    try { if (updateCode) { (new Function(\'vars\', \'with (vars) { \' + updateCode + \' }\'))(userVars); } } catch (e) { /* тихо игнорируем ошибки покадрового кода */ }\n',
            '    clusters.forEach(applyClusterTransform3D);\n',
            '    for (const p of pointObjs) { p.active = g3IsActive(p.activeExpr, p.active); p.mesh.visible = p.active; }\n',
            '    for (const pr of primitiveObjs) { pr.active = g3IsActive(pr.activeExpr, pr.active); pr.mesh.visible = pr.active && !pr.hiddenByDerived; }\n',
            '    for (const dr of derivedObjs) {\n',
            '      dr.active = g3IsActive(dr.activeExpr, dr.active);\n',
            '      const vis = dr.active && !dr.hiddenByDerived;\n',
            '      if (dr.mesh) dr.mesh.visible = vis;\n',
            '      if (dr.capMesh) dr.capMesh.visible = vis;\n',
            '    }\n',
            '    for (const lo of lineObjs) { lo.active = g3IsActive(lo.activeExpr, lo.active); lo.mesh.visible = lo.active; }\n',
            '    for (const fo of fillingObjs) { fo.mesh.visible = g3IsActive(fo.activeExpr, fo.active); }\n',
            '    for (const po of infPlaneObjs) { const vis = g3IsActive(po.activeExpr, po.active); po.mesh.visible = vis; if (po.edges) po.edges.visible = vis; if (vis) updateInfPlane(po); }\n',
            '    for (const so of surfaceObjs) { so.mesh.visible = g3IsActive(so.activeExpr, so.active); }\n',
            '    for (const co of curveObjs) { co.mesh.visible = g3IsActive(co.activeExpr, co.active); }\n',
            '    for (const to of trajectoryObjs) { to.mesh.visible = g3IsActive(to.activeExpr, to.active); }\n',
            '    for (const fo of fieldObjs) { fo.visible = g3IsActive(fo.activeExpr, fo.active); if (!fo.visible) { for (const ar of fo.arrows) ar.mesh.visible = false; } }\n',
            '    for (const lo of lineObjs) { updateLineMesh(lo); }\n',
            '    for (const fo of fillingObjs) { updateFillingMesh(fo); }\n',
            '    for (const vo of vectorObjs) { updateVectorMesh(vo); }\n',
            '    for (const ao of angleObjs) { updateAngleObj(ao); }\n',
            '    for (const a3 of angle3DObjs) { a3.active = g3IsActive(a3.activeExpr, a3.active); if (a3.active) updateAngle3DObj(a3); else { a3.mesh.visible = false; if (a3.label) a3.label.style.display = \'none\'; } }\n',
            '    for (const so of surfaceObjs) { updateSurfaceMesh(so); }\n',
            '    for (const fo of fieldObjs) { if (fo.visible) updateFieldObj(fo); }\n',
            '    for (const co of curveObjs) { updateCurveMesh(co); }\n',
            '    for (const to of trajectoryObjs) { updateTrajectoryMesh(to); }\n',
            '    for (const txo of textObjs) { updateTextObj(txo); }\n',
            '    camera.updateMatrixWorld();\n',
            '    updateLabels();\n',
            '    renderer.render(scene, camera);\n',
            '  }\n',
            '  animate();\n',
            '})();\n',
            '<' + '/script>\n',
            '</body>\n',
            '</html>'
        ];
        return parts.join('');
    } catch (e) {
        console.error('Ошибка в generate3D:', e);
        return null;
    }
}

        // ========== ПАРСЕР ОСНОВНЫХ ПОЛЕЙ ==========
        function parseAndValidate(codeBlock) {
            const errors = [];
            const params = {};
            let lineNum = 0;

            const codeWithoutComments = removeComments(codeBlock);
            const { vars, errors: varErrors } = parseVariablesAndExpressions(codeWithoutComments);
            errors.push(...varErrors);

            const { startCodes, updateCodes } = extractMethodBlocks(codeWithoutComments);
            const funcsData = findFuncDeclarations(codeWithoutComments).map(d => ({ name: d.name, params: d.params, bodyExpr: d.bodyExpr }));
            const procsData = findAllProcDeclarations(codeWithoutComments).map(d => ({ name: d.name, params: d.params, body: d.body, isVoid: d.isVoid }));

            let codeForParams = removeMethodBlocks(codeWithoutComments);
            codeForParams = removeFuncDeclarations(codeForParams);
            codeForParams = removeProcDeclarations(codeForParams);
            codeForParams = removeObjectBlocks(codeForParams);

            const lines = codeForParams.split('\n');

            const validKeys = ['space', 'title', 'undertitle', 'description', 'footer',
                               'can rotate camera', 'can zoom camera',
                               'zoom limits', 'camera start zoom', 'camera start rot',
                               'camera zoom limits', 'camera start offset',
                               'field width', 'field height', 'field depth', 'field color',
                               'frame color', 'frame width',
                               'title color', 'title size',
                               'undertitle color', 'undertitle size',
                               'description color', 'description size',
                               'footer color', 'footer size',
                               'theme',
                               'show axes', 'show axis x', 'show axis y', 'show axis z', 'axes size',
                               'show grid', 'show grid x', 'show grid y', 'show grid z', 'grid size',
                               'snap', 'snap grid', 'snap distance'];
            const requiredKeys = ['space', 'title', 'undertitle', 'description'];
            const numericKeys = ['field width', 'field height', 'field depth', 'frame width', 'title size', 'undertitle size', 'description size', 'footer size', 'camera start zoom', 'axes size', 'grid size', 'snap grid', 'snap distance'];
            // zoom limits = (min, max) дистанция камеры от центра сцены (только 3D)
            // camera start rot = (азимут, полярный угол) в градусах — начальный поворот камеры (только 3D)
            const tupleKeys = ['camera zoom limits', 'camera start offset', 'zoom limits', 'camera start rot'];
            // Цвет везде в языке пишется без кавычек (#rrggbb, как и в блоках объектов вида
            // "new Point { color = #ff0000 }") — здесь та же конвенция для цветов заголовка.
            const colorKeys = ['field color', 'frame color', 'title color', 'undertitle color', 'description color', 'footer color'];

            for (let rawLine of lines) {
                lineNum++;
                let line = rawLine.trim();
                if (line === '') continue;
                if (line.startsWith('//')) continue;
                if (/^\s*(int|float|string|bool|Vector2|color|list)\s+/.test(line)) continue;
                if (line.endsWith(';')) line = line.slice(0, -1).trim();

                const eqIndex = line.indexOf('=');
                if (eqIndex === -1) {
                    if (line && !line.startsWith('[') && !line.startsWith(']')) {
                        errors.push({ line: lineNum, message: `Неверный синтаксис (нет '=')` });
                    }
                    continue;
                }

                const key = line.substring(0, eqIndex).trim();
                let value = line.substring(eqIndex + 1).trim();

                if (key === '' || value === '') {
                    errors.push({ line: lineNum, message: `Пустой ключ или значение` });
                    continue;
                }
                if (!validKeys.includes(key)) {
                    errors.push({ line: lineNum, message: `Неизвестный ключ "${key}"` });
                    continue;
                }

                let parsedValue;
                const isQuoted = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
                if (colorKeys.includes(key)) {
                    // Цвет — всегда без кавычек: field color = #ff0000 (а не "#ff0000").
                    if (isQuoted) {
                        errors.push({ line: lineNum, message: `Цвет для "${key}" указывается без кавычек, например: ${key} = #ff0000` });
                        continue;
                    }
                    if (/^#[0-9A-Fa-f]+$/.test(value)) {
                        parsedValue = value;
                    } else {
                        errors.push({ line: lineNum, message: `Некорректный цвет для "${key}", ожидается формат #rrggbb без кавычек` });
                        continue;
                    }
                } else if (isQuoted) {
                    let inner = value.slice(1, -1);
                    inner = inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    parsedValue = inner;
                } else {
                    if (key === 'space') {
                        if (value === '2D' || value === '3D') parsedValue = value;
                        else { errors.push({ line: lineNum, message: `space должно быть "2D" или "3D"` }); continue; }
                    } else if (key === 'theme') {
                        if (value === 'light' || value === 'dark') parsedValue = value;
                        else { errors.push({ line: lineNum, message: `theme должно быть "light" или "dark"` }); continue; }
                    } else if (tupleKeys.includes(key)) {
                        const m = value.match(/^\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/);
                        if (!m) { errors.push({ line: lineNum, message: `Некорректный формат для "${key}", ожидается (a, b)` }); continue; }
                        parsedValue = [parseFloat(m[1]), parseFloat(m[2])];
                    } else if (key === 'title' || key === 'undertitle' || key === 'description' || key === 'footer') {
                        try { parsedValue = evaluateStringExpression(value, vars); } catch (e) { parsedValue = value; }
                    } else if (numericKeys.includes(key)) {
                        const num = parseFloat(value);
                        if (!isNaN(num)) parsedValue = num;
                        else { errors.push({ line: lineNum, message: `Некорректное числовое значение для "${key}"` }); continue; }
                    } else {
                        if (value === 'true') parsedValue = true;
                        else if (value === 'false') parsedValue = false;
                        else { errors.push({ line: lineNum, message: `Некорректное значение "${value}"` }); continue; }
                    }
                }

                const booleanKeys = ['can rotate camera', 'can zoom camera',
                                     'show axes', 'show axis x', 'show axis y', 'show axis z',
                                     'show grid', 'show grid x', 'show grid y', 'show grid z', 'snap'];
                if (key !== 'space' && !booleanKeys.includes(key) && !numericKeys.includes(key) && !tupleKeys.includes(key)) {
                    if (typeof parsedValue !== 'string') parsedValue = String(parsedValue);
                }
                if (booleanKeys.includes(key)) {
                    if (typeof parsedValue !== 'boolean') {
                        errors.push({ line: lineNum, message: `Значение для "${key}" должно быть true или false` });
                        continue;
                    }
                }
                params[key] = parsedValue;
            }

            for (let req of requiredKeys) {
                if (!(req in params)) {
                    errors.push({ line: '--', message: `Отсутствует обязательное поле "${req}"` });
                }
            }

            return { params, errors, vars, startCodes, updateCodes, funcsData, procsData };
        }

        // ========== КОМПИЛЯЦИЯ ==========
    function compile(sourceCode) {
        try {
            const match = sourceCode.match(/\[([\s\S]*)\]/);
            if (!match) {
                return { success: false, errors: ['Не найден блок в квадратных скобках [ ... ]'] };
            }
            const block = match[1];

            const { params, errors: paramErrors, vars, startCodes, updateCodes, funcsData, procsData } = parseAndValidate(block);
            if (paramErrors.length > 0) {
                return { success: false, errors: paramErrors.map(e => e.message) };
            }

            // Тема (по умолчанию — тёмная) выставляется до разбора команд отрисовки,
            // чтобы объекты без явного цвета получали цвет по умолчанию нужной темы.
            currentThemeName = (params.theme === 'light' || params.theme === 'dark') ? params.theme : 'dark';

            const {
                points, lines, figures, primitives, derivedOps, clusters, angles, angles3D,
                drawAngles, drawEqually, drawVectors, drawInfLines, drawInfPlanes, drawFillings, drawPunctirs, drawTexts,
                uiElements, circles, arcs, ellipses, curves, drawFunctions, drawSurfaces, drawImages,
                drawHistograms, drawFields, drawTrajectories, drawGraphs, drawFractals,
                drawFormulas, drawLoci, drawTraces, drawRegions, drawCharts, drawTrees, drawTables,
                drawComplexes, drawHyperbolics, drawBifurcations, drawCobwebs, drawIFSs, drawAutomata, drawVoronois, drawFouriers, drawDiagrams, errors: cmdErrors
            } = parseCommands(removeComments(block), vars);

            if (cmdErrors.length > 0) {
                return { success: false, errors: cmdErrors.map(e => e.message) };
            }

            // Объёмные примитивы, сечения (new Section), булевы операции (new Boolean) и
            // специфичные для 3D углы (new Angle3D) осмысленны только в 3D-сцене.
            if (params.space === '2D' && (primitives.length > 0 || derivedOps.length > 0 || angles3D.length > 0)) {
                return { success: false, errors: ['new Primitive/Section/Boolean/Angle3D (объёмные примитивы, сечения, булевы операции, 3D-углы) доступны только при space = "3D"'] };
            }

            // Валидация ссылок на функции: draw Function/Surface и Trajectory(system=...)
            // должны ссылаться либо на func-объявление, либо на formula-поле UI,
            // либо на функцию, определяемую в Start через funcDef.
            {
                const knownFuncs = new Set(funcsData.map(f => f.name));
                for (const p of procsData) knownFuncs.add(p.name);
                for (const u of uiElements) {
                    if (u.inputtype === 'formula') knownFuncs.add(u.funcName || u.variable || 'userFunc');
                }
                const dynDefs = (startCodes || []).concat(updateCodes || []).join('\n').match(/\bfunc\s+([A-Za-z_][A-Za-z0-9_]*)/g) || [];
                for (const d of dynDefs) knownFuncs.add(d.replace(/\bfunc\s+/, ''));
                const funcRefErrors = [];
                for (const d of drawFunctions) {
                    if (!knownFuncs.has(d.funcName)) funcRefErrors.push(`draw Function "${d.name}" ссылается на необъявленную функцию "${d.funcName}"`);
                }
                for (const d of drawSurfaces) {
                    if (d.type === 'parametric') continue;
                    if (!knownFuncs.has(d.funcName)) funcRefErrors.push(`draw Surface "${d.name}" ссылается на необъявленную функцию "${d.funcName}"`);
                }
                for (const tr of drawTrajectories) {
                    if (tr.systemName && !knownFuncs.has(tr.systemName)) funcRefErrors.push(`draw Trajectory "${tr.name}" ссылается на необъявленную функцию "${tr.systemName}"`);
                }
                for (const d of drawRegions) {
                    if (!knownFuncs.has(d.funcName)) funcRefErrors.push(`draw Region "${d.name}" ссылается на необъявленную функцию "${d.funcName}"`);
                    if (d.func2Name && !knownFuncs.has(d.func2Name)) funcRefErrors.push(`draw Region "${d.name}" ссылается на необъявленную функцию "${d.func2Name}"`);
                }
                for (const d of drawLoci) {
                    if (!points.find(p => p.name === d.pointName)) funcRefErrors.push(`draw Locus "${d.name}": точка "${d.pointName}" не объявлена`);
                    if (!points.find(p => p.name === d.driverName)) funcRefErrors.push(`draw Locus "${d.name}": ведущая точка "${d.driverName}" не объявлена`);
                }
                for (const d of drawTraces) {
                    if (!points.find(p => p.name === d.pointName)) funcRefErrors.push(`draw Trace "${d.name}": точка "${d.pointName}" не объявлена`);
                }
                if (funcRefErrors.length > 0) {
                    return { success: false, errors: funcRefErrors };
                }
            }

            let html;
            if (params.space === '2D') {
                html = generate2D(
                    params,
                    points, lines, figures, clusters, angles,
                    drawAngles, drawEqually, drawVectors, drawInfLines, drawFillings, drawPunctirs,
                    drawTexts, uiElements, circles, arcs, ellipses, curves, drawFunctions, drawSurfaces, drawImages,
                    drawHistograms, drawFields, drawTrajectories, drawGraphs, drawFractals,
                    drawFormulas, drawLoci, drawTraces, drawRegions, drawCharts, drawTrees, drawTables,
                    drawComplexes, drawHyperbolics, drawBifurcations, drawCobwebs, drawIFSs, drawAutomata, drawVoronois, drawFouriers, drawDiagrams,
                    funcsData, procsData, vars, startCodes, updateCodes
                );
            } else {
                html = generate3D(
                    params,
                    points, lines, figures, clusters, drawFillings, angles, drawAngles, drawVectors,
                    drawSurfaces, drawFields, curves, drawTrajectories, drawTexts, uiElements,
                    drawInfPlanes,
                    funcsData, procsData, vars, startCodes, updateCodes,
                    primitives, derivedOps, angles3D
                );
            }

            if (!html) {
                return { success: false, errors: ['Ошибка генерации HTML'] };
            }

            return { success: true, html };
        } catch (e) {
            return { success: false, errors: [e.message] };
        }
    }
    export { compile };

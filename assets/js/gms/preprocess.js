// assets/js/gms/preprocess.js
// Предобработка исходника .gms: экранирование, темы оформления, поиск строк/комментариев,
// выделение объявлений функций/процедур/методов и блоков объектов из текста сцены.
// Часть компилятора GMS; точка входа — assets/js/gms-compiler.js.

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
        // Служебные поля вида __pos (смещение символа в исходнике — только для формирования
        // "строка N, символ M" в сообщениях об ошибках компиляции, см. offsetToLineCol) не
        // должны попадать в скомпилированные данные сцены — отфильтровываем их здесь же, в
        // одном месте, а не точечной зачисткой каждого массива объектов по отдельности.
        function jsonForScript(value) {
            return JSON.stringify(value, (key, val) => (key.startsWith('__') ? undefined : val))
                .replace(/</g, '\\u003c')
                .replace(/\u2028/g, '\\u2028')
                .replace(/\u2029/g, '\\u2029');
        }

        // Разбор экранирования внутри "..."-значений top-level параметров (description и т.п.)
        // — один проход по символам, а не цепочка replace(), чтобы \\n не превращалось в перевод
        // строки дважды (после того как \\\\ уже развернулось в \\). Поддерживает \\n и \\t —
        // это единственный способ вписать реальный перевод строки в description, т.к. сам разбор
        // top-level параметров построчный и настоящий перевод строки внутри значения недопустим.
        function gcUnescapeStringLiteral(inner) {
            let out = '';
            for (let i = 0; i < inner.length; i++) {
                const c = inner[i];
                if (c === '\\' && i + 1 < inner.length) {
                    const next = inner[i + 1];
                    if (next === 'n') { out += '\n'; i++; }
                    else if (next === 't') { out += '\t'; i++; }
                    else if (next === '"') { out += '"'; i++; }
                    else if (next === "'") { out += "'"; i++; }
                    else if (next === '\\') { out += '\\'; i++; }
                    else { out += c; }
                } else {
                    out += c;
                }
            }
            return out;
        }

        // ========== ТЕМЫ ОФОРМЛЕНИЯ ==========
        // Две заготовки: тёмная (по умолчанию) и светлая. "light" воспроизводит исходную
        // (дореформенную) цветовую схему компилятора, чтобы не ломать старые примеры.
        const THEME_PRESETS = {
            // Палитра подобрана по образцу современных графических калькуляторов
            // (Desmos, GeoGebra): спокойное поле, тонкая двухуровневая сетка, мягкие
            // оси, подписи с «ореолом» цвета поля, чтобы читаться поверх линий.
            dark: {
                background: '#161a23',
                fieldColor: '#141821',
                frameColor: '#2b3242',
                defaultColor: '#e6e9f2',
                descColor: '#d9dce6',
                controlBg: '#252c3b',
                controlBorder: '#3a4357',
                controlText: '#e6e9f2',
                buttonText: '#f2f4fa',
                inputBg: '#1b202b',
                accent: '#7b8cff',
                gridMinor: 'rgba(160,172,200,0.07)',
                gridMajor: 'rgba(160,172,200,0.16)',
                axis: 'rgba(214,220,235,0.62)',
                axisText: 'rgba(214,220,235,0.72)',
                halo: '#141821',
                point: '#8b9bff',
                curve: '#6ea8ff',
            },
            light: {
                background: '#ffffff',
                fieldColor: '#ffffff',
                frameColor: '#d9dde6',
                defaultColor: '#1f2430',
                descColor: '#1f2430',
                controlBg: '#eef1f7',
                controlBorder: '#cdd3df',
                controlText: '#1f2430',
                buttonText: '#1f2430',
                inputBg: '#ffffff',
                accent: '#2f6fed',
                gridMinor: 'rgba(30,40,70,0.05)',
                gridMajor: 'rgba(30,40,70,0.13)',
                axis: 'rgba(31,36,48,0.7)',
                axisText: 'rgba(31,36,48,0.72)',
                halo: '#ffffff',
                point: '#2f6fed',
                curve: '#2563eb',
            },
        };
        // Тема текущей компиляции — выставляется в compile() до разбора команд, чтобы
        // все parse*Block-функции могли брать её как значение по умолчанию для цвета объектов.
        let currentThemeName = 'dark';
        // Присваивается из compile() (другой модуль) — через сеттер: импорт ES-модуля
        // нельзя переприсвоить снаружи.
        function setCurrentThemeName(name) { currentThemeName = name; }
        function themeDefaultColor() {
            return (THEME_PRESETS[currentThemeName] || THEME_PRESETS.dark).defaultColor;
        }

        // Находится ли символ со смещением pos внутри строкового литерала или комментария.
        // Проверка "i === pos" СТОИТ В НАЧАЛЕ тела цикла осознанно: раньше она была последней,
        // и до неё не доходило управление ни для одного символа внутри комментария (ветки
        // inLineComment/inBlockComment завершались безусловным continue) — из-за чего любая
        // позиция внутри // или /* */ ошибочно считалась "снаружи". Также сюда не попадали
        // сами кавычки и экранированные символы. Отдельно: escapeNext теперь взводится только
        // ВНУТРИ строки — раньше одиночный '\' в обычном коде съедал следующий символ.
        // Ранний return вместо прохода по всему тексту заодно убирает лишнюю работу: функция
        // вызывается в цикле по всем совпадениям, то есть суммарно была O(n²) по длине скрипта.
        function isInsideStringOrComment(code, pos) {
            if (typeof pos !== 'number' || pos < 0 || pos >= code.length) return false;
            let inString = false;
            let stringChar = '';
            let escapeNext = false;
            let inLineComment = false;
            let inBlockComment = false;
            for (let i = 0; i < code.length; i++) {
                if (i === pos) return inString || inLineComment || inBlockComment;
                const ch = code[i];
                if (inLineComment) {
                    if (ch === '\n') inLineComment = false;
                    continue;
                }
                // Второй символ парных токенов (//, /* и */) пропускается через i++, поэтому
                // проверка в начале цикла до него не доходит — обрабатываем его здесь явно:
                // он тоже принадлежит комментарию.
                if (inBlockComment) {
                    if (ch === '*' && code[i + 1] === '/') {
                        if (i + 1 === pos) return true;
                        inBlockComment = false; i++;
                    }
                    continue;
                }
                if (inString) {
                    if (escapeNext) { escapeNext = false; continue; }
                    if (ch === '\\') { escapeNext = true; continue; }
                    if (ch === stringChar) inString = false;
                    continue;
                }
                if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
                if (ch === '/' && code[i + 1] === '/') {
                    if (i + 1 === pos) return true;
                    inLineComment = true; i++; continue;
                }
                if (ch === '/' && code[i + 1] === '*') {
                    if (i + 1 === pos) return true;
                    inBlockComment = true; i++; continue;
                }
            }
            return false;
        }

        // ВАЖНО: длина результата всегда равна длине входа (комментарии заменяются на
        // пробелы/переводы строк, а не удаляются) — это нужно, чтобы смещения символов,
        // найденные в этом "очищенном" тексте, оставались КОРРЕКТНЫМИ позициями в исходном
        // скрипте пользователя (см. offsetToLineCol/formatErrorWithPos) — раньше комментарии
        // вырезались целиком, и все сообщения об ошибках после комментария указывали бы не на ту
        // строку/символ.
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
                    result += '  ';
                    i++;
                    continue;
                }
                if (!inLineComment && !inBlockComment && !inString && ch === '/' && i + 1 < code.length && code[i+1] === '*') {
                    inBlockComment = true;
                    result += '  ';
                    i++;
                    continue;
                }
                if (inBlockComment && ch === '*' && i + 1 < code.length && code[i+1] === '/') {
                    inBlockComment = false;
                    result += '  ';
                    i++;
                    continue;
                }
                if (inLineComment && ch === '\n') {
                    inLineComment = false;
                    result += '\n';
                    continue;
                }
                if (inLineComment || inBlockComment) { result += (ch === '\n' ? '\n' : ' '); continue; }
                result += ch;
            }
            return result;
        }

        // Находит блоки вида "<header> [= ] { ... } [;]" со СБАЛАНСИРОВАННЫМИ фигурными
        // скобками; скобки внутри строк и комментариев не учитываются. Исправляет два бага:
        // 1) '};' внутри строки (например, action кнопки с мини-языком) обрывал блок раньше времени;
        // 2) вложенные { } внутри значений полей ломали нежадные regex-экстракторы.
        // Переводит абсолютное смещение символа в исходном тексте в (строка, символ) —
        // оба 1-based, как принято при отображении пользователю. Используется, чтобы
        // все сообщения об ошибках указывали КОНКРЕТНОЕ место в скрипте, а не общее "где-то".
        function offsetToLineCol(code, offset) {
            if (typeof offset !== 'number' || offset < 0) return null;
            let line = 1, lastNewline = -1;
            const end = Math.min(offset, code.length);
            for (let i = 0; i < end; i++) {
                if (code[i] === '\n') { line++; lastNewline = i; }
            }
            const col = end - lastNewline;
            return { line, col };
        }
        // Приписывает "(строка N, символ M)" к сообщению об ошибке, если для неё известно
        // смещение (__pos). Без смещения сообщение возвращается как есть — оно уже
        // сформулировано достаточно конкретно само по себе (см. diagnoseBlockIssues).
        function formatErrorWithPos(sourceCode, message, pos) {
            if (pos === undefined || pos === null) return message;
            const lc = offsetToLineCol(sourceCode, pos);
            if (!lc) return message;
            return `${message} (строка ${lc.line}, символ ${lc.col})`;
        }
        // Поля, у которых по правилам языка НЕ должно быть кавычек (числа, true/false, и
        // перечисления вроде bar/pie/line/circle без кавычек) — самая частая путаница у тех,
        // кто по аналогии с другими полями (f = "myFunc") оборачивает в кавычки вообще всё.
        const GMS_UNQUOTED_FIELDS = new Set([
            'active', 'layer', 'opacity', 'size', 'thickness', 'radius', 'x', 'y', 'z',
            'min', 'max', 'step', 'width', 'height', 'angle', 'ratio', 'ratioY', 'dx', 'dy', 't',
            'quality', 'maxIter', 'scale', 'centerRe', 'centerIm', 'mu', 'sigma', 'n', 'p', 'lambda',
            'a', 'b', 'xmin', 'xmax', 'ymin', 'ymax', 'zmin', 'zmax', 'segments', 'bins', 'rotate',
            'collision', 'collisionGroup', 'collisionMargin', 'interact', 'extend', 'dynamic',
            'pauseOnDrag', 'border', 'markers', 'regression', 'showValues', 'showAxes', 'horizontal',
            'contours', 'directed', 'showWeights', 'labels', 'stepper', 'billboard', 'wireframe',
            'showInfo', 'textSize', 'nodeRadius', 'levelGap', 'spacing', 'panelWidth', 'panelHeight',
            'kmax', 'highlightFrom', 'highlightTo', 'highlightOpacity', 'filled', 'adaptiveIter',
            'periodicityCheck', 'iterations', 'skip', 'keep', 'rmin', 'rmax', 'x0', 'level', 'level2',
            // Поля-перечисления (enum) — в этом языке почти всегда пишутся БЕЗ кавычек
            // (type = cube; shape = circle;), в отличие от строковых полей-ссылок вроде f = "myFunc".
            'type', 'shape', 'mode', 'axis', 'palette', 'inputtype', 'combine',
        ]);
        // Лёгкий текстовый анализ содержимого блока — не полноценный парсинг, а эвристики для
        // самых частых опечаток, чтобы вместо общего "пропущены обязательные поля" сообщение
        // называло КОНКРЕТНУЮ причину: лишние кавычки там, где ожидалось число/true|false,
        // пропущенная запятая в списке, несовпадающие скобки.
        function diagnoseBlockIssues(body) {
            const hints = [];
            // 1) Кавычки у поля, которое должно быть без них.
            const quotedFieldRe = /(?:^|[^A-Za-z0-9_])([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"([^"]*)"/g;
            let qm;
            const seenFields = new Set();
            while ((qm = quotedFieldRe.exec(body)) !== null) {
                const field = qm[1];
                if (seenFields.has(field)) continue;
                if (GMS_UNQUOTED_FIELDS.has(field)) {
                    seenFields.add(field);
                    const val = qm[2];
                    const looksBool = val === 'true' || val === 'false';
                    const looksNum = /^-?[\d.]+$/.test(val);
                    if (looksBool) hints.push(`поле "${field}" указано в кавычках ("${val}") — булевы значения true/false пишутся без кавычек: ${field} = ${val}`);
                    else if (looksNum) hints.push(`поле "${field}" указано в кавычках ("${val}") — числа пишутся без кавычек: ${field} = ${val}`);
                    else hints.push(`поле "${field}" указано в кавычках ("${val}") — в этом поле значение пишется без кавычек: ${field} = ${val}`);
                }
            }
            // 2) Несовпадающее число скобок (вне строк) — быстрый проход с учётом кавычек.
            let depthParen = 0, depthBracket = 0, inStr = false, strCh = '';
            for (let i = 0; i < body.length; i++) {
                const ch = body[i];
                if (inStr) { if (ch === '\\') i++; else if (ch === strCh) inStr = false; continue; }
                if (ch === '"' || ch === "'") { inStr = true; strCh = ch; continue; }
                if (ch === '(') depthParen++; else if (ch === ')') depthParen--;
                else if (ch === '[') depthBracket++; else if (ch === ']') depthBracket--;
            }
            if (depthParen !== 0) hints.push(`не совпадает число круглых скобок "(" и ")" — ${depthParen > 0 ? 'не хватает закрывающей ")"' : 'лишняя закрывающая ")"'}`);
            if (depthBracket !== 0) hints.push(`не совпадает число квадратных скобок "[" и "]" — ${depthBracket > 0 ? 'не хватает закрывающей "]"' : 'лишняя закрывающая "]"'}`);
            // 3) Пропущенная запятая внутри списка ( ... ) или [ ... ]: два "слова"/чисел подряд
            // через пробел без разделителя — например (A B) или [1 2 3] вместо (A, B) / [1, 2, 3].
            const listRe = /[([]([^()[\]]*)[)\]]/g;
            let lm;
            while ((lm = listRe.exec(body)) !== null) {
                const inner = lm[1];
                if (/\b(?:[a-zA-Z_][a-zA-Z0-9_]*|-?[\d.]+)\s+(?:[a-zA-Z_][a-zA-Z0-9_]*|-?[\d.]+)\b/.test(inner) && !inner.includes(',')) {
                    hints.push('похоже, в списке в скобках пропущена запятая между элементами');
                    break;
                }
            }
            // 4) name без кавычек. Самая коварная опечатка: parseStringField не находит строку
            // в кавычках, не находит и строковую переменную с таким именем — и молча выдаёт
            // объекту автоимя _autoN. Ошибка всплывает уже позже и совсем в другом месте
            // ("Линия _auto3 ссылается на несуществующую точку"), потому что и точки, и
            // ссылки на них разъехались по автоименам.
            const bareName = body.match(/(?:^|[^A-Za-z0-9_])name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (bareName && !/(?:^|[^A-Za-z0-9_])name\s*=\s*["']/.test(body)) {
                hints.push(`имя указано без кавычек (name = ${bareName[1]}) — имя объекта пишется в кавычках: name = "${bareName[1]}" (без кавычек это трактуется как имя строковой переменной)`);
            }
            return hints;
        }
        function findHeaderedBlocks(code, headerRegexSrc) {
            const re = new RegExp(headerRegexSrc, 'gi');
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
                found.push({ start: m.index, end: end, body: code.slice(bodyStart, bodyEnd), header: m[0], groups: m });
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
        // Как и у removeComments — вырезаемый фрагмент заменяется на столько же переводов
        // строки (без остального текста), сколько в нём было, а не удаляется целиком. Иначе
        // номера строк для всего, что расположено ПОСЛЕ вырезанного Start/Update/Function/Void/
        // draw-блока, начинали бы врать (см. использование в parseAndValidate для top-level
        // параметров сцены типа "show axes = ...;").
        function eraseSpanKeepingLines(code, start, end) {
            const removed = code.slice(start, end);
            let nl = 0;
            for (let i = 0; i < removed.length; i++) if (removed[i] === '\n') nl++;
            return code.slice(0, start) + '\n'.repeat(nl) + code.slice(end);
        }
        function removeFuncDeclarations(code) {
            const decls = findFuncDeclarations(code).sort((a, b) => b.start - a.start);
            let result = code;
            for (let d of decls) { result = eraseSpanKeepingLines(result, d.start, d.end); }
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
            for (let d of decls) { result = eraseSpanKeepingLines(result, d.start, d.end); }
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
                result = eraseSpanKeepingLines(result, block.start, block.end);
            }
            return result;
        }

export { GMS_UNQUOTED_FIELDS, THEME_PRESETS, currentThemeName, diagnoseBlockIssues, eraseSpanKeepingLines, escapeHtml, extractMethodBlocks, findAllProcDeclarations, findBlocks, findBlocksLegacy, findFuncDeclarations, findHeaderedBlocks, findProcDeclarations, formatErrorWithPos, gcUnescapeStringLiteral, isInsideStringOrComment, jsonForScript, offsetToLineCol, removeComments, removeFuncDeclarations, removeMethodBlocks, removeProcDeclarations, setCurrentThemeName, themeDefaultColor };

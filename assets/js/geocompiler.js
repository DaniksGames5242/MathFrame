        function escapeHtml(text) {
            if (!text) return '';
            return text.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;')
                       .replace(/"/g, '&quot;');
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

        function findBlocks(code, keyword) {
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

        function extractMethodBlocks(code) {
            const startBlocks = findBlocks(code, 'Start');
            const updateBlocks = findBlocks(code, 'Update');
            const startCodes = startBlocks.map(b => code.substring(b.bodyStart, b.bodyEnd).trim());
            const updateCodes = updateBlocks.map(b => code.substring(b.bodyStart, b.bodyEnd).trim());
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

function removeObjectBlocks(code) {
    // Регулярные выражения для всех типов блоков, которые нужно удалить
    const blockRegexes = [
        /new\s+Point\s*(?:=\s*)?\{[\s\S]*?\};/g,
        /new\s+Line\s*(?:=\s*)?\{[\s\S]*?\};/g,
        /new\s+Figure\s*(?:=\s*)?\{[\s\S]*?\};/g,
        /new\s+Claster\s*\{[\s\S]*?\};/g,
        /new\s+Angle\s*\{[\s\S]*?\};/g,
        /draw\s+Angle\s*\{[\s\S]*?\};/g,
        /draw\s+EquallySing\s*\{[\s\S]*?\};/g,
        /draw\s+Vector\s*\{[\s\S]*?\};/g,
        /draw\s+InfLine\s*\{[\s\S]*?\};/g,
        /draw\s+Filling\s*\{[\s\S]*?\};/g,
        /draw\s+Punctir\s*\{[\s\S]*?\};/g,
        /draw\s+Text\s*\{[\s\S]*?\};/g,
        /new\s+UI\s*\{[\s\S]*?\};/g,
        /new\s+Circle\s*(?:=\s*)?\{[\s\S]*?\};/g,
        /draw\s+Arc\s*\{[\s\S]*?\};/g,
        /new\s+Ellipse\s*(?:=\s*)?\{[\s\S]*?\};/g,
        /new\s+Curve\s*(?:=\s*)?\{[\s\S]*?\};/g
    ];

    let result = code;
    for (let re of blockRegexes) {
        result = result.replace(re, '');
    }
    return result;
}

        function evaluateNumericExpression(expr, vars) {
            const tokens = expr.split(/([+\-*/()])/).filter(t => t.trim() !== '');
            let result = [];
            for (let t of tokens) {
                let token = t.trim();
                if (!token) continue;
                if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
                    if (vars[token] !== undefined && typeof vars[token] === 'number') {
                        result.push(vars[token]);
                    } else {
                        throw new Error(`Неизвестная переменная: ${token}`);
                    }
                } else if (/^[0-9.]+$/.test(token)) {
                    result.push(parseFloat(token));
                } else {
                    result.push(token);
                }
            }
            let evalStr = '';
            for (let token of result) {
                if (typeof token === 'number') evalStr += token;
                else evalStr += token;
            }
            if (/^[\d.+\-*/()\s]+$/.test(evalStr)) {
                return Function('"use strict"; return (' + evalStr + ')')();
            } else {
                throw new Error(`Некорректное выражение: ${evalStr}`);
            }
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
            const quoted = block.match(new RegExp(field + '\\s*=\\s*"([^"]*)"'));
            if (quoted) return quoted[1];
            const ref = block.match(new RegExp(field + '\\s*=\\s*([a-zA-Z_][a-zA-Z0-9_]*)'));
            if (ref && vars[ref[1]] !== undefined && typeof vars[ref[1]] === 'string') return vars[ref[1]];
            if (field === 'name') return '_auto' + (++autoNameCounter);
            return null;
        }
        // Цвет: #hex, ключевое слово default (-> def), либо имя переменной-строки с #hex
        function parseColorField(block, vars, field, def) {
            const m = block.match(new RegExp(field + '\\s*=\\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)'));
            if (!m) return def;
            const c = m[1];
            if (c === 'default') return def;
            if (c.startsWith('#')) return c;
            if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) return vars[c];
            return def;
        }
        // Булево: true/false, либо имя переменной типа boolean
        function parseBoolField(block, vars, field, def) {
            const m = block.match(new RegExp(field + '\\s*=\\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)'));
            if (!m) return def;
            const v = m[1];
            if (v === 'true') return true;
            if (v === 'false') return false;
            if (vars[v] !== undefined && typeof vars[v] === 'boolean') return vars[v];
            return def;
        }
        // Число: литерал, необязательное ключевое слово default (-> def), либо имя переменной-числа
        function parseNumberField(block, vars, field, def, allowDefaultKeyword) {
            const alt = allowDefaultKeyword ? '[\\d.]+|default|[a-zA-Z_][a-zA-Z0-9_]*' : '[\\d.]+|[a-zA-Z_][a-zA-Z0-9_]*';
            const m = block.match(new RegExp(field + '\\s*=\\s*(' + alt + ')'));
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
            const m = block.match(new RegExp(field + '\\s*=\\s*(\\([^)]*\\)|"[^"]*"|[a-zA-Z_][a-zA-Z0-9_]*)'));
            return m ? m[1] : null;
        }
        // Точка (единичная ссылка): имя ИЛИ (x, y)
        function parsePointRefField(block, vars, field) {
            return resolvePointRef(matchPointRefRaw(block, field), vars);
        }
        // Достаёт содержимое СБАЛАНСИРОВАННЫХ скобок после "field =", корректно работает с вложенными скобками
        // (нужно для списков, где элементом может быть координата "(x, y)")
        function extractParenGroup(block, field) {
            const re = new RegExp(field + '\\s*=\\s*\\(');
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
            let lineNum = 1;
            while ((match = varRegex.exec(codeBlock)) !== null) {
                if (isInsideStringOrComment(codeBlock, match.index)) continue;
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
                            inner = inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
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
                lineNum++;
            }
            return { vars, errors };
        }

        // Исправленный парсер UI: поддерживает вложенные переменные (через точку)
        function parseUIBlock(block, vars) {
            try {
                const typeMatch = block.match(/type\s*=\s*(button|toggle|input)/);
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
                const varMatch = block.match(/variable\s*=\s*([a-zA-Z_][a-zA-Z0-9_.]*)/);
                if (varMatch) variable = varMatch[1]; // может содержать точки

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
                    const itMatch = block.match(/inputtype\s*=\s*(number|text)/);
                    if (itMatch) inputtype = itMatch[1];
                }

                let min = null, max = null, step = null;
                if (type === 'input' && inputtype === 'number') {
                    const minMatch = block.match(/min\s*=\s*([\d.]+)/);
                    if (minMatch) min = parseFloat(minMatch[1]);
                    const maxMatch = block.match(/max\s*=\s*([\d.]+)/);
                    if (maxMatch) max = parseFloat(maxMatch[1]);
                    const stepMatch = block.match(/step\s*=\s*([\d.]+)/);
                    if (stepMatch) step = parseFloat(stepMatch[1]);
                }

                const x = parseNumberField(block, vars, 'x', null, false);
                const y = parseNumberField(block, vars, 'y', null, false);
                const uiWidth = parseNumberField(block, vars, 'width', null, false);
                const uiHeight = parseNumberField(block, vars, 'height', null, false);
                const radius = parseNumberField(block, vars, 'radius', 4, false);

                return { type, label, color, textcolor, active, variable, default: defaultValue, action, inputtype, min, max, step, x, y, width: uiWidth, height: uiHeight, radius };
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

            const arccolor = parseColorField(block, vars, 'arccolor', '#000000');

            const measurecolor = parseColorField(block, vars, 'measurecolor', '#000000');

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

    const color = parseColorField(block, vars, 'color', '#000000');
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

    const color = parseColorField(block, vars, 'color', '#000000');

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

    const color = parseColorField(block, vars, 'color', '#000000');

    let mode = 'full';
    const modeMatch = block.match(/mode\s*=\s*(full|inside|outside|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (modeMatch) {
        let m = modeMatch[1];
        if (m === 'full' || m === 'inside' || m === 'outside') mode = m;
        else if (vars[m] !== undefined && typeof vars[m] === 'string' && (vars[m] === 'full' || vars[m] === 'inside' || vars[m] === 'outside')) mode = vars[m];
    }

    const layer = parseNumberField(block, vars, 'layer', 30, false);
    return { name, figure, line, side, circle, from, to, arc, shape, color, mode, layer };
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

        function parsePointBlock(block, vars) {
            const name = parseStringField(block, vars, 'name');
            if (!name) return null;

            let pos = null;
            let lineName = null;
            let circleName = null;
            let t = 0.5;
            let extend = false;
            let constructType = null, vertexName = null, baseName = null;

            let ellipseName = null;
            let axis = null;

            const constructMatch = block.match(/construct\s*=\s*(bisector|median|altitude)/);
            if (constructMatch) {
                constructType = constructMatch[1];
                vertexName = parsePointRefField(block, vars, 'vertex');
                const baseMatch = block.match(/base\s*=\s*"?([a-zA-Z_][a-zA-Z0-9_]*)"?/);
                if (baseMatch) baseName = baseMatch[1];
                if (!vertexName || !baseName) return null; // конструкции нужны вершина и противоположная сторона
                pos = { x: 0, y: 0 }; // будет пересчитано каждый кадр от vertex+base
            } else {
                const lineMatch = block.match(/line\s*=\s*"([^"]*)"/);
                if (lineMatch) {
                    lineName = lineMatch[1];
                    extend = parseBoolField(block, vars, 'extend', false);
                    const tMatch = block.match(/t\s*=\s*([\d.-]+)/);
                    if (tMatch) {
                        t = parseFloat(tMatch[1]);
                        if (isNaN(t)) t = 0.5;
                        if (!extend) { if (t < 0) t = 0; if (t > 1) t = 1; }
                    }
                } else {
                    const circleMatch = block.match(/circle\s*=\s*"([^"]*)"/);
                    if (circleMatch) {
                        circleName = circleMatch[1];
                        const tMatch = block.match(/t\s*=\s*([\d.]+)/);
                        if (tMatch) {
                            t = parseFloat(tMatch[1]);
                            if (isNaN(t) || t < 0) t = 0;
                            if (t > 1) t = 1;
                        }
                    } else {
                        const ellipseMatch = block.match(/ellipse\s*=\s*"([^"]*)"/);
                        if (ellipseMatch) {
                            ellipseName = ellipseMatch[1];
                            const axisMatch = block.match(/axis\s*=\s*(a|b)/);
                            if (axisMatch) {
                                axis = axisMatch[1];
                            } else {
                                const tMatch = block.match(/t\s*=\s*([\d.]+)/);
                                if (tMatch) {
                                    t = parseFloat(tMatch[1]);
                                    if (isNaN(t) || t < 0) t = 0;
                                    if (t > 1) t = 1;
                                }
                            }
                            pos = { x: 0, y: 0 }; // будет пересчитано от эллипса
                        } else {
                        const posMatch = block.match(/pos\s*=\s*\(([^)]*)\)/);
                        if (posMatch) {
                            const coordsStr = posMatch[1].trim();
                            let coords = coordsStr.split(',').map(s => s.trim());
                            if (coords.length === 2) {
                                let x = parseFloat(coords[0]);
                                let y = parseFloat(coords[1]);
                                if (isNaN(x) && vars[coords[0]] !== undefined && typeof vars[coords[0]] === 'number') x = vars[coords[0]];
                                if (isNaN(y) && vars[coords[1]] !== undefined && typeof vars[coords[1]] === 'number') y = vars[coords[1]];
                                if (!isNaN(x) && !isNaN(y)) pos = { x, y };
                            }
                        } else {
                            const varNameMatch = block.match(/pos\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                            if (varNameMatch) {
                                const varName = varNameMatch[1];
                                if (vars[varName] !== undefined && typeof vars[varName] === 'object' && vars[varName].x !== undefined) {
                                    pos = { x: vars[varName].x, y: vars[varName].y };
                                }
                            }
                        }
                        // Запрос #3: отсутствие pos — не ошибка, а разумное значение по умолчанию
                        if (!pos) pos = { x: 0, y: 0 };
                        }
                    }
                }
            }

            const color = parseColorField(block, vars, 'color', '#000000');
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

            const textColor = parseColorField(block, vars, 'textColor', '#000000');

            const dynamic = parseBoolField(block, vars, 'dynamic', false);

            const active = parseBoolField(block, vars, 'active', true);

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
            return { name, pos, line: lineName, circle: circleName, ellipse: ellipseName, axis, t, extend, construct: constructType, vertex: vertexName, base: baseName, color, textEnabled, textValue, textColor, dynamic, active, size, shape, textSize, pauseOnDrag, layer };
        }

        function parseLineBlock(block, vars) {
            const name = parseStringField(block, vars, 'name');
            if (!name) return null;

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
            const pointA = pointNames[0];
            const pointB = pointNames[1];

            const color = parseColorField(block, vars, 'color', '#000000');
            const thickness = parseNumberField(block, vars, 'thickness', 2.5, true);

            const interact = parseBoolField(block, vars, 'interact', false);

            const active = parseBoolField(block, vars, 'active', true);
            const layer = parseNumberField(block, vars, 'layer', 10, false);

            return { name, pointA, pointB, color, thickness, interact, active, layer };
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

            return { name, elements, rotate, size, sizeX, sizeY, flipX, flipY, interact, active };
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

    const color = parseColorField(block, vars, 'color', '#000000');
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
        return { name, type, centerName, radius, color, thickness, layer };
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
        return { name, type, pointNames, color, thickness, layer };
    }
    return null;
}

// Arc — часть окружности, задаётся динамически позициями точек (центр, радиус, направления начала/конца)
function parseArcBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

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

    const color = parseColorField(block, vars, 'color', '#000000');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);

    return { name, centerName, radius, from, to, color, thickness, active, layer };
}

// Ellipse — интерактивный объект: центр (точка) + полуоси a/b (число или выражение) + поворот
function parseEllipseBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    const centerName = parsePointRefField(block, vars, 'center');
    if (!centerName) return null;

    const aMatch = block.match(/(?:^|[,{])\s*a\s*=\s*([^,;\n]+)/);
    const bMatch = block.match(/(?:^|[,{])\s*b\s*=\s*([^,;\n]+)/);
    if (!aMatch || !bMatch) return null;
    const aExpr = aMatch[1].trim();
    const bExpr = bMatch[1].trim();

    const rotate = parseNumberField(block, vars, 'rotate', 0, false);
    const color = parseColorField(block, vars, 'color', '#000000');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const active = parseBoolField(block, vars, 'active', true);
    const dynamic = parseBoolField(block, vars, 'dynamic', false);
    const layer = parseNumberField(block, vars, 'layer', 20, false);

    return { name, centerName, aExpr, bExpr, rotate, color, thickness, active, dynamic, layer };
}

// Curve — кривая Безье (по контрольным точкам) или параметрическая (x(t), y(t) на мини-языке)
function parseCurveBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    let type = 'bezier';
    const typeMatch = block.match(/type\s*=\s*(bezier|parametric)/);
    if (typeMatch) type = typeMatch[1];

    let controlPoints = null, xExpr = null, yExpr = null;
    if (type === 'bezier') {
        controlPoints = parsePointRefList(block, vars, 'points');
        if (!controlPoints || controlPoints.length < 2 || controlPoints.length > 4) return null;
    } else {
        const xMatch = block.match(/(?:^|[,{])\s*x\s*=\s*"?([^",;\n]+)"?/);
        const yMatch = block.match(/(?:^|[,{])\s*y\s*=\s*"?([^",;\n]+)"?/);
        if (!xMatch || !yMatch) return null;
        xExpr = xMatch[1].trim();
        yExpr = yMatch[1].trim();
    }

    const segments = parseNumberField(block, vars, 'segments', 50, false);
    const color = parseColorField(block, vars, 'color', '#000000');
    const thickness = parseNumberField(block, vars, 'thickness', 2, false);
    const active = parseBoolField(block, vars, 'active', true);
    const layer = parseNumberField(block, vars, 'layer', 20, false);

    return { name, type, controlPoints, xExpr, yExpr, segments, color, thickness, active, layer };
}

function parseDrawTextBlock(block, vars) {
    const name = parseStringField(block, vars, 'name');
    if (!name) return null;

    // Сохраняем ВСЕ поля как сырые строки выражений
    let posXExpr = null, posYExpr = null;
    const posMatch = block.match(/pos\s*=\s*\(([^)]*)\)/);
    if (posMatch) {
        const coordsStr = posMatch[1].trim();
        const parts = coordsStr.split(',').map(s => s.trim());
        if (parts.length === 2) {
            posXExpr = parts[0];
            posYExpr = parts[1];
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
        }
    }
    if (!posXExpr || !posYExpr) return null;

    let textExpr = '';
    const textMatch = block.match(/text\s*=\s*"([^"]*)"/);
    if (textMatch) {
        textExpr = '"' + textMatch[1] + '"'; // сохраняем как строковый литерал
    } else {
        const varNameMatch = block.match(/text\s*=\s*([^,;\n]+)/);
        if (varNameMatch) {
            textExpr = varNameMatch[1].trim();
        }
    }

    let colorExpr = '#000000';
    const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (colorMatch) {
        colorExpr = colorMatch[1];
    }

    let sizeExpr = '1';
    const sizeMatch = block.match(/size\s*=\s*([\d.]+|default|[a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (sizeMatch) {
        sizeExpr = sizeMatch[1];
    }

    let activeExpr = 'true';
    const activeMatch = block.match(/active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (activeMatch) {
        activeExpr = activeMatch[1];
    }

    const layer = parseNumberField(block, vars, 'layer', 45, false);
    return { name, posXExpr, posYExpr, textExpr, colorExpr, sizeExpr, activeExpr, layer };
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

            return { name, elements, active };
        }

let autoNameCounter = 0;
function parseCommands(codeBlock, vars) {
    autoNameCounter = 0;
    syntheticPointCounter = 0;
    syntheticPoints = [];
    const points = [];
    const lines = [];
    const figures = [];
    const clusters = [];
    const angles = [];
    const drawAngles = [];
    const drawEqually = [];
    const drawVectors = [];
    const drawInfLines = [];
    const drawFillings = [];
    const drawPunctirs = [];
    const drawTexts = [];
    const uiElements = [];
    const circles = [];
    const arcs = [];
    const ellipses = [];
    const curves = [];
    const errors = [];

    let match;

    // Point
    const pointRegex = /new\s+Point\s*(?:=\s*)?\{([\s\S]*?)\};/g;
    while ((match = pointRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const p = parsePointBlock(content, vars);
        if (p) points.push(p);
        else errors.push({ line: '--', message: `Ошибка в блоке Point: пропущены обязательные поля (name, pos или line или circle)` });
    }

    // Line
    const lineRegex = /new\s+Line\s*(?:=\s*)?\{([\s\S]*?)\};/g;
    while ((match = lineRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const l = parseLineBlock(content, vars);
        if (l) lines.push(l);
        else errors.push({ line: '--', message: `Ошибка в блоке Line: пропущены обязательные поля (name, pos)` });
    }

    // Figure
    const figureRegex = /new\s+Figure\s*(?:=\s*)?\{([\s\S]*?)\};/g;
    while ((match = figureRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const f = parseFigureBlock(content, vars);
        if (f) figures.push(f);
        else errors.push({ line: '--', message: `Ошибка в блоке Figure: пропущены обязательные поля (name, elements)` });
    }

    // Claster
    const clusterRegex = /new\s+Claster\s*\{([\s\S]*?)\};?/g;
    while ((match = clusterRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const c = parseClasterBlock(content, vars);
        if (c) clusters.push(c);
        else errors.push({ line: '--', message: `Ошибка в блоке Claster: пропущены обязательные поля (name, elements)` });
    }

    // Angle
    const angleRegex = /new\s+Angle\s*\{([\s\S]*?)\};?/g;
    while ((match = angleRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const a = parseAngleBlock(content, vars);
        if (a) angles.push(a);
        else errors.push({ line: '--', message: `Ошибка в блоке Angle: пропущены обязательные поля (name, lines)` });
    }

    // Draw Angle
    const drawAngleRegex = /draw\s+Angle\s*\{([\s\S]*?)\};?/g;
    while ((match = drawAngleRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const d = parseDrawAngleBlock(content, vars);
        if (d) drawAngles.push(d);
        else errors.push({ line: '--', message: `Ошибка в блоке draw Angle: пропущены обязательные поля (name, angle)` });
    }

    // Draw EquallySing
    const drawEquallyRegex = /draw\s+EquallySing\s*\{([\s\S]*?)\};?/g;
    while ((match = drawEquallyRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const d = parseEquallySingBlock(content, vars);
        if (d) drawEqually.push(d);
        else errors.push({ line: '--', message: `Ошибка в блоке draw EquallySing: пропущены обязательные поля (name, edges)` });
    }

    // Draw Vector
    const drawVectorRegex = /draw\s+Vector\s*\{([\s\S]*?)\};?/g;
    while ((match = drawVectorRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const d = parseVectorBlock(content, vars);
        if (d) drawVectors.push(d);
        else errors.push({ line: '--', message: `Ошибка в блоке draw Vector: пропущены обязательные поля (name, edge)` });
    }

    // Draw InfLine
    const drawInfLineRegex = /draw\s+InfLine\s*\{([\s\S]*?)\};?/g;
    while ((match = drawInfLineRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const d = parseInfLineBlock(content, vars);
        if (d) drawInfLines.push(d);
        else errors.push({ line: '--', message: `Ошибка в блоке draw InfLine: пропущены обязательные поля (name, edge)` });
    }

    // Draw Filling
    const drawFillingRegex = /draw\s+Filling\s*\{([\s\S]*?)\};?/g;
    while ((match = drawFillingRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const d = parseFillingBlock(content, vars);
        if (d) drawFillings.push(d);
        else errors.push({ line: '--', message: `Ошибка в блоке draw Filling: пропущены обязательные поля (name, и один из: figure / line+side / circle+from+to / arc)` });
    }

    // Draw Punctir
    const drawPunctirRegex = /draw\s+Punctir\s*\{([\s\S]*?)\};?/g;
    while ((match = drawPunctirRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const d = parsePunctirBlock(content, vars);
        if (d) drawPunctirs.push(d);
        else errors.push({ line: '--', message: `Ошибка в блоке draw Punctir: пропущены обязательные поля (name, edge)` });
    }

    // Draw Text
    const drawTextRegex = /draw\s+Text\s*\{([\s\S]*?)\};/g;
    while ((match = drawTextRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const d = parseDrawTextBlock(content, vars);
        if (d) drawTexts.push(d);
        else errors.push({ line: '--', message: `Ошибка в блоке draw Text: пропущены обязательные поля (name, pos, text)` });
    }

    // UI
    const uiRegex = /new\s+UI\s*\{([\s\S]*?)\};?/g;
    while ((match = uiRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const ui = parseUIBlock(content, vars);
        if (ui) uiElements.push(ui);
        else errors.push({ line: '--', message: `Ошибка в блоке UI: пропущены обязательные поля (type)` });
    }

    // Circle
    const circleRegex = /new\s+Circle\s*(?:=\s*)?\{([\s\S]*?)\};/g;
    while ((match = circleRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const c = parseCircleBlock(content, vars);
        if (c) circles.push(c);
        else errors.push({ line: '--', message: `Ошибка в блоке Circle: пропущены обязательные поля (name, type ...)` });
    }

    // Arc
    const arcRegex = /draw\s+Arc\s*\{([\s\S]*?)\};/g;
    while ((match = arcRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const a = parseArcBlock(content, vars);
        if (a) arcs.push(a);
        else errors.push({ line: '--', message: `Ошибка в блоке Arc: пропущены обязательные поля (name, center, radius, from, to)` });
    }

    // Ellipse
    const ellipseRegex = /new\s+Ellipse\s*(?:=\s*)?\{([\s\S]*?)\};/g;
    while ((match = ellipseRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const e = parseEllipseBlock(content, vars);
        if (e) ellipses.push(e);
        else errors.push({ line: '--', message: `Ошибка в блоке Ellipse: пропущены обязательные поля (name, center, a, b)` });
    }

    // Curve
    const curveRegex = /new\s+Curve\s*(?:=\s*)?\{([\s\S]*?)\};/g;
    while ((match = curveRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const cv = parseCurveBlock(content, vars);
        if (cv) curves.push(cv);
        else errors.push({ line: '--', message: `Ошибка в блоке Curve: пропущены обязательные поля (name, type, и для bezier — points, для parametric — x/y)` });
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
        if (p.ellipse) {
            const ellipse = ellipses.find(e => e.name === p.ellipse);
            if (!ellipse) errors.push({ line: '--', message: `Точка "${p.name}" ссылается на несуществующий эллипс "${p.ellipse}"` });
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

    // Валидация кластеров – теперь с учётом всех draw-элементов
    for (let c of clusters) {
        const allElements = [];
        for (let elem of c.elements) {
            const found = points.find(p => p.name === elem) ||
                          lines.find(l => l.name === elem) ||
                          figures.find(f => f.name === elem) ||
                          circles.find(cir => cir.name === elem) ||
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
        if (!points.find(p => p.name === a.centerName)) errors.push({ line: '--', message: `Дуга "${a.name}" ссылается на несуществующую точку центра "${a.centerName}"` });
        if (!points.find(p => p.name === a.from)) errors.push({ line: '--', message: `Дуга "${a.name}" ссылается на несуществующую точку "from"` });
        if (!points.find(p => p.name === a.to)) errors.push({ line: '--', message: `Дуга "${a.name}" ссылается на несуществующую точку "to"` });
        if (typeof a.radius === 'string' && !points.find(p => p.name === a.radius)) {
            errors.push({ line: '--', message: `Дуга "${a.name}" использует радиус-точку "${a.radius}", которая не найдена` });
        }
    }

    for (let e of ellipses) {
        if (!points.find(p => p.name === e.centerName)) errors.push({ line: '--', message: `Эллипс "${e.name}" ссылается на несуществующую точку центра "${e.centerName}"` });
    }

    for (let cv of curves) {
        if (cv.type === 'bezier') {
            for (let pn of cv.controlPoints) {
                if (!points.find(p => p.name === pn)) errors.push({ line: '--', message: `Кривая "${cv.name}" ссылается на несуществующую контрольную точку "${pn}"` });
            }
        }
    }

    return {
        points, lines, figures, clusters, angles,
        drawAngles, drawEqually, drawVectors, drawInfLines, drawFillings, drawPunctirs, drawTexts,
        uiElements, circles, arcs, ellipses, curves, errors
    };
}

        // ========== ГЕНЕРАТОР 2D с динамическими окружностями ==========
function generate2D(params, pointsData, linesData, figuresData, clustersData, anglesData,
                    drawAnglesData, drawEquallyData, drawVectorsData, drawInfLinesData, drawFillingsData, drawPunctirsData,
                    drawTextsData, uiData, circlesData, arcsData, ellipsesData, curvesData, userVars, startCodes, updateCodes) {
    try {
        const title = params.title || '';
        const undertitle = params.undertitle || '';
        const description = params.description || '';

        const fieldWidth = (typeof params['field width'] === 'number') ? params['field width'] : 50;
        const fieldHeight = (typeof params['field height'] === 'number') ? params['field height'] : 30;
        const fieldColor = params['field color'] || 'transparent';
        const frameColor = params['frame color'] || '#000000';
        const frameWidth = (typeof params['frame width'] === 'number') ? params['frame width'] : 1;
        const titleColor = params['title color'] || '#000000';
        const titleSize = (typeof params['title size'] === 'number') ? params['title size'] : 1.3;
        const subColor = params['undertitle color'] || '#333333';
        const subSize = (typeof params['undertitle size'] === 'number') ? params['undertitle size'] : 0.7;
        const descColor = params['description color'] || '#000000';
        const descSize = (typeof params['description size'] === 'number') ? params['description size'] : 0.85;
        const footerColor = params['footer color'] || '#333333';
        const footerSize = (typeof params['footer size'] === 'number') ? params['footer size'] : 0.65;

        const footer = params.footer ? escapeHtml(params.footer) : `Поле ${fieldWidth}×${fieldHeight} · Перетаскивайте точки, линии и окружности · камера: ${params.space}`;

        const pointsJson = JSON.stringify(pointsData);
        const linesJson = JSON.stringify(linesData);
        const figuresJson = JSON.stringify(figuresData);
        const clustersJson = JSON.stringify(clustersData);
        const anglesJson = JSON.stringify(anglesData);
        const drawAnglesJson = JSON.stringify(drawAnglesData);
        const drawEquallyJson = JSON.stringify(drawEquallyData);
        const drawVectorsJson = JSON.stringify(drawVectorsData);
        const drawInfLinesJson = JSON.stringify(drawInfLinesData);
        const drawFillingsJson = JSON.stringify(drawFillingsData);
        const drawPunctirsJson = JSON.stringify(drawPunctirsData);
        const drawTextsJson = JSON.stringify(drawTextsData);
        const uiJson = JSON.stringify(uiData);
        const circlesJson = JSON.stringify(circlesData);
        const arcsJson = JSON.stringify(arcsData);
        const ellipsesJson = JSON.stringify(ellipsesData);
        const curvesJson = JSON.stringify(curvesData);
        const varsJson = JSON.stringify(userVars);

        const startCodeCombined = (startCodes || []).filter(s => s.trim()).join('; ');
        const updateCodeCombined = (updateCodes || []).filter(s => s.trim()).join('; ');
        const startCodeEscaped = JSON.stringify(startCodeCombined);
        const updateCodeEscaped = JSON.stringify(updateCodeCombined);

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
            '    .title { font-family:\'Montserrat\',\'Arial Black\',sans-serif; font-weight:900; font-size:', String(titleSize), 'rem; letter-spacing:0.05em; text-transform:uppercase; text-align:center; margin-bottom:0.3rem; color:', titleColor, '; }\n',
            '    .sub { text-align:center; font-size:', String(subSize), 'rem; margin-bottom:1rem; color:', subColor, '; }\n',
            '    .canvas-wrapper { border:', String(frameWidth), 'px solid ', frameColor, '; display:block; width:100%; background:', fieldColor, '; cursor:default; position:relative; overflow:hidden; }\n',
            '    canvas { background:transparent; display:block; margin:0 auto; width:100%; height:auto; border:none; touch-action:none; }\n',
            '    .info-panel { font-size:', String(descSize), 'rem; margin-top:0.6rem; font-family:monospace; text-align:center; background:rgba(0,0,0,0.03); padding:8px; border-radius:4px; line-height:1.5; color:', descColor, '; }\n',
            '    .footer { margin-top:0.8rem; font-size:', String(footerSize), 'rem; text-align:center; border-top:1px solid #ccc; padding-top:0.5rem; color:', footerColor, '; }\n',
            '    .controls { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-top:12px; }\n',
            '    .controls button {\n',
            '      padding:4px 12px;\n',
            '      border:1px solid #000000;\n',
            '      border-radius:4px;\n',
            '      background:#000000;\n',
            '      color:#ffffff;\n',
            '      font-size:0.85rem;\n',
            '      cursor:pointer;\n',
            '      font-family: inherit;\n',
            '    }\n',
            '    .controls button:hover { opacity:0.8; }\n',
            '    .controls input[type="checkbox"] {\n',
            '      width:18px; height:18px;\n',
            '      accent-color:#000000;\n',
            '    }\n',
            '    .controls input[type="number"],\n',
            '    .controls input[type="text"] {\n',
            '      padding:4px 8px;\n',
            '      border:1px solid #000000;\n',
            '      border-radius:4px;\n',
            '      font-size:0.85rem;\n',
            '      width:100px;\n',
            '      background:#ffffff;\n',
            '      color:#000000;\n',
            '      font-family: inherit;\n',
            '    }\n',
            '    .controls label {\n',
            '      font-size:0.85rem;\n',
            '      color:#000000;\n',
            '    }\n',
            '    .controls .ui-item { display:flex; align-items:center; gap:6px; }\n',
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
            '    const userVars = ', varsJson, ';\n',
            '\n',
            '    for (let [key, val] of Object.entries(userVars)) {\n',
            '      if (window[key] === undefined) {\n',
            '        window[key] = val;\n',
            '      } else {\n',
            '        console.warn("Переменная "+key+" уже существует в window, оставляем текущее значение");\n',
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
            '    let points = [];\n',
            '    let lines = [];\n',
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
            '      if (idx2 !== -1) updateFiguresForPoint(idx2);\n',
            '      if (idxV !== -1) updateFiguresForPoint(idxV);\n',
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
            '      updateCircles();\n',
            '      updateEllipses();\n',
            '      updatePointsOnLinesAndCircles();\n',
            '      for (let a of angles) { computeAngleMeasure(a); }\n',
            '    }\n',
            '\n',
            '    // ----- ИНИЦИАЛИЗАЦИЯ -----\n',
            '    function initPoints() {\n',
            '      points = pointsData.map(p => {\n',
            '        const obj = { ...p, px: 0, py: 0, lineName: p.line || null, circleName: p.circle || null, ellipseName: p.ellipse || null, t: p.t || 0.5 };\n',
            '        if (obj.lineName || obj.circleName || obj.ellipseName) {\n',
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
            '        if (pA.pos.x > pB.pos.x || (pA.pos.x === pB.pos.x && pA.pos.y > pB.pos.y)) {\n',
            '          [pA, pB] = [pB, pA];\n',
            '        }\n',
            '        const lineObj = { ...l, pA, pB };\n',
            '        Object.defineProperty(lineObj, \'length\', {\n',
            '          get: function() {\n',
            '            return Math.hypot(this.pB.pos.x - this.pA.pos.x, this.pB.pos.y - this.pA.pos.y);\n',
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
            '        return obj;\n',
            '      }).filter(c => c !== null);\n',
            '    }\n',
            '\n',
            '    function initArcs() {\n',
            '      arcs = arcsData.map(a => {\n',
            '        const centerPoint = points.find(p => p.name === a.centerName);\n',
            '        const fromPoint = points.find(p => p.name === a.from);\n',
            '        const toPoint = points.find(p => p.name === a.to);\n',
            '        if (!centerPoint || !fromPoint || !toPoint) return null;\n',
            '        let radiusNum = null, radiusPoint = null;\n',
            '        if (typeof a.radius === \'number\') radiusNum = a.radius;\n',
            '        else radiusPoint = points.find(p => p.name === a.radius);\n',
            '        return {\n',
            '          name: a.name, centerPoint, fromPoint, toPoint, radiusNum, radiusPoint,\n',
            '          color: a.color || \'#000000\', thickness: a.thickness || 2,\n',
            '          active: a.active !== false,\n',
            '          layer: (a.layer !== undefined && a.layer !== null) ? a.layer : 20,\n',
            '        };\n',
            '      }).filter(a => a !== null);\n',
            '    }\n',
            '\n',
            '    function initEllipses() {\n',
            '      ellipses = ellipsesData.map(e => {\n',
            '        const centerPoint = points.find(p => p.name === e.centerName);\n',
            '        if (!centerPoint) return null;\n',
            '        if (e.dynamic) centerPoint.dynamic = true;\n',
            '        return {\n',
            '          name: e.name, centerPoint,\n',
            '          aExpr: e.aExpr, bExpr: e.bExpr, a: 1, b: 1,\n',
            '          rotate: e.rotate || 0,\n',
            '          color: e.color || \'#000000\', thickness: e.thickness || 2,\n',
            '          active: e.active !== false, dynamic: e.dynamic || false,\n',
            '          layer: (e.layer !== undefined && e.layer !== null) ? e.layer : 20,\n',
            '        };\n',
            '      }).filter(e => e !== null);\n',
            '    }\n',
            '\n',
            '    function updateEllipses() {\n',
            '      for (let e of ellipses) {\n',
            '        const aVal = evaluate(e.aExpr);\n',
            '        const bVal = evaluate(e.bExpr);\n',
            '        if (typeof aVal === \'number\' && !isNaN(aVal)) e.a = aVal;\n',
            '        if (typeof bVal === \'number\' && !isNaN(bVal)) e.b = bVal;\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function initCurves() {\n',
            '      curves = curvesData.map(cv => {\n',
            '        let controlPoints = null;\n',
            '        if (cv.type === \'bezier\') {\n',
            '          controlPoints = cv.controlPoints.map(name => points.find(p => p.name === name)).filter(p => p !== undefined);\n',
            '          if (controlPoints.length < 2) return null;\n',
            '        }\n',
            '        return {\n',
            '          name: cv.name, type: cv.type, controlPoints,\n',
            '          xExpr: cv.xExpr, yExpr: cv.yExpr,\n',
            '          segments: cv.segments || 50,\n',
            '          color: cv.color || \'#000000\', thickness: cv.thickness || 2,\n',
            '          active: cv.active !== false,\n',
            '          layer: (cv.layer !== undefined && cv.layer !== null) ? cv.layer : 20,\n',
            '        };\n',
            '      }).filter(cv => cv !== null);\n',
            '    }\n',
            '\n',
            '    function initFigures() {\n',
            '      figures = figuresData.map(f => {\n',
            '        const pts = f.elements.map(name => points.find(p => p.name === name)).filter(p => p !== undefined);\n',
            '        const filtered = pts.filter(p => !p.lineName && !p.circleName);\n',
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
            '        };\n',
            '      }).filter(f => f !== null);\n',
            '      for (let f of figures) { applyFigureTransform(f); }\n',
            '    }\n',
            '\n',
            '    function initClusters() {\n',
            '      clusters = clustersData.map(c => {\n',
            '        const elements = c.elements.map(name => {\n',
            '          return points.find(p => p.name === name) ||\n',
            '                 lines.find(l => l.name === name) ||\n',
            '                 figures.find(f => f.name === name) ||\n',
            '                 circles.find(cir => cir.name === name);\n',
            '        }).filter(el => el !== undefined);\n',
            '        return {\n',
            '          name: c.name,\n',
            '          elements: elements,\n',
            '          active: c.active !== undefined ? c.active : true,\n',
            '        };\n',
            '      });\n',
            '      for (let c of clusters) {\n',
            '        if (window[c.name] !== undefined) console.warn("Кластер "+c.name+" уже существует в window");\n',
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
            '        if (window[a.name] !== undefined) console.warn("Угол "+a.name+" уже существует в window");\n',
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
            '          arccolor: d.arccolor || \'#000000\',\n',
            '          measurecolor: d.measurecolor || \'#000000\',\n',
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
            '          color: d.color || \'#000000\',\n',
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
            '          color: d.color || \'#000000\',\n',
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
            '          return { name: d.name, kind: \'halfplane\', line: ln, sidePoint: sidePt, color: d.color || \'#000000\', mode: d.mode || \'full\', layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, active: true };\n',
            '        }\n',
            '        if (d.arc) {\n',
            '          const arcObj = arcs.find(a => a.name === d.arc);\n',
            '          if (!arcObj) return null;\n',
            '          const pseudoCircle = {\n',
            '            get center() { return { x: arcObj.centerPoint.pos.x, y: arcObj.centerPoint.pos.y }; },\n',
            '            get radius() { return arcObj.radiusNum !== null ? arcObj.radiusNum : (arcObj.radiusPoint ? Math.hypot(arcObj.radiusPoint.pos.x - arcObj.centerPoint.pos.x, arcObj.radiusPoint.pos.y - arcObj.centerPoint.pos.y) : 0); },\n',
            '          };\n',
            '          return { name: d.name, kind: \'circleSector\', circle: pseudoCircle, fromPoint: arcObj.fromPoint, toPoint: arcObj.toPoint, shape: d.shape || \'sector\', color: d.color || \'#000000\', layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, active: true };\n',
            '        }\n',
            '        if (d.circle) {\n',
            '          const c = circles.find(cc => cc.name === d.circle);\n',
            '          const fromPt = points.find(p => p.name === d.from);\n',
            '          const toPt = points.find(p => p.name === d.to);\n',
            '          if (!c || !fromPt || !toPt) return null;\n',
            '          return { name: d.name, kind: \'circleSector\', circle: c, fromPoint: fromPt, toPoint: toPt, shape: d.shape || \'sector\', color: d.color || \'#000000\', layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, active: true };\n',
            '        }\n',
            '        const fig = figures.find(f => f.name === d.figure);\n',
            '        if (!fig) return null;\n',
            '        return {\n',
            '          name: d.name,\n',
            '          kind: \'polygon\',\n',
            '          figure: fig,\n',
            '          color: d.color || \'#000000\',\n',
            '          mode: d.mode || \'full\',\n',
            '          layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30,\n',
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
            '        const s = fig.size;\n',
            '        const invS = 1 / s;\n',
            '        for (let i = 0; i < fig.points.length; i++) {\n',
            '          const p = fig.points[i];\n',
            '          const dx = p.pos.x - cx;\n',
            '          const dy = p.pos.y - cy;\n',
            '          fig.relVectors[i] = { \n',
            '            x: (dx * cos + dy * sin) * invS, \n',
            '            y: (-dx * sin + dy * cos) * invS \n',
            '          };\n',
            '        }\n',
            '        fig.center = { x: cx, y: cy };\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function fieldScale() {\n',
            '      const usableWidth = width - 2 * EDGE_MARGIN;\n',
            '      const usableHeight = height - 2 * EDGE_MARGIN;\n',
            '      return Math.min(usableWidth / FIELD_WIDTH, usableHeight / FIELD_HEIGHT);\n',
            '    }\n',
            '\n',
            '    function fieldToPixel(fx, fy) {\n',
            '      if (isNaN(fx) || isNaN(fy)) return { x: 0, y: 0 };\n',
            '      const scale = fieldScale();\n',
            '      if (scale <= 0) return { x: 0, y: 0 };\n',
            '      const offsetX = (width - FIELD_WIDTH * scale) / 2;\n',
            '      const offsetY = (height - FIELD_HEIGHT * scale) / 2;\n',
            '      return {\n',
            '        x: offsetX + (fx + FIELD_WIDTH/2) * scale,\n',
            '        y: offsetY + (FIELD_HEIGHT/2 - fy) * scale\n',
            '      };\n',
            '    }\n',
            '\n',
            '    function pixelToField(px, py) {\n',
            '      if (isNaN(px) || isNaN(py)) return { x: 0, y: 0 };\n',
            '      const scale = fieldScale();\n',
            '      if (scale <= 0) return { x: 0, y: 0 };\n',
            '      const offsetX = (width - FIELD_WIDTH * scale) / 2;\n',
            '      const offsetY = (height - FIELD_HEIGHT * scale) / 2;\n',
            '      return {\n',
            '        x: (px - offsetX) / scale - FIELD_WIDTH/2,\n',
            '        y: FIELD_HEIGHT/2 - (py - offsetY) / scale\n',
            '      };\n',
            '    }\n',
            '\n',
            '    function distance(p1, p2) { return Math.hypot(p1.x - p2.x, p1.y - p2.y); }\n',
            '\n',
            '    function resolveCollision(index, newPos) {\n',
            '      let closest = null, closestDist = Infinity;\n',
            '      for (let i = 0; i < points.length; i++) {\n',
            '        if (i === index) continue;\n',
            '        if (!points[i] || !points[i].pos) continue;\n',
            '        const d = distance(newPos, points[i].pos);\n',
            '        if (d < closestDist) { closestDist = d; closest = i; }\n',
            '      }\n',
            '      if (closest !== null && closestDist < MIN_DIST) {\n',
            '        const dir = { x: newPos.x - points[closest].pos.x, y: newPos.y - points[closest].pos.y };\n',
            '        const len = Math.hypot(dir.x, dir.y);\n',
            '        if (len < 0.001) return newPos;\n',
            '        const scale = MIN_DIST / len;\n',
            '        return { x: points[closest].pos.x + dir.x * scale, y: points[closest].pos.y + dir.y * scale };\n',
            '      }\n',
            '      return newPos;\n',
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
            '          ctx.strokeStyle = drawObj.arccolor || \'#000000\';\n',
            '          ctx.lineWidth = 1.5;\n',
            '          ctx.stroke();\n',
            '        } else {\n',
            '          ctx.beginPath();\n',
            '          ctx.arc(vPix.x, vPix.y, rK, start, end, ccw);\n',
            '          ctx.strokeStyle = drawObj.arccolor || \'#000000\';\n',
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
            '        ctx.fillStyle = drawObj.measurecolor || \'#000000\';\n',
            '        ctx.font = \'14px sans-serif\';\n',
            '        ctx.textAlign = \'center\';\n',
            '        ctx.textBaseline = \'middle\';\n',
            '        ctx.fillText(measureVal + "°", tx, ty);\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function drawCircle(circle) {\n',
            '      if (!circle || !circle.center || circle.radius === undefined) return;\n',
            '      const centerPix = fieldToPixel(circle.center.x, circle.center.y);\n',
            '      const scale = fieldScale();\n',
            '      const radiusPix = circle.radius * scale;\n',
            '      ctx.beginPath();\n',
            '      ctx.arc(centerPix.x, centerPix.y, radiusPix, 0, 2 * Math.PI);\n',
            '      ctx.strokeStyle = circle.color || \'#000000\';\n',
            '      ctx.lineWidth = circle.thickness || 1.5;\n',
            '      ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function drawArc(a) {\n',
            '      if (!a || !a.centerPoint) return;\n',
            '      const radius = a.radiusNum !== null ? a.radiusNum : (a.radiusPoint ? Math.hypot(a.radiusPoint.pos.x - a.centerPoint.pos.x, a.radiusPoint.pos.y - a.centerPoint.pos.y) : 0);\n',
            '      if (!(radius > 0)) return;\n',
            '      const centerPix = fieldToPixel(a.centerPoint.pos.x, a.centerPoint.pos.y);\n',
            '      const r = radius * fieldScale();\n',
            '      const p1 = fieldToPixel(a.fromPoint.pos.x, a.fromPoint.pos.y);\n',
            '      const p2 = fieldToPixel(a.toPoint.pos.x, a.toPoint.pos.y);\n',
            '      const a1 = Math.atan2(p1.y - centerPix.y, p1.x - centerPix.x);\n',
            '      const a2 = Math.atan2(p2.y - centerPix.y, p2.x - centerPix.x);\n',
            '      ctx.beginPath();\n',
            '      ctx.arc(centerPix.x, centerPix.y, r, a1, a2);\n',
            '      ctx.strokeStyle = a.color || \'#000000\';\n',
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
            '      ctx.strokeStyle = e.color || \'#000000\';\n',
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
            '    function drawCurve(cv) {\n',
            '      const n = Math.max(2, cv.segments || 50);\n',
            '      const pts = [];\n',
            '      if (cv.type === \'bezier\') {\n',
            '        if (!cv.controlPoints || cv.controlPoints.length < 2) return;\n',
            '        const cps = cv.controlPoints.map(p => ({ x: p.pos.x, y: p.pos.y }));\n',
            '        for (let i = 0; i <= n; i++) pts.push(bezierPoint(cps, i / n));\n',
            '      } else {\n',
            '        for (let i = 0; i <= n; i++) {\n',
            '          const t = i / n;\n',
            '          const x = evaluate(cv.xExpr, { t });\n',
            '          const y = evaluate(cv.yExpr, { t });\n',
            '          if (typeof x === \'number\' && typeof y === \'number\' && !isNaN(x) && !isNaN(y)) pts.push({ x, y });\n',
            '        }\n',
            '      }\n',
            '      if (pts.length < 2) return;\n',
            '      ctx.beginPath();\n',
            '      const p0 = fieldToPixel(pts[0].x, pts[0].y);\n',
            '      ctx.moveTo(p0.x, p0.y);\n',
            '      for (let i = 1; i < pts.length; i++) { const p = fieldToPixel(pts[i].x, pts[i].y); ctx.lineTo(p.x, p.y); }\n',
            '      ctx.strokeStyle = cv.color || \'#000000\';\n',
            '      ctx.lineWidth = cv.thickness || 2;\n',
            '      ctx.lineCap = \'round\';\n',
            '      ctx.stroke();\n',
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
            '        ctx.strokeStyle = d.color || line.color || \'#000000\';\n',
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
            '        ctx.globalAlpha = 0.5;\n',
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
            '        ctx.strokeStyle = d.color || line.color || \'#000000\';\n',
            '        ctx.lineWidth = d.thickness || line.thickness || 2;\n',
            '        ctx.setLineDash(d.pattern || [6, 6]);\n',
            '        ctx.beginPath(); ctx.moveTo(posA.x, posA.y); ctx.lineTo(posB.x, posB.y); ctx.stroke();\n',
            '        ctx.setLineDash([]);\n',
            '    }\n',
            '\n',
            '    function draw() {\n',
            '      ctx.clearRect(0, 0, width, height);\n',
            '      updateCircles();\n',
            '      updateEllipses();\n',
            '      for (let a of angles) { computeAngleMeasure(a); }\n',
            '\n',
            '      let anyVisible = false;\n',
            '      for (let p of points) if (!p.hidden && isObjectActive(p)) { anyVisible = true; break; }\n',
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
            '          ctx.strokeStyle = l.color || \'#000000\';\n',
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
            '          ctx.fillStyle = p.color || \'#000000\';\n',
            '          if (shape === \'square\') {\n',
            '            ctx.fillRect(pos.x - r, pos.y - r, r * 2, r * 2);\n',
            '            ctx.strokeStyle = \'#ffffff\'; ctx.lineWidth = 1.5; ctx.strokeRect(pos.x - r, pos.y - r, r * 2, r * 2);\n',
            '            ctx.fillStyle = \'#ffffff\'; ctx.fillRect(pos.x - r/2.5, pos.y - r/2.5, r/1.25, r/1.25);\n',
            '          } else if (shape === \'cross\') {\n',
            '            ctx.strokeStyle = p.color || \'#000000\'; ctx.lineWidth = Math.max(2, r * 0.5); ctx.lineCap = \'round\';\n',
            '            ctx.beginPath(); ctx.moveTo(pos.x - r, pos.y - r); ctx.lineTo(pos.x + r, pos.y + r);\n',
            '            ctx.moveTo(pos.x + r, pos.y - r); ctx.lineTo(pos.x - r, pos.y + r); ctx.stroke();\n',
            '          } else {\n',
            '            ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, 2*Math.PI); ctx.fill();\n',
            '            ctx.strokeStyle = \'#ffffff\'; ctx.lineWidth = 1.5; ctx.stroke();\n',
            '            ctx.fillStyle = \'#ffffff\'; ctx.beginPath(); ctx.arc(pos.x, pos.y, r/2.5, 0, 2*Math.PI); ctx.fill();\n',
            '          }\n',
            '          if (p.textEnabled && p.textValue) {\n',
            '            ctx.fillStyle = p.textColor || \'#000000\';\n',
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
            '        const color = evaluate(d.colorExpr);\n',
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
            '          el.style.color = color || \'#000000\';\n',
            '          el.style.fontSize = fontSize + \'px\';\n',
            '          el.style.fontFamily = \'sans-serif\';\n',
            '          el.style.whiteSpace = \'nowrap\';\n',
            '          try { el.innerHTML = renderKaTeX(text); } catch (e) { el.textContent = text; }\n',
            '          overlay.appendChild(el);\n',
            '        } else {\n',
            '          push(d.layer, () => {\n',
            '            const pos = fieldToPixel(posX, posY);\n',
            '            ctx.fillStyle = color || \'#000000\';\n',
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
            '    // ===== DRAG & DROP =====\n',
            '    let dragMode = null;\n',
            '    let dragTarget = null;\n',
            '    let dragOffsetX = 0, dragOffsetY = 0;\n',
            '    let lineDragStartMouseField = { x: 0, y: 0 };\n',
            '    let lineDragStartPosA = { x: 0, y: 0 };\n',
            '    let lineDragStartPosB = { x: 0, y: 0 };\n',
            '    let figureDragStartCenter = { x: 0, y: 0 };\n',
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
            '    }\n',
            '\n',
            '    function clampFieldPoint(pos) {\n',
            '        pos.x = Math.min(Math.max(pos.x, -FIELD_WIDTH/2), FIELD_WIDTH/2);\n',
            '        pos.y = Math.min(Math.max(pos.y, -FIELD_HEIGHT/2), FIELD_HEIGHT/2);\n',
            '    }\n',
            '\n',
            '    function moveFigure(fig, mousePixel) {\n',
            '        const mouseField = pixelToField(mousePixel.x - dragOffsetX, mousePixel.y - dragOffsetY);\n',
            '        if (isNaN(mouseField.x) || isNaN(mouseField.y)) return false;\n',
            '        const oldCenter = { x: fig.center.x, y: fig.center.y };\n',
            '        fig.center = { x: mouseField.x, y: mouseField.y };\n',
            '        applyFigureTransform(fig);\n',
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
            '        let collision = false;\n',
            '        for (let i = 0; i < points.length; i++) {\n',
            '            if (i === pAIndex || i === pBIndex) continue;\n',
            '            if (distance(points[i].pos, pA.pos) < MIN_DIST || distance(points[i].pos, pB.pos) < MIN_DIST) {\n',
            '                collision = true; break;\n',
            '            }\n',
            '        }\n',
            '        if (collision || distance(pA.pos, pB.pos) < MIN_DIST) {\n',
            '            pA.pos = oldA; pB.pos = oldB;\n',
            '            return false;\n',
            '        }\n',
            '        updateFiguresForPoint(pAIndex); updateFiguresForPoint(pBIndex);\n',
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
            '            const idx = points.indexOf(targetPoint); if (idx !== -1) updateFiguresForPoint(idx);\n',
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
            '            const idx = points.indexOf(p); if (idx !== -1) updateFiguresForPoint(idx);\n',
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
            '            const idx = points.indexOf(p); if (idx !== -1) updateFiguresForPoint(idx);\n',
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
            '            const idx = points.indexOf(p); if (idx !== -1) updateFiguresForPoint(idx);\n',
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
            '            const correctedPos = resolveCollision(dragTarget, fieldPos);\n',
            '            if (correctedPos.x !== fieldPos.x || correctedPos.y !== fieldPos.y) {\n',
            '                const newPixel = fieldToPixel(correctedPos.x, correctedPos.y);\n',
            '                dragOffsetX = pos.x - newPixel.x; dragOffsetY = pos.y - newPixel.y;\n',
            '                fieldPos = correctedPos;\n',
            '            }\n',
            '            const p = points[dragTarget];\n',
            '            p.pos.x = fieldPos.x; p.pos.y = fieldPos.y;\n',
            '            if (p.lineName) { p.lineName = null; p.t = undefined; }\n',
            '            if (p.circleName) { p.circleName = null; p.t = undefined; }\n',
            '            updateFiguresForPoint(dragTarget); updateScene(); draw();\n',
            '        } else if (dragMode === \'line\') {\n',
            '            if (moveLine(dragTarget, pos)) { draw(); }\n',
            '        } else if (dragMode === \'figure\') {\n',
            '            if (moveFigure(dragTarget, pos)) { draw(); }\n',
            '        }\n',
            '    }\n',
            '\n',
            '    function onPointerUp(e) {\n',
            '        dragMode = null; dragTarget = null; lockedAngleDrag = null; lockedAngleDragLine = null; lockedPointTarget = null;\n',
            '        pointOnLinePoint = null; pointOnLineLine = null; pointOnCirclePoint = null; pointOnCircleCircle = null;\n',
            '        isDragging = false; draggedPointIndex = -1;\n',
            '    }\n',
            '\n',
            '    canvas.addEventListener(\'mousedown\', onPointerDown);\n',
            '    window.addEventListener(\'mousemove\', onPointerMove);\n',
            '    window.addEventListener(\'mouseup\', onPointerUp);\n',
            '    canvas.addEventListener(\'touchstart\', onPointerDown, { passive: false });\n',
            '    window.addEventListener(\'touchmove\', onPointerMove, { passive: false });\n',
            '    window.addEventListener(\'touchend\', onPointerUp, { passive: false });\n',
            '\n',
            '    function resizeCanvas() {\n',
            '        const wrapper = canvas.parentElement;\n',
            '        const maxWidth = Math.min(800, wrapper.clientWidth - 20);\n',
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
            `
    // ===== Мини-язык для Start/Update/действий кнопок/выражений текста =====
    // Вместо eval() сырого JS: set <путь> = <выражение>; if (...) {...} else {...}; repeat (N) {...}; wait(сек);
    const GL_BUILTINS = {
        sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, sqrt: Math.sqrt,
        round: Math.round, floor: Math.floor, ceil: Math.ceil, min: Math.min, max: Math.max, pow: Math.pow,
        random: (a, b) => (a === undefined ? Math.random() : a + Math.random() * ((b === undefined ? 1 : b) - a)),
    };

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
                toks.push({ type: 'number', value: parseFloat(src.slice(i, j)) }); i = j; continue;
            }
            if (/[a-zA-Z_]/.test(c)) {
                let j = i; while (j < n && /[a-zA-Z0-9_]/.test(src[j])) j++;
                toks.push({ type: 'ident', value: src.slice(i, j) }); i = j; continue;
            }
            const two = src.substr(i, 2);
            if (['==', '!=', '<=', '>=', '&&', '||', '+=', '-=', '*=', '/='].includes(two)) { toks.push({ type: 'op', value: two }); i += 2; continue; }
            if ('+-*/%(){}.,;=<>!#'.includes(c)) { toks.push({ type: 'op', value: c }); i++; continue; }
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

        function parseProgram() { const s = []; while (peek().type !== 'eof') s.push(parseStatement()); return s; }
        function parseBlock() { expectOp('{'); const s = []; while (!atOp('}')) s.push(parseStatement()); expectOp('}'); return s; }
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
            if (atIdent('wait')) {
                next(); expectOp('('); const arg = parseExpr(); expectOp(')'); if (atOp(';')) next();
                return { type: 'wait', arg };
            }
            if (atIdent('set')) {
                next(); const path = parsePath(); const t = next();
                if (t.type !== 'op' || !['=', '+=', '-=', '*=', '/='].includes(t.value)) throw new Error('Ожидался оператор присваивания после set');
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
        function parseExpr() { return parseOr(); }
        function parseOr() { let l = parseAnd(); while (atOp('||')) { next(); l = { type: 'logic', op: '||', l, r: parseAnd() }; } return l; }
        function parseAnd() { let l = parseEquality(); while (atOp('&&')) { next(); l = { type: 'logic', op: '&&', l, r: parseEquality() }; } return l; }
        function parseEquality() { let l = parseRelational(); while (atOp('==') || atOp('!=')) { const op = next().value; l = { type: 'cmp', op, l, r: parseRelational() }; } return l; }
        function parseRelational() { let l = parseAdditive(); while (atOp('<') || atOp('>') || atOp('<=') || atOp('>=')) { const op = next().value; l = { type: 'cmp', op, l, r: parseAdditive() }; } return l; }
        function parseAdditive() { let l = parseMultiplicative(); while (atOp('+') || atOp('-')) { const op = next().value; l = { type: 'bin', op, l, r: parseMultiplicative() }; } return l; }
        function parseMultiplicative() { let l = parseUnary(); while (atOp('*') || atOp('/') || atOp('%')) { const op = next().value; l = { type: 'bin', op, l, r: parseUnary() }; } return l; }
        function parseUnary() {
            if (atOp('-')) { next(); return { type: 'neg', expr: parseUnary() }; }
            if (atOp('!')) { next(); return { type: 'not', expr: parseUnary() }; }
            return parsePostfix();
        }
        function parsePostfix() {
            let e = parsePrimary();
            while (atOp('.')) { next(); const p = next(); if (p.type !== 'ident') throw new Error('Ожидалось имя поля'); e = { type: 'member', obj: e, prop: p.value }; }
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
            if (atOp('(')) { next(); const e = parseExpr(); expectOp(')'); return e; }
            if (t.type === 'ident') {
                next();
                if (t.value === 'true') return { type: 'bool', value: true };
                if (t.value === 'false') return { type: 'bool', value: false };
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

    function glEvalExpr(node, ctx) {
        switch (node.type) {
            case 'num': case 'str': case 'bool': return node.value;
            case 'ident':
                if (node.name in ctx) return ctx[node.name];
                if (window[node.name] !== undefined) return window[node.name];
                throw new Error('Неизвестный идентификатор: ' + node.name);
            case 'member': {
                const obj = glEvalExpr(node.obj, ctx);
                if (obj === undefined || obj === null) throw new Error('Обращение к полю "' + node.prop + '" у пустого значения');
                return obj[node.prop];
            }
            case 'call': {
                const fn = GL_BUILTINS[node.name];
                if (!fn) throw new Error('Неизвестная функция: ' + node.name);
                return fn(...node.args.map(a => glEvalExpr(a, ctx)));
            }
            case 'neg': return -glEvalExpr(node.expr, ctx);
            case 'not': return !glEvalExpr(node.expr, ctx);
            case 'bin': {
                const l = glEvalExpr(node.l, ctx), r = glEvalExpr(node.r, ctx);
                if (node.op === '+') return l + r; if (node.op === '-') return l - r;
                if (node.op === '*') return l * r; if (node.op === '/') return l / r; return l % r;
            }
            case 'cmp': {
                const l = glEvalExpr(node.l, ctx), r = glEvalExpr(node.r, ctx);
                if (node.op === '==') return l === r; if (node.op === '!=') return l !== r;
                if (node.op === '<') return l < r; if (node.op === '>') return l > r;
                if (node.op === '<=') return l <= r; return l >= r;
            }
            case 'logic':
                return node.op === '&&' ? (glEvalExpr(node.l, ctx) && glEvalExpr(node.r, ctx)) : (glEvalExpr(node.l, ctx) || glEvalExpr(node.r, ctx));
        }
        throw new Error('Неизвестный узел выражения');
    }

    function glApplyCompound(cur, val, op) {
        if (op === '+=') return cur + val; if (op === '-=') return cur - val;
        if (op === '*=') return cur * val; if (op === '/=') return cur / val; return val;
    }
    function glResolvePath(parts) {
        let obj = window[parts[0]];
        if (obj === undefined) throw new Error('Неизвестный объект: ' + parts[0]);
        for (let i = 1; i < parts.length - 1; i++) { if (obj === undefined || obj === null) throw new Error('Некорректный путь: ' + parts.join('.')); obj = obj[parts[i]]; }
        return { obj, lastKey: parts[parts.length - 1] };
    }
    async function glExecStatements(stmts, ctx) { for (const s of stmts) await glExecStatement(s, ctx); }
    async function glExecStatement(s, ctx) {
        switch (s.type) {
            case 'assign': {
                const val = glEvalExpr(s.expr, ctx);
                if (s.path.length === 1) {
                    const name = s.path[0];
                    window[name] = s.op === '=' ? val : glApplyCompound(window[name] || 0, val, s.op);
                } else {
                    const { obj, lastKey } = glResolvePath(s.path);
                    obj[lastKey] = s.op === '=' ? val : glApplyCompound(obj[lastKey] || 0, val, s.op);
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
            case 'wait':
                await new Promise(resolve => setTimeout(resolve, Math.max(0, glEvalExpr(s.arg, ctx)) * 1000));
                break;
            case 'expr': glEvalExpr(s.expr, ctx); break;
        }
    }
    async function glRun(sourceCode, extraCtx) {
        if (!sourceCode || !sourceCode.trim()) return;
        let stmts;
        try { stmts = glParseProgram(sourceCode); }
        catch (e) { console.error('Ошибка разбора сценария:', e.message); return; }
        try { await glExecStatements(stmts, Object.assign({ time: elapsedTime }, extraCtx || {})); }
        catch (e) { console.error('Ошибка выполнения сценария:', e.message); }
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
            '    function evaluate(expr, extraCtx) {\n',
            '      if (expr === undefined || expr === null) return expr;\n',
            '      try {\n',
            '        return glEvalExpr(glParseExprOnly(String(expr)), Object.assign({ time: elapsedTime }, extraCtx || {}));\n',
            '      } catch (e) {\n',
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
            '                if (ui.width) wrapper.style.width = ui.width + \'px\';\n',
            '                if (ui.height) wrapper.style.height = ui.height + \'px\';\n',
            '            }\n',
            '            if (ui.type === \'button\') {\n',
            '                const btn = document.createElement(\'button\');\n',
            '                btn.textContent = ui.label || \'Button\';\n',
            '                btn.style.backgroundColor = ui.color || \'#000000\';\n',
            '                btn.style.color = ui.textcolor || \'#ffffff\';\n',
            '                btn.style.borderRadius = (ui.radius !== null && ui.radius !== undefined ? ui.radius : 4) + \'px\';\n',
            '                if (positioned) { btn.style.width = \'100%\'; btn.style.height = \'100%\'; }\n',
            '                btn.addEventListener(\'click\', async function() {\n',
            '                    await glRun(ui.action || \'\');\n',
            '                    figures.forEach(applyFigureTransform); updateScene(); draw();\n',
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
            '                        figures.forEach(applyFigureTransform); updateScene(); draw();\n',
            '                    });\n',
            '                }\n',
            '                const label = document.createElement(\'label\'); label.textContent = ui.label || \'\'; label.style.color = ui.textcolor || \'#000000\';\n',
            '                wrapper.appendChild(checkbox); wrapper.appendChild(label);\n',
            '            } else if (ui.type === \'input\') {\n',
            '                const input = document.createElement(\'input\'); input.type = ui.inputtype || \'text\';\n',
            '                if (input.type === \'number\') { if (ui.min !== null) input.min = ui.min; if (ui.max !== null) input.max = ui.max; if (ui.step !== null) input.step = ui.step; }\n',
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
            '                        figures.forEach(applyFigureTransform); updateScene(); draw();\n',
            '                    }\n',
            '                    input.addEventListener(\'input\', clampAndUpdate); input.addEventListener(\'blur\', clampAndUpdate); input.addEventListener(\'change\', clampAndUpdate);\n',
            '                }\n',
            '                const label = document.createElement(\'label\'); label.textContent = ui.label || \'\'; label.style.color = ui.textcolor || \'#000000\';\n',
            '                wrapper.appendChild(label); wrapper.appendChild(input);\n',
            '            }\n',
            '            if (positioned) uiOverlay.appendChild(wrapper); else uiContainer.appendChild(wrapper);\n',
            '        }\n',
            '    }\n',
            '\n',
            '    let startCode = ' + startCodeEscaped + ';\n',
            '    let updateCode = ' + updateCodeEscaped + ';\n',
            '\n',
            '    for (let f of figures) { if (window[f.name] !== undefined) console.warn("Фигура "+f.name+" уже существует в window"); window[f.name] = f; }\n',
            '    let Start = async function() { await glRun(startCode); };\n',
            '    let Update = async function() { elapsedTime = (performance.now() - glStartTime) / 1000; await glRun(updateCode); };\n',
            '\n',
            '    initPoints(); initLines(); initCircles(); initArcs(); initEllipses(); initCurves(); initFigures(); initClusters(); initAngles();\n',
            '    initDrawAngles(); initDrawEqually(); initDrawVectors(); initDrawInfLines(); initDrawFillings(); initDrawPunctirs();\n',
            '    initDrawTexts();\n',
            '    updateScene();\n',
            '    for (let p of points) { if (window[p.name] !== undefined) console.warn("Точка "+p.name+" уже существует в window"); window[p.name] = p; }\n',
            '    for (let l of lines) { if (window[l.name] !== undefined) console.warn("Линия "+l.name+" уже существует в window"); window[l.name] = l; }\n',
            '    for (let c of circles) { if (window[c.name] !== undefined) console.warn("Окружность "+c.name+" уже существует в window"); window[c.name] = c; }\n',
            '    for (let a of arcs) { if (window[a.name] !== undefined) console.warn("Дуга "+a.name+" уже существует в window"); window[a.name] = a; }\n',
            '    for (let e of ellipses) { if (window[e.name] !== undefined) console.warn("Эллипс "+e.name+" уже существует в window"); window[e.name] = e; }\n',
            '    for (let cv of curves) { if (window[cv.name] !== undefined) console.warn("Кривая "+cv.name+" уже существует в window"); window[cv.name] = cv; }\n',
            '\n',
            '    resizeCanvas(); createUI();\n',
            '    if (startCode && startCode.trim()) { (async function() { await Start(); figures.forEach(applyFigureTransform); updateScene(); draw(); })(); }\n',
            '    if (updateCode && updateCode.trim()) {\n',
            '      let updateRunning = false;\n',
            '      async function runUpdate() {\n',
            '        if (updateRunning) return; updateRunning = true;\n',
            '        try {\n',
            '          const draggedPt = draggedPointIndex !== -1 ? points[draggedPointIndex] : null;\n',
            '          if (isDragging && draggedPt && draggedPt.pauseOnDrag !== false) { /* пауза анимации на время перетаскивания этой точки */ } else {\n',
            '            await Update();\n',
            '            for (let p of points) { if (p.pos.x < -FIELD_WIDTH/2) p.pos.x = -FIELD_WIDTH/2; if (p.pos.x > FIELD_WIDTH/2) p.pos.x = FIELD_WIDTH/2; if (p.pos.y < -FIELD_HEIGHT/2) p.pos.y = -FIELD_HEIGHT/2; if (p.pos.y > FIELD_HEIGHT/2) p.pos.y = FIELD_HEIGHT/2; }\n',
            '            figures.forEach(applyFigureTransform); updateScene(); draw();\n',
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
    '      return text.replace(/\\\\\\\\(([^]*?)\\\\\\\\)/g, function(match, p1) {\n',
    '        return katex.renderToString(p1, {throwOnError: false});\n',
    '      }).replace(/\\\\\\[([^]*?)\\\\\\]/g, function(match, p1) {\n',
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

        // ========== ПАРСЕР ОСНОВНЫХ ПОЛЕЙ ==========
        function parseAndValidate(codeBlock) {
            const errors = [];
            const params = {};
            let lineNum = 0;

            const codeWithoutComments = removeComments(codeBlock);
            const { vars, errors: varErrors } = parseVariablesAndExpressions(codeWithoutComments);
            errors.push(...varErrors);

            const { startCodes, updateCodes } = extractMethodBlocks(codeBlock);

            let codeForParams = removeMethodBlocks(codeBlock);
            codeForParams = removeObjectBlocks(codeForParams);

            const lines = codeForParams.split('\n');

            const validKeys = ['space', 'title', 'undertitle', 'description', 'footer',
                               'can rotate camera', 'can zoom camera',
                               'zoom limits', 'camera start zoom', 'camera start rot',
                               'field width', 'field height', 'field color',
                               'frame color', 'frame width',
                               'title color', 'title size',
                               'undertitle color', 'undertitle size',
                               'description color', 'description size',
                               'footer color', 'footer size'];
            const requiredKeys = ['space', 'title', 'undertitle', 'description'];
            const numericKeys = ['field width', 'field height', 'frame width', 'title size', 'undertitle size', 'description size', 'footer size'];

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
                const isStringLiteral = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
                if (isStringLiteral) {
                    let inner = value.slice(1, -1);
                    inner = inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    parsedValue = inner;
                } else {
                    if (key === 'space') {
                        if (value === '2D' || value === '3D') parsedValue = value;
                        else { errors.push({ line: lineNum, message: `space должно быть "2D" или "3D"` }); continue; }
                    } else if (key === 'zoom limits' || key === 'camera start rot') {
                        parsedValue = value;
                    } else if (key === 'camera start zoom') {
                        const num = parseFloat(value.replace('f', '').trim());
                        if (!isNaN(num)) parsedValue = value;
                        else { errors.push({ line: lineNum, message: `Некорректное значение для camera start zoom` }); continue; }
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

                if (key !== 'space' && key !== 'can rotate camera' && key !== 'can zoom camera' && !numericKeys.includes(key)) {
                    if (typeof parsedValue !== 'string') parsedValue = String(parsedValue);
                }
                if (key === 'can rotate camera' || key === 'can zoom camera') {
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

            return { params, errors, vars, startCodes, updateCodes };
        }

        // ========== КОМПИЛЯЦИЯ ==========
    function compile(sourceCode) {
        try {
            const match = sourceCode.match(/\[([\s\S]*)\]/);
            if (!match) {
                return { success: false, errors: ['Не найден блок в квадратных скобках [ ... ]'] };
            }
            const block = match[1];

            const { params, errors: paramErrors, vars, startCodes, updateCodes } = parseAndValidate(block);
            if (paramErrors.length > 0) {
                return { success: false, errors: paramErrors.map(e => e.message) };
            }

            const {
                points, lines, figures, clusters, angles,
                drawAngles, drawEqually, drawVectors, drawInfLines, drawFillings, drawPunctirs, drawTexts,
                uiElements, circles, arcs, ellipses, curves, errors: cmdErrors
            } = parseCommands(block, vars);

            if (cmdErrors.length > 0) {
                return { success: false, errors: cmdErrors.map(e => e.message) };
            }

            let html;
            if (params.space === '2D') {
                html = generate2D(
                    params,
                    points, lines, figures, clusters, angles,
                    drawAngles, drawEqually, drawVectors, drawInfLines, drawFillings, drawPunctirs,
                    drawTexts, uiElements, circles, arcs, ellipses, curves, vars, startCodes, updateCodes
                );
            } else {
                return { success: false, errors: ['Пространство 3D пока не поддерживается'] };
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

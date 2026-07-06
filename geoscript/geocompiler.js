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
        /new\s+Point\s*=\s*\{[\s\S]*?\};/g,
        /new\s+Line\s*=\s*\{[\s\S]*?\};/g,
        /new\s+Figure\s*=\s*\{[\s\S]*?\};/g,
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
        /new\s+Circle\s*=\s*\{[\s\S]*?\};/g
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

                let color = defaultColor;
                const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
                if (colorMatch) {
                    let col = colorMatch[1];
                    if (col === 'default') color = defaultColor;
                    else if (col.startsWith('#')) color = col;
                    else if (vars[col] !== undefined && typeof vars[col] === 'string' && vars[col].startsWith('#')) color = vars[col];
                }

                let textcolor = defaultTextcolor;
                const textcolorMatch = block.match(/textcolor\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
                if (textcolorMatch) {
                    let col = textcolorMatch[1];
                    if (col === 'default') textcolor = defaultTextcolor;
                    else if (col.startsWith('#')) textcolor = col;
                    else if (vars[col] !== undefined && typeof vars[col] === 'string' && vars[col].startsWith('#')) textcolor = vars[col];
                }

                let active = true;
                const activeMatch = block.match(/active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
                if (activeMatch) {
                    let a = activeMatch[1];
                    if (a === 'true') active = true;
                    else if (a === 'false') active = false;
                    else if (vars[a] !== undefined && typeof vars[a] === 'boolean') active = vars[a];
                }

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

                return { type, label, color, textcolor, active, variable, default: defaultValue, action, inputtype, min, max, step };
            } catch (e) {
                return null;
            }
        }

        // Остальные парсеры (Angle, DrawAngle, Point, Line, Figure, Circle, Claster) остаются без изменений, 
        // но мы добавляем поддержку динамического обновления окружностей в генераторе.

        function parseAngleBlock(block, vars) {
            let name = null;
            const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
            if (nameMatch) {
                name = nameMatch[1];
            } else {
                const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (varNameMatch) {
                    const varName = varNameMatch[1];
                    if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
                }
            }
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

            let lock = false;
            const lockMatch = block.match(/lock\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (lockMatch) {
                let l = lockMatch[1];
                if (l === 'true') lock = true;
                else if (l === 'false') lock = false;
                else if (vars[l] !== undefined && typeof vars[l] === 'boolean') lock = vars[l];
            }

            return { name, lineNames, lock };
        }

        function parseDrawAngleBlock(block, vars) {
            let name = null;
            const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
            if (nameMatch) {
                name = nameMatch[1];
            } else {
                const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (varNameMatch) {
                    const varName = varNameMatch[1];
                    if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
                }
            }
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

            let arc = true;
            const arcMatch = block.match(/arc\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (arcMatch) {
                let a = arcMatch[1];
                if (a === 'true') arc = true;
                else if (a === 'false') arc = false;
                else if (vars[a] !== undefined && typeof vars[a] === 'boolean') arc = vars[a];
            }

            let measure = true;
            const measureMatch = block.match(/measure\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (measureMatch) {
                let m = measureMatch[1];
                if (m === 'true') measure = true;
                else if (m === 'false') measure = false;
                else if (vars[m] !== undefined && typeof vars[m] === 'boolean') measure = vars[m];
            }

            let arccolor = '#000000';
            const arccolorMatch = block.match(/arccolor\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (arccolorMatch) {
                let c = arccolorMatch[1];
                if (c === 'default') arccolor = '#000000';
                else if (c.startsWith('#')) arccolor = c;
                else if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) arccolor = vars[c];
            }

            let measurecolor = '#000000';
            const measurecolorMatch = block.match(/measurecolor\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (measurecolorMatch) {
                let c = measurecolorMatch[1];
                if (c === 'default') measurecolor = '#000000';
                else if (c.startsWith('#')) measurecolor = c;
                else if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) measurecolor = vars[c];
            }

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

            let fractions = false;
            const fractionsMatch = block.match(/fractions\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (fractionsMatch) {
                let f = fractionsMatch[1];
                if (f === 'true') fractions = true;
                else if (f === 'false') fractions = false;
                else if (vars[f] !== undefined && typeof vars[f] === 'boolean') fractions = vars[f];
            }

            return { name, angleName, arc, measure, arccolor, measurecolor, radius, side, fractions };
        }

        function parseEquallySingBlock(block, vars) {
    let name = null;
    const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
    if (nameMatch) name = nameMatch[1];
    else {
        const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
        }
    }
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

    let color = '#000000';
    const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (colorMatch) {
        let c = colorMatch[1];
        if (c === 'default') color = '#000000';
        else if (c.startsWith('#')) color = c;
        else if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) color = vars[c];
    }

    return { name, edges, type, color };
}

// draw Vector
function parseVectorBlock(block, vars) {
    let name = null;
    const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
    if (nameMatch) name = nameMatch[1];
    else {
        const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
        }
    }
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

    let color = '#000000';
    const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (colorMatch) {
        let c = colorMatch[1];
        if (c === 'default') color = '#000000';
        else if (c.startsWith('#')) color = c;
        else if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) color = vars[c];
    }

    let length = null;
    const lengthMatch = block.match(/length\s*=\s*([\d.]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (lengthMatch) {
        let l = lengthMatch[1];
        if (l === 'default') length = null;
        else if (!isNaN(parseFloat(l))) length = parseFloat(l);
        else if (vars[l] !== undefined && typeof vars[l] === 'number') length = vars[l];
    }

    let thickness = null;
    const thicknessMatch = block.match(/thickness\s*=\s*([\d.]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (thicknessMatch) {
        let t = thicknessMatch[1];
        if (t === 'default') thickness = null;
        else if (!isNaN(parseFloat(t))) thickness = parseFloat(t);
        else if (vars[t] !== undefined && typeof vars[t] === 'number') thickness = vars[t];
    }

    return { name, edge, pos, direct, color, length, thickness };
}

// draw InfLine
function parseInfLineBlock(block, vars) {
    let name = null;
    const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
    if (nameMatch) name = nameMatch[1];
    else {
        const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
        }
    }
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

    let color = null;
    const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (colorMatch) {
        let c = colorMatch[1];
        if (c === 'default') color = null;
        else if (c.startsWith('#')) color = c;
        else if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) color = vars[c];
    }

    let thickness = null;
    const thicknessMatch = block.match(/thickness\s*=\s*([\d.]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (thicknessMatch) {
        let t = thicknessMatch[1];
        if (t === 'default') thickness = null;
        else if (!isNaN(parseFloat(t))) thickness = parseFloat(t);
        else if (vars[t] !== undefined && typeof vars[t] === 'number') thickness = vars[t];
    }

    let dotline = false;
    const dotlineMatch = block.match(/dotline\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (dotlineMatch) {
        let d = dotlineMatch[1];
        if (d === 'true') dotline = true;
        else if (d === 'false') dotline = false;
        else if (vars[d] !== undefined && typeof vars[d] === 'boolean') dotline = vars[d];
    }

    return { name, edge, limit, color, thickness, dotline };
}

// draw Filling
function parseFillingBlock(block, vars) {
    let name = null;
    const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
    if (nameMatch) name = nameMatch[1];
    else {
        const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
        }
    }
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
    if (!figure) return null;

    let color = '#000000';
    const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (colorMatch) {
        let c = colorMatch[1];
        if (c === 'default') color = '#000000';
        else if (c.startsWith('#')) color = c;
        else if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) color = vars[c];
    }

    let mode = 'full';
    const modeMatch = block.match(/mode\s*=\s*(full|inside|outside|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (modeMatch) {
        let m = modeMatch[1];
        if (m === 'full' || m === 'inside' || m === 'outside') mode = m;
        else if (vars[m] !== undefined && typeof vars[m] === 'string' && (vars[m] === 'full' || vars[m] === 'inside' || vars[m] === 'outside')) mode = vars[m];
    }

    return { name, figure, color, mode };
}

function parsePunctirBlock(block, vars) {
    let name = null;
    const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
    if (nameMatch) name = nameMatch[1];
    else {
        const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
        }
    }
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

    let color = null;
    const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (colorMatch) {
        let c = colorMatch[1];
        if (c === 'default') color = null;
        else if (c.startsWith('#')) color = c;
        else if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) color = vars[c];
    }

    let thickness = null;
    const thicknessMatch = block.match(/thickness\s*=\s*([\d.]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (thicknessMatch) {
        let t = thicknessMatch[1];
        if (t === 'default') thickness = null;
        else if (!isNaN(parseFloat(t))) thickness = parseFloat(t);
        else if (vars[t] !== undefined && typeof vars[t] === 'number') thickness = vars[t];
    }

    let pattern = null;
    const patternMatch = block.match(/pattern\s*=\s*\(([\d.,\s]+)\)/);
    if (patternMatch) {
        const str = patternMatch[1].trim();
        pattern = str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
    } else {
        // стандартный пунктир
        pattern = [6, 6];
    }

    return { name, edge, color, thickness, pattern };
}

        function parsePointBlock(block, vars) {
            let name = null;
            const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
            if (nameMatch) {
                name = nameMatch[1];
            } else {
                const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (varNameMatch) {
                    const varName = varNameMatch[1];
                    if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
                }
            }
            if (!name) return null;

            let pos = null;
            let lineName = null;
            let circleName = null;
            let t = 0.5;

            const lineMatch = block.match(/line\s*=\s*"([^"]*)"/);
            if (lineMatch) {
                lineName = lineMatch[1];
                const tMatch = block.match(/t\s*=\s*([\d.]+)/);
                if (tMatch) {
                    t = parseFloat(tMatch[1]);
                    if (isNaN(t) || t < 0) t = 0;
                    if (t > 1) t = 1;
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
                    if (!pos) return null;
                }
            }

            let color = '#000000';
            const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (colorMatch) {
                let col = colorMatch[1];
                if (col === 'default') color = '#000000';
                else if (col.startsWith('#')) color = col;
                else if (vars[col] !== undefined && typeof vars[col] === 'string' && vars[col].startsWith('#')) color = vars[col];
            }

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

            let textColor = '#000000';
            const textColorMatch = block.match(/textColor\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (textColorMatch) {
                let col = textColorMatch[1];
                if (col === 'default') textColor = '#000000';
                else if (col.startsWith('#')) textColor = col;
                else if (vars[col] !== undefined && typeof vars[col] === 'string' && vars[col].startsWith('#')) textColor = vars[col];
            }

            let dynamic = false;
            const dynamicMatch = block.match(/dynamic\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (dynamicMatch) {
                let d = dynamicMatch[1];
                if (d === 'true') dynamic = true;
                else if (d === 'false') dynamic = false;
                else if (vars[d] !== undefined && typeof vars[d] === 'boolean') dynamic = vars[d];
            }

            let active = true;
            const activeMatch = block.match(/active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (activeMatch) {
                let a = activeMatch[1];
                if (a === 'true') active = true;
                else if (a === 'false') active = false;
                else if (vars[a] !== undefined && typeof vars[a] === 'boolean') active = vars[a];
            }

            return { name, pos, line: lineName, circle: circleName, t, color, textEnabled, textValue, textColor, dynamic, active };
        }

        function parseLineBlock(block, vars) {
            const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
            if (!nameMatch) return null;
            const name = nameMatch[1];

            let pointNames = null;
            const posMatch = block.match(/pos\s*=\s*\(([^)]*)\)/);
            if (posMatch) {
                const posStr = posMatch[1].trim();
                pointNames = posStr.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            } else {
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

            let color = '#000000';
            const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (colorMatch) {
                let col = colorMatch[1];
                if (col === 'default') color = '#000000';
                else if (col.startsWith('#')) color = col;
                else if (vars[col] !== undefined && typeof vars[col] === 'string' && vars[col].startsWith('#')) color = vars[col];
            }

            let thickness = 2.5;
            const thicknessMatch = block.match(/thickness\s*=\s*([\d.]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (thicknessMatch) {
                let t = thicknessMatch[1];
                if (t === 'default') thickness = 2.5;
                else if (!isNaN(parseFloat(t))) thickness = parseFloat(t);
                else if (vars[t] !== undefined && typeof vars[t] === 'number') thickness = vars[t];
            }

            let interact = false;
            const interactMatch = block.match(/interact\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (interactMatch) {
                let i = interactMatch[1];
                if (i === 'true') interact = true;
                else if (i === 'false') interact = false;
                else if (vars[i] !== undefined && typeof vars[i] === 'boolean') interact = vars[i];
            }

            let active = true;
            const activeMatch = block.match(/active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (activeMatch) {
                let a = activeMatch[1];
                if (a === 'true') active = true;
                else if (a === 'false') active = false;
                else if (vars[a] !== undefined && typeof vars[a] === 'boolean') active = vars[a];
            }

            return { name, pointA, pointB, color, thickness, interact, active };
        }

        function parseFigureBlock(block, vars) {
            const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
            if (!nameMatch) return null;
            const name = nameMatch[1];

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

            let rotate = 0;
            const rotateMatch = block.match(/rotate\s*=\s*([\d.]+|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (rotateMatch) {
                let r = rotateMatch[1];
                if (!isNaN(parseFloat(r))) rotate = parseFloat(r);
                else if (vars[r] !== undefined && typeof vars[r] === 'number') rotate = vars[r];
            }

            let size = 1.0;
            const sizeMatch = block.match(/size\s*=\s*([\d.]+|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (sizeMatch) {
                let s = sizeMatch[1];
                if (!isNaN(parseFloat(s))) size = parseFloat(s);
                else if (vars[s] !== undefined && typeof vars[s] === 'number') size = vars[s];
            }

            let interact = true;
            const interactMatch = block.match(/interact\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (interactMatch) {
                let i = interactMatch[1];
                if (i === 'true') interact = true;
                else if (i === 'false') interact = false;
                else if (vars[i] !== undefined && typeof vars[i] === 'boolean') interact = vars[i];
            }

            let active = true;
            const activeMatch = block.match(/active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (activeMatch) {
                let a = activeMatch[1];
                if (a === 'true') active = true;
                else if (a === 'false') active = false;
                else if (vars[a] !== undefined && typeof vars[a] === 'boolean') active = vars[a];
            }

            return { name, elements, rotate, size, interact, active };
        }

function parseCircleBlock(block, vars) {
    // Ищем name
    let name = null;
    const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
    if (nameMatch) {
        name = nameMatch[1];
    } else {
        const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
        }
    }
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

    let color = '#000000';
    const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (colorMatch) {
        let col = colorMatch[1];
        if (col === 'default') color = '#000000';
        else if (col.startsWith('#')) color = col;
        else if (vars[col] !== undefined && typeof vars[col] === 'string' && vars[col].startsWith('#')) color = vars[col];
    }

    if (type === 'FromRadius') {
        let centerName = null;
        const centerMatch = block.match(/center\s*=\s*"([^"]*)"/);
        if (centerMatch) {
            centerName = centerMatch[1];
        } else {
            const varCenter = block.match(/center\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (varCenter) {
                const v = varCenter[1];
                if (vars[v] !== undefined && typeof vars[v] === 'string') centerName = vars[v];
            }
        }
        if (!centerName) return null;

        let radius = null;
        // Ищем радиус: число, строка в кавычках или идентификатор
        const radiusMatch = block.match(/radius\s*=\s*("([^"]*)"|'([^']*)'|([\d.]+|[a-zA-Z_][a-zA-Z0-9_]*))/);
        if (radiusMatch) {
            // Если попали в кавычки (группа 2 или 3)
            if (radiusMatch[2] !== undefined) {
                radius = radiusMatch[2]; // двойные кавычки
            } else if (radiusMatch[3] !== undefined) {
                radius = radiusMatch[3]; // одинарные кавычки
            } else {
                let r = radiusMatch[4] || radiusMatch[0]; // число или идентификатор
                if (!isNaN(parseFloat(r))) {
                    radius = parseFloat(r);
                } else if (vars[r] !== undefined && typeof vars[r] === 'number') {
                    radius = vars[r];
                } else {
                    radius = r; // имя точки (без кавычек)
                }
            }
        }
        if (radius === null) return null;
        return { name, type, centerName, radius, color };
    } else if (type === 'FromPoints') {
        let pointNames = null;
        const pointsMatch = block.match(/points\s*=\s*\(([^)]*)\)/);
        if (pointsMatch) {
            const str = pointsMatch[1].trim();
            pointNames = str.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        } else {
            const varMatch = block.match(/points\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (varMatch) {
                const v = varMatch[1];
                if (vars[v] !== undefined && Array.isArray(vars[v])) {
                    pointNames = vars[v];
                }
            }
        }
        if (!pointNames || pointNames.length !== 3) return null;
        return { name, type, pointNames, color };
    }
    return null;
}

function parseDrawTextBlock(block, vars) {
    let name = null;
    const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
    if (nameMatch) name = nameMatch[1];
    else {
        const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
        }
    }
    if (!name) return null;

    let pos = null;
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
    if (!pos) return null;

    let text = '';
    const textMatch = block.match(/text\s*=\s*"([^"]*)"/);
    if (textMatch) text = textMatch[1];
    else {
        const varNameMatch = block.match(/text\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (varNameMatch) {
            const varName = varNameMatch[1];
            if (vars[varName] !== undefined && typeof vars[varName] === 'string') text = vars[varName];
        }
    }

    let color = '#000000';
    const colorMatch = block.match(/color\s*=\s*(#[0-9A-Fa-f]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (colorMatch) {
        let c = colorMatch[1];
        if (c === 'default') color = '#000000';
        else if (c.startsWith('#')) color = c;
        else if (vars[c] !== undefined && typeof vars[c] === 'string' && vars[c].startsWith('#')) color = vars[c];
    }

    let size = 1;
    const sizeMatch = block.match(/size\s*=\s*([\d.]+|default|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (sizeMatch) {
        let s = sizeMatch[1];
        if (s === 'default') size = 1;
        else if (!isNaN(parseFloat(s))) size = parseFloat(s);
        else if (vars[s] !== undefined && typeof vars[s] === 'number') size = vars[s];
    }

    let active = true;
    const activeMatch = block.match(/active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
    if (activeMatch) {
        let a = activeMatch[1];
        if (a === 'true') active = true;
        else if (a === 'false') active = false;
        else if (vars[a] !== undefined && typeof vars[a] === 'boolean') active = vars[a];
    }

    return { name, pos, text, color, size, active };
}

        function parseClasterBlock(block, vars) {
            let name = null;
            const nameMatch = block.match(/name\s*=\s*"([^"]*)"/);
            if (nameMatch) {
                name = nameMatch[1];
            } else {
                const varNameMatch = block.match(/name\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (varNameMatch) {
                    const varName = varNameMatch[1];
                    if (vars[varName] !== undefined && typeof vars[varName] === 'string') name = vars[varName];
                }
            }
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

            let active = true;
            const activeMatch = block.match(/active\s*=\s*(true|false|[a-zA-Z_][a-zA-Z0-9_]*)/);
            if (activeMatch) {
                let a = activeMatch[1];
                if (a === 'true') active = true;
                else if (a === 'false') active = false;
                else if (vars[a] !== undefined && typeof vars[a] === 'boolean') active = vars[a];
            }

            return { name, elements, active };
        }

function parseCommands(codeBlock, vars) {
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
    const errors = [];

    let match;

    // Point
    const pointRegex = /new\s+Point\s*=\s*\{([\s\S]*?)\};/g;
    while ((match = pointRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const p = parsePointBlock(content, vars);
        if (p) points.push(p);
        else errors.push({ line: '--', message: `Ошибка в блоке Point: пропущены обязательные поля (name, pos или line или circle)` });
    }

    // Line
    const lineRegex = /new\s+Line\s*=\s*\{([\s\S]*?)\};/g;
    while ((match = lineRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const l = parseLineBlock(content, vars);
        if (l) lines.push(l);
        else errors.push({ line: '--', message: `Ошибка в блоке Line: пропущены обязательные поля (name, pos)` });
    }

    // Figure
    const figureRegex = /new\s+Figure\s*=\s*\{([\s\S]*?)\};/g;
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
        else errors.push({ line: '--', message: `Ошибка в блоке draw Filling: пропущены обязательные поля (name, figure)` });
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
    const circleRegex = /new\s+Circle\s*=\s*\{([\s\S]*?)\};/g;
    while ((match = circleRegex.exec(codeBlock)) !== null) {
        if (isInsideStringOrComment(codeBlock, match.index)) continue;
        const content = match[1];
        const c = parseCircleBlock(content, vars);
        if (c) circles.push(c);
        else errors.push({ line: '--', message: `Ошибка в блоке Circle: пропущены обязательные поля (name, type ...)` });
    }

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

    return {
        points, lines, figures, clusters, angles,
        drawAngles, drawEqually, drawVectors, drawInfLines, drawFillings, drawPunctirs, drawTexts,
        uiElements, circles, errors
    };
}

        // ========== ГЕНЕРАТОР 2D с динамическими окружностями ==========
function generate2D(params, pointsData, linesData, figuresData, clustersData, anglesData,
                    drawAnglesData, drawEquallyData, drawVectorsData, drawInfLinesData, drawFillingsData, drawPunctirsData,
                    drawTextsData, uiData, circlesData, userVars, startCodes, updateCodes) {
    try {
        const title = params.title || '';
        const undertitle = params.undertitle || '';
        const description = params.description || '';
        const footer = params.footer ? escapeHtml(params.footer) : 'Поле 50×30 · Перетаскивайте точки, линии и окружности · камера: 2D';

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
            // Используем CDN для KaTeX (работает в blob URL)
            '  <link rel="stylesheet" href="./katex.min.css">\n',
            '  <script src="./katex.min.js"><\/script>\n',
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
            '    .title { font-family:\'Montserrat\',\'Arial Black\',sans-serif; font-weight:900; font-size:1.3rem; letter-spacing:0.05em; text-transform:uppercase; text-align:center; margin-bottom:0.3rem; }\n',
            '    .sub { text-align:center; font-size:0.7rem; margin-bottom:1rem; color:#333; }\n',
            '    .canvas-wrapper { border:1px solid #000000; display:block; width:100%; background:transparent; cursor:default; position:relative; overflow:hidden; }\n',
            '    canvas { background:transparent; display:block; margin:0 auto; width:100%; height:auto; border:none; touch-action:none; }\n',
            '    .info-panel { font-size:0.85rem; margin-top:0.6rem; font-family:monospace; text-align:center; background:rgba(0,0,0,0.03); padding:8px; border-radius:4px; line-height:1.5; }\n',
            '    .footer { margin-top:0.8rem; font-size:0.65rem; text-align:center; border-top:1px solid #ccc; padding-top:0.5rem; color:#333; }\n',
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
            '    const FIELD_WIDTH = 50;\n',
            '    const FIELD_HEIGHT = 30;\n',
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
            '    let drawPunctirs = [];\n',
            '    let drawTexts = [];\n',
            '    let circles = [];\n',
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
            '          const t = Math.min(1, Math.max(0, p.t));\n',
            '          p.pos.x = pA.x + (pB.x - pA.x) * t;\n',
            '          p.pos.y = pA.y + (pB.y - pA.y) * t;\n',
            '        } else if (p.circleName) {\n',
            '          const circle = circles.find(c => c.name === p.circleName);\n',
            '          if (!circle) continue;\n',
            '          const angle = p.t * 2 * Math.PI;\n',
            '          p.pos.x = circle.center.x + circle.radius * Math.cos(angle);\n',
            '          p.pos.y = circle.center.y + circle.radius * Math.sin(angle);\n',
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
            '      updatePointsOnLinesAndCircles();\n',
            '      for (let a of angles) { computeAngleMeasure(a); }\n',
            '    }\n',
            '\n',
            '    // ----- ИНИЦИАЛИЗАЦИЯ -----\n',
            '    function initPoints() {\n',
            '      points = pointsData.map(p => {\n',
            '        const obj = { ...p, px: 0, py: 0, lineName: p.line || null, circleName: p.circle || null, t: p.t || 0.5 };\n',
            '        if (obj.lineName || obj.circleName) {\n',
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
            '    function initFigures() {\n',
            '      figures = figuresData.map(f => {\n',
            '        const pts = f.pointNames.map(name => points.find(p => p.name === name)).filter(p => p !== undefined);\n',
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
            '          active: true,\n',
            '        };\n',
            '      }).filter(d => d !== null);\n',
            '    }\n',
            '\n',
            '    function initDrawFillings() {\n',
            '      drawFillings = drawFillingsData.map(d => {\n',
            '        const fig = figures.find(f => f.name === d.figure);\n',
            '        if (!fig) return null;\n',
            '        return {\n',
            '          name: d.name,\n',
            '          figure: fig,\n',
            '          color: d.color || \'#000000\',\n',
            '          mode: d.mode || \'full\',\n',
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
            '      const s = fig.size;\n',
            '      for (let i = 0; i < fig.points.length; i++) {\n',
            '        const p = fig.points[i];\n',
            '        const rel = fig.relVectors[i];\n',
            '        p.pos.x = fig.center.x + (rel.x * cos - rel.y * sin) * s;\n',
            '        p.pos.y = fig.center.y + (rel.x * sin + rel.y * cos) * s;\n',
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
            '    function fieldToPixel(fx, fy) {\n',
            '      if (isNaN(fx) || isNaN(fy)) return { x: 0, y: 0 };\n',
            '      const usableWidth = width - 2 * EDGE_MARGIN;\n',
            '      const usableHeight = height - 2 * EDGE_MARGIN;\n',
            '      const scaleX = usableWidth / FIELD_WIDTH;\n',
            '      const scaleY = usableHeight / FIELD_HEIGHT;\n',
            '      const scale = Math.min(scaleX, scaleY);\n',
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
            '      const usableWidth = width - 2 * EDGE_MARGIN;\n',
            '      const usableHeight = height - 2 * EDGE_MARGIN;\n',
            '      const scaleX = usableWidth / FIELD_WIDTH;\n',
            '      const scaleY = usableHeight / FIELD_HEIGHT;\n',
            '      const scale = Math.min(scaleX, scaleY);\n',
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
            '      const usableWidth = width - 2 * EDGE_MARGIN;\n',
            '      const usableHeight = height - 2 * EDGE_MARGIN;\n',
            '      const scaleX = usableWidth / FIELD_WIDTH;\n',
            '      const scaleY = usableHeight / FIELD_HEIGHT;\n',
            '      const scale = Math.min(scaleX, scaleY);\n',
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
            '        if (isRightAngle) {\n',
            '          const r = arcRadius * 0.8;\n',
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
            '          ctx.arc(vPix.x, vPix.y, arcRadius, start, end, ccw);\n',
            '          ctx.strokeStyle = drawObj.arccolor || \'#000000\';\n',
            '          ctx.lineWidth = 1.5;\n',
            '          ctx.stroke();\n',
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
            '      const usableWidth = width - 2 * EDGE_MARGIN;\n',
            '      const usableHeight = height - 2 * EDGE_MARGIN;\n',
            '      const scaleX = usableWidth / FIELD_WIDTH;\n',
            '      const scaleY = usableHeight / FIELD_HEIGHT;\n',
            '      const scale = Math.min(scaleX, scaleY);\n',
            '      const radiusPix = circle.radius * scale;\n',
            '      ctx.beginPath();\n',
            '      ctx.arc(centerPix.x, centerPix.y, radiusPix, 0, 2 * Math.PI);\n',
            '      ctx.strokeStyle = circle.color || \'#000000\';\n',
            '      ctx.lineWidth = 1.5;\n',
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
            '            const nx = -dy / len, ny = dx / len;\n',
            '            const off = 0.3;\n',
            '            const centerX = midX + nx * off;\n',
            '            const centerY = midY + ny * off;\n',
            '            const centerPix = fieldToPixel(centerX, centerY);\n',
            '            const p1 = fieldToPixel(pA.x + nx * off, pA.y + ny * off);\n',
            '            const p2 = fieldToPixel(pB.x + nx * off, pB.y + ny * off);\n',
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
            '        const fig = d.figure;\n',
            '        if (!fig || !fig.points || fig.points.length < 3) return;\n',
            '        const mode = d.mode || \'full\';\n',
            '        const pts = fig.points.map(p => fieldToPixel(p.pos.x, p.pos.y));\n',
            '        ctx.fillStyle = d.color;\n',
            '        ctx.globalAlpha = 0.5;\n',
            '        if (mode === \'full\') {\n',
            '            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);\n',
            '            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);\n',
            '            ctx.closePath(); ctx.fill();\n',
            '        } else if (mode === \'inside\' || mode === \'outside\') {\n',
            '            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;\n',
            '            for (let p of pts) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }\n',
            '            const step = 2;\n',
            '            const imageData = ctx.getImageData(0, 0, width, height);\n',
            '            const data = imageData.data;\n',
            '            const color = d.color;\n',
            '            let r=0,g=0,b=0,a=1;\n',
            '            if (color.startsWith(\'#\')) {\n',
            '                const hex = color.slice(1);\n',
            '                const len = hex.length;\n',
            '                if (len === 3) { r = parseInt(hex[0]+hex[0],16); g = parseInt(hex[1]+hex[1],16); b = parseInt(hex[2]+hex[2],16); }\n',
            '                else if (len === 4) { r = parseInt(hex[0]+hex[0],16); g = parseInt(hex[1]+hex[1],16); b = parseInt(hex[2]+hex[2],16); a = parseInt(hex[3]+hex[3],16)/255; }\n',
            '                else if (len === 6) { r = parseInt(hex.substring(0,2),16); g = parseInt(hex.substring(2,4),16); b = parseInt(hex.substring(4,6),16); }\n',
            '                else if (len === 8) { r = parseInt(hex.substring(0,2),16); g = parseInt(hex.substring(2,4),16); b = parseInt(hex.substring(4,6),16); a = parseInt(hex.substring(6,8),16)/255; }\n',
            '            }\n',
            '            const insideColor = [r,g,b,a];\n',
            '            for (let py = Math.floor(minY); py <= Math.ceil(maxY); py += step) {\n',
            '                for (let px = Math.floor(minX); px <= Math.ceil(maxX); px += step) {\n',
            '                    const inside = pointInPolygon(px, py, pts);\n',
            '                    let fill = (mode === \'inside\') ? inside : !inside;\n',
            '                    if (fill) {\n',
            '                        for (let dy = 0; dy < step; dy++) {\n',
            '                            for (let dx = 0; dx < step; dx++) {\n',
            '                                const idx = ((py+dy) * width + (px+dx)) * 4;\n',
            '                                if (idx < data.length) {\n',
            '                                    data[idx] = insideColor[0];\n',
            '                                    data[idx+1] = insideColor[1];\n',
            '                                    data[idx+2] = insideColor[2];\n',
            '                                    data[idx+3] = Math.round(insideColor[3]*255);\n',
            '                                }\n',
            '                            }\n',
            '                        }\n',
            '                    }\n',
            '                }\n',
            '            }\n',
            '            ctx.putImageData(imageData, 0, 0);\n',
            '        }\n',
            '        ctx.globalAlpha = 1;\n',
            '    }\n',
            '\n',
            '    function pointInPolygon(px, py, polygon) {\n',
            '        let inside = false;\n',
            '        const n = polygon.length;\n',
            '        for (let i = 0, j = n-1; i < n; j = i++) {\n',
            '            const xi = polygon[i].x, yi = polygon[i].y;\n',
            '            const xj = polygon[j].x, yj = polygon[j].y;\n',
            '            const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);\n',
            '            if (intersect) inside = !inside;\n',
            '        }\n',
            '        return inside;\n',
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
            '      for (let a of angles) { computeAngleMeasure(a); }\n',
            '\n',
            '      let anyVisible = false;\n',
            '      for (let p of points) if (isObjectActive(p)) { anyVisible = true; break; }\n',
            '      if (!anyVisible) {\n',
            '        ctx.fillStyle = \'#888888\';\n',
            '        ctx.font = \'18px sans-serif\';\n',
            '        ctx.textAlign = \'center\';\n',
            '        ctx.textBaseline = \'middle\';\n',
            '        ctx.fillText(\'Нет активных объектов для отображения\', width/2, height/2);\n',
            '        return;\n',
            '      }\n',
            '\n',
            '      // Линии\n',
            '      for (let l of lines) {\n',
            '        if (!l || !l.pA || !l.pB) continue;\n',
            '        if (!isObjectActive(l)) continue;\n',
            '        const hasPunctir = drawPunctirs.some(d => d.active && d.line === l);\n',
            '        if (hasPunctir) continue;\n',
            '        const posA = fieldToPixel(l.pA.pos.x, l.pA.pos.y);\n',
            '        const posB = fieldToPixel(l.pB.pos.x, l.pB.pos.y);\n',
            '        ctx.beginPath(); ctx.moveTo(posA.x, posA.y); ctx.lineTo(posB.x, posB.y);\n',
            '        ctx.strokeStyle = l.color || \'#000000\';\n',
            '        ctx.lineWidth = l.thickness || 2.5;\n',
            '        ctx.stroke();\n',
            '      }\n',
            '\n',
            '      // Окружности\n',
            '      for (let c of circles) {\n',
            '        if (!isObjectActive(c)) continue;\n',
            '        drawCircle(c);\n',
            '      }\n',
            '\n',
            '      // Заливка\n',
            '      for (let d of drawFillings) {\n',
            '        if (!d.active) continue;\n',
            '        drawFilling(d);\n',
            '      }\n',
            '\n',
            '      // Точки\n',
            '      for (let p of points) {\n',
            '        if (!p || !p.pos || isNaN(p.pos.x) || isNaN(p.pos.y)) continue;\n',
            '        if (!isObjectActive(p)) continue;\n',
            '        const pos = fieldToPixel(p.pos.x, p.pos.y);\n',
            '        if (isNaN(pos.x) || isNaN(pos.y)) continue;\n',
            '        p.px = pos.x; p.py = pos.y;\n',
            '        ctx.fillStyle = p.color || \'#000000\';\n',
            '        ctx.beginPath(); ctx.arc(pos.x, pos.y, VERTEX_RADIUS, 0, 2*Math.PI); ctx.fill();\n',
            '        ctx.strokeStyle = \'#ffffff\'; ctx.lineWidth = 1.5; ctx.stroke();\n',
            '        ctx.fillStyle = \'#ffffff\'; ctx.beginPath(); ctx.arc(pos.x, pos.y, VERTEX_RADIUS/2.5, 0, 2*Math.PI); ctx.fill();\n',
            '        if (p.textEnabled && p.textValue) {\n',
            '          ctx.fillStyle = p.textColor || \'#000000\';\n',
            '          ctx.font = \'14px sans-serif\';\n',
            '          ctx.textAlign = \'center\';\n',
            '          ctx.textBaseline = \'bottom\';\n',
            '          ctx.fillText(p.textValue, pos.x - 10, pos.y - 8);\n',
            '        }\n',
            '      }\n',
            '\n',
            '      // draw Text (формулы)\n',
                  '      // draw Text (формулы) – теперь через DOM-элементы поверх canvas\n',
      '      const overlay = document.getElementById(\'formulaOverlay\');\n',
      '      while (overlay.firstChild) overlay.removeChild(overlay.firstChild);\n',
      '      for (let d of drawTexts) {\n',
      '        if (!d.active) continue;\n',
      '        const pos = fieldToPixel(d.pos.x, d.pos.y);\n',
      '        const fontSize = 14 * (d.size || 1);\n',
      '        const el = document.createElement(\'div\');\n',
      '        el.style.position = \'absolute\';\n',
      '        el.style.left = pos.x + \'px\';\n',
      '        el.style.top = pos.y + \'px\';\n',
      '        el.style.transform = \'translate(-50%, -50%)\';\n',
      '        el.style.pointerEvents = \'none\';\n',
      '        el.style.color = d.color || \'#000000\';\n',
      '        el.style.fontSize = fontSize + \'px\';\n',
      '        el.style.fontFamily = \'sans-serif\';\n',
      '        el.style.whiteSpace = \'nowrap\';\n',
      '        const text = d.text || \'\';\n',
      '        if (typeof katex !== \'undefined\' && (text.includes(\'\\\\(\') || text.includes(\'\\\\[\'))) {\n',
      '          try {\n',
      '            el.innerHTML = katex.renderToString(text, { throwOnError: false });\n',
      '          } catch (e) {\n',
      '            el.textContent = text;\n',
      '          }\n',
      '        } else {\n',
      '          el.textContent = text;\n',
      '        }\n',
      '        overlay.appendChild(el);\n',
            '\n',
            '      // draw InfLine\n',
            '      for (let d of drawInfLines) {\n',
            '        if (!d.active) continue;\n',
            '        drawInfLine(d);\n',
            '      }\n',
            '\n',
            '      // draw Punctir\n',
            '      for (let d of drawPunctirs) {\n',
            '        if (!d.active) continue;\n',
            '        drawPunctir(d);\n',
            '      }\n',
            '\n',
            '      // draw Vector\n',
            '      for (let d of drawVectors) {\n',
            '        if (!d.active) continue;\n',
            '        drawVector(d);\n',
            '      }\n',
            '\n',
            '      // draw EquallySing\n',
            '      for (let d of drawEqually) {\n',
            '        if (!d.active) continue;\n',
            '        drawEquallySing(d);\n',
            '      }\n',
            '\n',
            '      // draw Angle\n',
            '      for (let d of drawAngles) {\n',
            '        if (!d.active) continue;\n',
            '        const angleObj = d.angle;\n',
            '        if (!angleObj) continue;\n',
            '        if (!isObjectActive(angleObj.vertex)) continue;\n',
            '        if (!isObjectActive(angleObj.line1) || !isObjectActive(angleObj.line2)) continue;\n',
            '        drawAngleArc(d);\n',
            '      }\n',
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
            '        const aspect = 500 / 800;\n',
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
            '    function createUI() {\n',
            '        uiContainer.innerHTML = \'\';\n',
            '        for (let ui of uiData) {\n',
            '            const wrapper = document.createElement(\'div\'); wrapper.className = \'ui-item\';\n',
            '            if (ui.active === false) wrapper.style.display = \'none\';\n',
            '            if (ui.type === \'button\') {\n',
            '                const btn = document.createElement(\'button\');\n',
            '                btn.textContent = ui.label || \'Button\';\n',
            '                btn.style.backgroundColor = ui.color || \'#000000\';\n',
            '                btn.style.color = ui.textcolor || \'#ffffff\';\n',
            '                btn.addEventListener(\'click\', function() {\n',
            '                    try { (0, eval)(ui.action || \'\'); } catch(e) { console.error(\'Ошибка в action:\', e); }\n',
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
            '            uiContainer.appendChild(wrapper);\n',
            '        }\n',
            '    }\n',
            '\n',
            '    window.wait = function(seconds) { return new Promise(resolve => setTimeout(resolve, seconds * 1000)); };\n',
            '\n',
            '    let startCode = ' + startCodeEscaped + ';\n',
            '    let updateCode = ' + updateCodeEscaped + ';\n',
            '\n',
            '    for (let f of figures) { if (window[f.name] !== undefined) console.warn("Фигура "+f.name+" уже существует в window"); window[f.name] = f; }\n',
            '    let Start = async function() { try { (0, eval)(startCode); } catch(e) { console.error("Start error:", e); } };\n',
            '    let Update = async function() { try { (0, eval)(updateCode); } catch(e) { console.error("Update error:", e); } };\n',
            '\n',
            '    initPoints(); initLines(); initCircles(); initFigures(); initClusters(); initAngles();\n',
            '    initDrawAngles(); initDrawEqually(); initDrawVectors(); initDrawInfLines(); initDrawFillings(); initDrawPunctirs();\n',
            '    initDrawTexts();\n',
            '    updateScene();\n',
            '    for (let p of points) { if (window[p.name] !== undefined) console.warn("Точка "+p.name+" уже существует в window"); window[p.name] = p; }\n',
            '    for (let l of lines) { if (window[l.name] !== undefined) console.warn("Линия "+l.name+" уже существует в window"); window[l.name] = l; }\n',
            '    for (let c of circles) { if (window[c.name] !== undefined) console.warn("Окружность "+c.name+" уже существует в window"); window[c.name] = c; }\n',
            '\n',
            '    resizeCanvas(); createUI();\n',
            '    if (startCode && startCode.trim()) { (async function() { await Start(); figures.forEach(applyFigureTransform); updateScene(); draw(); })(); }\n',
            '    if (updateCode && updateCode.trim()) {\n',
            '      let updateRunning = false;\n',
            '      async function runUpdate() {\n',
            '        if (updateRunning) return; updateRunning = true;\n',
            '        try {\n',
            '          if (isDragging && draggedPointIndex !== -1) { /* ничего */ } else {\n',
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
    '    // ---- Рендеринг формул KaTeX (ручной) ----\n',
    '    function renderKaTeX(text) {\n',
    '      if (typeof katex === \'undefined\') return text;\n',
    '      return text.replace(/\\\\\\(([^]*?)\\\\\\)/g, function(match, p1) {\n',
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
                               'zoom limits', 'camera start zoom', 'camera start rot'];
            const requiredKeys = ['space', 'title', 'undertitle', 'description'];

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
                    } else {
                        if (value === 'true') parsedValue = true;
                        else if (value === 'false') parsedValue = false;
                        else { errors.push({ line: lineNum, message: `Некорректное значение "${value}"` }); continue; }
                    }
                }

                if (key !== 'space' && key !== 'can rotate camera' && key !== 'can zoom camera') {
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
                uiElements, circles, errors: cmdErrors
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
                    drawTexts, uiElements, circles, vars, startCodes, updateCodes
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
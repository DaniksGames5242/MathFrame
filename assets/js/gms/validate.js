// assets/js/gms/validate.js
// Проверка разобранной сцены: ссылки на несуществующие объекты, типы полей и т. п.
// Часть компилятора GMS; точка входа — assets/js/gms-compiler.js.

import { extractMethodBlocks, findAllProcDeclarations, findBlocks, findFuncDeclarations, gcUnescapeStringLiteral, removeComments, removeFuncDeclarations, removeMethodBlocks, removeProcDeclarations } from './preprocess.js';
import { evaluateStringExpression, parsePublishBlock, parseVariablesAndExpressions, removeObjectBlocks } from './parse.js';


        // ========== ПАРСЕР ОСНОВНЫХ ПОЛЕЙ ==========
        function parseAndValidate(codeBlock) {
            const errors = [];
            const params = {};
            let lineNum = 0;

            const codeWithoutComments = removeComments(codeBlock);

            const { startCodes, updateCodes } = extractMethodBlocks(codeWithoutComments);
            const publishList = findBlocks(codeWithoutComments, 'Publish')
                .map(b => parsePublishBlock(b.body))
                .filter(Boolean);
            params.publishList = publishList;
            const funcsData = findFuncDeclarations(codeWithoutComments).map(d => ({ name: d.name, params: d.params, bodyExpr: d.bodyExpr }));
            const procsData = findAllProcDeclarations(codeWithoutComments).map(d => ({ name: d.name, params: d.params, body: d.body, isVoid: d.isVoid }));

            // Глобальные переменные сцены считаются ТОЛЬКО по коду вне тел Start/Update и
            // Function/Void. Объявления вида "float y = x + 1;" внутри тела — локальные: они
            // исполняются рантаймом (у него своя область видимости) и здесь, на этапе
            // компиляции, вычислены быть не могут в принципе — параметры функции (x, v) и
            // переменные цикла (i) на этот момент не существуют. Раньше vars разбирались по
            // полному коду, и любая такая локальная переменная давала ложную ошибку
            // "Неизвестная переменная: x", а совпадение имени с глобальной — ложную
            // "Переменная r уже объявлена". eraseSpanKeepingLines сохраняет число строк, так
            // что номера строк в оставшихся сообщениях об ошибках не сдвигаются.
            let codeForVars = removeMethodBlocks(codeWithoutComments);
            codeForVars = removeProcDeclarations(codeForVars);
            const { vars, errors: varErrors } = parseVariablesAndExpressions(codeForVars);
            errors.push(...varErrors);

            let codeForParams = removeFuncDeclarations(codeForVars);
            codeForParams = removeObjectBlocks(codeForParams);

            const lines = codeForParams.split('\n');

            const validKeys = ['description', 'description align',
                               'can rotate camera', 'can zoom camera',
                               'zoom limits', 'camera start zoom', 'camera start rot',
                               'camera zoom limits', 'camera start offset',
                               'camera type', 'camera projection', 'camera fov', 'camera near', 'camera far',
                               'field width', 'field height', 'field depth', 'field color',
                               'frame color', 'frame width',
                               'description color', 'description size',
                               'theme',
                               'show axes', 'show axis x', 'show axis y', 'show axis z', 'axes size',
                               'show grid', 'show grid x', 'show grid y', 'show grid z', 'grid size',
                               'grid color', 'axes color', 'grid adaptive', '2D layer',
                               'show boundary', 'boundary color',
                               'snap', 'snap grid', 'snap distance',
                               'steps animation', 'steps duration', 'drag smoothing',
                               // профиль песочницы (assets/js/gms/playground.js); в справочнике не влияют
                               'show description', 'ui position', 'ui align', 'background', 'scene padding',
                               'frame radius', 'scene aspect', 'scene max width'];
            const requiredKeys = [];
            const numericKeys = ['field width', 'field height', 'field depth', 'frame width', 'description size', 'camera start zoom', 'axes size', 'grid size', 'snap grid', 'snap distance', 'camera fov', 'camera near', 'camera far', 'steps duration', 'drag smoothing', 'scene padding', 'frame radius', 'scene max width'];
            // zoom limits = (min, max) дистанция камеры от центра сцены (только 3D)
            // camera start rot = (азимут, полярный угол) в градусах — начальный поворот камеры (только 3D)
            const tupleKeys = ['camera zoom limits', 'camera start offset', 'zoom limits', 'camera start rot', 'scene aspect'];
            // Цвет везде в языке пишется без кавычек (#rrggbb, как и в блоках объектов вида
            // "new Point { color = #ff0000 }") — здесь та же конвенция для цветов заголовка.
            const colorKeys = ['field color', 'frame color', 'description color'];

            // Разбор параметров сцены построчный, и раньше с конца строки снимался только
            // ОДИН завершающий ';'. Из-за этого "field width = 800; field height = 600;"
            // разбиралось как key='field width', value='800; field height = 600', а
            // parseFloat молча возвращал 800 — второй и все последующие параметры строки
            // бесследно пропадали (высота оставалась дефолтной, show axes — выключенным),
            // без единого сообщения об ошибке. Теперь строка честно делится на отдельные
            // выражения по ';' ВНЕ кавычек (внутри кавычек ';' — часть значения, например
            // description = "a; b"), и каждое разбирается самостоятельно. Номер строки для
            // сообщений об ошибках у всех выражений строки общий — он и так указывает на
            // нужную строку исходника.
            function splitParamStatements(line) {
                const parts = [];
                let cur = '', q = '';
                for (let i = 0; i < line.length; i++) {
                    const c = line[i];
                    if (q) { cur += c; if (c === q) q = ''; continue; }
                    if (c === '"' || c === "'") { q = c; cur += c; continue; }
                    if (c === ';') { parts.push(cur); cur = ''; continue; }
                    cur += c;
                }
                parts.push(cur);
                return parts.map(s => s.trim()).filter(s => s !== '');
            }

            for (let rawLine of lines) {
                lineNum++;
                const lineTrimmed = rawLine.trim();
                if (lineTrimmed === '') continue;
                if (lineTrimmed.startsWith('//')) continue;
                if (/^\s*(int|float|string|bool|Vector2|color|list)\s+/.test(lineTrimmed)) continue;

                for (const line of splitParamStatements(lineTrimmed)) {
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
                    inner = gcUnescapeStringLiteral(inner);
                    parsedValue = inner;
                } else {
                    if (key === 'theme') {
                        // auto — тема хоста/системы; осмысленно в песочнице, в справочнике = dark
                        if (value === 'light' || value === 'dark' || value === 'auto') parsedValue = value;
                        else { errors.push({ line: lineNum, message: `theme должно быть "light", "dark" или "auto"` }); continue; }
                    } else if (key === 'camera type') {
                        // Как и theme — ключевое слово без кавычек (camera type = fixed;).
                        // Раньше принималось только в кавычках, а без них — ошибка компиляции.
                        if (value === 'fixed' || value === 'pan' || value === 'orbit') parsedValue = value;
                        else { errors.push({ line: lineNum, message: `camera type должно быть "fixed", "pan" или "orbit"` }); continue; }
                    } else if (key === 'description align') {
                        if (value === 'left' || value === 'center' || value === 'right') parsedValue = value;
                        else { errors.push({ line: lineNum, message: `description align должно быть "left", "center" или "right"` }); continue; }
                    } else if (key === 'ui position') {
                        if (['bottom', 'top', 'left', 'right', 'overlay'].includes(value)) parsedValue = value;
                        else { errors.push({ line: lineNum, message: `ui position должно быть одним из: bottom, top, left, right, overlay` }); continue; }
                    } else if (key === 'ui align') {
                        if (['start', 'center', 'end'].includes(value)) parsedValue = value;
                        else { errors.push({ line: lineNum, message: `ui align должно быть одним из: start, center, end` }); continue; }
                    } else if (key === 'background') {
                        if (value === 'transparent' || /^#[0-9A-Fa-f]{3,8}$/.test(value)) parsedValue = value;
                        else { errors.push({ line: lineNum, message: `background — цвет #rrggbb без кавычек или transparent` }); continue; }
                    } else if (key === 'steps animation') {
                        if (['fade', 'slide', 'scale', 'none'].includes(value)) parsedValue = value;
                        else { errors.push({ line: lineNum, message: `steps animation должно быть одним из: fade, slide, scale, none` }); continue; }
                    } else if (tupleKeys.includes(key)) {
                        const m = value.match(/^\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/);
                        if (!m) { errors.push({ line: lineNum, message: `Некорректный формат для "${key}", ожидается (a, b)` }); continue; }
                        parsedValue = [parseFloat(m[1]), parseFloat(m[2])];
                    } else if (key === 'description') {
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
                                     'show grid', 'show grid x', 'show grid y', 'show grid z', 'snap', 'grid adaptive',
                                     'show boundary', 'show description'];
                if (!booleanKeys.includes(key) && !numericKeys.includes(key) && !tupleKeys.includes(key)) {
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
            }

            for (let req of requiredKeys) {
                if (!(req in params)) {
                    errors.push({ line: '--', message: `Отсутствует обязательное поле "${req}"` });
                }
            }

            return { params, errors, vars, startCodes, updateCodes, funcsData, procsData };
        }

export { parseAndValidate };

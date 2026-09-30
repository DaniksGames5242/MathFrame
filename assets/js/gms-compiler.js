// assets/js/gms-compiler.js
// Компилятор языка GMS (интерактивные примеры MathFrame): исходник .gms → HTML сцены.
// Точка входа: export { compile }. Реализация разделена на модули в assets/js/gms/:
//   preprocess.js     — предобработка исходника (строки, комментарии, темы, процедуры)
//   parse.js          — парсеры блоков сцены и parseCommands
//   runtime-shared.js — общий для 2D/3D код, вставляемый в сцену (Markdown, UI, выражения)
//   render-2d.js      — генерация 2D-сцены
//   render-3d.js      — генерация 3D-сцены
//   validate.js       — проверка разобранной сцены
//   combine.js        — склейка 2D- и 3D-слоёв
import { formatErrorWithPos, removeComments, setCurrentThemeName } from './gms/preprocess.js';
import { parseCommands } from './gms/parse.js';
import { generate2D } from './gms/render-2d.js';
import { generate3D } from './gms/render-3d.js';
import { parseAndValidate } from './gms/validate.js';
import { combineHtml2D3D } from './gms/combine.js';


    function compile(sourceCode) {
        try {
            const match = sourceCode.match(/\[([\s\S]*)\]/);
            if (!match) {
                return { success: false, errors: ['Не найден блок в квадратных скобках [ ... ]'] };
            }
            const block = match[1];
            // Смещение начала block относительно ВСЕГО исходного текста пользователя — все
            // сообщения об ошибках должны указывать строку/символ в файле, который видит
            // человек (с учётом того, что могло быть до "["), а не внутри одной лишь block.
            const blockBaseOffset = match.index + 1;
            // parseAndValidate считает номера строк ВНУТРИ block (своя нумерация с 1) — нужен
            // сдвиг на число строк ДО начала block в исходном файле, иначе "строка N" в ошибках
            // параметров сцены (show axes = ...; и т.п.) окажется на 1+ меньше настоящей.
            const blockLineOffset = sourceCode.slice(0, blockBaseOffset).split('\n').length - 1;
            function formatErr(message, pos) {
                return formatErrorWithPos(sourceCode, message, (pos === undefined || pos === null) ? null : pos + blockBaseOffset);
            }

            const { params, errors: paramErrors, vars, startCodes, updateCodes, funcsData, procsData } = parseAndValidate(block);
            if (paramErrors.length > 0) {
                return { success: false, errors: paramErrors.map(e => (e.line !== undefined && e.line !== null && e.line !== '--') ? `${e.message} (строка ${e.line + blockLineOffset})` : e.message) };
            }

            // Тема (по умолчанию — тёмная) выставляется до разбора команд отрисовки,
            // чтобы объекты без явного цвета получали цвет по умолчанию нужной темы.
            setCurrentThemeName((params.theme === 'light' || params.theme === 'dark') ? params.theme : 'dark');

            const {
                points, lines, figures, primitives, derivedOps, clusters, angles, angles3D,
                drawAngles, drawEqually, drawVectors, drawInfLines, drawInfPlanes, drawFillings, drawPunctirs, drawTexts,
                uiElements, circles, arcs, ellipses, curves, drawFunctions, drawSurfaces, drawImages,
                drawHistograms, drawFields, drawTrajectories, drawGraphs, drawFractals,
                drawFormulas, drawDistributions, drawLoci, drawTraces, drawRegions, drawCharts, drawTrees, drawTables,
                drawComplexes, drawHyperbolics, drawBifurcations, drawCobwebs, drawIFSs, drawAutomata, drawVoronois, drawFouriers, drawDiagrams, drawTensorFields, drawScatter3Ds, drawHistogram3Ds, errors: cmdErrors
            } = parseCommands(removeComments(block), vars);

            if (cmdErrors.length > 0) {
                return { success: false, errors: cmdErrors.map(e => formatErr(e.message, e.__pos)) };
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
                    if (!knownFuncs.has(d.funcName)) funcRefErrors.push(formatErr(`draw Function "${d.name}" ссылается на необъявленную функцию "${d.funcName}"`, d.__pos));
                }
                for (const d of drawSurfaces) {
                    if (d.type === 'parametric') continue;
                    if (!knownFuncs.has(d.funcName)) funcRefErrors.push(formatErr(`draw Surface "${d.name}" ссылается на необъявленную функцию "${d.funcName}"`, d.__pos));
                }
                for (const tr of drawTrajectories) {
                    if (tr.systemName && !knownFuncs.has(tr.systemName)) funcRefErrors.push(formatErr(`draw Trajectory "${tr.name}" ссылается на необъявленную функцию "${tr.systemName}"`, tr.__pos));
                }
                for (const d of drawRegions) {
                    if (!knownFuncs.has(d.funcName)) funcRefErrors.push(formatErr(`draw Region "${d.name}" ссылается на необъявленную функцию "${d.funcName}"`, d.__pos));
                    if (d.func2Name && !knownFuncs.has(d.func2Name)) funcRefErrors.push(formatErr(`draw Region "${d.name}" ссылается на необъявленную функцию "${d.func2Name}"`, d.__pos));
                }
                for (const d of drawLoci) {
                    if (!points.find(p => p.name === d.pointName)) funcRefErrors.push(formatErr(`draw Locus "${d.name}": точка "${d.pointName}" не объявлена`, d.__pos));
                    if (!points.find(p => p.name === d.driverName)) funcRefErrors.push(formatErr(`draw Locus "${d.name}": ведущая точка "${d.driverName}" не объявлена`, d.__pos));
                }
                for (const d of drawTraces) {
                    if (!points.find(p => p.name === d.pointName)) funcRefErrors.push(formatErr(`draw Trace "${d.name}": точка "${d.pointName}" не объявлена`, d.__pos));
                }
                for (const d of drawFillings) {
                    if (!d.func) continue;
                    if (!drawFunctions.find(g => g.name === d.func)) funcRefErrors.push(formatErr(`draw Filling "${d.name}": func ссылается на несуществующий draw Function "${d.func}"`, d.__pos));
                    if (d.func2 && !drawFunctions.find(g => g.name === d.func2)) funcRefErrors.push(formatErr(`draw Filling "${d.name}": func2 ссылается на несуществующий draw Function "${d.func2}"`, d.__pos));
                }
                if (funcRefErrors.length > 0) {
                    return { success: false, errors: funcRefErrors };
                }
            }

            // "space" больше не существует как отдельный параметр — измерение (2D/3D) теперь
            // прибито к каждому объекту (Point/Point2D/Point3D и т.п., см. parseCommands).
            // generate2D/generate3D сами по себе не тронуты и по-прежнему каждый строит свой
            // полностью самостоятельный HTML-документ. Когда в сцене есть только один "мир"
            // (только 2D или только 3D), результат — это в точности их прежний вывод. Когда
            // присутствуют оба — combineHtml2D3D() склеивает два уже готовых документа в один:
            // холсты накладываются друг на друга в одном .canvas-wrapper, а движки остаются
            // двумя независимыми, самодостаточными (function(){...})() — как и раньше.
            //
            // Общее состояние между слоями в комбинированной сцене:
            // — Переменные (vars/Start/Update): единственный источник правды — window.
            //   2D пишет и читает пользовательские переменные напрямую через window[имя];
            //   3D в комбинированном режиме подключается к тем же ключам через Proxy
            //   (см. userVars в generate3D). Start/Update реально выполняет только 2D-слой —
            //   3D получает тот же самый исходный код, но не запускает его повторно, иначе
            //   побочные эффекты вроде t += dt применялись бы дважды за кадр.
            // — Время: 2D публикует свои часы в window.__gcElapsedTime на каждый Update;
            //   3D в комбинированном режиме читает их оттуда (вместо собственного таймера),
            //   поэтому переменная time означает одно и то же значение в обоих слоях в один
            //   и тот же кадр. В одиночной 3D-сцене (без 2D) 3D ведёт часы сам.
            // — UI (new UI): элементы управления рисует только 2D-слой (чтобы не дублировались
            //   визуально); поскольку слайдеры/кнопки пишут в те же window-переменные, эффект
            //   виден в обоих слоях одинаково.
            // — Методы (Function/Void): каждый слой по-прежнему выполняет их в собственном,
            //   независимом интерпретаторе (2D — glExecStatements, 3D — g3ExecStatement).
            //   Именованные геометрические объекты (точки/линии/примитивы и т.п.) при этом
            //   НЕ являются общими — они существуют только в "своём" слое; общими являются
            //   именно скалярные/строковые/булевы пользовательские переменные.
            // — Известное оставшееся ограничение: числовые параметры Primitive/Boolean/Section
            //   (pos/rotate/radius и т.п.) вычисляются один раз при компиляции из тогдашнего
            //   снимка vars и не пересчитываются в рантайме — в отличие от 2D, где положение
            //   объекта может быть формулой, живо зависящей от переменных. Полноценная реактивная
            //   параметризация тел — отдельная, более крупная задача.
            const by2D = (arr) => (arr || []).filter(o => o.dim === '2D');
            const by3D = (arr) => (arr || []).filter(o => o.dim === '3D');
            const anyDim = (arr, dim) => (arr || []).some(o => o.dim === dim);

            const has3D = primitives.length > 0 || derivedOps.length > 0 || angles3D.length > 0 || drawInfPlanes.length > 0 || drawTensorFields.length > 0 || drawScatter3Ds.length > 0 || drawHistogram3Ds.length > 0 ||
                anyDim(points, '3D') || anyDim(lines, '3D') || anyDim(figures, '3D') || anyDim(clusters, '3D') ||
                anyDim(drawVectors, '3D') || anyDim(drawFillings, '3D') || anyDim(drawTexts, '3D') ||
                anyDim(curves, '3D') || anyDim(drawSurfaces, '3D') || anyDim(drawFields, '3D') || anyDim(drawTrajectories, '3D') ||
                anyDim(drawInfLines, '3D') || anyDim(drawImages, '3D') || anyDim(drawPunctirs, '3D') || anyDim(drawEqually, '3D') || anyDim(drawHistograms, '3D') || anyDim(drawCharts, '3D') || anyDim(drawTrees, '3D') || anyDim(drawTables, '3D') || anyDim(drawGraphs, '3D') || anyDim(drawCobwebs, '3D') || anyDim(drawBifurcations, '3D') || anyDim(drawTraces, '3D') || anyDim(drawRegions, '3D') || anyDim(drawFractals, '3D') || anyDim(drawComplexes, '3D') || anyDim(drawIFSs, '3D') || anyDim(drawAutomata, '3D') || anyDim(drawHyperbolics, '3D') || anyDim(drawVoronois, '3D');
            const has2D = circles.length > 0 || arcs.length > 0 || ellipses.length > 0 || drawFunctions.length > 0 ||
                drawFormulas.length > 0 ||
                drawDistributions.length > 0 ||
                drawLoci.length > 0 ||
                drawFouriers.length > 0 ||
                drawDiagrams.length > 0 || angles.length > 0 || drawAngles.length > 0 ||
                anyDim(points, '2D') || anyDim(lines, '2D') || anyDim(figures, '2D') || anyDim(clusters, '2D') ||
                anyDim(drawVectors, '2D') || anyDim(drawFillings, '2D') || anyDim(drawTexts, '2D') ||
                anyDim(curves, '2D') || anyDim(drawSurfaces, '2D') || anyDim(drawFields, '2D') || anyDim(drawTrajectories, '2D') ||
                anyDim(drawInfLines, '2D') || anyDim(drawImages, '2D') || anyDim(drawPunctirs, '2D') || anyDim(drawEqually, '2D') || anyDim(drawHistograms, '2D') || anyDim(drawCharts, '2D') || anyDim(drawTrees, '2D') || anyDim(drawTables, '2D') || anyDim(drawGraphs, '2D') || anyDim(drawCobwebs, '2D') || anyDim(drawBifurcations, '2D') || anyDim(drawTraces, '2D') || anyDim(drawRegions, '2D') || anyDim(drawFractals, '2D') || anyDim(drawComplexes, '2D') || anyDim(drawIFSs, '2D') || anyDim(drawAutomata, '2D') || anyDim(drawHyperbolics, '2D') || anyDim(drawVoronois, '2D');

            let html;
            if (has2D && has3D) {
                const html2D = generate2D(
                    params,
                    by2D(points), by2D(lines), by2D(figures), by2D(clusters), angles,
                    drawAngles, by2D(drawEqually), by2D(drawVectors), by2D(drawInfLines), by2D(drawFillings), by2D(drawPunctirs),
                    by2D(drawTexts), uiElements, circles, arcs, ellipses, by2D(curves), drawFunctions, by2D(drawSurfaces), by2D(drawImages),
                    by2D(drawHistograms), by2D(drawFields), by2D(drawTrajectories), by2D(drawGraphs), by2D(drawFractals),
                    drawFormulas, drawLoci, by2D(drawTraces), by2D(drawRegions), by2D(drawCharts), by2D(drawTrees), by2D(drawTables),
                    by2D(drawComplexes), by2D(drawHyperbolics), by2D(drawBifurcations), by2D(drawCobwebs), by2D(drawIFSs), by2D(drawAutomata), by2D(drawVoronois), drawFouriers, drawDiagrams,
                    funcsData, procsData, vars, startCodes, updateCodes, drawDistributions
                );
                const html3D = generate3D(
                    params,
                    by3D(points), by3D(lines), by3D(figures), by3D(clusters), by3D(drawFillings), angles, drawAngles, by3D(drawVectors),
                    by3D(drawSurfaces), by3D(drawFields), by3D(curves), by3D(drawTrajectories), by3D(drawTexts), [],
                    drawInfPlanes,
                    funcsData, procsData, vars, startCodes, updateCodes,
                    primitives, derivedOps, angles3D, by3D(drawInfLines), by3D(drawImages), by3D(drawPunctirs), by3D(drawEqually), by3D(drawHistograms), by3D(drawCharts), by3D(drawTrees), by3D(drawTables), by3D(drawGraphs), by3D(drawCobwebs), by3D(drawBifurcations), by3D(drawTraces), by3D(drawRegions), by3D(drawFractals), by3D(drawComplexes), by3D(drawIFSs), by3D(drawAutomata), by3D(drawHyperbolics), by3D(drawVoronois), drawTensorFields, drawScatter3Ds, drawHistogram3Ds
                );
                if (!html2D || !html3D) {
                    return { success: false, errors: ['Ошибка генерации HTML'] };
                }
                try {
                    html = combineHtml2D3D(html2D, html3D, params['2D layer']);
                } catch (e) {
                    return { success: false, errors: [e.message] };
                }
            } else if (has3D) {
                html = generate3D(
                    params,
                    by3D(points), by3D(lines), by3D(figures), by3D(clusters), by3D(drawFillings), angles, drawAngles, by3D(drawVectors),
                    by3D(drawSurfaces), by3D(drawFields), by3D(curves), by3D(drawTrajectories), by3D(drawTexts), uiElements,
                    drawInfPlanes,
                    funcsData, procsData, vars, startCodes, updateCodes,
                    primitives, derivedOps, angles3D, by3D(drawInfLines), by3D(drawImages), by3D(drawPunctirs), by3D(drawEqually), by3D(drawHistograms), by3D(drawCharts), by3D(drawTrees), by3D(drawTables), by3D(drawGraphs), by3D(drawCobwebs), by3D(drawBifurcations), by3D(drawTraces), by3D(drawRegions), by3D(drawFractals), by3D(drawComplexes), by3D(drawIFSs), by3D(drawAutomata), by3D(drawHyperbolics), by3D(drawVoronois), drawTensorFields, drawScatter3Ds, drawHistogram3Ds
                );
            } else {
                html = generate2D(
                    params,
                    by2D(points), by2D(lines), by2D(figures), by2D(clusters), angles,
                    drawAngles, by2D(drawEqually), by2D(drawVectors), by2D(drawInfLines), by2D(drawFillings), by2D(drawPunctirs),
                    by2D(drawTexts), uiElements, circles, arcs, ellipses, by2D(curves), drawFunctions, by2D(drawSurfaces), by2D(drawImages),
                    by2D(drawHistograms), by2D(drawFields), by2D(drawTrajectories), by2D(drawGraphs), by2D(drawFractals),
                    drawFormulas, drawLoci, by2D(drawTraces), by2D(drawRegions), by2D(drawCharts), by2D(drawTrees), by2D(drawTables),
                    by2D(drawComplexes), by2D(drawHyperbolics), by2D(drawBifurcations), by2D(drawCobwebs), by2D(drawIFSs), by2D(drawAutomata), by2D(drawVoronois), drawFouriers, drawDiagrams,
                    funcsData, procsData, vars, startCodes, updateCodes, drawDistributions
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
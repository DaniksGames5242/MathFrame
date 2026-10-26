// assets/js/gms/render-2d.js
// Генерация HTML/JS двумерной сцены (canvas 2D).
// Часть компилятора GMS; точка входа — assets/js/gms-compiler.js.

import { THEME_PRESETS, jsonForScript } from './preprocess.js';
import { gcSharedExprParserLines, gcSharedMarkdownKatexLines, gcSharedUIBuilderLines, gcSharedControlsCss } from './runtime-shared.js';


        // ========== ГЕНЕРАТОР 2D с динамическими окружностями ==========
function generate2D(params, pointsData, linesData, figuresData, clustersData, anglesData,
                    drawAnglesData, drawEquallyData, drawVectorsData, drawInfLinesData, drawFillingsData, drawPunctirsData,
                    drawTextsData, uiData, circlesData, arcsData, ellipsesData, curvesData, drawFunctionsData, drawSurfacesData, drawImagesData,
                    drawHistogramsData, drawFieldsData, drawTrajectoriesData, drawGraphsData, drawFractalsData,
                    drawFormulasData, drawLociData, drawTracesData, drawRegionsData,
                    drawChartsData, drawTreesData, drawTablesData, drawComplexesData, drawHyperbolicsData,
                    drawBifurcationsData, drawCobwebsData, drawIFSsData, drawAutomataData, drawVoronoisData, drawFouriersData, drawDiagramsData,
                    funcsData, procsData, userVars, startCodes, updateCodes, drawDistributionsData) {
    try {
        // shift = (dx, dy) любого объекта — таблица по имени: не все типы переносят
        // свои поля в рантайм целиком (часть собирается из выбранных полей)
        const gcShifts = {};
        for (const arr of arguments) if (Array.isArray(arr)) for (const d of arr) if (d && d.name && Array.isArray(d.shift)) gcShifts[d.name] = d.shift;
        const description = params.description || '';
        const descAlign = ['left', 'center', 'right'].includes(params['description align']) ? params['description align'] : 'left';

        // Тема оформления (по умолчанию — тёмная); задаёт цвет фона, рамки и цвета "по умолчанию",
        // если автор явно не указал их в конфиге. Явно указанные значения всегда в приоритете
        // и не переопределяются при смене темы из родительского окна (см. __gcApplyThemeVars ниже).
        const themeName = (params.theme === 'light' || params.theme === 'dark') ? params.theme : 'dark';
        const theme = THEME_PRESETS[themeName];

        // Пошаговый режим (проф-режим): как анимируется переключение между кластерами-пунктами (see gcSetStep). Выбор автора сцены, никаких элементов управления внутри самой сцены не добавляется намеренно.
        const gcStepAnimation = ['fade', 'slide', 'scale', 'none'].includes(params['steps animation']) ? params['steps animation'] : 'fade';
        const gcStepDuration = (typeof params['steps duration'] === 'number' && params['steps duration'] >= 0) ? params['steps duration'] : 0.6;
        // new Publish{} — чистый канал наружу: значения публикуются через postMessage,
        // без необходимости родительской странице парсить description/DOM сцены.
        const gcPublishListJson = jsonForScript(params.publishList || []);

        const fieldWidth = (typeof params['field width'] === 'number') ? params['field width'] : 50;
        const fieldHeight = (typeof params['field height'] === 'number') ? params['field height'] : 30;
        const fieldColor = params['field color'] || theme.fieldColor;
        const frameColor = params['frame color'] || theme.frameColor;
        const frameWidth = (typeof params['frame width'] === 'number') ? params['frame width'] : 1;
        const descColor = params['description color'] || theme.descColor;
        const descSize = (typeof params['description size'] === 'number') ? params['description size'] : 0.85;

        // Явные переопределения цвета автором примера — при смене темы из iframe эти
        // значения не должны затираться пресетом.
        const themeOverrides = {
            field: !!params['field color'],
            frame: !!params['frame color'],
            desc: !!params['description color'],
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
        const snapEnabled = params.snap === true;
        const snapGridStep = (typeof params['snap grid'] === 'number' && params['snap grid'] > 0) ? params['snap grid'] : 1;
        const snapDistancePx = (typeof params['snap distance'] === 'number' && params['snap distance'] >= 0) ? params['snap distance'] : 10;
        // drag smoothing = секунды — постоянная времени, с которой перетаскиваемый объект
        // догоняет указатель (0 — без сглаживания, как раньше). По умолчанию — едва заметная
        // плавность вместо резкого «прилипания» к курсору; на отпускании объект сразу
        // встаёт точно под указатель.
        const dragSmoothing = (typeof params['drag smoothing'] === 'number' && params['drag smoothing'] >= 0) ? Math.min(params['drag smoothing'], 1) : 0.05;

        // ---- Сетка и оси всей сцены (Задача 6/9) — раньше это работало только у
        // draw Function { grid = true }; теперь это общесценовая настройка, как и в 3D. ----
        const showAxesMaster2D = params['show axes'] === true;
        const showAxisX2D = (params['show axis x'] !== undefined) ? (params['show axis x'] !== false) : showAxesMaster2D;
        const showAxisY2D = (params['show axis y'] !== undefined) ? (params['show axis y'] !== false) : showAxesMaster2D;
        const showGridMaster2D = params['show grid'] === true;
        const showGridX2D = (params['show grid x'] !== undefined) ? (params['show grid x'] !== false) : showGridMaster2D;
        const showGridY2D = (params['show grid y'] !== undefined) ? (params['show grid y'] !== false) : showGridMaster2D;
        const gridStep2D = (typeof params['grid size'] === 'number' && params['grid size'] > 0) ? params['grid size'] : 1;
        const gridAdaptive2D = params['grid adaptive'] !== false;
        const cameraType2D = (params['camera type'] === 'fixed') ? 'fixed' : 'pan';
        const gridColor2D = params['grid color'] || '';
        const axesColor2D = params['axes color'] || '';
        // ---- Граница поля (Задача: видимая рамка видимой области сцены в 2D) ----
        const showBoundary2D = params['show boundary'] === true;
        // Без явного boundary color граница идёт за темой (см. BOUNDARY_COLOR в рантайме) —
        // раньше дефолт был полупрозрачный белый, невидимый на светлой теме.
        const boundaryColor2D = params['boundary color'] || '';

        const descriptionJson = jsonForScript(description);
        const descAlignJson = jsonForScript(descAlign);

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
        const drawDistributionsJson = jsonForScript(drawDistributionsData || []);
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
            '  <title>GMS</title>\n',
            // KaTeX через CDN (абсолютные URL — работают в файле, открытом откуда угодно, включая blob URL)
            '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">\n',
            '  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>\n',
            ' <' + 'style>\n',
            '    :root {\n',
            '      --gc-field:', fieldColor, ';\n',
            '      --gc-frame:', frameColor, ';\n',
            '      --gc-desc:', descColor, ';\n',
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
            '    .canvas-wrapper { border:', String(frameWidth), 'px solid var(--gc-frame); display:block; width:100%; max-width:800px; margin:0 auto; background:var(--gc-field); cursor:default; position:relative; overflow:hidden; }\n',
            '    canvas { background:transparent; display:block; margin:0 auto; width:100%; height:auto; border:none; touch-action:none; }\n',
            // .info-panel — обычный читаемый текст под холстом (не моноширинный и без
            // «плашки»-фона, как было раньше): обычный шрифт страницы, нормальная межстрочная
            // высота; выравнивание берётся из description align (по умолчанию слева) и может
            // переопределяться по блокам через ::align=... фенсы (см. gcRenderDescriptionHtml).
            '    .info-panel { font-size:', String(descSize), 'rem; margin:0.8rem auto 0; max-width:800px; line-height:1.6; color:var(--gc-desc); position:relative; }\n',
            '    .info-panel p { margin:0 0 0.6em 0; }\n',
            '    .info-panel p:last-child { margin-bottom:0; }\n',
            '    .info-panel h1, .info-panel h2, .info-panel h3, .info-panel h4 { margin:0.7em 0 0.35em 0; font-weight:700; line-height:1.3; }\n',
            '    .info-panel h1:first-child, .info-panel h2:first-child, .info-panel h3:first-child, .info-panel h4:first-child { margin-top:0; }\n',
            '    .info-panel h1 { font-size:1.5em; } .info-panel h2 { font-size:1.25em; } .info-panel h3 { font-size:1.1em; } .info-panel h4 { font-size:1em; }\n',
            '    .info-panel a { color:var(--gc-accent); text-decoration:underline; }\n',
            '    .info-panel code { font-family:\'Consolas\',monospace; background:rgba(128,128,128,0.15); padding:0.1em 0.35em; border-radius:3px; font-size:0.9em; }\n',
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
            ...gcSharedControlsCss(),
            '    .controls input.no-stepper::-webkit-inner-spin-button,\n',
            '    .controls input.no-stepper::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }\n',
            '    .controls input.no-stepper { -moz-appearance:textfield; }\n',
            '    @media (max-width:700px) {\n',
            '      .info-panel { font-size:0.8rem; }\n',
            '      .controls { gap:8px; }\n',
            '      .controls input[type="number"], .controls input[type="text"] { width:80px; }\n',
            '    }\n',
            '  <' + '/style>\n',
            '</head>\n',
            '<body>\n',
            '<div class="container">\n',
            '  <div class="canvas-wrapper">\n',
            '    <canvas id="mainCanvas"></canvas>\n',
            '    <div id="formulaOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; z-index:10;"></div>\n',
            '    <div id="uiOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; z-index:11;"></div>\n',
            '  </div>\n',
            '  <div class="controls" id="uiContainer"></div>\n',
            '  <div class="info-panel" id="infoText"></div>\n',
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
            '    // Текст под холстом — см. gcRenderDescriptionHtml/updateDescription ниже:\n',
            '    // {выражение} внутри подставляется значением из живых переменных каждый кадр,\n',
            '    // поддерживается лёгкий markdown (# заголовки, **жирный**, *курсив*, `код`,\n',
            '    // [текст](ссылка)), выравнивание/отступы через ::align=center indent=2 ... ::\n',
            '    // блоки, и формулы KaTeX \\( ... \\) / \\[ ... \\] — тоже с {переменными} внутри.\n',
            '    const GC_DESCRIPTION_RAW = ', descriptionJson, ';\n',
            '    const GC_DESCRIPTION_ALIGN = ', descAlignJson, ';\n',
            '    function __gcDefaultColor() {\n',
            '      const t = GC_THEMES[gcThemeName] || GC_THEMES.dark;\n',
            '      return t.defaultColor;\n',
            '    }\n',
            '    function __gcTheme() { return GC_THEMES[gcThemeName] || GC_THEMES.dark; }\n',
            '    // Шрифт всех подписей на холсте: системный гротеск вместо generic sans-serif.\n',
            '    const GC_FONT = \'"Inter","Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif\';\n',
            '    // Текст с «ореолом» цвета поля — читается поверх сетки и линий (как в Desmos).\n',
            '    function __gcHaloText(text, x, y, haloW) {\n',
            '      ctx.save(); ctx.lineJoin = \'round\'; ctx.miterLimit = 2;\n',
            '      ctx.strokeStyle = __gcTheme().halo; ctx.lineWidth = haloW || 3.5; ctx.globalAlpha = Math.min(1, ctx.globalAlpha * 0.9);\n',
            '      ctx.strokeText(text, x, y); ctx.restore();\n',
            '      ctx.fillText(text, x, y);\n',
            '    }\n',
            '    // Однобуквенные имена (A, B, x₀) — курсивом, как принято в математической записи.\n',
            '    function __gcLabelFont(text, px) {\n',
            '      const mathy = /^[A-Za-zА-Яа-яα-ωΑ-Ω][0-9₀-₉\'′″]*$/.test(String(text));\n',
            '      return (mathy ? \'italic 600 \' : \'500 \') + px + \'px \' + GC_FONT;\n',
            '    }\n',
            '    function __gcButtonTextColor() {\n',
            '      const t = GC_THEMES[gcThemeName] || GC_THEMES.dark;\n',
            '      return t.buttonText;\n',
            '    }\n',
            '    function __gcApplyThemeVars(t) {\n',
            '      const root = document.documentElement.style;\n',
            '      if (!GC_THEME_OVERRIDES.field) root.setProperty(\'--gc-field\', t.fieldColor);\n',
            '      if (!GC_THEME_OVERRIDES.frame) root.setProperty(\'--gc-frame\', t.frameColor);\n',
            '      if (!GC_THEME_OVERRIDES.desc) root.setProperty(\'--gc-desc\', t.descColor);\n',
            '      root.setProperty(\'--gc-control-bg\', t.controlBg);\n',
            '      root.setProperty(\'--gc-control-border\', t.controlBorder);\n',
            '      root.setProperty(\'--gc-control-text\', t.controlText);\n',
            '      root.setProperty(\'--gc-button-text\', t.buttonText);\n',
            '      root.setProperty(\'--gc-input-bg\', t.inputBg);\n',
            '      root.setProperty(\'--gc-accent\', t.accent);\n',
            '    }\n',
            '    function glLogSafe(msg) { try { if (window.logLevel !== \'silent\') console.warn(msg); } catch (e) {} }\n',
            '    // Переключение темы регистрируется как ОДИН ИЗ НЕСКОЛЬКИХ обработчиков в общем\n',
            '    // диспетчере window.__gcThemeSetters, а не как прямое присваивание\n',
            '    // window.geocompilerSetTheme. Раньше при объединении 2D- и 3D-слоёв на одной странице\n',
            '    // (draw Table { pos = (x,y,z) } и т.п. соседствуют с 2D-объектами) 2D- и 3D-скрипты —\n',
            '    // это ДВА РАЗНЫХ замыкания в двух отдельных script-тегах, и каждый присваивал\n',
            '    // window.geocompilerSetTheme самостоятельно; второй скрипт (3D, вставляется позже)\n',
            '    // тихо перезаписывал функцию первого — переключение темы в комбинированной сцене на\n',
            '    // деле обновляло только один слой. Общий список обработчиков решает это: каждый слой\n',
            '    // добавляет туда СВОЙ обработчик, а сам window.geocompilerSetTheme и слушатель\n',
            '    // postMessage создаются один раз (какой скрипт до этого дойдёт первым).\n',
            '    window.__gcThemeSetters = window.__gcThemeSetters || [];\n',
            '    window.__gcThemeSetters.push(function(name) {\n',
            '      if (!GC_THEMES[name]) { glLogSafe(\'Неизвестная тема: \' + name); return false; }\n',
            '      gcThemeName = name;\n',
            '      __gcApplyThemeVars(GC_THEMES[name]);\n',
            '      if (typeof markSceneChanged === \'function\') markSceneChanged();\n',
            '      if (typeof draw === \'function\') draw();\n',
            '      return true;\n',
            '    });\n',
            '    if (!window.geocompilerSetTheme) {\n',
            '      window.geocompilerSetTheme = function(name) {\n',
            '        var ok = false;\n',
            '        for (var i = 0; i < window.__gcThemeSetters.length; i++) { if (window.__gcThemeSetters[i](name)) ok = true; }\n',
            '        return ok;\n',
            '      };\n',
            '    }\n',
            '    if (!window.__gcThemeMsgListenerAdded) {\n',
            '      window.__gcThemeMsgListenerAdded = true;\n',
            '      window.addEventListener(\'message\', function(ev) {\n',
            '        var data = ev && ev.data;\n',
            '        if (!data || data.type !== \'geocompiler-set-theme\') return;\n',
            '        window.geocompilerSetTheme(data.theme);\n',
            '      });\n',
            '    }\n',
            '\n',
            '    // \u041f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u0448\u0430\u0433\u0430 \u0434\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u0430 \u043f\u0440\u0438\u0445\u043e\u0434\u0438\u0442 \u0421\u041d\u0410\u0420\u0423\u0416\u0418 (\u0441\u043c. \u0433\u0435\u043e\u043a\u043e\u043c\u043f\u0438\u043b\u044f\u0442\u043e\u0440-\u0432\u044c\u044e\u0432\u0435\u0440 \u0442\u0435\u043c\u044b \u0442\u0438\u043f\u0430 \"\u0434\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u043e\"); \u0432\u043d\u0443\u0442\u0440\u0438 \u0441\u0430\u043c\u043e\u0439 \u0441\u0446\u0435\u043d\u044b \u043d\u0435\u0442 \u043d\u0438\u043a\u0430\u043a\u0438\u0445 \u043a\u043d\u043e\u043f\u043e\u043a \u043f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u044f \u2014 \u0441\u043c. gcSetStep \u043d\u0438\u0436\u0435 \u043f\u043e \u0444\u0430\u0439\u043b\u0443 (\u0440\u044f\u0434\u043e\u043c \u0441 draw()).\n',
            '    window.__gcStepSetters = window.__gcStepSetters || [];\n',
            '    window.__gcStepSetters.push(function(step) { if (typeof gcSetStep === \'function\') gcSetStep(step); return true; });\n',
            '    if (!window.geocompilerSetStep) {\n',
            '      window.geocompilerSetStep = function(step) {\n',
            '        for (var i = 0; i < window.__gcStepSetters.length; i++) window.__gcStepSetters[i](step);\n',
            '      };\n',
            '    }\n',
            '    if (!window.__gcStepMsgListenerAdded) {\n',
            '      window.__gcStepMsgListenerAdded = true;\n',
            '      window.addEventListener(\'message\', function(ev) {\n',
            '        var data = ev && ev.data;\n',
            '        if (!data || data.type !== \'geocompiler-set-step\') return;\n',
            '        window.geocompilerSetStep(data.step);\n',
            '      });\n',
            '    }\n',
            '\n',
            '    const pointsData = ', pointsJson, ';\n',
            '    const linesData = ', linesJson, ';\n',
            '    const figuresData = ', figuresJson, ';\n',
            '    const clustersData = ', clustersJson, ';\n',
            '    const publishData = ', gcPublishListJson, ';\n',
            '    const gcStepAnimation = ', jsonForScript(gcStepAnimation), ';\n',
            '    const gcStepDuration = ', String(gcStepDuration), ';\n',
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
            '    const drawDistributionsData = ', drawDistributionsJson, ';\n',
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
            '    const SHOW_AXIS_X = ', String(showAxisX2D), ', SHOW_AXIS_Y = ', String(showAxisY2D), ';\n',
            '    const SHOW_GRID_X = ', String(showGridX2D), ', SHOW_GRID_Y = ', String(showGridY2D), ';\n',
            '    const GRID_STEP_BASE = ', String(gridStep2D), ';\n',
            '    const GRID_ADAPTIVE = ', String(gridAdaptive2D), ';\n',
            '    const GRID_COLOR = \'', gridColor2D, '\';\n',
            '    const AXES_COLOR = \'', axesColor2D, '\';\n',
            '    const SHOW_BOUNDARY = ', String(showBoundary2D), ';\n',
            '    const BOUNDARY_COLOR = \'', boundaryColor2D, '\';\n',
            '    const CAMERA_TYPE_2D = \'', cameraType2D, '\';\n',
            '    const EDGE_MARGIN = 0;\n',
            '    const VERTEX_RADIUS = 7;\n',
            '    const IS_TOUCH_DEVICE = (\'ontouchstart\' in window) || (navigator.maxTouchPoints > 0);\n',
            '    const HIT_THRESHOLD = IS_TOUCH_DEVICE ? 38 : 22;\n',
            '    const EDGE_HIT_THRESHOLD = IS_TOUCH_DEVICE ? 28 : 16;\n',
            // MIN_DIST — запасное значение в единицах поля. Основной путь теперь другой:
            // точка РИСУЕТСЯ радиусом VERTEX_RADIUS * size пикселей, то есть её экранный
            // размер не зависит от зума, а порог столкновения был жёстко задан в единицах
            // поля. Из-за этого при сильном приближении точки отталкивались, находясь на
            // экране далеко друг от друга, а при отдалении — визуально налезали одна на
            // другую, не сталкиваясь вовсе. Считаем порог из фактического радиуса отрисовки,
            // переведённого в единицы поля: тогда точки расходятся ровно тогда, когда их
            // нарисованные кружки соприкасаются, при любом масштабе.
            '    const MIN_DIST = 1.0;\n',
            '    function gcPointRadiusField(p) {\n',
            '      const sc = fieldScale();\n',
            '      if (!(sc > 0)) return MIN_DIST / 2;\n',
            '      return (VERTEX_RADIUS * ((p && p.size) || 1)) / sc;\n',
            '    }\n',
            '    function gcPairSep(a, b) { return gcPointRadiusField(a) + gcPointRadiusField(b); }\n',
            // Граница поля для ЦЕНТРОВ точек — с отступом в радиус точки. Раньше центр
            // упирался ровно в край, и точка у стенки (а в углу — на три четверти) оказывалась
            // за пределами холста: её было почти невозможно снова схватить.
            '    function gcFieldPad() {\n',
            '      const sc = fieldScale();\n',
            '      if (!(sc > 0)) return 0;\n',
            '      return Math.min(VERTEX_RADIUS / sc, FIELD_WIDTH / 4, FIELD_HEIGHT / 4);\n',
            '    }\n',
            '    function gcFieldHalfW() { return FIELD_WIDTH / 2 - gcFieldPad(); }\n',
            '    function gcFieldHalfH() { return FIELD_HEIGHT / 2 - gcFieldPad(); }\n',
            // В мини-языке: fieldMaxX / fieldMaxY — наибольшая |x| / |y| центра точки внутри
            // поля (с учётом отступа выше). Нужны сценариям, которые сами ограничивают точки
            // полем (Update), чтобы их граница совпадала с границей движка при любой ширине холста.
            '    try {\n',
            '      Object.defineProperty(window, \'fieldMaxX\', { get: function() { return gcFieldHalfW(); }, configurable: true });\n',
            '      Object.defineProperty(window, \'fieldMaxY\', { get: function() { return gcFieldHalfH(); }, configurable: true });\n',
            '    } catch (e) {}\n',
            '    const FIGURE_HIT_PADDING = 30;\n',
            '\n',
            '    let width = 800, height = 500;\n',
            // width/height — ЛОГИЧЕСКИЙ размер холста (CSS-пиксели), в нём работает вся отрисовка\n
            // и пересчёт координат. Физический буфер canvas больше в gcDpr раз (см. resizeCanvas),
            // иначе на экранах с devicePixelRatio > 1 картинка была мыльной.
            '    let gcDpr = 1;\n',
            '    const GC_MIN_LOGICAL_WIDTH = 480;\n',
            '    // Десятичный разделитель: запятая (стандарт сайта), точка — если в настройках сайта\n',
            '    // выбран английский язык (localStorage mf-lang = en).\n',
            '    window.__gcDecSep = (function() { try { return localStorage.getItem(\'mf-lang\') === \'en\' ? \'.\' : \',\'; } catch (e) { return \',\'; } })();\n',
            '    let gcCssK = 1;   // CSS-пикселей экрана на логический пиксель сцены (<1 на узком экране)\n',
            '    const camera = { zoom: ', String(cameraStartZoom), ', offsetX: ', String(cameraStartOffset[0]), ', offsetY: ', String(cameraStartOffset[1]), ', zoomMin: ', String(cameraZoomLimits[0]), ', zoomMax: ', String(cameraZoomLimits[1]), ' };\n',
            '    window.camera = camera;\n',
            '    window.autoRedraw = true;\n',
            '    window.collisionsEnabled = true;\n',
            '    window.snapEnabled = ', String(snapEnabled), ';\n',
            '    const SNAP_GRID_STEP = ', String(snapGridStep), ';\n',
            '    const SNAP_DISTANCE_PX = ', String(snapDistancePx), ';\n',
            '    const DRAG_SMOOTHING = ', String(dragSmoothing), ';\n',
            '    window.coordinateSystem = \'cartesian\'; // \'cartesian\' | \'polar\' — влияет на вид сетки/осей (draw Function { grid=true })\n',

            '    let points = [];\n',
            '    let lines = [];\n',
            '    let drawFractals = [];\n',
            '    let drawFormulas = [];\n',
            '    let drawDistributions = [];\n',
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
            '    // Разрешает "точечный" путь вида point.x / point.pos.y / varName.prop — используется\n',
            '    // в activeExpr (см. glIsActive ниже), портировано из g3ResolveDotted (3D-движок).\n',
            '    function glResolveDotted(path) {\n',
            '      const parts = path.split(\'.\');\n',
            '      const first = parts[0];\n',
            '      let cur;\n',
            '      const pt = points.find(function(p) { return p.name === first; });\n',
            '      if (pt) {\n',
            '        cur = { x: pt.pos.x, y: pt.pos.y, pos: { x: pt.pos.x, y: pt.pos.y }, name: pt.name, active: pt.active };\n',
            '      } else if (typeof userVars[first] !== \'undefined\') {\n',
            '        cur = userVars[first];\n',
            '      } else return undefined;\n',
            '      for (let i = 1; i < parts.length; i++) { if (cur === null || cur === undefined) return undefined; cur = cur[parts[i]]; }\n',
            '      return cur;\n',
            '    }\n',
            '    // Динамическая видимость через activeExpr (переменная/точечный путь/"true"/"false")\n',
            '    // — портировано из g3IsActive (3D-движок), чтобы объекты 2D-сцены тоже могли\n',
            '    // управлять видимостью через переменные/слайдеры, а не только статическим active.\n',
            '    function glIsActive(activeExpr, fallback) {\n',
            '      if (activeExpr === undefined || activeExpr === null) return fallback !== false;\n',
            '      // "true"/"false" буквальные — это НЕ реактивная привязка к переменной, а просто то,\n',
            '      // что было написано в active = ... при компиляции. Раньше это жёстко фиксировало\n',
            '      // видимость навсегда, из-за чего objName.active = true/false в действиях кнопок\n',
            '      // (new UI action = "fractal.active = true; ...") не имело эффекта, если объект был\n',
            '      // объявлен с буквальным active = true/false. fallback уже содержит ТЕКУЩЕЕ (в т.ч.\n',
            '      // изменённое в рантайме) значение obj.active — используем его.\n',
            '      if (activeExpr === \'true\' || activeExpr === \'false\') return fallback !== false;\n',
            '      if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(activeExpr)) {\n',
            '        let v; try { v = evaluate(activeExpr); } catch (e) { return fallback !== false; }\n',
            '        return !(v === false || v === 0 || v === \'\' || v === undefined || v === null);\n',
            '      }\n',
            '      const raw = (activeExpr.indexOf(\'.\') >= 0) ? glResolveDotted(activeExpr) : userVars[activeExpr];\n',
            '      if (raw === undefined || raw === null) return fallback !== false;\n',
            '      return !(raw === false || raw === 0 || raw === \'\');\n',
            '    }\n',
            '    // Объект, для которого сейчас строится очередь отрисовки (isObjectActive вызывается\n',
            '    // перед каждым push в drawFull) — запись очереди помнит свой объект: для shift и\n',
            '    // для визуального редактора (window.__gcDrawHook — какой объект сейчас рисуется).\n',
            '    let __gcQueueObj = null;\n',
            '    const __gcShifts = ', jsonForScript(gcShifts), ';\n',
            '    function isObjectActive(obj) {\n',
            '      __gcQueueObj = obj;\n',
            '      if (!obj) return false;\n',
            '      for (let c of clusters) {\n',
            '        if (c.elements.includes(obj)) {\n',
            '          if (!c.active) return false;\n',
            '          if (c.step !== undefined && c.step !== null && c.step !== window.__gcCurrentStep) return false;\n',
            '          break;\n',
            '        }\n',
            '      }\n',
            '      return glIsActive(obj.activeExpr, obj.active !== undefined ? obj.active : true);\n',
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
            '      let moveX, moveY;\n',
            '      if (mode === \'free\') {\n',
            '        moveX = dx; moveY = dy;\n',
            '      } else if (mode === \'line\' && line) {\n',
            '        const dirX = line.pB.pos.x - line.pA.pos.x;\n',
            '        const dirY = line.pB.pos.y - line.pA.pos.y;\n',
            '        const len = Math.hypot(dirX, dirY);\n',
            '        if (len < 0.001) return false;\n',
            '        const normX = -dirY / len;\n',
            '        const normY = dirX / len;\n',
            '        const proj = dx * normX + dy * normY;\n',
            '        moveX = proj * normX;\n',
            '        moveY = proj * normY;\n',
            '      } else {\n',
            '        return false; // mode === \'pointOnSide\' обрабатывается отдельно, сюда не попадает\n',
            '      }\n',
            '      const halfW = gcFieldHalfW(), halfH = gcFieldHalfH();\n',
            '      function outOfField(pos) { return pos.x < -halfW || pos.x > halfW || pos.y < -halfH || pos.y > halfH; }\n',
            '      const pointsToCheck = [vertex, p1, p2];\n',
            '      // Взаимные расстояния vertex/p1/p2 неизменны при чистом переносе (жёсткое тело),\n',
            '      // поэтому если угол уже был в порядке ДО хода, эта тройка сама с собой никогда не\n',
            '      // столкнётся ни при каком s — достаточно проверить один раз, не на каждый шаг бисекции.\n',
            '      const selfOk = distance(oldP1, oldV) >= MIN_DIST && distance(oldP2, oldV) >= MIN_DIST && distance(oldP1, oldP2) >= MIN_DIST;\n',
            '      // Проверяет положение угла как единого жёсткого тела при переносе на долю s от\n',
            '      // полного вычисленного сдвига (s=1 — сдвиг мыши целиком). Возвращает кандидатные\n',
            '      // позиции трёх точек, либо null, если при таком s угол вышел бы за поле, столкнулся\n',
            '      // с другой точкой, или (случай испорченного угла с самого начала) сам с собой.\n',
            '      function candidateAt(s) {\n',
            '        const v = { x: oldV.x + moveX * s, y: oldV.y + moveY * s };\n',
            '        const q1 = { x: oldP1.x + moveX * s, y: oldP1.y + moveY * s };\n',
            '        const q2 = { x: oldP2.x + moveX * s, y: oldP2.y + moveY * s };\n',
            '        if (outOfField(v) || outOfField(q1) || outOfField(q2)) return null;\n',
            '        for (let i = 0; i < points.length; i++) {\n',
            '          if (pointsToCheck.includes(points[i])) continue;\n',
            '          if (distance(v, points[i].pos) < MIN_DIST || distance(q1, points[i].pos) < MIN_DIST || distance(q2, points[i].pos) < MIN_DIST) return null;\n',
            '        }\n',
            '        if (!selfOk && (distance(q1, v) < MIN_DIST || distance(q2, v) < MIN_DIST || distance(q1, q2) < MIN_DIST)) return null;\n',
            '        return { v, q1, q2 };\n',
            '      }\n',
            '      // Раньше любое препятствие (граница поля/другая точка) отменяло ВЕСЬ сдвиг целиком —\n',
            '      // из-за этого при перетаскивании мышью угол либо не двигался вовсе, либо резко\n',
            '      // "прыгал", когда мышь возвращалась в допустимую область (весь пройденный мышью путь\n',
            '      // накапливался, а не терялся). Теперь методом бисекции ищем наибольшую долю s хода,\n',
            '      // при которой угол ещё не задевает препятствие — угол плавно скользит вдоль границы/\n',
            '      // соседних объектов и останавливается точно у них, как и обычная перетаскиваемая точка.\n',
            '      let result = candidateAt(1);\n',
            '      if (!result) {\n',
            '        let lo = 0, hi = 1, loResult = null;\n',
            '        for (let iter = 0; iter < 20; iter++) {\n',
            '          const mid = (lo + hi) / 2;\n',
            '          const cand = candidateAt(mid);\n',
            '          if (cand) { lo = mid; loResult = cand; } else { hi = mid; }\n',
            '        }\n',
            '        result = loResult;\n',
            '      }\n',
            '      if (!result) return false; // даже минимальный сдвиг недопустим — фигура остаётся на месте\n',
            '      vertex.pos.x = result.v.x; vertex.pos.y = result.v.y;\n',
            '      p1.pos.x = result.q1.x; p1.pos.y = result.q1.y;\n',
            '      p2.pos.x = result.q2.x; p2.pos.y = result.q2.y;\n',
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
            '        if (gcShouldUpdate(c)) {\n',
            '          c.__liveColor = c.colorExpr ? evaluate(c.colorExpr) : c.color;\n',
            '          c.__liveThickness = c.thicknessExpr ? evaluate(c.thicknessExpr) : c.thickness;\n',
            '          if (c.radiusExpr) {\n',
            '            const rv = evaluate(c.radiusExpr);\n',
            '            if (typeof rv === \'number\' && isFinite(rv)) c._radius = Math.abs(rv);\n',
            '          }\n',
            '        }\n',
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
            '      gcPublishTick();\n',
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
            '            color: a.color || null, colorExpr: a.colorExpr, thickness: a.thickness || 2, thicknessExpr: a.thicknessExpr,\n',
            '            updateMode: a.updateMode || \'always\', updateInterval: a.updateInterval,\n',
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
            '          name: a.name, type: \'CenterRadius\', centerPoint, fromPoint, toPoint, radiusNum, radiusPoint, radiusExpr: a.radiusExpr,\n',
            '          color: a.color || null, colorExpr: a.colorExpr, thickness: a.thickness || 2, thicknessExpr: a.thicknessExpr,\n',
            '          updateMode: a.updateMode || \'always\', updateInterval: a.updateInterval,\n',
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
            '          color: e.color || null, colorExpr: e.colorExpr, thickness: e.thickness || 2, thicknessExpr: e.thicknessExpr,\n',
            '          updateMode: e.updateMode || \'always\', updateInterval: e.updateInterval,\n',
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
            '          a: cv.a, aExpr: cv.aExpr, b: cv.b, bExpr: cv.bExpr, radius: cv.radius, radiusExpr: cv.radiusExpr,\n',
            '          turns: (cv.turns === undefined || cv.turns === null) ? 3 : cv.turns, turnsExpr: cv.turnsExpr,\n',
            '          segments: cv.segments || 50,\n',
            '          color: cv.color || null, colorExpr: cv.colorExpr, thickness: cv.thickness || 2, thicknessExpr: cv.thicknessExpr,\n',
            '          updateMode: cv.updateMode || \'always\', updateInterval: cv.updateInterval,\n',
            '          active: cv.active !== false, activeExpr: cv.activeExpr,\n',
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
            '        color: d.color || null, colorExpr: d.colorExpr, thickness: d.thickness || 2,\n',
            '        grid: d.grid || false, gridStep: d.gridStep || 1,\n',
            '        active: d.active !== false,\n',
            '        layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 20,\n',
            '        extend: !!d.extend, extendDistance: d.extendDistance, mode: d.mode || \'manual\',\n',
            '        updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval,\n',
            '      }));\n',
            '    }\n',
            '\n',
            '    function initDrawSurfaces() {\n',
            '      drawSurfaces = drawSurfacesData.map(d => ({\n',
            '        name: d.name, funcName: d.funcName,\n',
            '        xmin: d.xmin, xmax: d.xmax, ymin: d.ymin, ymax: d.ymax, grid: Math.max(2, d.grid || 20),\n',
            '        mode: d.mode || \'contour\', color: d.color || null, colorExpr: d.colorExpr, angle: (d.angle === undefined || d.angle === null) ? 30 : d.angle,\n',
            '        updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval,\n',
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
            '          opacityExpr: d.opacityExpr, updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval,\n',
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
            // Копируем объект целиком, а поверх — нормализованные значения. Раньше здесь был
            // ручной список полей, и всё, чего в нём нет, до рантайма не доезжало: именно
            // поэтому anchor/posPoint/fieldWidth не работали, хотя компилятор их разбирал.
            // Остальные элементы (см. initDrawFields) давно копируются через spread —
            // приводим гистограмму к тому же виду, чтобы грабли не повторились с новыми полями.
            '      drawHistograms = drawHistogramsData.map(d => ({\n',
            '        ...d,\n',
            '        bins: Math.max(1, d.bins || 10),\n',
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
            // Вершины фигуры — из pointNames (их парсер собирает и из точек, и из концов
            // отрезков). Раньше здесь брались только элементы-ТОЧКИ, и фигура, заданная
            // сторонами (elements = (ab, bc, cd, da)), молча отбрасывалась целиком.
            '        const names = (f.pointNames && f.pointNames.length) ? f.pointNames : f.elements;\n',
            '        const pts = names.map(name => points.find(p => p.name === name)).filter(p => p !== undefined);\n',
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
            '      if (c.rotateExpr && gcShouldUpdate(c)) {\n',
            '        const rv = evaluate(c.rotateExpr);\n',
            '        if (typeof rv === \'number\' && isFinite(rv)) c.rotate = rv;\n',
            '      }\n',
            // Как и у фигур: форма навязывается только при реальном изменении поворота/центра.
            // Иначе (в т.ч. у кластеров-вкладок, которые вообще не вращаются) — пересохраняется
            // из текущих позиций, чтобы не откатывать перемещения точек из Update.
            '      const sig = [c.rotate || 0, c.center.x, c.center.y].join(\'|\');\n',
            '      if (c.__appliedSig !== undefined && c.__appliedSig === sig) { rebaseClusterShape(c); return; }\n',
            '      const angleRad = (c.rotate || 0) * Math.PI / 180;\n',
            '      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);\n',
            '      for (let i = 0; i < c.points.length; i++) {\n',
            '        const p = c.points[i];\n',
            '        if (!p || !p.pos) continue;\n',
            '        const rel = c.relVectors[i];\n',
            '        p.pos.x = c.center.x + (rel.x * cos - rel.y * sin);\n',
            '        p.pos.y = c.center.y + (rel.x * sin + rel.y * cos);\n',
            '      }\n',
            '      c.__appliedSig = [c.rotate || 0, c.center.x, c.center.y].join(\'|\');\n',
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
            '      c.__appliedSig = [c.rotate || 0, c.center.x, c.center.y].join(\'|\');\n',
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
            '      // Раньше кластер мог включать только точки/линии/фигуры/окружности/дуги/эллипсы/\n',
            '      // кривые — любое другое имя в elements = (...) молча отбрасывалось (в частности,\n',
            '      // UI-контролы и все визуализации draw Xxx). Теперь резолвер ищет элемент по имени\n',
            '      // среди буквально всех типов объектов сцены, поэтому кластер можно использовать\n',
            '      // как "страницу" — кнопку/слайдер/текст/график/распределение и т.п. вместе с точками,\n',
            '      // и прятать всё разом через cluster.active (см. isObjectActive).\n',
            '      const clusterSearchPools = [\n',
            '        points, lines, figures, circles, arcs, ellipses, curves,\n',
            '        uiData, drawTexts, drawFunctions, drawSurfaces, drawImages, drawHistograms,\n',
            '        drawFields, drawTrajectories, drawGraphs, drawFractals, drawFormulas, drawDistributions,\n',
            '        drawLoci, drawTraces, drawRegions, drawCharts, drawTrees, drawTables, drawComplexes,\n',
            '        drawHyperbolics, drawBifurcations, drawCobwebs, drawIFSs, drawAutomata, drawVoronois,\n',
            '        drawFouriers, drawDiagrams, drawVectors, drawInfLines, drawEqually, drawAngles,\n',
            '        drawPunctirs, drawFillings,\n',
            '      ];\n',
            '      function findByNameInPools(name) {\n',
            '        for (const pool of clusterSearchPools) {\n',
            '          if (!pool) continue;\n',
            '          const found = pool.find(o => o && o.name === name);\n',
            '          if (found) return found;\n',
            '        }\n',
            '        return undefined;\n',
            '      }\n',
            '      clusters = clustersData.map(c => {\n',
            '        const elements = c.elements.map(name => findByNameInPools(name)).filter(el => el !== undefined);\n',
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
            '          rotateExpr: c.rotateExpr,\n',
            '          updateMode: c.updateMode || \'always\', updateInterval: c.updateInterval,\n',
            '          interact: c.interact !== undefined ? c.interact : true,\n',
            '          active: c.active !== undefined ? c.active : true,\n',
            '          step: (c.step !== undefined && c.step !== null) ? c.step : undefined,\n',
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
            '          arccolor: d.arccolor || null,\n',
            '          arccolorExpr: d.arccolorExpr,\n',
            '          measurecolor: d.measurecolor || null,\n',
            '          measurecolorExpr: d.measurecolorExpr,\n',
            '          radius: d.radius || 1,\n',
            '          radiusExpr: d.radiusExpr,\n',
            '          updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval,\n',
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
            '          color: d.color || null,\n',
            '          colorExpr: d.colorExpr,\n',
            '          updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval,\n',
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
            '          color: d.color || null,\n',
            '          colorExpr: d.colorExpr,\n',
            '          length: d.length || 12,\n',
            '          lengthExpr: d.lengthExpr,\n',
            '          thickness: d.thickness || line.thickness || 2,\n',
            '          thicknessExpr: d.thicknessExpr,\n',
            '          updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval,\n',
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
            '          colorExpr: d.colorExpr,\n',
            '          thickness: d.thickness || null,\n',
            '          thicknessExpr: d.thicknessExpr,\n',
            '          updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval,\n',
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
            '          return { name: d.name, kind: \'halfplane\', line: ln, sidePoint: sidePt, color: d.color || null, colorExpr: d.colorExpr, mode: d.mode || \'full\', layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, opacity: (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity, opacityExpr: d.opacityExpr, updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval, active: true };\n',
            '        }\n',
            '        if (d.arc) {\n',
            '          const arcObj = arcs.find(a => a.name === d.arc);\n',
            '          if (!arcObj) return null;\n',
            '          const pseudoCircle = {\n',
            '            get center() { return { x: arcObj.centerPoint.pos.x, y: arcObj.centerPoint.pos.y }; },\n',
            '            get radius() { return arcObj.radiusNum !== null ? arcObj.radiusNum : (arcObj.radiusPoint ? Math.hypot(arcObj.radiusPoint.pos.x - arcObj.centerPoint.pos.x, arcObj.radiusPoint.pos.y - arcObj.centerPoint.pos.y) : 0); },\n',
            '          };\n',
            '          return { name: d.name, kind: \'circleSector\', circle: pseudoCircle, fromPoint: arcObj.fromPoint, toPoint: arcObj.toPoint, shape: d.shape || \'sector\', color: d.color || null, colorExpr: d.colorExpr, layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, opacity: (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity, opacityExpr: d.opacityExpr, updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval, active: true };\n',
            '        }\n',
            '        if (d.circle) {\n',
            '          const c = circles.find(cc => cc.name === d.circle);\n',
            '          const fromPt = points.find(p => p.name === d.from);\n',
            '          const toPt = points.find(p => p.name === d.to);\n',
            '          if (!c || !fromPt || !toPt) return null;\n',
            '          return { name: d.name, kind: \'circleSector\', circle: c, fromPoint: fromPt, toPoint: toPt, shape: d.shape || \'sector\', color: d.color || null, colorExpr: d.colorExpr, layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, opacity: (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity, opacityExpr: d.opacityExpr, updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval, active: true };\n',
            '        }\n',
            '        if (d.func) {\n',
            '          // Площадь под графиком (func2 не задан — нижняя граница это ось X, y=0)\n',
            '          // либо между двумя графиками (func и func2) на общем участке x.\n',
            '          const g1 = drawFunctions.find(g => g.name === d.func);\n',
            '          if (!g1) return null;\n',
            '          const g2 = d.func2 ? drawFunctions.find(g => g.name === d.func2) : null;\n',
            '          if (d.func2 && !g2) return null;\n',
            '          const xmin = (d.funcXmin !== undefined && d.funcXmin !== null) ? d.funcXmin : g1.xmin;\n',
            '          const xmax = (d.funcXmax !== undefined && d.funcXmax !== null) ? d.funcXmax : g1.xmax;\n',
            '          const segments = Math.max(2, (d.funcSegments !== undefined && d.funcSegments !== null) ? d.funcSegments : (g1.segments || 100));\n',
            '          return { name: d.name, kind: \'funcArea\', graph: g1, graph2: g2, xmin: xmin, xmax: xmax, segments: segments, color: d.color || null, colorExpr: d.colorExpr, layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30, opacity: (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity, opacityExpr: d.opacityExpr, updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval, active: true };\n',
            '        }\n',
            '        const fig = figures.find(f => f.name === d.figure);\n',
            '        if (!fig) return null;\n',
            '        return {\n',
            '          name: d.name,\n',
            '          kind: \'polygon\',\n',
            '          figure: fig,\n',
            '          color: d.color || null,\n',
            '          colorExpr: d.colorExpr,\n',
            '          mode: d.mode || \'full\',\n',
            '          layer: (d.layer !== undefined && d.layer !== null) ? d.layer : 30,\n',
            '          opacity: (d.opacity === undefined || d.opacity === null) ? 0.5 : d.opacity,\n',
            '          opacityExpr: d.opacityExpr,\n',
            '          updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval,\n',
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
            '          colorExpr: d.colorExpr,\n',
            '          thickness: d.thickness || null,\n',
            '          thicknessExpr: d.thicknessExpr,\n',
            '          updateMode: d.updateMode || \'always\', updateInterval: d.updateInterval,\n',
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
            // Жёсткая форма фигуры навязывается точкам ТОЛЬКО когда реально изменились параметры
            // преобразования (rotate/size/flip/центр — через код или перетаскивание фигуры целиком).
            // Иначе форма пересохраняется из текущих позиций: раньше функция вызывалась каждый
            // кадр после Update и откатывала любые перемещения вершин из кода (A.pos.x = ...) —
            // перетаскивание мышью форму пересохраняло, а изменения из Update бесследно терялись.
            '    function gcFigureSig(fig) {\n',
            '      return [fig.rotate, fig.size, fig.sizeX, fig.sizeY, fig.flipX, fig.flipY, fig.center && fig.center.x, fig.center && fig.center.y].join(\'|\');\n',
            '    }\n',
            '    function applyFigureTransform(fig) {\n',
            '      if (!fig || !fig.points || !fig.relVectors || fig.points.length !== fig.relVectors.length) return;\n',
            '      if (fig.__appliedSig !== undefined && fig.__appliedSig === gcFigureSig(fig)) { rebaseFigureShape(fig); return; }\n',
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
            '      fig.__appliedSig = gcFigureSig(fig);\n',
            '    }\n',
            '\n',
            '    function rebaseFigureShape(fig) {\n',
            '        if (!fig.points || fig.points.length === 0) return;\n',
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
            '        fig.relVectors = fig.relVectors || [];\n',
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
            '        fig.__appliedSig = gcFigureSig(fig);\n',
            '    }\n',
            '    function updateFiguresForPoint(pointIndex) {\n',
            '      const pt = points[pointIndex];\n',
            '      if (!pt) return;\n',
            '      for (let fig of figures) {\n',
            '        if (!fig.points.includes(pt)) continue;\n',
            '        rebaseFigureShape(fig);\n',
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
            // ---- Закрепление элемента: в пространстве сцены или на экране ----
            // fieldToPixel учитывает камеру (зум и панорамирование), поэтому объект,
            // построенный через неё, живёт В ПРОСТРАНСТВЕ. fieldToPixelScreen — та же самая
            // формула, но с камерой в нейтральном положении: объект остаётся на месте
            // относительно холста, что бы ни делал пользователь. Раньше выбор между этими
            // режимами был зашит в каждый элемент намертво (гистограмма считала свой
            // прямоугольник прямо в пикселях, все остальные — через fieldToPixel), и
            // переключить его было нельзя. Теперь режим задаётся полем anchor, а элементы
            // берут преобразование через gcAnchorToPixel и одинаково поддерживают оба.
            '    function fieldToPixelScreen(fx, fy) {\n',
            '      if (isNaN(fx) || isNaN(fy)) return { x: 0, y: 0 };\n',
            '      const s = gcScreenScale();\n',
            '      if (s <= 0) return { x: 0, y: 0 };\n',
            '      return { x: width / 2 + fx * s, y: height / 2 - fy * s };\n',
            '    }\n',
            '    function gcScreenScale() {\n',
            '      const usableWidth = width - 2 * EDGE_MARGIN;\n',
            '      const usableHeight = height - 2 * EDGE_MARGIN;\n',
            '      return Math.min(usableWidth / FIELD_WIDTH, usableHeight / FIELD_HEIGHT);\n',
            '    }\n',
            '    function gcAnchorToPixel(d) { return (d && d.anchor === \'screen\') ? fieldToPixelScreen : fieldToPixel; }\n',
            // Обратное преобразование нужно для интерактивности: перетаскивание работает в
            // пиксельных координатах курсора, а элемент, закреплённый на экране (anchor =
            // screen), хранит данные в своей собственной системе координат, не в мировых
            // полевых. pixelToField тут даст неверный результат при любом зуме/панорамировании.
            '    function gcAnchorPixelToField(d) {\n',
            '      if (d && d.anchor === \'screen\') {\n',
            '        return function(px, py) {\n',
            '          const s = gcScreenScale();\n',
            '          if (!(s > 0)) return { x: 0, y: 0 };\n',
            '          return { x: (px - width / 2) / s, y: (height / 2 - py) / s };\n',
            '        };\n',
            '      }\n',
            '      return pixelToField;\n',
            '    }\n',
            '    function gcAnchorScale(d) { return (d && d.anchor === \'screen\') ? gcScreenScale() : fieldScale(); }\n',
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
            '    // collider — сама перетаскиваемая точка. Он нужен, потому что привязка и столкновения\n',
            '    // раньше боролись друг с другом: computeSnap возвращал координаты чужой точки РОВНО,\n',
            '    // то есть расстояние 0, а resolveCollision немедленно отталкивал точку обратно на сумму\n',
            '    // радиусов. Каждый кадр повторял этот цикл, и точка либо дрожала, либо оказывалась не\n',
            '    // там, где её отпустили. Теперь, если совпадение запрещено столкновением, привязка\n',
            '    // происходит не в центр чужой точки, а на ближайшее ДОПУСТИМОЕ место — на окружность\n',
            '    // радиуса gcPairSep вокруг неё, со стороны курсора. Результат устойчив: коллизия эту\n',
            '    // позицию уже не двигает, притяжение сохраняется, точка встаёт предсказуемо.\n',
            '    function gcSnapOntoPointAllowed(collider, other) {\n',
            '      if (!collider) return true;\n',
            '      if (collider.collision === false || other.collision === false) return true;\n',
            '      if (collider.collideWithPoints === false || other.collideWithPoints === false) return true;\n',
            '      return !canCollideWith(collider, other);\n',
            '    }\n',
            '    function computeSnap(fieldPos, excludePoints, collider) {\n',
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
            '        if (gcSnapOntoPointAllowed(collider, bestPoint)) {\n',
            '          return { x: bestPoint.pos.x, y: bestPoint.pos.y };\n',
            '        }\n',
            '        const sep = gcPairSep(collider, bestPoint) + (collider.collisionMargin || 0) + (bestPoint.collisionMargin || 0);\n',
            '        let dx = fieldPos.x - bestPoint.pos.x, dy = fieldPos.y - bestPoint.pos.y;\n',
            '        const dlen = Math.hypot(dx, dy);\n',
            '        // Курсор ровно в центре чужой точки — направление выталкивания неопределено;\n',
            '        // берём вправо, чтобы поведение было детерминированным, а не случайным.\n',
            '        if (dlen < 1e-9) { dx = 1; dy = 0; }\n',
            '        else { dx /= dlen; dy /= dlen; }\n',
            '        return { x: bestPoint.pos.x + dx * sep, y: bestPoint.pos.y + dy * sep };\n',
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
            '      // Сетка применяется к тем осям, которые НЕ притянулись к чужой точке. Раньше при\n',
            '      // срабатывании выравнивания хотя бы по одной оси функция выходила сразу, и вторая\n',
            '      // ось оставалась "сырой" — точка выравнивалась по x, но по y висела где попало.\n',
            '      if (SNAP_GRID_STEP > 0) {\n',
            '        if (!bestX) {\n',
            '          const gx = Math.round(fieldPos.x / SNAP_GRID_STEP) * SNAP_GRID_STEP;\n',
            '          if (Math.abs(gx - fieldPos.x) < threshold) x = gx;\n',
            '        }\n',
            '        if (!bestY) {\n',
            '          const gy = Math.round(fieldPos.y / SNAP_GRID_STEP) * SNAP_GRID_STEP;\n',
            '          if (Math.abs(gy - fieldPos.y) < threshold) y = gy;\n',
            '        }\n',
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
            '    function pushAwayFrom(pos, obstaclePoint, minDist, hintDir) {\n',
            '      const dx = pos.x - obstaclePoint.x, dy = pos.y - obstaclePoint.y;\n',
            '      const len = Math.hypot(dx, dy);\n',
            '      if (len >= minDist) return pos;\n',
            // Вырожденный случай (точка ровно на препятствии) раньше всегда выталкивал по +X.
            // Для отрезка это худший из возможных вариантов: направление никак не связано с
            // геометрией, точка уезжает вдоль линии, на следующей итерации ближайшая точка
            // отрезка пересчитывается — и она снова оказывается на нём. Отсюда дрожание.
            // Теперь вызывающий может передать предпочтительное направление (для отрезка —
            // его нормаль), и выталкивание происходит поперёк препятствия, то есть сразу
            // выводит точку из контакта.
            '      if (len < 1e-6) {\n',
            '        let ux = 1, uy = 0;\n',
            '        if (hintDir) { const hl = Math.hypot(hintDir.x, hintDir.y); if (hl > 1e-9) { ux = hintDir.x / hl; uy = hintDir.y / hl; } }\n',
            '        return { x: obstaclePoint.x + ux * minDist, y: obstaclePoint.y + uy * minDist };\n',
            '      }\n',
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
            // Невидимая точка (например, из неактивной вкладки-кластера) не должна быть
            // невидимой преградой. Вычисляемые точки (transform/construct) тоже не
            // расталкиваются: их положение пересчитывается из других точек — часто как раз
            // из перетаскиваемой, — и выталкивание от них давало дрожание при касании.
            '            if (!isObjectActive(other) || other.transform || other.construct) continue;\n',
            '            if (other.collision === false || other.collideWithPoints === false) continue;\n',
            '            if (!canCollideWith(p, other)) continue;\n',
            '            pos = pushAwayFrom(pos, other.pos, gcPairSep(p, other) + margin + (other.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithLines) {\n',
            '          for (let l of lines) {\n',
            '            if (l.collision === false) continue;\n',
            '            if (!canCollideWith(p, l)) continue;\n',
            // Отрезок не должен отталкивать точки, которые сам же им и задан: у фигур такое
            // исключение есть (f.points.includes(p)), а у линий его не было. Из-за этого
            // конец отрезка постоянно «сталкивался» сам с собой — расстояние до отрезка
            // равно нулю, выталкивание срабатывало каждый кадр, и точка дёргалась. Тот же
            // эффект ловила точка, лежащая НА отрезке у самого края: стоило укоротить
            // отрезок, как она оказывалась вплотную к нему и попадала в ту же петлю.
            '            if (l.pA === p || l.pB === p) continue;\n',
            '            const c = closestPointOnSegment(pos, l.pA.pos, l.pB.pos);\n',
            '            const sx = l.pB.pos.x - l.pA.pos.x, sy = l.pB.pos.y - l.pA.pos.y;\n',
            '            pos = pushAwayFrom(pos, c, gcPointRadiusField(p) + margin + (l.collisionMargin || 0), { x: -sy, y: sx });\n',
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
            '            if (c) pos = pushAwayFrom(pos, c, gcPointRadiusField(p) + margin + (cv.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithCircles) {\n',
            '          for (let c of circles) {\n',
            '            if (c.collision === false || !c.center) continue;\n',
            '            if (!canCollideWith(p, c)) continue;\n',
            '            const cc = closestPointOnCircleBoundary(pos, c.center, c.radius);\n',
            '            pos = pushAwayFrom(pos, cc, gcPointRadiusField(p) + margin + (c.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithEllipses) {\n',
            '          for (let e of ellipses) {\n',
            '            if (e.collision === false) continue;\n',
            '            if (!canCollideWith(p, e)) continue;\n',
            '            const cc = closestPointOnEllipseBoundary(pos, e);\n',
            '            if (cc) pos = pushAwayFrom(pos, cc, gcPointRadiusField(p) + margin + (e.collisionMargin || 0));\n',
            '          }\n',
            '        }\n',
            '        if (p.collideWithArcs) {\n',
            '          for (let a of arcs) {\n',
            '            if (a.collision === false) continue;\n',
            '            if (!canCollideWith(p, a)) continue;\n',
            '            const cc = closestPointOnArcBoundary(pos, a);\n',
            '            if (cc) pos = pushAwayFrom(pos, cc, gcPointRadiusField(p) + margin + (a.collisionMargin || 0));\n',
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
            '            if (cc) pos = pushAwayFrom(pos, cc, gcPointRadiusField(p) + margin + (f.collisionMargin || 0));\n',
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
            '            if (cc) pos = pushAwayFrom(pos, cc, gcPointRadiusField(p) + margin + (c.collisionMargin || 0));\n',
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
            '      if (gcShouldUpdate(drawObj)) {\n',
            '        drawObj.__liveArcColor = drawObj.arccolorExpr ? evaluate(drawObj.arccolorExpr) : drawObj.arccolor;\n',
            '        drawObj.__liveMeasureColor = drawObj.measurecolorExpr ? evaluate(drawObj.measurecolorExpr) : drawObj.measurecolor;\n',
            '        if (drawObj.radiusExpr) {\n',
            '          const rv = evaluate(drawObj.radiusExpr);\n',
            '          if (typeof rv === \'number\' && isFinite(rv)) drawObj.radius = Math.abs(rv);\n',
            '        }\n',
            '      }\n',
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
            // Прямой угол — всегда ОДИН квадратик, независимо от count: все прямые углы и так
            // равны, «двойная» отметка (для групп равных углов) им не нужна.
            '        const arcCount = isRightAngle ? 1 : Math.min(3, Math.max(1, drawObj.count || 1));\n',
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
            '          ctx.strokeStyle = drawObj.__liveArcColor || __gcDefaultColor();\n',
            '          if (k === 0) { ctx.save(); ctx.lineTo(vPix.x, vPix.y); ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.globalAlpha *= 0.16; ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.moveTo(pA.x, pA.y); ctx.lineTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.lineTo(pB.x, pB.y); }\n',
            '          ctx.lineWidth = 1.6; ctx.lineJoin = \'round\';\n',
            '          ctx.stroke();\n',
            '        } else {\n',
            '          ctx.beginPath();\n',
            '          ctx.strokeStyle = drawObj.__liveArcColor || __gcDefaultColor();\n',
            '          if (k === 0) { ctx.save(); ctx.moveTo(vPix.x, vPix.y); ctx.arc(vPix.x, vPix.y, rK, start, end, ccw); ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.globalAlpha *= 0.16; ctx.fill(); ctx.restore(); ctx.beginPath(); }\n',
            '          ctx.arc(vPix.x, vPix.y, rK, start, end, ccw);\n',
            '          ctx.lineWidth = 1.6;\n',
            '          ctx.stroke();\n',
            '        }\n',
            '        }\n',
            '      }\n',
            '      if (drawObj.measure) {\n',
            // Середина дуги — через её размах по модулю 2π. Раньше бралось (start + end) / 2,
            // и когда дуга пересекала направление ±π (atan2 «перескакивает»), подпись
            // уезжала на противоположную сторону угла.
            '        const sweep = (((end - start) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);\n',
            '        let midAngle = start + sweep / 2;\n',
            '        if (drawObj.side !== 1) midAngle += Math.PI;\n',
            '        midAngle = ((midAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);\n',
            '        const textRadius = arcRadius * 1.2;\n',
            '        const tx = vPix.x + textRadius * Math.cos(midAngle);\n',
            '        const ty = vPix.y + textRadius * Math.sin(midAngle);\n',
            '        if (!drawObj.fractions) measureVal = Math.round(measureVal);\n',
            '        else measureVal = parseFloat(measureVal.toFixed(2));\n',
            '        ctx.fillStyle = drawObj.__liveMeasureColor || __gcDefaultColor();\n',
            '        ctx.font = \'500 13px \' + GC_FONT;\n',
            '        ctx.textAlign = \'center\';\n',
            '        ctx.textBaseline = \'middle\';\n',
            '        __gcHaloText(measureVal + "°", tx, ty);\n',
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
            '      ctx.strokeStyle = circle.__liveColor || circle.color || __gcDefaultColor();\n',
            '      ctx.lineWidth = circle.__liveThickness || circle.thickness || 1.5;\n',
            '      ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function drawArc(a) {\n',
            '      if (!a || !a.centerPoint) return;\n',
            '      if (gcShouldUpdate(a)) {\n',
            '        a.__liveColor = a.colorExpr ? evaluate(a.colorExpr) : a.color;\n',
            '        a.__liveThickness = a.thicknessExpr ? evaluate(a.thicknessExpr) : a.thickness;\n',
            '        if (a.radiusExpr) {\n',
            '          const rv = evaluate(a.radiusExpr);\n',
            '          if (typeof rv === \'number\' && isFinite(rv)) a.radiusNum = Math.abs(rv);\n',
            '        }\n',
            '      }\n',
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
            '      ctx.strokeStyle = a.__liveColor || __gcDefaultColor();\n',
            '      ctx.lineWidth = a.__liveThickness || 2;\n',
            '      ctx.lineCap = \'round\';\n',
            '      ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function drawEllipse(e) {\n',
            '      if (!e || !e.centerPoint) return;\n',
            '      if (gcShouldUpdate(e)) {\n',
            '        e.__liveColor = e.colorExpr ? evaluate(e.colorExpr) : e.color;\n',
            '        e.__liveThickness = e.thicknessExpr ? evaluate(e.thicknessExpr) : e.thickness;\n',
            '      }\n',
            '      const centerPix = fieldToPixel(e.centerPoint.pos.x, e.centerPoint.pos.y);\n',
            '      const scale = fieldScale();\n',
            '      const rx = Math.abs(e.a) * scale, ry = Math.abs(e.b) * scale;\n',
            '      if (!(rx > 0) || !(ry > 0)) return;\n',
            '      const rotRad = -(e.rotate || 0) * Math.PI / 180;\n',
            '      ctx.beginPath();\n',
            '      ctx.ellipse(centerPix.x, centerPix.y, rx, ry, rotRad, 0, 2 * Math.PI);\n',
            '      ctx.strokeStyle = e.__liveColor || __gcDefaultColor();\n',
            '      ctx.lineWidth = e.__liveThickness || 2;\n',
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
            '        const liveTurns = (curve.__liveTurns !== undefined) ? curve.__liveTurns : curve.turns;\n',
            '        const theta = t * (liveTurns || 3) * 2 * Math.PI;\n',
            '        if (curve.type === \'spiral\') {\n',
            '          const liveA = (curve.__liveA !== undefined) ? curve.__liveA : curve.a;\n',
            '          const liveB = (curve.__liveB !== undefined) ? curve.__liveB : curve.b;\n',
            '          const r = (liveA || 0) + (liveB === undefined || liveB === null ? 1 : liveB) * theta;\n',
            '          return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };\n',
            '        }\n',
            '        const liveRadius = (curve.__liveRadius !== undefined) ? curve.__liveRadius : curve.radius;\n',
            '        const R = liveRadius === undefined || liveRadius === null ? 2 : liveRadius;\n',
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
            '      if (gcShouldUpdate(cv)) {\n',
            '        cv.__liveColor = cv.colorExpr ? evaluate(cv.colorExpr) : cv.color;\n',
            '        cv.__liveThickness = cv.thicknessExpr ? evaluate(cv.thicknessExpr) : cv.thickness;\n',
            '        if (cv.aExpr) { const v = evaluate(cv.aExpr); if (typeof v === \'number\' && isFinite(v)) cv.__liveA = v; }\n',
            '        if (cv.bExpr) { const v = evaluate(cv.bExpr); if (typeof v === \'number\' && isFinite(v)) cv.__liveB = v; }\n',
            '        if (cv.radiusExpr) { const v = evaluate(cv.radiusExpr); if (typeof v === \'number\' && isFinite(v)) cv.__liveRadius = Math.abs(v); }\n',
            '        if (cv.turnsExpr) { const v = evaluate(cv.turnsExpr); if (typeof v === \'number\' && isFinite(v)) cv.__liveTurns = v; }\n',
            '      }\n',
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
            '      ctx.strokeStyle = cv.__liveColor || __gcDefaultColor();\n',
            '      ctx.lineWidth = cv.__liveThickness || 2;\n',
            '      ctx.lineCap = \'round\';\n',
            '      ctx.stroke();\n',
            '    }\n',
            '\n',
            '    function niceGridStep(targetFieldStep) {\n',
            '      if (!(targetFieldStep > 0)) return GRID_STEP_BASE;\n',
            '      const mag = Math.pow(10, Math.floor(Math.log10(targetFieldStep)));\n',
            '      const residual = targetFieldStep / mag;\n',
            '      let niceMult;\n',
            '      if (residual < 1.5) niceMult = 1; else if (residual < 3.5) niceMult = 2; else if (residual < 7.5) niceMult = 5; else niceMult = 10;\n',
            '      return niceMult * mag;\n',
            '    }\n',
            '    // Шаг сетки/осей подстраивается так, чтобы между линиями было ~48px, а не\n',
            '    // жёстко фиксированное число единиц поля — иначе при отдалении линии сливаются\n',
            '    // в кашу, а при приближении почти пропадают. Отключается через grid adaptive = false.\n',
            '    function currentGridStep() {\n',
            '      if (!GRID_ADAPTIVE) return GRID_STEP_BASE;\n',
            '      const scale = fieldScale();\n',
            '      if (!(scale > 0)) return GRID_STEP_BASE;\n',
            '      return niceGridStep(48 / scale);\n',
            '    }\n',
            // Сетка и оси в стиле Desmos/GeoGebra: крупная сетка + мелкая (1/5 или 1/4
            // крупного шага), оси со стрелками и подписями x/y, числа на осях с «ореолом»;
            // если ось ушла за край, числа прижимаются к краю поля, а не пропадают.
            '    function __gcMinorDiv(step) {\n',
            '      const m = step / Math.pow(10, Math.floor(Math.log10(step) + 1e-9));\n',
            '      return Math.abs(m - 2) < 0.01 ? 4 : 5;\n',
            '    }\n',
            '    function __gcFmtTick(v, decimals) {\n',
            '      let t = String(parseFloat(v.toFixed(decimals)));\n',
            '      if (window.__gcDecSep === \',\') t = t.replace(\'.\', \',\');\n',
            '      return t.charAt(0) === \'-\' ? \'−\' + t.slice(1) : t;\n',
            '    }\n',
            '    function __gcGridAxes(step, o) {\n',
            '      const th = __gcTheme();\n',
            '      const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '      const xMin = Math.min(tl.x, br.x), xMax = Math.max(tl.x, br.x);\n',
            '      const yMin = Math.min(tl.y, br.y), yMax = Math.max(tl.y, br.y);\n',
            '      if (!(step > 0)) return;\n',
            '      const scale = fieldScale();\n',
            '      if ((xMax - xMin) / step > 600 || (yMax - yMin) / step > 600) return;\n',
            '      ctx.save();\n',
            '      ctx.lineCap = \'butt\'; ctx.setLineDash([]);\n',
            '      const vline = (x, y0, y1) => { const p1 = fieldToPixel(x, y0), p2 = fieldToPixel(x, y1); const X = Math.round(p1.x) + 0.5; ctx.moveTo(X, p1.y); ctx.lineTo(X, p2.y); };\n',
            '      const hline = (y, x0, x1) => { const p1 = fieldToPixel(x0, y), p2 = fieldToPixel(x1, y); const Y = Math.round(p1.y) + 0.5; ctx.moveTo(p1.x, Y); ctx.lineTo(p2.x, Y); };\n',
            '      if (o.gridX || o.gridY) {\n',
            '        const div = __gcMinorDiv(step), ms = step / div;\n',
            '        // вспомогательная сетка — только если её клетка заметна на экране (на телефоне реже)\n',
            '        if (!o.gridColor && ms * scale * gcCssK >= (gcCssK < 1 ? 14 : 9)) {\n',
            '          ctx.strokeStyle = th.gridMinor; ctx.lineWidth = 1; ctx.beginPath();\n',
            '          if (o.gridX) for (let i = Math.ceil(xMin / ms); i * ms <= xMax; i++) { if (i % div) vline(i * ms, yMin, yMax); }\n',
            '          if (o.gridY) for (let i = Math.ceil(yMin / ms); i * ms <= yMax; i++) { if (i % div) hline(i * ms, xMin, xMax); }\n',
            '          ctx.stroke();\n',
            '        }\n',
            '        ctx.strokeStyle = o.gridColor || th.gridMajor; ctx.lineWidth = 1; ctx.beginPath();\n',
            '        if (o.gridX) for (let i = Math.ceil(xMin / step); i * step <= xMax; i++) vline(i * step, yMin, yMax);\n',
            '        if (o.gridY) for (let i = Math.ceil(yMin / step); i * step <= yMax; i++) hline(i * step, xMin, xMax);\n',
            '        ctx.stroke();\n',
            '      }\n',
            '      if (!o.axisX && !o.axisY) { ctx.restore(); return; }\n',
            '      const axisCol = o.axesColor || th.axis;\n',
            '      const O = fieldToPixel(0, 0);\n',
            '      const oy = Math.round(O.y) + 0.5, ox = Math.round(O.x) + 0.5;\n',
            '      ctx.strokeStyle = axisCol; ctx.fillStyle = axisCol; ctx.lineWidth = 1.5;\n',
            '      const AH = 9, AW = 4.5;\n',
            '      ctx.beginPath();\n',
            '      if (o.axisX && oy >= 0 && oy <= height) { ctx.moveTo(0, oy); ctx.lineTo(width - 2, oy); }\n',
            '      if (o.axisY && ox >= 0 && ox <= width) { ctx.moveTo(ox, height); ctx.lineTo(ox, 2); }\n',
            '      ctx.stroke();\n',
            '      ctx.beginPath();\n',
            '      if (o.axisX && oy >= 0 && oy <= height) { ctx.moveTo(width - 1, oy); ctx.lineTo(width - 1 - AH, oy - AW); ctx.lineTo(width - 1 - AH * 0.7, oy); ctx.lineTo(width - 1 - AH, oy + AW); ctx.closePath(); }\n',
            '      if (o.axisY && ox >= 0 && ox <= width) { ctx.moveTo(ox, 1); ctx.lineTo(ox - AW, 1 + AH); ctx.lineTo(ox, 1 + AH * 0.7); ctx.lineTo(ox + AW, 1 + AH); ctx.closePath(); }\n',
            '      ctx.fill();\n',
            '      ctx.fillStyle = o.axesColor || th.axisText;\n',
            '      const FS = 11.5;\n',
            '      ctx.font = \'500 \' + FS + \'px \' + GC_FONT;\n',
            '      const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9) + 1);\n',
            '      if (o.axisX) {\n',
            '        let ly = oy + 5, base = \'top\';\n',
            '        if (ly > height - FS - 4) { ly = height - 4; base = \'bottom\'; }\n',
            '        if (ly < 4) ly = 4;\n',
            '        ctx.textAlign = \'center\'; ctx.textBaseline = base;\n',
            '        for (let i = Math.ceil(xMin / step); i * step <= xMax; i++) {\n',
            '          if (i === 0) continue;\n',
            '          const x = i * step, p = fieldToPixel(x, 0);\n',
            '          const t = __gcFmtTick(x, decimals), w = ctx.measureText(t).width;\n',
            '          if (p.x - w / 2 < 3 || p.x + w / 2 > width - 3 - (Math.abs(ly - oy) < 20 ? 14 : 0)) continue;\n',
            '          __gcHaloText(t, p.x, ly);\n',
            '        }\n',
            '      }\n',
            '      if (o.axisY) {\n',
            '        ctx.textBaseline = \'middle\';\n',
            '        let lx = ox - 6, align = \'right\';\n',
            '        if (lx < 28) { lx = Math.max(ox, 0) + 6; align = \'left\'; }\n',
            '        if (lx > width - 4) { lx = width - 6; align = \'right\'; }\n',
            '        ctx.textAlign = align;\n',
            '        for (let i = Math.ceil(yMin / step); i * step <= yMax; i++) {\n',
            '          if (i === 0) continue;\n',
            '          const y = i * step, p = fieldToPixel(0, y);\n',
            '          if (p.y < FS + (Math.abs(lx - ox) < 30 ? 12 : 2) || p.y > height - FS) continue;\n',
            '          __gcHaloText(__gcFmtTick(y, decimals), lx, p.y);\n',
            '        }\n',
            '      }\n',
            '      if (o.axisX && o.axisY && O.x > 10 && O.x < width - 10 && O.y > 10 && O.y < height - 10) {\n',
            '        ctx.textAlign = \'right\'; ctx.textBaseline = \'top\';\n',
            '        __gcHaloText(\'0\', ox - 5, oy + 5);\n',
            '      }\n',
            '      ctx.fillStyle = o.axesColor || th.axis;\n',
            '      ctx.font = \'italic 600 14px \' + GC_FONT;\n',
            '      if (o.axisX && oy >= 0 && oy <= height) { ctx.textAlign = \'right\'; ctx.textBaseline = (oy > height - 24) ? \'bottom\' : \'top\'; __gcHaloText(\'x\', width - 6, ctx.textBaseline === \'top\' ? oy + 8 : oy - 8); }\n',
            '      if (o.axisY && ox >= 0 && ox <= width) { ctx.textBaseline = \'top\'; ctx.textAlign = (ox > width - 24) ? \'right\' : \'left\'; __gcHaloText(\'y\', ctx.textAlign === \'left\' ? ox + 9 : ox - 9, 3); }\n',
            '      ctx.restore();\n',
            '    }\n',
            '    function drawSceneGridAxes() {\n',
            '      __gcGridAxes(currentGridStep(), { gridX: SHOW_GRID_X, gridY: SHOW_GRID_Y, axisX: SHOW_AXIS_X, axisY: SHOW_AXIS_Y, gridColor: GRID_COLOR, axesColor: AXES_COLOR });\n',
            '      ctx.save();\n',
            '      if (SHOW_BOUNDARY) {\n',
            '        // Прямоугольник границы поля (FIELD_WIDTH x FIELD_HEIGHT вокруг начала координат) —\n',
            '        // та самая область, за которую точки не могут выйти (см. clampFieldPoint) — теперь\n',
            '        // можно сделать видимой вместо того, чтобы полагаться на невидимую стену.\n',
            '        const b1 = fieldToPixel(-FIELD_WIDTH / 2, -FIELD_HEIGHT / 2);\n',
            '        const b2 = fieldToPixel(FIELD_WIDTH / 2, FIELD_HEIGHT / 2);\n',
            '        ctx.strokeStyle = BOUNDARY_COLOR || __gcDefaultColor(); ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);\n',
            '        if (!BOUNDARY_COLOR) ctx.globalAlpha = 0.6;\n',
            '        ctx.strokeRect(Math.min(b1.x, b2.x), Math.min(b1.y, b2.y), Math.abs(b2.x - b1.x), Math.abs(b2.y - b1.y));\n',
            '        ctx.setLineDash([]); ctx.globalAlpha = 1;\n',
            '      }\n',
            '      ctx.restore();\n',
            '    }\n',
            '    function drawAxesGrid(step) {\n',
            '      if (window.coordinateSystem === \'polar\') drawPolarGrid(step); else drawCartesianGrid(step);\n',
            '    }\n',
            '    function glClampGridStep(step, span, maxLines) {\n',
            '      if (!(step > 0)) return 1;\n',
            '      if (span / step > maxLines) return span / maxLines;\n',
            '      return step;\n',
            '    }\n',
            '    function drawCartesianGrid(step) {\n',
            '      if (!(step > 0)) step = 1;\n',
            '      const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '      step = glClampGridStep(step, Math.max(Math.abs(br.x - tl.x), Math.abs(br.y - tl.y)), 400);\n',
            '      __gcGridAxes(step, { gridX: true, gridY: true, axisX: true, axisY: true });\n',
            '    }\n',
            '    function drawPolarGrid(step) {\n',
            '      const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '      const xMin = Math.min(tl.x, br.x), xMax = Math.max(tl.x, br.x);\n',
            '      const yMin = Math.min(tl.y, br.y), yMax = Math.max(tl.y, br.y);\n',
            '      const maxR = Math.max(Math.abs(xMin), Math.abs(xMax), Math.abs(yMin), Math.abs(yMax));\n',
            '      if (!(step > 0)) step = 1;\n',
            '      step = glClampGridStep(step, maxR, 200);\n',
            '      ctx.save();\n',
            '      ctx.strokeStyle = __gcTheme().gridMajor; ctx.lineWidth = 1;\n',
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
            '      ctx.strokeStyle = __gcTheme().axis; ctx.lineWidth = 1.5;\n',
            '      ctx.beginPath();\n',
            '      const ax1 = fieldToPixel(xMin, 0), ax2 = fieldToPixel(xMax, 0);\n',
            '      ctx.moveTo(ax1.x, ax1.y); ctx.lineTo(ax2.x, ax2.y);\n',
            '      const ay1 = fieldToPixel(0, yMin), ay2 = fieldToPixel(0, yMax);\n',
            '      ctx.moveTo(ay1.x, ay1.y); ctx.lineTo(ay2.x, ay2.y);\n',
            '      ctx.stroke();\n',
            '      ctx.fillStyle = __gcTheme().axisText; ctx.font = \'10px \' + GC_FONT;\n',
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
            '      // update = always/event/once (+ interval) гейтит только пересчёт точек (дорогая\n',
            '      // часть — вызов пользовательской функции на каждый сэмпл); при "не обновлять\n',
            '      // сейчас" переиспользуем d.__cachedPts вместо повторного сэмплирования.\n',
            '      if (gcShouldUpdate(d) || !d.__cachedPts) {\n',
            '      let gxmin = d.xmin, gxmax = d.xmax;\n',
            '      let segCount = d.segments;\n',
            '      if (d.mode === \'auto\') {\n',
            '        // Диапазон — ровно текущая видимая по X часть камеры (без запаса, в отличие от\n',
            '        // extend), а число сэмплов подгоняется под ширину холста в пикселях, так что\n',
            '        // детализация растёт при приближении и падает при отдалении сама по себе.\n',
            '        const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '        gxmin = Math.min(tl.x, br.x); gxmax = Math.max(tl.x, br.x);\n',
            '        segCount = Math.max(20, Math.min(2000, Math.round(width / 2)));\n',
            '      } else if (d.extend) {\n',
            '        const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '        const vxmin = Math.min(tl.x, br.x), vxmax = Math.max(tl.x, br.x);\n',
            '        const margin = (typeof d.extendDistance === \'number\') ? d.extendDistance : (vxmax - vxmin) * 0.2;\n',
            '        gxmin = vxmin - margin; gxmax = vxmax + margin;\n',
            '      }\n',
            '      // не реже сэмпла на полтора пикселя видимой части — без «ломаной» на крутых участках\n',
            '      if (d.mode !== \'auto\') {\n',
            '        const tl0 = pixelToField(0, 0), br0 = pixelToField(width, height);\n',
            '        const vis = Math.max(1e-9, Math.abs(br0.x - tl0.x));\n',
            '        segCount = Math.max(segCount, Math.min(4000, Math.round((width / 1.5) * (gxmax - gxmin) / vis)));\n',
            '      }\n',
            '      const pts = [];\n',
            '      for (let i = 0; i <= segCount; i++) {\n',
            '        const x = gxmin + (gxmax - gxmin) * i / segCount;\n',
            '        let y;\n',
            '        try { y = glCallUserFunc(d.funcName, [x]); } catch (e) { y = NaN; }\n',
            '        pts.push((typeof y === \'number\' && isFinite(y)) ? { x, y } : null);\n',
            '      }\n',
            '      // Устранимые особенности (например sin(x)/x в x=0, где предел существует, но\n',
            '      // наивное вычисление даёт 0/0=NaN ровно в точке сэмпла) раньше рвали график —\n',
            '      // видимый пропуск в один сэмпл шириной, обычно ровно посередине, если диапазон\n',
            '      // симметричен. Одиночные/парные NaN-сэмплы, у которых по обе стороны есть\n',
            '      // конечные соседи в пределах пары шагов, заполняем линейной интерполяцией —\n',
            '      // это лечит устранимые особенности, не трогая настоящие асимптоты/разрывы\n',
            '      // (у них NaN тянется на много сэмплов подряд, и здесь не найдётся близкого\n',
            '      // конечного соседа с обеих сторон).\n',
            '      const __gcMaxGapFill = 2;\n',
            '      for (let i = 0; i < pts.length; i++) {\n',
            '        if (pts[i] !== null) continue;\n',
            '        let j = i;\n',
            '        while (j < pts.length && pts[j] === null) j++;\n',
            '        const gapLen = j - i;\n',
            '        if (gapLen > __gcMaxGapFill || i === 0 || j >= pts.length) { i = j - 1; continue; }\n',
            '        const left = pts[i - 1], right = pts[j];\n',
            '        for (let k = i; k < j; k++) {\n',
            '          const t = (k - (i - 1)) / (j - (i - 1));\n',
            '          const xk = gxmin + (gxmax - gxmin) * k / segCount;\n',
            '          pts[k] = { x: xk, y: left.y + (right.y - left.y) * t };\n',
            '        }\n',
            '        i = j - 1;\n',
            '      }\n',
            // Разрывы (tan x, 1/x, floor x): между соседними сэмплами с большим скачком
            // делим шаг пополам несколько раз; если скачок не уменьшается — это разрыв,
            // и график в этом месте не соединяется вертикальной «стенкой».
            '      const __gcJump = 30 / Math.max(1e-9, fieldScale());\n',
            '      const __gcF = (x) => { try { const v = glCallUserFunc(d.funcName, [x]); return (typeof v === \'number\' && isFinite(v)) ? v : NaN; } catch (e) { return NaN; } };\n',
            '      for (let i = 1; i < pts.length; i++) {\n',
            '        const a = pts[i - 1], b = pts[i];\n',
            '        if (!a || !b || Math.abs(b.y - a.y) < __gcJump) continue;\n',
            '        let xa = a.x, ya = a.y, xb = b.x, yb = b.y; const j0 = Math.abs(yb - ya);\n',
            '        for (let k = 0; k < 10; k++) {\n',
            '          const xm = (xa + xb) / 2, ym = __gcF(xm);\n',
            '          if (!isFinite(ym)) break;\n',
            '          if (Math.abs(ym - ya) > Math.abs(yb - ym)) { xb = xm; yb = ym; } else { xa = xm; ya = ym; }\n',
            '        }\n',
            '        if (Math.abs(yb - ya) > j0 * 0.5) {\n',
            '          b.brk = true;\n',
            '          // ветви у разрыва доводятся до края видимой области: сгущаем сэмплы к асимптоте\n',
            '          const pre = [], post = [];\n',
            '          for (let k = 1; k <= 14; k++) {\n',
            '            const xl = xa - (xa - a.x) / Math.pow(2, k), yl = __gcF(xl);\n',
            '            if (isFinite(yl)) pre.push({ x: xl, y: yl });\n',
            '            const xr = xb + (b.x - xb) / Math.pow(2, k), yr = __gcF(xr);\n',
            '            if (isFinite(yr)) post.unshift({ x: xr, y: yr });\n',
            '          }\n',
            '          if (isFinite(ya)) pre.push({ x: xa, y: ya });\n',
            '          if (isFinite(yb)) post.unshift({ x: xb, y: yb });\n',
            '          b.pre = pre; b.post = post;\n',
            '        }\n',
            '      }\n',
            '      d.__cachedPts = pts;\n',
            '      }\n',
            '      const pts = d.__cachedPts;\n',
            '      ctx.strokeStyle = d.color || __gcTheme().curve;\n',
            '      ctx.lineWidth = d.thickness || 2.5;\n',
            '      ctx.lineJoin = \'round\';\n',
            '      ctx.lineCap = \'round\';\n',
            '      ctx.beginPath();\n',
            '      let started = false;\n',
            '      let prevPix = null;\n',
            '      for (let p of pts) {\n',
            '        if (!p) { started = false; prevPix = null; continue; }\n',
            '        const pix = fieldToPixel(p.x, p.y);\n',
            '        // разрыв на асимптоте: скачок больше трёх высот экрана между соседними сэмплами\n',
            '        if (p.brk && started && p.pre) for (const q of p.pre) { const qp = fieldToPixel(q.x, q.y); ctx.lineTo(qp.x, Math.max(-height * 4, Math.min(height * 5, qp.y))); }\n',
            '        if (p.brk || (prevPix && Math.abs(pix.y - prevPix.y) > height * 3)) started = false;\n',
            '        if (p.brk && p.post && p.post.length) { const q0 = fieldToPixel(p.post[0].x, p.post[0].y); ctx.moveTo(q0.x, Math.max(-height * 4, Math.min(height * 5, q0.y))); started = true; for (const q of p.post.slice(1)) { const qp = fieldToPixel(q.x, q.y); ctx.lineTo(qp.x, Math.max(-height * 4, Math.min(height * 5, qp.y))); } }\n',
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
            '      if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '      ctx.strokeStyle = d.__liveColor || __gcDefaultColor();\n',
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
            '      const rgb = hexToRgbSurface(d.color || __gcDefaultColor());\n',
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
            '      if (gcShouldUpdate(d)) {\n',
            '        const ov = d.opacityExpr ? evaluate(d.opacityExpr) : d.opacity;\n',
            '        d.__liveOpacity = (typeof ov === \'number\' && isFinite(ov)) ? ov : d.opacity;\n',
            '      }\n',
            '      ctx.save();\n',
            '      ctx.globalAlpha = Math.max(0, Math.min(1, d.__liveOpacity === undefined ? d.opacity : d.__liveOpacity));\n',
            '      ctx.drawImage(d.img, center.x - wPix / 2, center.y - hPix / 2, wPix, hPix);\n',
            '      ctx.restore();\n',
            '    }\n',
            '\n',
            '// Если данные (для draw Chart/Table/Histogram/Tree) в итоге оказались строкой, а не\n',
            '// массивом — например, значение пришло из переменной, которой Start/Update присвоили\n',
            '// текст вида "[1,2,3]" — даём ещё одну попытку: пробуем вычислить содержимое строки\n',
            '// как выражение. Компиляционный разбор уже страхует самый частый случай (data = "[...]"\n',
            '// прямо в блоке — см. captureQuotableExprField), это — защита на рантайм-случай.\n',
            'function glCoerceArrayData(raw) {\n',
            '    if (Array.isArray(raw)) return raw;\n',
            '    if (typeof raw === \'string\') {\n',
            '        try { const re = evaluate(raw); if (Array.isArray(re)) return re; } catch (e) {}\n',
            '    }\n',
            '    return raw;\n',
            '}\n',
            '    function drawHistogram(d) {\n',
            '      let data;\n',
            '      try { data = glCoerceArrayData(evaluate(d.dataExpr)); } catch (e) { return; }\n',
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
            // Прямоугольник гистограммы. Раньше он считался ТОЛЬКО в пикселях холста
            // (20, height-20, 40% ширины, 30% высоты), из-за чего гистограмма висела в углу
            // экрана и не реагировала ни на зум, ни на панорамирование, — в 3D-сцене это
            // выглядело как приклеенная к камере панель. Теперь при anchor = world (значение
            // по умолчанию, когда задан pos) прямоугольник задаётся в координатах поля и
            // ведёт себя как обычный объект сцены; прежнее поведение остаётся при
            // anchor = screen и как запасной вариант, если pos не задан.
            '      let chartX, chartBottom, chartW, chartH;\n',
            '      if (d.anchor === \'world\' && d.posPoint) {\n',
            '        const toPix = gcAnchorToPixel(d);\n',
            '        const sc = gcAnchorScale(d);\n',
            '        const origin = toPix(d.posPoint.x, d.posPoint.y);\n',
            '        chartW = (d.fieldWidth || 8) * sc;\n',
            '        chartH = (d.fieldHeight || 5) * sc;\n',
            '        chartX = origin.x;\n',
            '        chartBottom = origin.y;\n',
            '      } else {\n',
            '        chartX = 20; chartBottom = height - 20; chartW = width * 0.4; chartH = height * 0.3;\n',
            '      }\n',
            '      const barW = chartW / bins;\n',
            '      if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '      ctx.save();\n',
            '      ctx.fillStyle = d.__liveColor || \'#4a90d9\';\n',
            '      for (let i = 0; i < bins; i++) {\n',
            '        const barH = (counts[i] / maxCount) * chartH;\n',
            '        ctx.fillRect(chartX + i * barW, chartBottom - barH, Math.max(1, barW - 1), barH);\n',
            '      }\n',
            '      ctx.strokeStyle = \'#333333\'; ctx.lineWidth = 1;\n',
            '      ctx.strokeRect(chartX, chartBottom - chartH, chartW, chartH);\n',
            '      ctx.fillStyle = \'#333333\'; ctx.font = \'10px \' + GC_FONT; ctx.textAlign = \'left\'; ctx.textBaseline = \'top\';\n',
            '      ctx.fillText(dmin.toFixed(2) + \' .. \' + dmax.toFixed(2) + \'  (n=\' + data.length + \')\', chartX, chartBottom + 2);\n',
            '      ctx.restore();\n',
            '    }\n',
            '\n',
            '    function drawField(d) {\n',
            '      if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '      const nGrid = Math.max(1, d.grid || 15);\n',
            '      const stepX = (d.xmax - d.xmin) / nGrid, stepY = (d.ymax - d.ymin) / nGrid;\n',
            '      const cellSize = Math.min(Math.abs(stepX), Math.abs(stepY));\n',
            '      ctx.save();\n',
            '      ctx.strokeStyle = d.__liveColor || \'#888888\'; ctx.lineWidth = 1;\n',
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
            '      if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; d.__liveThickness = d.thicknessExpr ? evaluate(d.thicknessExpr) : d.thickness; }\n',
            '      ctx.save();\n',
            '      ctx.strokeStyle = d.__liveColor || \'#ff0000\'; ctx.lineWidth = d.__liveThickness || 2; ctx.lineCap = \'round\';\n',
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
            '// Вычисляет centerRe/centerIm/scale заново каждый кадр, если задано как выражение\n',
            '// (например, переменная слайдера) — иначе просто возвращает статичное значение,\n',
            '// вычисленное один раз при компиляции. Ошибка вычисления — тихий откат к нему же.\n',
            'function evalFractalNum(expr, fallback) {\n',
            '    if (!expr) return fallback;\n',
            '    try { const v = evaluate(expr); return (typeof v === \'number\' && isFinite(v)) ? v : fallback; }\n',
            '    catch (e) { return fallback; }\n',
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
            '    // Окно комплексной плоскости = собственная база фрактала (centerRe/centerIm/scale —\n',
            '    // как и раньше, поддерживают live-выражения через переменную/слайдер) + текущее\n',
            '    // состояние ОБЩЕЙ камеры сцены (camera.zoom/offsetX/offsetY), применяемое поверх как\n',
            '    // пропорциональный зум/пан — точно тот же ввод (колесо мыши, перетаскивание фона),\n',
            '    // что двигает всё остальное на сцене, и та же граница глубины зума (camera zoom\n',
            '    // limits), а не отдельная, никак не связанная со сценой система. Базовые centerRe/\n',
            '    // centerIm/scale по-прежнему определяют, что видно при camera.zoom=1 (без панорамирования) —\n',
            '    // дефолты (-0.5, 0, 1.5) показывают всё множество целиком.\n',
            '    let baseScale = evalFractalNum(d.scaleExpr, d.scale);\n',
            '    if (!(baseScale > 0)) baseScale = 1.5; // только явно некорректное (0/отрицательное/NaN) — не искусственный "пол" на приближение\n',
            '    const aspect = w / h;\n',
            '    const baseCenterRe = evalFractalNum(d.centerReExpr, d.centerRe);\n',
            '    const baseCenterIm = evalFractalNum(d.centerImExpr, d.centerIm);\n',
            '    // Пан общей камеры выражается в её собственных полевых единицах (обычно ~FIELD_WIDTH) —\n',
            '    // пересчитываем в долю от видимого поля и применяем ту же долю к окну фрактала, чтобы\n',
            '    // одно и то же перетаскивание сдвигало фрактал на ту же ДОЛЮ его окна, что и всё\n',
            '    // остальное на сцене на долю своего поля (независимо от масштаба фрактала).\n',
            // Окно фрактала = образ ВИДИМОГО прямоугольника поля под ФИКСИРОВАННЫМ аффинным
            // отображением "поле -> комплексная плоскость". Раньше зум применялся как
            // scale = baseScale / camera.zoom, то есть окно сжималось вокруг собственного
            // базового центра фрактала, а пан пересчитывался отдельно через долю поля. Такая
            // композиция не воспроизводила привязку к курсору: колесо мыши уводило картинку
            // к центру поля, хотя вся остальная сцена честно приближалась к указателю.
            // Теперь достаточно взять углы видимой области (pixelToField уже учитывает и зум,
            // и пан, и привязку к курсору) и перевести их тем же самым коэффициентом — привязка
            // наследуется автоматически. Коэффициент один на обе оси, иначе картинка растянется:
            // pixelToField масштабирует X и Y одинаково, поэтому видимый прямоугольник и так
            // имеет пропорции холста.
            '    const k = (FIELD_WIDTH > 0) ? (baseScale * aspect / (FIELD_WIDTH / 2)) : 1;\n',
            '    const visTL = pixelToField(0, 0);\n',
            '    const visBR = pixelToField(width, height);\n',
            '    const tl = { x: baseCenterRe + visTL.x * k, y: baseCenterIm + visTL.y * k };\n',
            '    const br = { x: baseCenterRe + visBR.x * k, y: baseCenterIm + visBR.y * k };\n',
            '    const centerRe = (tl.x + br.x) / 2, centerIm = (tl.y + br.y) / 2;\n',
            // scale ниже нужен только для адаптивного числа итераций — берём его из
            // фактического размера окна, а не из camera.zoom.
            '    const scale = Math.max(1e-15, Math.abs(br.x - tl.x) / 2 / aspect);\n',
            '    // maxIter из поля — это МИНИМУМ (при adaptiveIter !== false). Чем глубже зум (включая\n',
            '    // зум общей камеры сцены), тем больше итераций нужно, чтобы у границы множества\n',
            '    // проявлялась структура, а не сплошная заливка "внутри/снаружи": на каждое удвоение\n',
            '    // приближения (log2(1.5/scale), где scale уже учитывает camera.zoom) добавляем ~60\n',
            '    // итераций — стандартная для рендеров Мандельброта эвристика. Верхний потолок (20000) —\n',
            '    // не ограничение на ПРИБЛИЖЕНИЕ (глубина зума ограничена только camera zoom limits),\n',
            '    // а просто защита от случайного зависания вкладки на нереалистичном числе итераций на пиксель.\n',
            '    const baseIter = Math.max(5, Math.floor(d.maxIter || 80));\n',
            '    let maxIter = baseIter;\n',
            '    if (d.adaptiveIter !== false && scale < 1.5) {\n',
            '        const depth = Math.log2(1.5 / scale);\n',
            '        maxIter = Math.min(20000, Math.max(baseIter, Math.round(baseIter + depth * 60)));\n',
            '    }\n',
            '    const periodicityCheck = d.periodicityCheck !== false;\n',
            '    const key = [d.type, cRe.toFixed(6), cIm.toFixed(6), maxIter, periodicityCheck, d.palette, w, h, centerRe, centerIm, scale].join(\'|\');\n',
            '    if (!d._cache || d._cacheKey !== key) {\n',
            '        const off = document.createElement(\'canvas\'); off.width = w; off.height = h;\n',
            '        const octx = off.getContext(\'2d\');\n',
            '        const imgData = octx.createImageData(w, h);\n',
            '        const data = imgData.data;\n',
            '        for (let py = 0; py < h; py++) {\n',
            '            const y0 = tl.y + (br.y - tl.y) * (py + 0.5) / h;\n',
            '            for (let px = 0; px < w; px++) {\n',
            '                const x0 = tl.x + (br.x - tl.x) * (px + 0.5) / w;\n',
            '                let zx, zy, cx, cy;\n',
            '                if (d.type === \'julia\') { zx = x0; zy = y0; cx = cRe; cy = cIm; }\n',
            '                else { zx = 0; zy = 0; cx = x0; cy = y0; }\n',
            '                let iter = 0;\n',
            '                // Periodicity checking (Brent-style): периодически запоминаем текущую z\n',
            '                // ("checkX/checkY"), и если z совпадает с ней снова — орбита зациклилась,\n',
            '                // точка точно принадлежит множеству, дальше можно не считать. Интервал\n',
            '                // проверки удваивается — тот же классический приём, что в GNU MPFR/большинстве\n',
            '                // Mandelbrot-рендеров, почти не влияет на скорость снаружи и радикально\n',
            '                // ускоряет закрашенные внутренние области при большом adaptive maxIter.\n',
            '                let checkX = zx, checkY = zy, checkPeriod = 0, checkLimit = 8, periodic = false;\n',
            '                while (iter < maxIter && zx * zx + zy * zy <= 4) {\n',
            '                    let nx, ny;\n',
            '                    if (d.type === \'burningship\') {\n',
            '                        const ax = Math.abs(zx), ay = Math.abs(zy);\n',
            '                        nx = ax * ax - ay * ay + cx; ny = 2 * ax * ay + cy;\n',
            '                    } else {\n',
            '                        nx = zx * zx - zy * zy + cx; ny = 2 * zx * zy + cy;\n',
            '                    }\n',
            '                    zx = nx; zy = ny; iter++;\n',
            '                    if (periodicityCheck) {\n',
            '                        if (zx === checkX && zy === checkY) { periodic = true; break; }\n',
            '                        checkPeriod++;\n',
            '                        if (checkPeriod >= checkLimit) { checkPeriod = 0; checkLimit *= 2; checkX = zx; checkY = zy; }\n',
            '                    }\n',
            '                }\n',
            '                const idx = (py * w + px) * 4;\n',
            '                if (periodic || iter >= maxIter) { data[idx] = 0; data[idx + 1] = 0; data[idx + 2] = 0; data[idx + 3] = 255; }\n',
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
            // draw Region { op = "=" } — неявная кривая f(x, y) = level: marching squares по
            // видимой области (≈4 px на клетку), точки пересечения рёбер — линейной
            // интерполяцией. Смена знака через полюс (tan, 1/x) отсеивается проверкой
            // значения в найденной точке. Отрезки кэшируются, пока не сдвинулся вид или f.
            '    function drawImplicitCurve(d) {\n',
            '        const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '        const N = Math.max(40, Math.min(240, Math.round(width / 4))), M = Math.max(30, Math.round(N * height / Math.max(1, width)));\n',
            '        const fp = [];\n',
            '        for (let a = 1; a <= 4; a++) for (let b = 1; b <= 4; b++) { try { fp.push(Number(glCallUserFunc(d.funcName, [tl.x + (br.x - tl.x) * (a / 5 + 0.013), tl.y + (br.y - tl.y) * (b / 5 + 0.017)])).toFixed(6)); } catch (e) { fp.push(\'x\'); } }\n',
            '        const key = [d.funcName, d.level, N, M, tl.x.toFixed(5), tl.y.toFixed(5), br.x.toFixed(5), br.y.toFixed(5), glUserFuncVersion, fp.join(\',\')].join(\'|\');\n',
            '        if (d._curveKey !== key) {\n',
            '            const lv = d.level || 0;\n',
            '            const F = (x, y) => { try { const v = glCallUserFunc(d.funcName, [x, y]); return (typeof v === \'number\') ? v - lv : NaN; } catch (e) { return NaN; } };\n',
            '            const X = i => tl.x + (br.x - tl.x) * i / N, Y = j => tl.y + (br.y - tl.y) * j / M;\n',
            '            const G = new Float64Array((N + 1) * (M + 1));\n',
            '            for (let j = 0; j <= M; j++) for (let i = 0; i <= N; i++) G[j * (N + 1) + i] = F(X(i), Y(j));\n',
            '            const segs = [];\n',
            '            const cross = (x1, y1, v1, x2, y2, v2) => {\n',
            '                if (!isFinite(v1) || !isFinite(v2) || (v1 > 0) === (v2 > 0)) return null;\n',
            '                let ta = 0, tb = 1, fa = v1, fb = v2;\n',
            '                for (let k = 0; k < 6; k++) {\n',
            '                    const tm = (ta + tb) / 2, fm = F(x1 + (x2 - x1) * tm, y1 + (y2 - y1) * tm);\n',
            '                    if (!isFinite(fm)) return null;\n',
            '                    if ((fm > 0) === (fa > 0)) { ta = tm; fa = fm; } else { tb = tm; fb = fm; }\n',
            '                }\n',
            // у корня значения на концах сжавшегося отрезка падают, у полюса — растут
            '                if (Math.abs(fa) + Math.abs(fb) > 0.3 * (Math.abs(v1) + Math.abs(v2))) return null;\n',
            '                const t = ta + (tb - ta) * fa / (fa - fb), x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;\n',
            '                return [x, y];\n',
            '            };\n',
            '            for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {\n',
            '                const a = G[j * (N + 1) + i], b = G[j * (N + 1) + i + 1], c = G[(j + 1) * (N + 1) + i + 1], e = G[(j + 1) * (N + 1) + i];\n',
            '                if (!(isFinite(a) && isFinite(b) && isFinite(c) && isFinite(e))) continue;\n',
            '                if ((a > 0) === (b > 0) && (b > 0) === (c > 0) && (c > 0) === (e > 0)) continue;\n',
            '                const x0 = X(i), x1 = X(i + 1), y0 = Y(j), y1 = Y(j + 1);\n',
            '                const pts = [cross(x0, y0, a, x1, y0, b), cross(x1, y0, b, x1, y1, c), cross(x1, y1, c, x0, y1, e), cross(x0, y1, e, x0, y0, a)].filter(Boolean);\n',
            '                if (pts.length === 2) segs.push(pts[0][0], pts[0][1], pts[1][0], pts[1][1]);\n',
            '                else if (pts.length === 4) {\n',
            '                    const mid = F((x0 + x1) / 2, (y0 + y1) / 2);\n',
            '                    if ((mid > 0) === (a > 0)) { segs.push(pts[0][0], pts[0][1], pts[3][0], pts[3][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1]); }\n',
            '                    else { segs.push(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); }\n',
            '                }\n',
            '            }\n',
            '            d._curveSegs = segs; d._curveKey = key;\n',
            '        }\n',
            '        const segs = d._curveSegs || [];\n',
            '        ctx.save();\n',
            '        ctx.strokeStyle = d.__liveColor || __gcTheme().curve;\n',
            '        ctx.lineWidth = d.thickness || 2.5; ctx.lineCap = \'round\'; ctx.lineJoin = \'round\';\n',
            '        ctx.beginPath();\n',
            '        for (let k = 0; k < segs.length; k += 4) { const p1 = fieldToPixel(segs[k], segs[k + 1]), p2 = fieldToPixel(segs[k + 2], segs[k + 3]); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); }\n',
            '        ctx.stroke();\n',
            '        ctx.restore();\n',
            '    }\n',
            '    function drawRegion(d) {\n',
            '        if (!GL_USER_FUNCS[d.funcName]) return;\n',
            '        if (d.op === \'=\') { if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; } drawImplicitCurve(d); return; }\n',

            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '        const q = Math.max(1, Math.floor(d.quality || 3));\n',
            '        const w = Math.max(2, Math.floor(width / q)), h = Math.max(2, Math.floor(height / q));\n',
            '        const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            // «Отпечаток» функций — их значения в 25 точках: f может зависеть от переменных
            // сцены (точек, ползунков), и без него кэш заливки не замечал изменений, а граница
            // пересчитывалась в каждом кадре (8 тыс. вызовов f).
            '        const fp = [];\n',
            '        for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) {\n',
            '            const sx0 = tl.x + (br.x - tl.x) * (a / 6 + 0.013), sy0 = tl.y + (br.y - tl.y) * (b / 6 + 0.017);\n',
            '            try { fp.push(Number(glCallUserFunc(d.funcName, [sx0, sy0])).toFixed(6)); if (d.func2Name && GL_USER_FUNCS[d.func2Name]) fp.push(Number(glCallUserFunc(d.func2Name, [sx0, sy0])).toFixed(6)); } catch (e) { fp.push(\'x\'); }\n',
            '        }\n',
            '        const key = [d.funcName, d.op, d.level, d.func2Name, d.op2, d.level2, d.combine, w, h,\n',
            '            tl.x.toFixed(5), tl.y.toFixed(5), br.x.toFixed(5), br.y.toFixed(5), d.__liveColor, glUserFuncVersion, fp.join(\',\')].join(\'|\');\n',
            '        if (!d._cache || d._cacheKey !== key) {\n',
            '            const off = document.createElement(\'canvas\');\n',
            '            off.width = w; off.height = h;\n',
            '            const octx = off.getContext(\'2d\');\n',
            '            const img = octx.createImageData(w, h);\n',
            '            const data = img.data;\n',
            '            const rgb = hexToRgbSurface(d.__liveColor || \'#4a90d9\');\n',
            '            const has2 = !!(d.func2Name && GL_USER_FUNCS[d.func2Name]);\n',
            '            const okAt = function (px, py) {\n',
            '                const fx = tl.x + (br.x - tl.x) * (px + 0.5) / w;\n',
            '                const fy = tl.y + (br.y - tl.y) * (py + 0.5) / h;\n',
            '                try {\n',
            '                    let ok = glRegionTest(d.op, glCallUserFunc(d.funcName, [fx, fy]), d.level);\n',
            '                    if (has2) {\n',
            '                        const ok2 = glRegionTest(d.op2, glCallUserFunc(d.func2Name, [fx, fy]), d.level2);\n',
            '                        ok = (d.combine === \'or\') ? (ok || ok2) : (ok && ok2);\n',
            '                    }\n',
            '                    return !!ok;\n',
            '                } catch (e) { return false; }\n',
            '            };\n',
            '            const put = function (px, py) {\n',
            '                const i4 = (py * w + px) * 4;\n',
            '                data[i4] = rgb.r; data[i4 + 1] = rgb.g; data[i4 + 2] = rgb.b; data[i4 + 3] = 255;\n',
            '            };\n',
            '            // f вызывается интерпретатором, и опрос каждой клетки (десятки тысяч вызовов) при\n',
            '            // перетаскивании точек, от которых зависит f, давал кадры по 200 мс. Поэтому сначала\n',
            '            // считаем f только в углах блоков BS×BS: если все четыре угла согласны, блок заливается\n',
            '            // (или пропускается) целиком, и поклеточно пересчитываются лишь блоки на границе\n',
            '            // области. Цена — детали мельче блока (BS·quality px) могут пропасть.\n',
            '            const BS = 4;\n',
            '            const bw = Math.ceil((w - 1) / BS), bh = Math.ceil((h - 1) / BS);\n',
            '            const cornerOk = new Uint8Array((bw + 1) * (bh + 1));\n',
            '            for (let j = 0; j <= bh; j++) for (let i = 0; i <= bw; i++) cornerOk[j * (bw + 1) + i] = okAt(Math.min(i * BS, w - 1), Math.min(j * BS, h - 1)) ? 1 : 0;\n',
            '            for (let j = 0; j < bh; j++) {\n',
            '                for (let i = 0; i < bw; i++) {\n',
            '                    const c = cornerOk[j * (bw + 1) + i] + cornerOk[j * (bw + 1) + i + 1] + cornerOk[(j + 1) * (bw + 1) + i] + cornerOk[(j + 1) * (bw + 1) + i + 1];\n',
            '                    if (c === 0) continue;\n',
            '                    const x0 = i * BS, y0 = j * BS;\n',
            '                    // последний блок в ряду/столбце доходит до крайней клетки включительно\n',
            '                    const xe = (i === bw - 1) ? w - 1 : x0 + BS - 1, ye = (j === bh - 1) ? h - 1 : y0 + BS - 1;\n',
            '                    for (let py = y0; py <= ye; py++) for (let px = x0; px <= xe; px++) {\n',
            '                        if (c === 4 || okAt(px, py)) put(px, py);\n',
            '                    }\n',
            '                }\n',
            '            }\n',
            '            octx.putImageData(img, 0, 0);\n',
            '            d._cache = off; d._cacheKey = key;\n',
            '        }\n',
            '        ctx.save();\n',
            '        const liveOp = d.opacityExpr ? evaluate(d.opacityExpr) : d.opacity;\n',
            '        ctx.globalAlpha = Math.max(0, Math.min(1, (typeof liveOp === \'number\' && isFinite(liveOp)) ? liveOp : (d.opacity === undefined ? 0.35 : d.opacity)));\n',
            '        ctx.imageSmoothingEnabled = false;\n',
            '        ctx.drawImage(d._cache, 0, 0, width, height);\n',
            '        ctx.restore();\n',
            '        // граница области — изолиния f = level\n',
            '        if (d.border && d._borderKey === key && d._border) {\n',
            '            drawSurfaceContour({ color: d.color, level: d.level, levels: 1 }, d._border.xs, d._border.ys, d._border.Z, d.level - 1, d.level + 1);\n',
            '        } else if (d.border) {\n',
            '            const gridN = 90;\n',
            '            const xs = [], ys = [];\n',
            '            for (let i = 0; i <= gridN; i++) {\n',
            '                xs.push(tl.x + (br.x - tl.x) * i / gridN);\n',
            '                ys.push(tl.y + (br.y - tl.y) * i / gridN);\n',
            '            }\n',
            '            // Как и заливка: точные значения f — в узлах крупной сетки (шаг CS) и внутри блоков,\n',
            '            // где f − level меняет знак (там проходит изолиния); в остальных блоках — билинейная\n',
            '            // интерполяция, знак которой совпадает со знаком углов. 91×91 точных вызовов на\n',
            '            // каждый сдвиг точки были главной частью кадра.\n',
            '            const fAt = function (i, j) { let v; try { v = glCallUserFunc(d.funcName, [xs[i], ys[j]]); } catch (e) { v = NaN; } return v; };\n',
            '            const CS = 5;\n',
            '            const Z = [];\n',
            '            for (let j = 0; j <= gridN; j++) Z.push(new Array(gridN + 1).fill(undefined));\n',
            '            for (let j = 0; j <= gridN; j += CS) for (let i = 0; i <= gridN; i += CS) Z[j][i] = fAt(i, j);\n',
            '            for (let j0 = 0; j0 < gridN; j0 += CS) {\n',
            '                const j1 = Math.min(j0 + CS, gridN);\n',
            '                for (let i0 = 0; i0 < gridN; i0 += CS) {\n',
            '                    const i1 = Math.min(i0 + CS, gridN);\n',
            '                    if (Z[j1][i0] === undefined) Z[j1][i0] = fAt(i0, j1);\n',
            '                    if (Z[j0][i1] === undefined) Z[j0][i1] = fAt(i1, j0);\n',
            '                    if (Z[j1][i1] === undefined) Z[j1][i1] = fAt(i1, j1);\n',
            '                    const c = [Z[j0][i0], Z[j0][i1], Z[j1][i0], Z[j1][i1]];\n',
            '                    const finite = c.every(function (v) { return typeof v === \'number\' && isFinite(v); });\n',
            '                    const pos = c.filter(function (v) { return v > d.level; }).length;\n',
            '                    const exact = !finite || (pos !== 0 && pos !== 4);\n',
            '                    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {\n',
            '                        if (Z[j][i] !== undefined) continue;\n',
            '                        if (exact) { Z[j][i] = fAt(i, j); continue; }\n',
            '                        const u = (i - i0) / (i1 - i0), t = (j - j0) / (j1 - j0);\n',
            '                        Z[j][i] = (c[0] * (1 - u) + c[1] * u) * (1 - t) + (c[2] * (1 - u) + c[3] * u) * t;\n',
            '                    }\n',
            '                }\n',
            '            }\n',
            '            d._border = { xs: xs, ys: ys, Z: Z }; d._borderKey = key;\n',

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
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; d.__liveThickness = d.thicknessExpr ? evaluate(d.thicknessExpr) : d.thickness; }\n',
            '        ctx.save();\n',
            '        ctx.strokeStyle = d.__liveColor || \'#d9534f\';\n',
            '        ctx.lineWidth = d.__liveThickness || 2;\n',
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
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; d.__liveThickness = d.thicknessExpr ? evaluate(d.thicknessExpr) : d.thickness; }\n',
            '        ctx.save();\n',
            '        ctx.lineWidth = d.__liveThickness || 2;\n',
            '        ctx.lineCap = \'round\';\n',
            '        if (d.fade) {\n',
            '            for (let i = 1; i < d._pts.length; i++) {\n',
            '                const a = fieldToPixel(d._pts[i - 1].x, d._pts[i - 1].y);\n',
            '                const b = fieldToPixel(d._pts[i].x, d._pts[i].y);\n',
            '                ctx.globalAlpha = i / d._pts.length;\n',
            '                ctx.strokeStyle = d.__liveColor || \'#0275d8\';\n',
            '                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();\n',
            '            }\n',
            '        } else {\n',
            '            ctx.strokeStyle = d.__liveColor || \'#0275d8\';\n',
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
            '    function initDrawDistributions() {\n',
            '        drawDistributions = drawDistributionsData.map(d => ({ ...d, active: d.active !== false }));\n',
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
            '            const liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color;\n',
            '            const liveSize = d.sizeExpr ? evaluate(d.sizeExpr) : d.size;\n',
            '            d._el.style.color = liveColor || __gcDefaultColor();\n',
            '            d._el.style.background = d.bg && d.bg !== \'transparent\' ? d.bg : \'transparent\';\n',
            '            d._el.style.fontSize = (16 * (liveSize || 1)) + \'px\';\n',
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
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '        let raw, labels = null;\n',
            '        try { raw = glCoerceArrayData(evaluate(d.dataExpr)); } catch (e) { return; }\n',
            '        if (d.labelsExpr) { try { labels = glCoerceArrayData(evaluate(d.labelsExpr)); } catch (e) { labels = null; } }\n',
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
            // draw Chart { type = bar; interactive = true } — перетаскивание столбца.
            // Как и у Table, значения отвязываются от dataExpr с первого кадра и живут в
            // собственном мутируемом снимке d._editable, иначе следующий пересчёт dataExpr
            // стёр бы правку. Только для type = bar — pie/box/xy интерактивностью не покрыты.
            '        let barVals;\n',
            '        if (d.type === \'bar\' && d.interactive) {\n',
            '            if (!d._editable) d._editable = glChartNumbers(raw).slice();\n',
            '            barVals = d._editable;\n',
            '        } else {\n',
            '            barVals = glChartNumbers(raw);\n',
            '        }\n',
            '        if (d.type === \'bar\') return drawChartBar(d, barVals, labels, ax, ay);\n',
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
            '            ctx.strokeStyle = d.__liveColor || \'#4a90d9\';\n',
            '            ctx.lineWidth = 2;\n',
            '            ctx.beginPath();\n',
            '            for (let i = 0; i < pts.length; i++) {\n',
            '                const p = gcAnchorToPixel(d)(pts[i].x, pts[i].y);\n',
            '                if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);\n',
            '            }\n',
            '            ctx.stroke();\n',
            '        }\n',
            '        if (d.type === \'scatter\' || d.markers) {\n',
            '            ctx.fillStyle = d.__liveColor || \'#4a90d9\';\n',
            '            const r = Math.max(1, d.pointSize || 4);\n',
            '            for (const pt of pts) {\n',
            '                const p = gcAnchorToPixel(d)(pt.x, pt.y);\n',
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
            '                const a = gcAnchorToPixel(d)(minX, slope * minX + inter);\n',
            '                const b = gcAnchorToPixel(d)(maxX, slope * maxX + inter);\n',
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
            '        const scale = gcAnchorScale(d);\n',
            '        const origin = gcAnchorToPixel(d)(ax, ay);\n',
            '        const W = d.width * scale, H = d.height * scale;\n',
            '        let mx = 0;\n',
            '        for (const v of vals) if (Math.abs(v) > mx) mx = Math.abs(v);\n',
            '        if (mx < 1e-12) mx = 1;\n',
            '        const bw = W / vals.length;\n',
            // Прямоугольники столбцов запоминаются только для интерактивных диаграмм —
            // единственный источник хит-теста для перетаскивания в onPointerDown. Хитбокс
            // берёт ВЕСЬ вертикальный диапазон графика (от origin.y - H до origin.y), а не
            // только текущую высоту заполненной части: иначе столбец с маленьким значением
            // (или нулевой) было бы не за что схватить.
            '        if (d.interactive) d._barRects = [];\n',
            '        ctx.save();\n',
            '        for (let i = 0; i < vals.length; i++) {\n',
            '            const h = (vals[i] / mx) * H;\n',
            '            const x = origin.x + i * bw;\n',
            '            if (d.interactive) d._barRects.push({ i: i, x: x, w: bw, baseline: origin.y, H: H, mx: mx });\n',
            '            ctx.fillStyle = glChartColor(i, d.__liveColor);\n',
            '            ctx.fillRect(x + bw * 0.12, origin.y - h, bw * 0.76, h);\n',
            '            if (d.showValues) {\n',
            '                ctx.fillStyle = \'#333333\';\n',
            '                ctx.font = \'11px \' + GC_FONT;\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'bottom\';\n',
            '                ctx.fillText(String(Math.round(vals[i] * 100) / 100), x + bw / 2, origin.y - h - 3);\n',
            '            }\n',
            '            if (labels && labels[i] !== undefined) {\n',
            '                ctx.fillStyle = \'#333333\';\n',
            '                ctx.font = \'11px \' + GC_FONT;\n',
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
            '        const scale = gcAnchorScale(d);\n',
            '        const c = gcAnchorToPixel(d)(ax, ay);\n',
            '        const R = d.radius * scale;\n',
            '        let a0 = -Math.PI / 2;\n',
            '        ctx.save();\n',
            '        for (let i = 0; i < vals.length; i++) {\n',
            '            const frac = Math.abs(vals[i]) / total;\n',
            '            const a1 = a0 + frac * 2 * Math.PI;\n',
            '            ctx.fillStyle = glChartColor(i, d.__liveColor);\n',
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
            '                ctx.font = \'bold 12px \' + GC_FONT;\n',
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
            '        const scale = gcAnchorScale(d);\n',
            '        const origin = gcAnchorToPixel(d)(ax, ay);\n',
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
            '            ctx.fillStyle = glChartColor(s, d.__liveColor);\n',
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
            '                ctx.font = \'11px \' + GC_FONT;\n',
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
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; d.__liveEdgeColor = d.edgeColorExpr ? evaluate(d.edgeColorExpr) : d.edgeColor; }\n',
            '        let raw;\n',
            '        try { raw = glCoerceArrayData(evaluate(d.dataExpr)); } catch (e) { return; }\n',
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
            '        ctx.strokeStyle = d.__liveEdgeColor || \'#90a4ae\';\n',
            '        ctx.lineWidth = 1.8;\n',
            '        (function edges(n) {\n',
            '            const p = gcAnchorToPixel(d)(n.x + shift, n.y + ay);\n',
            '            for (const c of n.children) {\n',
            '                const q = gcAnchorToPixel(d)(c.x + shift, c.y + ay);\n',
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
            '            const p = gcAnchorToPixel(d)(n.x + shift, n.y + ay);\n',
            '            ctx.fillStyle = d.__liveColor || __gcDefaultColor();\n',
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
            '            ctx.fillStyle = d.labelColor || __gcDefaultColor();\n',
            '            ctx.font = Math.max(10, R) + \'px \' + GC_FONT;\n',
            '            ctx.textAlign = \'center\';\n',
            '            ctx.textBaseline = \'middle\';\n',
            '            ctx.fillText(n.label, p.x, p.y);\n',
            '            for (const c of n.children) nodes(c);\n',
            '        })(root);\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Таблицы ----\n',
            // interactive = true отвязывает таблицу от dataExpr после первого кадра: значения
            // переходят в собственный мутируемый снимок d._editable, который редактируется
            // кликом по ячейке (см. onPointerDown) и дальше живёт независимо от исходного
            // выражения. Без этого отвязывания следующий же кадр пересчитал бы dataExpr заново
            // и стёр правку пользователя.
            '    function drawTable(d) {\n',
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '        let rows;\n',
            '        if (d.interactive && d._editable) {\n',
            '            rows = d._editable;\n',
            '        } else {\n',
            '            let raw;\n',
            '            try { raw = glCoerceArrayData(evaluate(d.dataExpr)); } catch (e) { return; }\n',
            '            if (!Array.isArray(raw) || !raw.length) return;\n',
            '            rows = raw.map(r => Array.isArray(r) ? r.slice() : [r]);\n',
            '            if (d.interactive) d._editable = rows;\n',
            '        }\n',
            '        let cols = 0;\n',
            '        for (const r of rows) if (r.length > cols) cols = r.length;\n',
            '        if (!cols) return;\n',
            '        let ax = 0, ay = 0;\n',
            '        try { ax = evaluate(d.posXExpr); ay = evaluate(d.posYExpr); } catch (e) { ax = 0; ay = 0; }\n',
            '        if (typeof ax !== \'number\' || !isFinite(ax)) ax = 0;\n',
            '        if (typeof ay !== \'number\' || !isFinite(ay)) ay = 0;\n',
            '        const scale = fieldScale();\n',
            '        const cw = d.cellWidth * scale, ch = d.cellHeight * scale;\n',
            '        const origin = gcAnchorToPixel(d)(ax, ay);\n',
            '        ctx.save();\n',
            '        ctx.font = Math.max(9, 13 * (d.fontSize || 1)) + \'px \' + GC_FONT;\n',
            '        ctx.textBaseline = \'middle\';\n',
            // Экранные прямоугольники ячеек запоминаются только для интерактивных таблиц —
            // это единственный источник хит-теста для клика по ячейке в onPointerDown.
            '        if (d.interactive) d._cellRects = [];\n',
            '        for (let r = 0; r < rows.length; r++) {\n',
            '            for (let c = 0; c < cols; c++) {\n',
            '                const x = origin.x + c * cw;\n',
            '                const y = origin.y + r * ch;\n',
            '                if (d.interactive) d._cellRects.push({ r: r, c: c, x: x, y: y, w: cw, h: ch });\n',
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
            '                ctx.fillStyle = d.__liveColor || __gcDefaultColor();\n',
            '                if (d.header && r === 0) ctx.font = \'bold \' + Math.max(9, 13 * (d.fontSize || 1)) + \'px \' + GC_FONT;\n',
            '                else ctx.font = Math.max(9, 13 * (d.fontSize || 1)) + \'px \' + GC_FONT;\n',
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
            '        const liveOp = d.opacityExpr ? evaluate(d.opacityExpr) : d.opacity;\n',
            '        ctx.globalAlpha = Math.max(0, Math.min(1, (typeof liveOp === \'number\' && isFinite(liveOp)) ? liveOp : (d.opacity === undefined ? 1 : d.opacity)));\n',
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
            '        if (gcShouldUpdate(d)) {\n',
            '          d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color;\n',
            '          d.__liveTileColor = d.tileColorExpr ? evaluate(d.tileColorExpr) : d.tileColor;\n',
            '          d.__liveThickness = d.thicknessExpr ? evaluate(d.thicknessExpr) : d.thickness;\n',
            '        }\n',
            '        const scale = d.radius || 8;\n',
            '        const cx = 0, cy = 0;\n',
            '        ctx.save();\n',
            '        if (d.model === \'halfplane\') {\n',
            '            // Полуплоскость: геодезические — вертикальные лучи и полуокружности с центром на оси\n',
            '            ctx.strokeStyle = d.__liveColor || __gcDefaultColor();\n',
            '            ctx.lineWidth = d.__liveThickness || 1.4;\n',
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
            '            ctx.strokeStyle = d.color || __gcDefaultColor();\n',
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
            '            ctx.strokeStyle = d.__liveTileColor || \'#5b8db8\';\n',
            '            ctx.lineWidth = d.__liveThickness || 1.4;\n',
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
            '            ctx.strokeStyle = d.__liveColor || __gcDefaultColor();\n',
            '            ctx.lineWidth = (d.__liveThickness || 1.4) + 0.8;\n',
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
            '            ctx.fillStyle = d.__liveColor || __gcDefaultColor();\n',
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
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '        const q = Math.max(1, Math.floor(d.quality || 2));\n',
            '        let bx = 0, by = 0, bw = width, bh = height;\n',
            '        if (d.box) { const a = fieldToPixel(d.box[0], d.box[3]), b = fieldToPixel(d.box[2], d.box[1]); bx = a.x; by = a.y; bw = b.x - a.x; bh = b.y - a.y; }\n',
            '        const w = Math.max(2, Math.floor(bw / q)), h = Math.max(2, Math.floor(bh / q));\n',
            '        const key = [d.funcName, d.rmin, d.rmax, d.ymin, d.ymax, d.x0, d.skip, d.keep, w, h, d.__liveColor, glUserFuncVersion].join(\'|\');\n',
            '        if (!d._cache || d._cacheKey !== key) {\n',
            '            const off = document.createElement(\'canvas\');\n',
            '            off.width = w; off.height = h;\n',
            '            const octx = off.getContext(\'2d\');\n',
            '            const img = octx.createImageData(w, h);\n',
            '            const data = img.data;\n',
            '            const rgb = hexToRgbSurface(d.__liveColor || \'#1a237e\');\n',
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
            '        ctx.drawImage(d._cache, bx, by, bw, bh);\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // ---- Паутинная диаграмма ----\n',
            '    function drawCobweb(d) {\n',
            '        if (!GL_USER_FUNCS[d.funcName]) return;\n',
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; d.__liveCurveColor = d.curveColorExpr ? evaluate(d.curveColorExpr) : d.curveColor; }\n',
            '        const f = (x) => glCallUserFunc(d.funcName, [x]);\n',
            '        ctx.save();\n',
            '        // график функции\n',
            '        ctx.strokeStyle = d.__liveCurveColor || \'#1565c0\';\n',
            '        ctx.lineWidth = 2;\n',
            '        ctx.beginPath();\n',
            '        const N = 200;\n',
            '        let started = false;\n',
            '        for (let i = 0; i <= N; i++) {\n',
            '            const x = d.xmin + (d.xmax - d.xmin) * i / N;\n',
            '            let y;\n',
            '            try { y = f(x); } catch (e) { started = false; continue; }\n',
            '            if (typeof y !== \'number\' || !isFinite(y)) { started = false; continue; }\n',
            '            const p = gcAnchorToPixel(d)(x, y);\n',
            '            if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y);\n',
            '        }\n',
            '        ctx.stroke();\n',
            '        // диагональ y = x\n',
            '        if (d.showDiagonal) {\n',
            '            ctx.strokeStyle = \'#9e9e9e\';\n',
            '            ctx.lineWidth = 1;\n',
            '            ctx.setLineDash([5, 4]);\n',
            '            const a = gcAnchorToPixel(d)(d.xmin, d.xmin), b = gcAnchorToPixel(d)(d.xmax, d.xmax);\n',
            '            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();\n',
            '            ctx.setLineDash([]);\n',
            '        }\n',
            '        // лестница итераций\n',
            '        let x0 = 0.5;\n',
            '        try { if (d.x0Expr) x0 = evaluate(d.x0Expr); } catch (e) { x0 = 0.5; }\n',
            '        if (typeof x0 !== \'number\' || !isFinite(x0)) x0 = 0.5;\n',
            '        ctx.strokeStyle = d.__liveColor || \'#c62828\';\n',
            '        ctx.lineWidth = 1.4;\n',
            '        ctx.beginPath();\n',
            '        let x = x0;\n',
            '        let p0 = gcAnchorToPixel(d)(x, 0);\n',
            '        ctx.moveTo(p0.x, p0.y);\n',
            '        const steps = Math.max(1, Math.min(500, Math.floor(d.steps)));\n',
            '        for (let i = 0; i < steps; i++) {\n',
            '            let y;\n',
            '            try { y = f(x); } catch (e) { break; }\n',
            '            if (typeof y !== \'number\' || !isFinite(y)) break;\n',
            '            const pv = gcAnchorToPixel(d)(x, y);\n',
            '            ctx.lineTo(pv.x, pv.y);          // вертикально до кривой\n',
            '            const ph = gcAnchorToPixel(d)(y, y);\n',
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
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '        const tl = pixelToField(0, 0), br = pixelToField(width, height);\n',
            '        const key = [JSON.stringify(maps), d.iterations, width, height,\n',
            '            tl.x.toFixed(4), tl.y.toFixed(4), br.x.toFixed(4), br.y.toFixed(4), d.__liveColor].join(\'|\');\n',
            '        if (!d._cache || d._cacheKey !== key) {\n',
            '            const off = document.createElement(\'canvas\');\n',
            '            off.width = width; off.height = height;\n',
            '            const octx = off.getContext(\'2d\');\n',
            '            const img = octx.createImageData(width, height);\n',
            '            const data = img.data;\n',
            '            const rgb = hexToRgbSurface(d.__liveColor || \'#1b5e20\');\n',
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
            '        ctx.drawImage(d._cache, 0, 0, width, height);\n',
            '    }\n',
            '\n',
            '    // ---- Клеточные автоматы ----\n',
            '    function drawAutomaton(d) {\n',
            '        let ax = 0, ay = 0;\n',
            '        try { ax = evaluate(d.posXExpr); ay = evaluate(d.posYExpr); } catch (e) { ax = 0; ay = 0; }\n',
            '        if (typeof ax !== \'number\' || !isFinite(ax)) ax = 0;\n',
            '        if (typeof ay !== \'number\' || !isFinite(ay)) ay = 0;\n',
            '        const cs = d.cellSize || 0.25;\n',
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '        ctx.save();\n',
            '        ctx.fillStyle = d.__liveColor || __gcDefaultColor();\n',
            '        const scale = gcAnchorScale(d);\n',
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
            '                    const p = gcAnchorToPixel(d)(ax + c * cs, ay - r * cs);\n',
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
            '                const p = gcAnchorToPixel(d)(ax + (i - row.length / 2) * cs, ay - s * cs);\n',
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
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '        ctx.save();\n',
            '        if (d.mode === \'hull\') {\n',
            '            const hull = glConvexHull(raw);\n',
            '            ctx.strokeStyle = d.__liveColor || __gcDefaultColor();\n',
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
            '            ctx.strokeStyle = d.__liveColor || __gcDefaultColor();\n',
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
            '            ctx.fillStyle = d.color || __gcDefaultColor();\n',
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
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; d.__liveCircleColor = d.circleColorExpr ? evaluate(d.circleColorExpr) : d.circleColor; }\n',
            '        ctx.save();\n',
            '        ctx.strokeStyle = d.__liveCircleColor || \'#9e9e9e\';\n',
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
            '        ctx.strokeStyle = d.__liveColor || \'#ad1457\';\n',
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
            '        if (gcShouldUpdate(d)) {\n',
            '          d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color;\n',
            '          d.__liveArrowColor = d.arrowColorExpr ? evaluate(d.arrowColorExpr) : d.arrowColor;\n',
            '        }\n',
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
            '            const p1 = gcAnchorToPixel(d)(a.x, a.y), p2 = gcAnchorToPixel(d)(b.x, b.y);\n',
            '            ctx.strokeStyle = d.__liveArrowColor || __gcDefaultColor();\n',
            '            ctx.fillStyle = d.__liveArrowColor || __gcDefaultColor();\n',
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
            '                ctx.font = \'13px \' + GC_FONT;\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'bottom\';\n',
            '                ctx.fillText(label, mx, my - 5);\n',
            '            }\n',
            '        }\n',
            '        // вершины\n',
            '        for (const nd of nodes) {\n',
            '            if (!Array.isArray(nd) || nd.length < 3) continue;\n',
            '            const label = String(nd[0]);\n',
            '            const p = gcAnchorToPixel(d)(nd[1], nd[2]);\n',
            '            ctx.fillStyle = d.__liveColor || __gcDefaultColor();\n',
            '            if (d.boxed) {\n',
            '                const w2 = Math.max(R * 2, ctx.measureText(label).width + 16);\n',
            '                ctx.fillRect(p.x - w2 / 2, p.y - R, w2, R * 2);\n',
            '            } else {\n',
            '                ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 2 * Math.PI); ctx.fill();\n',
            '            }\n',
            '            if (accSet[label]) {\n',
            '                // двойной контур — принимающее состояние автомата\n',
            '                ctx.strokeStyle = d.color || __gcDefaultColor();\n',
            '                ctx.lineWidth = 1.5;\n',
            '                ctx.beginPath(); ctx.arc(p.x, p.y, R + 4, 0, 2 * Math.PI); ctx.stroke();\n',
            '            }\n',
            '            ctx.fillStyle = d.labelColor || __gcDefaultColor();\n',
            '            ctx.font = Math.max(10, R * 0.85) + \'px \' + GC_FONT;\n',
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
            '        if (gcShouldUpdate(d)) {\n',
            '          d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color;\n',
            '          d.__liveNodeColor = d.nodeColorExpr ? evaluate(d.nodeColorExpr) : d.nodeColor;\n',
            '          d.__liveEdgeColor = d.edgeColorExpr ? evaluate(d.edgeColorExpr) : d.edgeColor;\n',
            '        }\n',
            '        const base = d.__liveColor || __gcDefaultColor();\n',
            '        const eCol = d.__liveEdgeColor || base;\n',
            '        const nCol = d.__liveNodeColor || base;\n',
            '        const R = d.nodeRadius === undefined ? 9 : d.nodeRadius;\n',
            '        ctx.save();\n',
            '        // кратные рёбра между одной парой разводим дугами\n',
            '        const pairCount = {}, pairSeen = {};\n',
            '        for (const e of g.edges) {\n',
            '            const k = edgeKey(e.a < e.b ? e.a : e.b, e.a < e.b ? e.b : e.a);\n',
            '            pairCount[k] = (pairCount[k] || 0) + 1;\n',
            '        }\n',
            '        // Прямые рёбра одного цвета и толщины копим в один путь и обводим разом: граф из тысяч\n',
            '        // отрезков (сетки, покрытия квадратами) иначе тратил по stroke() на ребро — ~16 мс кадра.\n',
            '        // Только без стрелок и весов, чтобы не менять порядок наложения подписей и рёбер.\n',
            '        const batchable = !d.directed && !d.showWeights;\n',
            '        let bStyle = null, bWidth = 0, bOpen = false;\n',
            '        const flushBatch = function () { if (bOpen) { ctx.stroke(); bOpen = false; } };\n',
            '        for (const e of g.edges) {\n',
            '            const na = g.nodes[e.a], nb = g.nodes[e.b];\n',
            '            if (!na || !nb) continue;\n',
            '            const p1 = gcAnchorToPixel(d)(na.pos[0], na.pos[1]);\n',
            '            const p2 = gcAnchorToPixel(d)(nb.pos[0], nb.pos[1]);\n',
            '            const pk = edgeKey(e.a < e.b ? e.a : e.b, e.a < e.b ? e.b : e.a);\n',
            '            pairSeen[pk] = (pairSeen[pk] || 0) + 1;\n',
            '            const total = pairCount[pk], ord = pairSeen[pk];\n',
            '            const isHl = !!hlEdgeSet[edgeKey(e.a, e.b)];\n',
            '            const eC = isHl ? (d.highlightColor || \'#e8590c\') : (e.color || eCol);\n',
            '            const eW = isHl ? Math.max(3.5, (d.edgeWidth || 2) + 1.5) : (d.edgeWidth || 2);\n',
            '            const simple = batchable && e.a !== e.b && total <= 1;\n',
            '            if (!simple || eC !== bStyle || eW !== bWidth) flushBatch();\n',
            '            ctx.strokeStyle = eC; bStyle = eC;\n',
            '            ctx.lineWidth = eW; bWidth = eW;\n',

            '            // lineCap задаём явно: иначе он наследуется от предыдущего объекта кадра (кривые\n',
            '            // ставят round), и концы рёбер то скруглены, то нет.\n',
            '            ctx.lineCap = d.edgeCap || \'round\';\n',
            '            let mx, my, cxE = null, cyE = null;\n',
            '            if (e.a === e.b) {\n',
            '                // петля\n',
            '                ctx.beginPath();\n',
            '                ctx.arc(p1.x, p1.y - R * 1.6, R * 1.4, 0, 2 * Math.PI);\n',
            '                ctx.stroke();\n',
            '                mx = p1.x; my = p1.y - R * 3;\n',
            '            } else if (total > 1) {\n',
            // расхождение дуг растёт с длиной ребра: на длинной хорде 22 px почти не видны
            '                const off = (ord - (total + 1) / 2) * Math.max(22, 0.18 * Math.hypot(p2.x - p1.x, p2.y - p1.y));\n',
            '                const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;\n',
            // Нормаль берём по каноническому направлению пары (от меньшего имени к большему):
            // иначе у встречных рёбер a→b и b→a нормали противоположны и обе дуги ложатся на
            // одну сторону, сливаясь в «двоящуюся» линию.
            '                const cA = e.a < e.b ? p1 : p2, cB = e.a < e.b ? p2 : p1;\n',
            '                const dxE = cB.x - cA.x, dyE = cB.y - cA.y;\n',
            '                const len = Math.hypot(dxE, dyE) || 1;\n',
            '                cxE = midX - (dyE / len) * off; cyE = midY + (dxE / len) * off;\n',
            '                ctx.beginPath();\n',
            '                ctx.moveTo(p1.x, p1.y);\n',
            '                ctx.quadraticCurveTo(cxE, cyE, p2.x, p2.y);\n',
            '                ctx.stroke();\n',
            '                mx = (p1.x + 2 * cxE + p2.x) / 4; my = (p1.y + 2 * cyE + p2.y) / 4;\n',
            '            } else if (simple) {\n',
            '                if (!bOpen) { ctx.beginPath(); bOpen = true; }\n',
            '                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);\n',
            '                mx = (p1.x + p2.x) / 2; my = (p1.y + p2.y) / 2;\n',
            '            } else {\n',
            '                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();\n',
            '                mx = (p1.x + p2.x) / 2; my = (p1.y + p2.y) / 2;\n',
            '            }\n',
            '            // стрелка для ориентированного графа\n',
            '            if (d.directed && e.a !== e.b) {\n',
            // у дуги стрелка смотрит по касательной в конце (от контрольной точки к p2)
            '                const ang = cxE !== null ? Math.atan2(p2.y - cyE, p2.x - cxE) : Math.atan2(p2.y - p1.y, p2.x - p1.x);\n',
            '                const tipX = p2.x - Math.cos(ang) * R;\n',
            '                const tipY = p2.y - Math.sin(ang) * R;\n',
            '                const ah = 11;\n',
            '                ctx.fillStyle = eC;\n',
            '                ctx.beginPath();\n',
            '                ctx.moveTo(tipX, tipY);\n',
            '                ctx.lineTo(tipX - ah * Math.cos(ang - 0.4), tipY - ah * Math.sin(ang - 0.4));\n',
            '                ctx.lineTo(tipX - ah * Math.cos(ang + 0.4), tipY - ah * Math.sin(ang + 0.4));\n',
            '                ctx.closePath();\n',
            '                ctx.fill();\n',
            '            }\n',
            '            if (d.showWeights && e.weight !== undefined && e.weight !== 1) {\n',
            '                ctx.fillStyle = \'#333333\';\n',
            '                ctx.font = \'11px \' + GC_FONT;\n',
            '                ctx.textAlign = \'center\';\n',
            '                ctx.textBaseline = \'bottom\';\n',
            '                ctx.fillText(String(e.weight), mx, my - 4);\n',
            '            }\n',
            '        }\n',
            '        flushBatch();\n',
            '        for (const key in g.nodes) {\n',
            '            const n = g.nodes[key];\n',
            '            const isHl = !!(hlSet[String(key)] || hlSet[String(n.label)]);\n',
            '            // узел нулевого радиуса без подписи не виден — не тратим на него arc/fill\n',
            '            if (R <= 0 && !isHl && !d.labels) continue;\n',
            '            const p = gcAnchorToPixel(d)(n.pos[0], n.pos[1]);\n',
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
            // Узел без своего цвета закрашен цветом по умолчанию — тем же, что и подпись, и
            // число внутри кружка пропадало. Тогда подпись берёт цвет фона поля (как у
            // «ореола»), контрастный к кружку в обеих темах (у узлов нулевого радиуса кружка нет — цвет прежний).
            '                ctx.fillStyle = d.labelColor || ((R > 0 && !n.color && !d.__liveNodeColor && !d.__liveColor) ? __gcTheme().halo : __gcDefaultColor());\n',
            // длинная подпись уменьшается, чтобы уместиться в кружок узла
            '                let fs = Math.max(9, R * 1.1);\n',
            '                ctx.font = fs + \'px \' + GC_FONT;\n',
            '                const tw = ctx.measureText(String(n.label)).width;\n',
            '                if (tw > R * 1.7) { fs = Math.max(7, fs * R * 1.7 / tw); ctx.font = fs + \'px \' + GC_FONT; }\n',
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
            '        if (gcShouldUpdate(d)) { d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color; }\n',
            '        const color = d.__liveColor || __gcDefaultColor();\n',
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
            '        if (gcShouldUpdate(d)) {\n',
            '          d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color;\n',
            '          d.__liveThickness = d.thicknessExpr ? evaluate(d.thicknessExpr) : d.thickness;\n',
            '        }\n',
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
            '        ctx.strokeStyle = d.__liveColor || line.color || __gcDefaultColor();\n',
            '        ctx.lineWidth = d.__liveThickness || line.thickness || 2;\n',
            '        if (d.dotline) { ctx.setLineDash([6, 6]); } else { ctx.setLineDash([]); }\n',
            '        ctx.beginPath(); ctx.moveTo(pStart.x, pStart.y); ctx.lineTo(pEnd.x, pEnd.y); ctx.stroke();\n',
            '        ctx.setLineDash([]);\n',
            '    }\n',
            '\n',
            '    function drawVector(d) {\n',
            '        const line = d.line;\n',
            '        if (!line) return;\n',
            '        if (gcShouldUpdate(d)) {\n',
            '          d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color;\n',
            '          d.__liveLength = d.lengthExpr ? evaluate(d.lengthExpr) : d.length;\n',
            '          d.__liveThickness = d.thicknessExpr ? evaluate(d.thicknessExpr) : d.thickness;\n',
            '        }\n',
            '        const pA = line.pA.pos, pB = line.pB.pos;\n',
            '        const t = (d.pos + 1) / 2;\n',
            '        const x = pA.x + (pB.x - pA.x) * t;\n',
            '        const y = pA.y + (pB.y - pA.y) * t;\n',
            '        const dx = pB.x - pA.x, dy = pB.y - pA.y;\n',
            '        const len = Math.hypot(dx, dy);\n',
            '        if (len < 0.001) return;\n',
            '        const dir = d.direct;\n',
            '        const angle = Math.atan2(dy, dx) + (dir < 0 ? Math.PI : 0);\n',
            '        const arrowLen = d.__liveLength || d.length || 12;\n',
            '        const angleOffset = 0.45;\n',
            '        const p = fieldToPixel(x, y);\n',
            // Стрелка на конце отрезка (pos = ±1, смотрит наружу): острие упирается в край
            // точки-конца. Раньше острие выносилось на 0.3 за конец и торчало из кружка точки.
            '        let tipOff = 0.3;\n',
            '        const endPt = (d.pos >= 1 && dir >= 0) ? line.pB : ((d.pos <= -1 && dir < 0) ? line.pA : null);\n',
            '        if (endPt) tipOff = (endPt.active === false || endPt.visible === false) ? 0 : -gcPointRadiusField(endPt);\n',
            '        const tipX = x + Math.cos(angle) * tipOff;\n',
            '        const tipY = y + Math.sin(angle) * tipOff;\n',
            '        if (endPt && tipOff < 0) { const b = fieldToPixel(x - Math.cos(angle) * 0.6, y - Math.sin(angle) * 0.6); p.x = b.x; p.y = b.y; }\n',
            '        const tip = fieldToPixel(tipX, tipY);\n',
            '        ctx.strokeStyle = d.__liveColor || d.color || __gcDefaultColor();\n',
            '        ctx.lineWidth = d.__liveThickness || d.thickness || line.thickness || 2;\n',
            '        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();\n',
            // направление острия — по самой прямой (в пикселях), а не от p к tip: при острие
            // ровно в конце отрезка p и tip совпадают, и стрелка смотрела вправо
            '        const back = fieldToPixel(tipX - Math.cos(angle) * 0.2, tipY - Math.sin(angle) * 0.2);\n',
            '        const ang = Math.atan2(tip.y - back.y, tip.x - back.x);\n',
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
            '        if (gcShouldUpdate(d)) {\n',
            '          d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color;\n',
            '          const ov = d.opacityExpr ? evaluate(d.opacityExpr) : d.opacity;\n',
            '          d.__liveOpacity = (typeof ov === \'number\' && isFinite(ov)) ? Math.max(0, Math.min(1, ov)) : d.opacity;\n',
            '        }\n',
            '        ctx.save();\n',
            '        ctx.globalAlpha = (d.__liveOpacity === undefined || d.__liveOpacity === null) ? 0.5 : d.__liveOpacity;\n',
            '        ctx.fillStyle = d.__liveColor || d.color || __gcDefaultColor();\n',
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
            '        if (d.kind === \'funcArea\') {\n',
            '            drawFuncAreaFilling(d);\n',
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
            '            if (!fillingOffCanvas || fillingOffCanvas.width !== canvas.width || fillingOffCanvas.height !== canvas.height) {\n',
            '                fillingOffCanvas = document.createElement(\'canvas\');\n',
            '                fillingOffCanvas.width = canvas.width; fillingOffCanvas.height = canvas.height;\n',
            '                fillingOffCtx = fillingOffCanvas.getContext(\'2d\');\n',
            '            }\n',
            '            fillingOffCtx.setTransform(gcDpr, 0, 0, gcDpr, 0, 0);\n',
            '            fillingOffCtx.clearRect(0, 0, width, height);\n',
            '            fillingOffCtx.globalCompositeOperation = \'source-over\';\n',
            '            fillingOffCtx.globalAlpha = 1;\n',
            '            fillingOffCtx.fillStyle = d.__liveColor || d.color || __gcDefaultColor();\n',
            '            fillingOffCtx.fill(path, \'nonzero\');\n',
            '            fillingOffCtx.globalCompositeOperation = \'destination-out\';\n',
            '            fillingOffCtx.fill(path, \'evenodd\');\n',
            '            ctx.drawImage(fillingOffCanvas, 0, 0, width, height);\n',
            '        } else {\n',
            '            ctx.fill(path, \'nonzero\');\n',
            '        }\n',
            '        ctx.restore();\n',
            '    }\n',
            '\n',
            '    // Заливка площади под графиком draw Function (d.graph) — до оси X, если d.graph2 не\n',
            '    // задан, иначе до второго графика d.graph2. ctx.fillStyle/globalAlpha уже выставлены\n',
            '    // вызывающим drawFilling(). Область считается на диапазоне [d.xmin, d.xmax] (взятом\n',
            '    // из самого draw Function либо переопределённом в draw Filling — см. initDrawFillings);\n',
            '    // "живое" продление диапазона (extend = true у draw Function) здесь не отслеживается —\n',
            '    // площадь всегда считается на фиксированном интервале.\n',
            '    function drawFuncAreaFilling(d) {\n',
            '        const g1 = d.graph, g2 = d.graph2;\n',
            '        if (!g1 || !GL_USER_FUNCS[g1.funcName]) return;\n',
            '        if (g2 && !GL_USER_FUNCS[g2.funcName]) return;\n',
            '        const xmin = d.xmin, xmax = d.xmax;\n',
            '        if (!(xmax > xmin)) return;\n',
            '        const n = Math.max(2, d.segments || 100);\n',
            '        const pts1 = [], pts2 = [];\n',
            '        for (let i = 0; i <= n; i++) {\n',
            '            const x = xmin + (xmax - xmin) * i / n;\n',
            '            let y1; try { y1 = glCallUserFunc(g1.funcName, [x]); } catch (e) { y1 = NaN; }\n',
            '            pts1.push((typeof y1 === \'number\' && isFinite(y1)) ? { x, y: y1 } : null);\n',
            '            if (g2) {\n',
            '                let y2; try { y2 = glCallUserFunc(g2.funcName, [x]); } catch (e) { y2 = NaN; }\n',
            '                pts2.push((typeof y2 === \'number\' && isFinite(y2)) ? { x, y: y2 } : null);\n',
            '            } else {\n',
            '                pts2.push({ x, y: 0 });\n',
            '            }\n',
            '        }\n',
            '        // Заливаем каждый непрерывный отрезок отдельно: разрыв (одна из функций не\n',
            '        // определена, либо скачок похож на вертикальную асимптоту — та же эвристика,\n',
            '        // что и в drawFunctionGraph) не должен превращаться в одну сплошную заливку\n',
            '        // через весь холст.\n',
            '        let segStart = -1;\n',
            '        let prevPix1 = null, prevPix2 = null;\n',
            '        for (let i = 0; i <= n; i++) {\n',
            '            const has = pts1[i] && pts2[i];\n',
            '            let pix1 = null, pix2 = null, jump = false;\n',
            '            if (has) {\n',
            '                pix1 = fieldToPixel(pts1[i].x, pts1[i].y);\n',
            '                pix2 = fieldToPixel(pts2[i].x, pts2[i].y);\n',
            '                if (prevPix1 && (Math.abs(pix1.y - prevPix1.y) > height * 3 || Math.abs(pix2.y - prevPix2.y) > height * 3)) jump = true;\n',
            '            }\n',
            '            if (has && !jump) {\n',
            '                if (segStart === -1) segStart = i;\n',
            '            } else {\n',
            '                if (segStart !== -1 && i - 1 > segStart) fillFuncAreaSegment(pts1, pts2, segStart, i - 1);\n',
            '                segStart = has ? i : -1;\n',
            '            }\n',
            '            prevPix1 = has ? pix1 : null;\n',
            '            prevPix2 = has ? pix2 : null;\n',
            '        }\n',
            '        if (segStart !== -1 && n > segStart) fillFuncAreaSegment(pts1, pts2, segStart, n);\n',
            '    }\n',
            '\n',
            '    function fillFuncAreaSegment(pts1, pts2, start, end) {\n',
            '        const path = new Path2D();\n',
            '        let p = fieldToPixel(pts1[start].x, pts1[start].y);\n',
            '        path.moveTo(p.x, p.y);\n',
            '        for (let i = start + 1; i <= end; i++) { p = fieldToPixel(pts1[i].x, pts1[i].y); path.lineTo(p.x, p.y); }\n',
            '        for (let i = end; i >= start; i--) { p = fieldToPixel(pts2[i].x, pts2[i].y); path.lineTo(p.x, p.y); }\n',
            '        path.closePath();\n',
            '        ctx.fill(path, \'nonzero\');\n',
            '    }\n',
            '\n',
            '    // draw Distribution — готовые визуализации распределений вероятностей.\n',
            '    // normal/uniform/exponential: непрерывная кривая плотности (+ заливка под ней);\n',
            '    // binomial/poisson: столбцы вероятностей по k = 0..kmax.\n',
            '    function distributionPdf(d, x) {\n',
            '        if (d.type === \'normal\') {\n',
            '            const z = (x - d.mu) / d.sigma;\n',
            '            return Math.exp(-z * z / 2) / (d.sigma * Math.sqrt(2 * Math.PI));\n',
            '        }\n',
            '        if (d.type === \'uniform\') return (x >= d.a && x <= d.b) ? 1 / (d.b - d.a) : 0;\n',
            '        if (d.type === \'exponential\') return (x >= 0) ? d.lambda * Math.exp(-d.lambda * x) : 0;\n',
            '        return 0;\n',
            '    }\n',
            '    function distributionPmf(d, k) {\n',
            '        if (d.type === \'binomial\') return glBinom(d.n, k) * Math.pow(d.p, k) * Math.pow(1 - d.p, d.n - k);\n',
            '        if (d.type === \'poisson\') return Math.exp(-d.lambda) * Math.pow(d.lambda, k) / glFactorial(k);\n',
            '        return 0;\n',
            '    }\n',
            '    function drawDistribution(d) {\n',
            '        if (gcShouldUpdate(d)) {\n',
            '          d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color;\n',
            '          d.__liveThickness = d.thicknessExpr ? evaluate(d.thicknessExpr) : d.thickness;\n',
            '          const ov = d.opacityExpr ? evaluate(d.opacityExpr) : d.opacity;\n',
            '          d.__liveOpacity = (typeof ov === \'number\' && isFinite(ov)) ? Math.max(0, Math.min(1, ov)) : d.opacity;\n',
            '        }\n',
            '        if (d.type === \'binomial\' || d.type === \'poisson\') drawDistributionBars(d);\n',
            '        else drawDistributionCurve(d);\n',
            '    }\n',
            '    // Закрашивает область между кривой (заданной непрерывными отрезками pts, с null\n',
            '    // в местах разрыва) и осью Y=0 — та же идея сегментов, что и у draw Filling { func }.\n',
            '    function fillCurveAgainstZero(pts, n) {\n',
            '        let segStart = -1;\n',
            '        for (let i = 0; i <= n; i++) {\n',
            '            const has = !!pts[i];\n',
            '            if (has) { if (segStart === -1) segStart = i; }\n',
            '            else { if (segStart !== -1 && i - 1 > segStart) fillZeroSegment(pts, segStart, i - 1); segStart = -1; }\n',
            '        }\n',
            '        if (segStart !== -1 && n > segStart) fillZeroSegment(pts, segStart, n);\n',
            '    }\n',
            '    function fillZeroSegment(pts, start, end) {\n',
            '        const path = new Path2D();\n',
            '        let p = fieldToPixel(pts[start].x, 0);\n',
            '        path.moveTo(p.x, p.y);\n',
            '        for (let i = start; i <= end; i++) { p = fieldToPixel(pts[i].x, pts[i].y); path.lineTo(p.x, p.y); }\n',
            '        p = fieldToPixel(pts[end].x, 0);\n',
            '        path.lineTo(p.x, p.y);\n',
            '        path.closePath();\n',
            '        ctx.fill(path, \'nonzero\');\n',
            '    }\n',
            '    function drawDistributionCurve(d) {\n',
            '        const xmin = d.xmin, xmax = d.xmax;\n',
            '        if (!(xmax > xmin)) return;\n',
            '        const n = Math.max(2, d.segments || 200);\n',
            '        const pts = [];\n',
            '        for (let i = 0; i <= n; i++) {\n',
            '            const x = xmin + (xmax - xmin) * i / n;\n',
            '            let y; try { y = distributionPdf(d, x); } catch (e) { y = NaN; }\n',
            '            pts.push((typeof y === \'number\' && isFinite(y)) ? { x, y } : null);\n',
            '        }\n',
            '        ctx.save();\n',
            '        if (d.filled) {\n',
            '            ctx.globalAlpha = ((d.__liveOpacity === undefined || d.__liveOpacity === null) ? 1 : d.__liveOpacity) * 0.35;\n',
            '            ctx.fillStyle = d.__liveColor || __gcDefaultColor();\n',
            '            fillCurveAgainstZero(pts, n);\n',
            '        }\n',
            '        // Подсветка P(highlightFrom <= X <= highlightTo) — отдельная более узкая заливка поверх основной.\n',
            '        if (d.highlightFrom !== null && d.highlightFrom !== undefined && d.highlightTo !== null && d.highlightTo !== undefined && d.highlightTo > d.highlightFrom) {\n',
            '            const hi = Math.max(xmin, d.highlightFrom), ha = Math.min(xmax, d.highlightTo);\n',
            '            if (ha > hi) {\n',
            '                const m = Math.max(2, Math.round(n * (ha - hi) / (xmax - xmin)) || 2);\n',
            '                const hpts = [];\n',
            '                for (let i = 0; i <= m; i++) {\n',
            '                    const x = hi + (ha - hi) * i / m;\n',
            '                    let y; try { y = distributionPdf(d, x); } catch (e) { y = NaN; }\n',
            '                    hpts.push((typeof y === \'number\' && isFinite(y)) ? { x, y } : null);\n',
            '                }\n',
            '                ctx.globalAlpha = (d.highlightOpacity === undefined || d.highlightOpacity === null) ? 0.5 : d.highlightOpacity;\n',
            '                ctx.fillStyle = d.highlightColor || \'#e07a5f\';\n',
            '                fillCurveAgainstZero(hpts, m);\n',
            '            }\n',
            '        }\n',
            '        ctx.globalAlpha = 1;\n',
            '        ctx.strokeStyle = d.__liveColor || __gcDefaultColor();\n',
            '        ctx.lineWidth = d.__liveThickness || 2;\n',
            '        ctx.lineCap = \'round\';\n',
            '        ctx.beginPath();\n',
            '        let started = false;\n',
            '        for (const pt of pts) {\n',
            '            if (!pt) { started = false; continue; }\n',
            '            const pix = gcAnchorToPixel(d)(pt.x, pt.y);\n',
            '            if (!started) { ctx.moveTo(pix.x, pix.y); started = true; } else { ctx.lineTo(pix.x, pix.y); }\n',
            '        }\n',
            '        ctx.stroke();\n',
            '        ctx.restore();\n',
            '    }\n',
            '    function drawDistributionBars(d) {\n',
            '        const kmax = Math.max(0, Math.round(d.kmax));\n',
            '        const barHalfWidth = 0.35;\n',
            '        ctx.save();\n',
            '        for (let k = 0; k <= kmax; k++) {\n',
            '            let prob; try { prob = distributionPmf(d, k); } catch (e) { prob = NaN; }\n',
            '            if (!(typeof prob === \'number\' && isFinite(prob)) || prob <= 0) continue;\n',
            '            const isHi = d.highlightFrom !== null && d.highlightFrom !== undefined && d.highlightTo !== null && d.highlightTo !== undefined && k >= d.highlightFrom && k <= d.highlightTo;\n',
            '            ctx.globalAlpha = isHi ? ((d.highlightOpacity === undefined || d.highlightOpacity === null) ? 0.5 : d.highlightOpacity) : ((d.__liveOpacity === undefined || d.__liveOpacity === null) ? 1 : d.__liveOpacity);\n',
            '            ctx.fillStyle = isHi ? (d.highlightColor || \'#e07a5f\') : (d.__liveColor || __gcDefaultColor());\n',
            '            const pTop = gcAnchorToPixel(d)(k - barHalfWidth, prob);\n',
            '            const pBot = gcAnchorToPixel(d)(k + barHalfWidth, 0);\n',
            '            ctx.fillRect(Math.min(pTop.x, pBot.x), Math.min(pTop.y, pBot.y), Math.abs(pBot.x - pTop.x), Math.abs(pBot.y - pTop.y));\n',
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
            '        if (gcShouldUpdate(d)) {\n',
            '          d.__liveColor = d.colorExpr ? evaluate(d.colorExpr) : d.color;\n',
            '          d.__liveThickness = d.thicknessExpr ? evaluate(d.thicknessExpr) : d.thickness;\n',
            '        }\n',
            '        const pA = line.pA.pos, pB = line.pB.pos;\n',
            '        const posA = fieldToPixel(pA.x, pA.y);\n',
            '        const posB = fieldToPixel(pB.x, pB.y);\n',
            '        ctx.strokeStyle = d.__liveColor || line.color || __gcDefaultColor();\n',
            '        ctx.lineWidth = d.__liveThickness || line.thickness || 2;\n',
            '        ctx.setLineDash(d.pattern || [6, 6]);\n',
            '        ctx.beginPath(); ctx.moveTo(posA.x, posA.y); ctx.lineTo(posB.x, posB.y); ctx.stroke();\n',
            '        ctx.setLineDash([]);\n',
            '    }\n',
            '\n',
            '    function drawFull() {\n',
            '      try { updateFormulas(); } catch (e) { glLog(\'warn\', \'draw Formula: \' + e.message); }\n',
            '      try { updateDescription(); } catch (e) { glLog(\'warn\', \'описание: \' + e.message); }\n',
            '      ctx.clearRect(0, 0, width, height);\n',
            '      ctx.lineJoin = \'round\';\n',
              '      if (SHOW_GRID_X || SHOW_GRID_Y || SHOW_AXIS_X || SHOW_AXIS_Y || SHOW_BOUNDARY) drawSceneGridAxes();\n',
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
            '          drawRegions.length > 0 || drawLoci.length > 0 || drawTraces.length > 0 || drawFormulas.length > 0 || drawDistributions.length > 0 ||\n',
            '          drawCharts.length > 0 || drawTrees.length > 0 || drawTables.length > 0 ||\n',
            '          drawComplexes.length > 0 || drawHyperbolics.length > 0 ||\n',
            '          drawBifurcations.length > 0 || drawCobwebs.length > 0 || drawIFSs.length > 0 || drawAutomata.length > 0 || drawVoronois.length > 0 || drawFouriers.length > 0 || drawDiagrams.length > 0;\n',
            '      }\n',
            '      if (!anyVisible) {\n',
            '        ctx.fillStyle = \'#888888\';\n',
            '        ctx.font = \'18px \' + GC_FONT;\n',
            '        ctx.textAlign = \'center\';\n',
            '        ctx.textBaseline = \'middle\';\n',
            '        ctx.fillText(\'Нет активных объектов для отображения\', width/2, height/2);\n',
            '        return;\n',
            '      }\n',
            '\n',
            '      // Единая очередь отрисовки, отсортированная по layer (управление слоями, запрос #7)\n',
            '      const renderQueue = [];\n',
            '      const push = (layer, fn) => renderQueue.push({ layer: (layer === undefined || layer === null) ? 0 : layer, fn, obj: __gcQueueObj });\n',
            '\n',
            '      for (let l of lines) {\n',
            '        if (!l || !l.pA || !l.pB) continue;\n',
            '        if (!isObjectActive(l)) continue;\n',
            '        const hasPunctir = drawPunctirs.some(d => d.active && d.line === l);\n',
            '        if (hasPunctir) continue;\n',
            '        push(l.layer, () => {\n',
            '          const posA = fieldToPixel(l.pA.pos.x, l.pA.pos.y);\n',
            '          const posB = fieldToPixel(l.pB.pos.x, l.pB.pos.y);\n',
            '          if (gcShouldUpdate(l)) {\n',
            '            l.__liveColor = l.colorExpr ? evaluate(l.colorExpr) : l.color;\n',
            '            l.__liveThickness = l.thicknessExpr ? evaluate(l.thicknessExpr) : l.thickness;\n',
            '          }\n',
            '          ctx.beginPath(); ctx.moveTo(posA.x, posA.y); ctx.lineTo(posB.x, posB.y);\n',
            '          ctx.strokeStyle = l.__liveColor || __gcDefaultColor();\n',
            '          ctx.lineWidth = l.__liveThickness || 2.5;\n',
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
            // кривые — как и остальные объекты: учитываем кластер и active = выражение

            '        if (!isObjectActive(cv)) continue;\n',
            '        push(cv.layer, () => drawCurve(cv));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFunctions) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawFunctionGraph(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawSurfaces) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawSurface(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawImages) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawImageElement(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFractals) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawFractal(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawRegions) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawRegion(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawLoci) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawLocus(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawTraces) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawTrace(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawCharts) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawChart(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawTrees) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawTreeDiagram(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawTables) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawTable(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawComplexes) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawComplexDomain(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawHyperbolics) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawHyperbolic(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawBifurcations) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawBifurcation(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawCobwebs) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawCobweb(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawIFSs) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawIFS(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawAutomata) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawAutomaton(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawVoronois) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawVoronoi(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFouriers) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawFourier(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawDiagrams) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawDiagram(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFields) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawField(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawTrajectories) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawTrajectory(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawGraphs) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawGraph(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawHistograms) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawHistogram(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawFillings) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawFilling(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawDistributions) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawDistribution(d));\n',
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
            '          // update = always/event/once (+ interval) — см. gcShouldUpdate. Между\n',
            '          // обновлениями переиспользуем последний вычисленный цвет/размер, а не\n',
            '          // читаем p.color/p.size заново (те к тому же статичны при простом =var).\n',
            '          if (gcShouldUpdate(p)) {\n',
            '            p.__liveColor = p.colorExpr ? evaluate(p.colorExpr) : p.color;\n',
            '            p.__liveSize = p.sizeExpr ? evaluate(p.sizeExpr) : p.size;\n',
            '          }\n',
            '          const r = VERTEX_RADIUS * (p.__liveSize || 1);\n',
            '          const shape = p.shape || \'circle\';\n',
            // Без явного цвета: перетаскиваемая точка — акцентным цветом темы (как свободные
            // точки GeoGebra), зависимая — основным цветом.
            '          ctx.fillStyle = p.__liveColor || (p.dynamic ? __gcTheme().point : __gcDefaultColor());\n',
            // Точка — сплошная заливка с ободком цвета поля (Desmos/GeoGebra); у
            // перетаскиваемой — полупрозрачный «ореол», подсказывающий, что её можно тянуть.
            '          const rd = r * 0.78, ptCol = p.__liveColor || __gcDefaultColor();\n',
            '          if (p.dynamic && shape !== \'cross\') {\n',
            '            ctx.save(); ctx.globalAlpha *= (p === points[draggedPointIndex] && isDragging) ? 0.32 : 0.2;\n',
            '            ctx.beginPath(); ctx.arc(pos.x, pos.y, rd + 5, 0, 2 * Math.PI); ctx.fill(); ctx.restore();\n',
            '          }\n',
            '          if (shape === \'square\') {\n',
            '            ctx.fillRect(pos.x - rd, pos.y - rd, rd * 2, rd * 2);\n',
            '            ctx.strokeStyle = __gcTheme().halo; ctx.lineWidth = 2; ctx.strokeRect(pos.x - rd, pos.y - rd, rd * 2, rd * 2);\n',
            '          } else if (shape === \'cross\') {\n',
            '            ctx.strokeStyle = p.__liveColor || __gcDefaultColor(); ctx.lineWidth = Math.max(2, r * 0.5); ctx.lineCap = \'round\';\n',
            '            ctx.beginPath(); ctx.moveTo(pos.x - r, pos.y - r); ctx.lineTo(pos.x + r, pos.y + r);\n',
            '            ctx.moveTo(pos.x + r, pos.y - r); ctx.lineTo(pos.x - r, pos.y + r); ctx.stroke();\n',
            '          } else {\n',
            '            ctx.beginPath(); ctx.arc(pos.x, pos.y, rd, 0, 2*Math.PI); ctx.fill();\n',
            '            ctx.strokeStyle = __gcTheme().halo; ctx.lineWidth = 2; ctx.stroke();\n',
            '          }\n',
            '          if (p.textEnabled && p.textValue) {\n',
            '            ctx.fillStyle = p.textColor || __gcDefaultColor();\n',
            '            ctx.font = __gcLabelFont(p.textValue, 15 * (p.textSize || 1));\n',
            '            ctx.textAlign = \'center\';\n',
            // Подпись не должна обрезаться краем холста: у верхнего края она переносится
            // под точку, у боковых — сдвигается внутрь (раньше у точки, прижатой к краю,
            // подпись просто пропадала за границей).
            '            const fsz = 15 * (p.textSize || 1);\n',
            '            const tw = ctx.measureText(p.textValue).width;\n',
            '            let lx = pos.x - 10, ly = pos.y - 8 - r + VERTEX_RADIUS;\n',
            '            if (p.textDir && (p.textDir.x || p.textDir.y)) {\n',
            '              const dl = Math.hypot(p.textDir.x, p.textDir.y), off = r + 4 + fsz * 0.75;\n',
            '              lx = pos.x + p.textDir.x / dl * off; ly = pos.y - p.textDir.y / dl * off; ctx.textBaseline = \'middle\';\n',
            '              ly = Math.min(Math.max(ly, fsz / 2 + 2), height - fsz / 2 - 2);\n',
            '            } else if (ly - fsz < 2) { ctx.textBaseline = \'top\'; ly = pos.y + 8 + r - VERTEX_RADIUS; } else { ctx.textBaseline = \'bottom\'; }\n',
            '            lx = Math.min(Math.max(lx, tw / 2 + 2), width - tw / 2 - 2);\n',
            '            __gcHaloText(p.textValue, lx, ly);\n',
            '          }\n',
            '        });\n',
            '      }\n',
            '\n',
            '      for (let d of drawInfLines) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawInfLine(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawPunctirs) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawPunctir(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawVectors) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawVector(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawEqually) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        push(d.layer, () => drawEquallySing(d));\n',
            '      }\n',
            '\n',
            '      for (let d of drawAngles) {\n',
            '        if (!isObjectActive(d)) continue;\n',
            '        const angleObj = d.angle;\n',
            '        if (!angleObj) continue;\n',
            '        if (!isObjectActive(angleObj.vertex)) continue;\n',
            '        if (!isObjectActive(angleObj.line1) || !isObjectActive(angleObj.line2)) continue;\n',
            '        __gcQueueObj = d;\n',
            '        push(d.layer, () => drawAngleArc(d));\n',
            '      }\n',
            '\n',
            '      // draw Text (LaTeX-формулы уходят в отдельный DOM-оверлей поверх canvas — им нужен настоящий DOM,\n',
            '      // поэтому слой у них всегда самый верхний; обычный текст без \\( \\) / \\[ \\] рисуется прямо на canvas\n',
            '      // и полноценно участвует в общей очереди слоёв (например, может быть ниже точки).\n',
            '      const overlay = document.getElementById(\'formulaOverlay\');\n',
            '      while (overlay.firstChild) overlay.removeChild(overlay.firstChild);\n',
            '      for (let d of drawTexts) {\n',
            '        // Настройка update = always/event/once (+ update interval) — см. gcShouldUpdate.\n',
            '        // Когда обновление не требуется, переиспользуем последние вычисленные значения\n',
            '        // вместо повторного evaluate() всех живых выражений объекта.\n',
            '        if (gcShouldUpdate(d)) {\n',
            '          d.__posX = evaluate(d.posXExpr);\n',
            '          d.__posY = evaluate(d.posYExpr);\n',
            '          d.__text = evaluate(d.textExpr);\n',
            '          let c = evaluate(d.colorExpr);\n',
            '          d.__color = (c === \'default\') ? __gcDefaultColor() : c;\n',
            '          d.__size = evaluate(d.sizeExpr);\n',
            '          d.__active = evaluate(d.activeExpr);\n',
            '        }\n',
            '        const posX = d.__posX, posY = d.__posY, text = d.__text, color = d.__color, size = d.__size, active = d.__active;\n',
            '        // Скрытый кластер (например, неактивная вкладка) прячет и свой текст — раньше\n',
            '        // draw Text смотрел только на собственный active и оставался виден всегда.\n',
            '        if (!active || !isObjectActive(d)) continue;\n',
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
            '          el.style.fontFamily = GC_FONT;\n',
            '          el.style.whiteSpace = \'nowrap\';\n',
            '          try { el.innerHTML = renderKaTeX(text); } catch (e) { el.textContent = text; }\n',
            '          overlay.appendChild(el);\n',
            '        } else {\n',
            '          push(d.layer, () => {\n',
            '            const pos = fieldToPixel(posX, posY);\n',
            '            ctx.fillStyle = color || __gcDefaultColor();\n',
            '            ctx.font = (14 * (size || 1)) + \'px \' + GC_FONT;\n',
            '            ctx.textAlign = d.align || \'center\';\n',
            '            ctx.textBaseline = \'middle\';\n',
            '            __gcHaloText(text, pos.x, pos.y);\n',
            '          });\n',
            '        }\n',
            '      }\n',
            '\n',
            '      renderQueue.sort((a, b) => a.layer - b.layer);\n',
            '      const __gcHook = window.__gcDrawHook;\n',
            '      for (let item of renderQueue) {\n',
            '        const o = item.obj, sh = o && (o.shift || __gcShifts[o.name]);\n',
            '        if (__gcHook) __gcHook(o, true);\n',
            '        // shift = (dx, dy) — сдвиг отрисовки объекта в единицах поля (любой тип)\n',
            '        if (sh) { const s = fieldScale(); ctx.save(); ctx.translate(sh[0] * s, -sh[1] * s); item.fn(); ctx.restore(); }\n',
            '        else item.fn();\n',
            '      }\n',
            '      if (__gcHook) __gcHook(null, false);\n',
            '    }\n',
            '\n',
            '    // ---- Задача 4: офскрин-буфер сцены + флаги dirty ----\n',
            '    let sceneSnapshot = null;\n',
            '    let sceneChangedThisFrame = true;\n',
            '    function markDirty(obj) { if (obj) obj.dirty = true; }\n',
            '    function markSceneChanged() { sceneChangedThisFrame = true; window.__gcEventTick = (window.__gcEventTick || 0) + 1; }\n',
            '    function gcShouldUpdate(obj) {\n',
            '      if (!obj.__gcUpdateInit) {\n',
            '        obj.__gcUpdateInit = true;\n',
            '        obj.__updatedOnce = false;\n',
            '        obj.__lastEventTick = -1;\n',
            '        obj.__lastUpdateMs = -Infinity;\n',
            '        return true;\n',
            '      }\n',
            '      const mode = obj.updateMode || \'always\';\n',
            '      if (mode === \'once\') return false;\n',
            '      const interval = obj.updateInterval;\n',
            '      if (typeof interval === \'number\' && interval > 0) {\n',
            '        const now = (typeof performance !== \'undefined\' && performance.now) ? performance.now() : Date.now();\n',
            '        if (now - obj.__lastUpdateMs < interval * 1000) return false;\n',
            '        obj.__lastUpdateMs = now;\n',
            '      }\n',
            '      if (mode === \'event\') {\n',
            '        const tick = window.__gcEventTick || 0;\n',
            '        if (tick === obj.__lastEventTick) return false;\n',
            '        obj.__lastEventTick = tick;\n',
            '        return true;\n',
            '      }\n',
            '      return true;\n',
            '    }\n',
            '    // ---- Анимация ----\n',
            '    // animate(имяПеременной, значениеДо, длительностьСек, easing, задержкаСек, режим) запускает\n',
            '    // плавное изменение ЛЮБОЙ числовой глобальной переменной от текущего значения к целевому.\n',
            '    // Поскольку почти все параметры объектов (color/radius/thickness/opacity и т.п. — см. правки\n',
            '    // "живых" полей) сами читают значение переменной каждый кадр через evaluate(), анимация\n',
            '    // переменной автоматически анимирует ЛЮБОЕ поле, которое от неё зависит — отдельно\n',
            '    // помечать элементы не нужно. animateColor — то же самое, но для #hex-цвета (плавная\n',
            '    // интерполяция по каналам RGB, а не как число). Тикает независимо от наличия Update{} —\n',
            '    // см. gcStartAnimLoop ниже.\n',
            '    window.__gcAnimations = window.__gcAnimations || {};\n',
            '    function gcEase(name, t) {\n',
            '      switch (name) {\n',
            '        case \'linear\': return t;\n',
            '        case \'easeInQuad\': return t * t;\n',
            '        case \'easeOutQuad\': return 1 - (1 - t) * (1 - t);\n',
            '        case \'easeInOutQuad\': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;\n',
            '        case \'easeInCubic\': return t * t * t;\n',
            '        case \'easeOutCubic\': return 1 - Math.pow(1 - t, 3);\n',
            '        case \'easeInOutCubic\': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;\n',
            '        case \'easeInElastic\': { if (t === 0 || t === 1) return t; const c4 = (2 * Math.PI) / 3; return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4); }\n',
            '        case \'easeOutElastic\': { if (t === 0 || t === 1) return t; const c4 = (2 * Math.PI) / 3; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; }\n',
            '        case \'easeOutBounce\': {\n',
            '          const n1 = 7.5625, d1 = 2.75;\n',
            '          if (t < 1 / d1) return n1 * t * t;\n',
            '          else if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }\n',
            '          else if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }\n',
            '          else { t -= 2.625 / d1; return n1 * t * t + 0.984375; }\n',
            '        }\n',
            '        case \'easeInBounce\': return 1 - gcEase(\'easeOutBounce\', 1 - t);\n',
            '        case \'easeInBack\': { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; }\n',
            '        case \'easeOutBack\': { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }\n',
            '        default: return t;\n',
            '      }\n',
            '    }\n',
            '    function gcHexToRgbAnim(hex) {\n',
            '      hex = String(hex || \'#000000\').replace(\'#\', \'\');\n',
            '      if (hex.length === 3) hex = hex.split(\'\').map(function(c) { return c + c; }).join(\'\');\n',
            '      const num = parseInt(hex, 16) || 0;\n',
            '      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };\n',
            '    }\n',
            '    function gcRgbToHexAnim(r, g, b) {\n',
            '      const c = (Math.max(0, Math.min(255, Math.round(r))) << 16) | (Math.max(0, Math.min(255, Math.round(g))) << 8) | Math.max(0, Math.min(255, Math.round(b)));\n',
            '      return \'#\' + (\'000000\' + c.toString(16)).slice(-6);\n',
            '    }\n',
            '    function glAnimate(varName, to, duration, easing, delay, mode) {\n',
            '      const cur = window[varName];\n',
            '      const durationVal = Math.max(0.0001, (duration === undefined || duration === null) ? 1 : duration);\n',
            '      const common = { elapsed: 0, duration: durationVal, delay: Math.max(0, delay || 0), easing: easing || \'linear\', mode: mode || \'once\', done: false };\n',
            '      // Единая animate() сама определяет по типу целевого значения, что анимировать:\n',
            '      // #hex-строка -> плавная интерполяция по каналам RGB, число -> обычная числовая\n',
            '      // интерполяция. Отдельной animateColor() больше нет — не нужно помнить, какую из\n',
            '      // двух функций вызывать для какого поля.\n',
            '      if (typeof to === \'string\' && to.charAt(0) === \'#\') {\n',
            '        const fromHex = (typeof cur === \'string\' && cur.charAt(0) === \'#\') ? cur : to;\n',
            '        window.__gcAnimations[varName] = Object.assign({ isColor: true, fromRgb: gcHexToRgbAnim(fromHex), toRgb: gcHexToRgbAnim(to) }, common);\n',
            '      } else {\n',
            '        const from = (typeof cur === \'number\' && isFinite(cur)) ? cur : 0;\n',
            '        window.__gcAnimations[varName] = Object.assign({ isColor: false, from: from, to: to }, common);\n',
            '      }\n',
            '      gcStartAnimLoop();\n',
            '    }\n',
            '    function glStopAnimation(varName) { delete window.__gcAnimations[varName]; }\n',
            '    function glIsAnimating(varName) { const a = window.__gcAnimations[varName]; return !!(a && !a.done); }\n',
            '    function glAnimationProgress(varName) {\n',
            '      const a = window.__gcAnimations[varName];\n',
            '      if (!a) return 0;\n',
            '      return Math.max(0, Math.min(1, (a.elapsed - a.delay) / a.duration));\n',
            '    }\n',
            '    function gcHasActiveAnimations() {\n',
            '      for (const k in window.__gcAnimations) { if (!window.__gcAnimations[k].done) return true; }\n',
            '      return false;\n',
            '    }\n',
            '    function gcTickAnimations(dt) {\n',
            '      for (const key in window.__gcAnimations) {\n',
            '        const a = window.__gcAnimations[key];\n',
            '        if (a.done) continue;\n',
            '        a.elapsed += dt;\n',
            '        if (a.elapsed < a.delay) continue;\n',
            '        let t = (a.elapsed - a.delay) / a.duration;\n',
            '        let finished = t >= 1;\n',
            '        t = Math.max(0, Math.min(1, t));\n',
            '        const eased = gcEase(a.easing, t);\n',
            '        if (a.isColor) {\n',
            '          const r = a.fromRgb.r + (a.toRgb.r - a.fromRgb.r) * eased;\n',
            '          const g = a.fromRgb.g + (a.toRgb.g - a.fromRgb.g) * eased;\n',
            '          const b = a.fromRgb.b + (a.toRgb.b - a.fromRgb.b) * eased;\n',
            '          window[key] = gcRgbToHexAnim(r, g, b);\n',
            '        } else {\n',
            '          window[key] = a.from + (a.to - a.from) * eased;\n',
            '        }\n',
            '        if (finished) {\n',
            '          if (a.mode === \'loop\') { a.elapsed = a.delay; }\n',
            '          else if (a.mode === \'yoyo\') {\n',
            '            a.elapsed = a.delay;\n',
            '            if (a.isColor) { const tmp = a.fromRgb; a.fromRgb = a.toRgb; a.toRgb = tmp; }\n',
            '            else { const tmp = a.from; a.from = a.to; a.to = tmp; }\n',
            '          } else { a.done = true; }\n',
            '        }\n',
            '      }\n',
            '      markSceneChanged();\n',
            '    }\n',
            '    let __gcAnimLoopRunning = false;\n',
            '    let __gcLastFrameTime = null;\n',
            '    function gcStartAnimLoop() {\n',
            '      if (__gcAnimLoopRunning) return;\n',
            '      __gcAnimLoopRunning = true;\n',
            '      runUpdate();\n',
            '    }\n',
            '    // UI-контролы — это DOM-элементы, а не то, что рисуется на canvas, поэтому их\n',
            '    // видимость нужно синхронизировать отдельно (а не просто внутри drawFull) —\n',
            '    // вызывается из draw() при каждой перерисовке, чтобы кластер/activeExpr/active,\n',
            '    // изменившиеся в Update()/от кнопки, сразу отражались на видимости самих контролов.\n',
            '    function syncUIVisibility() {\n',
            '      for (const ui of uiData) {\n',
            '        if (!ui._wrapper) continue;\n',
            '        ui._wrapper.style.display = isObjectActive(ui) ? \'\' : \'none\';\n',
            '        if (ui.maxExpr && ui._input) {\n',
            '          let mx; try { mx = Number(evaluate(ui.maxExpr)); } catch (e) { mx = NaN; }\n',
            '          if (isFinite(mx) && String(mx) !== ui._input.max) {\n',
            '            ui._input.max = mx;\n',
            '            const cur = Number(userVars[ui.variable]);\n',
            '            if (cur > mx) { userVars[ui.variable] = mx; }\n',
            '            ui._input.value = userVars[ui.variable];\n',
            '            if (ui._input.nextSibling) ui._input.nextSibling.textContent = String(userVars[ui.variable]); if (ui._fill) ui._fill();\n',
            '          }\n',
            '        }\n',
            '      }\n',
            '    }\n',
            '\n',
            '    function draw() {\n',
            '      if (window.__gcStepTransitionActive) return;\n',
            // Пока точку тянут, а в сценарии есть Update (ограничения, привязки), кадр рисует
            // только цикл runUpdate — после Update. Иначе событие мыши успевало нарисовать точку
            // в «свободном» положении, и она казалась двигающейся мимо своей прямой/кривой.
            '      if (window.__gcDeferDraw && isDragging && hasUpdateBlock && window.autoRedraw !== false && !(draggedPointIndex !== -1 && points[draggedPointIndex] && points[draggedPointIndex].pauseOnDrag !== false)) { sceneChangedThisFrame = true; return; }\n',
              '    try {\n',
            '      syncUIVisibility();\n',
            '      const stale = !sceneSnapshot || sceneSnapshot.width !== canvas.width || sceneSnapshot.height !== canvas.height;\n',
            '      const needsFull = isDragging || sceneChangedThisFrame || stale;\n',
            '      if (!needsFull) {\n',
            '        ctx.clearRect(0, 0, width, height);\n',
            '        ctx.drawImage(sceneSnapshot, 0, 0, width, height);\n',
            '        return;\n',
            '      }\n',
            '      drawFull();\n',
            '      if (stale) {\n',
            '        sceneSnapshot = document.createElement(\'canvas\');\n',
            '        sceneSnapshot.width = canvas.width; sceneSnapshot.height = canvas.height;\n',
            '      }\n',
            '      const snapCtx = sceneSnapshot.getContext(\'2d\');\n',
            '      snapCtx.clearRect(0, 0, sceneSnapshot.width, sceneSnapshot.height);\n',
            '      snapCtx.drawImage(canvas, 0, 0);\n',
            '      drawSnapGuides();\n',
            '      sceneChangedThisFrame = false;\n',
              '    } catch (err) {\n',
              '      console.error(\'Ошибка при отрисовке:\', err);\n',
              '      try { ctx.clearRect(0, 0, width, height); } catch (e2) {}\n',
              '    }\n',
            '    }\n',
            '\n',
            '    // ===== Проф-режим: переключение шагов (кластеры с полем step) =====\n',
            '    // Строго снаружи: никаких кнопок/стрелочек внутри этой сцены нет — переключение\n',
            '    // приходит снаружи через postMessage (аккордеон описания темы типа "доказательство").\n',
            '    // Переход между шагами анимируется на уровне битмапов холста (снимок "до" и "после"),\n',
            '    // а не поля-в-поле через opacity каждого объекта — это работает одинаково для ЛЮБОГО\n',
            '    // содержимого сцены (точки/фигуры/графики/таблицы и т.д.), без необходимости добавлять\n',
            '    // opacity в каждый тип объекта.\n',
            '    window.__gcCurrentStep = (typeof window.__gcCurrentStep === \'number\') ? window.__gcCurrentStep : (function() {\n',
            '      let min = null;\n',
            '      for (const c0 of clustersData) { if (c0.step !== undefined && c0.step !== null) { if (min === null || c0.step < min) min = c0.step; } }\n',
            '      return min === null ? 1 : min;\n',
            '    })();\n',
            '    window.__gcStepTransitionActive = false;\n',
            '    let __gcStepTransRAF = null;\n',
            '    function __gcCaptureCanvasSnapshot() {\n',
            '      try {\n',
            '        const c = document.createElement(\'canvas\');\n',
            '        c.width = canvas.width; c.height = canvas.height;\n',
            '        c.getContext(\'2d\').drawImage(canvas, 0, 0);\n',
            '        return c;\n',
            '      } catch (e) { return null; }\n',
            '    }\n',
            '    function __gcRunStepTransition(before, after, animName, durationSec) {\n',
            '      const duration = Math.max(0.01, durationSec || 0.6) * 1000;\n',
            '      const start = performance.now();\n',
            '      window.__gcStepTransitionActive = true;\n',
            '      function frame(now) {\n',
            '        const t = Math.max(0, Math.min(1, (now - start) / duration));\n',
            '        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;\n',
            '        ctx.save();\n',
            '        ctx.clearRect(0, 0, width, height);\n',
            '        if (animName === \'slide\') {\n',
            '          const w = width;\n',
            '          ctx.globalAlpha = 1;\n',
            '          if (before) ctx.drawImage(before, -w * eased, 0, width, height);\n',
            '          if (after) ctx.drawImage(after, w * (1 - eased), 0, width, height);\n',
            '        } else if (animName === \'scale\') {\n',
            '          if (before) { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - eased); ctx.translate(width / 2, height / 2); ctx.scale(1 - eased, 1 - eased); ctx.translate(-width / 2, -height / 2); ctx.drawImage(before, 0, 0, width, height); ctx.restore(); }\n',
            '          if (after) { ctx.save(); ctx.globalAlpha = Math.max(0, eased); ctx.translate(width / 2, height / 2); ctx.scale(eased, eased); ctx.translate(-width / 2, -height / 2); ctx.drawImage(after, 0, 0, width, height); ctx.restore(); }\n',
            '        } else {\n',
            '          ctx.globalAlpha = 1;\n',
            '          if (before) ctx.drawImage(before, 0, 0, width, height);\n',
            '          ctx.globalAlpha = eased;\n',
            '          if (after) ctx.drawImage(after, 0, 0, width, height);\n',
            '        }\n',
            '        ctx.restore();\n',
            '        if (t < 1) { __gcStepTransRAF = requestAnimationFrame(frame); }\n',
            '        else { window.__gcStepTransitionActive = false; __gcStepTransRAF = null; draw(); }\n',
            '      }\n',
            '      if (__gcStepTransRAF) cancelAnimationFrame(__gcStepTransRAF);\n',
            '      __gcStepTransRAF = requestAnimationFrame(frame);\n',
            '    }\n',
            '    function gcSetStep(step) {\n',
            '      if (step === undefined || step === null) return;\n',
            '      if (step === window.__gcCurrentStep) return;\n',
            '      const before = __gcCaptureCanvasSnapshot();\n',
            '      window.__gcCurrentStep = step;\n',
            '      figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform);\n',
            '      updateScene(); window.__gcStepTransitionActive = false; draw();\n',
            '      if (gcStepAnimation === \'none\' || !gcStepDuration || gcStepDuration <= 0) return;\n',
            '      const after = __gcCaptureCanvasSnapshot();\n',
            '      __gcRunStepTransition(before, after, gcStepAnimation, gcStepDuration);\n',
            '    }\n',
            '    // ===== new Publish{} — чистый канал вывода значений наружу =====\n',
            '    // Каждый вызов updateScene() пересчитывает все опубликованные выражения через тот же\n',
            '    // evaluate(), который используют подстановки в description — один и тот же язык\n',
            '    // выражений всюду. postMessage шлёт только при РЕАЛЬНОй смене значения\n',
            '    // (числовое — с малым эпсилон, любое другое — по strict-равенству), не на каждом кадре.\n',
            '    window.__gcPublished = window.__gcPublished || {};\n',
            '    var __gcPublishReady = false; // взводится ПОСЛЕ регистрации именованных объектов на window\n',
            '    function gcPublishTick() {\n',
            '      if (!__gcPublishReady || !publishData || !publishData.length) return;\n',
            '      for (var __pi = 0; __pi < publishData.length; __pi++) {\n',
            '        var __p = publishData[__pi];\n',
            '        var __v;\n',
            '        try { __v = evaluate(__p.expr); } catch (e) { continue; }\n',
            '        var __prev = window.__gcPublished[__p.name];\n',
            '        var __changed = (__prev === undefined) ||\n',
            '          (typeof __v === \'number\' && typeof __prev === \'number\' ? Math.abs(__v - __prev) > 1e-9 : __v !== __prev);\n',
            '        if (!__changed) continue;\n',
            '        window.__gcPublished[__p.name] = __v;\n',
            '        try { window.parent.postMessage({ type: \'gms-var\', name: __p.name, value: __v }, \'*\'); } catch (e) {}\n',
            '      }\n',
            '    }\n',
            '    window.gcSetStep = gcSetStep;\n',
            '\n',
            '    // ===== DRAG & DROP =====\n',
            '    let dragMode = null;\n',
            '    let draggedGraphNode = null;\n',
            '    let draggedChartBar = null;\n',
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
            '        const scaleX = width / rect.width;\n',
            '        const scaleY = height / rect.height;\n',
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
            '    // ---- Ввод: клавиатура, клики мышью и касания (позиция в координатах поля),\n',
            '    // тип устройства. Отдельные обработчики, не связанные с перетаскиванием точек/UI,\n',
            '    // чтобы не трогать хрупкую логику onPointerDown/Move/Up — просто читают события\n',
            '    // параллельно. Значения читаются как обычные переменные (mouseX, isKeyDown(...) и\n',
            '    // т.п.) из Start/Update/draw Text, т.к. пишутся в window.\n',
            '    window.deviceType = IS_TOUCH_DEVICE ? \'mobile\' : \'desktop\';\n',
            '    window.mouseX = 0; window.mouseY = 0; window.mouseDown = false;\n',
            '    window.mouseClickX = 0; window.mouseClickY = 0; window.mouseClickCount = 0;\n',
            '    window.touchX = 0; window.touchY = 0; window.touchActive = false; window.touchCount = 0;\n',
            '    window.lastKey = \'\'; window.keyPressCount = 0;\n',
            '    window.__gcKeysDown = window.__gcKeysDown || new Set();\n',
            '    const __gcKeysDown = window.__gcKeysDown;\n',
            '    canvas.addEventListener(\'mousemove\', function(e) {\n',
            '        const pos = getPointerPos(e);\n',
            '        const f = pixelToField(pos.x, pos.y);\n',
            '        window.mouseX = f.x; window.mouseY = f.y;\n',
            '    });\n',
            '    canvas.addEventListener(\'mousedown\', function(e) { window.mouseDown = true; });\n',
            '    window.addEventListener(\'mouseup\', function(e) { window.mouseDown = false; });\n',
            '    canvas.addEventListener(\'click\', function(e) {\n',
            '        const pos = getPointerPos(e);\n',
            '        const f = pixelToField(pos.x, pos.y);\n',
            '        window.mouseClickX = f.x; window.mouseClickY = f.y; window.mouseClickCount++;\n',
            '    });\n',
            '    canvas.addEventListener(\'touchstart\', function(e) {\n',
            '        const pos = getPointerPos(e);\n',
            '        const f = pixelToField(pos.x, pos.y);\n',
            '        window.touchX = f.x; window.touchY = f.y; window.touchActive = true; window.touchCount++;\n',
            '    }, { passive: true });\n',
            '    canvas.addEventListener(\'touchmove\', function(e) {\n',
            '        const pos = getPointerPos(e);\n',
            '        const f = pixelToField(pos.x, pos.y);\n',
            '        window.touchX = f.x; window.touchY = f.y;\n',
            '    }, { passive: true });\n',
            '    window.addEventListener(\'touchend\', function(e) { if (!e.touches || e.touches.length === 0) window.touchActive = false; });\n',
            '    window.addEventListener(\'touchcancel\', function(e) { if (!e.touches || e.touches.length === 0) window.touchActive = false; });\n',
            '    window.addEventListener(\'keydown\', function(e) {\n',
            '        __gcKeysDown.add(e.key.toLowerCase());\n',
            '        window.lastKey = e.key; window.keyPressCount++;\n',
            '    });\n',
            '    window.addEventListener(\'keyup\', function(e) { __gcKeysDown.delete(e.key.toLowerCase()); });\n',
            '    function __gcIsKeyDown(key) { return __gcKeysDown.has(String(key).toLowerCase()); }\n',
            '\n',
            '    // draw Table { interactive = true } — редактирование ячейки кликом. Только один\n',            '    // редактор открыт одновременно: открытие нового закрывает (и фиксирует) предыдущий,\n',            '    // иначе при быстром переключении между ячейками старое поле осталось бы висеть в DOM.\n',            '    let gcActiveTableEditor = null;\n',            '    function gcCommitTableEditor() {\n',            '        if (!gcActiveTableEditor) return;\n',            '        const { input, d, r, c } = gcActiveTableEditor;\n',            '        const raw = input.value.trim();\n',            '        const num = Number(raw);\n',            '        d._editable[r][c] = (raw !== \'\' && isFinite(num)) ? num : raw;\n',            '        if (input.parentNode) input.parentNode.removeChild(input);\n',            '        gcActiveTableEditor = null;\n',            '        markSceneChanged(); draw();\n',            '    }\n',            '    function gcCancelTableEditor() {\n',            '        if (!gcActiveTableEditor) return;\n',            '        const { input } = gcActiveTableEditor;\n',            '        if (input.parentNode) input.parentNode.removeChild(input);\n',            '        gcActiveTableEditor = null;\n',            '    }\n',            '    function gcOpenTableCellEditor(d, cell) {\n',            '        gcCommitTableEditor();\n',            '        const input = document.createElement(\'input\');\n',            '        input.type = \'text\';\n',            '        input.className = \'gc-table-cell-editor\';\n',            '        input.value = String(d._editable[cell.r][cell.c]);\n',            '        input.style.cssText = \'position:absolute; left:\' + cell.x + \'px; top:\' + cell.y + \'px; \' +\n',            '            \'width:\' + cell.w + \'px; height:\' + cell.h + \'px; box-sizing:border-box; \' +\n',            '            \'font:\' + Math.max(9, 13 * (d.fontSize || 1)) + \'px sans-serif; text-align:center; \' +\n',            '            \'pointer-events:auto; border:2px solid #4a90d9; z-index:20;\';\n',            '        input.addEventListener(\'keydown\', function(ev) {\n',            '            if (ev.key === \'Enter\') { ev.preventDefault(); gcCommitTableEditor(); }\n',            '            else if (ev.key === \'Escape\') { ev.preventDefault(); gcCancelTableEditor(); }\n',            '            ev.stopPropagation();\n',            '        });\n',            '        input.addEventListener(\'blur\', gcCommitTableEditor);\n',            '        input.addEventListener(\'mousedown\', function(ev) { ev.stopPropagation(); });\n',            '        uiOverlay.appendChild(input);\n',            '        gcActiveTableEditor = { input: input, d: d, r: cell.r, c: cell.c };\n',            '        input.focus(); input.select();\n',            '    }\n',            '\n',            '    function onPointerDown(e) {\n',
              '      try {\n',
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
            // Многоугольник (3+ вершины) ловится по самому контуру, а не по описанному
            // прямоугольнику: раньше у наклонной фигуры (параллелограмм, треугольник)
            // перетаскивание целиком срабатывало и на пустом месте СНАРУЖИ неё.
            '            let insideFig;\n',
            '            if (fig.points.length >= 3) {\n',
            '                insideFig = false;\n',
            '                const poly = fig.points.map(fp => fieldToPixel(fp.pos.x, fp.pos.y));\n',
            '                for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {\n',
            '                    if (((poly[a].y > pos.y) !== (poly[b].y > pos.y)) && (pos.x < (poly[b].x - poly[a].x) * (pos.y - poly[a].y) / (poly[b].y - poly[a].y) + poly[a].x)) insideFig = !insideFig;\n',
            '                }\n',
            '            } else {\n',
            '                insideFig = pos.x >= left && pos.x <= right && pos.y >= top && pos.y <= bottom;\n',
            '            }\n',
            '            if (insideFig) {\n',
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
            '        // draw Graph { interactive = true } — перетаскивание узлов. drawGraphs (мутируемая\n',
            '        // покадровая копия drawGraphsData) уже построен к этому моменту в initDrawGraphs(),\n',
            '        // поэтому хит-тест идёт прямо по нему: обходим активные интерактивные графы и их\n',
            '        // узлы, сравнивая экранную позицию узла (fieldToPixel от g.nodes[key].pos) с курсором.\n',
            '        for (const gd of drawGraphs) {\n',
            '            if (gd.dim !== \'2D\' || !gd.interactive) continue;\n',
            '            if (gd.activeExpr === \'false\') continue;\n',
            '            const g = window[gd.graphVar];\n',
            '            if (!g || !g.nodes) continue;\n',
            '            const R = gd.nodeRadius === undefined ? 9 : gd.nodeRadius;\n',
            '            for (const key in g.nodes) {\n',
            '                const node = g.nodes[key];\n',
            '                if (!node || !node.pos) continue;\n',
            '                const np = gcAnchorToPixel(gd)(node.pos[0], node.pos[1]);\n',
            '                const dx = pos.x - np.x, dy = pos.y - np.y;\n',
            '                if (dx * dx + dy * dy > Math.max(R, HIT_THRESHOLD * 0.7) * Math.max(R, HIT_THRESHOLD * 0.7)) continue;\n',
            '                dragMode = \'graphNode\';\n',
            '                draggedGraphNode = { graph: g, key: key, def: gd };\n',
            '                isDragging = true;\n',
            '                return;\n',
            '            }\n',
            '        }\n',
            '        // draw Table { interactive = true } — клик по ячейке. _cellRects заполняется\n',            '        // самим drawTable() на каждом кадре только для интерактивных таблиц, поэтому\n',            '        // порядок такой же, как у графа: сначала пробуем найти ячейку под курсором.\n',            '        for (const td of drawTables) {\n',            '            if (!td.interactive || td.dim !== \'2D\' || !td._cellRects) continue;\n',            '            if (!isObjectActive(td)) continue;\n',            '            for (const cell of td._cellRects) {\n',            '                if (pos.x < cell.x || pos.x > cell.x + cell.w || pos.y < cell.y || pos.y > cell.y + cell.h) continue;\n',            '                gcOpenTableCellEditor(td, cell);\n',            '                return;\n',            '            }\n',            '        }\n',            '        // draw Chart { type = bar; interactive = true } — перетаскивание столбца. _barRects\n',
            '        // заполняется drawChartBar() на каждом кадре только для интерактивных bar-диаграмм.\n',
            '        for (const cd of drawCharts) {\n',
            '            if (!cd.interactive || cd.type !== \'bar\' || cd.dim !== \'2D\' || !cd._barRects) continue;\n',
            '            if (!isObjectActive(cd)) continue;\n',
            '            for (const bar of cd._barRects) {\n',
            '                const top = bar.baseline - bar.H, bottom = bar.baseline;\n',
            '                if (pos.x < bar.x || pos.x > bar.x + bar.w) continue;\n',
            '                if (pos.y < Math.min(top, bottom) - 10 || pos.y > Math.max(top, bottom) + 10) continue;\n',
            '                dragMode = \'chartBar\';\n',
            '                draggedChartBar = { chart: cd, i: bar.i };\n',
            '                isDragging = true;\n',
            '                return;\n',
            '            }\n',
            '        }\n',
            '\n',            '        // Ни одна точка/линия/фигура/кластер не задета — на телефоне одним пальцем\n',
            '        // по пустому месту панорамируем камеру (второй рукой такого модификатора нет).\n',
            '        if (e.touches && e.touches.length === 1 && CAMERA_TYPE_2D !== \'fixed\') {\n',
            '            isPanning = true;\n',
            '            panStartPixel = pos;\n',
            '            panStartOffset = { x: camera.offsetX, y: camera.offsetY };\n',
            '        }\n',
              '      } catch (err) {\n',
              '        console.error(\'Ошибка при начале перетаскивания:\', err);\n',
              '        dragMode = null; dragTarget = null; draggedPointIndex = -1; isDragging = false;\n',
              '      }\n',
            '    }\n',
            '\n',
            '    function clampFieldPoint(pos) {\n',
            '        const hw = gcFieldHalfW(), hh = gcFieldHalfH();\n',
            '        pos.x = Math.min(Math.max(pos.x, -hw), hw);\n',
            '        pos.y = Math.min(Math.max(pos.y, -hh), hh);\n',
            '    }\n',
            '\n',
            '    function checkCollisionAt(collider, pos) {\n',
            '      const margin = collider.collisionMargin || 0;\n',
            '      if (collider.collideWithPoints) {\n',
            '        for (let other of points) {\n',
            '          if (!other || other === collider || !other.pos || other.hidden) continue;\n',
            '          if (other.collision === false || other.collideWithPoints === false) continue;\n',
            '          if (!canCollideWith(collider, other)) continue;\n',
            '          if (distance(pos, other.pos) < gcPairSep(collider, other) + margin + (other.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithLines) {\n',
            '        for (let l of lines) {\n',
            '          if (l.collision === false) continue;\n',
            '          if (!canCollideWith(collider, l)) continue;\n',
            '          const c = closestPointOnSegment(pos, l.pA.pos, l.pB.pos);\n',
            '          if (distance(pos, c) < gcPointRadiusField(collider) + margin + (l.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithCircles) {\n',
            '        for (let c of circles) {\n',
            '          if (c.collision === false || !c.center) continue;\n',
            '          if (!canCollideWith(collider, c)) continue;\n',
            '          const cc = closestPointOnCircleBoundary(pos, c.center, c.radius);\n',
            '          if (distance(pos, cc) < gcPointRadiusField(collider) + margin + (c.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithEllipses) {\n',
            '        for (let e of ellipses) {\n',
            '          if (e.collision === false) continue;\n',
            '          if (!canCollideWith(collider, e)) continue;\n',
            '          const cc = closestPointOnEllipseBoundary(pos, e);\n',
            '          if (cc && distance(pos, cc) < gcPointRadiusField(collider) + margin + (e.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      if (collider.collideWithArcs) {\n',
            '        for (let a of arcs) {\n',
            '          if (a.collision === false) continue;\n',
            '          if (!canCollideWith(collider, a)) continue;\n',
            '          const cc = closestPointOnArcBoundary(pos, a);\n',
            '          if (cc && distance(pos, cc) < gcPointRadiusField(collider) + margin + (a.collisionMargin || 0)) return true;\n',
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
            '          if (c && distance(pos, c) < gcPointRadiusField(collider) + margin + (cv.collisionMargin || 0)) return true;\n',
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
            '          if (cc && distance(pos, cc) < gcPointRadiusField(collider) + margin + (f.collisionMargin || 0)) return true;\n',
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
            '          if (cc && distance(pos, cc) < gcPointRadiusField(collider) + margin + (c.collisionMargin || 0)) return true;\n',
            '        }\n',
            '      }\n',
            '      return false;\n',
            '    }\n',
            '    function objectViolatesCollision(collider, testPoints) {\n',
            '      if (collider.collision === false || window.collisionsEnabled === false) return false;\n',
            '      return testPoints.some(pos => checkCollisionAt(collider, pos));\n',
            '    }\n',
            '\n',
            '    // Точки на линии/окружности/кривой/графике/дуге раньше при столкновении просто\n',
            '    // "замирали" на месте (весь шаг перетаскивания целиком отклонялся), из-за чего\n',
            '    // движение мышью выглядело дёргано — любой мелкий шаг мыши рядом с препятствием\n',
            '    // отклонялся целиком, а не только та его часть, что реально уходит за препятствие.\n',
            '    // posFromT(t) — функция, вычисляющая позицию точки при заданном параметре t (или\n',
            '    // null, если позиция в этой точке параметра не определена). Ищем методом бисекции\n',
            '    // наибольшее t между старым (заведомо допустимым) и новым (желаемым, из позиции\n',
            '    // мыши) значением, при котором позиция ещё не сталкивается — т.е. точка плавно\n',
            '    // скользит вдоль своей кривой/линии/окружности до самого препятствия и там\n',
            '    // останавливается, а не замирает заранее и не "прилипает".\n',
            // Точка на объекте (прямая/окружность/кривая/график/дуга) тоже не выходит за поле:
            // раньше, например, точку на графике y = |x| можно было увести далеко за верхний
            // край. Граница — та же, что у обычных точек (с отступом в радиус точки).
            '    function gcOutOfFieldPos(p, q) {\n',
            '      if (p && p.collideWithBoundary === false) return false;\n',
            '      return Math.abs(q.x) > gcFieldHalfW() + 1e-9 || Math.abs(q.y) > gcFieldHalfH() + 1e-9;\n',
            '    }\n',
            '    function slideTAvoidingCollision(p, oldT, newT, posFromT) {\n',
            '      const newPos = posFromT(newT);\n',
            '      if (newPos && !objectViolatesCollision(p, [newPos]) && !gcOutOfFieldPos(p, newPos)) return { t: newT, pos: newPos };\n',
            '      const oldPos = posFromT(oldT);\n',
            '      if (!oldPos || objectViolatesCollision(p, [oldPos]) || gcOutOfFieldPos(p, oldPos)) return null;\n',
            '      let lo = oldT, hi = newT, loPos = oldPos;\n',
            '      for (let iter = 0; iter < 20; iter++) {\n',
            '        const mid = (lo + hi) / 2;\n',
            '        const midPos = posFromT(mid);\n',
            '        if (midPos && !objectViolatesCollision(p, [midPos]) && !gcOutOfFieldPos(p, midPos)) { lo = mid; loPos = midPos; } else { hi = mid; }\n',
            '      }\n',
            '      return { t: lo, pos: loPos };\n',
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
            '            const overLeft = -gcFieldHalfW() - p.pos.x;\n',
            '            if (overLeft > 0 && overLeft > minDx) minDx = overLeft;\n',
            '            const overRight = p.pos.x - gcFieldHalfW();\n',
            '            if (overRight > 0 && overRight > maxDx) maxDx = overRight;\n',
            '            const overBottom = -gcFieldHalfH() - p.pos.y;\n',
            '            if (overBottom > 0 && overBottom > minDy) minDy = overBottom;\n',
            '            const overTop = p.pos.y - gcFieldHalfH();\n',
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
            '            const overLeft = -gcFieldHalfW() - p.pos.x;\n',
            '            if (overLeft > 0 && overLeft > minDx) minDx = overLeft;\n',
            '            const overRight = p.pos.x - gcFieldHalfW();\n',
            '            if (overRight > 0 && overRight > maxDx) maxDx = overRight;\n',
            '            const overBottom = -gcFieldHalfH() - p.pos.y;\n',
            '            if (overBottom > 0 && overBottom > minDy) minDy = overBottom;\n',
            '            const overTop = p.pos.y - gcFieldHalfH();\n',
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
            '            function candidatePos(s) {\n',
            '                const pos = { x: oldPos.x + proj * s * normX, y: oldPos.y + proj * s * normY };\n',
            '                clampFieldPoint(pos);\n',
            '                for (let p of points) { if (p === targetPoint) continue; if (distance(pos, p.pos) < MIN_DIST) return null; }\n',
            '                if (distance(pos, vertex.pos) < MIN_DIST) return null;\n',
            '                return pos;\n',
            '            }\n',
            '            // См. moveLockedAngle: раньше столкновение отменяло весь шаг целиком (точка\n',
            '            // "замирала" при первом же мелком шаге рядом с препятствием) — теперь бисекцией\n',
            '            // находим наибольшую долю проекции, при которой позиция ещё допустима, и точка\n',
            '            // плавно скользит вдоль стороны угла до препятствия, а не прилипает/дёргается.\n',
            '            let cand = candidatePos(1);\n',
            '            if (!cand) {\n',
            '                let lo = 0, hi = 1, loCand = null;\n',
            '                for (let iter = 0; iter < 20; iter++) {\n',
            '                    const mid = (lo + hi) / 2;\n',
            '                    const c = candidatePos(mid);\n',
            '                    if (c) { lo = mid; loCand = c; } else { hi = mid; }\n',
            '                }\n',
            '                cand = loCand;\n',
            '            }\n',
            '            if (!cand) return false;\n',
            '            targetPoint.pos.x = cand.x; targetPoint.pos.y = cand.y;\n',
            '            const idx = points.indexOf(targetPoint); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            computeAngleMeasure(angle); updateScene(); return true;\n',
            '        }\n',
            '        return false;\n',
            '    }\n',
            '\n',
            '    function onPointerMove(e) {\n',
              '      try {\n',
            '        if (dragMode === null) return;\n',
            '        const pos = getPointerPos(e);\n',
            '        if (dragMode === \'chartBar\') {\n',
            '            if (!draggedChartBar) return;\n',
            '            const cd = draggedChartBar.chart, bar = (cd._barRects || []).find(function(b) { return b.i === draggedChartBar.i; });\n',
            '            if (!bar) return;\n',
            '            const value = (bar.baseline - pos.y) / bar.H * bar.mx;\n',
            '            cd._editable[draggedChartBar.i] = value;\n',
            '            markSceneChanged(); draw();\n',
            '            return;\n',
            '        }\n',
            '        if (dragMode === \'graphNode\') {\n',
            '            if (!draggedGraphNode) return;\n',
            '            const mouseField = gcAnchorPixelToField(draggedGraphNode.def)(pos.x, pos.y);\n',
            '            draggedGraphNode.graph.nodes[draggedGraphNode.key].pos = [mouseField.x, mouseField.y];\n',
            '            markSceneChanged(); draw();\n',
            '            return;\n',
            '        }\n',
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
            '            const posFromT = (tt) => ({ x: pA.x + dx * tt, y: pA.y + dy * tt });\n',
            '            // Точки на линии/окружности/кривой и т.п. раньше вообще не проверялись на\n',
            '            // столкновение при перетаскивании — теперь ведут себя как обычные точки\n',
            '            // (плавно скользят до препятствия — MIN_DIST с другой точкой/объектом —\n',
            '            // вместо замирания на месте при первом же мелком шаге рядом с ним).\n',
            '            const res = slideTAvoidingCollision(p, p.t, clampedT, posFromT);\n',
            '            if (!res) return;\n',
            '            p.t = res.t;\n',
            '            p.pos.x = res.pos.x; p.pos.y = res.pos.y;\n',
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
            '            const posFromT = (tt) => { const a = tt * 2 * Math.PI; return { x: cx + circle.radius * Math.cos(a), y: cy + circle.radius * Math.sin(a) }; };\n',
            '            const res = slideTAvoidingCollision(p, p.t, t, posFromT);\n',
            '            if (!res) return;\n',
            '            p.t = res.t;\n',
            '            p.pos.x = res.pos.x;\n',
            '            p.pos.y = res.pos.y;\n',
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
            '            const csp = Math.cos(rotRad), snp = Math.sin(rotRad);\n',
            '            const posFromT = (tt) => {\n',
            '                const ang = tt * 2 * Math.PI;\n',
            '                const elx = ellipse.a * Math.cos(ang), ely = ellipse.b * Math.sin(ang);\n',
            '                return { x: cx + elx * csp - ely * snp, y: cy + elx * snp + ely * csp };\n',
            '            };\n',
            '            const res = slideTAvoidingCollision(p, p.t, t, posFromT);\n',
            '            if (!res) return;\n',
            '            p.t = res.t;\n',
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
            '            const newT = findNearestTOnCurve(curve, mouseField);\n',
            '            const posFromT = (tt) => curvePointAt(curve, tt);\n',
            '            const res = slideTAvoidingCollision(p, p.t, newT, posFromT);\n',
            '            if (!res) return;\n',
            '            p.t = res.t;\n',
            '            const idx = points.indexOf(p); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            updateScene(); draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'pointOnGraph\') {\n',
            '            const p = pointOnGraphPoint, g = pointOnGraphGraph;\n',
            '            if (!p || !g) return;\n',
            '            const mouseField = pixelToField(pos.x, pos.y);\n',
            '            const span = g.xmax - g.xmin;\n',
            '            if (Math.abs(span) < 1e-12) return;\n',
            '            const newT = Math.min(1, Math.max(0, (mouseField.x - g.xmin) / span));\n',
            '            if (!GL_USER_FUNCS[g.funcName]) { p.t = newT; updateScene(); draw(); return; }\n',
            '            const posFromT = (tt) => {\n',
            '                const gx = g.xmin + span * tt;\n',
            '                let gy; try { gy = glCallUserFunc(g.funcName, [gx]); } catch (e) { gy = NaN; }\n',
            '                return (typeof gy === \'number\' && isFinite(gy)) ? { x: gx, y: gy } : null;\n',
            '            };\n',
            '            const res = slideTAvoidingCollision(p, p.t, newT, posFromT);\n',
            '            if (!res) return;\n',
            '            p.t = res.t;\n',
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
            '            const newT = Math.max(0, Math.min(1, t));\n',
            '            const posFromT = (tt) => {\n',
            '                const ang = ang1 + effSweep * tt;\n',
            '                return { x: arc.centerPoint.pos.x + radius * Math.cos(ang), y: arc.centerPoint.pos.y + radius * Math.sin(ang) };\n',
            '            };\n',
            '            const res = slideTAvoidingCollision(p, p.t, newT, posFromT);\n',
            '            if (!res) return;\n',
            '            p.t = res.t;\n',
            '            const idx = points.indexOf(p); if (idx !== -1) { updateFiguresForPoint(idx); updateClustersForPoint(idx); }\n',
            '            updateScene(); draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'lockedAngle\') {\n',
            '            handleLockedAngleMove(lockedAngleDrag, lockedAngleDragMode, lockedAngleDragLine, null, dragStartPos, pos);\n',
            '            dragStartPos = { x: pos.x, y: pos.y };\n',
            '            draw(); return;\n',
            '        } else if (dragMode === \'lockedPointOnSide\') {\n',
            '            handleLockedAngleMove(lockedAngleDrag, \'pointOnSide\', lockedAngleDragLine, lockedPointTarget, dragStartPos, pos);\n',
            '            dragStartPos = { x: pos.x, y: pos.y };\n',
            '            draw(); return;\n',
            '        }\n',
            '        if (dragMode === \'point\') {\n',
            '            let newPx = pos.x - dragOffsetX, newPy = pos.y - dragOffsetY;\n',
            '            let fieldPos = pixelToField(newPx, newPy);\n',
            '            if (isNaN(fieldPos.x) || isNaN(fieldPos.y)) return;\n',
            '            clampFieldPoint(fieldPos);\n',
            '            const p = points[dragTarget];\n',
            '            // Раньше dragOffsetX/Y пересчитывались на каждом кадре под "притянутую" snap\'ом\n',
            '            // или отодвинутую столкновением позицию — это создавало обратную связь\n',
            '            // (snap тянет точку РОВНО на другую точку, столкновение тут же отталкивает,\n',
            '            // оба раза меняя точку отсчёта drag\'а) и точка либо намертво "прилипала",\n',
            '            // либо переставала откликаться на мышь. dragOffset теперь остаётся ровно\n',
            '            // тем же, что был выставлен в момент начала перетаскивания (как и у всех\n',
            '            // остальных режимов drag\'а в этом файле) — snap/коллизия лишь корректируют\n',
            '            // ИТОГОВУЮ позицию точки, не искажая точку отсчёта для следующего кадра.\n',
            '            fieldPos = computeSnap(fieldPos, [p], p);\n',
            '            fieldPos = resolveCollision(dragTarget, fieldPos);\n',
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
              '      } catch (err) {\n',
              '        console.error(\'Ошибка при перетаскивании:\', err);\n',
              '        dragMode = null; dragTarget = null; draggedPointIndex = -1; isDragging = false;\n',
              '        lockedAngleDrag = null; lockedAngleDragLine = null; lockedPointTarget = null;\n',
              '        pointOnLinePoint = null; pointOnLineLine = null; pointOnCirclePoint = null; pointOnCircleCircle = null;\n',
              '        pointOnEllipsePoint = null; pointOnEllipseEllipse = null; ellipseAxisPoint = null; ellipseAxisEllipse = null;\n',
              '        pointOnCurvePoint = null; pointOnCurveCurve = null; pointOnArcPoint = null; pointOnArcArc = null;\n',
              '        pointOnGraphPoint = null; pointOnGraphGraph = null;\n',
              '        activeSnapGuides = [];\n',
              '      }\n',
            '    }\n',
            '\n',
            '    function onPointerUp(e) {\n',
              '      try {\n',
            '        dragMode = null; dragTarget = null; lockedAngleDrag = null; lockedAngleDragLine = null; lockedPointTarget = null;\n',
            '        draggedGraphNode = null; draggedChartBar = null;\n',
            '        pointOnLinePoint = null; pointOnLineLine = null; pointOnCirclePoint = null; pointOnCircleCircle = null;\n',
            '        pointOnEllipsePoint = null; pointOnEllipseEllipse = null; ellipseAxisPoint = null; ellipseAxisEllipse = null;\n',
            '        pointOnCurvePoint = null; pointOnCurveCurve = null; pointOnArcPoint = null; pointOnArcArc = null;\n',
            '        pointOnGraphPoint = null; pointOnGraphGraph = null;\n',
            '        isDragging = false; draggedPointIndex = -1;\n',
            '        activeSnapGuides = [];\n',
            '        markSceneChanged(); draw();\n',
              '      } catch (err) {\n',
              '        console.error(\'Ошибка в onPointerUp:\', err);\n',
              '      }\n',
            '    }\n',
            '\n',
            '    // ---- Плавность перетаскивания (drag smoothing) ----\n',
            '    // Между событием мыши/касания и onPointerMove стоит «сглаженный указатель»: он\n',
            '    // догоняет настоящий экспоненциально с постоянной времени DRAG_SMOOTHING, и\n',
            '    // onPointerMove получает его координаты. Так плавными становятся все виды\n',
            '    // перетаскивания сразу (точки, стороны, фигуры, узлы), а их логика (ограничения,\n',
            '    // столкновения, привязка) не меняется. Перед отпусканием — точная позиция.\n',
            '    let gcDragTarget = null, gcDragSmooth = null, gcDragRaf = 0, gcDragLast = 0;\n',
            '    function gcClientXY(e) { const t = e.touches && e.touches[0]; return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY }; }\n',
            '    function gcFeedMove(x, y) { window.__gcDeferDraw = true; try { onPointerMove({ clientX: x, clientY: y }); } finally { window.__gcDeferDraw = false; } }\n',
            '    function gcDragStep(ts) {\n',
            '        gcDragRaf = 0;\n',
            '        if (dragMode === null || !gcDragTarget) { gcDragSmooth = null; return; }\n',
            '        const dt = Math.min(0.05, Math.max(0.001, (ts - (gcDragLast || ts)) / 1000 || 0.016));\n',
            '        gcDragLast = ts;\n',
            '        const k = 1 - Math.exp(-dt / DRAG_SMOOTHING);\n',
            '        gcDragSmooth.x += (gcDragTarget.x - gcDragSmooth.x) * k;\n',
            '        gcDragSmooth.y += (gcDragTarget.y - gcDragSmooth.y) * k;\n',
            '        const far = Math.abs(gcDragTarget.x - gcDragSmooth.x) + Math.abs(gcDragTarget.y - gcDragSmooth.y) > 0.25;\n',
            '        if (!far) { gcDragSmooth.x = gcDragTarget.x; gcDragSmooth.y = gcDragTarget.y; }\n',
            '        gcFeedMove(gcDragSmooth.x, gcDragSmooth.y);\n',
            '        if (far) { gcDragRaf = requestAnimationFrame(gcDragStep); }\n',
            '    }\n',
            '    function onPointerMoveSmooth(e) {\n',
            '        if (dragMode === null || !(DRAG_SMOOTHING > 0)) { gcDragTarget = null; gcDragSmooth = null; if (dragMode !== null) { window.__gcDeferDraw = true; try { onPointerMove(e); } finally { window.__gcDeferDraw = false; } } else { onPointerMove(e); } return; }\n',
            '        if (e.touches && e.cancelable) e.preventDefault();\n',
            '        const p = gcClientXY(e);\n',
            '        gcDragTarget = p;\n',
            '        if (!gcDragSmooth) { gcDragSmooth = { x: p.x, y: p.y }; gcDragLast = 0; gcFeedMove(p.x, p.y); return; }\n',
            '        if (!gcDragRaf) { gcDragLast = performance.now(); gcDragRaf = requestAnimationFrame(gcDragStep); }\n',
            '    }\n',
            '    function onPointerUpSmooth(e) {\n',
            '        if (gcDragRaf) { cancelAnimationFrame(gcDragRaf); gcDragRaf = 0; }\n',
            '        if (dragMode !== null && gcDragTarget && gcDragSmooth && (gcDragTarget.x !== gcDragSmooth.x || gcDragTarget.y !== gcDragSmooth.y)) gcFeedMove(gcDragTarget.x, gcDragTarget.y);\n',
            '        gcDragTarget = null; gcDragSmooth = null;\n',
            '        onPointerUp(e);\n',
            '    }\n',
            '    // Сглаживание начинается от точки нажатия — иначе первый же рывок мыши проходил бы резко.\n',
            '    function gcDragReset(e) { gcDragTarget = null; gcDragSmooth = gcClientXY(e); gcDragLast = 0; if (gcDragRaf) { cancelAnimationFrame(gcDragRaf); gcDragRaf = 0; } }\n',
            '    canvas.addEventListener(\'mousedown\', gcDragReset, true);\n',
            '    canvas.addEventListener(\'touchstart\', gcDragReset, { capture: true, passive: true });\n',
            '    canvas.addEventListener(\'mousedown\', onPointerDown);\n',
            '    window.addEventListener(\'mousemove\', onPointerMoveSmooth);\n',
            '    window.addEventListener(\'mouseup\', onPointerUpSmooth);\n',
            '    canvas.addEventListener(\'touchstart\', onPointerDown, { passive: false });\n',
            '    window.addEventListener(\'touchmove\', onPointerMoveSmooth, { passive: false });\n',
            '    window.addEventListener(\'touchend\', onPointerUpSmooth, { passive: false });\n',
            '\n',
            '    // ---- Камера: масштабирование колесом и панорамирование (Задача 3) ----\n',
            '    let isPanning = false;\n',
            '    let panStartPixel = { x: 0, y: 0 };\n',
            '    let panStartOffset = { x: 0, y: 0 };\n',
            '    function isPanTrigger(e) { return e.button === 1 || (e.button === 0 && e.ctrlKey); }\n',
            '    canvas.addEventListener(\'mousedown\', function(e) {\n',
            '        if (CAMERA_TYPE_2D === \'fixed\' || !isPanTrigger(e)) return;\n',
            '        e.preventDefault();\n',
            '        isPanning = true;\n',
            '        panStartPixel = getPointerPos(e);\n',
            '        panStartOffset = { x: camera.offsetX, y: camera.offsetY };\n',
            '        e.stopImmediatePropagation();\n',
            '    }, true);\n',
            '    function onPanMove(e) {\n',
            '        if (!isPanning) return;\n',
            '        const cur = getPointerPos(e);\n',
            '        const scale = fieldScale();\n',
            '        if (scale <= 0) return;\n',
            '        camera.offsetX = panStartOffset.x - (cur.x - panStartPixel.x) / scale;\n',
            '        camera.offsetY = panStartOffset.y + (cur.y - panStartPixel.y) / scale;\n',
            '        markSceneChanged(); draw();\n',
            '    }\n',
            '    window.addEventListener(\'mousemove\', onPanMove, true);\n',
            '    window.addEventListener(\'touchmove\', onPanMove, { passive: true, capture: true });\n',
            '    window.addEventListener(\'mouseup\', function() { isPanning = false; }, true);\n',
            '    window.addEventListener(\'touchend\', function() { isPanning = false; }, true);\n',
            '    window.addEventListener(\'touchcancel\', function() { isPanning = false; }, true);\n',
            '    // Порог столкновения считается из радиуса ОТРИСОВКИ, поэтому в единицах поля он растёт\n',
            '    // при отдалении камеры: две точки, стоявшие раздельно, после уменьшения масштаба\n',
            '    // начинают перекрываться на экране. Сами координаты при этом не меняются, и без\n',
            '    // отдельного прохода точки так и остаются слипшимися до следующего перетаскивания.\n',
            '    // Здесь мы расталкиваем их симметрично — каждая уходит на половину нехватки, чтобы\n',
            '    // ни одна не считалась "главной". Двигаются только dynamic-точки: вычисляемые и\n',
            '    // привязанные подчиняются своим правилам, и сдвигать их значило бы ломать построение.\n',
            '    function separateOverlappingAfterZoom() {\n',
            '      if (isDragging) return false;\n',
            '      let moved = false;\n',
            '      for (let iter = 0; iter < 4; iter++) {\n',
            '        let changedThisPass = false;\n',
            '        for (let i = 0; i < points.length; i++) {\n',
            '          const a = points[i];\n',
            '          if (!a || !a.pos || a.hidden || !a.dynamic) continue;\n',
            '          if (a.collision === false || a.collideWithPoints === false) continue;\n',
            '          if (a.lineName || a.circleName || a.curveName || a.graphName || a.construct || a.transform) continue;\n',
            '          for (let j = i + 1; j < points.length; j++) {\n',
            '            const b = points[j];\n',
            '            if (!b || !b.pos || b.hidden || !b.dynamic) continue;\n',
            '            if (b.collision === false || b.collideWithPoints === false) continue;\n',
            '            if (b.lineName || b.circleName || b.curveName || b.graphName || b.construct || b.transform) continue;\n',
            '            if (!canCollideWith(a, b)) continue;\n',
            '            const need = gcPairSep(a, b) + (a.collisionMargin || 0) + (b.collisionMargin || 0);\n',
            '            let dx = b.pos.x - a.pos.x, dy = b.pos.y - a.pos.y;\n',
            '            let d = Math.hypot(dx, dy);\n',
            '            if (d >= need) continue;\n',
            '            if (d < 1e-9) { dx = 1; dy = 0; d = 1; }\n',
            '            const push = (need - d) / 2;\n',
            '            const ux = dx / d, uy = dy / d;\n',
            '            a.pos.x -= ux * push; a.pos.y -= uy * push;\n',
            '            b.pos.x += ux * push; b.pos.y += uy * push;\n',
            '            clampFieldPoint(a.pos); clampFieldPoint(b.pos);\n',
            '            a.dirty = true; b.dirty = true;\n',
            '            changedThisPass = true; moved = true;\n',
            '          }\n',
            '        }\n',
            '        if (!changedThisPass) break;\n',
            '      }\n',
            '      if (moved) {\n',
            '        for (let i = 0; i < points.length; i++) { updateFiguresForPoint(i); updateClustersForPoint(i); }\n',
            '        updateScene();\n',
            '      }\n',
            '      return moved;\n',
            '    }\n',
            '    canvas.addEventListener(\'wheel\', function(e) {\n',
            '        if (CAMERA_TYPE_2D === \'fixed\') return;\n',
            '        e.preventDefault();\n',
            '        const factor = e.deltaY > 0 ? 0.9 : 1.1;\n',
            '        const mousePixel = getPointerPos(e);\n',
            '        const before = pixelToField(mousePixel.x, mousePixel.y);\n',
            '        camera.zoom = Math.max(camera.zoomMin, Math.min(camera.zoomMax, camera.zoom * factor));\n',
            '        const after = pixelToField(mousePixel.x, mousePixel.y);\n',
            '        camera.offsetX += before.x - after.x;\n',
            '        camera.offsetY += before.y - after.y;\n',
            '        separateOverlappingAfterZoom();\n',
            '        markSceneChanged(); draw();\n',
            '    }, { passive: false });\n',
            '\n',
            '    // Щипок двумя пальцами — зум камеры на телефоне/планшете (мобильная адаптивность).\n',
            '    let touchPinchDist = null;\n',
            '    canvas.addEventListener(\'touchstart\', function(e) {\n',
            '        if (e.touches.length === 2) {\n',
            '            const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;\n',
            '            touchPinchDist = Math.hypot(dx, dy);\n',
            '            isPanning = false;\n',
            '        }\n',
            '    }, { passive: true });\n',
            '    canvas.addEventListener(\'touchmove\', function(e) {\n',
            '        if (CAMERA_TYPE_2D === \'fixed\' || !e.touches || e.touches.length !== 2) { touchPinchDist = null; return; }\n',
            '        e.preventDefault();\n',
            '        const t0 = e.touches[0], t1 = e.touches[1];\n',
            '        const dx = t0.clientX - t1.clientX, dy = t0.clientY - t1.clientY;\n',
            '        const dist = Math.hypot(dx, dy);\n',
            '        if (touchPinchDist) {\n',
            '            const factor = dist / touchPinchDist;\n',
            '            const rect = canvas.getBoundingClientRect();\n',
            '            const scaleX = width / rect.width, scaleY = height / rect.height;\n',
            '            const midPixel = { x: ((t0.clientX + t1.clientX) / 2 - rect.left) * scaleX, y: ((t0.clientY + t1.clientY) / 2 - rect.top) * scaleY };\n',
            '            const before = pixelToField(midPixel.x, midPixel.y);\n',
            '            camera.zoom = Math.max(camera.zoomMin, Math.min(camera.zoomMax, camera.zoom * factor));\n',
            '            const after = pixelToField(midPixel.x, midPixel.y);\n',
            '            camera.offsetX += before.x - after.x;\n',
            '            camera.offsetY += before.y - after.y;\n',
            '            markSceneChanged(); draw();\n',
            '        }\n',
            '        touchPinchDist = dist;\n',
            '    }, { passive: false });\n',
            '    canvas.addEventListener(\'touchend\', function(e) { if (e.touches.length < 2) touchPinchDist = null; }, { passive: true });\n',
            '\n',
            '    function resizeCanvas() {\n',
            '        const wrapper = canvas.parentElement;\n',
            '        const maxWidth = Math.min(800, wrapper.clientWidth);\n',
            '        canvas.style.width = maxWidth + \'px\';\n',
            '        const aspect = FIELD_HEIGHT / FIELD_WIDTH;\n',
            '        const newHeight = Math.floor(maxWidth * aspect);\n',
            '        canvas.style.height = newHeight + \'px\';\n',
            '        // На узком экране (телефон) сцена рисуется в логической ширине не меньше\n',
            '        // GC_MIN_LOGICAL_WIDTH и равномерно уменьшается: точки, узлы, подписи и шрифты\n',
            '        // сжимаются вместе с полем, а не налезают друг на друга.\n',
            '        const logicalW = Math.max(maxWidth, GC_MIN_LOGICAL_WIDTH);\n',
            '        const k = maxWidth / logicalW;\n',
            '        const devDpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));\n',
            '        gcDpr = devDpr * k; gcCssK = k;\n',
            '        canvas.width = Math.round(maxWidth * devDpr);\n',
            '        canvas.height = Math.round(newHeight * devDpr);\n',
            '        ctx.setTransform(gcDpr, 0, 0, gcDpr, 0, 0);\n',
            '        width = logicalW; height = newHeight / k;\n',
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
    // ===== Экспорт анимации в видео (Задача 3) =====
    // Сцены со Start/Update/слайдерами до сих пор можно было выгрузить только как один
    // статический PNG-кадр (exportImage) или как весь интерактивный HTML. Записываем сам
    // canvas через нативный MediaRecorder поверх canvas.captureStream() — без сторонних
    // библиотек кодирования (GIF потребовал бы JS-энкодер и лишний вес; WebM/MediaRecorder
    // умеет писать видео сам браузер). Итоговый файл — .webm, который открывается в любом
    // современном плеере/браузере и может быть перекодирован в mp4/gif внешними инструментами
    // при необходимости.
    let glActiveRecorder = null;
    function glPickVideoMimeType() {
        const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
        for (const c of candidates) {
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) return c;
        }
        return 'video/webm';
    }
    function glDownloadRecordedVideo(chunks, mimeType, filename) {
        if (!chunks.length) { glLog('warn', 'Запись видео: не получено ни одного кадра'); return; }
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const name = (filename ? String(filename) : 'export') + (String(filename || '').endsWith('.webm') ? '' : '.webm');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    // startRecording/stopRecording — ручное управление (например, из двух кнопок UI:
    // action = "startRecording('demo.webm')" / action = "stopRecording()"), длительность
    // не ограничена — запись идёт, пока явно не остановлена.
    function glStartRecording(filename) {
        if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
            glLog('warn', 'Запись видео не поддерживается этим браузером');
            return false;
        }
        if (glActiveRecorder && glActiveRecorder.recorder.state === 'recording') {
            glLog('warn', 'Запись уже идёт — сначала вызовите stopRecording()');
            return false;
        }
        const mimeType = glPickVideoMimeType();
        const stream = canvas.captureStream(30);
        const chunks = [];
        let recorder;
        try { recorder = new MediaRecorder(stream, { mimeType }); }
        catch (e) { glLog('warn', 'Не удалось начать запись: ' + e.message); return false; }
        recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => { glDownloadRecordedVideo(chunks, mimeType, filename); };
        recorder.start();
        glActiveRecorder = { recorder, filename };
        return true;
    }
    function glStopRecording() {
        if (!glActiveRecorder || glActiveRecorder.recorder.state === 'inactive') {
            glLog('warn', 'Запись видео не запущена');
            return false;
        }
        glActiveRecorder.recorder.stop();
        glActiveRecorder = null;
        return true;
    }
    // exportVideo — запись фиксированной длительности одним вызовом (например, из
    // action кнопки: action = "exportVideo('demo.webm', 6)" запишет 6 секунд и сам скачает файл).
    function glExportVideo(filename, durationSeconds) {
        const dur = (typeof durationSeconds === 'number' && durationSeconds > 0) ? durationSeconds : 5;
        if (!glStartRecording(filename)) return false;
        setTimeout(() => { glStopRecording(); }, dur * 1000);
        return true;
    }

    // ===== Мини-язык для Start/Update/действий кнопок/выражений текста =====
    // Вместо eval() сырого JS: set <путь> = <выражение>; if (...) {...} else {...}; repeat (N) {...}; wait(сек);
    // for (x in points) {...}; vector v = [1,2,3]; matrix m = [[1,2],[3,4]]; intersection(type, a, b)
    // ===== Многомерный анализ, разложения матриц, логика, множества, статистика =====
    // Численные операторы построены на центральных разностях: символьного
    // дифференцирования по нескольким переменным в языке нет, а точности разностей
    // с запасом хватает для интерактивных иллюстраций.
    // ---- вспомогательное ----
    function glAsFunc(f) { return typeof f === 'string' ? glMakeFuncWrapper(f) : f; }
    function glStep(x) { return Math.max(1e-5, Math.abs(x) * 1e-5); }

    // ===== Многомерный анализ (численно, центральные разности) =====
    // point — массив координат; f принимает столько же скалярных аргументов.
    function glPartial(f, point, i, h) {
        const hh = h || glStep(point[i]);
        const a = point.slice(); a[i] += hh;
        const b = point.slice(); b[i] -= hh;
        return (f.apply(null, a) - f.apply(null, b)) / (2 * hh);
    }
    function glPartial2(f, point, i, j, h) {
        const hi = h || glStep(point[i]);
        const hj = h || glStep(point[j]);
        if (i === j) {
            const a = point.slice(); a[i] += hi;
            const b = point.slice(); b[i] -= hi;
            return (f.apply(null, a) - 2 * f.apply(null, point) + f.apply(null, b)) / (hi * hi);
        }
        const pp = point.slice(); pp[i] += hi; pp[j] += hj;
        const pm = point.slice(); pm[i] += hi; pm[j] -= hj;
        const mp = point.slice(); mp[i] -= hi; mp[j] += hj;
        const mm = point.slice(); mm[i] -= hi; mm[j] -= hj;
        return (f.apply(null, pp) - f.apply(null, pm) - f.apply(null, mp) + f.apply(null, mm)) / (4 * hi * hj);
    }
    const glGradient = (f, point, h) => {
        const fn = glAsFunc(f);
        return point.map((_, i) => glPartial(fn, point, i, h));
    };
    const glJacobian = (fs, point, h) =>
        fs.map(f => { const fn = glAsFunc(f); return point.map((_, i) => glPartial(fn, point, i, h)); });
    const glDivergence = (fs, point, h) => {
        let s = 0;
        for (let i = 0; i < fs.length && i < point.length; i++) s += glPartial(glAsFunc(fs[i]), point, i, h);
        return s;
    };
    // Ротор определён только в 3D: rot F = (dFz/dy - dFy/dz, dFx/dz - dFz/dx, dFy/dx - dFx/dy)
    const glCurl = (fs, point, h) => {
        if (fs.length < 3 || point.length < 3) throw new Error('curl: нужны три компоненты поля и точка в 3D');
        const F = fs.map(glAsFunc);
        return [
            glPartial(F[2], point, 1, h) - glPartial(F[1], point, 2, h),
            glPartial(F[0], point, 2, h) - glPartial(F[2], point, 0, h),
            glPartial(F[1], point, 0, h) - glPartial(F[0], point, 1, h),
        ];
    };
    const glHessian = (f, point, h) => {
        const fn = glAsFunc(f);
        return point.map((_, i) => point.map((_, j) => glPartial2(fn, point, i, j, h)));
    };
    const glLaplacian = (f, point, h) => {
        const fn = glAsFunc(f);
        let s = 0;
        for (let i = 0; i < point.length; i++) s += glPartial2(fn, point, i, i, h);
        return s;
    };
    const glDirDerivative = (f, point, dir, h) => {
        const n = Math.hypot.apply(null, dir) || 1;
        const g = glGradient(f, point, h);
        let s = 0;
        for (let i = 0; i < g.length; i++) s += g[i] * (dir[i] / n);
        return s;
    };

    // ===== Разложения матриц =====
    // LU с частичным выбором ведущего элемента: PA = LU. sign — знак перестановки (для det).
    function glLuDecompose(A) {
        const n = A.length;
        const U = A.map(r => r.slice());
        const L = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
        const perm = Array.from({ length: n }, (_, i) => i);
        let sign = 1;
        for (let k = 0; k < n; k++) {
            let piv = k, best = Math.abs(U[k][k]);
            for (let i = k + 1; i < n; i++) if (Math.abs(U[i][k]) > best) { best = Math.abs(U[i][k]); piv = i; }
            if (best < 1e-14) continue;
            if (piv !== k) {
                const t = U[k]; U[k] = U[piv]; U[piv] = t;
                const tp = perm[k]; perm[k] = perm[piv]; perm[piv] = tp;
                for (let j = 0; j < k; j++) { const tl = L[k][j]; L[k][j] = L[piv][j]; L[piv][j] = tl; }
                sign = -sign;
            }
            for (let i = k + 1; i < n; i++) {
                const m = U[i][k] / U[k][k];
                L[i][k] = m;
                for (let j = k; j < n; j++) U[i][j] -= m * U[k][j];
            }
        }
        const P = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => perm[i] === j ? 1 : 0));
        return { L: L, U: U, P: P, perm: perm, sign: sign };
    }
    // QR методом Грама—Шмидта в модифицированной (устойчивой) форме: A = QR, Q ортогональна.
    function glQrDecompose(A) {
        const m = A.length, n = A[0].length;
        const Q = Array.from({ length: m }, () => new Array(n).fill(0));
        const R = Array.from({ length: n }, () => new Array(n).fill(0));
        const v = [];
        for (let j = 0; j < n; j++) v.push(A.map(r => r[j]));
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < j; i++) {
                let s = 0;
                for (let k = 0; k < m; k++) s += Q[k][i] * v[j][k];
                R[i][j] = s;
                for (let k = 0; k < m; k++) v[j][k] -= s * Q[k][i];
            }
            let nrm = 0;
            for (let k = 0; k < m; k++) nrm += v[j][k] * v[j][k];
            nrm = Math.sqrt(nrm);
            R[j][j] = nrm;
            for (let k = 0; k < m; k++) Q[k][j] = nrm < 1e-14 ? 0 : v[j][k] / nrm;
        }
        return { Q: Q, R: R };
    }
    // Разложение Холецкого A = L*L^T. Возвращает null, если матрица не положительно определена.
    function glCholesky(A) {
        const n = A.length;
        const L = Array.from({ length: n }, () => new Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                let s = 0;
                for (let k = 0; k < j; k++) s += L[i][k] * L[j][k];
                if (i === j) {
                    const d = A[i][i] - s;
                    if (d <= 0) return null;
                    L[i][j] = Math.sqrt(d);
                } else {
                    L[i][j] = (A[i][j] - s) / L[j][j];
                }
            }
        }
        return L;
    }

    // ===== Логика =====
    // truthTable(['p','q'], f) — f вызывается с булевыми аргументами в порядке имён.
    // Возвращает { vars, rows: [{values:[...], result: bool}] } — готово для draw Table.
    function glTruthTable(varNames, f) {
        const fn = glAsFunc(f);
        const n = varNames.length;
        const rows = [];
        for (let mask = (1 << n) - 1; mask >= 0; mask--) {
            const values = [];
            for (let i = 0; i < n; i++) values.push(!!(mask & (1 << (n - 1 - i))));
            rows.push({ values: values, result: !!fn.apply(null, values) });
        }
        return { vars: varNames.slice(), rows: rows };
    }
    const glIsTautology = (varNames, f) => glTruthTable(varNames, f).rows.every(r => r.result);
    const glIsSatisfiable = (varNames, f) => glTruthTable(varNames, f).rows.some(r => r.result);
    const glIsContradiction = (varNames, f) => glTruthTable(varNames, f).rows.every(r => !r.result);
    // Все наборы значений, на которых формула истинна — «модели» формулы.
    const glModels = (varNames, f) => glTruthTable(varNames, f).rows.filter(r => r.result).map(r => r.values);
    // Логическая эквивалентность двух формул от одних и тех же переменных.
    const glLogicEquiv = (varNames, f, g) => {
        const a = glTruthTable(varNames, f).rows, b = glTruthTable(varNames, g).rows;
        return a.every((r, i) => r.result === b[i].result);
    };

    // ===== Множества =====
    // Элементы сравниваются по JSON-представлению, чтобы работали и числа, и строки, и пары.
    function glSetKey(x) { return typeof x === 'object' ? JSON.stringify(x) : (typeof x) + ':' + String(x); }
    function glSetUniq(a) {
        const seen = new Set(), out = [];
        for (const x of a) { const k = glSetKey(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }
        return out;
    }
    const glSetUnion = (a, b) => glSetUniq(a.concat(b));
    const glSetIntersect = (a, b) => { const kb = new Set(b.map(glSetKey)); return glSetUniq(a).filter(x => kb.has(glSetKey(x))); };
    const glSetDiff = (a, b) => { const kb = new Set(b.map(glSetKey)); return glSetUniq(a).filter(x => !kb.has(glSetKey(x))); };
    const glSetSymDiff = (a, b) => glSetUnion(glSetDiff(a, b), glSetDiff(b, a));
    const glIsSubset = (a, b) => { const kb = new Set(b.map(glSetKey)); return a.every(x => kb.has(glSetKey(x))); };
    const glSetEqual = (a, b) => glIsSubset(a, b) && glIsSubset(b, a);
    const glCartesian = (a, b) => { const out = []; for (const x of a) for (const y of b) out.push([x, y]); return out; };
    // Мощности всех 2^n областей диаграммы Венна: ключ — строка вида '101' (входит/не входит
    // в 1-е, 2-е, 3-е множество). Для draw Table и для подписей на диаграмме.
    function glVennRegions(sets) {
        const n = sets.length;
        const all = glSetUniq([].concat.apply([], sets));
        const keys = sets.map(s => new Set(s.map(glSetKey)));
        const regions = {};
        for (const x of all) {
            const k = glSetKey(x);
            let sig = '';
            for (let i = 0; i < n; i++) sig += keys[i].has(k) ? '1' : '0';
            if (!regions[sig]) regions[sig] = [];
            regions[sig].push(x);
        }
        return regions;
    }

    // ===== Статистика: распределения и критерии =====
    function glLogGamma(x) {
        const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
                   -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
        let y = x, tmp = x + 5.5;
        tmp -= (x + 0.5) * Math.log(tmp);
        let ser = 1.000000000190015;
        for (let j = 0; j < 6; j++) ser += c[j] / ++y;
        return -tmp + Math.log(2.5066282746310005 * ser / x);
    }
    // Регуляризованная неполная бета-функция I_x(a,b) — через непрерывную дробь Лентца.
    function glBetaCf(a, b, x) {
        const FPMIN = 1e-300, EPS = 3e-12;
        const qab = a + b, qap = a + 1, qam = a - 1;
        let c = 1, d = 1 - qab * x / qap;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        d = 1 / d;
        let h = d;
        for (let m = 1; m <= 300; m++) {
            const m2 = 2 * m;
            let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
            d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1 / d; h *= d * c;
            aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
            d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1 / d;
            const del = d * c; h *= del;
            if (Math.abs(del - 1) < EPS) break;
        }
        return h;
    }
    function glBetaInc(a, b, x) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        const bt = Math.exp(glLogGamma(a + b) - glLogGamma(a) - glLogGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
        return x < (a + 1) / (a + b + 2) ? bt * glBetaCf(a, b, x) / a : 1 - bt * glBetaCf(b, a, 1 - x) / b;
    }
    // Регуляризованная нижняя неполная гамма P(a,x) — ряд + непрерывная дробь.
    function glGammaInc(a, x) {
        if (x <= 0) return 0;
        if (x < a + 1) {
            let ap = a, sum = 1 / a, del = sum;
            for (let n = 1; n <= 300; n++) {
                ap++; del *= x / ap; sum += del;
                if (Math.abs(del) < Math.abs(sum) * 3e-12) break;
            }
            return sum * Math.exp(-x + a * Math.log(x) - glLogGamma(a));
        }
        const FPMIN = 1e-300;
        let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
        for (let i = 1; i <= 300; i++) {
            const an = -i * (i - a);
            b += 2;
            d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
            c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1 / d;
            const del = d * c; h *= del;
            if (Math.abs(del - 1) < 3e-12) break;
        }
        return 1 - Math.exp(-x + a * Math.log(x) - glLogGamma(a)) * h;
    }
    const glTPdf = (x, df) =>
        Math.exp(glLogGamma((df + 1) / 2) - glLogGamma(df / 2)) / Math.sqrt(df * Math.PI) *
        Math.pow(1 + x * x / df, -(df + 1) / 2);
    const glTCdf = (x, df) => {
        const p = 0.5 * glBetaInc(df / 2, 0.5, df / (df + x * x));
        return x > 0 ? 1 - p : p;
    };
    const glChi2Pdf = (x, k) => x <= 0 ? 0 :
        Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - glLogGamma(k / 2) - (k / 2) * Math.LN2);
    const glChi2Cdf = (x, k) => x <= 0 ? 0 : glGammaInc(k / 2, x / 2);
    const glFPdf = (x, d1, d2) => {
        if (x <= 0) return 0;
        const lg = glLogGamma((d1 + d2) / 2) - glLogGamma(d1 / 2) - glLogGamma(d2 / 2);
        return Math.exp(lg + (d1 / 2) * Math.log(d1 / d2) + (d1 / 2 - 1) * Math.log(x) -
                        ((d1 + d2) / 2) * Math.log(1 + d1 * x / d2));
    };
    const glFCdf = (x, d1, d2) => x <= 0 ? 0 : glBetaInc(d1 / 2, d2 / 2, d1 * x / (d1 * x + d2));
    // Обратная функция стандартного нормального распределения (алгоритм Акклама).
    function glNormalQuantile(p) {
        if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
        const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
                    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
                    6.680131188771972e+01, -1.328068155288572e+01];
        const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
                   -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
        const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
        const pl = 0.02425;
        let q, r;
        if (p < pl) {
            q = Math.sqrt(-2 * Math.log(p));
            return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
        }
        if (p > 1 - pl) {
            q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
        }
        q = p - 0.5; r = q * q;
        return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    }
    // Обобщённый поиск квантиля по CDF пополам — для t/chi2/F.
    function glQuantileFromCdf(cdf, p, lo, hi) {
        let a = lo, b = hi;
        for (let i = 0; i < 200; i++) {
            const m = (a + b) / 2;
            if (cdf(m) < p) a = m; else b = m;
        }
        return (a + b) / 2;
    }
    const glTQuantile = (p, df) => glQuantileFromCdf(x => glTCdf(x, df), p, -1e3, 1e3);
    const glChi2Quantile = (p, k) => glQuantileFromCdf(x => glChi2Cdf(x, k), p, 0, 1e5);
    const glFQuantile = (p, d1, d2) => glQuantileFromCdf(x => glFCdf(x, d1, d2), p, 0, 1e5);

    function glMeanOf(a) { return a.reduce((s, x) => s + x, 0) / a.length; }
    function glVarOf(a) { const m = glMeanOf(a); return a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1); }
    // Одновыборочный t-критерий: сравнение среднего выборки с mu0.
    const glTTest1 = (sample, mu0) => {
        const n = sample.length, m = glMeanOf(sample), s = Math.sqrt(glVarOf(sample));
        const t = (m - (mu0 || 0)) / (s / Math.sqrt(n)), df = n - 1;
        return { t: t, df: df, mean: m, sd: s, p: 2 * (1 - glTCdf(Math.abs(t), df)) };
    };
    // Двухвыборочный t-критерий Уэлча (не требует равенства дисперсий).
    const glTTest2 = (a, b) => {
        const na = a.length, nb = b.length;
        const ma = glMeanOf(a), mb = glMeanOf(b);
        const va = glVarOf(a), vb = glVarOf(b);
        const se = Math.sqrt(va / na + vb / nb);
        const t = (ma - mb) / se;
        const df = Math.pow(va / na + vb / nb, 2) /
                   (Math.pow(va / na, 2) / (na - 1) + Math.pow(vb / nb, 2) / (nb - 1));
        return { t: t, df: df, meanA: ma, meanB: mb, p: 2 * (1 - glTCdf(Math.abs(t), df)) };
    };
    // Критерий хи-квадрат согласия. expected можно не задавать — тогда равномерное.
    const glChiSquareTest = (observed, expected) => {
        const n = observed.length;
        const total = observed.reduce((s, x) => s + x, 0);
        const exp = expected && expected.length === n ? expected : new Array(n).fill(total / n);
        let chi2 = 0;
        for (let i = 0; i < n; i++) { const d = observed[i] - exp[i]; chi2 += d * d / exp[i]; }
        const df = n - 1;
        return { chi2: chi2, df: df, p: 1 - glChi2Cdf(chi2, df) };
    };
    // Доверительный интервал для среднего (t-распределение). level по умолчанию 0.95.
    const glConfInterval = (sample, level) => {
        const lv = level || 0.95;
        const n = sample.length, m = glMeanOf(sample), s = Math.sqrt(glVarOf(sample));
        const tc = glTQuantile(1 - (1 - lv) / 2, n - 1);
        const half = tc * s / Math.sqrt(n);
        return { mean: m, lower: m - half, upper: m + half, level: lv, margin: half };
    };

    // Число → строка с десятичным разделителем сайта (см. window.__gcDecSep)
    function __gcDec(s) {
        const sep = (typeof window !== 'undefined' && window.__gcDecSep) || ',';
        return sep === '.' ? String(s) : String(s).replace(/([0-9])[.]([0-9])/g, '$1,$2');
    }
    const GL_BUILTINS = {
        isKeyDown: (key) => !!(window.__gcKeysDown && window.__gcKeysDown.has(String(key).toLowerCase())),
        animate: (varName, to, duration, easing, delay, mode) => { glAnimate(varName, to, duration, easing, delay, mode); return null; },
        stopAnimation: (varName) => { glStopAnimation(varName); return null; },
        isAnimating: (varName) => glIsAnimating(varName),
        animationProgress: (varName) => glAnimationProgress(varName),
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
        len: (v) => {
            if (v === null || v === undefined) throw new Error('len(): аргумент отсутствует (null/undefined)');
            if (typeof v.length === 'number') return v.length;
            // Частый случай: len() случайно вызвали на объекте графа/поста ({nodes, edges}
            // или {els, leq}) вместо конкретного массива внутри него — раньше это тихо
            // возвращало undefined, и значение потом невозможно было отличить от
            // "переменная не существует" (см. правку резолвера идентификаторов). Теперь —
            // явная и понятная ошибка сразу в месте вызова.
            if (v.edges && typeof v.edges.length === 'number') throw new Error('len(): аргумент — объект графа; используйте len(g.edges) или len(graphNodes(g))');
            if (v.els && typeof v.els.length === 'number') throw new Error('len(): аргумент — объект poset; используйте len(posetElements(p))');
            throw new Error('len(): аргумент не является массивом/строкой (нет свойства length)');
        },
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
        // Задача 3: экспорт анимации (Start/Update, слайдеры) в видео — см. glExportVideo/
        // glStartRecording/glStopRecording выше. exportVideo — запись фиксированной длины;
        // startRecording/stopRecording — запись произвольной длины, управляемая вручную
        // (например, из двух кнопок UI).
        exportVideo: (filename, durationSeconds) => glExportVideo(filename, durationSeconds),
        startRecording: (filename) => glStartRecording(filename),
        stopRecording: () => glStopRecording(),
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
        // addNode(g, имя, pos, подпись): необязательная подпись — когда в графе одинаковые
        // по смыслу узлы (остаток 1 на разных уровнях дерева) должны различаться по имени.
        addNode: (g, label, pos, text) => { g.nodes[label] = { label: text === undefined ? label : text, pos: pos || [0, 0] }; return g; },
        // addEdge(g, a, b, вес, цвет) — необязательный цвет отдельного ребра
        addEdge: (g, a, b, weight, color) => { g.edges.push({ a, b, weight: weight === undefined ? 1 : weight, color: color }); return g; },
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
        // Имя функции строкой принимают solve/bisect/findRoots/sumSeries/limitAt и т.д.,
        // а derivative/integral раньше — нет: derivative("f", x) падал с "f is not a function".
        // Приводим к общему виду через glAsFunc, чтобы правило было одно на всю библиотеку.
        derivative: (f, x) => {
            const fn = glAsFunc(f);
            const h = Math.max(1e-6, Math.abs(x) * 1e-6);
            return (fn(x + h) - fn(x - h)) / (2 * h);
        },
        integral: (f, a, b) => glAdaptiveSimpson(glAsFunc(f), a, b, 1e-8, 20),
        solve: (f, x0) => glNewtonSolve(typeof f === 'string' ? glMakeFuncWrapper(f) : f, x0),
        solveSystem: (fs, x0) => glNewtonSolveSystem(fs.map(f => typeof f === 'string' ? glMakeFuncWrapper(f) : f), x0),

        // === Числа и утилиты ===
        sign: Math.sign, trunc: Math.trunc, cbrt: Math.cbrt, hypot: Math.hypot,
        log2: Math.log2, log10: Math.log10, logBase: (x, b) => Math.log(x) / Math.log(b),
        clamp: (x, a, b) => Math.min(b, Math.max(a, x)),
        lerp: (a, b, t) => a + (b - a) * t,
        fract: (x) => x - Math.floor(x),
        roundTo: (x, d) => { const k = Math.pow(10, d === undefined ? 0 : d); return Math.round(x * k) / k; },
        format: (x, d) => (typeof x === 'number' && isFinite(x)) ? __gcDec(x.toFixed(d === undefined ? 2 : d)) : String(x),
        str: (x) => {
            if (glIsComplex(x)) return x.re + (x.im >= 0 ? '+' : '') + x.im + 'i';
            if (glIsRat(x)) return glRatToString(x);
            if (typeof x === 'bigint') return String(x);
            return typeof x === 'number' ? __gcDec(String(x)) : String(x);
        },
        num: (s) => parseFloat(String(s).replace(',', '.')),
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
        luDecompose: (A) => glLuDecompose(A),
        qrDecompose: (A) => glQrDecompose(A),
        cholesky: (A) => glCholesky(A),

        // === Многомерный анализ ===
        gradient: (f, point, h) => glGradient(f, point, h),
        jacobian: (fs, point, h) => glJacobian(fs, point, h),
        divergence: (fs, point, h) => glDivergence(fs, point, h),
        curl: (fs, point, h) => glCurl(fs, point, h),
        hessian: (f, point, h) => glHessian(f, point, h),
        laplacian: (f, point, h) => glLaplacian(f, point, h),
        directionalDerivative: (f, point, dir, h) => glDirDerivative(f, point, dir, h),

        // === Логика ===
        truthTable: (vars, f) => glTruthTable(vars, f),
        isTautology: (vars, f) => glIsTautology(vars, f),
        isSatisfiable: (vars, f) => glIsSatisfiable(vars, f),
        isContradiction: (vars, f) => glIsContradiction(vars, f),
        models: (vars, f) => glModels(vars, f),
        logicEquiv: (vars, f, g) => glLogicEquiv(vars, f, g),

        // === Множества ===
        setUnion: (a, b) => glSetUnion(a, b),
        setIntersect: (a, b) => glSetIntersect(a, b),
        setDiff: (a, b) => glSetDiff(a, b),
        setSymDiff: (a, b) => glSetSymDiff(a, b),
        isSubset: (a, b) => glIsSubset(a, b),
        setEqual: (a, b) => glSetEqual(a, b),
        cartesian: (a, b) => glCartesian(a, b),
        vennRegions: (sets) => glVennRegions(sets),

        // === Распределения и статистические критерии ===
        tPdf: (x, df) => glTPdf(x, df),
        tCdf: (x, df) => glTCdf(x, df),
        chi2Pdf: (x, k) => glChi2Pdf(x, k),
        chi2Cdf: (x, k) => glChi2Cdf(x, k),
        fPdf: (x, d1, d2) => glFPdf(x, d1, d2),
        fCdf: (x, d1, d2) => glFCdf(x, d1, d2),
        normalQuantile: (p) => glNormalQuantile(p),
        tQuantile: (p, df) => glTQuantile(p, df),
        chi2Quantile: (p, k) => glChi2Quantile(p, k),
        fQuantile: (p, d1, d2) => glFQuantile(p, d1, d2),
        tTest: (sample, mu0) => glTTest1(sample, mu0),
        tTest2: (a, b) => glTTest2(a, b),
        chiSquareTest: (obs, exp) => glChiSquareTest(obs, exp),
        confInterval: (sample, level) => glConfInterval(sample, level),
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
            // Раньше здесь был throw — из-за чего один вызов inv() на вырожденной матрице
            // обрывал ВЕСЬ Start/Update (см. glRun/glExecStatements: исключение прерывает
            // весь блок операторов, а не только текущее присваивание), и все остальные,
            // никак не связанные с этой матрицей вычисления в том же блоке тоже не
            // выполнялись. det()/solveLinear() для такого же случая уже давно возвращают
            // 0/null вместо исключения — приводим inv() к тому же поведению.
            if (Math.abs(A[piv][col]) < 1e-12) return null;
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
                // Уже финализированные (visited) вершины не релаксируем — это не просто
                // оптимизация, а необходимое условие корректности: без этой проверки
                // ребро с отрицательным весом (граф не ориентированный, поэтому оно
                // "туда-обратно" всегда отрицательный цикл) может переписать prev[] так,
                // что в prev[] образуется цикл (A указывает на B, B указывает на A), и
                // восстановление пути ниже уходит в бесконечный цикл — реальный баг,
                // вешавший страницу целиком на графах с отрицательными весами.
                if (visited.has(nb.node)) continue;
                const alt = dist[u] + nb.weight;
                if (alt < (dist[nb.node] === undefined ? Infinity : dist[nb.node])) { dist[nb.node] = alt; prev[nb.node] = u; }
            }
        }
        if (dist[end] === undefined || !isFinite(dist[end])) return null;
        const path = [end];
        let cur = end;
        // Доп. защита от зависания: даже если где-то ещё найдётся способ создать цикл
        // в prev[] (алгоритм Дейкстры в принципе не гарантирует корректность при
        // отрицательных весах), путь не может быть длиннее числа вершин графа —
        // после этого останавливаемся, а не крутимся вечно.
        const maxSteps = Object.keys(g.nodes).length + 1;
        let guard = 0;
        while (prev[cur] !== undefined) {
            cur = prev[cur]; path.unshift(cur);
            if (++guard > maxSteps) break;
        }
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
    // Подгруппа как аргумент часто приходит либо голым массивом элементов, либо
    // целиком объектом группы (например, из alternatingGroup(4) или groupGenerated(...)) —
    // раньше функции ниже ожидали строго массив и падали с "sub is not iterable", если
    // передали объект группы, хотя это самый естественный способ его получить.
    function glGroupElsOf(sub) {
        if (Array.isArray(sub)) return sub;
        if (sub && Array.isArray(sub.els)) return sub.els;
        throw new Error('Подгруппа должна быть массивом элементов или объектом группы (с полем els)');
    }
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
        sub = glGroupElsOf(sub);
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
        sub = glGroupElsOf(sub);
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
        sub = glGroupElsOf(sub);
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

    ${gcSharedExprParserLines().join('')}

    function glParseProgram(src) { return glCreateParser(glTokenize(src)).parseProgram(); }
    function glParseExprOnly(src) { return glCreateParser(glTokenize(src)).parseExpr(); }

    // Задача 1: пользовательские функции func f(x) = ...;
    const GL_USER_FUNCS = {};
    let glUserFuncVersion = 0;
    let glLocusSweeping = false; // во время обхода ГМТ следы не накапливаются
    function glCallUserFunc(name, args) {
        const fn = GL_USER_FUNCS[name];
        if (!fn) throw new Error('Неизвестная функция: ' + name);
        const localCtx = { time: elapsedTime, __gcFnScope: true };
        fn.params.forEach((p, i) => { localCtx[p] = args[i]; });
        if (fn.bodyStmts) {
            // Function/Void: многострочное тело со statements; возврат значения — через
            // исключение GLReturnSignal (перехватывается здесь же). Void без явного
            // return просто возвращает undefined — как и положено процедуре.
            // return в синхронном исполнителе возвращается значением-сигналом, а не
            // исключением: throw на каждом return в горячих функциях (кривые, поля, по
            // сотне вызовов на кадр) тормозил отрисовку в десятки раз.
            let r;
            try { r = glExecStatementsSync(fn.bodyStmts, localCtx); }
            catch (e) { if (e instanceof GLReturnSignal) return e.value; throw e; }
            return (r instanceof GLReturnSignal) ? r.value : undefined;
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
                // ВАЖНО: проверяем именно наличие свойства (in), а не "!== undefined".
                // Раньше здесь было "window[node.name] !== undefined", из-за чего переменная,
                // которой законно присвоили значение undefined (например, из-за отдельного бага
                // в len() на не-массиве — см. историю правок), навсегда становилась
                // неотличима от "переменная не существует": да, она формально ЕСТЬ на window,
                // но с значением undefined, и код после присваивания выбрасывал "Неизвестный
                // идентификатор" при каждой попытке её прочитать — вместо того чтобы вернуть
                // undefined как обычное (пусть и бесполезное) значение выражения.
                if (node.name in window) return window[node.name];
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
        // строковая конкатенация; числа — с десятичным разделителем сайта
        if (op === '+') return (typeof l === 'number' ? __gcDec(String(l)) : l) + (typeof r === 'number' ? __gcDec(String(r)) : r);
        throw new Error('Неподдерживаемая операция "' + op + '" для данных операндов');
    }
    function glApplyCompound(cur, val, op) {
        if (op === '=') return val;
        return glBinaryOp(cur, val, op[0]);
    }
    function glResolvePath(segs, ctx) {
        const rootName = segs[0].name;
        let obj = (ctx && rootName in ctx) ? ctx[rootName] : window[rootName];
        if (obj === undefined) throw new Error('Неизвестный объект: ' + rootName);
        for (let i = 1; i < segs.length - 1; i++) {
            if (obj === undefined || obj === null) throw new Error('Некорректный путь: ' + glPathToString(segs));
            const seg = segs[i];
            obj = (seg.type === 'index') ? obj[glEvalExpr(seg.expr, ctx)] : obj[seg.name];
        }
        const last = segs[segs.length - 1];
        const lastKey = (last.type === 'index') ? glEvalExpr(last.expr, ctx) : last.name;
        return { obj, lastKey };
    }
    // Только для читаемых сообщений об ошибках (не участвует в резолве).
    function glPathToString(segs) { return segs.map(s => s.type === 'index' ? '[...]' : s.name).join('.').replace(/\\.\\[/g, '['); }
    function glApplySingleAssign(a, ctx) {
        const val = glEvalExpr(a.expr, ctx);
        if (a.path.length === 1) {
            const name = a.path[0].name;
            // Тело цикла (repeat/while/for) исполняется в дочерней области (Object.create(ctx)),
            // поэтому присваивание пишется туда, где переменная объявлена: раньше тело шло в
            // КОПИИ контекста, и, например, a = b в цикле внутри Function(a, b) терялось.
            let owner = ctx;
            // Объявление (float x = …) внутри Function/Void или тела цикла создаёт ЛОКАЛЬНУЮ
            // переменную этой области. Раньше оно писало в глобальную область: локальная
            // string s в одной функции затирала переменную s вызывающего кода. Объявления на
            // верхнем уровне Start/Update по-прежнему глобальные (как и раньше).
            if (a.decl && ctx && (ctx.__gcFnScope || Object.getPrototypeOf(ctx) !== Object.prototype)) owner = ctx;
            else while (owner && owner !== Object.prototype && !Object.prototype.hasOwnProperty.call(owner, name)) owner = Object.getPrototypeOf(owner);
            if (owner && owner !== Object.prototype) {
                owner[name] = a.op === '=' ? val : glApplyCompound(owner[name], val, a.op);
                if (owner[name] && typeof owner[name] === 'object' && 'dirty' in owner[name]) owner[name].dirty = true;
            } else {
                window[name] = a.op === '=' ? val : glApplyCompound(window[name], val, a.op);
                if (window[name] && typeof window[name] === 'object' && 'dirty' in window[name]) window[name].dirty = true;
            }
        } else {
            const { obj, lastKey } = glResolvePath(a.path, ctx);
            obj[lastKey] = a.op === '=' ? val : glApplyCompound(obj[lastKey], val, a.op);
            const rootName = a.path[0].name;
            const root = (ctx && rootName in ctx) ? ctx[rootName] : window[rootName];
            if (root && typeof root === 'object' && 'dirty' in root) root.dirty = true;
        }
    }
    async function glExecStatements(stmts, ctx) { for (const s of stmts) await glExecStatement(s, ctx); }
    // Сигнал возврата значения из Function/Void: используется исключение вместо обычного
    // return, т.к. глубина вложенности блоков (if/repeat/forEach) произвольна, а нужно
    // прервать выполнение сразу до самого вызова функции.
    class GLReturnSignal { constructor(value) { this.value = value; } }
    async function glExecStatement(s, ctx) {
        switch (s.type) {
            case 'assign': glApplySingleAssign(s, ctx); break;
            case 'multiAssign': for (const a of s.assigns) glApplySingleAssign(a, ctx); break;
            case 'if':
                if (glEvalExpr(s.cond, ctx)) await glExecStatements(s.thenB, ctx);
                else if (s.elseB) await glExecStatements(s.elseB, ctx);
                break;
            case 'repeat': {
                const cnt = Math.max(0, Math.floor(glEvalExpr(s.count, ctx)));
                for (let i = 0; i < cnt; i++) await glExecStatements(s.body, Object.assign(Object.create(ctx), { i }));
                break;
            }
            case 'while': {
              let guard = 0;
              while (glEvalExpr(s.cond, ctx)) {
                if (++guard > 1000000) throw new Error('Цикл while превысил 1000000 итераций — похоже, условие никогда не станет ложным');
                await glExecStatements(s.body, Object.assign(Object.create(ctx), { i: guard - 1 }));
              }
              break;
            }
            case 'forEach': {
                const coll = glEvalExpr(s.coll, ctx);
                if (Array.isArray(coll)) {
                    for (const item of coll) await glExecStatements(s.body, Object.assign(Object.create(ctx), { [s.varName]: item }));
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
    function glExecStatementsSync(stmts, ctx) { for (const s of stmts) { const r = glExecStatementSync(s, ctx); if (r !== undefined) return r; } return undefined; }
    function glExecStatementSync(s, ctx) {
        switch (s.type) {
            case 'assign': glApplySingleAssign(s, ctx); break;
            case 'multiAssign': for (const a of s.assigns) glApplySingleAssign(a, ctx); break;
            case 'if':
                if (glEvalExpr(s.cond, ctx)) return glExecStatementsSync(s.thenB, ctx);
                else if (s.elseB) return glExecStatementsSync(s.elseB, ctx);
                break;
            case 'repeat': {
                const cnt = Math.max(0, Math.floor(glEvalExpr(s.count, ctx)));
                for (let i = 0; i < cnt; i++) { const r = glExecStatementsSync(s.body, Object.assign(Object.create(ctx), { i })); if (r !== undefined) return r; }
                break;
            }
            case 'while': {
              let guard = 0;
              while (glEvalExpr(s.cond, ctx)) {
                if (++guard > 1000000) throw new Error('Цикл while превысил 1000000 итераций — похоже, условие никогда не станет ложным');
                const r = glExecStatementsSync(s.body, Object.assign(Object.create(ctx), { i: guard - 1 })); if (r !== undefined) return r;
              }
              break;
            }
            case 'forEach': {
                const coll = glEvalExpr(s.coll, ctx);
                if (Array.isArray(coll)) {
                    for (const item of coll) { const r = glExecStatementsSync(s.body, Object.assign(Object.create(ctx), { [s.varName]: item })); if (r !== undefined) return r; }
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
                return new GLReturnSignal(s.expr ? glEvalExpr(s.expr, ctx) : undefined);
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
            '    // ---- Текст под холстом: {выражение} → живые переменные, лёгкий markdown, KaTeX ----\n',
            ...gcSharedMarkdownKatexLines('    '),
            '    let __gcLastDescRendered = null;\n',
            '    let __gcLastDescAlign = null;\n',
            '    function updateDescription() {\n',
            '      // В совмещённой 2D+3D сцене за #infoText отвечает 3D-скрипт (updateDescription3D)\n',
            '      // — оба читают одни и те же переменные (через синхронизирующий Proxy, см.\n',
            '      // generate3D), так что дублировать перерисовку тут незачем.\n',
            '      if (typeof window.__gcCombined !== \'undefined\' && window.__gcCombined) return;\n',
            '      if (!infoPanel) return;\n',
            '      if (!GC_DESCRIPTION_RAW) { infoPanel.style.display = \'none\'; return; }\n',
            '      infoPanel.style.display = \'\';\n',
            '      const liveAlign = (window.descAlign === \'left\' || window.descAlign === \'center\' || window.descAlign === \'right\') ? window.descAlign : GC_DESCRIPTION_ALIGN;\n',
            '      const offX = (typeof window.descOffsetX === \'number\') ? window.descOffsetX : 0;\n',
            '      const offY = (typeof window.descOffsetY === \'number\') ? window.descOffsetY : 0;\n',
            '      infoPanel.style.transform = (offX || offY) ? (\'translate(\' + offX + \'px,\' + offY + \'px)\') : \'\';\n',
            '      let substituted;\n',
            '      try { substituted = gcSubstitutePlaceholders(GC_DESCRIPTION_RAW, function(expr) { return evaluate(expr); }); }\n',
            '      catch (e) { substituted = GC_DESCRIPTION_RAW; }\n',
            '      if (substituted === __gcLastDescRendered && liveAlign === __gcLastDescAlign) return;\n',
            '      __gcLastDescRendered = substituted;\n',
            '      __gcLastDescAlign = liveAlign;\n',
            '      infoPanel.innerHTML = gcRenderDescriptionHtml(substituted, liveAlign);\n',
            '      // Живое описание ("{info}") меняет длину при движении ползунков; если высота блока\n',
            '      // ходит туда-обратно, страница (и iframe справочника, подгоняемый по высоте) дёргается.\n',
            '      // Поэтому высота только растёт: min-height держит максимум уже показанной.\n',
            '      infoPanel.style.boxSizing = \'border-box\';\n',
            '      infoPanel.style.minHeight = Math.max(parseFloat(infoPanel.style.minHeight) || 0, infoPanel.offsetHeight) + \'px\';\n',
            '    }\n',
            '\n',
            ...gcSharedUIBuilderLines('    '),
            '    function createUI() {\n',
            '        gcBuildUI(uiData, {\n',
            '            clearOverlay: false,\n',
            '            trackWrapper: true,\n',
            '            numberStepSnap: true,\n',
            '            smoothing: ', String(dragSmoothing), ',\n',
            '            numberInputBlur: true,\n',
            '            getVar: function(name) { return getNestedValue(window, name); },\n',
            '            setVar: function(name, val) { setNestedValue(window, name, val); },\n',
            '            onInteract: function() { figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw(); },\n',
            '            runButtonAction: async function(action) {\n',
            '                await glRun(action);\n',
            '                figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw();\n',
            '            },\n',
            '            parseFormula: function(src) { return glParseExprOnly(src); },\n',
            '            registerUserFunc: function(name, ast) { GL_USER_FUNCS[name] = { params: [\'x\'], bodyAst: ast }; glUserFuncVersion++; },\n',
            '            onFormulaError: function(funcName, label, message) { glLog(\'warn\', \'Формула "\' + funcName + \'" (поле "\' + label + \'"): \' + message); },\n',
            '            defaultColor: function() { return __gcDefaultColor(); },\n',
            '            buttonTextColor: function() { return __gcButtonTextColor(); },\n',
            '        });\n',
            '    }\n',
            '\n',
            '    let startCode = ' + startCodeEscaped + ';\n',
            '    let updateCode = ' + updateCodeEscaped + ';\n',
            '\n',
            '    for (let f of figures) { if (window[f.name] !== undefined) glLog(\'warn\', "Фигура "+f.name+" уже существует в window"); window[f.name] = f; }\n',
            '    let Start = async function() { await glRun(startCode); };\n',
            // "Часы" 2D-слоя — единственный источник времени в совмещённой (2D+3D) сцене:
            // 2D выполняет Start/Update один раз за кадр (см. combineHtml2D3D — 3D-копия
            // того же кода в комбинированном режиме не запускается, во избежание двойного
            // применения побочных эффектов вроде t += dt). Чтобы выражения в 3D-слое,
            // использующие переменную time, не расходились с 2D по фазе (иначе у каждого
            // слоя был бы свой независимый requestAnimationFrame-таймер), публикуем текущее
            // elapsedTime в window.__gcElapsedTime — 3D-слой в комбинированном режиме
            // читает его оттуда вместо собственных часов.
            '    let Update = async function() { elapsedTime = (performance.now() - glStartTime) / 1000; window.__gcElapsedTime = elapsedTime; await glRun(updateCode); };\n',
            '\n',
            '    initUserFuncs(); initPoints(); initLines(); initCircles(); initArcs(); initEllipses(); initCurves(); initDrawFunctions(); initDrawSurfaces(); initDrawImages(); initDrawHistograms(); initDrawFields(); initDrawTrajectories(); initDrawGraphs(); initDrawFractals(); initDrawLoci(); initDrawFormulas(); initDrawDistributions(); initFigures(); initAngles();\n',
            '    initDrawAngles(); initDrawEqually(); initDrawVectors(); initDrawInfLines(); initDrawFillings(); initDrawPunctirs();\n',
            '    initDrawTexts();\n',
            '    initClusters(); // после ВСЕХ initDrawXxx выше — резолвер элементов кластера ищет буквально по всем типам объектов (см. initClusters), и им всем нужно уже существовать в рантайм-массивах.\n',
            '    for (let coll of [points, lines, circles, ellipses, arcs, curves, figures, drawFunctions, drawSurfaces, drawImages, drawFillings, drawTexts, drawVectors, drawInfLines, drawPunctirs, drawEqually, drawAngles, drawHistograms, drawFields, drawTrajectories, drawGraphs]) {\n',
            '      for (let o of coll) { if (o && o.dirty === undefined) o.dirty = true; }\n',
            '    }\n',
            '    for (let coll of [drawFractals]) {\n',
            '      for (let o of coll) { if (o && o.dirty === undefined) o.dirty = true; }\n',
            '    }\n',
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
            '    for (let d of drawDistributions) { window[d.name] = d; }\n',
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
            '    // Первый пересчёт сцены — только ПОСЛЕ регистрации объектов в window: выражения\n',
            '    // точек (translate dx = D.pos.x - A.pos.x, rotate angle = ..., и т.п.) ссылаются на\n',
            '    // другие объекты по имени. Раньше updateScene() стоял до регистрации, и первый\n',
            '    // кадр сыпал предупреждениями «Неизвестный идентификатор» и строил точки неверно.\n',
            '    updateScene();\n',
            '\n',
            '    // Первый вызов updateScene() (чуть выше) раньше случался ДО этой\n',
            '    // регистрации — на тот момент window.A и т.п. ещё не существовали. Для\n',
            '    // прежних обязанностей updateScene() (пересчёт кругов/эллипсов/дуг) это было не важно —\n',
            '    // они работают с массивами напрямую, а не по window[имя]. Но new Publish{} резолвит\n',
            '    // ссылки на именованные объекты именно через window — без этого повторного тика\n',
            '    // значение на статичной сцене (без Start/Update/анимаций) навсегда осталось бы\n',
            '    // «Неизвестный идентификатор» вместо настоящего числа.\n',
            '    __gcPublishReady = true;\n',
            '    gcPublishTick();\n',
            '\n',
            '    resizeCanvas(); createUI();\n',
            '    if (startCode && startCode.trim()) { (async function() { await Start(); figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene(); draw(); })(); }\n',
            '    // runUpdate теперь ВСЕГДА определена (а не только при непустом Update{}), потому что\n',
            '    // анимации (animate()/animateColor()) должны тикать даже если автор скрипта вообще не\n',
            '    // писал блок Update — см. gcStartAnimLoop, который лениво запускает этот же цикл.\n',
            '    let updateRunning = false;\n',
            '    const hasUpdateBlock = !!(updateCode && updateCode.trim());\n',
            '    async function runUpdate() {\n',
            '      if (updateRunning) return; updateRunning = true;\n',
            '      try {\n',
            '        if (!window.__gcAnimOwner) window.__gcAnimOwner = \'2d\';\n',
            '        if (window.__gcAnimOwner === \'2d\') {\n',
            '          const now = (typeof performance !== \'undefined\' && performance.now) ? performance.now() / 1000 : Date.now() / 1000;\n',
            '          const dt = (__gcLastFrameTime === null) ? 0 : Math.min(0.25, Math.max(0, now - __gcLastFrameTime));\n',
            '          __gcLastFrameTime = now;\n',
            '          gcTickAnimations(dt);\n',
            '        }\n',
            '        const draggedPt = draggedPointIndex !== -1 ? points[draggedPointIndex] : null;\n',
            '        if (isDragging && draggedPt && draggedPt.pauseOnDrag !== false) { /* пауза анимации на время перетаскивания этой точки */ } else {\n',
            '          if (hasUpdateBlock) {\n',
            '            await Update();\n',
            '            for (let p of points) {\n',
            // Неперетаскиваемые точки (dynamic = false) не прижимаются к полю: их положение
            // задаёт сам сценарий (пересечения прямых, центры и т. п.), и прижатие ломало
            // построение — например, точка пересечения за краем поля оказывалась на краю.
            '              if (p.hidden || p.dynamic === false || p.lineName || p.circleName || p.ellipseName || p.curveName || p.arcName || p.graphName || p.construct || p.transform) continue;\n',
            '              const hw = gcFieldHalfW(), hh = gcFieldHalfH();\n',
            '              if (p.pos.x < -hw) p.pos.x = -hw; if (p.pos.x > hw) p.pos.x = hw;\n',
            '              if (p.pos.y < -hh) p.pos.y = -hh; if (p.pos.y > hh) p.pos.y = hh;\n',
            '            }\n',
            '          }\n',
            '          figures.forEach(applyFigureTransform); clusters.forEach(applyClusterTransform); updateScene();\n',
            '          if (window.autoRedraw !== false) draw();\n',
            '        }\n',
            '      } catch(e) { console.error(\'Ошибка в цикле Update:\', e); }\n',
            '      updateRunning = false;\n',
            '      if (hasUpdateBlock || gcHasActiveAnimations()) { requestAnimationFrame(runUpdate); }\n',
            '      else { __gcAnimLoopRunning = false; }\n',
            '    }\n',
            '    if (hasUpdateBlock) { __gcAnimLoopRunning = true; runUpdate(); }\n',
            '\n',

            '    window.__gc2D_canvas = canvas;\n',
            '    // полная перерисовка снаружи (визуальный редактор двигает объекты в живой сцене)\n',
            '    window.__gcRedraw = function() { markSceneChanged(); if (typeof updateScene === \'function\') updateScene(); draw(); };\n',
            '    window.__gc2D_isActive = function() { return dragMode !== null || isPanning; };\n',
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

export { generate2D };

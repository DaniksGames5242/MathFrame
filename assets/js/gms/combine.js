// assets/js/gms/combine.js
// Склейка 2D- и 3D-слоёв в одну страницу (сцены, где есть и то, и другое).
// Часть компилятора GMS; точка входа — assets/js/gms-compiler.js.



        // ========== КОМПИЛЯЦИЯ ==========
// Извлекает из уже готового (полного, самодостаточного) HTML, который вернул generate2D
// или generate3D, две части: внутреннее содержимое .canvas-wrapper (сам <canvas> и оверлеи)
// и внутренний код <script>...</script> (сам движок — обе функции оборачивают его в
// (function(){...})(), так что это можно безопасно вставлять рядом со вторым таким же
// блоком без риска конфликта имён переменных). canvasId используется вместо общего для
// обеих функций id="mainCanvas", чтобы у двух холстов на одной странице не было коллизии.
function extractCanvasAndScript(fullHtml, canvasId) {
    const canvasMarker = '<canvas id="mainCanvas"></canvas>';
    const wrapperCloseMarker = '\n  </div>\n  <div class="controls"';
    const scriptOpenMarker = '<script>\n';
    const scriptCloseMarker = '</script>\n</body>\n</html>';

    const cStart = fullHtml.indexOf(canvasMarker);
    const cEnd = fullHtml.indexOf(wrapperCloseMarker, cStart);
    const sStart = fullHtml.indexOf(scriptOpenMarker) + scriptOpenMarker.length;
    const sEnd = fullHtml.lastIndexOf(scriptCloseMarker);
    if (cStart < 0 || cEnd < 0 || sStart < 0 || sEnd < 0) {
        throw new Error('Не удалось разобрать сгенерированный HTML для совмещения 2D и 3D (внутренняя ошибка компилятора)');
    }

    let canvasBlock = fullHtml.slice(cStart, cEnd);
    let scriptInner = fullHtml.slice(sStart, sEnd);
    canvasBlock = canvasBlock.split('mainCanvas').join(canvasId);
    scriptInner = scriptInner.split('mainCanvas').join(canvasId);
    return { canvasBlock, scriptInner };
}

// Совмещает уже сгенерированные html2D/html3D в одну страницу с двумя наложенными,
// прозрачными холстами в одном .canvas-wrapper — оба движка (2D Canvas2D и 3D Three.js)
// работают как и раньше, каждый в своём (function(){...})(), просто теперь оба рисуют
// в одном визуальном контейнере вместо двух отдельных документов.
function combineHtml2D3D(html2D, html3D, layer2D) {
    const frag2D = extractCanvasAndScript(html2D, 'canvas2D');
    const frag3D = extractCanvasAndScript(html3D, 'canvas3D');
    const twoDOnTop = layer2D !== 'below';

    // uiOverlay — общий якорь для UI поверх холста; достаточно одного (3D его уже содержит).
    // formulaOverlay же есть только у 2D (нужен KaTeX-формулам) — его оставляем.
    let canvas2DBlock = frag2D.canvasBlock.replace(
        /\n\s*<div id="uiOverlay"[^>]*><\/div>/, ''
    );

    let combined = html3D;

    // KaTeX теперь подключается напрямую в generate3D (см. его <head>) — раньше только 2D
    // грузил его через CDN, а 3D полагался на этот блок; повторное добавление здесь не нужно.

    // Оба холста накладываются друг на друга внутри .canvas-wrapper (у него уже position:relative).
    combined = combined.replace(
        '  <' + '/style>\n',
        '    .canvas-wrapper canvas { position:absolute; top:0; left:0; width:100%; height:100%; }\n' +
        '  <' + '/style>\n'
    );

    // Порядок в DOM = порядок отрисовки: то, что вставлено позже, оказывается визуально
    // сверху и первым получает события мыши/тача. По умолчанию 2D сверху; '2D layer' = "below"
    // меняет местами (нужен для интерактивности слоя, который сейчас не наверху — см. роутер ниже).
    const canvasMarker = '<canvas id="mainCanvas"></canvas>';
    const wrapperCloseMarker = '\n  </div>\n  <div class="controls"';
    const cStart = combined.indexOf(canvasMarker);
    const cEnd = combined.indexOf(wrapperCloseMarker, cStart);
    const stacked = twoDOnTop
        ? ('\n    ' + frag3D.canvasBlock + '\n    ' + canvas2DBlock.trim())
        : (canvas2DBlock + '\n    ' + frag3D.canvasBlock);
    combined = combined.slice(0, cStart) + stacked + combined.slice(cEnd);

    const scriptOpenMarker = '<script>\n';
    const scriptCloseMarker = '</script>\n</body>\n</html>';
    const sStart = combined.lastIndexOf(scriptOpenMarker);
    const sEnd = combined.lastIndexOf(scriptCloseMarker);

    // Роутер кликов между слоями: верхний холст получает событие первым (обычный DOM-порядок).
    // Если движок верхнего слоя ничего не «забрал» (не начал драг точки/линии/камеры) —
    // передаём это же нажатие нижнему холсту, временно включая ему pointer-events.
    // Так оба слоя остаются интерактивными, а не только тот, что нарисован сверху.
    const routerScript =
        '<script>\n' +
        '(function() {\n' +
        '  function ready() { return window.__gc2D_canvas && window.__gc3D_canvas && window.__gc2D_isActive && window.__gc3D_isActive; }\n' +
        '  function init() {\n' +
        '    if (!ready()) { requestAnimationFrame(init); return; }\n' +
        '    var top2D = ' + String(twoDOnTop) + ';\n' +
        '    var topCanvas = top2D ? window.__gc2D_canvas : window.__gc3D_canvas;\n' +
        '    var bottomCanvas = top2D ? window.__gc3D_canvas : window.__gc2D_canvas;\n' +
        '    var topActive = top2D ? window.__gc2D_isActive : window.__gc3D_isActive;\n' +
        '    bottomCanvas.style.pointerEvents = \'none\';\n' +
        '    function restore() { topCanvas.style.pointerEvents = \'auto\'; bottomCanvas.style.pointerEvents = \'none\'; }\n' +
        '    function forward(e) {\n' +
        '      if (topActive()) return;\n' +
        '      topCanvas.style.pointerEvents = \'none\'; bottomCanvas.style.pointerEvents = \'auto\';\n' +
        '      if (e.type.indexOf(\'touch\') === 0) {\n' +
        '        // Клоны TouchEvent через конструктор ненадёжны кроссбраузерно (особенно Safari),\n' +
        '        // поэтому вместо клонирования самого касания шлём нижнему холсту синтетический\n' +
        '        // mousedown с координатами первого касания — этого достаточно, чтобы «завести»\n' +
        '        // драг в нижнем движке (у него getPointerPos понимает и mouse-, и touch-события).\n' +
        '        // Последующие touchmove/touchend — уже настоящие события пальца, они сами\n' +
        '        // всплывают до window, где у нижнего движка есть свои touchmove/touchend-слушатели.\n' +
        '        var t = e.touches && e.touches[0];\n' +
        '        if (!t) { restore(); return; }\n' +
        '        if (e.cancelable) e.preventDefault();\n' +
        '        var clone = new MouseEvent(\'mousedown\', { clientX: t.clientX, clientY: t.clientY, bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 });\n' +
        '        bottomCanvas.dispatchEvent(clone);\n' +
        '      } else {\n' +
        '        var clone = new MouseEvent(e.type, e);\n' +
        '        bottomCanvas.dispatchEvent(clone);\n' +
        '      }\n' +
        '    }\n' +
        '    topCanvas.addEventListener(\'mousedown\', forward, false);\n' +
        '    topCanvas.addEventListener(\'touchstart\', forward, { passive: false });\n' +
        '    window.addEventListener(\'mouseup\', restore, true);\n' +
        '    window.addEventListener(\'touchend\', restore, true);\n' +
        '  }\n' +
        '  init();\n' +
        '})();\n' +
        '</' + 'script>\n';

    combined = combined.slice(0, sStart + scriptOpenMarker.length) +
        frag2D.scriptInner + '</script>\n' +
        '<script>window.__gcCombined = true;</script>\n' +
        '<script>\n' + frag3D.scriptInner +
        combined.slice(sEnd, sEnd + scriptCloseMarker.length - '</body>\n</html>'.length) +
        routerScript +
        combined.slice(sEnd + scriptCloseMarker.length - '</body>\n</html>'.length);

    return combined;
}

export { combineHtml2D3D, extractCanvasAndScript };

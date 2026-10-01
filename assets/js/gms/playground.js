// assets/js/gms/playground.js
// Профиль компиляции «песочница» (compile(src, { target: 'playground' })).
// Часть компилятора GMS; точка входа — assets/js/gms-compiler.js.
//
// Справочник показывает сцену как пример к теме: описание под холстом, тема
// навязывается страницей снаружи, ширина ограничена колонкой текста. В песочнице
// сцена — самостоятельная программа: всё, что видно, задаёт код. Поэтому здесь
// готовый HTML сцены дообрабатывается, а генераторы 2D/3D не меняются вовсе —
// вывод для справочника (compile без опций) остаётся байт в байт прежним.
//
// Что меняется в профиле песочницы:
//   • сцена вписывается в отведённую область (весь документ / контейнер хоста)
//     с сохранением пропорций поля, без ограничения в 800 px;
//   • описание под холстом не выводится, пока код не попросит: show description = true;
//   • тема — только из кода: theme = light | dark | auto (auto — по умолчанию:
//     тема сайта-хоста или, в скачанном файле, системная);
//   • раскладка и оформление настраиваются параметрами сцены:
//       ui position = bottom | top | left | right | overlay
//       ui align    = start | center | end
//       background  = #rrggbb | transparent    — фон вокруг сцены
//       scene padding = 12                     — отступ вокруг сцены, px
//       frame radius  = 8                      — скругление рамки поля, px
//       scene aspect  = (16, 9)                — пропорции окна 3D-сцены
//       scene max width = 1200                 — предельная ширина поля, px

const UI_POSITIONS = ['bottom', 'top', 'left', 'right', 'overlay'];
const UI_ALIGNS = { start: 'flex-start', center: 'center', end: 'flex-end' };

function num(v, def) { return (typeof v === 'number' && isFinite(v)) ? v : def; }

// Настройки профиля из параметров сцены (уже разобранных validate.js).
export function playgroundSettings(params, has2D, has3D) {
    const uiPosition = UI_POSITIONS.includes(params['ui position']) ? params['ui position'] : 'bottom';
    const uiAlign = UI_ALIGNS[params['ui align']] || 'center';
    let aspect;
    if (has2D) {
        // 2D: пропорции холста — это пропорции поля (иначе исказятся координаты).
        const fw = num(params['field width'], 50), fh = num(params['field height'], 30);
        aspect = fh / fw;
    } else {
        const a = Array.isArray(params['scene aspect']) ? params['scene aspect'] : [5, 3];
        aspect = (a[0] > 0 && a[1] > 0) ? a[1] / a[0] : 3 / 5;
    }
    const bg = params.background;
    return {
        uiPosition, uiAlign, aspect,
        background: (bg === 'transparent' || /^#[0-9a-f]{3,8}$/i.test(bg || '')) ? bg : 'transparent',
        padding: Math.max(0, num(params['scene padding'], 12)),
        radius: Math.max(0, num(params['frame radius'], 8)),
        maxWidth: Math.max(60, num(params['scene max width'], 100000)),
        frameWidth: Math.max(0, num(params['frame width'], 1)),
        showDescription: params['show description'] === true,
        themeAuto: !(params.theme === 'light' || params.theme === 'dark'),
    };
}

function css(st) {
    const row = st.uiPosition === 'left' || st.uiPosition === 'right';
    const lines = [
        'html, body { height:100%; }',
        `body { min-height:0; height:100%; padding:${st.padding}px; display:block; background:${st.background}; overflow:hidden; }`,
        `.container { max-width:none; width:100%; height:100%; display:flex; flex-direction:${row ? 'row' : 'column'}; align-items:center; justify-content:center; gap:12px; position:relative; }`,
        '.canvas-wrapper { flex:0 0 auto; max-width:none; margin:0; aspect-ratio:auto; border-radius:' + st.radius + 'px; }',
        '.controls { margin:0; flex:0 0 auto; justify-content:' + st.uiAlign + '; }',
        '.info-panel { margin:0; max-width:none; width:100%; flex:0 0 auto; overflow:auto; max-height:40%; }',
    ];
    if (!st.showDescription) lines.push('.info-panel { display:none !important; }');
    if (st.uiPosition === 'top') lines.push('.controls { order:-1; }');
    if (row) {
        lines.push('.controls { flex-direction:column; align-items:stretch; align-self:center; max-width:40%; max-height:100%; overflow:auto; }');
        if (st.uiPosition === 'left') lines.push('.controls { order:-1; }');
        lines.push('.info-panel { position:absolute; left:0; right:0; bottom:0; }');
    }
    if (st.uiPosition === 'overlay') {
        lines.push('.canvas-wrapper .controls { position:absolute; z-index:20; left:10px; top:10px; max-width:calc(100% - 20px); padding:8px 10px; border-radius:10px; ' +
            'background:color-mix(in srgb, var(--gc-control-bg) 82%, transparent); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); box-shadow:0 6px 20px rgba(0,0,0,.18); }');
        lines.push('.controls:empty { display:none; }');
    }
    return '  <style id="gc-playground">\n    ' + lines.join('\n    ') + '\n  </style>\n';
}

// Скрипт до сцены: вписывание поля в область и тема «auto».
function headScript(st) {
    return '<script>\n(function(){\n' +
        '  var ST = ' + JSON.stringify({ ui: st.uiPosition, aspect: st.aspect, maxWidth: st.maxWidth, frame: st.frameWidth, themeAuto: st.themeAuto }) + ';\n' +
        '  window.__gcPgSettings = ST;\n' +
        '  function visible(el) { return el && getComputedStyle(el).display !== "none" && (el.childElementCount > 0 || el.textContent.trim() !== ""); }\n' +
        '  // Размер поля: наибольший, что помещается в .container рядом с панелью UI и описанием.\n' +
        '  window.__gcPgFit = function() {\n' +
        '    var c = document.querySelector(".container"), w = document.querySelector(".canvas-wrapper");\n' +
        '    if (!c || !w) return 800;\n' +
        '    var gap = 12, availW = c.clientWidth, availH = c.clientHeight;\n' +
        '    var ui = document.getElementById("uiContainer"), info = document.getElementById("infoText");\n' +
        '    if (visible(ui)) { if (ST.ui === "left" || ST.ui === "right") availW -= ui.offsetWidth + gap; else if (ST.ui !== "overlay") availH -= ui.offsetHeight + gap; }\n' +
        '    if (visible(info) && ST.ui !== "left" && ST.ui !== "right") availH -= info.offsetHeight + gap;\n' +
        '    var f = 2 * ST.frame; availW -= 6; availH -= 6; // запас под тень рамки\n' +
        '    var wpx = Math.floor(Math.max(60, Math.min(availW - f, (availH - f) / ST.aspect, ST.maxWidth)));\n' +
        '    w.style.width = (wpx + f) + "px"; w.style.height = (Math.floor(wpx * ST.aspect) + f) + "px";\n' +
        '    return wpx;\n' +
        '  };\n' +
        '  // Панель UI и описание появляются и меняются после запуска сцены — поле\n' +
        '  // перевписывается через тот же resize, на который подписаны движки 2D/3D.\n' +
        '  var queued = false;\n' +
        '  function refit() { if (queued) return; queued = true; requestAnimationFrame(function(){ queued = false; window.__gcPgFit(); window.dispatchEvent(new Event("resize")); }); }\n' +
        '  window.__gcPgRefit = refit;\n' +
        '  window.addEventListener("resize", function(){ window.__gcPgFit(); });\n' +
        '  document.addEventListener("DOMContentLoaded", function(){\n' +        '    // overlay: панель UI лежит поверх самого поля — переносим её внутрь рамки поля\n' +
        '    if (ST.ui === "overlay") { var ui = document.getElementById("uiContainer"), w = document.querySelector(".canvas-wrapper"); if (ui && w && ui.parentNode !== w) w.appendChild(ui); }\n' +
        '    if (typeof ResizeObserver === "function") {\n' +
        '      var ro = new ResizeObserver(refit);\n' +
        '      ["uiContainer", "infoText"].forEach(function(id){ var el = document.getElementById(id); if (el) ro.observe(el); });\n' +
        '      var c = document.querySelector(".container"); if (c) ro.observe(c);\n' +
        '    }\n' +
        '    refit();\n' +
        '  });\n' +
        '})();\n<' + '/script>\n';
}

// Скрипт сразу перед движком: размер обёртки 3D-сцены должен быть известен до её init.
const PRE_ENGINE = '<script>window.__gcPgFit && window.__gcPgFit();<' + '/script>\n';

// Тема «auto» в самостоятельном файле — по системной теме; во встроенном режиме тему
// ставит хост (window.__gcPgEmbedded) через geocompilerSetTheme.
const TAIL = '<script>\n(function(){\n' +
    '  var ST = window.__gcPgSettings || {};\n' +
    '  if (!ST.themeAuto || window.__gcPgEmbedded || !window.matchMedia || !window.geocompilerSetTheme) return;\n' +
    '  var mq = matchMedia("(prefers-color-scheme: dark)");\n' +
    '  function apply(){ window.geocompilerSetTheme(mq.matches ? "dark" : "light"); }\n' +
    '  apply(); if (mq.addEventListener) mq.addEventListener("change", apply);\n' +
    '})();\n<' + '/script>\n';

// Описание в справочнике переводится из markdown в HTML без экранирования: там сцена
// живёт в изолированном iframe. Песочница показывает сцену прямо на странице сайта,
// а код может прийти по чужой ссылке «Поделиться», — поэтому здесь текст описания
// экранируется (формулы KaTeX уже вынуты в заглушки и не страдают), а ссылки
// допускаются только http(s), относительные, якоря и mailto.
const MD_LINK_OLD = "s = s.replace(/\\[([^\\]]+)\\]\\(([^)\\s]+)\\)/g, '<a href=\"$2\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>');";
const MD_LINK_NEW = "s = s.replace(/\\[([^\\]]+)\\]\\(([^)\\s]+)\\)/g, function(m, t, u) { return /^(https?:|mailto:|\\/|#|\\.)/i.test(u) ? '<a href=\"' + u + '\" target=\"_blank\" rel=\"noopener noreferrer\">' + t + '</a>' : t; });";
const DESC_SRC_OLD = 'const src = mathRes.text;';
const DESC_SRC_NEW = "const src = mathRes.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');";

export function applyPlaygroundProfile(html, params, has2D, has3D) {
    const st = playgroundSettings(params, has2D, has3D);
    let out = html;
    // 0) безопасный вывод описания (см. выше)
    if (out.indexOf(DESC_SRC_OLD) < 0 || out.indexOf(MD_LINK_OLD) < 0) throw new Error('Профиль песочницы: не найден вывод описания в сцене (внутренняя ошибка компилятора)');
    out = out.split(DESC_SRC_OLD).join(DESC_SRC_NEW).split(MD_LINK_OLD).join(MD_LINK_NEW);
    // 1) стили профиля — последними в <head>, поверх стилей сцены
    out = out.replace('</head>', css(st) + headScript(st) + '</head>');
    // 2) 2D: ширина холста — из вписывания, а не «до 800 px по ширине колонки»
    out = out.split('const maxWidth = Math.min(800, wrapper.clientWidth);').join('const maxWidth = (window.__gcPgFit ? window.__gcPgFit() : Math.min(800, wrapper.clientWidth));');
    // 3) вписать поле до запуска движка (первый <script> без src внутри <body>)
    const bodyAt = out.indexOf('<body>');
    const engineAt = out.indexOf('<script>\n', bodyAt);
    if (engineAt > 0) out = out.slice(0, engineAt) + PRE_ENGINE + out.slice(engineAt);
    // 4) тема auto в самостоятельном файле
    out = out.replace(/<\/body>\s*<\/html>\s*$/, TAIL + '</body>\n</html>');
    return out;
}

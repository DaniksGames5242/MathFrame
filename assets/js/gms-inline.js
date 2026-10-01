// assets/js/gms-inline.js
// Показ скомпилированной сцены GMS прямо на странице, без iframe (песочница).
//
// Сцена — это самостоятельный HTML-документ: стили на html/body, разметка с id и
// скрипт движка, который пишет переменные в window, вешает обработчики на window и
// крутит requestAnimationFrame. Чтобы он жил внутри обычного элемента страницы и не
// задевал её, сцена получает своё «окружение»:
//   • разметка и стили — в Shadow DOM элемента-хоста (стили сцены не видят страницу,
//     и наоборот; html/body/:root сцены переписаны на обёртки внутри тени);
//   • window — прокси: чтение идёт в настоящее окно, запись — в собственное хранилище
//     сцены; обработчики, таймеры и кадры анимации учитываются и снимаются при destroy;
//   • document — прокси: getElementById/querySelector ищут внутри тени, body и
//     documentElement — обёртки сцены, создание элементов — настоящее;
//   • клавиатура доходит до сцены, только когда пользователь работает с ней (щёлкнул
//     внутри), — иначе набор кода в редакторе нажимал бы клавиши в сцене;
//   • resize сцены — по размеру хоста (ResizeObserver), а не окна.
//
//   mountInline(host, html, { onError, onMessage }) → { setTheme(name), destroy() }
//
// Компилятор вызывается отдельно: compile(src, { target: 'playground' }).

const scriptCache = new Map();
function loadScript(src) {
    if (!scriptCache.has(src)) {
        scriptCache.set(src, new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src; s.async = false;
            s.onload = () => resolve();
            s.onerror = () => { scriptCache.delete(src); reject(new Error('Не удалось загрузить ' + src)); };
            document.head.appendChild(s);
        }));
    }
    return scriptCache.get(src);
}

// html/body/:root сцены → обёртки внутри тени.
function scopeCss(css) {
    return css
        .replace(/(^|[\s,{}>+~(])(:root|html)(?=[\s,{.:#\[>+~)])/g, '$1.gc-html')
        .replace(/(^|[\s,{}>+~(])body(?=[\s,{.:#\[>+~)])/g, '$1.gc-body');
}

const WIN_EVENTS_DELEGATED = new Set(['resize', 'message', 'load', 'DOMContentLoaded']);
const KEY_EVENTS = new Set(['keydown', 'keyup', 'keypress']);

export async function mountInline(host, html, opts = {}) {
    const onError = opts.onError || ((m) => console.warn('[GMS]', m));
    const report = (e) => { try { onError(String((e && e.message) || e)); } catch (x) {} };

    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const externals = [...parsed.querySelectorAll('script[src]')].map((s) => s.getAttribute('src'));
    const inlineScripts = [...parsed.querySelectorAll('script:not([src])')].map((s) => s.textContent);
    const styles = [...parsed.querySelectorAll('style')].map((s) => scopeCss(s.textContent)).join('\n');
    parsed.querySelectorAll('script').forEach((s) => s.remove());

    // KaTeX и three.js — глобальные библиотеки, грузятся на страницу один раз.
    for (const src of externals) {
        if (/katex/i.test(src) && window.katex) continue;   // у страницы уже есть свой KaTeX
        if (/three/i.test(src) && window.THREE) continue;
        try { await loadScript(src); } catch (e) { report(e); }
    }

    // ---- тень ----
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = ':host{display:block;position:relative;overflow:hidden}.gc-html{height:100%;width:100%}.gc-body{height:100%}\n' + styles;
    const rootEl = document.createElement('div'); rootEl.className = 'gc-html';
    const bodyEl = document.createElement('div'); bodyEl.className = 'gc-body';
    bodyEl.innerHTML = parsed.body.innerHTML;
    rootEl.appendChild(bodyEl);
    shadow.append(style, rootEl);

    // ---- учёт всего, что надо снять при destroy ----
    let alive = true;
    const realListeners = [];          // [target, type, fn, options]
    const winListeners = new Map();    // делегированные события окна сцены
    const docListeners = new Map();
    const rafs = new Set(), timeouts = new Set(), intervals = new Set();
    let keyActive = false;

    const guard = (fn) => function () { if (!alive) return; try { return fn.apply(this, arguments); } catch (e) { report(e); } };
    function addReal(target, type, fn, options) {
        let wrapped = fn;
        if (KEY_EVENTS.has(type)) wrapped = function (ev) { if (keyActive) return fn.call(this, ev); };
        target.addEventListener(type, wrapped, options);
        realListeners.push([target, type, wrapped, options, fn]);
    }
    function removeReal(target, type, fn, options) {
        const i = realListeners.findIndex((r) => r[0] === target && r[1] === type && r[4] === fn);
        if (i >= 0) { target.removeEventListener(type, realListeners[i][2], options); realListeners.splice(i, 1); }
    }
    function fire(map, type, ev) {
        for (const fn of [...(map.get(type) || [])]) { try { fn.call(winProxy, ev); } catch (e) { report(e); } }
    }

    // Клавиатура — только когда пользователь работает со сценой.
    const onDocPointer = (e) => { keyActive = e.composedPath().includes(host); };
    const onFocusIn = (e) => { if (!e.composedPath().includes(host)) keyActive = false; };
    document.addEventListener('pointerdown', onDocPointer, true);
    document.addEventListener('focusin', onFocusIn, true);

    const own = Object.create(null);
    const timerApi = {
        requestAnimationFrame: (cb) => { if (!alive) return 0; const id = requestAnimationFrame((t) => { rafs.delete(id); if (alive) guard(cb)(t); }); rafs.add(id); return id; },
        cancelAnimationFrame: (id) => { rafs.delete(id); cancelAnimationFrame(id); },
        setTimeout: (cb, ms, ...a) => { if (!alive) return 0; const id = setTimeout(() => { timeouts.delete(id); if (alive && typeof cb === 'function') guard(cb)(...a); }, ms); timeouts.add(id); return id; },
        clearTimeout: (id) => { timeouts.delete(id); clearTimeout(id); },
        setInterval: (cb, ms, ...a) => { if (!alive) return 0; const id = setInterval(() => { if (alive && typeof cb === 'function') guard(cb)(...a); }, ms); intervals.add(id); return id; },
        clearInterval: (id) => { intervals.delete(id); clearInterval(id); },
    };
    const sceneConsole = Object.assign(Object.create(console), {
        error: (...a) => { const t = a.map(String).join(' '); if (!/Failed to load resource/.test(t)) report(t); },
        warn: (...a) => console.warn(...a),
    });

    const winApi = {
        addEventListener(type, fn, options) {
            if (typeof fn !== 'function') return;
            if (WIN_EVENTS_DELEGATED.has(type)) { if (!winListeners.has(type)) winListeners.set(type, []); winListeners.get(type).push(fn); return; }
            addReal(window, type, fn, options);
        },
        removeEventListener(type, fn, options) {
            if (WIN_EVENTS_DELEGATED.has(type)) { const l = winListeners.get(type) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); return; }
            removeReal(window, type, fn, options);
        },
        dispatchEvent(ev) { fire(winListeners, ev.type, ev); return true; },
        // new Publish и прочие сообщения «родителю» — хосту
        postMessage(data) { if (opts.onMessage) { try { opts.onMessage(data); } catch (e) { report(e); } } },
        getComputedStyle: (el, p) => window.getComputedStyle(el, p),
    };

    const docProxy = new Proxy(document, {
        get(t, k) {
            switch (k) {
                case 'getElementById': return (id) => shadow.getElementById(id);
                case 'querySelector': return (s) => rootEl.querySelector(s);
                case 'querySelectorAll': return (s) => rootEl.querySelectorAll(s);
                case 'getElementsByClassName': return (c) => rootEl.getElementsByClassName(c);
                case 'getElementsByTagName': return (n) => rootEl.getElementsByTagName(n);
                case 'body': return bodyEl;
                case 'documentElement': return rootEl;
                case 'head': return rootEl;
                case 'readyState': return 'complete';
                case 'defaultView': return winProxy;
                case 'addEventListener': return (type, fn, o) => {
                    if (type === 'DOMContentLoaded' || type === 'readystatechange') { if (!docListeners.has(type)) docListeners.set(type, []); docListeners.get(type).push(fn); return; }
                    addReal(document, type, fn, o);
                };
                case 'removeEventListener': return (type, fn, o) => removeReal(document, type, fn, o);
            }
            const v = Reflect.get(t, k, t);
            return typeof v === 'function' ? v.bind(t) : v;
        },
    });

    const winProxy = new Proxy(window, {
        get(t, k) {
            if (k in own) return own[k];
            switch (k) {
                case 'window': case 'self': case 'globalThis': case 'frames': case 'parent': case 'top': return winProxy;
                case 'document': return docProxy;
                case 'console': return sceneConsole;
            }
            if (k in timerApi) return timerApi[k];
            if (k in winApi) return winApi[k];
            const v = Reflect.get(t, k, t);
            // методы окна (matchMedia, getSelection…) — с настоящим this; конструкторы — как есть
            return (typeof v === 'function' && !/^[A-Z]/.test(String(k))) ? v.bind(t) : v;
        },
        set(t, k, v) { own[k] = v; return true; },
        has(t, k) { return (k in own) || (k in t); },
        deleteProperty(t, k) { delete own[k]; return true; },
        defineProperty(t, k, d) { own[k] = d.value; return true; },
    });
    own.__gcPgEmbedded = true;

    // ---- запуск скриптов сцены ----
    const PARAMS = ['window', 'self', 'globalThis', 'document', 'parent', 'top', 'frames', 'console',
        'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
        'addEventListener', 'removeEventListener', 'dispatchEvent', 'postMessage'];
    const args = [winProxy, winProxy, winProxy, docProxy, winProxy, winProxy, winProxy, sceneConsole,
        timerApi.requestAnimationFrame, timerApi.cancelAnimationFrame, timerApi.setTimeout, timerApi.clearTimeout,
        timerApi.setInterval, timerApi.clearInterval, winApi.addEventListener, winApi.removeEventListener, winApi.dispatchEvent, winApi.postMessage];
    for (const code of inlineScripts) {
        if (!alive) break;
        try { new Function(...PARAMS, code)(...args); }
        catch (e) { report(e); }
    }
    fire(docListeners, 'DOMContentLoaded', new Event('DOMContentLoaded'));
    fire(winListeners, 'load', new Event('load'));

    // ---- размер: resize сцены — по размеру хоста ----
    let ro = null, last = '';
    if (typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(() => {
            const r = host.getBoundingClientRect(), key = Math.round(r.width) + 'x' + Math.round(r.height);
            if (key === last || !alive) return;
            last = key;
            fire(winListeners, 'resize', new Event('resize'));
        });
        ro.observe(host);
    }

    return {
        setTheme(name) { try { const f = own.geocompilerSetTheme; if (typeof f === 'function') f(name); } catch (e) { report(e); } },
        get window() { return winProxy; },
        destroy() {
            if (!alive) return;
            alive = false;
            if (ro) ro.disconnect();
            document.removeEventListener('pointerdown', onDocPointer, true);
            document.removeEventListener('focusin', onFocusIn, true);
            for (const [t, type, fn, o] of realListeners) t.removeEventListener(type, fn, o);
            realListeners.length = 0;
            rafs.forEach((id) => cancelAnimationFrame(id)); rafs.clear();
            timeouts.forEach((id) => clearTimeout(id)); timeouts.clear();
            intervals.forEach((id) => clearInterval(id)); intervals.clear();
            // WebGL-контексты освобождаем явно: у браузера их лимит (~16), а сцену
            // перезапускают на каждом изменении кода.
            shadow.querySelectorAll('canvas').forEach((c) => {
                for (const type of ['webgl2', 'webgl']) {
                    try { const gl = c.getContext(type); const ext = gl && gl.getExtension('WEBGL_lose_context'); if (ext) { ext.loseContext(); break; } } catch (e) {}
                }
            });
            shadow.innerHTML = '';
        },
    };
}

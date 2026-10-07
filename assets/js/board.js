// ===== ЭЛЕКТРОННАЯ ДОСКА (pages/board.html, /board/) =====
// Векторная доска на <canvas>: каждый штрих/фигура/картинка — объект с id в мировых
// координатах, поэтому поле бесконечное, масштаб не портит линии, а отмена — это
// обратные операции (добавить/удалить/изменить объекты).
//
// Два режима:
//  • личная доска — хранится в localStorage этого браузера;
//  • общая доска (/board/?b=<id>) — живёт в Firestore: boards/{id} (фон),
//    boards/{id}/items/{itemId} (объекты), boards/{id}/peers/{peerId} (курсоры
//    и недорисованный штрих участников). Ссылку может открыть и рисовать любой,
//    у кого она есть; id длинный и случайный. Правила — в админке (Правила Firestore).
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const STORE = 'mf-board-v1';
    const MAX_HISTORY = 100;
    const IMG_MAX_SIDE = 1600;
    const IMG_MAX_BYTES = 900 * 1024;           // документ Firestore — до 1 МиБ
    const PEER_TTL = 40000;

    const ICONS = {
        select: '<path d="M4 3l7 17 2.5-7.5L21 10z"/>',
        pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
        marker: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
        eraser: '<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 19"/><path d="M22 21H7M5 11l9 9"/>',
        line: '<path d="M5 19 19 5"/>',
        arrow: '<path d="M5 19 19 5M9 5h10v10"/>',
        rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
        ellipse: '<ellipse cx="12" cy="12" rx="9" ry="6.5"/>',
        text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
        point: '<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M15 7h4"/>',
        circle: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12h8.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
        poly: '<path d="M4 18 8 5l12 4-3 11z"/>',
        angle: '<path d="M20 19H4l11-13"/><path d="M10 19a6 6 0 0 0-2-4.5"/>',
        pan: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
    };
    const TOOLS = [
        ['select', 'Выбор и перемещение (V)', 'v'],
        ['pen', 'Перо (P)', 'p'], ['marker', 'Маркер-выделитель (M)', 'm'], ['eraser', 'Ластик (E)', 'e'],
        ['line', 'Отрезок (L)', 'l'], ['arrow', 'Стрелка (A)', 'a'], ['rect', 'Прямоугольник (R)', 'r'],
        ['ellipse', 'Эллипс (O)', 'o'],
        ['point', 'Точка с подписью (K)', 'k'], ['circle', 'Окружность: центр → радиус (C)', 'c'],
        ['poly', 'Многоугольник: щелчки по вершинам, замкнуть — щелчок по первой, Enter/двойной — ломаная (G)', 'g'],
        ['angle', 'Угол с градусной мерой: точка, вершина, точка (U)', 'u'],
        ['text', 'Текст (T)', 't'], ['pan', 'Рука — сдвиг (H)', 'h'],
    ];
    // 'ink' — цвет «по теме»: светлый на тёмной доске, тёмный на светлой.
    const COLORS = ['ink', '#e5484d', '#3e8bff', '#30a46c', '#f2a25c', '#9b6bff'];
    const SIZES = [2, 4, 8, 16];
    const PEER_COLORS = ['#e5484d', '#3e8bff', '#30a46c', '#f2a25c', '#9b6bff', '#d6409f', '#12a594', '#e38d2c'];

    const stage = $('bdStage'), canvas = $('bdCanvas'), ctx = canvas.getContext('2d');
    const boardEl = $('board');

    let items = [];                             // отсортированы по z
    let bg = 'cells';
    let view = { x: 0, y: 0, k: 1 };            // экран = (мир − (x,y)) · k
    let tool = 'pen', color = 'ink', size = 4;
    let undo = [], redo = [];
    let cur = null;                             // объект, который рисуется сейчас
    let drag = null;                            // перемещение/масштаб в режиме «Выбор»
    let selected = null;                        // id выбранного объекта
    let spaceDown = false, panDrag = null;
    const pointers = new Map();
    let pinch = null;
    let textEd = null;
    let geo = null;                             // многоугольник/угол, который строится щелчками
    let dpr = 1, W = 0, H = 0;
    let viewSet = false;                        // без сохранённого вида начало координат — в центре

    const rid = (n = 20) => {
        const a = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const r = crypto.getRandomValues(new Uint8Array(n));
        return Array.from(r, (b) => a[b % a.length]).join('');
    };
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const byId = (id) => items.find((i) => i.id === id);
    const sortItems = () => items.sort((a, b) => (a.z || 0) - (b.z || 0));
    const newZ = () => Date.now() + Math.random();

    // ================= ХРАНЕНИЕ: личная доска / общая доска =================
    const params = new URLSearchParams(location.search);
    let shared = null;   // { id, db, ref, unsub[], peerId, peerRef, peers: Map }

    function loadLocal() {
        try {
            const s = JSON.parse(localStorage.getItem(STORE) || 'null');
            if (s && Array.isArray(s.items)) {
                items = s.items.map((it, i) => Object.assign({ id: rid(12), z: i }, it));
                bg = s.bg || 'cells';
                if (s.view) { view = s.view; viewSet = true; }
            }
        } catch (e) {}
        sortItems();
    }
    let saveT = 0;
    function saveLocal() {
        if (shared) return;
        clearTimeout(saveT);
        saveT = setTimeout(() => {
            try { localStorage.setItem(STORE, JSON.stringify({ items, bg, view })); }
            catch (e) { toast('Не удалось сохранить доску в браузере — мало места (возможно, из-за больших картинок).'); }
        }, 250);
    }
    function saveView() {
        if (!shared) return saveLocal();
        try { sessionStorage.setItem('mf-board-view-' + shared.id, JSON.stringify(view)); } catch (e) {}
    }

    // Все изменения объектов идут через эти три функции — они же пишут в Firestore.
    function putItems(list) {
        for (const it of list) {
            const i = items.findIndex((x) => x.id === it.id);
            if (i >= 0) items[i] = it; else items.push(it);
        }
        sortItems();
        if (shared) {
            const b = shared.db.batch();
            list.forEach((it) => b.set(shared.ref.collection('items').doc(it.id), it));
            b.commit().catch(syncError);
        }
        saveLocal();
    }
    function dropItems(ids) {
        items = items.filter((x) => !ids.includes(x.id));
        if (selected && ids.includes(selected)) selected = null;
        if (shared) {
            const b = shared.db.batch();
            ids.forEach((id) => b.delete(shared.ref.collection('items').doc(id)));
            b.commit().catch(syncError);
        }
        saveLocal();
    }
    function setBg(v) {
        bg = v; $('bdBg').value = v;
        if (shared) shared.ref.set({ bg: v, updatedAt: Date.now() }, { merge: true }).catch(syncError);
        saveLocal(); render();
    }

    // ---------- история: операции и обратные к ним ----------
    // op = { add: [items] } | { del: [items] } | { mod: [[before, after], …] }
    function apply(op, reverse) {
        if (op.add) reverse ? dropItems(op.add.map((i) => i.id)) : putItems(op.add.map(clone));
        if (op.del) reverse ? putItems(op.del.map(clone)) : dropItems(op.del.map((i) => i.id));
        if (op.mod) putItems(op.mod.map((p) => clone(p[reverse ? 0 : 1])));
    }
    function commit(op) {
        apply(op, false);
        record(op);
    }
    function record(op) {
        undo.push(op);
        if (undo.length > MAX_HISTORY) undo.shift();
        redo = [];
        syncHistory();
    }
    function syncHistory() {
        $('bdUndo').disabled = !undo.length;
        $('bdRedo').disabled = !redo.length;
    }
    function doUndo() {
        if (textEd) closeText();
        const op = undo.pop(); if (!op) return;
        apply(op, true); redo.push(op);
        syncHistory(); render();
    }
    function doRedo() {
        const op = redo.pop(); if (!op) return;
        apply(op, false); undo.push(op);
        syncHistory(); render();
    }

    // ================= КООРДИНАТЫ =================
    const toWorld = (sx, sy) => ({ x: sx / view.k + view.x, y: sy / view.k + view.y });
    function localPt(e) {
        const r = stage.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function zoomAt(sx, sy, factor) {
        const k = Math.min(8, Math.max(0.1, view.k * factor));
        const w = toWorld(sx, sy);
        view.k = k;
        view.x = w.x - sx / k;
        view.y = w.y - sy / k;
        $('bdZoom').textContent = Math.round(k * 100) + '%';
        render(); saveView();
    }

    // ================= ОТРИСОВКА =================
    const css = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();
    const isLight = () => document.documentElement.classList.contains('light');
    const inkColor = () => (isLight() ? '#1b2333' : '#eef2fb');
    const paint = (c) => (c === 'ink' ? inkColor() : c);
    const textFont = (s) => s + 'px ' + (css('--font-display') || 'sans-serif');

    // картинки: id → HTMLImageElement (src не меняется, поэтому кэш по id+длине)
    const imgCache = new Map();
    function getImg(it) {
        const key = it.id + ':' + it.src.length;
        let im = imgCache.get(key);
        if (!im) {
            im = new Image();
            im.onload = () => render();
            im.src = it.src;
            imgCache.set(key, im);
        }
        return im;
    }

    function resize() {
        dpr = window.devicePixelRatio || 1;
        W = stage.clientWidth; H = stage.clientHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        if (!viewSet && W && H) { view = { x: -W / 2, y: -H / 2, k: 1 }; viewSet = true; }
        render();
    }

    function drawBg(c, w, h, v) {
        if (bg === 'none') return;
        const step = 25;
        let s = step * v.k;
        let mult = 1;
        while (s < 10) { s *= 5; mult *= 5; }   // при сильном отдалении — реже
        const st = step * mult;
        const line = isLight() ? 'rgba(40,60,110,' : 'rgba(170,190,240,';
        c.lineWidth = 1;
        if (bg === 'lines') {
            const y0 = Math.floor(v.y / st) * st;
            c.strokeStyle = line + '.18)';
            c.beginPath();
            for (let y = y0; (y - v.y) * v.k < h; y += st) {
                const sy = Math.round((y - v.y) * v.k) + .5;
                c.moveTo(0, sy); c.lineTo(w, sy);
            }
            c.stroke();
            return;
        }
        const x0 = Math.floor(v.x / st) * st, y0 = Math.floor(v.y / st) * st;
        c.strokeStyle = line + '.13)';
        c.beginPath();
        for (let x = x0; (x - v.x) * v.k < w; x += st) {
            const sx = Math.round((x - v.x) * v.k) + .5; c.moveTo(sx, 0); c.lineTo(sx, h);
        }
        for (let y = y0; (y - v.y) * v.k < h; y += st) {
            const sy = Math.round((y - v.y) * v.k) + .5; c.moveTo(0, sy); c.lineTo(w, sy);
        }
        c.stroke();
        if (bg === 'grid') {
            // Оси через мировой (0,0) с делениями «1 = клетка × 2».
            const ox = (0 - v.x) * v.k, oy = (0 - v.y) * v.k;
            c.strokeStyle = line + '.7)'; c.fillStyle = line + '.85)';
            c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(0, oy); c.lineTo(w, oy); c.moveTo(ox, 0); c.lineTo(ox, h); c.stroke();
            c.font = '11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top';
            const unit = step * 2, um = unit * mult;
            for (let x = Math.floor(v.x / um) * um; (x - v.x) * v.k < w; x += um) {
                if (!x) continue;
                const sx = (x - v.x) * v.k;
                c.fillText(String(x / unit), sx, Math.min(Math.max(oy + 3, 2), h - 14));
            }
            c.textAlign = 'right'; c.textBaseline = 'middle';
            for (let y = Math.floor(v.y / um) * um; (y - v.y) * v.k < h; y += um) {
                if (!y) continue;
                const sy = (y - v.y) * v.k;
                c.fillText(String(-y / unit), Math.min(Math.max(ox - 4, 24), w - 2), sy);
            }
            c.textBaseline = 'top'; c.fillText('0', ox - 4, oy + 3);
        }
    }

    function drawItem(c, it) {
        c.save();
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.strokeStyle = c.fillStyle = paint(it.c);
        c.lineWidth = it.w;
        if (it.t === 'marker') { c.globalAlpha = 0.35; c.lineCap = 'butt'; }
        if (it.t === 'pen' || it.t === 'marker') {
            const p = it.p;
            c.beginPath();
            c.moveTo(p[0], p[1]);
            if (p.length === 2) c.lineTo(p[0] + .01, p[1]);
            // сглаживание: квадратичные кривые через середины отрезков
            for (let i = 2; i < p.length - 2; i += 2) {
                c.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
            }
            if (p.length > 2) c.lineTo(p[p.length - 2], p[p.length - 1]);
            c.stroke();
        } else if (it.t === 'line' || it.t === 'arrow') {
            c.beginPath(); c.moveTo(it.x1, it.y1); c.lineTo(it.x2, it.y2); c.stroke();
            if (it.t === 'arrow') {
                const a = Math.atan2(it.y2 - it.y1, it.x2 - it.x1), L = 8 + it.w * 3;
                c.beginPath();
                c.moveTo(it.x2 - L * Math.cos(a - .45), it.y2 - L * Math.sin(a - .45));
                c.lineTo(it.x2, it.y2);
                c.lineTo(it.x2 - L * Math.cos(a + .45), it.y2 - L * Math.sin(a + .45));
                c.stroke();
            }
        } else if (it.t === 'rect') {
            c.strokeRect(Math.min(it.x1, it.x2), Math.min(it.y1, it.y2), Math.abs(it.x2 - it.x1), Math.abs(it.y2 - it.y1));
        } else if (it.t === 'ellipse') {
            c.beginPath();
            c.ellipse((it.x1 + it.x2) / 2, (it.y1 + it.y2) / 2, Math.abs(it.x2 - it.x1) / 2, Math.abs(it.y2 - it.y1) / 2, 0, 0, Math.PI * 2);
            c.stroke();
        } else if (it.t === 'text') {
            c.font = textFont(it.s);
            c.textBaseline = 'top';
            String(it.text).split('\n').forEach((ln, i) => c.fillText(ln, it.x, it.y + i * it.s * 1.25));
        } else if (it.t === 'point') {
            const r = 2.5 + it.w * .6;
            c.beginPath(); c.arc(it.x, it.y, r, 0, Math.PI * 2); c.fill();
            if (it.label) {
                c.font = 'italic ' + textFont(14 + it.w * 1.5); c.textBaseline = 'bottom';
                c.fillText(it.label, it.x + r + 2, it.y - r - 1);
            }
        } else if (it.t === 'circle') {
            const r = Math.hypot(it.x2 - it.x1, it.y2 - it.y1);
            c.beginPath(); c.arc(it.x1, it.y1, r, 0, Math.PI * 2); c.stroke();
            c.beginPath(); c.arc(it.x1, it.y1, 1.5 + it.w * .4, 0, Math.PI * 2); c.fill();
        } else if (it.t === 'poly') {
            const p = it.p;
            c.beginPath(); c.moveTo(p[0], p[1]);
            for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
            if (it.hx !== undefined) c.lineTo(it.hx, it.hy);
            if (it.cl) c.closePath();
            c.stroke();
        } else if (it.t === 'angle') {
            drawAngle(c, it);
        } else if (it.t === 'tex') {
            drawTex(c, it);
        } else if (it.t === 'vec') {
            drawVec(c, it);
        } else if (it.t === 'plot') {
            drawPlot(c, it);
        } else if (it.t === 'img') {
            const im = getImg(it);
            if (im.complete && im.naturalWidth) c.drawImage(im, it.x, it.y, it.w, it.h);
            else { c.globalAlpha = .4; c.strokeStyle = inkColor(); c.lineWidth = 1; c.setLineDash([6, 6]); c.strokeRect(it.x, it.y, it.w, it.h); }
        }
        c.restore();
    }

    // Рамка объекта в мировых координатах
    function bounds(it) {
        if (BOX[it.t]) return { x: it.x, y: it.y, w: it.w, h: it.h };
        if (it.t === 'point') return { x: it.x - 6, y: it.y - 26, w: 30, h: 32 };
        if (it.t === 'circle') {
            const r = Math.hypot(it.x2 - it.x1, it.y2 - it.y1) + it.w / 2;
            return { x: it.x1 - r, y: it.y1 - r, w: 2 * r, h: 2 * r };
        }
        if (it.t === 'text') {
            ctx.font = textFont(it.s);
            const ls = String(it.text).split('\n');
            return { x: it.x, y: it.y, w: Math.max(...ls.map((l) => ctx.measureText(l).width)), h: ls.length * it.s * 1.25 };
        }
        let x1, y1, x2, y2;
        if (it.p) {
            x1 = y1 = Infinity; x2 = y2 = -Infinity;
            for (let i = 0; i < it.p.length; i += 2) {
                x1 = Math.min(x1, it.p[i]); x2 = Math.max(x2, it.p[i]);
                y1 = Math.min(y1, it.p[i + 1]); y2 = Math.max(y2, it.p[i + 1]);
            }
        } else { x1 = Math.min(it.x1, it.x2); x2 = Math.max(it.x1, it.x2); y1 = Math.min(it.y1, it.y2); y2 = Math.max(it.y1, it.y2); }
        const m = it.w / 2 + (it.t === 'arrow' ? 8 + it.w * 3 : 0);
        return { x: x1 - m, y: y1 - m, w: x2 - x1 + 2 * m, h: y2 - y1 + 2 * m };
    }
    const HANDLE = 10;  // px экрана
    function handleAt(it, sx, sy) {
        if (!it || !BOX[it.t]) return false;
        const b = bounds(it);
        const hx = (b.x + b.w - view.x) * view.k, hy = (b.y + b.h - view.y) * view.k;
        return Math.abs(sx - hx) < HANDLE + 4 && Math.abs(sy - hy) < HANDLE + 4;
    }

    function render() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        drawBg(ctx, W, H, view);
        ctx.setTransform(dpr * view.k, 0, 0, dpr * view.k, -view.x * view.k * dpr, -view.y * view.k * dpr);
        for (const it of items) drawItem(ctx, it);
        if (shared) for (const p of shared.peers.values()) if (p.draft && fresh(p)) drawItem(ctx, p.draft);
        if (cur && cur.t !== 'erase') drawItem(ctx, cur);
        if (geo) drawItem(ctx, geo);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const sel = selected && byId(selected);
        if (sel && tool === 'select') {
            const b = bounds(sel);
            const x = (b.x - view.x) * view.k, y = (b.y - view.y) * view.k;
            ctx.strokeStyle = css('--accent') || '#f2a25c';
            ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
            ctx.strokeRect(x - 4, y - 4, b.w * view.k + 8, b.h * view.k + 8);
            ctx.setLineDash([]);
            if (BOX[sel.t]) {
                ctx.fillStyle = ctx.strokeStyle;
                ctx.fillRect(x + b.w * view.k - HANDLE / 2, y + b.h * view.k - HANDLE / 2, HANDLE, HANDLE);
            }
        }
        if (shared) drawPeers();
    }

    // ================= МАТЕМАТИКА: геометрия, формулы, графики, шаблоны =================
    // Объекты-«коробки» (x, y, w, h) — двигаются и масштабируются уголком как картинки.
    //  • tex  — формула: latex + expr (линейная запись для повторного редактирования);
    //           рисуется SVG из MathJax (контуры, без шрифтов — не портит экспорт PNG);
    //  • plot — график функций: xr/yr — диапазоны, fns: [{ e, c }] (e — запись для MFMath);
    //  • vec  — векторный шаблон (тела, фигуры, числовая прямая): локальные координаты
    //           bw × bh, paths: [{ d:[x,y,…], cl, dash }], els: [{ cx, cy, rx, ry, a0, a1, dash }],
    //           labels: [{ x, y, t }]. Вложенных массивов нет — Firestore их не принимает.
    const BOX = { img: 1, tex: 1, plot: 1, vec: 1 };

    // Притягивание к вершинам: точки, концы отрезков, вершины многоугольников, центры окружностей.
    function snap(w) {
        const r = 10 / view.k;
        let best = null, bd = r;
        const tryPt = (x, y) => { const d = Math.hypot(x - w.x, y - w.y); if (d < bd) { bd = d; best = { x, y }; } };
        for (const it of items) {
            if (it.t === 'point') tryPt(it.x, it.y);
            else if (it.t === 'line' || it.t === 'arrow') { tryPt(it.x1, it.y1); tryPt(it.x2, it.y2); }
            else if (it.t === 'circle') tryPt(it.x1, it.y1);
            else if (it.t === 'poly' || it.t === 'angle') for (let i = 0; i < it.p.length; i += 2) tryPt(it.p[i], it.p[i + 1]);
        }
        if (geo) for (let i = 0; i < geo.p.length; i += 2) tryPt(geo.p[i], geo.p[i + 1]);
        return best || w;
    }
    function nextLabel() {
        const used = new Set(items.filter((i) => i.t === 'point').map((i) => i.label));
        for (let n = 0; ; n++) {
            for (let k = 0; k < 26; k++) {
                const l = String.fromCharCode(65 + k) + (n ? n : '');
                if (!used.has(l)) return l;
            }
        }
    }
    let lastTap = null;
    function geoClick(q, sp) {
        const now = Date.now();
        const dbl = lastTap && now - lastTap.t < 380 && Math.hypot(sp.x - lastTap.x, sp.y - lastTap.y) < 12;
        lastTap = { t: now, x: sp.x, y: sp.y };
        if (!geo) {
            geo = { t: tool, c: color, w: size, p: [q.x, q.y], hx: q.x, hy: q.y };
            render();
            return;
        }
        const n = geo.p.length;
        if (geo.t === 'poly') {
            if (dbl) return finishGeo(true, false);
            if (n >= 6 && Math.hypot(q.x - geo.p[0], q.y - geo.p[1]) * view.k < 12) return finishGeo(true, true);
        }
        if (Math.hypot(q.x - geo.p[n - 2], q.y - geo.p[n - 1]) * view.k < 3) return;
        geo.p.push(q.x, q.y);
        if (geo.t === 'angle' && geo.p.length === 6) return finishGeo(true);
        render();
    }
    function finishGeo(keep, close) {
        const g = geo;
        geo = null;
        if (keep && g && g.p.length >= 4) {
            const it = { id: rid(12), z: newZ(), t: g.t, c: g.c, w: g.w, p: g.p };
            if (close) it.cl = true;
            commit({ add: [it] });
        }
        render();
    }
    function drawAngle(c, it) {
        const p = it.p;
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[2], p[3]);
        if (p.length >= 6) c.lineTo(p[4], p[5]); else if (it.hx !== undefined) c.lineTo(it.hx, it.hy);
        c.stroke();
        const bx = p.length >= 6 ? p[4] : it.hx, by = p.length >= 6 ? p[5] : it.hy;
        if (p.length < 4 || bx === undefined) return;
        const a1 = Math.atan2(p[1] - p[3], p[0] - p[2]), a2 = Math.atan2(by - p[3], bx - p[2]);
        let d = a2 - a1;
        while (d <= -Math.PI) d += 2 * Math.PI;
        while (d > Math.PI) d -= 2 * Math.PI;
        const deg = Math.abs(d) * 180 / Math.PI;
        if (!isFinite(deg) || deg < .5) return;
        const R = 22 + it.w * 2;
        c.lineWidth = Math.max(1, it.w * .6);
        if (Math.abs(deg - 90) < .5) {
            // прямой угол — квадратик
            const u = [Math.cos(a1), Math.sin(a1)], v = [Math.cos(a2), Math.sin(a2)], k = R * .6;
            c.beginPath();
            c.moveTo(p[2] + u[0] * k, p[3] + u[1] * k);
            c.lineTo(p[2] + (u[0] + v[0]) * k, p[3] + (u[1] + v[1]) * k);
            c.lineTo(p[2] + v[0] * k, p[3] + v[1] * k);
            c.stroke();
        } else {
            c.beginPath(); c.arc(p[2], p[3], R, a1, a2, d < 0); c.stroke();
        }
        const am = a1 + d / 2;
        c.font = textFont(12 + it.w * 1.5);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText((Math.round(deg * 10) / 10).toString().replace('.', ',') + '°', p[2] + Math.cos(am) * (R + 18), p[3] + Math.sin(am) * (R + 14));
    }

    // ---- формулы: MathJax (лениво, с CDN) → SVG → картинка
    let mjP = null;
    function loadMathJax() {
        if (mjP) return mjP;
        mjP = new Promise((ok, fail) => {
            window.MathJax = { tex: { packages: { '[+]': ['ams'] } }, svg: { fontCache: 'none' }, startup: { typeset: false } };
            const sc = document.createElement('script');
            sc.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
            sc.onload = () => MathJax.startup.promise.then(ok, fail);
            sc.onerror = () => { mjP = null; fail(new Error('Не удалось загрузить MathJax')); };
            document.head.appendChild(sc);
        });
        return mjP;
    }
    // latex → { svg (строка с currentColor), wEx, hEx }
    // имена функций, набранные буквами (s-i-n), — прямым шрифтом, как принято
    const texFix = (l) => l.replace(/(^|[^\\a-zA-Z])(arcsin|arccos|arctan|arcctg|arctg|sinh|cosh|tanh|sin|cos|tan|cot|ctg|tg|ln|lg|log|exp|max|min|sgn)(?![a-zA-Z])/g,
        (m, a, f) => a + (/^(tg|ctg|arctg|arcctg|sgn)$/.test(f) ? '\\operatorname{' + f + '}' : '\\' + f));
    function texSvg(latex) {
        const node = MathJax.tex2svg(texFix(latex), { display: true });
        const svg = node.querySelector('svg');
        return { svg: svg.outerHTML, wEx: parseFloat(svg.getAttribute('width')) || 1, hEx: parseFloat(svg.getAttribute('height')) || 1 };
    }
    const texCache = new Map();
    function texImage(latex, col) {
        const key = col + '|' + latex;
        let im = texCache.get(key);
        if (im) return im;
        if (!window.MathJax || !MathJax.tex2svg) { loadMathJax().then(render, () => {}); return null; }
        im = new Image();
        im.onload = () => render();
        const r = texSvg(latex);
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(r.svg.replace(/currentColor/g, col));
        texCache.set(key, im);
        return im;
    }
    function drawTex(c, it) {
        const im = texImage(it.latex, paint(it.c));
        if (im && im.complete && im.naturalWidth) c.drawImage(im, it.x, it.y, it.w, it.h);
        else {
            c.globalAlpha = .45; c.font = textFont(Math.min(it.h * .6, 28)); c.textBaseline = 'middle';
            c.fillText(it.latex, it.x, it.y + it.h / 2, it.w);
        }
    }

    // ---- векторные шаблоны
    function drawVec(c, it) {
        const sx = it.w / it.bw, sy = it.h / it.bh, s = (sx + sy) / 2;
        c.translate(it.x, it.y); c.scale(sx, sy);
        c.lineWidth = (it.lw || 2.5) / s;
        const dash = [7 / s, 6 / s];
        for (const ph of it.paths || []) {
            c.setLineDash(ph.dash ? dash : []);
            c.beginPath(); c.moveTo(ph.d[0], ph.d[1]);
            for (let i = 2; i < ph.d.length; i += 2) c.lineTo(ph.d[i], ph.d[i + 1]);
            if (ph.cl) c.closePath();
            if (ph.fill) c.fill(); else c.stroke();
        }
        for (const e of it.els || []) {
            c.setLineDash(e.dash ? dash : []);
            c.beginPath(); c.ellipse(e.cx, e.cy, e.rx, e.ry, 0, e.a0 || 0, e.a1 === undefined ? Math.PI * 2 : e.a1); c.stroke();
        }
        c.setLineDash([]);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        for (const l of it.labels || []) {
            c.font = (l.i === false ? '' : 'italic ') + textFont((l.s || 16) / s * Math.min(1.6, Math.max(.8, s)));
            c.fillText(l.t, l.x, l.y);
        }
    }

    // ---- графики функций
    const fnCache = new Map();
    function compileFn(e) {
        if (!fnCache.has(e)) fnCache.set(e, window.MFMath ? MFMath.compile(e, 'x') : null);
        return fnCache.get(e);
    }
    function niceStep(r) {
        const p = Math.pow(10, Math.floor(Math.log10(r))), m = r / p;
        return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
    }
    const fmtTick = (v) => String(+v.toPrecision(6)).replace('.', ',').replace('-', '−');
    function evalFn(f, x) {
        try { const v = f.at(x); return typeof v === 'number' ? v : NaN; } catch (e) { return NaN; }
    }
    function drawPlot(c, it) {
        const { x, y, w, h } = it, [x0, x1] = it.xr, [y0, y1] = it.yr;
        const X = (v) => x + (v - x0) / (x1 - x0) * w, Y = (v) => y + h - (v - y0) / (y1 - y0) * h;
        const ink = paint(it.c || 'ink');
        const fs = Math.max(9, Math.min(15, Math.min(w, h) / 26));
        c.save();
        c.beginPath(); c.rect(x, y, w, h); c.clip();
        const sx = niceStep((x1 - x0) / 10), sy = niceStep((y1 - y0) / 8);
        c.strokeStyle = ink; c.globalAlpha = .13; c.lineWidth = 1;
        c.beginPath();
        for (let v = Math.ceil(x0 / sx) * sx; v <= x1; v += sx) { c.moveTo(X(v), y); c.lineTo(X(v), y + h); }
        for (let v = Math.ceil(y0 / sy) * sy; v <= y1; v += sy) { c.moveTo(x, Y(v)); c.lineTo(x + w, Y(v)); }
        c.stroke();
        c.globalAlpha = .85; c.lineWidth = 1.4;
        const ax = Math.min(Math.max(X(0), x), x + w), ay = Math.min(Math.max(Y(0), y), y + h);
        c.beginPath(); c.moveTo(x, ay); c.lineTo(x + w, ay); c.moveTo(ax, y); c.lineTo(ax, y + h); c.stroke();
        // стрелки осей
        c.fillStyle = ink;
        c.beginPath(); c.moveTo(x + w, ay); c.lineTo(x + w - 9, ay - 4); c.lineTo(x + w - 9, ay + 4); c.fill();
        c.beginPath(); c.moveTo(ax, y); c.lineTo(ax - 4, y + 9); c.lineTo(ax + 4, y + 9); c.fill();
        c.font = fs + 'px sans-serif'; c.globalAlpha = .8;
        c.textAlign = 'center'; c.textBaseline = 'top';
        for (let v = Math.ceil(x0 / sx) * sx; v <= x1 - sx / 2; v += sx) {
            if (Math.abs(v) < sx / 2) continue;
            c.fillText(fmtTick(v), X(v), Math.min(ay + 3, y + h - fs - 2));
        }
        c.textAlign = 'right'; c.textBaseline = 'middle';
        for (let v = Math.ceil(y0 / sy) * sy; v <= y1 - sy / 2; v += sy) {
            if (Math.abs(v) < sy / 2) continue;
            c.fillText(fmtTick(v), Math.max(ax - 4, x + fs * 2.4), Y(v));
        }
        c.textAlign = 'left'; c.textBaseline = 'top'; c.font = 'italic ' + (fs + 2) + 'px serif';
        c.fillText('x', x + w - fs, ay + 4); c.fillText('y', ax + 6, y + 2);
        c.globalAlpha = 1; c.lineWidth = it.lw || 2.5; c.lineJoin = 'round';
        const N = Math.max(300, Math.min(1500, Math.round(w * 1.5)));
        for (const fn of it.fns || []) {
            const f = compileFn(fn.e);
            if (!f) continue;
            c.strokeStyle = paint(fn.c || 'ink');
            c.beginPath();
            let pen = false, py = 0;
            for (let i = 0; i <= N; i++) {
                const xv = x0 + (x1 - x0) * i / N, v = evalFn(f, xv);
                if (!isFinite(v) || Math.abs(v) > 1e7) { pen = false; continue; }
                const sy2 = Y(v);
                if (pen && Math.abs(sy2 - py) > h * 1.2) pen = false;   // разрыв (асимптота)
                if (pen) c.lineTo(X(xv), sy2); else c.moveTo(X(xv), sy2);
                pen = true; py = sy2;
            }
            c.stroke();
        }
        c.restore();
        // подписи функций в углу
        c.save(); c.font = (fs + 1) + 'px sans-serif'; c.textAlign = 'left'; c.textBaseline = 'top';
        let ly = y + 6;
        (it.fns || []).forEach((fn) => {
            const col = paint(fn.c || 'ink'), im = fn.l && texImage(fn.l, col);
            if (im && im.complete && im.naturalWidth) {
                const k = fs / 11, lh = im.naturalHeight * k, lw = im.naturalWidth * k;
                c.drawImage(im, x + 6, ly, lw, lh); ly += lh + 4;
            } else { c.fillStyle = col; c.fillText('y = ' + fn.e, x + 6, ly); ly += fs + 5; }
        });
        c.restore();
    }
    // автодиапазон по y: по значениям функций на [x0, x1] без выбросов
    function autoY(fns, x0, x1) {
        const vs = [];
        for (const fn of fns) {
            const f = compileFn(fn.e); if (!f) continue;
            for (let i = 0; i <= 400; i++) { const v = evalFn(f, x0 + (x1 - x0) * i / 400); if (isFinite(v)) vs.push(v); }
        }
        if (!vs.length) return [-(x1 - x0) / 2 * .7, (x1 - x0) / 2 * .7];
        vs.sort((a, b) => a - b);
        let lo = vs[Math.floor(vs.length * .03)], hi = vs[Math.ceil(vs.length * .97) - 1];
        lo = Math.min(lo, 0); hi = Math.max(hi, 0);
        if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
        const m = (hi - lo) * .12;
        return [lo - m, hi + m];
    }

    // ---- шаблоны: генераторы в локальных координатах
    const P = (d, o) => Object.assign({ d }, o || {});
    const L = (x, y, t, o) => Object.assign({ x, y, t }, o || {});
    const SUB = '₀₁₂₃₄₅₆₇₈₉';
    const sub1 = (s) => s + SUB[1];
    const SHAPES = [
        { id: 'tri', name: 'Треугольник', g: () => ({ bw: 220, bh: 180, paths: [P([20, 155, 200, 155, 80, 25], { cl: 1 })],
            labels: [L(10, 168, 'A'), L(210, 168, 'B'), L(80, 10, 'C')] }) },
        { id: 'rtri', name: 'Прямоугольный треугольник', g: () => ({ bw: 220, bh: 180, paths: [P([25, 155, 195, 155, 25, 25], { cl: 1 }), P([25, 137, 43, 137, 43, 155])],
            labels: [L(12, 168, 'C'), L(205, 168, 'B'), L(12, 15, 'A')] }) },
        { id: 'sq', name: 'Квадрат', g: () => ({ bw: 180, bh: 180, paths: [P([20, 160, 160, 160, 160, 20, 20, 20], { cl: 1 })],
            labels: [L(8, 170, 'A'), L(172, 170, 'B'), L(172, 10, 'C'), L(8, 10, 'D')] }) },
        { id: 'rect', name: 'Прямоугольник', g: () => ({ bw: 260, bh: 160, paths: [P([20, 140, 240, 140, 240, 20, 20, 20], { cl: 1 })],
            labels: [L(8, 150, 'A'), L(252, 150, 'B'), L(252, 10, 'C'), L(8, 10, 'D')] }) },
        { id: 'par', name: 'Параллелограмм', g: () => ({ bw: 260, bh: 160, paths: [P([20, 140, 190, 140, 240, 20, 70, 20], { cl: 1 })],
            labels: [L(8, 150, 'A'), L(200, 152, 'B'), L(252, 10, 'C'), L(60, 10, 'D')] }) },
        { id: 'rhomb', name: 'Ромб', g: () => ({ bw: 220, bh: 200, paths: [P([110, 20, 200, 100, 110, 180, 20, 100], { cl: 1 }), P([110, 20, 110, 180], { dash: 1 }), P([20, 100, 200, 100], { dash: 1 })],
            labels: [L(8, 100, 'A'), L(110, 193, 'B'), L(212, 100, 'C'), L(110, 8, 'D')] }) },
        { id: 'trap', name: 'Трапеция', g: () => ({ bw: 260, bh: 160, paths: [P([20, 140, 240, 140, 180, 20, 75, 20], { cl: 1 })],
            labels: [L(8, 150, 'A'), L(252, 150, 'B'), L(190, 8, 'C'), L(65, 8, 'D')] }) },
        { id: 'hex', name: 'Правильный шестиугольник', g: () => {
            const d = []; for (let i = 0; i < 6; i++) d.push(110 + 85 * Math.cos(i * Math.PI / 3), 100 + 85 * Math.sin(i * Math.PI / 3));
            return { bw: 220, bh: 200, paths: [P(d, { cl: 1 })], labels: [] };
        } },
        { id: 'circ', name: 'Окружность (центр, радиус)', g: () => ({ bw: 200, bh: 200, els: [{ cx: 100, cy: 100, rx: 85, ry: 85 }],
            paths: [P([100, 100, 185, 100])], labels: [L(96, 116, 'O'), L(142, 88, 'R')] }) },
        { id: 'inscr', name: 'Вписанная окружность', g: () => {
            const A = [20, 175], B = [240, 175], C = [100, 20];
            const a = Math.hypot(B[0] - C[0], B[1] - C[1]), b = Math.hypot(A[0] - C[0], A[1] - C[1]), c = Math.hypot(A[0] - B[0], A[1] - B[1]);
            const per = a + b + c, ix = (a * A[0] + b * B[0] + c * C[0]) / per, iy = (a * A[1] + b * B[1] + c * C[1]) / per;
            const r = Math.abs(175 - iy);
            return { bw: 260, bh: 195, paths: [P([...A, ...B, ...C], { cl: 1 })], els: [{ cx: ix, cy: iy, rx: r, ry: r }],
                labels: [L(10, 186, 'A'), L(250, 186, 'B'), L(100, 6, 'C'), L(ix, iy - 10, 'O')] };
        } },
        { id: 'cube', name: 'Куб', g: () => ({ bw: 220, bh: 220, paths: [
            P([20, 200, 150, 200, 150, 70, 20, 70], { cl: 1 }), P([150, 200, 200, 150, 200, 20, 150, 70]), P([20, 70, 70, 20, 200, 20]),
            P([20, 200, 70, 150], { dash: 1 }), P([70, 150, 200, 150], { dash: 1 }), P([70, 150, 70, 20], { dash: 1 })],
            labels: [L(10, 210, 'A'), L(155, 212, 'B'), L(212, 155, 'C'), L(78, 140, 'D'), L(10, 62, sub1('A')), L(150, 58, sub1('B')), L(212, 12, sub1('C')), L(62, 10, sub1('D'))] }) },
        { id: 'box', name: 'Прямоугольный параллелепипед', g: () => ({ bw: 300, bh: 200, paths: [
            P([20, 180, 220, 180, 220, 80, 20, 80], { cl: 1 }), P([220, 180, 280, 130, 280, 30, 220, 80]), P([20, 80, 80, 30, 280, 30]),
            P([20, 180, 80, 130], { dash: 1 }), P([80, 130, 280, 130], { dash: 1 }), P([80, 130, 80, 30], { dash: 1 })],
            labels: [L(10, 190, 'A'), L(225, 192, 'B'), L(292, 135, 'C'), L(88, 120, 'D'), L(10, 72, sub1('A')), L(220, 66, sub1('B')), L(292, 22, sub1('C')), L(72, 20, sub1('D'))] }) },
        { id: 'pyr', name: 'Четырёхугольная пирамида', g: () => ({ bw: 240, bh: 220, paths: [
            P([20, 190, 160, 190, 220, 140]), P([20, 190, 110, 15, 160, 190]), P([110, 15, 220, 140]),
            P([20, 190, 80, 140, 220, 140], { dash: 1 }), P([110, 15, 80, 140], { dash: 1 }), P([20, 190, 220, 140], { dash: 1 }), P([160, 190, 80, 140], { dash: 1 })],
            labels: [L(10, 200, 'A'), L(165, 204, 'B'), L(232, 140, 'C'), L(70, 130, 'D'), L(110, 4, 'S')] }) },
        { id: 'tpyr', name: 'Треугольная пирамида', g: () => ({ bw: 240, bh: 210, paths: [
            P([20, 185, 200, 185]), P([20, 185, 120, 15, 200, 185]), P([120, 15, 140, 130]),
            P([20, 185, 140, 130, 200, 185], { dash: 1 })],
            labels: [L(10, 195, 'A'), L(212, 195, 'C'), L(150, 122, 'B'), L(120, 4, 'S')] }) },
        { id: 'prism', name: 'Треугольная призма', g: () => ({ bw: 240, bh: 230, paths: [
            P([20, 60, 180, 60, 100, 20], { cl: 1 }), P([20, 60, 20, 210, 180, 210, 180, 60]),
            P([20, 210, 100, 170, 180, 210], { dash: 1 }), P([100, 20, 100, 170], { dash: 1 })],
            labels: [L(10, 220, 'A'), L(192, 220, 'C'), L(110, 160, 'B'), L(8, 52, sub1('A')), L(194, 52, sub1('C')), L(100, 8, sub1('B'))] }) },
        { id: 'cyl', name: 'Цилиндр', g: () => ({ bw: 200, bh: 230, els: [
            { cx: 100, cy: 35, rx: 80, ry: 22 }, { cx: 100, cy: 195, rx: 80, ry: 22, a0: 0, a1: Math.PI }, { cx: 100, cy: 195, rx: 80, ry: 22, a0: Math.PI, a1: 2 * Math.PI, dash: 1 }],
            paths: [P([20, 35, 20, 195]), P([180, 35, 180, 195]), P([100, 35, 100, 195], { dash: 1 }), P([100, 195, 180, 195], { dash: 1 })],
            labels: [L(140, 185, 'R', { s: 14 }), L(90, 115, 'h', { s: 14 })] }) },
        { id: 'cone', name: 'Конус', g: () => ({ bw: 200, bh: 230, els: [
            { cx: 100, cy: 195, rx: 80, ry: 22, a0: 0, a1: Math.PI }, { cx: 100, cy: 195, rx: 80, ry: 22, a0: Math.PI, a1: 2 * Math.PI, dash: 1 }],
            paths: [P([20, 195, 100, 15, 180, 195]), P([100, 15, 100, 195], { dash: 1 }), P([100, 195, 180, 195], { dash: 1 })],
            labels: [L(140, 185, 'R', { s: 14 }), L(90, 120, 'h', { s: 14 }), L(152, 100, 'l', { s: 14 })] }) },
        { id: 'sph', name: 'Шар', g: () => ({ bw: 200, bh: 200, els: [
            { cx: 100, cy: 100, rx: 85, ry: 85 }, { cx: 100, cy: 100, rx: 85, ry: 22, a0: 0, a1: Math.PI }, { cx: 100, cy: 100, rx: 85, ry: 22, a0: Math.PI, a1: 2 * Math.PI, dash: 1 }],
            paths: [P([100, 100, 185, 100], { dash: 1 }), P([97, 100, 103, 100, 103, 103, 97, 103], { cl: 1, fill: 1 })],
            labels: [L(140, 90, 'R', { s: 14 }), L(96, 116, 'O')] }) },
        { id: 'nline', name: 'Числовая прямая', g: () => {
            const paths = [P([10, 40, 440, 40]), P([428, 33, 440, 40, 428, 47])], labels = [];
            for (let i = -5; i <= 5; i++) { const x = 225 + i * 40; paths.push(P([x, 33, x, 47])); labels.push(L(x, 62, String(i).replace('-', '−'), { i: false, s: 15 })); }
            labels.push(L(438, 18, 'x'));
            return { bw: 450, bh: 75, paths, labels };
        } },
        { id: 'ucirc', name: 'Единичная окружность', g: () => {
            const cx = 170, cy = 170, R = 130, paths = [P([20, cy, 330, cy]), P([cx, 330, cx, 10]), P([320, cy - 6, 330, cy, 320, cy + 6]), P([cx - 6, 20, cx, 10, cx + 6, 20])];
            const labels = [L(322, cy + 16, 'x'), L(cx + 14, 14, 'y'), L(cx + R + 12, cy + 14, '1', { i: false, s: 13 }), L(cx - 10, cy + 14, '0', { i: false, s: 13 })];
            const names = { 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2', 120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π', 210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2', 300: '5π/3', 315: '7π/4', 330: '11π/6' };
            for (const a in names) {
                const r = a * Math.PI / 180, x = cx + R * Math.cos(r), y = cy - R * Math.sin(r);
                paths.push(P([x - 2.5, y - 2.5, x + 2.5, y - 2.5, x + 2.5, y + 2.5, x - 2.5, y + 2.5], { cl: 1, fill: 1 }));
                labels.push(L(cx + (R + 22) * Math.cos(r), cy - (R + 18) * Math.sin(r), names[a], { i: false, s: 12 }));
            }
            return { bw: 340, bh: 340, els: [{ cx, cy, rx: R, ry: R }], paths, labels };
        } },
        { id: 'plane', name: 'Координатная плоскость', plot: true },
    ];
    function shapeIcon(sh) {
        if (sh.plot) return '<svg viewBox="0 0 40 40"><path d="M3 20h34M20 37V3" stroke="currentColor" fill="none" stroke-width="2"/><path d="M5 34Q20-4 35 34" stroke="currentColor" fill="none" stroke-width="1.6" opacity=".6"/></svg>';
        const g = sh.g(), k = 36 / Math.max(g.bw, g.bh), ox = (40 - g.bw * k) / 2, oy = (40 - g.bh * k) / 2;
        let out = '';
        for (const ph of g.paths || []) {
            const pts = []; for (let i = 0; i < ph.d.length; i += 2) pts.push((ox + ph.d[i] * k).toFixed(1) + ',' + (oy + ph.d[i + 1] * k).toFixed(1));
            out += `<${ph.cl ? 'polygon' : 'polyline'} points="${pts.join(' ')}"${ph.dash ? ' stroke-dasharray="2 2"' : ''}/>`;
        }
        for (const e of g.els || []) {
            if (e.a0 === undefined) out += `<ellipse cx="${ox + e.cx * k}" cy="${oy + e.cy * k}" rx="${e.rx * k}" ry="${e.ry * k}"${e.dash ? ' stroke-dasharray="2 2"' : ''}/>`;
            else {
                const x0 = ox + (e.cx + e.rx * Math.cos(e.a0)) * k, y0 = oy + (e.cy + e.ry * Math.sin(e.a0)) * k;
                const x1 = ox + (e.cx + e.rx * Math.cos(e.a1)) * k, y1 = oy + (e.cy + e.ry * Math.sin(e.a1)) * k;
                out += `<path d="M${x0} ${y0}A${e.rx * k} ${e.ry * k} 0 0 1 ${x1} ${y1}"${e.dash ? ' stroke-dasharray="2 2"' : ''}/>`;
            }
        }
        return `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${out}</svg>`;
    }
    // вставить объект-«коробку» в центр экрана и выделить
    // keep — не вписывать в экран (формула остаётся в своём размере на экране)
    function placeBox(it, keep) {
        const c = toWorld(W / 2, H / 2);
        const k = keep ? 1 / view.k : Math.min(1 / view.k, (W * .6) / view.k / it.w, (H * .6) / view.k / it.h);
        it.w *= k; it.h *= k;
        Object.assign(it, { id: rid(12), z: newZ(), x: c.x - it.w / 2, y: c.y - it.h / 2 });
        commit({ add: [it] });
        setTool('select'); selected = it.id; render();
    }
    function insertShape(sh) {
        if (sh.plot) {
            placeBox({ t: 'plot', c: 'ink', w: 460, h: 360, xr: [-6, 6], yr: [-5, 5], fns: [] });
            return;
        }
        const g = sh.g();
        placeBox(Object.assign({ t: 'vec', c: color, lw: 2 + size * .25, w: g.bw * 1.4, h: g.bh * 1.4 }, g));
    }

    // ---- окно «Математика»: формула · график · фигуры
    const FN_COLORS = ['#3e8bff', '#e5484d', '#30a46c', '#9b6bff', '#f2a25c'];
    const M = { tab: 'f', tex: null, kb: null, fns: [], editing: null };
    function mathReady() { return window.MathField && window.MFKeyboard; }
    function buildMath() {
        if (M.tex || !mathReady()) return;
        M.tex = new MathField($('bdTexField'), { label: 'Формула', onChange: () => {} });
        M.kb = new MFKeyboard($('bdKb'), M.tex, { collapsed: false, allowSystem: true, allowComplex: true, onEnter: () => mathOk() });
        $('bdTexField').addEventListener('focus', () => { M.kb.field = M.tex; });
        $('bdShapes').innerHTML = SHAPES.map((sh) => `<button class="bd-shape" data-sh="${sh.id}" title="${sh.name}">${shapeIcon(sh)}<span>${sh.name}</span></button>`).join('');
        $('bdShapes').addEventListener('click', (e) => {
            const b = e.target.closest('[data-sh]'); if (!b) return;
            closeMath(); insertShape(SHAPES.find((x) => x.id === b.dataset.sh));
        });
        $('bdMathDlg').querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => mathTab(b.dataset.tab)));
        $('bdFnAdd').onclick = () => { addFnRow(''); plotPreview(); };
        ['bdX0', 'bdX1', 'bdY0', 'bdY1'].forEach((id) => $(id).addEventListener('input', plotPreview));
        $('bdMathOk').onclick = mathOk;
        $('bdMathDlg').addEventListener('click', (e) => { if (e.target === $('bdMathDlg') || e.target.closest('[data-close]')) closeMath(); });
    }
    function addFnRow(expr) {
        if (M.fns.length >= FN_COLORS.length) return;
        const rowEl = document.createElement('div');
        rowEl.className = 'bd-fn';
        const col = FN_COLORS[M.fns.length];
        rowEl.innerHTML = `<i style="background:${col}"></i><span>y =</span><div class="bd-fn-f"></div><button class="bd-btn" title="Убрать" aria-label="Убрать функцию">×</button>`;
        $('bdFns').appendChild(rowEl);
        const f = new MathField(rowEl.querySelector('.bd-fn-f'), { label: 'Функция', onChange: plotPreview });
        if (expr) f.setExpr(expr);
        const ent = { f, col, el: rowEl };
        M.fns.push(ent);
        f.host.addEventListener('focus', () => { M.kb.field = f; });
        rowEl.querySelector('button').onclick = () => {
            M.fns.splice(M.fns.indexOf(ent), 1); rowEl.remove();
            M.fns.forEach((x, i) => { x.col = FN_COLORS[i]; x.el.querySelector('i').style.background = x.col; });
            if (M.kb.field === f) M.kb.field = M.fns[0] ? M.fns[0].f : M.tex;
            plotPreview();
        };
        M.kb.field = f;
        setTimeout(() => f.host.focus(), 0);
    }
    const fnLatex = (f) => { const l = f.latex().trim(); return /^(y|f\(x\))\s*=/.test(l) ? l : 'y=' + l; };
    const fnExpr = (f) => { const e = f.expr().trim(); const i = e.lastIndexOf('='); return (i >= 0 ? e.slice(i + 1) : e).trim(); };
    function readPlot() {
        const num = (id, d) => { const v = parseFloat($(id).value.replace(',', '.').replace('−', '-')); return isFinite(v) ? v : d; };
        let x0 = num('bdX0', -6), x1 = num('bdX1', 6);
        if (x1 <= x0) x1 = x0 + 1;
        const fns = M.fns.map((x) => ({ e: fnExpr(x.f), l: fnLatex(x.f), c: x.col })).filter((x) => x.e && compileFn(x.e));
        let yr = [num('bdY0', NaN), num('bdY1', NaN)];
        if (!(yr[1] > yr[0])) yr = autoY(fns, x0, x1);
        return { t: 'plot', c: 'ink', xr: [x0, x1], yr, fns };
    }
    function plotPreview() {
        if (M.tab !== 'g') return;
        const cv = $('bdPlotPrev'), r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
        if (!r.width) return;
        cv.width = r.width * d; cv.height = r.height * d;
        const g = cv.getContext('2d');
        g.setTransform(d, 0, 0, d, 0, 0);
        drawPlot(g, Object.assign(readPlot(), { x: 0, y: 0, w: r.width, h: r.height }));
        M.fns.forEach((x) => x.f.host.classList.toggle('mf-field-err', !!x.f.expr().trim() && !compileFn(fnExpr(x.f))));
    }
    function mathTab(t) {
        M.tab = t;
        $('bdMathDlg').querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
        $('bdMathDlg').querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== t; });
        $('bdKb').hidden = t === 's';
        $('bdMathOk').hidden = t === 's';
        if (t === 'f') { M.kb.field = M.tex; setTimeout(() => M.tex.host.focus(), 0); }
        if (t === 'g') { if (!M.fns.length) addFnRow(''); else M.kb.field = M.fns[0].f; setTimeout(plotPreview, 0); }
    }
    function openMath(tab, editing) {
        if (!mathReady()) { toast('Модуль формул не загрузился — обновите страницу'); return; }
        buildMath();
        loadMathJax().catch(() => toast('Не удалось загрузить отрисовку формул — проверьте интернет'));
        M.editing = editing || null;
        M.tex.setExpr(editing && editing.t === 'tex' ? editing.expr || '' : '');
        if (!editing || editing.t === 'plot') {
            M.fns.splice(0).forEach((x) => x.el.remove());
            if (editing) {
                editing.fns.forEach((fn) => addFnRow(fn.e));
                $('bdX0').value = editing.xr[0]; $('bdX1').value = editing.xr[1];
                $('bdY0').value = editing.yr[0]; $('bdY1').value = editing.yr[1];
            } else { $('bdX0').value = -6; $('bdX1').value = 6; $('bdY0').value = ''; $('bdY1').value = ''; }
        }
        $('bdMathOk').textContent = editing ? 'Готово' : 'Вставить';
        $('bdMathDlg').querySelector('[data-tab="s"]').hidden = !!editing;
        $('bdMathDlg').hidden = false;
        mathTab(tab);
    }
    function closeMath() { $('bdMathDlg').hidden = true; M.editing = null; }
    async function mathOk() {
        const ed = M.editing;
        if (M.tab === 'f') {
            if (M.tex.isEmpty()) { M.tex.host.focus(); return; }
            const latex = M.tex.latex(), expr = M.tex.expr();
            try { await loadMathJax(); } catch (e) { toast('Не удалось загрузить отрисовку формул'); return; }
            const r = texSvg(latex), fs = ed ? ed.h / ed.hEx : 9 + size * 1.5;
            const it = { t: 'tex', c: ed ? ed.c : color, latex, expr, hEx: r.hEx, w: r.wEx * fs, h: r.hEx * fs };
            closeMath();
            if (ed) { const n = Object.assign(clone(ed), it); commit({ mod: [[clone(ed), n]] }); render(); }
            else placeBox(it, true);
            return;
        }
        if (M.tab === 'g') {
            const pl = readPlot();
            if (!pl.fns.length && M.fns.some((x) => x.f.expr().trim())) { toast('Не получилось разобрать функцию — проверьте запись'); return; }
            closeMath();
            if (ed) { const n = Object.assign(clone(ed), { xr: pl.xr, yr: pl.yr, fns: pl.fns }); commit({ mod: [[clone(ed), n]] }); render(); }
            else placeBox(Object.assign(pl, { w: 460, h: 360 }));
        }
    }
    stage.addEventListener('dblclick', (e) => {
        if (tool === 'poly' && geo) { finishGeo(true, false); return; }
        if (tool !== 'select') return;
        const p = localPt(e), w = toWorld(p.x, p.y);
        const it = topHit(w.x, w.y, 4 / view.k);
        if (it && it.t === 'tex') openMath('f', it);
        else if (it && it.t === 'plot') openMath('g', it);
    });

    // ================= ЛАСТИК / ПОПАДАНИЕ =================
    function distSeg(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
        let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - ax - t * dx, py - ay - t * dy);
    }
    function hit(it, x, y, r) {
        const tol = r + (BOX[it.t] ? 0 : it.w / 2);
        if (it.t === 'point') return Math.hypot(x - it.x, y - it.y) < tol + 6;
        if (it.t === 'circle') return Math.abs(Math.hypot(x - it.x1, y - it.y1) - Math.hypot(it.x2 - it.x1, it.y2 - it.y1)) < tol;
        if (it.t === 'poly' || it.t === 'angle') {
            const p = it.p, n = p.length;
            for (let i = 0; i < n - 2; i += 2) if (distSeg(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) < tol) return true;
            return !!it.cl && distSeg(x, y, p[n - 2], p[n - 1], p[0], p[1]) < tol;
        }
        if (it.t === 'pen' || it.t === 'marker') {
            const p = it.p;
            if (p.length === 2) return Math.hypot(x - p[0], y - p[1]) < tol;
            for (let i = 0; i < p.length - 2; i += 2) if (distSeg(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) < tol) return true;
            return false;
        }
        if (it.t === 'line' || it.t === 'arrow') return distSeg(x, y, it.x1, it.y1, it.x2, it.y2) < tol;
        if (it.t === 'rect') {
            const { x1, y1, x2, y2 } = it;
            return [[x1, y1, x2, y1], [x2, y1, x2, y2], [x2, y2, x1, y2], [x1, y2, x1, y1]]
                .some((s) => distSeg(x, y, ...s) < tol);
        }
        if (it.t === 'ellipse') {
            const cx = (it.x1 + it.x2) / 2, cy = (it.y1 + it.y2) / 2;
            const rx = Math.abs(it.x2 - it.x1) / 2 || 1e-6, ry = Math.abs(it.y2 - it.y1) / 2 || 1e-6;
            const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
            return Math.abs(d - 1) * Math.min(rx, ry) < tol;
        }
        if (it.t === 'text' || BOX[it.t]) {
            const b = bounds(it);
            return x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r;
        }
        return false;
    }
    const topHit = (x, y, r) => [...items].reverse().find((it) => hit(it, x, y, r));
    function eraseAt(x, y) {
        const r = (size * 2 + 4) / view.k;
        const gone = items.filter((it) => hit(it, x, y, r));
        if (!gone.length) return;
        cur.erased.push(...gone.map(clone));
        dropItems(gone.map((i) => i.id));
        render();
    }

    // ================= ТЕКСТ =================
    function openText(wx, wy, existing) {
        closeText();
        const ta = document.createElement('textarea');
        ta.className = 'bd-text';
        const s = existing ? existing.s : 12 + size * 3;
        const col = existing ? existing.c : color;
        ta.value = existing ? existing.text : '';
        const place = () => {
            ta.style.left = (wx - view.x) * view.k + 'px';
            ta.style.top = (wy - view.y) * view.k + 'px';
            ta.style.fontSize = s * view.k + 'px';
            ta.style.color = paint(col);
            ta.rows = Math.max(1, ta.value.split('\n').length);
            ta.style.width = Math.max(60, ...ta.value.split('\n').map((l) => l.length * s * view.k * .62 + 20)) + 'px';
        };
        ta.addEventListener('input', place);
        ta.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); closeText(); }
            e.stopPropagation();
        });
        ta.addEventListener('blur', () => closeText());
        textEd = { ta, wx, wy, s, col, existing: existing ? clone(existing) : null };
        if (existing) { items = items.filter((i) => i.id !== existing.id); render(); }
        stage.appendChild(ta);
        place();
        ta.focus();
    }
    function closeText() {
        if (!textEd) return;
        const { ta, wx, wy, s, col, existing } = textEd;
        textEd = null;
        const text = ta.value.replace(/\s+$/, '');
        ta.remove();
        if (existing) {
            if (!text) commit({ del: [existing] });
            else if (text !== existing.text) commit({ mod: [[existing, Object.assign({}, existing, { text })]] });
            else putItems([existing]);
        } else if (text) {
            commit({ add: [{ id: rid(12), z: newZ(), t: 'text', x: wx, y: wy, s, c: col, w: 0, text }] });
        }
        render();
    }

    // ================= ИЗОБРАЖЕНИЯ =================
    // Картинка уменьшается до IMG_MAX_SIDE по большей стороне и перекодируется,
    // пока не влезет в IMG_MAX_BYTES (data URL хранится прямо в объекте).
    function readImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !/^image\//.test(file.type)) return reject(new Error('Это не изображение'));
            const url = URL.createObjectURL(file);
            const im = new Image();
            im.onload = () => {
                URL.revokeObjectURL(url);
                let side = Math.min(IMG_MAX_SIDE, Math.max(im.naturalWidth, im.naturalHeight));
                const keepPng = file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/svg+xml';
                let q = 0.88, data, w, h;
                for (let i = 0; i < 12; i++) {
                    const k = side / Math.max(im.naturalWidth, im.naturalHeight);
                    w = Math.max(1, Math.round(im.naturalWidth * k)); h = Math.max(1, Math.round(im.naturalHeight * k));
                    const c = document.createElement('canvas');
                    c.width = w; c.height = h;
                    c.getContext('2d').drawImage(im, 0, 0, w, h);
                    data = c.toDataURL(keepPng && i < 2 ? 'image/png' : 'image/webp', q);
                    if (data.startsWith('data:image/png') && !keepPng) data = c.toDataURL('image/jpeg', q);
                    if (data.length * 0.75 <= IMG_MAX_BYTES) break;
                    if (i >= 2) { side *= 0.8; q = Math.max(0.6, q - 0.06); }
                }
                if (data.length * 0.75 > IMG_MAX_BYTES) return reject(new Error('Изображение слишком большое'));
                resolve({ src: data, w, h });
            };
            im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось прочитать изображение')); };
            im.src = url;
        });
    }
    async function addImageFile(file, at) {
        try {
            const r = await readImage(file);
            // по умолчанию — не больше 60% видимой области, в центре экрана (или в точке броска)
            const fit = Math.min(1, (W * 0.6) / view.k / r.w, (H * 0.6) / view.k / r.h);
            const w = r.w * fit, h = r.h * fit;
            const c = at || toWorld(W / 2, H / 2);
            const it = { id: rid(12), z: newZ(), t: 'img', x: c.x - w / 2, y: c.y - h / 2, w, h, src: r.src };
            commit({ add: [it] });
            setTool('select'); selected = it.id; render();
        } catch (e) { toast(e.message || 'Не удалось добавить изображение'); }
    }

    // ================= УКАЗАТЕЛЬ =================
    function startPinch() {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
    function cancelCurrent() {
        if (cur && cur.t === 'erase' && cur.erased.length) putItems(cur.erased);
        if (drag) putItems([drag.before]);
        cur = null; drag = null; panDrag = null;
        sendDraft(null);
    }
    stage.addEventListener('pointerdown', (e) => {
        if (e.target !== canvas) return;
        const p = localPt(e);
        pointers.set(e.pointerId, p);
        stage.setPointerCapture(e.pointerId);
        if (pointers.size === 2) {
            // второй палец — отменяем начатое действие и переходим в жест
            cancelCurrent(); startPinch(); render();
            return;
        }
        if (pointers.size > 2) return;
        if (textEd) { closeText(); if (tool === 'text') return; }
        const w = toWorld(p.x, p.y);
        if (tool === 'pan' || spaceDown || e.button === 1) {
            panDrag = { sx: p.x, sy: p.y, vx: view.x, vy: view.y };
            stage.classList.add('drag');
            return;
        }
        if (e.button !== 0) return;
        if (tool === 'select') {
            const sel = selected && byId(selected);
            if (handleAt(sel, p.x, p.y)) {
                drag = { mode: 'scale', before: clone(sel), w0: w };
            } else {
                const it = topHit(w.x, w.y, 6 / view.k);
                selected = it ? it.id : null;
                if (it) drag = { mode: 'move', before: clone(it), w0: w };
            }
            render();
            return;
        }
        if (tool === 'text') {
            const ex = [...items].reverse().find((it) => it.t === 'text' && hit(it, w.x, w.y, 2));
            openText(ex ? ex.x : w.x, ex ? ex.y : w.y, ex);
            e.preventDefault();
            return;
        }
        if (tool === 'eraser') {
            cur = { t: 'erase', erased: [] };
            eraseAt(w.x, w.y);
            return;
        }
        if (tool === 'point') {
            const q = snap(w);
            commit({ add: [{ id: rid(12), z: newZ(), t: 'point', x: q.x, y: q.y, c: color, w: size, label: nextLabel() }] });
            render();
            return;
        }
        if (tool === 'poly' || tool === 'angle') { geoClick(snap(w), p); return; }
        if (tool === 'circle') {
            const q = snap(w);
            cur = { t: 'circle', c: color, w: size, x1: q.x, y1: q.y, x2: q.x, y2: q.y };
            render();
            return;
        }
        if (tool === 'line' || tool === 'arrow') {
            const q = snap(w);
            cur = { t: tool, c: color, w: size, x1: q.x, y1: q.y, x2: q.x, y2: q.y };
            render();
            return;
        }
        if (tool === 'pen' || tool === 'marker') {
            cur = { t: tool, c: color, w: tool === 'marker' ? size * 4 : size, p: [w.x, w.y] };
        } else {
            cur = { t: tool, c: color, w: size, x1: w.x, y1: w.y, x2: w.x, y2: w.y };
        }
        render();
    });
    function moved(it, dx, dy) {
        const n = clone(it);
        if (n.p) n.p = n.p.map((v, i) => v + (i % 2 ? dy : dx));
        else if ('x1' in n) { n.x1 += dx; n.x2 += dx; n.y1 += dy; n.y2 += dy; }
        else { n.x += dx; n.y += dy; }
        return n;
    }
    stage.addEventListener('pointermove', (e) => {
        const p = localPt(e);
        if (shared) sendCursor(toWorld(p.x, p.y));
        if (geo) { const q = snap(toWorld(p.x, p.y)); geo.hx = q.x; geo.hy = q.y; render(); }
        if (!pointers.has(e.pointerId)) {
            if (tool === 'select') {
                const sel = selected && byId(selected);
                stage.style.cursor = handleAt(sel, p.x, p.y) ? 'nwse-resize' : '';
            }
            return;
        }
        pointers.set(e.pointerId, p);
        if (pinch && pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
            view.x -= (cx - pinch.cx) / view.k;
            view.y -= (cy - pinch.cy) / view.k;
            pinch.cx = cx; pinch.cy = cy;
            if (pinch.d > 0) zoomAt(cx, cy, d / pinch.d);
            pinch.d = d;
            return;
        }
        if (panDrag) {
            view.x = panDrag.vx - (p.x - panDrag.sx) / view.k;
            view.y = panDrag.vy - (p.y - panDrag.sy) / view.k;
            render();
            return;
        }
        if (drag) {
            const w = toWorld(p.x, p.y), b = drag.before;
            let n;
            if (drag.mode === 'move') n = moved(b, w.x - drag.w0.x, w.y - drag.w0.y);
            else {
                const k = Math.max(16 / b.w, (w.x - b.x) / b.w, (w.y - b.y) / b.h);
                n = Object.assign(clone(b), { w: b.w * k, h: b.h * k });
            }
            const i = items.findIndex((x) => x.id === b.id);
            if (i >= 0) items[i] = n;
            drag.moved = true;
            render();
            return;
        }
        if (!cur) return;
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of evs.length ? evs : [e]) {
            const lp = localPt(ev), w = toWorld(lp.x, lp.y);
            if (cur.t === 'erase') eraseAt(w.x, w.y);
            else if (cur.p) {
                const n = cur.p.length;
                if (Math.hypot(w.x - cur.p[n - 2], w.y - cur.p[n - 1]) * view.k > 1.2) cur.p.push(w.x, w.y);
            } else {
                let x = w.x, y = w.y;
                if (e.shiftKey) {
                    if (cur.t === 'rect' || cur.t === 'ellipse') {
                        const m = Math.max(Math.abs(x - cur.x1), Math.abs(y - cur.y1));
                        x = cur.x1 + Math.sign(x - cur.x1) * m; y = cur.y1 + Math.sign(y - cur.y1) * m;
                    } else {
                        // шаг 15°
                        const a = Math.round(Math.atan2(y - cur.y1, x - cur.x1) / (Math.PI / 12)) * (Math.PI / 12);
                        const L = Math.hypot(x - cur.x1, y - cur.y1);
                        x = cur.x1 + L * Math.cos(a); y = cur.y1 + L * Math.sin(a);
                    }
                }
                if (!e.shiftKey && (cur.t === 'line' || cur.t === 'arrow' || cur.t === 'circle')) { const q = snap({ x, y }); x = q.x; y = q.y; }
                cur.x2 = x; cur.y2 = y;
            }
        }
        if (cur.t !== 'erase') { render(); sendDraft(cur); }
    });
    function endPointer(e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        if (pinch) { if (pointers.size < 2) pinch = null; saveView(); return; }
        if (panDrag) { panDrag = null; stage.classList.remove('drag'); saveView(); return; }
        if (drag) {
            const after = byId(drag.before.id);
            if (drag.moved && after) record({ mod: [[drag.before, clone(after)]] }), putItems([after]);
            drag = null;
            render();
            return;
        }
        if (!cur) return;
        if (cur.t === 'erase') {
            if (cur.erased.length) record({ del: cur.erased });
        } else {
            const tiny = !cur.p && Math.hypot(cur.x2 - cur.x1, cur.y2 - cur.y1) * view.k < 3;
            if (!tiny) commit({ add: [Object.assign({ id: rid(12), z: newZ() }, cur)] });
        }
        cur = null;
        sendDraft(null);
        render();
    }
    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);
    stage.addEventListener('wheel', (e) => {
        e.preventDefault();
        const p = localPt(e);
        if (e.ctrlKey || e.metaKey || !e.deltaX && Math.abs(e.deltaY) >= 50 && e.deltaMode === 0 && !e.shiftKey) {
            zoomAt(p.x, p.y, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
        } else {
            const f = e.deltaMode === 1 ? 16 : 1;
            view.x += (e.shiftKey ? e.deltaY : e.deltaX) * f / view.k;
            view.y += (e.shiftKey ? 0 : e.deltaY) * f / view.k;
            render(); saveView();
        }
    }, { passive: false });

    // перетаскивание файла на доску и вставка из буфера обмена
    stage.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); stage.classList.add('drop'); } });
    stage.addEventListener('dragleave', () => stage.classList.remove('drop'));
    stage.addEventListener('drop', (e) => {
        stage.classList.remove('drop');
        const files = [...e.dataTransfer.files].filter((f) => /^image\//.test(f.type));
        if (!files.length) return;
        e.preventDefault();
        const p = localPt(e);
        files.forEach((f, i) => addImageFile(f, toWorld(p.x + i * 30, p.y + i * 30)));
    });
    document.addEventListener('paste', (e) => {
        if (textEd || /^(INPUT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName)) return;
        const f = [...(e.clipboardData && e.clipboardData.files || [])].find((x) => /^image\//.test(x.type));
        if (f) { e.preventDefault(); addImageFile(f); }
    });

    // ================= ПАНЕЛЬ =================
    function setTool(t) {
        if (textEd) closeText();
        if (geo) finishGeo(false);
        tool = t;
        if (t !== 'select') selected = null;
        stage.style.cursor = '';
        document.querySelectorAll('#bdTools .bd-btn').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
        stage.className = 'bd-stage ' + (t === 'pan' ? 't-pan' : t === 'text' ? 't-text' : t === 'select' ? 't-select' : 't-draw');
        render();
    }
    function deleteSelected() {
        const it = selected && byId(selected);
        if (it) { commit({ del: [clone(it)] }); render(); }
    }
    function buildBar() {
        $('bdTools').innerHTML = TOOLS.map(([id, title]) =>
            `<button class="bd-btn" data-tool="${id}" title="${title}" aria-label="${title}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[id]}</svg></button>`).join('');
        $('bdTools').addEventListener('click', (e) => { const b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });

        $('bdColors').innerHTML = COLORS.map((c) =>
            `<button class="bd-sw" data-c="${c}" title="${c === 'ink' ? 'Основной' : c}" aria-label="Цвет ${c === 'ink' ? 'основной' : c}"></button>`).join('') +
            '<label class="bd-sw" title="Свой цвет" style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"><input type="color" id="bdPick" aria-label="Свой цвет"></label>';
        const paintSw = () => document.querySelectorAll('#bdColors [data-c]').forEach((b) => {
            b.style.background = paint(b.dataset.c);
            b.classList.toggle('on', b.dataset.c === color);
        });
        $('bdColors').addEventListener('click', (e) => {
            const b = e.target.closest('[data-c]'); if (!b) return;
            color = b.dataset.c; paintSw();
            if (tool === 'eraser' || tool === 'pan' || tool === 'select') setTool('pen');
        });
        $('bdPick').addEventListener('input', (e) => { color = e.target.value; paintSw(); });
        window.addEventListener('mf-board-theme', paintSw);

        $('bdSizes').innerHTML = SIZES.map((s) =>
            `<button class="bd-btn bd-size" data-s="${s}" title="Толщина ${s}" aria-label="Толщина ${s}"><i style="width:${Math.min(4 + s, 18)}px;height:${Math.min(4 + s, 18)}px"></i></button>`).join('');
        $('bdSizes').addEventListener('click', (e) => {
            const b = e.target.closest('[data-s]'); if (!b) return;
            size = +b.dataset.s;
            document.querySelectorAll('#bdSizes .bd-btn').forEach((x) => x.classList.toggle('on', x === b));
        });
        document.querySelector(`#bdSizes [data-s="${size}"]`).classList.add('on');
        paintSw();

        $('bdBg').value = bg;
        $('bdBg').addEventListener('change', (e) => setBg(e.target.value));
        $('bdUndo').onclick = doUndo;
        $('bdRedo').onclick = doRedo;
        $('bdClear').onclick = () => {
            if (!items.length || !confirm(shared ? 'Очистить доску у всех участников? Действие можно отменить.' : 'Очистить доску? Действие можно отменить.')) return;
            commit({ del: items.map(clone) }); render();
        };
        $('bdZoomIn').onclick = () => zoomAt(W / 2, H / 2, 1.25);
        $('bdZoomOut').onclick = () => zoomAt(W / 2, H / 2, 0.8);
        $('bdZoom').onclick = () => { view = { x: -W / 2, y: -H / 2, k: 1 }; zoomAt(0, 0, 1); };
        $('bdImg').onclick = () => $('bdFile').click();
        $('bdFile').onchange = (e) => { [...e.target.files].forEach((f, i) => addImageFile(f, i ? toWorld(W / 2 + i * 30, H / 2 + i * 30) : null)); e.target.value = ''; };
        $('bdSave').onclick = exportPng;
        $('bdFull').onclick = toggleFull;
        $('bdShare').onclick = share;
        $('bdMath').onclick = () => openMath('f');
        $('bdGraph').onclick = () => openMath('g');
        $('bdFig').onclick = () => openMath('s');
        $('bdLeave').onclick = () => { location.href = location.pathname; };
    }

    function toggleFull() {
        const on = !boardEl.classList.contains('full');
        boardEl.classList.toggle('full', on);
        $('bdFull').classList.toggle('on', on);
        document.body.style.overflow = on ? 'hidden' : '';
        resize();
    }

    // PNG по границам нарисованного (с полями), а если пусто — текущий вид.
    function exportPng() {
        if (textEd) closeText();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const it of items) {
            const b = bounds(it);
            minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
        }
        let v;
        if (minX === Infinity) { v = { x: view.x, y: view.y, k: 1, w: W / view.k, h: H / view.k }; }
        else { const m = 30; v = { x: minX - m, y: minY - m, k: 1, w: maxX - minX + 2 * m, h: maxY - minY + 2 * m }; }
        const scale = Math.min(2, 8000 / Math.max(v.w, v.h));
        const c = document.createElement('canvas');
        c.width = Math.ceil(v.w * scale); c.height = Math.ceil(v.h * scale);
        const g = c.getContext('2d');
        g.fillStyle = isLight() ? '#ffffff' : '#0b1020';
        g.fillRect(0, 0, c.width, c.height);
        g.scale(scale, scale);
        drawBg(g, v.w, v.h, v);
        g.translate(-v.x, -v.y);
        for (const it of items) drawItem(g, it);
        c.toBlob((b) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(b);
            a.download = 'mathframe-board-' + new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-') + '.png';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        });
    }

    let toastT = 0;
    function toast(msg) {
        const t = $('bdToast');
        t.textContent = msg; t.classList.add('show');
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 4000);
    }

    // ================= СОВМЕСТНАЯ РАБОТА =================
    function waitFirebase() {
        return new Promise((resolve, reject) => {
            let n = 0;
            (function tick() {
                if (window.firebase && firebase.apps && firebase.apps.length && typeof ensureFirestore === 'function') {
                    return ensureFirestore().then(() => resolve(firebase.firestore()), reject);
                }
                if (++n > 100) return reject(new Error('Firebase недоступен'));
                setTimeout(tick, 100);
            })();
        });
    }
    function syncError(err) {
        console.error('[board]', err);
        setStatus('error', err && err.code === 'permission-denied'
            ? 'Нет доступа к общей доске (правила Firestore)'
            : 'Ошибка синхронизации — изменения могут не дойти');
    }
    function setStatus(kind, text) {
        const s = $('bdStatus');
        s.dataset.kind = kind; s.textContent = text;
    }

    async function share() {
        if (shared) return showShare();
        $('bdShare').disabled = true;
        setStatus('wait', 'Создаю общую доску…');
        try {
            const db = await waitFirebase();
            const id = rid(20);
            const ref = db.collection('boards').doc(id);
            const user = firebase.auth().currentUser;
            await ref.set({ bg, createdAt: Date.now(), updatedAt: Date.now(), owner: user ? user.uid : null });
            // копируем текущую личную доску в общую (батчами по 400 объектов)
            for (let i = 0; i < items.length; i += 400) {
                const b = db.batch();
                items.slice(i, i + 400).forEach((it) => b.set(ref.collection('items').doc(it.id), it));
                await b.commit();
            }
            history.pushState(null, '', location.pathname + '?b=' + id);
            await joinShared(id, db);
            showShare();
        } catch (e) {
            syncError(e);
            if (!shared) setStatus('', '');
        } finally { $('bdShare').disabled = false; }
    }
    function showShare() {
        const url = location.origin + location.pathname + '?b=' + shared.id;
        $('bdLink').value = url;
        $('bdShareDlg').hidden = false;
        $('bdLink').select();
        const copy = () => navigator.clipboard && navigator.clipboard.writeText(url).then(() => {
            $('bdCopy').textContent = 'Скопировано';
            setTimeout(() => { $('bdCopy').textContent = 'Копировать'; }, 1800);
        }).catch(() => $('bdLink').select());
        $('bdCopy').onclick = copy;
        copy();
        showQr(url);
    }
    // QR-код ссылки: библиотека грузится лениво при первом открытии диалога
    let qrLib = null;
    function showQr(url) {
        const box = $('bdQr');
        box.innerHTML = '';
        qrLib = qrLib || new Promise((ok, fail) => {
            if (window.qrcode) return ok();
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
            s.onload = ok; s.onerror = () => { qrLib = null; fail(); };
            document.head.appendChild(s);
        });
        qrLib.then(() => {
            const qr = window.qrcode(0, 'M');
            qr.addData(url); qr.make();
            box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
        }).catch(() => {});
    }

    function myName() {
        const u = window.firebase && firebase.auth && firebase.auth().currentUser;
        if (u && (u.displayName || u.email)) return u.displayName || u.email.split('@')[0];
        let n = '';
        try { n = localStorage.getItem('mf-board-name') || ''; } catch (e) {}
        if (!n) { n = 'Гость ' + Math.floor(100 + Math.random() * 900); try { localStorage.setItem('mf-board-name', n); } catch (e) {} }
        return n;
    }
    const fresh = (p) => Date.now() - (p.t || 0) < PEER_TTL;

    async function joinShared(id, db) {
        db = db || await waitFirebase();
        const ref = db.collection('boards').doc(id);
        let peerId;
        try { peerId = sessionStorage.getItem('mf-board-peer') || rid(12); sessionStorage.setItem('mf-board-peer', peerId); } catch (e) { peerId = rid(12); }
        const me = { name: myName(), color: PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)] };
        shared = { id, db, ref, peerId, peerRef: ref.collection('peers').doc(peerId), peers: new Map(), unsub: [], me };
        undo = []; redo = []; syncHistory();
        try { const v = JSON.parse(sessionStorage.getItem('mf-board-view-' + id) || 'null'); if (v) { view = v; $('bdZoom').textContent = Math.round(v.k * 100) + '%'; } } catch (e) {}
        boardEl.classList.add('is-shared');
        setStatus('wait', 'Подключаюсь…');

        const boardSnap = await ref.get();
        if (!boardSnap.exists) {
            setStatus('error', 'Доска не найдена — ссылка неверная или доску удалили');
            shared = null;
            return;
        }
        let first = true;
        shared.unsub.push(ref.onSnapshot((d) => {
            const data = d.data();
            if (data && data.bg && data.bg !== bg) { bg = data.bg; $('bdBg').value = bg; render(); }
        }, syncError));
        shared.unsub.push(ref.collection('items').onSnapshot((snap) => {
            if (first) { items = []; first = false; }
            snap.docChanges().forEach((ch) => {
                const it = ch.doc.data();
                // объект, который я сейчас тяну или правлю, не перетираю своим же эхом
                if (drag && drag.before.id === it.id) return;
                if (textEd && textEd.existing && textEd.existing.id === it.id) return;
                const i = items.findIndex((x) => x.id === it.id);
                if (ch.type === 'removed') { if (i >= 0) items.splice(i, 1); if (selected === it.id) selected = null; }
                else if (i >= 0) items[i] = it; else items.push(it);
            });
            sortItems();
            render();
            setStatus('ok', 'Общая доска');
        }, syncError));
        shared.unsub.push(ref.collection('peers').onSnapshot((snap) => {
            snap.docChanges().forEach((ch) => {
                if (ch.doc.id === peerId) return;
                if (ch.type === 'removed') shared.peers.delete(ch.doc.id);
                else shared.peers.set(ch.doc.id, ch.doc.data());
            });
            updatePeople(); render();
        }, () => {}));

        writePeer({ name: me.name, color: me.color, t: Date.now(), x: null, y: null, draft: null });
        shared.beat = setInterval(() => { writePeer({ t: Date.now() }); updatePeople(); render(); }, 15000);
        const bye = () => { try { shared.peerRef.delete(); } catch (e) {} };
        window.addEventListener('pagehide', bye);
        // имя появляется после входа в аккаунт — обновим, когда auth готов
        if (window.firebase && firebase.auth) firebase.auth().onAuthStateChanged(() => {
            const n = myName(); if (shared && n !== shared.me.name) { shared.me.name = n; writePeer({ name: n }); }
        });
        render();
    }

    // Запись своего «присутствия»: не чаще раза в 120 мс, последнее значение не теряется.
    let peerPending = null, peerTimer = 0, peerLast = 0;
    function writePeer(patch) {
        if (!shared) return;
        peerPending = Object.assign(peerPending || {}, patch);
        const wait = Math.max(0, 120 - (Date.now() - peerLast));
        if (peerTimer) return;
        peerTimer = setTimeout(() => {
            peerTimer = 0; peerLast = Date.now();
            const data = Object.assign({ t: Date.now() }, peerPending);
            peerPending = null;
            shared.peerRef.set(data, { merge: true }).catch(() => {});
        }, wait);
    }
    function sendCursor(w) { writePeer({ x: Math.round(w.x), y: Math.round(w.y) }); }
    function sendDraft(it) {
        if (!shared) return;
        // длинный штрих в черновике обрезаем — он всё равно придёт целиком после отпускания
        let d = it ? clone(it) : null;
        if (d && d.p && d.p.length > 1200) d.p = d.p.slice(-1200);
        writePeer({ draft: d });
    }
    function updatePeople() {
        const list = [...shared.peers.values()].filter(fresh);
        const el = $('bdPeople');
        el.innerHTML = [shared.me, ...list].slice(0, 8).map((p, i) =>
            `<span class="bd-ava" style="background:${p.color}" title="${esc(p.name)}${i ? '' : ' (вы)'}">${esc(String(p.name || '?').trim()[0] || '?').toUpperCase()}</span>`).join('') +
            (list.length > 7 ? `<span class="bd-ava more">+${list.length - 7}</span>` : '');
        el.title = (list.length + 1) + ' на доске';
    }
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    function drawPeers() {
        ctx.font = '600 11px sans-serif'; ctx.textBaseline = 'top';
        for (const p of shared.peers.values()) {
            if (!fresh(p) || p.x == null) continue;
            const sx = (p.x - view.x) * view.k, sy = (p.y - view.y) * view.k;
            if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue;
            ctx.fillStyle = p.color || '#3e8bff';
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4, sy + 15); ctx.lineTo(sx + 7.5, sy + 9); ctx.lineTo(sx + 14, sy + 8); ctx.closePath(); ctx.fill();
            const name = String(p.name || '').slice(0, 24);
            const tw = ctx.measureText(name).width;
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx + 10, sy + 16, tw + 10, 17, 5) : ctx.rect(sx + 10, sy + 16, tw + 10, 17); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillText(name, sx + 15, sy + 19);
        }
    }

    // ================= КЛАВИАТУРА =================
    document.addEventListener('keydown', (e) => {
        if (!$('bdMathDlg').hidden) { if (e.key === 'Escape') closeMath(); return; }
        if (textEd || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;
        const k = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'я')) { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
        if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'н')) { e.preventDefault(); doRedo(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); deleteSelected(); return; }
        if (e.code === 'Space') { spaceDown = true; stage.classList.add('t-pan'); e.preventDefault(); return; }
        if (e.code === 'KeyF') { toggleFull(); return; }
        if (e.code === 'KeyI') { $('bdFile').click(); return; }
        if (geo && e.key === 'Enter') { e.preventDefault(); finishGeo(true, false); return; }
        if (e.code === 'KeyX') { openMath('f'); e.preventDefault(); return; }
        if (e.key === 'Escape') {
            if (!$('bdMathDlg').hidden) { closeMath(); return; }
            if (geo) { finishGeo(false); return; }
            if (!$('bdShareDlg').hidden) { $('bdShareDlg').hidden = true; return; }
            if (selected) { selected = null; render(); return; }
            if (boardEl.classList.contains('full')) { toggleFull(); return; }
        }
        const t = TOOLS.find((x) => 'Key' + x[2].toUpperCase() === e.code);
        if (t) setTool(t[0]);
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && spaceDown) { spaceDown = false; if (tool !== 'pan') stage.classList.remove('t-pan'); }
    });
    $('bdShareDlg').addEventListener('click', (e) => { if (e.target === $('bdShareDlg') || e.target.closest('[data-close]')) $('bdShareDlg').hidden = true; });

    // смена темы — перерисовать «основной» цвет и фон
    new MutationObserver(() => { render(); window.dispatchEvent(new Event('mf-board-theme')); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('popstate', () => location.reload());

    // окна — прямо в <body>: внутри <main> (свой z-index) их перекрывала шапка сайта
    ['bdMathDlg', 'bdShareDlg'].forEach((id) => document.body.appendChild($(id)));
    const sharedId = (params.get('b') || '').replace(/[^A-Za-z0-9]/g, '');
    if (!sharedId) loadLocal();
    buildBar();
    setTool('pen');
    syncHistory();
    $('bdZoom').textContent = Math.round(view.k * 100) + '%';
    new ResizeObserver(resize).observe(stage);
    resize();
    if (sharedId) joinShared(sharedId).catch(syncError);
    if (items.some((i) => i.t === 'tex' || i.t === 'plot')) loadMathJax().then(render, () => {});
})();

// ===== ЭЛЕКТРОННАЯ ДОСКА (pages/board.html, /board/) =====
// Векторная доска на <canvas>: каждый штрих/фигура/картинка — объект с id в мировых
// координатах, поэтому поле бесконечное, масштаб не портит линии, а отмена — это
// обратные операции (добавить/удалить/изменить объекты).
//
// Два режима:
//  • личные доски — список в localStorage, содержимое в IndexedDB этого браузера;
//  • общая доска (/board/?b=<id>) — живёт в Firestore: boards/{id} (фон),
//    boards/{id}/items/{itemId} (объекты), boards/{id}/peers/{peerId} (курсоры
//    и недорисованный штрих участников). Ссылку может открыть и рисовать любой,
//    у кого она есть и кто вошёл в аккаунт. Правила — в админке (Правила Firestore).
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
        mark: '<path d="M3 20 21 4"/><path d="M9 10l4 4M12 7l4 4"/>',
        extend: '<path d="M2 19 22 5" stroke-dasharray="3 3"/><path d="M7 15.5 15 10"/><circle cx="7" cy="15.5" r="1.6" fill="currentColor"/><circle cx="15" cy="10" r="1.6" fill="currentColor"/>',
        pan: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
    };
    const TOOLS = [
        ['select', 'Выбор и перемещение (V)', 'v'],
        ['pen', 'Перо (P)', 'p'], ['marker', 'Маркер-выделитель (M)', 'm'], ['eraser', 'Ластик (E)', 'e'],
        ['line', 'Отрезок (L)', 'l'], ['arrow', 'Стрелка (A)', 'a'],
        ['point', 'Точка с подписью (K)', 'k'],
        ['text', 'Текст и формулы (T): формула — кнопкой ∑ или Ctrl+M', 't'], ['pan', 'Рука — сдвиг (H)', 'h'],
    ];
    // инструменты из меню «Фигуры» — со своими горячими клавишами
    const EXTRA_KEYS = { c: 'circle', o: 'ellipse', g: 'poly', u: 'angle', r: 'shape' };
    // 'ink' — цвет «по теме»: светлый на тёмной доске, тёмный на светлой.
    // 'contrast' — особый цвет: рисуется в режиме «разность» поверх белого, поэтому
    // на любом фоне (доска, картинка, другие линии) выходит противоположный, контрастный цвет.
    const COLORS = ['ink', 'contrast', '#e5484d', '#3e8bff', '#30a46c', '#f2a25c', '#9b6bff'];
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
    let sel = [];                               // id выбранных объектов
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

    // Личные доски: список — в localStorage (mf-boards), содержимое — в IndexedDB
    // (без ограничения 5 МБ localStorage, поэтому у личных досок лимитов нет).
    const IDX = 'mf-boards', CUR = 'mf-board-cur', RECENT = 'mf-boards-recent';
    let localId = null;
    const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    let idbP = null;
    function idb() {
        if (!idbP) idbP = new Promise((ok, fail) => {
            const r = indexedDB.open('mf-board', 1);
            r.onupgradeneeded = () => r.result.createObjectStore('boards');
            r.onsuccess = () => ok(r.result);
            r.onerror = () => fail(r.error);
        });
        return idbP;
    }
    function idbDo(mode, fn) {
        return idb().then((db) => new Promise((ok, fail) => {
            const tx = db.transaction('boards', mode), st = tx.objectStore('boards');
            const req = fn(st);
            tx.oncomplete = () => ok(req && req.result);
            tx.onerror = () => fail(tx.error);
        }));
    }
    const idbGet = (id) => idbDo('readonly', (st) => st.get(id));
    const idbPut = (id, v) => idbDo('readwrite', (st) => st.put(v, id));
    const idbDel = (id) => idbDo('readwrite', (st) => st.delete(id));
    const localList = () => lsGet(IDX, []);
    function newLocal(name, data) {
        const list = localList(), id = rid(12), now = Date.now();
        list.push({ id, name: name || 'Доска ' + (list.length + 1), created: now, updated: now });
        lsSet(IDX, list);
        return idbPut(id, data || { items: [], bg: 'cells' }).then(() => id);
    }
    async function loadLocal(wanted) {
        // перенос старой единственной доски (mf-board-v1) в список
        let old = null;
        try { old = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
        if (old && Array.isArray(old.items)) {
            await newLocal('Моя доска', old);
            try { localStorage.removeItem(STORE); } catch (e) {}
        }
        let list = localList();
        if (!list.length) { await newLocal('Моя доска'); list = localList(); }
        const cur = list.find((b) => b.id === wanted) || list.find((b) => b.id === lsGet(CUR, '')) || list[0];
        localId = cur.id;
        lsSet(CUR, localId);
        const s = await idbGet(localId).catch(() => null);
        if (s && Array.isArray(s.items)) {
            items = s.items.map((it, i) => Object.assign({ id: rid(12), z: i }, it));
            bg = s.bg || 'cells';
            if (s.view) { view = s.view; viewSet = true; }
        }
        sortItems();
        setTitle(cur.name);
    }
    let saveT = 0;
    function saveLocal() {
        if (shared || !localId) return;
        clearTimeout(saveT);
        saveT = setTimeout(() => {
            idbPut(localId, { items, bg, view }).catch(() => toast('Не удалось сохранить доску в браузере'));
            const list = localList(), b = list.find((x) => x.id === localId);
            if (b) { b.updated = Date.now(); lsSet(IDX, list); }
        }, 250);
    }
    function setTitle(name) {
        const el = $('bdBoardName');
        if (el) el.textContent = name || 'Доска';
        document.title = (name ? name + ' — ' : '') + 'Доска — MathFrame';
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
            list.forEach((it) => { delete it._sz; b.set(shared.ref.collection('items').doc(it.id), it); });
            b.commit().catch(syncError);
        }
        saveLocal();
    }
    function dropItems(ids) {
        items = items.filter((x) => !ids.includes(x.id));
        if (sel.length) sel = sel.filter((id) => !ids.includes(id));
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
    // Лимиты общей (серверной) доски; у личных досок и у администраторов их нет.
    const CLOUD_MAX_BOARDS = 10, CLOUD_MAX_ITEMS = 5000, CLOUD_MAX_BYTES = 5 * 1024 * 1024;
    const sizeOf = (it) => JSON.stringify(it).length;
    function overLimit(op) {
        if (!shared || shared.noLimit || !op.add && !op.mod) return false;
        let n = items.length, bytes = 0;
        for (const it of items) bytes += it._sz || (it._sz = sizeOf(it));
        for (const it of op.add || []) { n++; bytes += sizeOf(it); }
        for (const [a, b] of op.mod || []) bytes += sizeOf(b) - sizeOf(a);
        if (n > CLOUD_MAX_ITEMS) { toast('На общей доске может быть не больше ' + CLOUD_MAX_ITEMS + ' объектов'); return true; }
        if (bytes > CLOUD_MAX_BYTES) { toast('Общая доска заполнена (лимит ' + (CLOUD_MAX_BYTES >> 20) + ' МБ) — удалите лишнее, например большие картинки'); return true; }
        return false;
    }
    function commit(op) {
        if (overLimit(op)) { render(); return false; }
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
    const inkColor = () => (isLight() ? '#000000' : '#ffffff');
    const paint = (c) => (c === 'ink' ? inkColor() : c === 'contrast' ? '#ffffff' : c);
    const boardFill = () => (isLight() ? '#ffffff' : '#0b1020');
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

    // Объекты, которые поворачиваются целиком (угол it.rot вокруг центра рамки);
    // у остальных (штрихи, отрезки, многоугольники…) поворот и масштаб меняют сами координаты.
    const ROT = { img: 1, tex: 1, plot: 1, vec: 1, rect: 1, ellipse: 1, text: 1, solid: 1 };
    // «Геометрия» — объекты с вершинами, которые склеиваются: отрезок, проведённый от точки
    // к точке, следует за ней при перетаскивании (совпадающие координаты двигаются вместе).
    const GEO = { point: 1, line: 1, arrow: 1, poly: 1, angle: 1, circle: 1 };
    const rotPt = (x, y, cx, cy, a) => {
        const co = Math.cos(a), si = Math.sin(a), dx = x - cx, dy = y - cy;
        return { x: cx + dx * co - dy * si, y: cy + dx * si + dy * co };
    };

    // «Контрастные» объекты, идущие подряд, рисуются белым в отдельный слой, а слой
    // накладывается на холст разностью один раз — так линии контрастного цвета не
    // «контрастируют» друг с другом (на пересечениях не пропадают), а только с фоном под ними.
    let inLayer = false;
    const layerCv = document.createElement('canvas');
    function drawList(c, list) {
        let run = null;
        const flush = () => {
            if (!run) return;
            const lc = layerCv.getContext('2d');
            c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'difference';
            c.drawImage(layerCv, 0, 0); c.restore();
            run = null;
            lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, layerCv.width, layerCv.height);
        };
        for (const it of list) {
            if (!it) continue;
            if (it.c === 'contrast') {
                const lc = layerCv.getContext('2d');
                if (!run) {
                    if (layerCv.width !== c.canvas.width || layerCv.height !== c.canvas.height) { layerCv.width = c.canvas.width; layerCv.height = c.canvas.height; }
                    else { lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, layerCv.width, layerCv.height); }
                    run = true;
                }
                lc.setTransform(c.getTransform());
                inLayer = true; drawItem(lc, it); inLayer = false;
            } else { flush(); drawItem(c, it); }
        }
        flush();
    }
    function drawItem(c, it) {
        c.save();
        if (it.c === 'contrast' && !inLayer) c.globalCompositeOperation = 'difference';
        if (it.rot && ROT[it.t]) {
            const f = frameOf(it);
            c.translate(f.cx, f.cy); c.rotate(it.rot); c.translate(-f.cx, -f.cy);
        }
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.strokeStyle = c.fillStyle = paint(it.c);
        c.lineWidth = it.w;
        if (it.t === 'marker') { c.globalAlpha = 0.35; c.lineCap = 'butt'; }
        if (it.t === 'pen' && it.pr) {
            c.fill(inkPath(it));
        } else if (it.t === 'pen' || it.t === 'marker') {
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
            const dx = it.x2 - it.x1, dy = it.y2 - it.y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, FAR = 1e5;
            // продление до луча (ex1 — за начало, ex2 — за конец) или прямой (оба)
            const ax = it.ex1 ? it.x1 - ux * FAR : it.x1, ay = it.ex1 ? it.y1 - uy * FAR : it.y1;
            const bx = it.ex2 ? it.x2 + ux * FAR : it.x2, by = it.ex2 ? it.y2 + uy * FAR : it.y2;
            strokeStyled(c, it, (off) => { c.beginPath(); c.moveTo(ax - uy * off, ay + ux * off); c.lineTo(bx - uy * off, by + ux * off); c.stroke(); });
            if (it.mk) ticks(c, it, it.x1, it.y1, it.x2, it.y2, it.mk);
            if (it.t === 'arrow') {
                const a = Math.atan2(it.y2 - it.y1, it.x2 - it.x1), L = 8 + it.w * 3;
                c.beginPath();
                c.moveTo(it.x2 - L * Math.cos(a - .45), it.y2 - L * Math.sin(a - .45));
                c.lineTo(it.x2, it.y2);
                c.lineTo(it.x2 - L * Math.cos(a + .45), it.y2 - L * Math.sin(a + .45));
                c.stroke();
            }
            if (it.label) {
                const a = Math.atan2(it.y2 - it.y1, it.x2 - it.x1), off = 10 + it.w;
                drawLabel(c, it, it.label, (it.x1 + it.x2) / 2 + Math.sin(a) * off, (it.y1 + it.y2) / 2 - Math.cos(a) * off);
            }
        } else if (it.t === 'rect') {
            strokeStyled(c, it, (off) => c.strokeRect(Math.min(it.x1, it.x2) - off, Math.min(it.y1, it.y2) - off, Math.abs(it.x2 - it.x1) + 2 * off, Math.abs(it.y2 - it.y1) + 2 * off));
        } else if (it.t === 'ellipse') {
            strokeStyled(c, it, (off) => {
                c.beginPath();
                c.ellipse((it.x1 + it.x2) / 2, (it.y1 + it.y2) / 2, Math.max(.5, Math.abs(it.x2 - it.x1) / 2 + off), Math.max(.5, Math.abs(it.y2 - it.y1) / 2 + off), 0, 0, Math.PI * 2);
                c.stroke();
            });
        } else if (it.t === 'text') {
            drawText(c, it);
        } else if (it.t === 'point') {
            const r = 2.5 + it.w * .6;
            c.beginPath(); c.arc(it.x, it.y, r, 0, Math.PI * 2); c.fill();
            if (it.label) {
                c.font = 'italic ' + textFont(14 + it.w * 1.5); c.textBaseline = 'bottom'; c.textAlign = 'left';
                c.fillText(it.label, it.x + r + 2, it.y - r - 1);
            }
        } else if (it.t === 'circle') {
            const r = Math.hypot(it.x2 - it.x1, it.y2 - it.y1);
            strokeStyled(c, it, (off) => { c.beginPath(); c.arc(it.x1, it.y1, Math.max(.5, r + off), 0, Math.PI * 2); c.stroke(); });
            if (!it.nc) { c.beginPath(); c.arc(it.x1, it.y1, 1.5 + it.w * .4, 0, Math.PI * 2); c.fill(); }
            if (it.label) drawLabel(c, it, it.label, it.x1 - 10 - it.w, it.y1 + 12 + it.w);
        } else if (it.t === 'poly') {
            const p0 = it.hx !== undefined ? it.p.concat([it.hx, it.hy]) : it.p;
            strokeStyled(c, it, (off) => {
                const p = off ? offsetPoly(p0, it.cl, off) : p0;
                c.beginPath(); c.moveTo(p[0], p[1]);
                for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
                if (it.cl) c.closePath();
                c.stroke();
            });
            if (it.mk) {
                const n = it.p.length / 2;
                for (let i = 0; i < n; i++) if (it.mk[i]) { const j = (i + 1) % n; if (j || it.cl) ticks(c, it, it.p[2 * i], it.p[2 * i + 1], it.p[2 * j], it.p[2 * j + 1], it.mk[i]); }
            }
            polyDecor(c, it);
        } else if (it.t === 'angle') {
            drawAngle(c, it);
        } else if (it.t === 'tex') {
            drawTex(c, it);
        } else if (it.t === 'vec') {
            drawVec(c, it);
        } else if (it.t === 'solid') {
            drawSolid(c, it);
        } else if (it.t === 'plot') {
            drawPlot(c, it);
        } else if (it.t === 'shapeDraft') {
            const f = draftBox(it);
            if (f) { c.restore(); buildShapeItems(it.sid, f.x, f.y, f.w, f.h, it).forEach((x) => drawItem(c, x)); return; }
        } else if (it.t === 'img') {
            const im = getImg(it);
            if (im.complete && im.naturalWidth) c.drawImage(im, it.x, it.y, it.w, it.h);
            else { c.globalAlpha = .4; c.strokeStyle = inkColor(); c.lineWidth = 1; c.setLineDash([6, 6]); c.strokeRect(it.x, it.y, it.w, it.h); }
        }
        c.restore();
    }
    // ---- стиль линии: ls = solid | dash | dot | dashdot | long | double, dl — длина штриха (множитель)
    function dashFor(it) {
        const w = Math.max(1, it.w || 2), k = it.dl || 1;
        if (it.ls === 'dash') return [w * 3.5 * k, w * 2.5 * k];
        if (it.ls === 'long') return [w * 9 * k, w * 3 * k];
        if (it.ls === 'dot') return [.01, w * 2.2 * k];
        if (it.ls === 'dashdot') return [w * 6 * k, w * 2.2 * k, .01, w * 2.2 * k];
        return [];
    }
    // fn(off) рисует контур со сдвигом off по нормали; двойная линия — два сдвинутых контура
    function strokeStyled(c, it, fn) {
        if (it.ls === 'double') {
            const lw = c.lineWidth, off = Math.max(1.5, lw * .9) * (it.dl || 1);
            c.lineWidth = Math.max(1, lw * .5);
            fn(off); fn(-off);
            c.lineWidth = lw;
            return;
        }
        const d = dashFor(it);
        if (d.length) c.setLineDash(d);
        if (it.ls === 'dot') c.lineCap = 'round';
        fn(0);
        c.setLineDash([]);
    }
    // контур многоугольника, сдвинутый на off (стыки — «митрой»)
    function offsetPoly(p, cl, off) {
        const n = p.length / 2, out = [];
        const nrm = (i, j) => { const dx = p[2 * j] - p[2 * i], dy = p[2 * j + 1] - p[2 * i + 1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
        for (let i = 0; i < n; i++) {
            const hasP = cl || i > 0, hasN = cl || i < n - 1;
            const a = hasP ? nrm((i - 1 + n) % n, i) : null, b = hasN ? nrm(i, (i + 1) % n) : null;
            let mx, my;
            if (a && b) { const d = 1 + a[0] * b[0] + a[1] * b[1]; const k = d > .1 ? off / d : off; mx = (a[0] + b[0]) * k; my = (a[1] + b[1]) * k; }
            else { const q = a || b; mx = q[0] * off; my = q[1] * off; }
            out.push(p[2 * i] + mx, p[2 * i + 1] + my);
        }
        return out;
    }
    // засечки равенства на отрезке
    function ticks(c, it, x1, y1, x2, y2, n) {
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, h = 7 + (it.w || 2), gap = 5 + (it.w || 2) * .6;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        c.save(); c.setLineDash([]); c.lineWidth = Math.max(1.2, (it.w || 2) * .7); c.beginPath();
        for (let k = 0; k < n; k++) {
            const o = (k - (n - 1) / 2) * gap, cx = mx + ux * o, cy = my + uy * o;
            c.moveTo(cx - uy * h, cy + ux * h); c.lineTo(cx + uy * h, cy - ux * h);
        }
        c.stroke(); c.restore();
    }
    function drawLabel(c, it, text, x, y) {
        c.save();
        c.font = 'italic ' + textFont(14 + (it.w || 2) * 1.5);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(text, x, y);
        c.restore();
    }
    // подписи вершин многоугольника (наружу от центра) и значки прямых углов
    function polyDecor(c, it) {
        const p = it.p, n = p.length / 2;
        if (n < 2) return;
        let cx = 0, cy = 0;
        for (let i = 0; i < n; i++) { cx += p[2 * i]; cy += p[2 * i + 1]; }
        cx /= n; cy /= n;
        if (it.cl && n >= 3) {
            c.save(); c.lineWidth = Math.max(1, it.w * .6);
            for (let i = 0; i < n; i++) {
                const j = (i + n - 1) % n, k = (i + 1) % n;
                const ax = p[2 * j] - p[2 * i], ay = p[2 * j + 1] - p[2 * i + 1], bx = p[2 * k] - p[2 * i], by = p[2 * k + 1] - p[2 * i + 1];
                const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
                if (!la || !lb) continue;
                const cos = (ax * bx + ay * by) / la / lb;
                if (Math.abs(cos) > .01) continue;
                const s = Math.min(14 + it.w, la * .3, lb * .3), ux = ax / la * s, uy = ay / la * s, vx = bx / lb * s, vy = by / lb * s;
                c.beginPath();
                c.moveTo(p[2 * i] + ux, p[2 * i + 1] + uy);
                c.lineTo(p[2 * i] + ux + vx, p[2 * i + 1] + uy + vy);
                c.lineTo(p[2 * i] + vx, p[2 * i + 1] + vy);
                c.stroke();
            }
            c.restore();
        }
        if (it.lb) for (let i = 0; i < n; i++) {
            if (!it.lb[i]) continue;
            const q = vertexLabelPos(it, i, cx, cy);
            drawLabel(c, it, it.lb[i], q.x, q.y);
        }
    }
    function vertexLabelPos(it, i, cx, cy) {
        const p = it.p, n = p.length / 2;
        if (cx === undefined) { cx = 0; cy = 0; for (let k = 0; k < n; k++) { cx += p[2 * k]; cy += p[2 * k + 1]; } cx /= n; cy /= n; }
        const dx = p[2 * i] - cx, dy = p[2 * i + 1] - cy, d = Math.hypot(dx, dy) || 1, off = 13 + (it.w || 2) * 1.2;
        return { x: p[2 * i] + dx / d * off, y: p[2 * i + 1] + dy / d * off };
    }

    // ---------- «приятное» перо: переменная толщина (скорость/нажим), сглаживание, сужение концов
    const inkCache = new Map();
    function inkPath(it) {
        const key = it.id ? it.id + ':' + it.p.length + ':' + it.p[0] + ':' + it.p[1] : null;
        if (key && inkCache.has(key)) return inkCache.get(key);
        let pts = [];
        for (let i = 0; i < it.p.length; i += 2) pts.push([it.p[i], it.p[i + 1], it.pr[i / 2] === undefined ? .5 : it.pr[i / 2]]);
        // сглаживание Чайкина (концы сохраняем)
        for (let k = 0; k < 2 && pts.length > 2; k++) {
            const o = [pts[0]];
            for (let i = 0; i < pts.length - 1; i++) {
                const a = pts[i], b = pts[i + 1];
                o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25, a[2] * .75 + b[2] * .25]);
                o.push([a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75, a[2] * .25 + b[2] * .75]);
            }
            o.push(pts[pts.length - 1]);
            pts = o;
        }
        const n = pts.length, dist = [0];
        for (let i = 1; i < n; i++) dist.push(dist[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        const L = dist[n - 1], th = it.th === undefined ? .5 : it.th, tp = it.tp === undefined ? .4 : it.tp;
        const tl = tp * Math.min(L * .45, it.w * 10 + 8);
        const rad = pts.map((q, i) => {
            const pf = (1 - th) + th * (.25 + 1.25 * q[2]);
            let tf = 1;
            if (tl > 0) tf = .18 + .82 * Math.sqrt(Math.min(1, dist[i] / tl, (L - dist[i]) / tl));
            return Math.max(.3, it.w / 2 * pf * tf);
        });
        const path = new Path2D();
        for (let i = 0; i < n; i++) { path.moveTo(pts[i][0] + rad[i], pts[i][1]); path.arc(pts[i][0], pts[i][1], rad[i], 0, Math.PI * 2); }
        for (let i = 0; i < n - 1; i++) {
            const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
            if (d < 1e-6) continue;
            const nx = -dy / d, ny = dx / d;
            let q = [[a[0] + nx * rad[i], a[1] + ny * rad[i]], [b[0] + nx * rad[i + 1], b[1] + ny * rad[i + 1]],
                [b[0] - nx * rad[i + 1], b[1] - ny * rad[i + 1]], [a[0] - nx * rad[i], a[1] - ny * rad[i]]];
            // одна и та же ориентация с окружностями — иначе при «nonzero» на стыках появятся дырки
            let area = 0;
            for (let k = 0; k < 4; k++) { const u = q[k], v = q[(k + 1) % 4]; area += u[0] * v[1] - v[0] * u[1]; }
            if (area < 0) q = q.reverse();
            path.moveTo(q[0][0], q[0][1]); path.lineTo(q[1][0], q[1][1]); path.lineTo(q[2][0], q[2][1]); path.lineTo(q[3][0], q[3][1]); path.closePath();
        }
        if (key) { if (inkCache.size > 3000) inkCache.clear(); inkCache.set(key, path); }
        return path;
    }

    // Рамка без поворота (в мировых координатах)
    function lbounds(it) {
        if (BOX[it.t]) return { x: it.x, y: it.y, w: it.w, h: it.h };
        if (it.t === 'point') return { x: it.x - 6, y: it.y - 26, w: 30, h: 32 };
        if (it.t === 'circle') {
            const r = Math.hypot(it.x2 - it.x1, it.y2 - it.y1) + it.w / 2;
            return { x: it.x1 - r, y: it.y1 - r, w: 2 * r, h: 2 * r };
        }
        if (it.t === 'text') { const L = layoutText(it); return { x: it.x, y: it.y, w: L.w, h: L.h }; }
        let x1, y1, x2, y2;
        if (it.p) {
            x1 = y1 = Infinity; x2 = y2 = -Infinity;
            for (let i = 0; i < it.p.length; i += 2) {
                x1 = Math.min(x1, it.p[i]); x2 = Math.max(x2, it.p[i]);
                y1 = Math.min(y1, it.p[i + 1]); y2 = Math.max(y2, it.p[i + 1]);
            }
        } else { x1 = Math.min(it.x1, it.x2); x2 = Math.max(it.x1, it.x2); y1 = Math.min(it.y1, it.y2); y2 = Math.max(it.y1, it.y2); }
        const m = it.w / 2 + (it.t === 'arrow' ? 8 + it.w * 3 : 0) + (it.lb || it.label ? 22 : 0);
        return { x: x1 - m, y: y1 - m, w: x2 - x1 + 2 * m, h: y2 - y1 + 2 * m };
    }
    // Рамка с учётом поворота — для экспорта, рамки выделения и т.п.
    function bounds(it) {
        const b = lbounds(it);
        if (!it.rot || !ROT[it.t]) return b;
        const f = frameOf(it);
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
            const q = rotPt(b.x + b.w / 2 + dx * b.w / 2, b.y + b.h / 2 + dy * b.h / 2, f.cx, f.cy, it.rot);
            x1 = Math.min(x1, q.x); x2 = Math.max(x2, q.x); y1 = Math.min(y1, q.y); y2 = Math.max(y2, q.y);
        }
        return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }
    // Рамка для ручек: центр, размеры (без полей под толщину линии) и угол
    function frameOf(it) {
        let b;
        if (it.t === 'rect' || it.t === 'ellipse') b = { x: Math.min(it.x1, it.x2), y: Math.min(it.y1, it.y2), w: Math.abs(it.x2 - it.x1), h: Math.abs(it.y2 - it.y1) };
        else if (BOX[it.t] || it.t === 'text') b = lbounds(it);
        else {
            const v = it.t === 'circle' ? [[it.x1 - Math.hypot(it.x2 - it.x1, it.y2 - it.y1), it.y1 - Math.hypot(it.x2 - it.x1, it.y2 - it.y1)],
                [it.x1 + Math.hypot(it.x2 - it.x1, it.y2 - it.y1), it.y1 + Math.hypot(it.x2 - it.x1, it.y2 - it.y1)]] : getV(it);
            let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
            for (const [x, y] of v) { x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, y); y2 = Math.max(y2, y); }
            b = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
        }
        return { cx: b.x + b.w / 2, cy: b.y + b.h / 2, w: b.w, h: b.h, rot: ROT[it.t] ? it.rot || 0 : 0 };
    }
    // Вершины объекта: [[x, y], …] и их изменение (на копии)
    function getV(it) {
        if (it.t === 'point') return [[it.x, it.y]];
        if ('x1' in it && !it.p) return [[it.x1, it.y1], [it.x2, it.y2]];
        if (it.p) { const v = []; for (let i = 0; i < it.p.length; i += 2) v.push([it.p[i], it.p[i + 1]]); return v; }
        return [];
    }
    function setV(n, i, x, y) {
        if (n.t === 'point') { n.x = x; n.y = y; }
        else if (n.p) { n.p[2 * i] = x; n.p[2 * i + 1] = y; }
        else if (i === 0) {
            if (n.t === 'circle') { n.x2 += x - n.x1; n.y2 += y - n.y1; }   // центр тянет окружность целиком
            n.x1 = x; n.y1 = y;
        } else { n.x2 = x; n.y2 = y; }
    }
    // все координаты объекта через f(x, y) → {x, y}
    function mapPts(it, f) {
        const n = clone(it);
        if (n.p) for (let i = 0; i < n.p.length; i += 2) { const q = f(n.p[i], n.p[i + 1]); n.p[i] = q.x; n.p[i + 1] = q.y; }
        else if ('x1' in n) { const a = f(n.x1, n.y1), b = f(n.x2, n.y2); n.x1 = a.x; n.y1 = a.y; n.x2 = b.x; n.y2 = b.y; }
        else {
            const q = f(n.x, n.y);
            if ('cx' in n) { n.cx += q.x - n.x; n.cy += q.y - n.y; }   // 3D-тело: центр проекции
            n.x = q.x; n.y = q.y;
        }
        return n;
    }
    const moved = (it, dx, dy) => mapPts(it, (x, y) => ({ x: x + dx, y: y + dy }));

    // ---------- ручки выделения (экранные координаты)
    const HANDLE = 9;
    const toScreen = (x, y) => ({ x: (x - view.x) * view.k, y: (y - view.y) * view.k });
    const selItems = () => sel.map(byId).filter(Boolean);
    const selOne = () => (sel.length === 1 ? byId(sel[0]) : null);
    const EDITABLE = { plot: 1, tex: 1, text: 1, point: 1, line: 1, arrow: 1, circle: 1, angle: 1, poly: 1, vec: 1 };
    function groupFrame(its) {
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        for (const it of its) { const b = bounds(it); x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.w); y2 = Math.max(y2, b.y + b.h); }
        return { cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, w: x2 - x1, h: y2 - y1, rot: 0 };
    }
    function handles() {
        if (tool !== 'select' || !sel.length) return [];
        const its = selItems();
        if (!its.length) return [];
        const one = its.length === 1 ? its[0] : null;
        const f = one ? frameOf(one) : groupFrame(its);
        const P = (dx, dy) => { const w = rotPt(f.cx + dx * f.w / 2, f.cy + dy * f.h / 2, f.cx, f.cy, f.rot); return toScreen(w.x, w.y); };
        const up = { x: Math.sin(f.rot), y: -Math.cos(f.rot) }, rt = { x: Math.cos(f.rot), y: Math.sin(f.rot) };
        const out = [];
        const ne = P(1, -1), nn = P(0, -1);
        out.push({ id: 'del', x: ne.x + (up.x + rt.x) * 18, y: ne.y + (up.y + rt.y) * 18 });
        if (!one || one.t === 'point') return out;
        out.push({ id: 'rot', x: nn.x + up.x * 28, y: nn.y + up.y * 28 });
        if (one.t === 'solid') { const ss = P(0, 1); out.push({ id: 'r3', x: ss.x - up.x * 30, y: ss.y - up.y * 30 }); }
        if (GEO[one.t]) getV(one).forEach(([x, y], i) => { const s = toScreen(x, y); out.push({ id: 'v' + i, x: s.x, y: s.y }); });
        if (one.t === 'line' || one.t === 'arrow' || one.t === 'angle' || one.t === 'circle') return out;
        const bigW = f.w * view.k > 34, bigH = f.h * view.k > 34;
        for (const [id, dx, dy] of [['nw', -1, -1], ['ne', 1, -1], ['se', 1, 1], ['sw', -1, 1]]) {
            if (f.w * view.k < 2 || f.h * view.k < 2) break;
            const s = P(dx, dy); out.push({ id, x: s.x, y: s.y });
        }
        if (bigH) for (const [id, dx] of [['e', 1], ['w', -1]]) { const s = P(dx, 0); out.push({ id, x: s.x, y: s.y }); }
        if (bigW) for (const [id, dy] of [['n', -1], ['s', 1]]) { const s = P(0, dy); out.push({ id, x: s.x, y: s.y }); }
        return out;
    }
    function handleAt(sx, sy) {
        const hs = handles();
        // кнопки и вершины важнее ручек рамки
        const order = (h) => (h.id === 'del' || h.id === 'edit' ? 0 : h.id === 'rot' || h.id === 'r3' ? 1 : h.id[0] === 'v' ? 2 : 3);
        hs.sort((a, b) => order(a) - order(b));
        const h = hs.find((q) => Math.hypot(q.x - sx, q.y - sy) < HANDLE + (q.id === 'del' || q.id === 'edit' ? 4 : 3));
        return h ? h.id : null;
    }
    function drawSelection() {
        if (tool !== 'select') return;
        const acc = css('--accent') || '#f2a25c';
        ctx.save();
        if (drag && drag.mode === 'marquee') {
            const a = toScreen(Math.min(drag.x0, drag.x1), Math.min(drag.y0, drag.y1));
            const w = Math.abs(drag.x1 - drag.x0) * view.k, h = Math.abs(drag.y1 - drag.y0) * view.k;
            ctx.fillStyle = acc; ctx.globalAlpha = .1; ctx.fillRect(a.x, a.y, w, h);
            ctx.globalAlpha = 1; ctx.strokeStyle = acc; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.strokeRect(a.x + .5, a.y + .5, w, h);
            ctx.setLineDash([]);
        }
        const its = selItems();
        if (!its.length) { ctx.restore(); return; }
        ctx.strokeStyle = acc; ctx.lineWidth = 1.5;
        const box = (f, dash) => {
            const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dx, dy]) => {
                const w = rotPt(f.cx + dx * (f.w / 2 + 4 / view.k), f.cy + dy * (f.h / 2 + 4 / view.k), f.cx, f.cy, f.rot);
                return toScreen(w.x, w.y);
            });
            ctx.setLineDash(dash ? [5, 4] : []);
            ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.stroke();
            ctx.setLineDash([]);
        };
        if (its.length > 1) { ctx.globalAlpha = .55; its.forEach((it) => box(frameOf(it), true)); ctx.globalAlpha = 1; box(groupFrame(its), true); }
        else if (!(GEO[its[0].t] && its[0].t !== 'poly')) box(frameOf(its[0]), true);
        for (const h of handles()) {
            ctx.beginPath();
            if (h.id === 'del' || h.id === 'edit') {
                ctx.fillStyle = h.id === 'del' ? '#e5484d' : acc;
                ctx.arc(h.x, h.y, 10, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
                if (h.id === 'del') { ctx.moveTo(h.x - 4, h.y - 4); ctx.lineTo(h.x + 4, h.y + 4); ctx.moveTo(h.x + 4, h.y - 4); ctx.lineTo(h.x - 4, h.y + 4); }
                else { ctx.moveTo(h.x - 4, h.y + 4); ctx.lineTo(h.x + 4, h.y - 4); ctx.moveTo(h.x - 5, h.y + 5); ctx.lineTo(h.x - 3.5, h.y + 5); }
                ctx.stroke(); ctx.strokeStyle = acc; ctx.lineWidth = 1.5;
            } else if (h.id === 'r3') {
                // 3D-поворот: шар с орбитой
                ctx.fillStyle = acc; ctx.arc(h.x, h.y, 10, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.ellipse(h.x, h.y, 6.5, 2.6, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.ellipse(h.x, h.y, 2.6, 6.5, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = acc; ctx.lineWidth = 1.5;
            } else if (h.id === 'rot') {
                ctx.fillStyle = boardFill(); ctx.arc(h.x, h.y, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.beginPath(); ctx.arc(h.x, h.y, 3, -Math.PI * .1, Math.PI * 1.3); ctx.stroke();
            } else if (h.id[0] === 'v') {
                ctx.fillStyle = acc; ctx.arc(h.x, h.y, 6, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.strokeStyle = acc;
            } else {
                ctx.fillStyle = boardFill(); ctx.rect(h.x - 5, h.y - 5, 10, 10); ctx.fill(); ctx.stroke();
            }
        }
        ctx.restore();
    }

    function render() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // непрозрачная заливка нужна «контрастному» цвету: разность считается с тем, что уже на холсте
        ctx.fillStyle = boardFill();
        ctx.fillRect(0, 0, W, H);
        drawBg(ctx, W, H, view);
        ctx.setTransform(dpr * view.k, 0, 0, dpr * view.k, -view.x * view.k * dpr, -view.y * view.k * dpr);
        const extra = [];
        if (shared) for (const p of shared.peers.values()) if (p.draft && fresh(p)) extra.push(p.draft);
        if (cur && cur.t !== 'erase') extra.push(cur);
        if (geo) extra.push(geo);
        drawList(ctx, items.concat(extra));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawSolveBtns();
        drawSelection();
        drawSnapHint();
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
    const BOX = { img: 1, tex: 1, plot: 1, vec: 1, solid: 1 };

    // Притягивание к вершинам: точки, концы отрезков, вершины многоугольников, центры окружностей.
    // Привязка (Alt — без привязки), по убыванию важности:
    //  1) точки и вершины (точное совпадение — потом они склеены), 2) середины отрезков и сторон,
    //  3) узлы клетки, 4) точка на отрезке/стороне/окружности. Найденная точка подсвечивается.
    let snapHint = null, snapAlt = false;
    function snap(w, except) {
        snapHint = null;
        if (snapAlt) return w;
        const r = 11 / view.k;
        let best = null, bd = r, kind = '';
        const tryPt = (x, y, k, rr) => { const d = Math.hypot(x - w.x, y - w.y); if (d < (rr || bd) && d < bd + 1e-9) { bd = d; best = { x, y }; kind = k; } };
        const segs = [];
        for (const it of items) {
            if (except && except.has(it.id)) continue;
            if (it.t === 'point') tryPt(it.x, it.y, 'v');
            else if (it.t === 'line' || it.t === 'arrow') { tryPt(it.x1, it.y1, 'v'); tryPt(it.x2, it.y2, 'v'); segs.push([it.x1, it.y1, it.x2, it.y2]); }
            else if (it.t === 'circle') tryPt(it.x1, it.y1, 'v');
            else if (it.t === 'poly' || it.t === 'angle') {
                for (let i = 0; i < it.p.length; i += 2) tryPt(it.p[i], it.p[i + 1], 'v');
                if (it.t === 'poly') { const n = it.p.length / 2; for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (j || it.cl) segs.push([it.p[2 * i], it.p[2 * i + 1], it.p[2 * j], it.p[2 * j + 1]]); } }
            }
        }
        if (geo) for (let i = 0; i < geo.p.length; i += 2) tryPt(geo.p[i], geo.p[i + 1], 'v');
        if (!best) for (const [a, b, c, d] of segs) tryPt((a + c) / 2, (b + d) / 2, 'm');
        if (!best && bg !== 'none') {
            const st = 25, gx = Math.round(w.x / st) * st, gy = Math.round(w.y / st) * st;
            if (bg === 'lines') { if (Math.abs(gy - w.y) < r * .6) { best = { x: w.x, y: gy }; kind = 'g'; } }
            else tryPt(gx, gy, 'g', r * .6);
        }
        if (!best) for (const [a, b, c, d] of segs) {
            const dx = c - a, dy = d - b, l = dx * dx + dy * dy; if (!l) continue;
            const t = Math.max(0, Math.min(1, ((w.x - a) * dx + (w.y - b) * dy) / l));
            tryPt(a + t * dx, b + t * dy, 'o', r * .7);
        }
        if (best) snapHint = { x: best.x, y: best.y, kind };
        return best || w;
    }
    function drawSnapHint() {
        if (!snapHint || !(cur || drag || geo)) return;
        const s = toScreen(snapHint.x, snapHint.y), acc = css('--accent') || '#f2a25c';
        ctx.save(); ctx.strokeStyle = acc; ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (snapHint.kind === 'g') { ctx.moveTo(s.x - 6, s.y); ctx.lineTo(s.x + 6, s.y); ctx.moveTo(s.x, s.y - 6); ctx.lineTo(s.x, s.y + 6); }
        else if (snapHint.kind === 'm') { ctx.moveTo(s.x, s.y - 7); ctx.lineTo(s.x + 7, s.y + 5); ctx.lineTo(s.x - 7, s.y + 5); ctx.closePath(); }
        else ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
        ctx.stroke(); ctx.restore();
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
    // все отрезки доски (отрезки, стрелки, стороны многоугольников) как [x1, y1, x2, y2]
    function allEdges() {
        const E = [];
        for (const it of items) {
            if (it.t === 'line' || it.t === 'arrow') E.push([it.x1, it.y1, it.x2, it.y2]);
            else if (it.t === 'poly') {
                const n = it.p.length / 2;
                for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (j || it.cl) E.push([it.p[2 * i], it.p[2 * i + 1], it.p[2 * j], it.p[2 * j + 1]]); }
            }
        }
        return E;
    }
    // угол, образованный готовыми сторонами, в который попал щелчок → [Ax, Ay, Vx, Vy, Bx, By] или null
    function sideAngleAt(w) {
        const E = allEdges(), R = 60 / view.k, eq = (a, b, c, d) => Math.abs(a - c) < 1e-6 && Math.abs(b - d) < 1e-6;
        const verts = new Map();
        const addV = (vx, vy, ox, oy) => {
            const key = vx.toFixed(4) + ',' + vy.toFixed(4);
            if (!verts.has(key)) verts.set(key, { x: vx, y: vy, dirs: [] });
            const v = verts.get(key);
            if (!v.dirs.some((d) => eq(d.x, d.y, ox, oy))) v.dirs.push({ x: ox, y: oy, a: Math.atan2(oy - vy, ox - vx) });
        };
        for (const [x1, y1, x2, y2] of E) { addV(x1, y1, x2, y2); addV(x2, y2, x1, y1); }
        let best = null, bd = R;
        for (const v of verts.values()) {
            const d = Math.hypot(w.x - v.x, w.y - v.y);
            if (v.dirs.length < 2 || d > bd) continue;
            const ds = v.dirs.slice().sort((a, b) => a.a - b.a), ac = Math.atan2(w.y - v.y, w.x - v.x);
            let pick = null;
            for (let i = 0; i < ds.length; i++) {
                const a = ds[i], b = ds[(i + 1) % ds.length];
                let span = b.a - a.a; if (span <= 0) span += 2 * Math.PI;
                let rel = ac - a.a; while (rel < 0) rel += 2 * Math.PI;
                if (rel <= span && span < Math.PI - 1e-6) { pick = [a, b]; break; }
            }
            if (!pick && d < 8 / view.k) {
                // щелчок прямо в вершину — меньший из углов
                let mn = Infinity;
                for (let i = 0; i < ds.length; i++) { const a = ds[i], b = ds[(i + 1) % ds.length]; let span = b.a - a.a; if (span <= 0) span += 2 * Math.PI; if (span < mn && span < Math.PI) { mn = span; pick = [a, b]; } }
            }
            if (pick) { bd = d; best = [pick[0].x, pick[0].y, v.x, v.y, pick[1].x, pick[1].y]; }
        }
        return best;
    }
    // отметки равенства: щелчок по отрезку / стороне / дуге угла — 1 → 2 → 3 засечки → нет;
    // щелчок внутри угла без дуги — появляется дуга-отметка
    function markAt(w) {
        const r = 8 / view.k, bump = (m) => ((m || 0) + 1) % 4;
        const ang = [...items].reverse().find((it) => it.t === 'angle' && hit(it, w.x, w.y, r) && Math.hypot(w.x - it.p[2], w.y - it.p[3]) < 70 / view.k);
        if (ang) {
            const n = clone(ang); n.mk = Math.max(1, ((ang.mk || 1) % 3) + 1);
            commit({ mod: [[clone(ang), n]] }); selectMade([n]); return;
        }
        const ln = [...items].reverse().find((it) => (it.t === 'line' || it.t === 'arrow') && hit(it, w.x, w.y, r));
        if (ln) { const n = clone(ln); n.mk = bump(ln.mk); if (!n.mk) delete n.mk; commit({ mod: [[clone(ln), n]] }); selectMade([n]); return; }
        for (const it of [...items].reverse()) {
            if (it.t !== 'poly') continue;
            const n = it.p.length / 2;
            for (let i = 0; i < n; i++) {
                const j = (i + 1) % n;
                if (!j && !it.cl) continue;
                if (distSeg(w.x, w.y, it.p[2 * i], it.p[2 * i + 1], it.p[2 * j], it.p[2 * j + 1]) < r + it.w / 2) {
                    const m = clone(it); m.mk = Array.from({ length: n }, (_, k) => (it.mk || [])[k] || 0); m.mk[i] = bump(m.mk[i]);
                    if (!m.mk.some(Boolean)) delete m.mk;
                    commit({ mod: [[clone(it), m]] }); selectMade([m]); return;
                }
            }
        }
        const sa = sideAngleAt(w);
        if (sa) { const it = { id: rid(12), z: newZ(), t: 'angle', arc: 1, nl: 1, mk: 1, c: color, w: Math.max(1, size * .6), p: sa }; if (commit({ add: [it] }) !== false) selectMade([it]); return; }
        toast('Щёлкните по отрезку, стороне или внутри угла');
    }
    // продление: щелчок у конца отрезка — луч за этот конец, посередине — прямая (повторно — убрать)
    function extendAt(w) {
        const ln = [...items].reverse().find((it) => it.t === 'line' && hit(it, w.x, w.y, 10 / view.k));
        if (!ln) { toast('Щёлкните по отрезку: у конца — луч, посередине — прямая'); return; }
        const dx = ln.x2 - ln.x1, dy = ln.y2 - ln.y1, t = ((w.x - ln.x1) * dx + (w.y - ln.y1) * dy) / (dx * dx + dy * dy || 1);
        const n = clone(ln);
        if (t < .3) n.ex1 = !ln.ex1; else if (t > .7) n.ex2 = !ln.ex2; else { const both = ln.ex1 && ln.ex2; n.ex1 = n.ex2 = !both; }
        if (!n.ex1) delete n.ex1; if (!n.ex2) delete n.ex2;
        commit({ mod: [[clone(ln), n]] }); selectMade([n]);
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
            const it = Object.assign({ id: rid(12), z: newZ(), t: g.t, c: g.c, w: g.w, p: g.p }, styleFor(g.t));
            if (close) it.cl = true;
            if (commit({ add: [it] }) !== false) { cur = null; selectMade([it]); }
        }
        render();
    }
    // Специальные инструменты (фигуры, окружность, эллипс, многоугольник, угол, отметки, продление)
    // после создания переключают на «Выбор» и выделяют созданное; отрезки, стрелки, точки,
    // перо и текст — остаются в своём инструменте.
    const SPECIAL = { circle: 1, ellipse: 1, rect: 1, poly: 1, angle: 1 };
    function selectMade(list) { setTool('select'); sel = list.map((x) => x.id); render(); }
    function drawAngle(c, it) {
        const p = it.p;
        // arc — угол на уже нарисованных сторонах: только дуга (стороны не дублируем)
        if (!it.arc) {
            c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[2], p[3]);
            if (p.length >= 6) c.lineTo(p[4], p[5]); else if (it.hx !== undefined) c.lineTo(it.hx, it.hy);
            c.stroke();
        }
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
            // отметка равных углов — несколько дуг
            for (let k = 0; k < Math.max(1, it.mk || 1); k++) { c.beginPath(); c.arc(p[2], p[3], R + k * 5, a1, a2, d < 0); c.stroke(); }
        }
        if (it.nl) return;                                   // угол-отметка без градусов
        const am = a1 + d / 2;
        c.font = textFont(12 + it.w * 1.5);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(it.label || (Math.round(deg * 10) / 10).toString().replace('.', ',') + '°', p[2] + Math.cos(am) * (R + 18), p[3] + Math.sin(am) * (R + 14));
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

    // ---- текст с формулами: всё между $…$ — формула (MathJax), остальное — обычный текст
    const texInfo = new Map();
    function texDims(latex) {
        if (!window.MathJax || !MathJax.tex2svg) return null;
        let d = texInfo.get(latex);
        if (!d) {
            try {
                const node = MathJax.tex2svg('\\displaystyle ' + texFix(latex), { display: false });
                const svg = node.querySelector('svg');
                const va = /vertical-align:\s*(-?[\d.]+)ex/.exec(svg.getAttribute('style') || '');
                d = { svg: svg.outerHTML, wEx: parseFloat(svg.getAttribute('width')) || 1, hEx: parseFloat(svg.getAttribute('height')) || 1, dEx: va ? -parseFloat(va[1]) : 0 };
            } catch (e) { d = null; }
            texInfo.set(latex, d);
        }
        return d;
    }
    const inlineCache = new Map();
    function inlineImage(latex, col) {
        const key = col + '|' + latex;
        let im = inlineCache.get(key);
        if (im) return im;
        const d = texDims(latex);
        if (!d) return null;
        im = new Image();
        im.onload = () => render();
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(d.svg.replace(/currentColor/g, col));
        inlineCache.set(key, im);
        return im;
    }
    const hasMath = (t) => /\$[^$]+\$/.test(t);
    const layoutCache = new Map();
    function layoutText(it) {
        const ready = !!(window.MathJax && MathJax.tex2svg);
        const key = it.s + '|' + ready + '|' + it.text;
        let L = layoutCache.get(key);
        if (L) return L;
        if (!ready && hasMath(it.text)) loadMathJax().then(() => { layoutCache.clear(); render(); }, () => {});
        const s = it.s, ex = s * .45;
        ctx.save(); ctx.font = textFont(s);
        const lines = String(it.text).split('\n').map((ln) => {
            const segs = [];
            let last = 0, m;
            const re = /\$([^$]+)\$/g;
            while ((m = re.exec(ln))) {
                if (m.index > last) segs.push({ t: 's', v: ln.slice(last, m.index) });
                const d = texDims(m[1]);
                if (d) segs.push({ t: 'm', v: m[1], w: d.wEx * ex, h: d.hEx * ex, d: d.dEx * ex });
                else segs.push({ t: 's', v: m[0] });
                last = m.index + m[0].length;
            }
            if (last < ln.length || !segs.length) segs.push({ t: 's', v: ln.slice(last) });
            let w = 0, asc = s * .8, desc = s * .25;
            for (const g of segs) {
                if (g.t === 's') g.w = ctx.measureText(g.v).width;
                else { asc = Math.max(asc, g.h - g.d); desc = Math.max(desc, g.d); }
                w += g.w;
            }
            return { segs, w, asc, h: asc + desc + s * .2 };
        });
        ctx.restore();
        L = { lines, w: Math.max(4, ...lines.map((l) => l.w)), h: lines.reduce((a, l) => a + l.h, 0) };
        if (layoutCache.size > 500) layoutCache.clear();
        layoutCache.set(key, L);
        return L;
    }
    function drawText(c, it) {
        const L = layoutText(it), col = paint(it.c);
        c.font = textFont(it.s); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
        let y = it.y;
        for (const ln of L.lines) {
            let x = it.x;
            const base = y + ln.asc + it.s * .1;
            for (const g of ln.segs) {
                if (g.t === 's') c.fillText(g.v, x, base);
                else {
                    const im = inlineImage(g.v, col);
                    if (im && im.complete && im.naturalWidth) c.drawImage(im, x, base - (g.h - g.d), g.w, g.h);
                }
                x += g.w;
            }
            y += ln.h;
        }
    }

    // ---- 3D-тела: настоящая модель (вершины, грани), поворот в пространстве (yaw — вокруг
    // вертикали, pitch — наклон), ортогональная проекция. Невидимые рёбра — пунктиром,
    // у круглых тел рисуется только контур и края оснований. Поля объекта:
    //   kind, sx/sy/sz — полуразмеры, yaw/pitch, cx/cy — проекция центра тела,
    //   x/y/w/h — рамка проекции (пересчитывается), lb — подписи вершин, lw — толщина.
    const SUB1 = '₁';
    const SOLID_DIM = { cube: [1, 1, 1], box: [1.5, .8, .8], pyr: [1, 1.15, 1], tpyr: [1, 1.15, 1], prism: [1, 1.1, 1], cyl: [.85, 1.1, .85], cone: [.9, 1.15, .9], sph: [1, 1, 1] };
    const solidModels = {};
    function solidModel(kind) {
        if (solidModels[kind]) return solidModels[kind];
        const v = [], f = [], inner = [];
        let lb = [];
        const ring = (y, n, g0) => { const s = v.length; for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n; v.push([Math.cos(a), y, Math.sin(a)]); } return s; };
        if (kind === 'cube' || kind === 'box' || kind === 'pyr') {
            v.push([-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]);
            f.push({ i: [0, 1, 2, 3], g: 'b' });
            if (kind === 'pyr') {
                v.push([0, 1, 0]);
                [[0, 1], [1, 2], [2, 3], [3, 0]].forEach(([a, b], k) => f.push({ i: [a, b, 4], g: 's' + k }));
                lb = ['A', 'B', 'C', 'D', 'S'];
            } else {
                v.push([-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]);
                f.push({ i: [4, 5, 6, 7], g: 't' });
                [[0, 1], [1, 2], [2, 3], [3, 0]].forEach(([a, b], k) => f.push({ i: [a, b, b + 4, a + 4], g: 's' + k }));
                lb = ['A', 'B', 'C', 'D', 'A' + SUB1, 'B' + SUB1, 'C' + SUB1, 'D' + SUB1];
            }
        } else if (kind === 'tpyr' || kind === 'prism') {
            const base = [[-1, -1, .7], [1, -1, .7], [0, -1, -1]];
            v.push(...base);
            f.push({ i: [0, 1, 2], g: 'b' });
            if (kind === 'tpyr') {
                v.push([0, 1, .1]);
                [[0, 1], [1, 2], [2, 0]].forEach(([a, b], k) => f.push({ i: [a, b, 3], g: 's' + k }));
                lb = ['A', 'B', 'C', 'S'];
            } else {
                v.push(...base.map(([x, , z]) => [x, 1, z]));
                f.push({ i: [3, 4, 5], g: 't' });
                [[0, 1], [1, 2], [2, 0]].forEach(([a, b], k) => f.push({ i: [a, b, b + 3, a + 3], g: 's' + k }));
                lb = ['A', 'B', 'C', 'A' + SUB1, 'B' + SUB1, 'C' + SUB1];
            }
        } else if (kind === 'cyl' || kind === 'cone') {
            const N = 48, b = ring(-1, N);
            f.push({ i: Array.from({ length: N }, (_, i) => b + i), g: 'b' });
            if (kind === 'cyl') {
                const t = ring(1, N);
                f.push({ i: Array.from({ length: N }, (_, i) => t + i), g: 't' });
                for (let i = 0; i < N; i++) f.push({ i: [b + i, b + (i + 1) % N, t + (i + 1) % N, t + i], g: 'side', sm: 1 });
                v.push([0, -1, 0], [0, 1, 0]);
                inner.push([2 * N, 2 * N + 1], [2 * N, b]);
                lb = []; lb[2 * N] = 'O'; lb[2 * N + 1] = 'O' + SUB1;
            } else {
                v.push([0, 1, 0]);
                for (let i = 0; i < N; i++) f.push({ i: [b + i, b + (i + 1) % N, N], g: 'side', sm: 1 });
                v.push([0, -1, 0]);
                inner.push([N + 1, N], [N + 1, b]);
                lb = []; lb[N] = 'S'; lb[N + 1] = 'O';
            }
        } else if (kind === 'sph') {
            const NU = 48, NV = 24, idx = (i, j) => 1 + (j - 1) * NU + (i % NU);
            v.push([0, 1, 0]);
            for (let j = 1; j < NV; j++) { const th = Math.PI * j / NV; for (let i = 0; i < NU; i++) { const a = 2 * Math.PI * i / NU; v.push([Math.sin(th) * Math.cos(a), Math.cos(th), Math.sin(th) * Math.sin(a)]); } }
            v.push([0, -1, 0]);
            const S = v.length - 1;
            for (let i = 0; i < NU; i++) {
                f.push({ i: [0, idx(i + 1, 1), idx(i, 1)], g: 'n', sm: 1 });
                f.push({ i: [S, idx(i, NV - 1), idx(i + 1, NV - 1)], g: 's', sm: 1 });
                for (let j = 1; j < NV - 1; j++) f.push({ i: [idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)], g: j < NV / 2 ? 'n' : 's', sm: 1 });
            }
            v.push([0, 0, 0]);
            inner.push([v.length - 1, idx(0, NV / 2)]);
            lb = []; lb[v.length - 1] = 'O';
        }
        // рёбра: пара вершин → грани; «жёсткое» ребро — между разными группами граней
        const E = new Map();
        f.forEach((fc, k) => fc.i.forEach((a, j) => {
            const b = fc.i[(j + 1) % fc.i.length], key = a < b ? a + ',' + b : b + ',' + a;
            if (!E.has(key)) E.set(key, { a, b, f: [] });
            E.get(key).f.push(k);
        }));
        const edges = [...E.values()].map((e) => Object.assign(e, { hard: e.f.length < 2 || f[e.f[0]].g !== f[e.f[1]].g || !f[e.f[0]].sm }));
        return (solidModels[kind] = { v, f, edges, inner, lb });
    }
    function solidProj(it) {
        const m = solidModel(it.kind), cy = Math.cos(it.yaw), sy = Math.sin(it.yaw), cp = Math.cos(it.pitch), sp = Math.sin(it.pitch);
        const P = m.v.map(([x, y, z]) => {
            x *= it.sx; y *= it.sy; z *= it.sz;
            const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
            const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
            return [x1, y2, z2];
        });
        const front = m.f.map((fc) => {
            // нормаль (Ньюэлл) наружу: смотрим, что она направлена от центра тела
            let nx = 0, ny = 0, nz = 0, gx = 0, gy = 0, gz = 0;
            const n = fc.i.length;
            for (let j = 0; j < n; j++) {
                const a = P[fc.i[j]], b = P[fc.i[(j + 1) % n]];
                nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
                gx += a[0]; gy += a[1]; gz += a[2];
            }
            if (nx * gx + ny * gy + nz * gz < 0) nz = -nz;
            return nz > 1e-9;
        });
        return { m, P, front };
    }
    // рамка проекции; центр тела (cx, cy) не меняется
    function solidFit(it) {
        const { P } = solidProj(it);
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        for (const [x, y] of P) { x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, -y); y2 = Math.max(y2, -y); }
        it.x = it.cx + x1; it.y = it.cy + y1; it.w = Math.max(4, x2 - x1); it.h = Math.max(4, y2 - y1);
        return it;
    }
    function makeSolid(kind, x, y, w, h, o) {
        const d = SOLID_DIM[kind] || [1, 1, 1];
        const it = { t: 'solid', kind, c: o.c, lw: 2 + o.w * .25, sx: d[0], sy: d[1], sz: d[2], yaw: -.55, pitch: .38, cx: 0, cy: 0, lb: solidModel(kind).lb.slice() };
        solidFit(it);
        const kx = w / it.w, ky = h / it.h;
        it.sx *= kx; it.sz *= kx; it.sy *= ky;
        it.cx = x + w / 2; it.cy = y + h / 2;
        solidFit(it);
        // выравниваем рамку по центру растянутой области
        it.cx += x + w / 2 - (it.x + it.w / 2); it.cy += y + h / 2 - (it.y + it.h / 2);
        return solidFit(it);
    }
    function drawSolid(c, it) {
        const { m, P, front } = solidProj(it);
        const X = (i) => it.cx + P[i][0], Y = (i) => it.cy - P[i][1];
        c.lineWidth = it.lw || 2.5;
        const vis = new Path2D(), hid = new Path2D();
        for (const e of m.edges) {
            const fr = e.f.map((k) => front[k]);
            const anyF = fr.some(Boolean);
            if (!e.hard) { if (fr.length === 2 && fr[0] !== fr[1]) { vis.moveTo(X(e.a), Y(e.a)); vis.lineTo(X(e.b), Y(e.b)); } continue; }
            const p = anyF ? vis : hid;
            p.moveTo(X(e.a), Y(e.a)); p.lineTo(X(e.b), Y(e.b));
        }
        for (const [a, b] of m.inner) { hid.moveTo(X(a), Y(a)); hid.lineTo(X(b), Y(b)); }
        c.stroke(vis);
        c.save(); c.setLineDash([7, 6]); c.lineWidth = Math.max(1, (it.lw || 2.5) * .8); c.stroke(hid); c.restore();
        // вершины многогранника — точки
        if (!/^(cyl|cone|sph)$/.test(it.kind)) {
            const used = new Set(); m.f.forEach((fc) => fc.i.forEach((i) => used.add(i)));
            const rr = 2 + (it.lw || 2.5) * .5;
            c.beginPath(); used.forEach((i) => { c.moveTo(X(i) + rr, Y(i)); c.arc(X(i), Y(i), rr, 0, Math.PI * 2); }); c.fill();
        }
        // подписи вершин — наружу от центра проекции, всегда ровные
        const lb = it.lb || [];
        c.save();
        if (it.rot) { c.translate(0, 0); }
        c.font = 'italic ' + textFont(15 + (it.lw || 2) * .8); c.textAlign = 'center'; c.textBaseline = 'middle';
        lb.forEach((t, i) => {
            if (!t || !P[i]) return;
            const x = X(i), y = Y(i), dx = x - it.cx, dy = y - it.cy, d = Math.hypot(dx, dy);
            if (d < 1) { c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fill(); }
            const q = d < 1 ? { x: x - 12, y: y + 12 } : { x: x + dx / d * 14, y: y + dy / d * 14 };
            if (m.f.every((fc) => !fc.i.includes(i)) && d >= 1) { c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fill(); }
            c.save(); c.translate(q.x, q.y); c.rotate(-(it.rot || 0)); c.fillText(t, 0, 0); c.restore();
        });
        c.restore();
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
        // подписи — всегда ровные и без искажений, как бы тело ни растянули и ни повернули
        for (const l of it.labels || []) {
            c.save();
            c.translate(l.x, l.y); c.scale(1 / sx, 1 / sy); c.rotate(-(it.rot || 0));
            c.font = (l.i === false ? '' : 'italic ') + textFont((l.s || 16) * Math.min(1.6, Math.max(.8, s)));
            c.fillText(l.t, 0, 0);
            c.restore();
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
    const SHAPE_DEFS = [
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

    // ---- фигуры-инструменты: выбираются в меню «Фигуры» и рисуются мышкой (рамкой) на холсте.
    // Многоугольники становятся обычными многоугольниками (вершины потом можно тянуть),
    // тела и окружности-шаблоны — векторными объектами (растягиваются, поворачиваются).
    const regV = (n, a0) => { const v = []; for (let i = 0; i < n; i++) { const a = a0 + 2 * Math.PI * i / n; v.push(.5 + .5 * Math.cos(a), .5 + .5 * Math.sin(a)); } return v; };
    const POLY_SH = [
        { id: 'ptri', name: 'Треугольник', v: [0, 1, 1, 1, .35, 0], lb: 'ABC' },
        { id: 'pisos', name: 'Равнобедренный треугольник', v: [0, 1, 1, 1, .5, 0], lb: 'ABC' },
        { id: 'prtri', name: 'Прямоугольный треугольник', v: [0, 1, 1, 1, 0, 0], lb: 'CBA' },
        { id: 'psq', name: 'Квадрат', v: [0, 1, 1, 1, 1, 0, 0, 0], lb: 'ABCD', sq: 1 },
        { id: 'prect', name: 'Прямоугольник', v: [0, 1, 1, 1, 1, 0, 0, 0], lb: 'ABCD' },
        { id: 'ppar', name: 'Параллелограмм', v: [0, 1, .75, 1, 1, 0, .25, 0], lb: 'ABCD' },
        { id: 'prhomb', name: 'Ромб', v: [0, .5, .5, 1, 1, .5, .5, 0], lb: 'ABCD' },
        { id: 'ptrap', name: 'Трапеция', v: [0, 1, 1, 1, .75, 0, .25, 0], lb: 'ABCD' },
        { id: 'ppent', name: 'Правильный пятиугольник', v: regV(5, -Math.PI / 2), lb: 'ABCDE', sq: 1 },
        { id: 'phex', name: 'Правильный шестиугольник', v: regV(6, 0), lb: 'ABCDEF', sq: 1 },
    ];
    const SHAPES = POLY_SH.concat(SHAPE_DEFS.filter((s) => !['tri', 'rtri', 'sq', 'rect', 'par', 'rhomb', 'trap', 'hex', 'nline', 'ucirc', 'plane'].includes(s.id)));
    // инструменты построения, которые тоже живут в меню «Фигуры»
    const MENU_TOOLS = [['circle', 'Окружность: центр → радиус'], ['ellipse', 'Эллипс'], ['poly', 'Многоугольник по точкам'],
        ['angle', 'Угол: по трём точкам или щелчком внутри готового угла'], ['mark', 'Отметить равные стороны и углы'], ['extend', 'Продлить отрезок до луча или прямой']];
    const SHAPE_TOOLS = { shape: 1, circle: 1, ellipse: 1, poly: 1, angle: 1, rect: 1, mark: 1, extend: 1 };
    const IS_3D = { cube: 1, box: 1, pyr: 1, tpyr: 1, prism: 1, cyl: 1, cone: 1, sph: 1 };
    let shapeId = 'ptri';
    function draftBox(d) {
        let w = d.x2 - d.x1, h = d.y2 - d.y1;
        if (Math.abs(w) * view.k < 4 && Math.abs(h) * view.k < 4) return null;
        const sh = SHAPES.find((s) => s.id === d.sid) || {};
        if (sh.sq) { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
        return { x: Math.min(d.x1, d.x1 + w), y: Math.min(d.y1, d.y1 + h), w: Math.abs(w), h: Math.abs(h) };
    }
    // свободные буквы для новых точек (не занятые подписями точек на доске)
    function freeLabels(n) {
        const used = new Set(items.filter((i) => i.t === 'point').map((i) => i.label)), out = [];
        for (let k = 0; out.length < n; k++) {
            const l = String.fromCharCode(65 + (k % 26)) + (k >= 26 ? Math.floor(k / 26) : '');
            if (!used.has(l) && l !== 'O') out.push(l);
        }
        return out;
    }
    const R2 = (v) => Math.round(v * 100) / 100;
    // фигура из инструмента «Фигуры» → набор объектов: стороны + точки на вершинах
    // (вершины склеены с точками — тянешь точку, тянется фигура)
    function buildShapeItems(sid, x, y, w, h, o) {
        const sh = SHAPES.find((s) => s.id === sid) || SHAPES[0];
        const pw = Math.min(o.w, 4);
        const pt = (px, py, label) => ({ t: 'point', x: R2(px), y: R2(py), c: o.c, w: pw, label });
        if (sh.v) {
            const p = sh.v.map((u, i) => R2(i % 2 ? y + u * h : x + u * w)), L = freeLabels(p.length / 2);
            return [Object.assign({ t: 'poly', c: o.c, w: o.w, cl: true, p }, styleFor('poly'))].concat(L.map((l, i) => pt(p[2 * i], p[2 * i + 1], l)));
        }
        if (sid === 'circ') {
            const r = Math.min(w, h) / 2, cx = R2(x + w / 2), cy = R2(y + h / 2);
            return [Object.assign({ t: 'circle', c: o.c, w: o.w, nc: 1, x1: cx, y1: cy, x2: R2(cx + r), y2: cy }, styleFor('circle')),
                { t: 'line', c: o.c, w: Math.max(1, o.w * .7), x1: cx, y1: cy, x2: R2(cx + r), y2: cy, label: 'R' }, pt(cx, cy, 'O')];
        }
        if (sid === 'inscr') {
            const A = [x, y + h], B = [x + w, y + h], C = [x + w * .35, y];
            const a = Math.hypot(B[0] - C[0], B[1] - C[1]), b = Math.hypot(A[0] - C[0], A[1] - C[1]), c = Math.hypot(A[0] - B[0], A[1] - B[1]);
            const per = a + b + c, ix = R2((a * A[0] + b * B[0] + c * C[0]) / per), iy = R2((a * A[1] + b * B[1] + c * C[1]) / per), r = Math.abs(A[1] - iy);
            const p = [A, B, C].flat().map(R2), L = freeLabels(3);
            return [Object.assign({ t: 'poly', c: o.c, w: o.w, cl: true, p }, styleFor('poly')), { t: 'circle', c: o.c, w: o.w, nc: 1, x1: ix, y1: iy, x2: R2(ix + r), y2: iy }]
                .concat(L.map((l, i) => pt(p[2 * i], p[2 * i + 1], l)), [pt(ix, iy, 'O')]);
        }
        return [buildShape(sid, x, y, w, h, o)];
    }
    function buildShape(sid, x, y, w, h, o) {
        const sh = SHAPES.find((s) => s.id === sid) || SHAPES[0];
        if (sh.v) return buildShapeItems(sid, x, y, w, h, o)[0];
        if (IS_3D[sid]) return makeSolid(sid, x, y, Math.max(w, 8), Math.max(h, 8), o);
        const g = sh.g();
        return Object.assign({ t: 'vec', c: o.c, lw: 2 + o.w * .25, x, y, w: Math.max(w, 8), h: Math.max(h, 8) }, g);
    }

    // ---- заготовки: вставляются готовыми в центр экрана
    const PRESETS = SHAPE_DEFS.filter((s) => ['ucirc', 'nline', 'plane'].includes(s.id)).concat([
        { id: 'f-quad', name: 'Квадратное уравнение', text: '$ax^2+bx+c=0$\n$D=b^2-4ac$\n$x_{1,2}=\\dfrac{-b\\pm\\sqrt{D}}{2a}$' },
        { id: 'f-vieta', name: 'Теорема Виета', text: '$x_1+x_2=-\\dfrac{b}{a}$\n$x_1\\cdot x_2=\\dfrac{c}{a}$' },
        { id: 'f-mult', name: 'Формулы сокращённого умножения', text: '$(a+b)^2=a^2+2ab+b^2$\n$(a-b)^2=a^2-2ab+b^2$\n$a^2-b^2=(a-b)(a+b)$\n$a^3\\pm b^3=(a\\pm b)(a^2\\mp ab+b^2)$' },
        { id: 'f-pyth', name: 'Теорема Пифагора', text: '$c^2=a^2+b^2$' },
        { id: 'f-sin', name: 'Теорема синусов', text: '$\\dfrac{a}{\\sin\\alpha}=\\dfrac{b}{\\sin\\beta}=\\dfrac{c}{\\sin\\gamma}=2R$' },
        { id: 'f-cos', name: 'Теорема косинусов', text: '$c^2=a^2+b^2-2ab\\cos\\gamma$' },
        { id: 'f-trig', name: 'Тригонометрические тождества', text: '$\\sin^2\\alpha+\\cos^2\\alpha=1$\n$\\operatorname{tg}\\alpha=\\dfrac{\\sin\\alpha}{\\cos\\alpha}$\n$\\sin 2\\alpha=2\\sin\\alpha\\cos\\alpha$' },
        { id: 'f-area', name: 'Площади фигур', text: 'Треугольник: $S=\\dfrac{1}{2}ah$\nКруг: $S=\\pi r^2$\nТрапеция: $S=\\dfrac{a+b}{2}h$' },
        { id: 'f-vol', name: 'Объёмы тел', text: 'Призма: $V=S h$\nПирамида: $V=\\dfrac{1}{3}S h$\nШар: $V=\\dfrac{4}{3}\\pi R^3$' },
        { id: 'f-log', name: 'Свойства логарифмов', text: '$\\log_a(bc)=\\log_a b+\\log_a c$\n$\\log_a b^n=n\\log_a b$\n$\\log_a b=\\dfrac{\\log_c b}{\\log_c a}$' },
        { id: 'f-der', name: 'Таблица производных', text: '$(x^n)\'=nx^{n-1}$\n$(\\sin x)\'=\\cos x$\n$(e^x)\'=e^x$\n$(\\ln x)\'=\\dfrac{1}{x}$' },
    ]);
    // заготовки из точек и отрезков (всё потом правится как обычная геометрия)
    function presetItems(id, cx, cy, k) {
        const ink = color, P = (x, y, label) => ({ t: 'point', x: R2(x), y: R2(y), c: ink, w: 2, label });
        const T = (x, y, text) => ({ t: 'text', x: R2(x), y: R2(y), s: 18 * k, c: ink, w: 0, text });
        if (id === 'ucirc') {
            const R = 150 * k, e = 45 * k, out = [
                { t: 'arrow', c: ink, w: 2, x1: R2(cx - R - e), y1: cy, x2: R2(cx + R + e), y2: cy },
                { t: 'arrow', c: ink, w: 2, x1: cx, y1: R2(cy + R + e), x2: cx, y2: R2(cy - R - e) },
                { t: 'circle', c: ink, w: 2.5, nc: 1, x1: cx, y1: cy, x2: R2(cx + R), y2: cy },
                P(cx, cy, 'O'), T(cx + R + e - 4 * k, cy + 6 * k, 'x'), T(cx + 8 * k, cy - R - e - 4 * k, 'y')];
            const names = { 0: '0', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2', 120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π', 210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2', 300: '5π/3', 315: '7π/4', 330: '11π/6' };
            for (const a in names) { const r = a * Math.PI / 180; out.push(P(cx + R * Math.cos(r), cy - R * Math.sin(r), names[a])); }
            return out;
        }
        if (id === 'nline') {
            const st = 44 * k, out = [{ t: 'arrow', c: ink, w: 2, x1: R2(cx - 6 * st), y1: cy, x2: R2(cx + 6 * st), y2: cy }, T(cx + 6 * st - 6 * k, cy + 8 * k, 'x')];
            for (let i = -5; i <= 5; i++) out.push(P(cx + i * st, cy, String(i).replace('-', '−')));
            return out;
        }
        return null;
    }
    function insertPreset(pr) {
        const geoSet = presetItems(pr.id, 0, 0, 1);
        if (geoSet) {
            const c = toWorld(W / 2, H / 2), list = presetItems(pr.id, R2(c.x), R2(c.y), 1 / view.k).map((x, i) => Object.assign(x, { id: rid(12), z: newZ() + i * 1e-3 }));
            commit({ add: list });
            setTool('select'); sel = list.map((x) => x.id); render();
            return;
        }
        if (pr.text) {
            const c = toWorld(W / 2, H / 2), s = 22 / view.k;
            const it = { id: rid(12), z: newZ(), t: 'text', x: c.x, y: c.y, s, c: color, w: 0, text: pr.text };
            const L = layoutText(it);
            it.x -= L.w / 2; it.y -= L.h / 2;
            commit({ add: [it] });
            setTool('select'); sel = [it.id]; render();
            if (hasMath(pr.text)) loadMathJax().then(() => { layoutCache.clear(); render(); }, () => {});
            return;
        }
        insertShape(pr);
    }
    function shapeIcon(sh) {
        if (sh.v) {
            const pts = []; for (let i = 0; i < sh.v.length; i += 2) pts.push((4 + sh.v[i] * 32).toFixed(1) + ',' + (4 + sh.v[i + 1] * 32).toFixed(1));
            return `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><polygon points="${pts.join(' ')}"/></svg>`;
        }
        if (sh.text) return '<svg viewBox="0 0 40 40"><text x="20" y="27" text-anchor="middle" font-size="20" font-style="italic" fill="currentColor" font-family="serif">ƒ</text></svg>';
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
        setTool('select'); sel = [it.id]; render();
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
    // ================= ЛАСТИК / ПОПАДАНИЕ =================
    function distSeg(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
        let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - ax - t * dx, py - ay - t * dy);
    }
    // inside — считать попаданием и внутренность замкнутой фигуры (для выделения, не для ластика)
    function hit(it, x, y, r, inside) {
        if (it.rot && ROT[it.t]) { const f = frameOf(it), q = rotPt(x, y, f.cx, f.cy, -it.rot); x = q.x; y = q.y; }
        if (inside && it.t === 'poly' && it.cl && pointInPoly(it.p, x, y)) return true;
        if (inside && (it.t === 'rect' || it.t === 'ellipse' || it.t === 'circle')) {
            const b = lbounds(it);
            if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true;
        }
        if (it.t === 'pen' && it.pr) r += it.w * .3;
        const tol = r + (BOX[it.t] ? 0 : it.w / 2);
        if (it.t === 'point') return Math.hypot(x - it.x, y - it.y) < tol + 6;
        if (it.t === 'circle') return Math.abs(Math.hypot(x - it.x1, y - it.y1) - Math.hypot(it.x2 - it.x1, it.y2 - it.y1)) < tol;
        if (it.t === 'angle' && it.arc) return Math.hypot(x - it.p[2], y - it.p[3]) < 22 + it.w * 2 + 10 + (it.mk || 0) * 5 + r;
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
    function pointInPoly(p, x, y) {
        let ins = false;
        for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
            if ((p[i + 1] > y) !== (p[j + 1] > y) && x < (p[j] - p[i]) * (y - p[i + 1]) / (p[j + 1] - p[i + 1]) + p[i]) ins = !ins;
        }
        return ins;
    }
    // точки важнее остального: иначе их не ухватить из-под отрезка, проведённого через них
    const topHit = (x, y, r, inside) => {
        const hs = [...items].reverse().filter((it) => hit(it, x, y, r, inside));
        return hs.find((it) => it.t === 'point') || hs.find((it) => !inside || !(it.t === 'poly' && it.cl && !hit(it, x, y, r))) || hs[0];
    };
    function eraseAt(x, y) {
        const r = (size * 2 + 4) / view.k;
        // картинки ластиком не стираются — их удаляют крестиком при выделении или клавишей Del
        const gone = items.filter((it) => it.t !== 'img' && hit(it, x, y, r));
        if (!gone.length) return;
        cur.erased.push(...gone.map(clone));
        dropItems(gone.map((i) => i.id));
        render();
    }

    // ================= МЕНЮ «ФИГУРЫ», «ЗАГОТОВКИ», НАСТРОЙКИ ПЕРА =================
    function closeMenus(except) {
        ['bdShapeMenu', 'bdPresetMenu', 'bdPenCfg', 'bdLsMenu'].forEach((id) => { if (id !== except && $(id)) $(id).hidden = true; });
    }
    function toggleMenu(id, anchor) {
        const m = $(id);
        closeMenus(id);
        m.hidden = !m.hidden;
        if (m.hidden) return;
        const r = anchor.getBoundingClientRect(), br = boardEl.getBoundingClientRect();
        m.style.left = Math.max(4, Math.min(r.left - br.left, br.width - m.offsetWidth - 4)) + 'px';
        m.style.top = (r.bottom - br.top + 6) + 'px';
    }
    function menuItem(id, name, icon, extra) {
        return `<button class="bd-mi" ${extra} title="${esc(name)}">${icon}<span>${esc(name)}</span></button>`;
    }
    const toolIcon = (t) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[t]}</svg>`;
    function buildMenus() {
        const sec = (title, html) => `<div class="bd-msec"><h4>${title}</h4><div class="bd-mgrid">${html}</div></div>`;
        $('bdShapeMenu').innerHTML =
            sec('Построение', MENU_TOOLS.map(([t, n]) => menuItem(t, n, toolIcon(t), `data-tool2="${t}"`)).join('')) +
            sec('Многоугольники', POLY_SH.map((sh) => menuItem(sh.id, sh.name, shapeIcon(sh), `data-sid="${sh.id}"`)).join('')) +
            sec('Окружности', SHAPES.filter((sh) => !sh.v && !IS_3D[sh.id]).map((sh) => menuItem(sh.id, sh.name, shapeIcon(sh), `data-sid="${sh.id}"`)).join('')) +
            sec('Тела', SHAPES.filter((sh) => IS_3D[sh.id]).map((sh) => menuItem(sh.id, sh.name, shapeIcon(sh), `data-sid="${sh.id}"`)).join('')) +
            '<p class="bd-mnote">Выберите фигуру и растяните её мышкой или пальцем на доске (Shift — ровно). Потом её можно тянуть за вершины и ручки, поворачивать и подписывать.</p>';
        $('bdShapeMenu').addEventListener('click', (e) => {
            const b = e.target.closest('[data-sid],[data-tool2]'); if (!b) return;
            if (b.dataset.sid) { shapeId = b.dataset.sid; setTool('shape'); } else setTool(b.dataset.tool2);
            closeMenus();
        });
        $('bdPresetMenu').innerHTML =
            sec('Шаблоны', PRESETS.filter((p) => !p.text).map((p) => menuItem(p.id, p.name, shapeIcon(p), `data-pr="${p.id}"`)).join('')) +
            sec('Формулы', PRESETS.filter((p) => p.text).map((p) => menuItem(p.id, p.name, shapeIcon(p), `data-pr="${p.id}"`)).join(''));
        $('bdPresetMenu').addEventListener('click', (e) => {
            const b = e.target.closest('[data-pr]'); if (!b) return;
            closeMenus(); insertPreset(PRESETS.find((p) => p.id === b.dataset.pr));
        });
        $('bdShapesBtn').onclick = () => toggleMenu('bdShapeMenu', $('bdShapesBtn'));
        $('bdFig').onclick = () => toggleMenu('bdPresetMenu', $('bdFig'));
        $('bdPenBtn').onclick = () => { toggleMenu('bdPenCfg', $('bdPenBtn')); penPreview(); };
        // настройки пера
        const bind = (id, key, scale) => {
            const el = $(id);
            el.value = Math.round(penCfg[key] * (scale || 100));
            el.addEventListener('input', () => { penCfg[key] = el.value / (scale || 100); savePen(); penPreview(); });
        };
        bind('bdPenSm', 'sm'); bind('bdPenTh', 'th'); bind('bdPenTp', 'tp');
        $('bdPenSt').checked = penCfg.st;
        $('bdPenSt').addEventListener('change', () => { penCfg.st = $('bdPenSt').checked; savePen(); });
        $('bdPenReset').onclick = () => { Object.assign(penCfg, PEN_DEF); savePen(); ['Sm', 'Th', 'Tp'].forEach((k) => { $('bdPen' + k).value = Math.round(penCfg[k.toLowerCase()] * 100); }); $('bdPenSt').checked = penCfg.st; penPreview(); };
        document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.bd-menu, #bdShapesBtn, #bdFig, #bdPenBtn, #bdLsBtn')) closeMenus(); });
    }
    // вид линии для новых объектов (и выделенных — при смене)
    const STYLED = { line: 1, arrow: 1, circle: 1, rect: 1, ellipse: 1, poly: 1 };
    const lineStyle = Object.assign({ ls: 'solid', dl: 1 }, lsGet('mf-board-ls', {}));
    const styleFor = (t) => (STYLED[t] && lineStyle.ls !== 'solid' ? { ls: lineStyle.ls, dl: lineStyle.dl } : {});
    function applyToSel(fn) {
        if (tool !== 'select' || !sel.length) return;
        const pairs = selItems().map((it) => { const n = clone(it); fn(n); return [clone(it), n]; }).filter(([a, b]) => JSON.stringify(a) !== JSON.stringify(b));
        if (pairs.length) { commit({ mod: pairs }); render(); }
    }
    const PEN_DEF = { sm: .5, th: .6, tp: .5, st: true };
    const penCfg = Object.assign({}, PEN_DEF, lsGet('mf-board-pen', {}));
    const savePen = () => lsSet('mf-board-pen', penCfg);
    // образец штриха в окне настроек
    function penPreview() {
        const cv = $('bdPenPrev'); if (!cv || $('bdPenCfg').hidden) return;
        const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
        cv.width = r.width * d; cv.height = r.height * d;
        const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
        g.fillStyle = boardFill(); g.fillRect(0, 0, r.width, r.height);
        const p = [], pr = [];
        let last = .5;
        for (let i = 0; i <= 60; i++) {
            const t = i / 60, x = 14 + t * (r.width - 28), y = r.height / 2 + Math.sin(t * Math.PI * 2.2) * r.height * .28;
            const sp = 2.6 * Math.abs(Math.cos(t * Math.PI * 2.2));
            last = last + (Math.max(0, Math.min(1, 1 - sp / 2.2)) - last) * .35;
            p.push(x, y); pr.push(last);
        }
        g.fillStyle = paint(color === 'contrast' ? 'ink' : color);
        g.fill(inkPath({ t: 'pen', p, pr, w: Math.max(size, 3), th: penCfg.th, tp: penCfg.tp }));
    }

    // ================= ПОДПИСИ (точки, вершины, отрезки, тела) =================
    let lblEd = null;
    // открыть поле подписи в экранной точке; get/set — чтение и запись в копию объекта
    function openLabel(it, sx, sy, get, set, hint) {
        closeLabel(true);
        const inp = document.createElement('input');
        inp.className = 'bd-lbl'; inp.value = get(it) || ''; inp.placeholder = hint || 'Подпись';
        inp.style.left = sx + 'px'; inp.style.top = sy + 'px';
        stage.appendChild(inp);
        lblEd = { inp, id: it.id, set };
        inp.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') { e.preventDefault(); closeLabel(true); }
            if (e.key === 'Escape') { e.preventDefault(); closeLabel(false); }
        });
        inp.addEventListener('blur', () => setTimeout(() => closeLabel(true), 0));
        inp.focus({ preventScroll: true }); inp.select();
    }
    function closeLabel(save) {
        if (!lblEd) return;
        const { inp, id, set } = lblEd;
        lblEd = null;
        inp.remove();
        const it = byId(id);
        if (!save || !it) return;
        const n = clone(it);
        set(n, inp.value.trim().slice(0, 60));
        if (JSON.stringify(n) !== JSON.stringify(it)) { commit({ mod: [[clone(it), n]] }); render(); }
    }
    // подписать то, что под указателем: вершину многоугольника, подпись тела, точку, отрезок…
    function labelAt(it, w) {
        const near = (x, y, r) => Math.hypot(x - w.x, y - w.y) * view.k < r;
        if (it.t === 'poly') {
            const n = it.p.length / 2;
            let best = -1, bd = 1e9;
            for (let i = 0; i < n; i++) { const d = Math.hypot(it.p[2 * i] - w.x, it.p[2 * i + 1] - w.y); if (d < bd) { bd = d; best = i; } }
            const q = vertexLabelPos(it, best), s = toScreen(q.x, q.y);
            return openLabel(it, s.x, s.y, (o) => (o.lb || [])[best], (o, v) => { o.lb = Array.from({ length: n }, (_, k) => (o.lb || [])[k] || ''); o.lb[best] = v; }, 'Вершина');
        }
        if (it.t === 'solid') {
            const { P } = solidProj(it), f = frameOf(it);
            let best = -1, bd = 1e9;
            P.forEach((q, i) => {
                const wq = rotPt(it.cx + q[0], it.cy - q[1], f.cx, f.cy, it.rot || 0), d = Math.hypot(wq.x - w.x, wq.y - w.y);
                if (d < bd && (solidModel(it.kind).f.some((fc) => fc.i.includes(i)) || (it.lb || [])[i] !== undefined)) { bd = d; best = i; }
            });
            if (best < 0) return;
            const wq = rotPt(it.cx + P[best][0], it.cy - P[best][1], f.cx, f.cy, it.rot || 0), s = toScreen(wq.x, wq.y);
            return openLabel(it, s.x, s.y - 18, (o) => (o.lb || [])[best], (o, v) => { o.lb = (o.lb || []).slice(); for (let k = 0; k <= best; k++) if (o.lb[k] === undefined) o.lb[k] = ''; o.lb[best] = v; }, 'Вершина');
        }
        if (it.t === 'vec') {
            const sx = it.w / it.bw, sy = it.h / it.bh, f = frameOf(it);
            const L = (it.labels || []).map((l, j) => { const q = rotPt(it.x + l.x * sx, it.y + l.y * sy, f.cx, f.cy, it.rot || 0); return { j, q }; });
            const hitL = L.filter((l) => near(l.q.x, l.q.y, 30)).sort((a, b) => Math.hypot(a.q.x - w.x, a.q.y - w.y) - Math.hypot(b.q.x - w.x, b.q.y - w.y))[0];
            if (hitL) { const s = toScreen(hitL.q.x, hitL.q.y); return openLabel(it, s.x, s.y, (o) => o.labels[hitL.j].t, (o, v) => { o.labels[hitL.j].t = v; }); }
            // новая подпись там, где щёлкнули
            const lq = rotPt(w.x, w.y, f.cx, f.cy, -(it.rot || 0)), s = toScreen(w.x, w.y);
            return openLabel(it, s.x, s.y, () => '', (o, v) => { if (v) (o.labels = o.labels || []).push({ x: (lq.x - it.x) / sx, y: (lq.y - it.y) / sy, t: v }); }, 'Новая подпись');
        }
        const b = toScreen(...(it.t === 'point' ? [it.x + 12, it.y - 16] : it.t === 'circle' ? [it.x1, it.y1 + 14] : 'x1' in it ? [(it.x1 + it.x2) / 2, (it.y1 + it.y2) / 2 - 14] : it.p ? [it.p[2], it.p[3]] : [w.x, w.y]));
        if (GEO[it.t]) return openLabel(it, b.x, b.y, (o) => o.label, (o, v) => { o.label = v; }, it.t === 'angle' ? 'Например, α (пусто — градусы)' : 'Подпись');
    }
    function editItem(it, w) {
        if (!it) return;
        if (it.t === 'plot') return openMath('g', it);
        if (it.t === 'tex') return openMath('f', it);
        if (it.t === 'text') { sel = []; return openText(it.x, it.y, it); }
        if (it.t === 'poly' && !w) {
            // все вершины сразу: «ABC» или «A B C»
            const s = toScreen(it.p[0], it.p[1]), n = it.p.length / 2;
            return openLabel(it, s.x, s.y - 30, (o) => (o.lb || []).join(' ').trim(), (o, v) => {
                const parts = /\s|,/.test(v) ? v.split(/[\s,]+/) : v.length === n ? v.split('') : [v];
                o.lb = Array.from({ length: n }, (_, k) => parts[k] || '');
            }, 'Вершины: ABC или A B C');
        }
        const f = frameOf(it);
        labelAt(it, w || { x: f.cx, y: f.cy - f.h / 2 });
    }
    stage.addEventListener('dblclick', (e) => {
        if (tool === 'poly' && geo) { finishGeo(true, false); return; }
        if (tool !== 'select') return;
        const p = localPt(e), w = toWorld(p.x, p.y);
        const it = topHit(w.x, w.y, 6 / view.k, true);
        if (!it) return;
        sel = [it.id];
        if (it.t === 'plot' || it.t === 'tex' || it.t === 'text') editItem(it);
        else labelAt(it, w);
        render();
    });

    // ================= ТЕКСТ С ФОРМУЛАМИ =================
    // Редактор — строка contenteditable, а формулы в ней — встроенные поля MathField, как в
    // мини-сервисах: дроби, корни и степени видны сразу, а не как $…$. В объекте текст хранится
    // как «…$latex$…» (так он рисуется на холсте), а деревья формул — в fx (JSON-строки по
    // порядку формул), чтобы при повторной правке формула открывалась без потерь.
    // Новая формула — кнопка ∑ у строки или Ctrl+M / Alt+=; выйти из формулы — → в конце, Enter или Esc.
    const FX = { kb: null, field: null };
    const ZW = '​';   // невидимый символ рядом с формулой — чтобы было куда поставить курсор
    function fxKeyboard(f) {
        if (!window.MFKeyboard) return;
        if (!FX.kb) {
            let touch = false;
            try { touch = matchMedia('(pointer: coarse)').matches; } catch (e) {}
            FX.kb = new MFKeyboard($('bdFxKb'), f, { collapsed: !touch, allowSystem: true, allowComplex: true, onEnter: () => FX.field && leaveFormula(FX.field, 1) });
        }
        FX.kb.field = f; FX.field = f;
        $('bdFx').hidden = false;
    }
    function hideFxKb() { $('bdFx').hidden = true; FX.field = null; }
    function caretAt(node, after) {
        const r = document.createRange();
        if (node.nodeType === 3) r.setStart(node, after ? node.length : 0);
        else if (node.classList && node.classList.contains('bd-text')) { r.selectNodeContents(node); r.collapse(!after); }
        else if (after) r.setStartAfter(node); else r.setStartBefore(node);
        r.collapse(true);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    function leaveFormula(f, dir) {
        const chip = f.host.closest('.bd-chip');
        if (!textEd || !chip) return;
        textEd.ed.focus({ preventScroll: true });
        const sib = dir > 0 ? chip.nextSibling : chip.previousSibling;
        if (sib && sib.nodeType === 3) caretAt(sib, dir < 0); else caretAt(chip, dir > 0);
        hideFxKb();
    }
    function makeChip(tree, latex) {
        const chip = document.createElement('span');
        chip.className = 'bd-chip'; chip.contentEditable = 'false';
        const host = document.createElement('span');
        chip.appendChild(host);
        if (tree || !latex) {
            const f = new MathField(host, {
                label: 'Формула',
                onChange: (fld, enter) => { if (enter) leaveFormula(fld, 1); if (textEd) textEd.place(); },
                onExit: (d) => leaveFormula(f, d)
            });
            if (tree) { try { f.setTree(tree); } catch (e) {} }
            chip.__f = f;
            host.addEventListener('focus', () => fxKeyboard(f));
        } else {
            // формула, набранная вручную как $…$: показываем готовой, щелчок — вернуть исходный текст
            chip.__latex = latex;
            chip.classList.add('bd-chip-raw');
            chip.title = 'Щёлкните, чтобы править как текст';
            const d = texDims(latex);
            if (d) host.innerHTML = d.svg; else host.textContent = '$' + latex + '$';
            chip.addEventListener('click', () => { const t = document.createTextNode('$' + latex + '$'); chip.replaceWith(t); caretAt(t, true); textEd && textEd.place(); });
        }
        return chip;
    }
    function insertFormula() {
        if (!textEd || !window.MathField) return;
        const ed = textEd.ed, s = getSelection();
        let r = s.rangeCount && ed.contains(s.getRangeAt(0).startContainer) ? s.getRangeAt(0) : null;
        if (!r) { r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); }
        r.deleteContents();
        const chip = makeChip(null, null), after = document.createTextNode(ZW);
        r.insertNode(after); r.insertNode(chip);
        if (!chip.previousSibling || chip.previousSibling.nodeType !== 3) chip.before(document.createTextNode(ZW));
        textEd.place();
        setTimeout(() => chip.__f.host.focus({ preventScroll: true }), 0);
    }
    // содержимое редактора → { text, fx }
    function serializeEd(ed) {
        let text = '';
        const fx = [];
        const manual = (t) => { const m = t.match(/\$[^$]+\$/g); if (m) m.forEach(() => fx.push('')); };
        (function walk(node) {
            for (const n of node.childNodes) {
                if (n.nodeType === 3) { const t = n.data.replace(/​/g, ''); manual(t); text += t; }
                else if (n.classList && n.classList.contains('bd-chip')) {
                    if (n.__f) { if (!n.__f.isEmpty()) { text += '$' + n.__f.latex().trim() + '$'; fx.push(JSON.stringify(n.__f.getTree())); } }
                    else if (n.__latex) { text += '$' + n.__latex + '$'; fx.push(''); }
                } else if (n.nodeName === 'BR') text += '\n';
                else { if (/^(DIV|P)$/.test(n.nodeName) && text && !text.endsWith('\n')) text += '\n'; walk(n); }
            }
        })(ed);
        return { text, fx };
    }
    // { text, fx } → содержимое редактора
    function fillEd(ed, text, fx) {
        const re = /\$([^$]+)\$/g;
        let last = 0, m, k = 0;
        const addText = (t) => { if (t) ed.appendChild(document.createTextNode(t)); };
        while ((m = re.exec(text))) {
            addText(text.slice(last, m.index));
            let tree = null;
            try { tree = fx && fx[k] ? JSON.parse(fx[k]) : null; } catch (e) {}
            ed.appendChild(document.createTextNode(ZW));
            ed.appendChild(makeChip(tree, tree ? null : m[1]));
            ed.appendChild(document.createTextNode(ZW));
            last = m.index + m[0].length; k++;
        }
        addText(text.slice(last));
        if (!ed.childNodes.length) ed.appendChild(document.createTextNode(''));
    }
    function openText(wx, wy, existing) {
        closeText();
        const ed = document.createElement('div');
        ed.className = 'bd-text'; ed.contentEditable = 'true'; ed.spellcheck = false;
        const s = existing ? existing.s : 12 + size * 3;
        const col = existing ? existing.c : color;
        if (existing && window.MathField) fillEd(ed, existing.text, existing.fx);
        else if (existing) ed.textContent = existing.text;
        const fx = document.createElement('button');
        fx.className = 'bd-fxbtn'; fx.type = 'button';
        fx.innerHTML = '∑'; fx.title = 'Вставить формулу (Ctrl+M или Alt+=)';
        fx.addEventListener('pointerdown', (e) => e.preventDefault());   // не отнимать фокус у текста
        fx.addEventListener('click', insertFormula);
        const place = () => {
            ed.style.left = (wx - view.x) * view.k + 'px';
            ed.style.top = (wy - view.y) * view.k + 'px';
            fx.style.left = (wx - view.x) * view.k - 34 + 'px';
            fx.style.top = (wy - view.y) * view.k + 'px';
            ed.style.fontSize = s * view.k + 'px';
            ed.style.color = paint(col === 'contrast' ? 'ink' : col);
        };
        ed.addEventListener('input', place);
        ed.addEventListener('paste', (e) => {
            // только простой текст
            e.preventDefault(); e.stopPropagation();
            const t = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
            if (!/^mf-board:/.test(t)) document.execCommand('insertText', false, t);
        });
        ed.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.target !== ed) {                     // клавиши внутри формулы
                if (e.key === 'Escape') { e.preventDefault(); const c = e.target.closest('.bd-chip'); if (c && c.__f) leaveFormula(c.__f, 1); }
                return;
            }
            const k = e.key.toLowerCase();
            if (((e.ctrlKey || e.metaKey) && (k === 'm' || k === 'ь')) || (e.altKey && (e.key === '=' || e.code === 'Equal'))) { e.preventDefault(); insertFormula(); }
            else if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); closeText(); }
            else if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertText', false, '\n'); }
        });
        // уход фокуса в формулу или на её клавиатуру текст не закрывает
        ed.addEventListener('focusout', () => setTimeout(() => {
            const a = document.activeElement;
            if (!textEd || textEd.ed !== ed || ed.contains(a) || $('bdFx').contains(a)) return;
            closeText();
        }, 0));
        ed.addEventListener('focusin', (e) => { if (e.target === ed) hideFxKb(); });
        textEd = { ed, fx, wx, wy, s, col, place, existing: existing ? clone(existing) : null };
        if (existing) { items = items.filter((i) => i.id !== existing.id); render(); }
        stage.appendChild(ed);
        stage.appendChild(fx);
        place();
        ed.focus({ preventScroll: true });
        caretAt(ed.lastChild && ed.lastChild.nodeType === 3 ? ed.lastChild : ed, true);
        if (existing && hasMath(existing.text) && !(window.MathJax && MathJax.tex2svg)) loadMathJax().catch(() => {});
    }
    function closeText() {
        if (!textEd) return;
        const { ed, fx, wx, wy, s, col, existing } = textEd;
        textEd = null;
        hideFxKb();
        const r = serializeEd(ed);
        const text = r.text.replace(/\s+$/, '');
        ed.remove(); fx.remove();
        if (hasMath(text)) loadMathJax().then(() => { layoutCache.clear(); render(); }, () => {});
        const data = { text };
        if (r.fx.some(Boolean)) data.fx = r.fx;
        if (existing) {
            const n = Object.assign({}, existing, data);
            if (!data.fx) delete n.fx;
            if (!text) commit({ del: [existing] });
            else if (text !== existing.text || JSON.stringify(n.fx) !== JSON.stringify(existing.fx)) commit({ mod: [[existing, n]] });
            else putItems([existing]);
        } else if (text) {
            commit({ add: [Object.assign({ id: rid(12), z: newZ(), t: 'text', x: wx, y: wy, s, c: col, w: 0 }, data)] });
        }
        render();
    }

    // ================= «РЕШИТЬ» НАД ФОТО И ТЕКСТОМ =================
    // Как на странице мини-сервисов: фото распознаёт нейросеть (api/ai-task.js, режим board —
    // все задачи с фото по отдельности), пример решает алгебраический калькулятор (MFSolver),
    // геометрическую задачу — геометрический решатель (geo-problem.js), остальное — нейросеть.
    // Решение пишется прямо на доску обычными объектами — текст с формулами, точки, отрезки,
    // окружности — под исходным фото/текстом; каждую часть потом можно править как обычно.
    const solving = new Set();
    let solveBtns = [];
    const SOLVABLE = (it) => (it.t === 'img' || (it.t === 'text' && String(it.text).trim().length > 1)) && !it.sol;
    function drawSolveBtns() {
        solveBtns = [];
        if (cur || drag || textEd) return;
        ctx.save();
        ctx.font = '600 12px ' + (css('--font-display') || 'sans-serif');
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        for (const it of items) {
            if (!SOLVABLE(it)) continue;
            const b = bounds(it), s = toScreen(b.x, b.y), e = toScreen(b.x + b.w, b.y + b.h);
            if (e.x < 0 || e.y < 0 || s.x > W || s.y > H) continue;
            const busy = solving.has(it.id), label = busy ? 'Решаю…' : '✓ Решить';
            const w = ctx.measureText(label).width + 16, h = 22, x = Math.min(Math.max(4, s.x), W - w - 4), y = Math.max(4, s.y - h - 6);
            ctx.fillStyle = busy ? (css('--text-tertiary') || '#888') : '#30a46c';
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 11) : ctx.rect(x, y, w, h); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillText(label, x + 8, y + h / 2 + .5);
            solveBtns.push({ id: it.id, x, y, w, h });
        }
        ctx.restore();
    }
    const solveBtnAt = (sx, sy) => solveBtns.find((b) => sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h);

    async function aiPost(body) {
        const hd = { 'content-type': 'application/json' };
        try { const u = window.Auth && Auth.getCurrentUser && Auth.getCurrentUser(); if (u) hd.authorization = 'Bearer ' + (await u.getIdToken()); } catch (e) {}
        const r = await fetch('/api/ai-task', { method: 'POST', headers: hd, body: JSON.stringify(body) });
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error((d && d.error) || ('ошибка сервера (' + r.status + ')'));
        return d || {};
    }
    // картинка → JPEG data URL (как на мини-сервисах)
    function imgToJpeg(src) {
        return new Promise((ok, fail) => {
            const im = new Image();
            im.onload = () => {
                const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
                const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
                ok(c.toDataURL('image/jpeg', .86));
            };
            im.onerror = () => fail(new Error('не удалось открыть картинку'));
            im.src = src;
        });
    }
    // LaTeX (формулы, набранные вручную) → линейная запись калькулятора
    function latexToLinear(l) {
        let s = String(l);
        for (let k = 0; k < 6; k++) {
            s = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
                .replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, 'root($1,$2)').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
                .replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/_\{([^{}]*)\}/g, '_$1');
        }
        return s.replace(/\\left|\\right/g, '').replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/').replace(/\\pi/g, 'pi')
            .replace(/\\le(q)?/g, '<=').replace(/\\ge(q)?/g, '>=').replace(/\\ne(q)?/g, '!=').replace(/\\operatorname\{([^{}]*)\}/g, '$1')
            .replace(/\\(sin|cos|tan|tg|cot|ctg|ln|log|lg|arcsin|arccos|arctan)/g, '$1').replace(/\\[a-z]+/gi, '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
    }
    // текст объекта с формулами → обычная запись (формулы — линейно, для решателей)
    function textForSolve(it) {
        let k = 0;
        return String(it.text).replace(/\$([^$]+)\$/g, (m, l) => {
            const fx = it.fx && it.fx[k++];
            if (fx && window.MathField) {
                try { const f = new MathField(document.createElement('div'), {}); f.setTree(JSON.parse(fx)); return f.expr(); } catch (e) {}
            }
            return latexToLinear(l);
        });
    }
    // несколько задач в одном тексте: нумерация «1.», «2)», «№3», «а)» — или по строке на пример
    function splitProblems(text) {
        const lines = String(text).split('\n').map((l) => l.trim()).filter(Boolean);
        const NUM = /^(?:№\s*\d+[.)]?|\d+\s*[.)]|[а-гa-d]\))\s*/i;
        if (lines.filter((l) => NUM.test(l)).length >= 2) {
            const out = [];
            for (const l of lines) { if (NUM.test(l) || !out.length) out.push(l.replace(NUM, '')); else out[out.length - 1] += ' ' + l; }
            return out.filter(Boolean);
        }
        if (lines.length > 1 && lines.every((l) => !/[а-яё]{3,}/i.test(l) && /[=<>]|\d/.test(l))) return lines;
        return [lines.join(' ')];
    }
    let geoMods = null;
    const loadGeo = () => (geoMods = geoMods || Promise.all([import('/assets/js/geo/geo-problem.js'), import('/assets/js/geo/geo-ai.js')]).catch((e) => { geoMods = null; throw e; }));
    // одна задача → { steps: [строки с $…$], answer, sketch?, notes, error? }
    async function solveOne(text) {
        const [GP, GA] = await loadGeo();
        if (!GP.checkProblemText(text)) {
            const r = await GP.solveGeometryProblem(text, { ai: GA.aiParseGeometry, aiSolve: GA.aiSolveGeometry, theme: isLight() ? 'light' : 'dark' });
            if (r.ok) {
                const steps = r.stepsMd ? r.stepsMd : r.steps.map((s) => htmlToText(s.html));
                const answer = r.answerMd || r.answers.map((a) => htmlToText(GP.answerText(a))).join('; ');
                return { steps, answer, sketch: r.sketch || modelSketch(r), notes: (r.notes || []).map(htmlToText) };
            }
            if (r.invalid) { /* не геометрия — пробуем как алгебру */ } else return { error: htmlToText(r.error || 'не удалось решить') };
        }
        const f = GA.extractFormula(text) || (!/[а-яё]{3,}/i.test(text) ? text : null);
        if (f && window.MFSolver && window.MFMath) {
            const lin = MFMath.normalizeLinear(f), rows = lin.indexOf(';') >= 0 ? lin.split(';') : null;
            const r = rows ? MFSolver.solve({ rows }) : MFSolver.solve({ linear: lin });
            if (!r.error) return algSteps(r);
        }
        const d = await GA.aiSolveAlgebra(text);
        return { steps: d.steps, answer: d.answer, notes: ['Решено нейросетью — проверьте рассуждения.'] };
    }
    function algSteps(r) {
        const out = [];
        (function walk(list) {
            for (const st of list) {
                if (st.group) { out.push('**' + st.group + '**'); walk(st.steps || []); continue; }
                if ((st.lvl || 0) > 1) continue;
                out.push([st.text, st.tex ? '$' + st.tex + '$' : ''].filter(Boolean).join('\n'));
            }
        })(r.steps || []);
        const a = r.answer;
        const answer = a ? a.items.map((x) => '$' + x.tex + '$').join(';  ') + (a.note ? ' (' + a.note + ')' : '') : '';
        return { steps: out, answer };
    }
    function htmlToText(h) {
        return String(h || '').replace(/<sup>(.*?)<\/sup>/g, (m, x) => (x === '2' ? '²' : x === '3' ? '³' : '^' + x)).replace(/<sub>(.*?)<\/sub>/g, '$1')
            .replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
            .replace(/√\(([^()]*)\)/g, (m, x) => '$\\sqrt{' + x.replace(/·/g, '\\cdot ') + '}$').replace(/√(\d+(?:,\d+)?)/g, '$\\sqrt{$1}$');
    }
    // чертёж из модели геометрического решателя: фигура, построения (пунктиром), искомое
    function modelSketch(r) {
        if (!r.model || !r.ir) return null;
        const pts = {}, M = r.model.pts;
        for (const n in M) if (M[n] && isFinite(M[n].x) && isFinite(M[n].y)) pts[n] = [M[n].x, M[n].y];
        const V = r.ir.figure.vertices, segments = [], dashed = [], highlight = [];
        V.forEach((v, i) => segments.push([v, V[(i + 1) % V.length]]));
        for (const c of r.ir.constructions || []) {
            if (c.kind === 'bisector' || c.kind === 'median' || c.kind === 'altitude') dashed.push([c.vertex, c.point]);
            else if (c.kind === 'bisectorMeet') c.vertices.forEach((v) => dashed.push([v, c.point]));
            else if (c.kind === 'intersection') c.lines.forEach((l) => segments.push([l[0], l[1]]));
            else if (c.kind === 'segment') segments.push([c.seg[0], c.seg[1]]);
        }
        for (const f of r.ir.find || []) if (f.seg && pts[f.seg[0]] && pts[f.seg[1]]) highlight.push([f.seg[0], f.seg[1]]);
        return { points: pts, segments, dashed, highlight };
    }
    // эскиз { points, segments, dashed, highlight, circles } → точки, отрезки и окружности на доске
    function sketchItems(sk, x0, y0, wT) {
        const P = {};
        for (const [n, v] of Object.entries((sk && sk.points) || {})) if (Array.isArray(v) && isFinite(v[0]) && isFinite(v[1])) P[n] = v;
        const names = Object.keys(P);
        if (names.length < 2) return { list: [], h: 0 };
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        const ext = (x, y) => { x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, y); y2 = Math.max(y2, y); };
        names.forEach((n) => ext(P[n][0], P[n][1]));
        const circles = ((sk && sk.circles) || []).map((c) => { const ctr = typeof c.center === 'string' ? P[c.center] : c.center; return ctr && +c.radius > 0 ? { c: ctr, r: +c.radius } : null; }).filter(Boolean);
        circles.forEach((c) => { ext(c.c[0] - c.r, c.c[1] - c.r); ext(c.c[0] + c.r, c.c[1] + c.r); });
        const bw = Math.max(1e-6, x2 - x1), bh = Math.max(1e-6, y2 - y1), k = Math.min(wT / bw, wT * .8 / bh);
        const pad = 24 * (wT / 300);
        const X = (x) => R2(x0 + pad + (x - x1) * k), Y = (y) => R2(y0 + pad + (y2 - y) * k);   // в эскизе ось y — вверх
        const list = [], ink = 'ink';
        const seg = (s, extra) => { if (Array.isArray(s) && P[s[0]] && P[s[1]]) list.push(Object.assign({ t: 'line', c: ink, w: 2.5, x1: X(P[s[0]][0]), y1: Y(P[s[0]][1]), x2: X(P[s[1]][0]), y2: Y(P[s[1]][1]) }, extra)); };
        (sk.segments || []).forEach((s) => seg(s));
        (sk.dashed || []).forEach((s) => seg(s, { ls: 'dash', dl: 1, w: 2 }));
        (sk.highlight || []).forEach((s) => seg(s, { c: '#e5484d', w: 3.5 }));
        circles.forEach((c) => list.push({ t: 'circle', c: ink, w: 2.5, nc: 1, x1: X(c.c[0]), y1: Y(c.c[1]), x2: R2(X(c.c[0]) + c.r * k), y2: Y(c.c[1]) }));
        names.forEach((n) => list.push({ t: 'point', c: ink, w: 2, x: X(P[n][0]), y: Y(P[n][1]), label: n }));
        return { list, h: bh * k + 2 * pad };
    }
    // перенос длинных строк по словам (формулы $…$ не разрываем)
    function wrapText(t, max) {
        return String(t).split('\n').map((line) => {
            const toks = line.match(/\$[^$]*\$|\S+/g) || [];
            const out = []; let curL = '', len = 0;
            for (const tk of toks) {
                const tl = tk[0] === '$' ? Math.min(30, tk.length * .6) : tk.length;
                if (curL && len + tl + 1 > max) { out.push(curL); curL = tk; len = tl; } else { curL += (curL ? ' ' : '') + tk; len += tl + (curL === tk ? 0 : 1); }
            }
            if (curL) out.push(curL);
            return out.join('\n');
        }).join('\n');
    }
    // условие для заголовка: пример — формулой, текст — как есть
    function problemTitle(t) {
        if (!/[а-яё]{3,}/i.test(t) && window.MFMath) {
            try { const parts = MFMath.normalizeLinear(t).split(';').map((x) => { const sides = x.split(/(<=|>=|!=|=|<|>)/); return sides.map((p) => (/^(<=|>=|!=|=|<|>)$/.test(p) ? ({ '<=': '\\le', '>=': '\\ge', '!=': '\\ne' }[p] || p) : MFMath.tex(MFMath.parse(p), 0))).join(' '); }); return '$' + parts.join(';\\ ') + '$'; } catch (e) {}
        }
        return t.length > 160 ? t.slice(0, 157) + '…' : t;
    }
    async function solveItem(it) {
        if (solving.has(it.id)) return;
        solving.add(it.id); render();
        try {
            let probs;
            if (it.t === 'img') {
                const d = await aiPost({ task: 'ocr', mode: 'board', image: await imgToJpeg(it.src) });
                probs = String(d.text || '').split(/\n\s*-{3,}\s*\n?/).map((x) => x.trim()).filter(Boolean);
                if (!probs.length) throw new Error('на фото не нашлось задач');
            } else probs = splitProblems(textForSolve(it));
            await loadMathJax().catch(() => {});
            layoutCache.clear();
            const b = bounds(it), s = Math.max(12, Math.min(30, it.t === 'text' ? it.s : b.w / 28)), gap = s * .9;
            const x0 = b.x, wrapN = Math.max(40, Math.round(Math.max(b.w, s * 28) / (s * .55)));
            let y = b.y + b.h + gap * 1.5;
            const made = [];
            const addText = (text, extra) => {
                const t = Object.assign({ t: 'text', x: R2(x0), y: R2(y), s, c: 'ink', w: 0, text: wrapText(text, wrapN), sol: it.id }, extra);
                made.push(t); y += layoutText(t).h + gap * .5;
                return t;
            };
            for (let i = 0; i < probs.length; i++) {
                let res;
                try { res = await solveOne(probs[i]); } catch (e) { res = { error: e && e.message ? e.message : String(e) }; }
                addText((probs.length > 1 ? '№' + (i + 1) + '. ' : '') + problemTitle(probs[i]), { c: '#3e8bff' });
                if (res.error) { addText('Не получилось решить: ' + res.error, { c: '#e5484d', s: s * .85 }); y += gap; continue; }
                if (res.sketch) {
                    const sk = sketchItems(res.sketch, x0, y, Math.min(Math.max(b.w, 260), s * 18));
                    sk.list.forEach((x) => { x.sol = it.id; made.push(x); });
                    y += sk.h + gap * .5;
                }
                addText(res.steps.map((st, k) => (/^\*\*/.test(st) ? st.replace(/\*\*/g, '') : (k + 1) + ') ' + st)).join('\n'));
                if (res.answer) addText('Ответ: ' + res.answer, { c: '#30a46c' });
                if (res.notes && res.notes.length) addText(res.notes.join(' '), { s: s * .75 });
                y += gap;
            }
            const list = made.map((x, k) => Object.assign(x, { id: rid(12), z: newZ() + k * 1e-3 }));
            if (commit({ add: list }) !== false) { setTool('select'); sel = list.map((x) => x.id); }
        } catch (e) {
            toast('Не удалось решить: ' + (e && e.message ? e.message : e));
        } finally { solving.delete(it.id); render(); }
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
            setTool('select'); sel = [it.id]; render();
        } catch (e) { toast(e.message || 'Не удалось добавить изображение'); }
    }

    // ================= УКАЗАТЕЛЬ =================
    function startPinch() {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
    function cancelCurrent() {
        if (cur && cur.t === 'erase' && cur.erased.length) putItems(cur.erased);
        if (drag && drag.mode !== 'marquee') { putItems(drag.befores || [drag.before]); if (drag.tgts) putItems([...drag.tgts.values()]); }
        cur = null; drag = null; panDrag = null;
        sendDraft(null);
    }
    // ---------- склейка вершин: совпадающие вершины других объектов следуют за перемещаемыми
    function buildGlue(srcs, except) {
        const glue = [], tgts = new Map();
        const eq = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
        const sv = srcs.filter((it) => GEO[it.t]).map((it) => ({ id: it.id, v: getV(it) }));
        if (!sv.length) return { glue, tgts };
        for (const it of items) {
            if (except.has(it.id) || !GEO[it.t]) continue;
            getV(it).forEach((v, j) => {
                for (const s of sv) s.v.forEach((u, i) => {
                    if (!eq(u, v)) return;
                    if (i === 1 && (byId(s.id) || {}).t === 'circle') return;   // точка радиуса окружности — не склеиваем
                    glue.push({ src: s.id, i, tgt: it.id, j });
                    if (!tgts.has(it.id)) tgts.set(it.id, clone(it));
                });
            });
        }
        return { glue, tgts };
    }
    function setLive(n) { const i = items.findIndex((x) => x.id === n.id); if (i >= 0) items[i] = n; }
    // применить новые версии перемещаемых объектов и подтянуть склеенные вершины
    function applyDrag(news) {
        const byNew = new Map(news.map((n) => [n.id, n]));
        news.forEach(setLive);
        const work = new Map();
        for (const g of drag.glue) {
            const src = byNew.get(g.src); if (!src) continue;
            const v = getV(src)[g.i]; if (!v) continue;
            if (!work.has(g.tgt)) work.set(g.tgt, clone(drag.tgts.get(g.tgt)));
            setV(work.get(g.tgt), g.j, v[0], v[1]);
        }
        work.forEach(setLive);
        drag.moved = true;
    }
    function startMove(w) {
        const its = selItems(), ids = new Set(its.map((i) => i.id));
        const g = buildGlue(its, ids);
        // опорная вершина для привязки при перетаскивании — ближайшая к месту захвата
        let anchor = null, ad = Infinity;
        for (const it of its) for (const [x, y] of getV(it)) { const d = Math.hypot(x - w.x, y - w.y); if (d < ad) { ad = d; anchor = { x, y }; } }
        if (!anchor && its.length) { const b = bounds(its[0]); anchor = { x: b.x, y: b.y }; }
        drag = { mode: 'move', w0: w, befores: its.map(clone), glue: g.glue, tgts: g.tgts, anchor, ids };
    }
    // новая рамка при растяжении за ручку hid (в системе координат повёрнутой рамки)
    function scaleFrame(f0, hid, w, keep) {
        const q = rotPt(w.x, w.y, f0.cx, f0.cy, -f0.rot), lx = q.x - f0.cx, ly = q.y - f0.cy, MIN = 6 / view.k;
        let l = -f0.w / 2, r = f0.w / 2, t = -f0.h / 2, b = f0.h / 2;
        if (hid.includes('w')) l = Math.min(lx, r - MIN);
        if (hid.includes('e')) r = Math.max(lx, l + MIN);
        if (hid.includes('n')) t = Math.min(ly, b - MIN);
        if (hid.includes('s')) b = Math.max(ly, t + MIN);
        if (keep && hid.length === 2 && f0.w > 0 && f0.h > 0) {
            const k = Math.max((r - l) / f0.w, (b - t) / f0.h);
            if (hid.includes('w')) l = r - f0.w * k; else r = l + f0.w * k;
            if (hid.includes('n')) t = b - f0.h * k; else b = t + f0.h * k;
        }
        const c = rotPt(f0.cx + (l + r) / 2, f0.cy + (t + b) / 2, f0.cx, f0.cy, f0.rot);
        return { cx: c.x, cy: c.y, w: r - l, h: b - t, rot: f0.rot, sx: f0.w ? (r - l) / f0.w : 1, sy: f0.h ? (b - t) / f0.h : 1 };
    }
    const KEEP = { img: 1, tex: 1, text: 1, circle: 1 };
    function applyFrame(b, f0, f1) {
        const n = clone(b);
        if (n.t === 'solid') {
            n.sx = b.sx * f1.sx; n.sz = b.sz * f1.sx; n.sy = b.sy * f1.sy;
            solidFit(n);
            n.cx += f1.cx - (n.x + n.w / 2); n.cy += f1.cy - (n.y + n.h / 2);
            return solidFit(n);
        }
        if (BOX[n.t]) { n.x = f1.cx - f1.w / 2; n.y = f1.cy - f1.h / 2; n.w = f1.w; n.h = f1.h; return n; }
        if (n.t === 'rect' || n.t === 'ellipse') { n.x1 = f1.cx - f1.w / 2; n.x2 = f1.cx + f1.w / 2; n.y1 = f1.cy - f1.h / 2; n.y2 = f1.cy + f1.h / 2; return n; }
        if (n.t === 'text') {
            const k = Math.max(f1.sx, f1.sy);
            n.s = Math.max(6, b.s * k);
            n.x = f1.cx - f0.w * (n.s / b.s) / 2; n.y = f1.cy - f0.h * (n.s / b.s) / 2;
            return n;
        }
        if (n.t === 'circle') {
            const k = Math.max(f1.sx, f1.sy);
            const c = { x: f1.cx + (b.x1 - f0.cx) * f1.sx, y: f1.cy + (b.y1 - f0.cy) * f1.sy };
            n.x1 = c.x; n.y1 = c.y; n.x2 = c.x + (b.x2 - b.x1) * k; n.y2 = c.y + (b.y2 - b.y1) * k;
            return n;
        }
        return mapPts(b, (x, y) => ({ x: f1.cx + (x - f0.cx) * f1.sx, y: f1.cy + (y - f0.cy) * f1.sy }));
    }

    stage.addEventListener('pointerdown', (e) => {
        if (e.target !== canvas) return;
        snapAlt = e.altKey;
        const p = localPt(e);
        pointers.set(e.pointerId, p);
        stage.setPointerCapture(e.pointerId);
        if (pointers.size === 2) {
            // второй палец — отменяем начатое действие и переходим в жест
            cancelCurrent(); startPinch(); render();
            return;
        }
        if (pointers.size > 2) return;
        if (lblEd) closeLabel(true);
        const sb = !textEd && e.button === 0 && solveBtnAt(p.x, p.y);
        if (sb) { pointers.delete(e.pointerId); const it = byId(sb.id); if (it) solveItem(it); return; }
        if (textEd) { closeText(); if (tool === 'text') return; }
        closeMenus();
        const w = toWorld(p.x, p.y);
        if (tool === 'pan' || spaceDown || e.button === 1) {
            panDrag = { sx: p.x, sy: p.y, vx: view.x, vy: view.y };
            stage.classList.add('drag');
            return;
        }
        if (e.button !== 0) return;
        if (tool === 'select') {
            const h = handleAt(p.x, p.y), one = selOne();
            if (h === 'del') { deleteSelected(); return; }
            if (h === 'edit') { editItem(one); return; }
            if (h && one) {
                const f0 = frameOf(one);
                if (h === 'r3') {
                    drag = { mode: 'rot3', before: clone(one), p0: p, glue: [], tgts: new Map() };
                } else if (h === 'rot') {
                    const g = buildGlue([one], new Set([one.id]));
                    drag = { mode: 'rotate', before: clone(one), f0, a0: Math.atan2(w.y - f0.cy, w.x - f0.cx), glue: g.glue, tgts: g.tgts };
                } else if (h[0] === 'v') {
                    const i = +h.slice(1), v = getV(one)[i];
                    const g = buildGlue([one], new Set([one.id]));
                    const glue = g.glue.filter((x) => x.i === i);
                    drag = { mode: 'vertex', before: clone(one), i, glue, tgts: g.tgts, except: new Set([one.id, ...glue.map((x) => x.tgt)]), v0: v };
                } else {
                    const g = buildGlue([one], new Set([one.id]));
                    drag = { mode: 'scale', hid: h, before: clone(one), f0, glue: g.glue, tgts: g.tgts };
                }
                render();
                return;
            }
            const add = e.shiftKey || e.ctrlKey || e.metaKey;
            const it = topHit(w.x, w.y, 6 / view.k, true);
            if (it) {
                if (add) { sel = sel.includes(it.id) ? sel.filter((x) => x !== it.id) : sel.concat(it.id); render(); return; }
                const was = sel.includes(it.id), alone = was && sel.length === 1;
                if (!was) sel = [it.id];
                startMove(w);
                if (was && sel.length > 1) drag.only = it.id;   // щелчок без сдвига — выделить только его
                if (alone) drag.edit = { id: it.id, w };         // щелчок по уже выделенному — правка
            } else {
                if (!add) sel = [];
                drag = { mode: 'marquee', x0: w.x, y0: w.y, x1: w.x, y1: w.y, base: sel.slice() };
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
        if (tool === 'angle' && !geo) {
            // щелчок внутри уже нарисованного угла — только дуга с градусной мерой
            const sa = sideAngleAt(w);
            if (sa) { const it = { id: rid(12), z: newZ(), t: 'angle', arc: 1, c: color, w: size, p: sa }; if (commit({ add: [it] }) !== false) selectMade([it]); return; }
        }
        if (tool === 'poly' || tool === 'angle') { geoClick(snap(w), p); return; }
        if (tool === 'mark') { markAt(w); return; }
        if (tool === 'extend') { extendAt(w); return; }
        if (tool === 'shape') {
            const q = snap(w);
            cur = { t: 'shapeDraft', sid: shapeId, c: color, w: size, x1: q.x, y1: q.y, x2: q.x, y2: q.y };
            render();
            return;
        }
        if (tool === 'circle' || tool === 'line' || tool === 'arrow') {
            const q = snap(w);
            cur = { ...styleFor(tool), t: tool, c: color, w: size, x1: q.x, y1: q.y, x2: q.x, y2: q.y };
            render();
            return;
        }
        if (tool === 'pen') {
            cur = { t: 'pen', v: 2, c: color, w: size, th: penCfg.th, tp: penCfg.tp, p: [w.x, w.y], pr: [penPr(e, .5)], raw: w, lt: e.timeStamp };
        } else if (tool === 'marker') {
            cur = { t: tool, c: color, w: size * 4, p: [w.x, w.y] };
        } else {
            cur = { ...styleFor(tool), t: tool, c: color, w: size, x1: w.x, y1: w.y, x2: w.x, y2: w.y };
        }
        render();
    });
    // нажим: настоящий у стилуса, у мыши/пальца — по скорости (быстрее — тоньше, как у ручки)
    function penPr(e, prev, speed) {
        if (penCfg.st && e.pointerType === 'pen' && e.pressure > 0) return Math.round(e.pressure * 100) / 100;
        if (speed === undefined) return prev;
        const target = Math.max(0, Math.min(1, 1 - speed / 2.2));
        return Math.round((prev + (target - prev) * .35) * 100) / 100;
    }
    function dragTo(w, e) {
        if (drag.mode === 'marquee') {
            drag.x1 = w.x; drag.y1 = w.y;
            const x1 = Math.min(drag.x0, w.x), x2 = Math.max(drag.x0, w.x), y1 = Math.min(drag.y0, w.y), y2 = Math.max(drag.y0, w.y);
            const inR = items.filter((it) => { const b = bounds(it); return b.x < x2 && b.x + b.w > x1 && b.y < y2 && b.y + b.h > y1; }).map((i) => i.id);
            sel = [...new Set(drag.base.concat(inR))];
            return;
        }
        if (drag.mode === 'move') {
            let dx = w.x - drag.w0.x, dy = w.y - drag.w0.y;
            if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
            else if (drag.anchor) {
                const ex = new Set([...drag.ids, ...drag.tgts.keys()]);
                const q = snap({ x: drag.anchor.x + dx, y: drag.anchor.y + dy }, ex);
                if (snapHint) { dx = q.x - drag.anchor.x; dy = q.y - drag.anchor.y; }
            }
            applyDrag(drag.befores.map((b) => moved(b, dx, dy)));
            return;
        }
        const b = drag.before;
        if (drag.mode === 'vertex') {
            let q = snap(w, drag.except);
            if (e.shiftKey && (b.t === 'line' || b.t === 'arrow')) {
                const o = getV(b)[1 - drag.i];
                const a = Math.round(Math.atan2(w.y - o[1], w.x - o[0]) / (Math.PI / 12)) * (Math.PI / 12), L = Math.hypot(w.x - o[0], w.y - o[1]);
                q = { x: o[0] + L * Math.cos(a), y: o[1] + L * Math.sin(a) };
            }
            const n = clone(b); setV(n, drag.i, q.x, q.y);
            applyDrag([n]);
            return;
        }
        if (drag.mode === 'rot3') {
            // вращение тела в пространстве: влево-вправо — вокруг вертикали, вверх-вниз — наклон
            const s = toScreen(w.x, w.y), n = clone(b);
            n.yaw = b.yaw + (s.x - drag.p0.x) * .012;
            n.pitch = Math.max(-1.55, Math.min(1.55, b.pitch + (s.y - drag.p0.y) * .012));
            solidFit(n);
            applyDrag([n]);
            return;
        }
        if (drag.mode === 'rotate') {
            const f = drag.f0;
            let a = Math.atan2(w.y - f.cy, w.x - f.cx) - drag.a0;
            if (e.shiftKey) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12);
            let n;
            if (ROT[b.t]) {
                n = clone(b);
                let r = (b.rot || 0) + a;
                r = Math.atan2(Math.sin(r), Math.cos(r));
                if (Math.abs(r) < .02) r = 0;              // притягиваем к «ровно»
                n.rot = r;
            } else n = mapPts(b, (x, y) => rotPt(x, y, f.cx, f.cy, a));
            applyDrag([n]);
            return;
        }
        if (drag.mode === 'scale') {
            const keep = KEEP[b.t] ? !e.shiftKey : e.shiftKey;
            const f1 = scaleFrame(drag.f0, drag.hid, w, keep);
            applyDrag([applyFrame(b, drag.f0, f1)]);
        }
    }
    stage.addEventListener('pointermove', (e) => {
        const p = localPt(e);
        snapAlt = e.altKey;
        if (shared) sendCursor(toWorld(p.x, p.y));
        if (geo) { const q = snap(toWorld(p.x, p.y)); geo.hx = q.x; geo.hy = q.y; render(); }
        if (!pointers.has(e.pointerId)) {
            if (tool === 'select') {
                const h = handleAt(p.x, p.y), w = toWorld(p.x, p.y);
                const CUR = { r3: 'grab', nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', rot: 'grab', del: 'pointer', edit: 'pointer' };
                stage.style.cursor = h ? CUR[h] || 'move' : topHit(w.x, w.y, 6 / view.k, true) ? 'move' : '';
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
        if (drag) { dragTo(toWorld(p.x, p.y), e); render(); return; }
        if (!cur) return;
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of evs.length ? evs : [e]) {
            const lp = localPt(ev), w = toWorld(lp.x, lp.y);
            if (cur.t === 'erase') eraseAt(w.x, w.y);
            else if (cur.t === 'pen') {
                // стабилизатор: точка «догоняет» курсор, сглаживая дрожание руки
                const n = cur.p.length, lx = cur.p[n - 2], ly = cur.p[n - 1];
                const k = 1 - penCfg.sm * .82;
                const nx = lx + (w.x - lx) * k, ny = ly + (w.y - ly) * k;
                const dScr = Math.hypot(nx - lx, ny - ly) * view.k;
                cur.raw = w;
                if (dScr > .8) {
                    const dt = Math.max(1, ev.timeStamp - cur.lt);
                    cur.lt = ev.timeStamp;
                    cur.p.push(nx, ny);
                    cur.pr.push(penPr(ev, cur.pr[cur.pr.length - 1], Math.hypot(w.x - lx, w.y - ly) * view.k / dt));
                }
            } else if (cur.p) {
                const n = cur.p.length;
                if (Math.hypot(w.x - cur.p[n - 2], w.y - cur.p[n - 1]) * view.k > 1.2) cur.p.push(w.x, w.y);
            } else {
                let x = w.x, y = w.y;
                if (e.shiftKey) {
                    if (cur.t === 'rect' || cur.t === 'ellipse' || cur.t === 'shapeDraft') {
                        const m = Math.max(Math.abs(x - cur.x1), Math.abs(y - cur.y1));
                        x = cur.x1 + Math.sign(x - cur.x1 || 1) * m; y = cur.y1 + Math.sign(y - cur.y1 || 1) * m;
                    } else {
                        // шаг 15°
                        const a = Math.round(Math.atan2(y - cur.y1, x - cur.x1) / (Math.PI / 12)) * (Math.PI / 12);
                        const L = Math.hypot(x - cur.x1, y - cur.y1);
                        x = cur.x1 + L * Math.cos(a); y = cur.y1 + L * Math.sin(a);
                    }
                }
                if (!e.shiftKey && (cur.t === 'line' || cur.t === 'arrow' || cur.t === 'circle' || cur.t === 'rect' || cur.t === 'ellipse' || cur.t === 'shapeDraft')) { const q = snap({ x, y }); x = q.x; y = q.y; }
                cur.x2 = x; cur.y2 = y;
            }
        }
        if (cur.t !== 'erase') { render(); sendDraft(cur); }
    });
    function endPointer(e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        snapHint = null;
        if (pinch) { if (pointers.size < 2) pinch = null; saveView(); return; }
        if (panDrag) { panDrag = null; stage.classList.remove('drag'); saveView(); return; }
        if (drag) {
            const d = drag;
            drag = null;
            if (d.only && !d.moved) sel = [d.only];
            if (d.edit && !d.moved) { const it = byId(d.edit.id); render(); if (it) editItem(it, it.t === 'text' || it.t === 'plot' || it.t === 'tex' ? null : d.edit.w); return; }
            if (d.mode !== 'marquee' && d.moved) {
                const pairs = [];
                for (const b of (d.befores || [d.before])) { const a = byId(b.id); if (a) pairs.push([b, clone(a)]); }
                d.tgts.forEach((b, id) => { const a = byId(id); if (a) pairs.push([b, clone(a)]); });
                record({ mod: pairs });
                putItems(pairs.map((x) => x[1]));
            }
            render();
            return;
        }
        if (!cur) return;
        if (cur.t === 'erase') {
            if (cur.erased.length) record({ del: cur.erased });
        } else if (cur.t === 'shapeDraft') {
            let f = draftBox(cur);
            if (!f) { const sh = SHAPES.find((s) => s.id === cur.sid), k = 1 / view.k; f = { x: cur.x1 - 80 * k, y: cur.y1 - 65 * k, w: 160 * k, h: 130 * k }; if (sh && sh.v === undefined && sh.g) { const g = sh.g(); f.h = f.w * g.bh / g.bw; } }
            const made = buildShapeItems(cur.sid, f.x, f.y, f.w, f.h, cur).map((x, i) => Object.assign(x, { id: rid(12), z: newZ() + i * 1e-3 }));
            if (commit({ add: made }) !== false) selectMade(made);
        } else {
            if (cur.t === 'pen') {
                // догоняем последнюю точку и чистим служебные поля
                const n = cur.p.length;
                if (cur.raw && Math.hypot(cur.raw.x - cur.p[n - 2], cur.raw.y - cur.p[n - 1]) * view.k > .5) { cur.p.push(cur.raw.x, cur.raw.y); cur.pr.push(cur.pr[cur.pr.length - 1]); }
                delete cur.raw; delete cur.lt;
                cur.p = cur.p.map((v) => Math.round(v * 100) / 100);
            }
            const tiny = !cur.p && Math.hypot(cur.x2 - cur.x1, cur.y2 - cur.y1) * view.k < 3;
            if (!tiny) {
                const it = Object.assign({ id: rid(12), z: newZ() }, cur, styleFor(cur.t));
                if (commit({ add: [it] }) !== false && SPECIAL[it.t]) selectMade([it]);
            }
        }
        cur = null;
        sendDraft(null);
        render();
    }
    // колёсико (средняя кнопка) — только сдвиг доски, без автопрокрутки страницы браузером
    stage.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
    stage.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
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
    // ---------- буфер обмена: Ctrl+C / Ctrl+X / Ctrl+V для любых объектов доски.
    // Объекты кладутся в системный буфер текстом «mf-board:[…]» — вставляются и на другой доске,
    // и в другой вкладке; обычный текст из буфера становится текстом на доске, картинка — картинкой.
    const busyInput = () => textEd || lblEd || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)
        || (document.activeElement && document.activeElement.isContentEditable) || !$('bdMathDlg').hidden;
    let clip = null, pasteN = 0;
    function copySel(e) {
        const its = selItems();
        if (busyInput() || !its.length) return false;
        clip = its.map(clone);
        pasteN = 0;
        try { e.clipboardData.setData('text/plain', 'mf-board:' + JSON.stringify(clip)); e.preventDefault(); } catch (err) {}
        return true;
    }
    document.addEventListener('copy', (e) => { if (copySel(e)) toast(clip.length > 1 ? 'Скопировано объектов: ' + clip.length : 'Скопировано'); });
    document.addEventListener('cut', (e) => { if (copySel(e)) deleteSelected(); });
    function pasteItems(list) {
        if (!list || !list.length) return;
        pasteN++;
        // рядом с оригиналом, каждая следующая вставка — ещё чуть дальше;
        // если оригинал не виден на экране — в центр экрана
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        for (const it of list) { const b = bounds(it); x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.w); y2 = Math.max(y2, b.y + b.h); }
        const vx1 = view.x, vy1 = view.y, vx2 = view.x + W / view.k, vy2 = view.y + H / view.k;
        let dx = 20 * pasteN / view.k, dy = dx;
        if (x2 < vx1 || x1 > vx2 || y2 < vy1 || y1 > vy2) { const c = toWorld(W / 2, H / 2); dx = c.x - (x1 + x2) / 2; dy = c.y - (y1 + y2) / 2; }
        const copies = list.map((it) => Object.assign(moved(it, dx, dy), { id: rid(12), z: newZ() }));
        if (commit({ add: copies }) === false) return;
        setTool('select'); sel = copies.map((c) => c.id); render();
        if (copies.some((c) => c.t === 'tex' || c.t === 'plot' || (c.t === 'text' && hasMath(c.text)))) loadMathJax().then(() => { layoutCache.clear(); render(); }, () => {});
    }
    document.addEventListener('paste', (e) => {
        if (busyInput()) return;
        const f = [...(e.clipboardData && e.clipboardData.files || [])].find((x) => /^image\//.test(x.type));
        if (f) { e.preventDefault(); addImageFile(f); return; }
        const t = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
        e.preventDefault();
        if (/^mf-board:/.test(t)) {
            let list = null;
            try { list = JSON.parse(t.slice(9)); } catch (err) {}
            if (Array.isArray(list)) { if (JSON.stringify(list) !== JSON.stringify(clip)) { clip = list; pasteN = 0; } pasteItems(list); }
            return;
        }
        if (t.trim()) {
            const c = toWorld(W / 2, H / 2), it = { id: rid(12), z: newZ(), t: 'text', x: c.x, y: c.y, s: (12 + size * 3) / view.k, c: color, w: 0, text: t.replace(/\s+$/, '').slice(0, 5000) };
            commit({ add: [it] }); setTool('select'); sel = [it.id]; render();
        } else if (clip) pasteItems(clip);
    });

    // ================= ПАНЕЛЬ =================
    function setTool(t) {
        if (textEd) closeText();
        if (lblEd) closeLabel(true);
        if (geo) finishGeo(false);
        tool = t;
        const sb = $('bdShapesBtn');
        if (sb) {
            sb.classList.toggle('on', !!SHAPE_TOOLS[t]);
            const sh = SHAPES.find((x) => x.id === shapeId);
            sb.querySelector('i').innerHTML = t === 'shape' && sh ? shapeIcon(sh) : SHAPE_TOOLS[t] && ICONS[t] ? toolIcon(t) : shapeIcon(POLY_SH[0]);
        }
        $('bdPenBtn').hidden = t !== 'pen';
        if (t !== 'select') sel = [];
        stage.style.cursor = '';
        document.querySelectorAll('#bdTools .bd-btn').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
        stage.className = 'bd-stage ' + (t === 'pan' ? 't-pan' : t === 'text' ? 't-text' : t === 'select' ? 't-select' : 't-draw');
        render();
    }
    function deleteSelected() {
        const its = selItems();
        if (its.length) { commit({ del: its.map(clone) }); sel = []; render(); }
    }
    function buildBar() {
        $('bdTools').innerHTML = TOOLS.map(([id, title]) =>
            `<button class="bd-btn" data-tool="${id}" title="${title}" aria-label="${title}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[id]}</svg></button>`).join('');
        $('bdTools').insertAdjacentHTML('beforeend',
            '<button class="bd-btn bd-shbtn" id="bdShapesBtn" title="Фигуры: многоугольники, окружности, тела — выберите и растяните на доске" aria-label="Фигуры"><i></i><b>▾</b></button>' +
            '<button class="bd-btn" id="bdPenBtn" title="Настройки пера: сглаживание, нажим, сужение концов" aria-label="Настройки пера" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg></button>');
        $('bdTools').addEventListener('click', (e) => { const b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
        buildMenus();

        $('bdColors').innerHTML = COLORS.map((c) =>
            `<button class="bd-sw${c === 'contrast' ? ' bd-sw-x' : ''}" data-c="${c}" title="${c === 'ink' ? 'Основной: белый на тёмной теме, чёрный на светлой' : c === 'contrast' ? 'Контрастный: сам подстраивается под фон и всё, что под линией' : c}" aria-label="Цвет ${c === 'ink' ? 'основной' : c === 'contrast' ? 'контрастный' : c}"></button>`).join('') +
            '<label class="bd-sw" title="Свой цвет" style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"><input type="color" id="bdPick" aria-label="Свой цвет"></label>';
        const paintSw = () => document.querySelectorAll('#bdColors [data-c]').forEach((b) => {
            if (b.dataset.c !== 'contrast') b.style.background = paint(b.dataset.c);
            b.classList.toggle('on', b.dataset.c === color);
        });
        $('bdColors').addEventListener('click', (e) => {
            const b = e.target.closest('[data-c]'); if (!b) return;
            color = b.dataset.c; paintSw();
            if (tool === 'select' && sel.length) { applyToSel((n) => { if (n.t !== 'img') n.c = color; }); return; }
            if (tool === 'eraser' || tool === 'pan' || tool === 'select') setTool('pen');
        });
        $('bdPick').addEventListener('input', (e) => { color = e.target.value; paintSw(); });
        window.addEventListener('mf-board-theme', paintSw);

        $('bdSizes').innerHTML = SIZES.map((s) =>
            `<button class="bd-btn bd-size" data-s="${s}" title="Толщина ${s}" aria-label="Толщина ${s}"><i style="width:${Math.min(4 + s, 18)}px;height:${Math.min(4 + s, 18)}px"></i></button>`).join('');
        $('bdSizes').insertAdjacentHTML('beforeend',
            '<label class="bd-range-w" title="Толщина линии"><input type="range" id="bdSizeR" min="1" max="40" step="1"><b id="bdSizeV"></b></label>' +
            '<button class="bd-btn bd-lsbtn" id="bdLsBtn" title="Вид линии: сплошная, пунктир, точки, штрихпунктир, двойная" aria-label="Вид линии"></button>');
        const syncSize = () => {
            $('bdSizeR').value = size; $('bdSizeV').textContent = size;
            document.querySelectorAll('#bdSizes .bd-size').forEach((x) => x.classList.toggle('on', +x.dataset.s === size));
        };
        // толщина: и для новых линий, и для выделенных объектов
        const applySize = () => applyToSel((n) => {
            if (n.t === 'vec' || n.t === 'solid') n.lw = 1.5 + size * .5;
            else if (n.t === 'marker') n.w = size * 4;
            else if (STYLED[n.t] || n.t === 'pen' || n.t === 'point' || n.t === 'angle') n.w = size;
        });
        $('bdSizes').addEventListener('click', (e) => {
            const b = e.target.closest('[data-s]'); if (!b) return;
            size = +b.dataset.s; syncSize(); applySize();
        });
        $('bdSizeR').addEventListener('input', () => { size = +$('bdSizeR').value; syncSize(); });
        $('bdSizeR').addEventListener('change', applySize);
        syncSize();
        // вид линии
        const LS = [['solid', 'Сплошная'], ['dash', 'Пунктир'], ['long', 'Длинный штрих'], ['dot', 'Точки'], ['dashdot', 'Штрихпунктир'], ['double', 'Двойная']];
        const lsSvg = (v) => {
            const d = { solid: '', dash: ' stroke-dasharray="5 3"', long: ' stroke-dasharray="9 3"', dot: ' stroke-dasharray=".1 3.2" stroke-linecap="round"', dashdot: ' stroke-dasharray="7 2.5 .1 2.5" stroke-linecap="round"' }[v];
            return v === 'double' ? '<svg viewBox="0 0 28 12"><path d="M2 4h24M2 8h24" stroke="currentColor" stroke-width="1.5"/></svg>'
                : `<svg viewBox="0 0 28 12"><path d="M2 6h24" stroke="currentColor" stroke-width="2.2"${d}/></svg>`;
        };
        $('bdLsMenu').innerHTML = '<div class="bd-ls">' + LS.map(([v, n]) => `<button class="bd-mi bd-lsi" data-ls="${v}" title="${n}">${lsSvg(v)}<span>${n}</span></button>`).join('') + '</div>' +
            '<label class="bd-lsdl">Длина штриха / расстояние <input type="range" id="bdLsDl" min="40" max="300" step="10"></label>';
        const syncLs = () => {
            $('bdLsBtn').innerHTML = lsSvg(lineStyle.ls);
            $('bdLsMenu').querySelectorAll('[data-ls]').forEach((b) => b.classList.toggle('on', b.dataset.ls === lineStyle.ls));
            $('bdLsDl').value = Math.round(lineStyle.dl * 100);
        };
        const applyLs = () => applyToSel((n) => { if (STYLED[n.t]) Object.assign(n, styleFor(n.t)); if (STYLED[n.t] && lineStyle.ls === 'solid') { delete n.ls; delete n.dl; } });
        $('bdLsBtn').onclick = () => toggleMenu('bdLsMenu', $('bdLsBtn'));
        $('bdLsMenu').addEventListener('click', (e) => {
            const b = e.target.closest('[data-ls]'); if (!b) return;
            lineStyle.ls = b.dataset.ls; lsSet('mf-board-ls', lineStyle); syncLs(); applyLs();
        });
        $('bdLsDl').addEventListener('input', () => { lineStyle.dl = $('bdLsDl').value / 100; lsSet('mf-board-ls', lineStyle); });
        $('bdLsDl').addEventListener('change', applyLs);
        syncLs();
        paintSw();

        $('bdBg').value = bg;
        $('bdBg').addEventListener('change', (e) => setBg(e.target.value));
        $('bdUndo').onclick = doUndo;
        $('bdRedo').onclick = doRedo;
        $('bdClear').onclick = clearBoard;
        $('bdZoomIn').onclick = () => zoomAt(W / 2, H / 2, 1.25);
        $('bdZoomOut').onclick = () => zoomAt(W / 2, H / 2, 0.8);
        $('bdZoom').onclick = () => { view = { x: -W / 2, y: -H / 2, k: 1 }; zoomAt(0, 0, 1); };
        $('bdImg').onclick = () => $('bdFile').click();
        $('bdFile').onchange = (e) => { [...e.target.files].forEach((f, i) => addImageFile(f, i ? toWorld(W / 2 + i * 30, H / 2 + i * 30) : null)); e.target.value = ''; };
        $('bdSave').onclick = exportPng;
        $('bdFull').onclick = toggleFull;
        $('bdShare').onclick = share;
        $('bdGraph').onclick = () => openMath('g');
        $('bdLeave').onclick = () => goLocal(lsGet(CUR, ''));
        bindBoards();
    }

    function toggleFull() {
        const on = !boardEl.classList.contains('full');
        boardEl.classList.toggle('full', on);
        // шапка сайта (fixed, свой z-index) перекрывала панель доски — и кнопку выхода
        document.documentElement.classList.toggle('bd-fs', on);
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
        g.fillStyle = boardFill();
        g.fillRect(0, 0, c.width, c.height);
        g.scale(scale, scale);
        drawBg(g, v.w, v.h, v);
        g.translate(-v.x, -v.y);
        drawList(g, items);
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

    // ================= УПРАВЛЕНИЕ ДОСКАМИ =================
    const fmtDate = (t) => { try { return new Date(t).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
    const goLocal = (id) => { location.href = location.pathname + '?l=' + id; };
    const goCloud = (id) => { location.href = location.pathname + '?b=' + id; };
    const I_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
    const I_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
    function boardRow(b, kind, isCur, canEdit) {
        return `<li class="bd-brow${isCur ? ' cur' : ''}" data-id="${b.id}" data-kind="${kind}">
            <button class="bd-bopen" data-act="open"><b>${esc(b.name || 'Без названия')}</b><small>${isCur ? 'открыта сейчас' : b.updated ? 'изменена ' + fmtDate(b.updated) : ''}</small></button>
            ${canEdit ? `<button class="bd-btn" data-act="ren" title="Переименовать" aria-label="Переименовать">${I_EDIT}</button>` : ''}
            <button class="bd-btn" data-act="del" title="${kind === 'recent' ? 'Убрать из списка' : 'Удалить'}" aria-label="Удалить">${kind === 'recent' ? '×' : I_DEL}</button></li>`;
    }
    let cloudCache = [];
    async function openBoards() {
        const dlg = $('bdBoardsDlg');
        dlg.hidden = false;
        const loc = localList().slice().sort((a, b) => b.updated - a.updated);
        $('bdLocalList').innerHTML = loc.map((b) => boardRow(b, 'local', !shared && b.id === localId, true)).join('');
        $('bdCloudList').innerHTML = '<li class="bd-bnote">Загрузка…</li>';
        $('bdRecentList').innerHTML = '';
        $('bdCloudCount').textContent = '';
        let au;
        try { au = await waitUser(); } catch (e) { $('bdCloudList').innerHTML = '<li class="bd-bnote">Сервер недоступен</li>'; return; }
        if (!au.user) {
            $('bdCloudList').innerHTML = '<li class="bd-bnote">Общие доски хранятся на сервере — <button class="bd-link" data-act="login">войдите</button>, чтобы создавать их и рисовать вместе.</li>';
            return;
        }
        const admin = await adminOf(au.user);
        try {
            const snap = await au.db.collection('boards').where('owner', '==', au.user.uid).get();
            cloudCache = snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        } catch (e) { cloudCache = []; }
        $('bdCloudCount').textContent = admin ? 'без ограничений' : cloudCache.length + ' из ' + CLOUD_MAX_BOARDS;
        $('bdCloudList').innerHTML = cloudCache.length
            ? cloudCache.map((b) => boardRow({ id: b.id, name: b.name || 'Общая доска', updated: b.updatedAt }, 'cloud', shared && shared.id === b.id, true)).join('')
            : '<li class="bd-bnote">Пока нет — создайте новую или нажмите «Поделиться» на личной доске.</li>';
        const own = new Set(cloudCache.map((b) => b.id));
        const rec = lsGet(RECENT, []).filter((r) => !own.has(r.id) && !r.own);
        $('bdRecentWrap').hidden = !rec.length;
        $('bdRecentList').innerHTML = rec.map((r) => boardRow({ id: r.id, name: r.name, updated: r.t }, 'recent', shared && shared.id === r.id, false)).join('');
    }
    async function boardAction(act, id, kind) {
        if (act === 'login') { $('bdBoardsDlg').hidden = true; needLogin(' '); return; }
        if (act === 'open') return kind === 'local' ? goLocal(id) : goCloud(id);
        if (kind === 'recent' && act === 'del') { lsSet(RECENT, lsGet(RECENT, []).filter((r) => r.id !== id)); return openBoards(); }
        if (kind === 'local') {
            const list = localList(), b = list.find((x) => x.id === id); if (!b) return;
            if (act === 'ren') {
                const n = prompt('Название доски', b.name); if (!n || !n.trim()) return;
                b.name = n.trim().slice(0, 80); lsSet(IDX, list);
                if (id === localId && !shared) setTitle(b.name);
            } else if (act === 'del') {
                if (!confirm('Удалить доску «' + b.name + '»? Это нельзя отменить.')) return;
                await idbDel(id).catch(() => {});
                lsSet(IDX, list.filter((x) => x.id !== id));
                if (id === localId && !shared) { const rest = localList(); return rest.length ? goLocal(rest[0].id) : newLocal().then(goLocal); }
            }
            return openBoards();
        }
        // общая доска (только своя)
        const db = await waitFirebase(), ref = db.collection('boards').doc(id), b = cloudCache.find((x) => x.id === id);
        try {
            if (act === 'ren') {
                const n = prompt('Название доски', b ? b.name || '' : ''); if (!n || !n.trim()) return;
                await ref.update({ name: n.trim().slice(0, 80), updatedAt: Date.now() });
            } else if (act === 'del') {
                if (!confirm('Удалить общую доску «' + (b && b.name || 'Общая доска') + '» у всех участников? Это нельзя отменить.')) return;
                for (const sub of ['items', 'peers']) {
                    const snap = await ref.collection(sub).get();
                    for (let i = 0; i < snap.docs.length; i += 400) {
                        const bt = db.batch(); snap.docs.slice(i, i + 400).forEach((d) => bt.delete(d.ref)); await bt.commit();
                    }
                }
                await ref.delete();
                lsSet(RECENT, lsGet(RECENT, []).filter((r) => r.id !== id));
                if (shared && shared.id === id) return goLocal(lsGet(CUR, ''));
            }
        } catch (e) { syncError(e); }
        openBoards();
    }
    function bindBoards() {
        $('bdBoards').onclick = openBoards;
        $('bdBoardsDlg').addEventListener('click', (e) => {
            if (e.target === $('bdBoardsDlg') || e.target.closest('[data-close]')) { $('bdBoardsDlg').hidden = true; return; }
            const a = e.target.closest('[data-act]'); if (!a) return;
            const li = a.closest('[data-id]');
            boardAction(a.dataset.act, li && li.dataset.id, li && li.dataset.kind);
        });
        $('bdNewLocal').onclick = () => newLocal().then(goLocal);
        $('bdNewCloud').onclick = async () => {
            $('bdNewCloud').disabled = true;
            try { const id = await createCloud('Общая доска ' + (cloudCache.length + 1), false); if (id) goCloud(id); }
            catch (e) { syncError(e); } finally { $('bdNewCloud').disabled = false; }
        };
        $('bdClearCur').onclick = () => { $('bdBoardsDlg').hidden = true; clearBoard(); };
    }
    function clearBoard() {
        if (!items.length) { toast('Доска уже пустая'); return; }
        if (!confirm(shared ? 'Очистить доску у всех участников? Действие можно отменить.' : 'Очистить доску? Действие можно отменить.')) return;
        commit({ del: items.map(clone) }); render();
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

    // Текущий пользователь (дожидаемся, пока Firebase восстановит вход)
    function waitUser() {
        return waitFirebase().then((db) => new Promise((ok) => {
            const un = firebase.auth().onAuthStateChanged((u) => { un(); ok(u); });
        }).then((u) => ({ db, user: u })));
    }
    const adminOf = (u) => (u && typeof mfIsAdmin === 'function' ? mfIsAdmin(u).catch(() => false) : Promise.resolve(false));
    function needLogin(msg) {
        toast(msg || 'Общие доски хранятся на сервере — войдите в аккаунт');
        if (typeof window.openAuthModal === 'function') window.openAuthModal();
    }
    // Новая общая доска (копия текущего содержимого, если copy) — с проверкой лимита досок
    async function createCloud(name, copy) {
        const { db, user } = await waitUser();
        if (!user) { needLogin(); return null; }
        if (!(await adminOf(user))) {
            const mine = await db.collection('boards').where('owner', '==', user.uid).get();
            if (mine.size >= CLOUD_MAX_BOARDS) { toast('Можно создать не больше ' + CLOUD_MAX_BOARDS + ' общих досок — удалите ненужные в «Доски»'); return null; }
            if (copy && (items.length > CLOUD_MAX_ITEMS || items.reduce((a, it) => a + sizeOf(it), 0) > CLOUD_MAX_BYTES)) {
                toast('Доска слишком большая для общей (лимит ' + (CLOUD_MAX_BYTES >> 20) + ' МБ, ' + CLOUD_MAX_ITEMS + ' объектов)'); return null;
            }
        }
        const id = rid(20), ref = db.collection('boards').doc(id);
        await ref.set({ bg: copy ? bg : 'cells', name: String(name || 'Общая доска').slice(0, 80), createdAt: Date.now(), updatedAt: Date.now(), owner: user.uid });
        if (copy) {
            for (let i = 0; i < items.length; i += 400) {
                const b = db.batch();
                items.slice(i, i + 400).forEach((it) => b.set(ref.collection('items').doc(it.id), it));
                await b.commit();
            }
        }
        return id;
    }
    async function share() {
        if (shared) return showShare();
        $('bdShare').disabled = true;
        setStatus('wait', 'Создаю общую доску…');
        try {
            const cur = localList().find((b) => b.id === localId);
            const id = await createCloud(cur ? cur.name : 'Общая доска', true);
            if (!id) { setStatus('', ''); return; }
            const db = await waitFirebase();
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
        const au = await waitUser();
        db = db || au.db;
        if (!au.user) {
            setStatus('error', 'Общая доска — войдите в аккаунт, чтобы открыть её');
            needLogin('Чтобы рисовать на общей доске, войдите в аккаунт');
            firebase.auth().onAuthStateChanged((u) => { if (u) location.reload(); });
            return;
        }
        const noLimit = await adminOf(au.user);
        const ref = db.collection('boards').doc(id);
        let peerId;
        try { peerId = sessionStorage.getItem('mf-board-peer') || rid(12); sessionStorage.setItem('mf-board-peer', peerId); } catch (e) { peerId = rid(12); }
        const me = { name: myName(), color: PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)] };
        shared = { id, db, ref, peerId, peerRef: ref.collection('peers').doc(peerId), peers: new Map(), unsub: [], me, noLimit, owner: false };
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
        const bd = boardSnap.data() || {};
        shared.owner = bd.owner === au.user.uid;
        shared.name = bd.name || 'Общая доска';
        setTitle(shared.name);
        const rec = lsGet(RECENT, []).filter((r) => r.id !== id);
        rec.unshift({ id, name: shared.name, own: shared.owner, t: Date.now() });
        lsSet(RECENT, rec.slice(0, 30));
        let first = true;
        shared.unsub.push(ref.onSnapshot((d) => {
            const data = d.data();
            if (data && data.bg && data.bg !== bg) { bg = data.bg; $('bdBg').value = bg; render(); }
            if (data && data.name && data.name !== shared.name) { shared.name = data.name; setTitle(data.name); }
        }, syncError));
        shared.unsub.push(ref.collection('items').onSnapshot((snap) => {
            if (first) { items = []; first = false; }
            snap.docChanges().forEach((ch) => {
                const it = ch.doc.data();
                // объект, который я сейчас тяну или правлю, не перетираю своим же эхом
                if (drag && drag.before.id === it.id) return;
                if (textEd && textEd.existing && textEd.existing.id === it.id) return;
                const i = items.findIndex((x) => x.id === it.id);
                if (ch.type === 'removed') { if (i >= 0) items.splice(i, 1); sel = sel.filter((x) => x !== it.id); }
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
        if (!$('bdBoardsDlg').hidden) { if (e.key === 'Escape') $('bdBoardsDlg').hidden = true; return; }
        if (textEd || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;
        const k = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'я')) { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
        if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'н')) { e.preventDefault(); doRedo(); return; }
        if ((e.ctrlKey || e.metaKey) && (k === 'a' || k === 'ф')) { e.preventDefault(); setTool('select'); sel = items.map((i) => i.id); render(); return; }
        if ((e.ctrlKey || e.metaKey) && (k === 'd' || k === 'в') && sel.length) {
            // копия выделенного со сдвигом
            e.preventDefault();
            const d = 20 / view.k, copies = selItems().map((it) => Object.assign(moved(it, d, d), { id: rid(12), z: newZ() }));
            if (commit({ add: copies }) !== false) { sel = copies.map((c) => c.id); render(); }
            return;
        }
        if (sel.length && /^Arrow/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            const st = (e.shiftKey ? 10 : 1) / view.k, dx = e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, dy = e.key === 'ArrowUp' ? -st : e.key === 'ArrowDown' ? st : 0;
            const its = selItems();
            commit({ mod: its.map((it) => [clone(it), moved(it, dx, dy)]) }); render();
            return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if ((e.key === 'Delete' || e.key === 'Backspace') && sel.length) { e.preventDefault(); deleteSelected(); return; }
        if (e.code === 'Space') { spaceDown = true; stage.classList.add('t-pan'); e.preventDefault(); return; }
        if (e.code === 'KeyF') { toggleFull(); return; }
        if (e.code === 'KeyI') { $('bdFile').click(); return; }
        if (geo && e.key === 'Enter') { e.preventDefault(); finishGeo(true, false); return; }
        if (e.key === 'Escape') {
            if (!$('bdMathDlg').hidden) { closeMath(); return; }
            if (geo) { finishGeo(false); return; }
            if (!$('bdShareDlg').hidden) { $('bdShareDlg').hidden = true; return; }
            if (sel.length) { sel = []; render(); return; }
            if (boardEl.classList.contains('full')) { toggleFull(); return; }
        }
        const t = TOOLS.find((x) => 'Key' + x[2].toUpperCase() === e.code);
        if (t) setTool(t[0]);
        const ex = Object.keys(EXTRA_KEYS).find((x) => 'Key' + x.toUpperCase() === e.code);
        if (ex) { if (EXTRA_KEYS[ex] === 'shape') shapeId = 'prect'; setTool(EXTRA_KEYS[ex]); }
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
    ['bdMathDlg', 'bdShareDlg', 'bdBoardsDlg'].forEach((id) => document.body.appendChild($(id)));
    const sharedId = (params.get('b') || '').replace(/[^A-Za-z0-9]/g, '');
    (async () => {
    if (!sharedId) await loadLocal(params.get('l')).catch(() => {});
    buildBar();
    setTool('pen');
    syncHistory();
    $('bdZoom').textContent = Math.round(view.k * 100) + '%';
    new ResizeObserver(resize).observe(stage);
    resize();
    if (sharedId) joinShared(sharedId).catch(syncError);
    if (items.some((i) => i.t === 'tex' || i.t === 'plot')) loadMathJax().then(render, () => {});
    })();
})();

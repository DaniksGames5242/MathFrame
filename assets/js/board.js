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
        pan: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
    };
    const TOOLS = [
        ['select', 'Выбор и перемещение (V)', 'v'],
        ['pen', 'Перо (P)', 'p'], ['marker', 'Маркер-выделитель (M)', 'm'], ['eraser', 'Ластик (E)', 'e'],
        ['line', 'Отрезок (L)', 'l'], ['arrow', 'Стрелка (A)', 'a'], ['rect', 'Прямоугольник (R)', 'r'],
        ['ellipse', 'Эллипс (O)', 'o'], ['text', 'Текст (T)', 't'], ['pan', 'Рука — сдвиг (H)', 'h'],
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
        } else if (it.t === 'img') {
            const im = getImg(it);
            if (im.complete && im.naturalWidth) c.drawImage(im, it.x, it.y, it.w, it.h);
            else { c.globalAlpha = .4; c.strokeStyle = inkColor(); c.lineWidth = 1; c.setLineDash([6, 6]); c.strokeRect(it.x, it.y, it.w, it.h); }
        }
        c.restore();
    }

    // Рамка объекта в мировых координатах
    function bounds(it) {
        if (it.t === 'img') return { x: it.x, y: it.y, w: it.w, h: it.h };
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
        if (!it || it.t !== 'img') return false;
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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const sel = selected && byId(selected);
        if (sel && tool === 'select') {
            const b = bounds(sel);
            const x = (b.x - view.x) * view.k, y = (b.y - view.y) * view.k;
            ctx.strokeStyle = css('--accent') || '#f2a25c';
            ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
            ctx.strokeRect(x - 4, y - 4, b.w * view.k + 8, b.h * view.k + 8);
            ctx.setLineDash([]);
            if (sel.t === 'img') {
                ctx.fillStyle = ctx.strokeStyle;
                ctx.fillRect(x + b.w * view.k - HANDLE / 2, y + b.h * view.k - HANDLE / 2, HANDLE, HANDLE);
            }
        }
        if (shared) drawPeers();
    }

    // ================= ЛАСТИК / ПОПАДАНИЕ =================
    function distSeg(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
        let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - ax - t * dx, py - ay - t * dy);
    }
    function hit(it, x, y, r) {
        const tol = r + (it.t === 'img' ? 0 : it.w / 2);
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
        if (it.t === 'text' || it.t === 'img') {
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
        if (textEd || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;
        const k = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'я')) { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
        if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'н')) { e.preventDefault(); doRedo(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); deleteSelected(); return; }
        if (e.code === 'Space') { spaceDown = true; stage.classList.add('t-pan'); e.preventDefault(); return; }
        if (e.code === 'KeyF') { toggleFull(); return; }
        if (e.code === 'KeyI') { $('bdFile').click(); return; }
        if (e.key === 'Escape') {
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

    const sharedId = (params.get('b') || '').replace(/[^A-Za-z0-9]/g, '');
    if (!sharedId) loadLocal();
    buildBar();
    setTool('pen');
    syncHistory();
    $('bdZoom').textContent = Math.round(view.k * 100) + '%';
    new ResizeObserver(resize).observe(stage);
    resize();
    if (sharedId) joinShared(sharedId).catch(syncError);
})();

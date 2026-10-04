// ===== ЭЛЕКТРОННАЯ ДОСКА (pages/board.html, /board/) =====
// Векторная доска на <canvas>: каждый штрих/фигура хранится как объект в мировых
// координатах, поэтому поле бесконечное, масштаб не портит линии, а отмена — это
// просто снимки массива объектов. Состояние сохраняется в localStorage.
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const STORE = 'mf-board-v1';
    const MAX_HISTORY = 100;

    const ICONS = {
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
        ['pen', 'Перо (P)', 'p'], ['marker', 'Маркер-выделитель (M)', 'm'], ['eraser', 'Ластик (E)', 'e'],
        ['line', 'Отрезок (L)', 'l'], ['arrow', 'Стрелка (A)', 'a'], ['rect', 'Прямоугольник (R)', 'r'],
        ['ellipse', 'Эллипс (O)', 'o'], ['text', 'Текст (T)', 't'], ['pan', 'Рука — сдвиг (H)', 'h'],
    ];
    // 'ink' — цвет «по теме»: светлый на тёмной доске, тёмный на светлой.
    const COLORS = ['ink', '#e5484d', '#3e8bff', '#30a46c', '#f2a25c', '#9b6bff'];
    const SIZES = [2, 4, 8, 16];

    const stage = $('bdStage'), canvas = $('bdCanvas'), ctx = canvas.getContext('2d');
    const boardEl = $('board');

    let state = { items: [], bg: 'cells' };
    let view = { x: 0, y: 0, k: 1 };          // экран = (мир − (x,y)) · k
    let tool = 'pen', color = 'ink', size = 4;
    let undo = [], redo = [];
    let cur = null;                            // объект, который рисуется сейчас
    let spaceDown = false, panDrag = null;
    const pointers = new Map();
    let pinch = null;
    let textEd = null;
    let dpr = 1, W = 0, H = 0;
    let viewSet = false;                       // без сохранённого вида начало координат — в центре

    // ---------- хранение ----------
    function load() {
        try {
            const s = JSON.parse(localStorage.getItem(STORE) || 'null');
            if (s && Array.isArray(s.items)) {
                state = { items: s.items, bg: s.bg || 'cells' };
                if (s.view) { view = s.view; viewSet = true; }
            }
        } catch (e) {}
    }
    let saveT = 0;
    function save() {
        clearTimeout(saveT);
        saveT = setTimeout(() => {
            try { localStorage.setItem(STORE, JSON.stringify({ items: state.items, bg: state.bg, view })); } catch (e) {}
        }, 250);
    }
    function snapshot() {
        undo.push(JSON.stringify(state.items));
        if (undo.length > MAX_HISTORY) undo.shift();
        redo = [];
        syncHistory();
    }
    function syncHistory() {
        $('bdUndo').disabled = !undo.length;
        $('bdRedo').disabled = !redo.length;
    }
    function doUndo() {
        if (!undo.length) return;
        redo.push(JSON.stringify(state.items));
        state.items = JSON.parse(undo.pop());
        syncHistory(); render(); save();
    }
    function doRedo() {
        if (!redo.length) return;
        undo.push(JSON.stringify(state.items));
        state.items = JSON.parse(redo.pop());
        syncHistory(); render(); save();
    }

    // ---------- координаты ----------
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
        render(); save();
    }

    // ---------- отрисовка ----------
    const css = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();
    const isLight = () => document.documentElement.classList.contains('light');
    const inkColor = () => (isLight() ? '#1b2333' : '#eef2fb');
    const paint = (c) => (c === 'ink' ? inkColor() : c);

    function resize() {
        dpr = window.devicePixelRatio || 1;
        W = stage.clientWidth; H = stage.clientHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        if (!viewSet && W && H) { view = { x: -W / 2, y: -H / 2, k: 1 }; viewSet = true; }
        render();
    }

    function drawBg(c, w, h, v) {
        if (state.bg === 'none') return;
        const step = 25;
        let s = step * v.k;
        let mult = 1;
        while (s < 10) { s *= 5; mult *= 5; }   // при сильном отдалении — реже
        const st = step * mult;
        const line = isLight() ? 'rgba(40,60,110,' : 'rgba(170,190,240,';
        c.lineWidth = 1;
        if (state.bg === 'lines') {
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
        if (state.bg === 'grid') {
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
            it.s && String(it.text).split('\n').forEach((ln, i) => c.fillText(ln, it.x, it.y + i * it.s * 1.25));
        }
        c.restore();
    }
    const textFont = (s) => s + 'px ' + (css('--font-display') || 'sans-serif');

    function render() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        drawBg(ctx, W, H, view);
        ctx.setTransform(dpr * view.k, 0, 0, dpr * view.k, -view.x * view.k * dpr, -view.y * view.k * dpr);
        for (const it of state.items) drawItem(ctx, it);
        if (cur && cur.t !== 'erase') drawItem(ctx, cur);
    }

    // ---------- ластик: попадание в объект ----------
    function distSeg(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
        let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - ax - t * dx, py - ay - t * dy);
    }
    function hit(it, x, y, r) {
        const tol = r + it.w / 2;
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
        if (it.t === 'text') {
            ctx.font = textFont(it.s);
            const lines = String(it.text).split('\n');
            const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
            return x > it.x - r && x < it.x + w + r && y > it.y - r && y < it.y + lines.length * it.s * 1.25 + r;
        }
        return false;
    }
    function eraseAt(x, y) {
        const r = (size * 2 + 4) / view.k;
        const n = state.items.length;
        state.items = state.items.filter((it) => !hit(it, x, y, r));
        if (state.items.length !== n) { cur.changed = true; render(); }
    }

    // ---------- текст ----------
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
        textEd = { ta, wx, wy, s, col, existing };
        if (existing) { state.items = state.items.filter((i) => i !== existing); render(); }
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
            // правка: снимок до правки уже сделан при открытии
            if (text) state.items.push({ t: 'text', x: wx, y: wy, s, c: col, w: 0, text });
        } else if (text) {
            snapshot();
            state.items.push({ t: 'text', x: wx, y: wy, s, c: col, w: 0, text });
        }
        render(); save();
    }

    // ---------- указатель ----------
    function startPinch() {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
    stage.addEventListener('pointerdown', (e) => {
        if (e.target !== canvas) return;
        const p = localPt(e);
        pointers.set(e.pointerId, p);
        stage.setPointerCapture(e.pointerId);
        if (pointers.size === 2) {
            // второй палец — отменяем начатый штрих и переходим в жест
            if (cur && cur.t !== 'erase') cur = null;
            else if (cur && cur.t === 'erase' && cur.changed) { state.items = JSON.parse(undo.pop()); syncHistory(); }
            cur = null; panDrag = null;
            startPinch(); render();
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
        if (tool === 'text') {
            const ex = [...state.items].reverse().find((it) => it.t === 'text' && hit(it, w.x, w.y, 2));
            if (ex) { snapshot(); openText(ex.x, ex.y, ex); }
            else openText(w.x, w.y);
            e.preventDefault();
            return;
        }
        if (tool === 'eraser') {
            snapshot();
            cur = { t: 'erase', changed: false };
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
    stage.addEventListener('pointermove', (e) => {
        if (!pointers.has(e.pointerId)) return;
        const p = localPt(e);
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
        if (!cur) return;
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of evs.length ? evs : [e]) {
            const w = toWorld(...Object.values(localPt(ev)));
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
        if (cur.t !== 'erase') render();
    });
    function endPointer(e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        if (pinch) { if (pointers.size < 2) pinch = null; save(); return; }
        if (panDrag) { panDrag = null; stage.classList.remove('drag'); save(); return; }
        if (!cur) return;
        if (cur.t === 'erase') {
            if (!cur.changed) { undo.pop(); syncHistory(); }
        } else {
            const tiny = !cur.p && Math.hypot(cur.x2 - cur.x1, cur.y2 - cur.y1) * view.k < 3;
            if (!tiny) { snapshot(); state.items.push(cur); }
        }
        cur = null;
        render(); save();
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
            render(); save();
        }
    }, { passive: false });

    // ---------- панель ----------
    function setTool(t) {
        if (textEd) closeText();
        tool = t;
        document.querySelectorAll('#bdTools .bd-btn').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
        stage.className = 'bd-stage ' + (t === 'pan' ? 't-pan' : t === 'text' ? 't-text' : 't-draw');
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
            if (tool === 'eraser' || tool === 'pan') setTool('pen');
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

        $('bdBg').value = state.bg;
        $('bdBg').addEventListener('change', (e) => { state.bg = e.target.value; render(); save(); });
        $('bdUndo').onclick = doUndo;
        $('bdRedo').onclick = doRedo;
        $('bdClear').onclick = () => {
            if (!state.items.length || !confirm('Очистить доску? Действие можно отменить.')) return;
            snapshot(); state.items = []; render(); save();
        };
        $('bdZoomIn').onclick = () => zoomAt(W / 2, H / 2, 1.25);
        $('bdZoomOut').onclick = () => zoomAt(W / 2, H / 2, 0.8);
        $('bdZoom').onclick = () => { view = { x: -W / 2, y: -H / 2, k: 1 }; zoomAt(0, 0, 1); };
        $('bdSave').onclick = exportPng;
        $('bdFull').onclick = toggleFull;
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
        const add = (x, y, pad) => { minX = Math.min(minX, x - pad); minY = Math.min(minY, y - pad); maxX = Math.max(maxX, x + pad); maxY = Math.max(maxY, y + pad); };
        for (const it of state.items) {
            if (it.p) for (let i = 0; i < it.p.length; i += 2) add(it.p[i], it.p[i + 1], it.w);
            else if (it.t === 'text') {
                ctx.font = textFont(it.s);
                const ls = String(it.text).split('\n');
                add(it.x, it.y, 0);
                add(it.x + Math.max(...ls.map((l) => ctx.measureText(l).width)), it.y + ls.length * it.s * 1.25, 0);
            } else { add(it.x1, it.y1, it.w + 12); add(it.x2, it.y2, it.w + 12); }
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
        for (const it of state.items) drawItem(g, it);
        c.toBlob((b) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(b);
            a.download = 'mathframe-board-' + new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-') + '.png';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        });
    }

    // ---------- клавиатура ----------
    document.addEventListener('keydown', (e) => {
        if (textEd || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;
        const k = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'я')) { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
        if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'н')) { e.preventDefault(); doRedo(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.code === 'Space') { spaceDown = true; stage.classList.add('t-pan'); e.preventDefault(); return; }
        if (e.code === 'KeyF') { toggleFull(); return; }
        if (e.key === 'Escape' && boardEl.classList.contains('full')) { toggleFull(); return; }
        const t = TOOLS.find((x) => 'Key' + x[2].toUpperCase() === e.code);
        if (t) setTool(t[0]);
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && spaceDown) { spaceDown = false; if (tool !== 'pan') stage.classList.remove('t-pan'); }
    });

    // смена темы — перерисовать «основной» цвет и фон
    new MutationObserver(() => { render(); window.dispatchEvent(new Event('mf-board-theme')); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    load();
    buildBar();
    setTool('pen');
    syncHistory();
    $('bdZoom').textContent = Math.round(view.k * 100) + '%';
    new ResizeObserver(resize).observe(stage);
    resize();
})();

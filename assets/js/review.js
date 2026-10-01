// assets/js/review.js
// Страница /admin/review/ — проверка интерактивных примеров справочника.
//
// Примеры показываются по очереди так же, как в справочнике (compile → iframe,
// gms-embed.attachFrame: тема сайта, высота по содержимому). К каждому можно
// оставить заметки: выделенные области (снимок + прямоугольник), элементы сцены
// (ссылки на объекты кода со строками), подпись и объекты правки (компилятор /
// этот пример / другое — сколько угодно или ни одного), общую заметку и отметку
// «проверен». Всё хранится в IndexedDB и переживает перезагрузку.
//
// «Отправить все обработанные» отправляет только новые и изменённые заметки
// (у каждой rev — хэш содержимого, sentRev — что уже отправлено): в репозиторий
// (api/review-notes.js → data/review-notes/) или файлом .zip.
//
// Вкладка «Редактор» — визуальный редактор «Все элементы» в режиме справочника
// (gms-structured-editor.js), предложенный код прикладывается к заметкам.

import { attachFrame } from './gms-embed.js';
import * as SM from './gms-structured-model.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};
const TARGETS = [['compiler', 'Компилятор'], ['example', 'Этот пример'], ['other', 'Другое']];
const SCENE_KEYS = ['description', 'field width', 'field height', 'field depth'];

// ── IndexedDB ────────────────────────────────────────────────────────────────
let dbp = null;
function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
        const r = indexedDB.open('mf-review', 1);
        r.onupgradeneeded = () => { const s = r.result.createObjectStore('notes', { keyPath: 'id' }); s.createIndex('ex', 'exampleId'); };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
    return dbp;
}
async function tx(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
        const t = d.transaction('notes', mode);
        const out = fn(t.objectStore('notes'));
        t.oncomplete = () => res(out && out.result !== undefined ? out.result : out);
        t.onerror = () => rej(t.error);
    });
}
const allNotes = () => tx('readonly', (s) => s.getAll());
const putNote = (n) => tx('readwrite', (s) => s.put(n));
const delNote = (id) => tx('readwrite', (s) => s.delete(id));

// Хэш содержимого заметки: меняется только от того, что уходит в пакет.
function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function contentOf(n) {
    return JSON.stringify([n.kind, n.text || '', (n.targets || []).slice().sort(), (n.regions || []).map((r) => [r.x, r.y, r.w, r.h, r.image ? r.image.length : 0]),
        (n.elements || []).map((e) => [e.name, e.type, e.line]), n.proposedCode || '', !!n.checked, !!n.deleted, n.viewMode]);
}
const isEmpty = (n) => !n.deleted && !(n.text || '').trim() && !(n.targets || []).length && !(n.regions || []).length && !(n.elements || []).length && !n.proposedCode && !n.checked;
const isUnsent = (n) => n.rev !== n.sentRev && !(isEmpty(n) && n.sentRev == null) && !(n.deleted && n.sentRev == null);

// ── состояние ────────────────────────────────────────────────────────────────
const S = {
    list: [],              // [{ id, title, section, num }]
    topics: new Map(),     // id примера → тема справочника
    notes: new Map(),      // id → заметка
    cur: 0,
    view: store.get('mf-review-view') === 'mobile' ? 'mobile' : 'pc',
    tool: 'none',
    curNote: null,         // id выбранной заметки
    source: '', model: null,
    frame: null, detach: null,
};
const notesOf = (exId) => [...S.notes.values()].filter((n) => n.exampleId === exId);
const curEx = () => S.list[S.cur];

async function saveNote(n, { silent } = {}) {
    n.changedAt = Date.now();
    n.rev = fnv(contentOf(n));
    S.notes.set(n.id, n);
    await putNote(n);
    if (!silent) { updateListItem(n.exampleId); updateSendButton(); }
}
function newNote(kind, extra) {
    const ex = curEx();
    const n = Object.assign({ id: (kind === 'general' ? 'g:' : kind === 'status' ? 's:' : 'n:') + (kind === 'general' || kind === 'status' ? ex.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
        exampleId: ex.id, kind, text: '', targets: [], regions: [], elements: [], viewMode: S.view, createdAt: Date.now(), sentRev: null }, extra || {});
    n.rev = fnv(contentOf(n));
    return n;
}

// ── загрузка ─────────────────────────────────────────────────────────────────
async function boot() {
    const [index, config, notes] = await Promise.all([
        fetch('/data/gms-docs/examples-index.json', { cache: 'no-cache' }).then((r) => r.json()),
        fetch('/data/topics/config.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => []),
        allNotes(),
    ]);
    S.list = index.map((x, i) => ({ id: x[0], title: x[1], section: x[2] || '', num: i + 1 }));
    for (const t of config) if (t && t.example) S.topics.set(t.example.replace(/^.*\//, '').replace(/\.gms$/, ''), t);
    for (const n of notes) S.notes.set(n.id, n);
    const saved = store.get('mf-review-pos');
    const at = S.list.findIndex((x) => x.id === (new URLSearchParams(location.search).get('ex') || saved));
    S.cur = at >= 0 ? at : 0;
    $('rvSendMode').value = store.get('mf-review-send') === 'file' ? 'file' : 'repo';
    setViewButtons();
    renderList();
    updateSendButton();
    await showExample(S.cur);
}

// ── список примеров ──────────────────────────────────────────────────────────
function exState(exId) {
    const ns = notesOf(exId);
    return {
        unsent: ns.some(isUnsent),
        sent: ns.some((n) => n.sentRev != null && !n.deleted),
        notes: ns.some((n) => (n.kind === 'note' || n.kind === 'code' || n.kind === 'general') && !n.deleted && !isEmpty(n)),
        checked: ns.some((n) => n.kind === 'status' && n.checked),
    };
}
function dotsHtml(exId) {
    const s = exState(exId);
    return (s.unsent ? '<i class="rv-dot n" title="есть неотправленное"></i>' : s.sent ? '<i class="rv-dot s" title="отправлено"></i>' : '<i class="rv-dot"></i>') +
        (s.checked ? '<i class="rv-dot c" title="проверен"></i>' : '');
}
function renderList() {
    const f = $('rvSearch').value.trim().toLowerCase(), mode = $('rvFilter').value;
    const html = [];
    for (let i = 0; i < S.list.length; i++) {
        const x = S.list[i];
        if (f && !(x.title.toLowerCase().includes(f) || x.id.includes(f) || x.section.toLowerCase().includes(f))) continue;
        const s = exState(x.id);
        if (mode === 'none' && (s.notes || s.checked)) continue;
        if (mode === 'notes' && !s.notes) continue;
        if (mode === 'unsent' && !s.unsent) continue;
        if (mode === 'checked' && !s.checked) continue;
        html.push(`<button type="button" class="rv-li${i === S.cur ? ' on' : ''}" data-i="${i}" role="option"><span class="num">${x.num}</span><span class="tt" title="${esc(x.section)}">${esc(x.title)}</span><span class="dots">${dotsHtml(x.id)}</span></button>`);
    }
    $('rvList').innerHTML = html.join('') || '<p class="rv-hint" style="padding:.5rem">Ничего не найдено</p>';
    const on = $('rvList').querySelector('.rv-li.on'); if (on) on.scrollIntoView({ block: 'nearest' });
}
function updateListItem(exId) {
    const i = S.list.findIndex((x) => x.id === exId);
    const el = $('rvList').querySelector(`.rv-li[data-i="${i}"] .dots`);
    if (el) el.innerHTML = dotsHtml(exId);
}
$('rvList').addEventListener('click', (e) => { const b = e.target.closest('.rv-li'); if (b) showExample(+b.dataset.i); });
$('rvSearch').addEventListener('input', renderList);
$('rvFilter').addEventListener('change', renderList);

// ── показ примера ────────────────────────────────────────────────────────────
let compilerP = null;
const compiler = () => (compilerP = compilerP || import('./gms-compiler.js'));

// Эмуляция телефона внутри сцены: плотность ×3, сенсорный экран, грубый указатель;
// мышь превращается в касания (touchstart/move/end), как палец.
const MOBILE_EMU = `<script>(function(){
  try { Object.defineProperty(window, 'devicePixelRatio', { get: function(){ return 3; } }); } catch (e) {}
  try { Object.defineProperty(navigator, 'maxTouchPoints', { get: function(){ return 5; } }); } catch (e) {}
  window.ontouchstart = null;
  var mm = window.matchMedia;
  window.matchMedia = function(q){ if (/pointer\\s*:\\s*coarse|hover\\s*:\\s*none/.test(q)) return { matches: true, media: q, onchange: null, addListener: function(){}, removeListener: function(){}, addEventListener: function(){}, removeEventListener: function(){}, dispatchEvent: function(){ return false; } }; return mm.call(window, q); };
  var down = false, target = null;
  function touch(type, e) {
    if (!target) return;
    var t = new Touch({ identifier: 1, target: target, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY, screenX: e.screenX, screenY: e.screenY, radiusX: 11, radiusY: 11, force: 1 });
    var list = type === 'touchend' ? [] : [t];
    target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, composed: true, touches: list, targetTouches: list, changedTouches: [t] }));
  }
  function nativeCtl(el) { return el && el.closest && el.closest('input,select,textarea,button,label,a'); }
  window.addEventListener('mousedown', function(e){ if (!e.isTrusted || e.button !== 0 || nativeCtl(e.target)) return; down = true; target = e.target; e.stopImmediatePropagation(); touch('touchstart', e); }, true);
  window.addEventListener('mousemove', function(e){ if (!e.isTrusted) return; e.stopImmediatePropagation(); if (down) touch('touchmove', e); }, true);
  window.addEventListener('mouseup', function(e){ if (!e.isTrusted || !down) return; down = false; e.stopImmediatePropagation(); touch('touchend', e); target = null; }, true);
  window.addEventListener('wheel', function(e){ e.stopImmediatePropagation(); }, true);
})();<\/script>`;

async function showExample(i) {
    if (i < 0 || i >= S.list.length) return;
    S.cur = i; S.curNote = null;
    const ex = curEx();
    store.set('mf-review-pos', ex.id);
    history.replaceState(null, '', '?ex=' + encodeURIComponent(ex.id));
    renderList();
    $('rvTitle').textContent = ex.title; $('rvSec').textContent = ex.section;
    $('rvPos').textContent = (i + 1) + ' / ' + S.list.length;
    $('rvOpen').href = '/spravochnik/?topic=' + encodeURIComponent((S.topics.get(ex.id) || {}).id || ex.id);
    const topic = S.topics.get(ex.id);
    $('rvDesc').hidden = !(topic && topic.description);
    $('rvDescBody').innerHTML = topic && topic.description ? topic.description : '';
    if (window.renderMathInElement) try { window.renderMathInElement($('rvDescBody')); } catch (e) {}
    $('rvChecked').checked = !!(S.notes.get('s:' + ex.id) || {}).checked;
    $('rvCodePick').hidden = true;
    S.source = await fetch('/data/examples/' + encodeURIComponent(ex.id) + '.gms', { cache: 'no-cache' }).then((r) => r.ok ? r.text() : '').catch(() => '');
    S.model = SM.parseGms(S.source, SCENE_KEYS);
    renderNotes();
    await renderStage();
    if (editor && !$('rvTabEdit').hidden) loadIntoEditor();
}

async function renderStage() {
    const stage = $('rvStage');
    if (S.detach) { S.detach(); S.detach = null; }
    const ex = curEx();
    const wrapHtml = '<div class="rv-wrap"><iframe sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups" title="Пример"></iframe><div class="rv-status-ov">Компиляция примера…</div><div class="rv-ov"></div></div>';
    if (S.view === 'mobile') {
        stage.innerHTML = `<div class="rv-phone"><div class="rv-phone-notch"></div><div class="rv-phone-screen"><p class="rv-phone-title">${esc(ex.title)}</p><div class="rv-phone-box touch">${wrapHtml}</div></div></div>`;
        fitPhone();
    } else stage.innerHTML = wrapHtml;
    const wrap = stage.querySelector('.rv-wrap'), frame = wrap.querySelector('iframe'), st = wrap.querySelector('.rv-status-ov');
    S.frame = frame;
    setupOverlay(wrap.querySelector('.rv-ov'));
    const mod = await compiler();
    let r;
    try { r = mod.compile(S.source); } catch (e) { r = { success: false, errors: [String(e && e.message || e)] }; }
    if (!r.success) { st.textContent = 'Ошибка компиляции:\n' + r.errors.join('\n'); st.classList.add('err'); return; }
    S.detach = attachFrame(frame, { fit: wrap, onLoad: () => { st.hidden = true; wrap.classList.add('sized'); drawMarks(); } });
    frame.srcdoc = S.view === 'mobile' ? r.html.replace(/<head>/i, '<head>' + MOBILE_EMU) : r.html;
}
function fitPhone() {
    const ph = document.querySelector('.rv-phone'); if (!ph) return;
    const top = Math.max(0, ph.parentElement.getBoundingClientRect().top + window.scrollY - window.scrollY);
    const avail = window.innerHeight - Math.min(top, 260) - 24;
    const s = Math.min(1, Math.max(0.5, avail / 868));
    ph.style.transform = s < 1 ? `scale(${s})` : '';
    ph.style.marginBottom = s < 1 ? (-(1 - s) * 868) + 'px' : '';
}
window.addEventListener('resize', fitPhone);
$('rvReload').onclick = () => renderStage();

// ── вид: ПК / мобильный ─────────────────────────────────────────────────────
function setViewButtons() { document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === S.view)); }
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    if (S.view === b.dataset.view) return;
    S.view = b.dataset.view; store.set('mf-review-view', S.view); setViewButtons(); renderStage();
}));

// ── выделения поверх примера ────────────────────────────────────────────────
function setTool(t) {
    S.tool = t;
    document.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
    const ov = document.querySelector('.rv-ov');
    if (ov) { ov.classList.toggle('active', t !== 'none'); ov.classList.toggle('pick', t === 'element'); }
}
document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));

function ovPoint(ov, e) {
    const r = ov.getBoundingClientRect();
    const k = ov.offsetWidth / (r.width || 1);   // телефон показан уменьшенным
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
}
function setupOverlay(ov) {
    setTool(S.tool);
    let start = null, box = null;
    ov.addEventListener('pointerdown', (e) => {
        if (S.tool === 'region') {
            start = ovPoint(ov, e); ov.setPointerCapture(e.pointerId);
            box = document.createElement('div'); box.className = 'rv-drag'; ov.append(box);
        }
    });
    ov.addEventListener('pointermove', (e) => {
        if (!start || !box) return;
        const p = ovPoint(ov, e);
        Object.assign(box.style, { left: Math.min(p.x, start.x) + 'px', top: Math.min(p.y, start.y) + 'px', width: Math.abs(p.x - start.x) + 'px', height: Math.abs(p.y - start.y) + 'px' });
    });
    ov.addEventListener('pointerup', async (e) => {
        if (S.tool === 'element') return pickElement(ovPoint(ov, e));
        if (!start) return;
        const p = ovPoint(ov, e), s = start; start = null; if (box) box.remove(); box = null;
        const rect = { x: Math.round(Math.min(p.x, s.x)), y: Math.round(Math.min(p.y, s.y)), w: Math.round(Math.abs(p.x - s.x)), h: Math.round(Math.abs(p.y - s.y)) };
        if (rect.w < 6 || rect.h < 6) return;
        await addRegion(rect, ov.offsetWidth, ov.offsetHeight);
    });
}

function ensureCurNote() {
    let n = S.curNote && S.notes.get(S.curNote);
    if (!n || n.deleted) { n = newNote('note'); S.notes.set(n.id, n); S.curNote = n.id; }
    return n;
}

// html2canvas — только когда понадобился снимок
let h2cP = null;
function html2canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (!h2cP) h2cP = new Promise((res, rej) => {
        const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = () => res(window.html2canvas); s.onerror = () => { h2cP = null; rej(new Error('html2canvas не загрузился')); };
        document.head.appendChild(s);
    });
    return h2cP;
}
// Снимок области документа сцены. Холсты (2D и WebGL) дорисовываются напрямую
// в кадре отрисовки — html2canvas их не всегда видит.
async function snapshot(rect) {
    const win = S.frame && S.frame.contentWindow, doc = S.frame && S.frame.contentDocument;
    if (!win || !doc) return null;
    const scale = 2;
    const out = document.createElement('canvas'); out.width = rect.w * scale; out.height = rect.h * scale;
    const g = out.getContext('2d');
    try {
        const h2c = await html2canvas();
        const shot = await h2c(doc.documentElement, { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale, backgroundColor: getComputedStyle(doc.body).backgroundColor || null, logging: false, windowWidth: doc.documentElement.clientWidth, windowHeight: doc.documentElement.clientHeight, scrollX: 0, scrollY: 0 });
        g.drawImage(shot, 0, 0, out.width, out.height);
    } catch (e) { console.warn('[review] html2canvas:', e); }
    await new Promise((res) => win.requestAnimationFrame(() => {
        for (const c of doc.querySelectorAll('canvas')) {
            const r = c.getBoundingClientRect();
            if (r.right < rect.x || r.left > rect.x + rect.w || r.bottom < rect.y || r.top > rect.y + rect.h || !r.width) continue;
            try { g.drawImage(c, 0, 0, c.width, c.height, (r.left - rect.x) * scale, (r.top - rect.y) * scale, r.width * scale, r.height * scale); } catch (e) {}
        }
        res();
    }));
    try {
        const px = g.getImageData(0, 0, out.width, out.height).data;
        let solid = true; for (let i = 4; i < px.length; i += 4 * 97) if (px[i] !== px[0] || px[i + 1] !== px[1] || px[i + 2] !== px[2] || px[i + 3] !== px[3]) { solid = false; break; }
        if (solid) return null;
        return out.toDataURL('image/png');
    } catch (e) { return null; }
}
async function addRegion(rect, fw, fh) {
    const n = ensureCurNote();
    const image = await snapshot(rect);
    n.regions = (n.regions || []).concat([{ ...rect, frameW: Math.round(fw), frameH: Math.round(fh), viewMode: S.view, image }]);
    n.viewMode = S.view;
    await saveNote(n);
    renderNotes(); drawMarks();
}

// Объекты кода: имя, тип, строка
function codeObjects() {
    const lines = SM.segLines(S.model);
    return SM.blocks(S.model).map((b) => ({ name: SM.unquote(SM.getField(b, 'name') || '') || '', type: b.kw + ' ' + b.type, line: lines.get(b) })).filter((o) => o.name);
}
function fieldSize() {
    const n = (k, d) => { const v = parseFloat(SM.getParam(S.model, k)); return isFinite(v) && v > 0 ? v : d; };
    return [n('field width', 50), n('field height', 30)];
}
// Щелчок по 2D-сцене → ближайшая точка / отрезок / окружность из рантайма сцены.
function pickElement(p) {
    const win = S.frame && S.frame.contentWindow, doc = S.frame && S.frame.contentDocument;
    let best = null;
    try {
        const cam = win.camera, canvas = doc && doc.querySelector('canvas');
        if (cam && canvas && Array.isArray(win.points)) {
            const r = canvas.getBoundingClientRect();
            const [FW, FH] = fieldSize();
            const s = Math.min(r.width / FW, r.height / FH) * (cam.zoom || 1);
            const px = (q) => ({ x: r.left + r.width / 2 + (q.x - (cam.offsetX || 0)) * s, y: r.top + r.height / 2 - (q.y - (cam.offsetY || 0)) * s });
            const consider = (name, d, at) => { if (name && d < 26 && (!best || d < best.d)) best = { name, d, at }; };
            for (const pt of win.points) { if (!pt || !pt.pos || pt.active === false) continue; const q = px(pt.pos); consider(pt.name, Math.hypot(q.x - p.x, q.y - p.y) - 8, q); }
            for (const l of win.lines || []) {
                if (!l || !l.pA || !l.pB || l.active === false) continue;
                const a = px(l.pA.pos), b = px(l.pB.pos), dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1;
                const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L));
                const q = { x: a.x + t * dx, y: a.y + t * dy };
                consider(l.name, Math.hypot(q.x - p.x, q.y - p.y), q);
            }
            for (const c of win.circles || []) {
                const ctr = c && (c.center || c.centerPoint); if (!ctr || !ctr.pos) continue;
                const rad = typeof c.radius === 'number' ? c.radius : NaN; if (!isFinite(rad)) continue;
                const q = px(ctr.pos), d = Math.abs(Math.hypot(q.x - p.x, q.y - p.y) - rad * s);
                consider(c.name, d, { x: p.x, y: p.y });
            }
        }
    } catch (e) { console.warn('[review] pick:', e); }
    if (!best) {
        status('Элемент не найден здесь — выберите его из списка «Объекты кода»', 'bad');
        openCodeList();
        return;
    }
    const o = codeObjects().find((x) => x.name === best.name) || { name: best.name, type: '?', line: null };
    addElement(o, best.at);
}
async function addElement(o, at) {
    const n = ensureCurNote();
    if ((n.elements || []).some((e) => e.name === o.name)) { status(o.name + ' уже в заметке'); return; }
    n.elements = (n.elements || []).concat([{ name: o.name, type: o.type, line: o.line, x: at ? Math.round(at.x) : null, y: at ? Math.round(at.y) : null, viewMode: S.view }]);
    n.viewMode = S.view;
    await saveNote(n);
    renderNotes(); drawMarks();
    status('Добавлен элемент ' + o.name, 'ok');
}
function openCodeList() {
    const box = $('rvCodePick');
    const objs = codeObjects();
    box.innerHTML = '<input class="rv-in" type="search" placeholder="Найти объект…" style="margin:.15rem">' +
        (objs.map((o, i) => `<button type="button" data-o="${i}"><span>${esc(o.name)}</span><span style="color:var(--text-tertiary)">${esc(o.type)}</span><small>стр. ${o.line}</small></button>`).join('') || '<span class="rv-hint">В коде нет именованных объектов</span>');
    box.hidden = false;
    const inp = box.querySelector('input'); inp.focus();
    inp.oninput = () => { const f = inp.value.toLowerCase(); box.querySelectorAll('[data-o]').forEach((b) => { b.hidden = f && !b.textContent.toLowerCase().includes(f); }); };
    box.onclick = (e) => { const b = e.target.closest('[data-o]'); if (b) addElement(objs[+b.dataset.o], null); };
}
$('rvCodeList').onclick = () => { if ($('rvCodePick').hidden) openCodeList(); else $('rvCodePick').hidden = true; };

// Подсветка выделений всех заметок примера поверх сцены (выбранная — акцентом).
function drawMarks() {
    const ov = document.querySelector('.rv-ov'); if (!ov) return;
    ov.querySelectorAll('.rv-mark,.rv-pin').forEach((m) => m.remove());
    const ns = notesOf(curEx().id).filter((n) => !n.deleted && (n.kind === 'note' || n.kind === 'code'));
    ns.forEach((n, k) => {
        const cur = n.id === S.curNote, num = '#' + (k + 1);
        (n.regions || []).forEach((r) => {
            if (r.viewMode && r.viewMode !== S.view) return;
            const m = document.createElement('div'); m.className = 'rv-mark' + (cur ? ' cur' : '');
            Object.assign(m.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
            m.innerHTML = `<b>${num}</b>`; ov.append(m);
        });
        (n.elements || []).forEach((el) => {
            if (el.x == null || (el.viewMode && el.viewMode !== S.view)) return;
            const m = document.createElement('div'); m.className = 'rv-pin' + (cur ? ' cur' : '');
            Object.assign(m.style, { left: el.x + 'px', top: el.y + 'px' });
            m.innerHTML = `<b>${num} ${esc(el.name)}</b>`; ov.append(m);
        });
    });
}

// ── заметки ──────────────────────────────────────────────────────────────────
function badge(n) {
    if (n.sentRev == null) return isEmpty(n) ? '' : '<span class="rv-badge new">не отправлена</span>';
    return n.rev === n.sentRev ? '<span class="rv-badge sent">отправлена</span>' : '<span class="rv-badge upd">изменена после отправки</span>';
}
function targetsHtml(n) {
    return '<div class="rv-targets"><span>Правка для:</span>' + TARGETS.map(([k, t]) =>
        `<label class="rv-chip"><input type="checkbox" data-target="${k}"${(n.targets || []).includes(k) ? ' checked' : ''}> ${t}</label>`).join('') + '</div>';
}
function cardHtml(n, k) {
    const regions = (n.regions || []).map((r, i) => `<div class="rv-thumb">${r.image ? `<img src="${r.image}" alt="Область ${i + 1}">` : ''}<span>▭ ${r.w}×${r.h} · ${r.viewMode === 'mobile' ? 'моб.' : 'ПК'}${r.image ? '' : ' · без снимка'}</span><button type="button" data-rm-region="${i}" title="Убрать">✕</button></div>`).join('');
    const els = (n.elements || []).map((e, i) => `<span class="rv-tag" title="${esc(e.type)}">${esc(e.name)} <span style="color:var(--text-tertiary)">${esc(e.type.replace(/^new /, ''))}${e.line ? ', стр. ' + e.line : ''}</span><button type="button" data-rm-el="${i}" title="Убрать">✕</button></span>`).join('');
    const code = n.proposedCode ? `<div class="rv-targets"><span class="rv-tag">Предложенный код: ${n.proposedCode.split('\n').length} строк</span><button type="button" class="rv-btn sm" data-open-code>Открыть в редакторе</button></div>` : '';
    return `<div class="rv-card${n.id === S.curNote ? ' cur' : ''}" data-id="${esc(n.id)}">
      <div class="rv-card-h"><b>#${k + 1}</b><span>${n.kind === 'code' ? 'правка кода' : 'заметка'} · ${n.viewMode === 'mobile' ? 'мобильный' : 'ПК'}</span>${badge(n)}<span class="rv-grow"></span><button type="button" class="rv-btn sm danger" data-del title="Удалить заметку">✕</button></div>
      <textarea placeholder="Что не так / что поправить…">${esc(n.text)}</textarea>
      ${targetsHtml(n)}
      ${regions || els ? `<div class="rv-att">${regions}${els}</div>` : '<span class="rv-hint">Выделите область или элемент — они прикрепятся к этой заметке.</span>'}
      ${code}
    </div>`;
}
function renderNotes() {
    const ex = curEx();
    const ns = notesOf(ex.id).filter((n) => !n.deleted && (n.kind === 'note' || n.kind === 'code')).sort((a, b) => a.createdAt - b.createdAt);
    $('rvNotes').innerHTML = ns.map(cardHtml).join('');
    const g = S.notes.get('g:' + ex.id) || newNote('general');
    $('rvGeneral').innerHTML = `<div class="rv-card rv-general" data-id="${esc(g.id)}"><div class="rv-card-h"><b>Общая заметка к примеру</b>${badge(g)}</div>
      <textarea placeholder="Общее впечатление, без выделения элементов…">${esc(g.text)}</textarea>${targetsHtml(g)}</div>`;
    drawMarks();
}
async function noteFromCard(card) {
    const id = card.dataset.id;
    let n = S.notes.get(id);
    if (!n && id.startsWith('g:')) { n = newNote('general'); S.notes.set(n.id, n); }
    return n;
}
let typing = 0;
function onNotesEvent(e) {
    const card = e.target.closest('.rv-card'); if (!card) return;
    noteFromCard(card).then(async (n) => {
        if (!n) return;
        if (e.type === 'input' && e.target.tagName === 'TEXTAREA') {
            n.text = e.target.value;
            clearTimeout(typing); typing = setTimeout(() => saveNote(n).then(() => refreshBadge(card, n)), 300);
            return;
        }
        if (e.type === 'change' && e.target.dataset.target) {
            const k = e.target.dataset.target;
            n.targets = (n.targets || []).filter((x) => x !== k).concat(e.target.checked ? [k] : []);
            await saveNote(n); refreshBadge(card, n); return;
        }
        if (e.type !== 'click') return;
        if (e.target.closest('[data-del]')) {
            if (!confirm('Удалить заметку?')) return;
            if (n.sentRev != null) { n.deleted = true; await saveNote(n); } else { S.notes.delete(n.id); await delNote(n.id); updateListItem(n.exampleId); updateSendButton(); }
            if (S.curNote === n.id) S.curNote = null;
            renderNotes(); return;
        }
        const rr = e.target.closest('[data-rm-region]'), re = e.target.closest('[data-rm-el]');
        if (rr) { n.regions.splice(+rr.dataset.rmRegion, 1); await saveNote(n); renderNotes(); return; }
        if (re) { n.elements.splice(+re.dataset.rmEl, 1); await saveNote(n); renderNotes(); return; }
        if (e.target.closest('[data-open-code]')) { openEditorWith(n.proposedCode); return; }
        if (n.kind !== 'general' && S.curNote !== n.id) {
            S.curNote = n.id;
            document.querySelectorAll('#rvNotes .rv-card').forEach((c) => c.classList.toggle('cur', c.dataset.id === n.id));
            drawMarks();
        }
    });
}
function refreshBadge(card, n) {
    const h = card.querySelector('.rv-card-h'); if (!h) return;
    h.querySelectorAll('.rv-badge').forEach((b) => b.remove());
    const b = badge(n); if (b) h.querySelector('b').insertAdjacentHTML('afterend', b);
}
for (const ev of ['input', 'change', 'click']) { $('rvNotes').addEventListener(ev, onNotesEvent); $('rvGeneral').addEventListener(ev, onNotesEvent); }
$('rvAddNote').onclick = async () => {
    const n = newNote('note'); S.notes.set(n.id, n); S.curNote = n.id;
    await saveNote(n, { silent: true });
    renderNotes();
    const ta = document.querySelector(`#rvNotes .rv-card[data-id="${CSS.escape(n.id)}"] textarea`); if (ta) ta.focus();
    if (S.tool === 'none') setTool('region');
};
$('rvChecked').onchange = async () => {
    const id = 's:' + curEx().id;
    const n = S.notes.get(id) || newNote('status');
    n.checked = $('rvChecked').checked;
    if (!n.checked && n.sentRev == null) { S.notes.delete(id); await delNote(id); updateListItem(n.exampleId); updateSendButton(); return; }
    await saveNote(n);
};

// ── навигация ────────────────────────────────────────────────────────────────
$('rvPrev').onclick = () => showExample(S.cur - 1);
$('rvNext').onclick = () => showExample(S.cur + 1);
document.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea,select,[contenteditable]') || !$('rvTabEdit').hidden) return;
    if (e.key === 'ArrowLeft') showExample(S.cur - 1);
    else if (e.key === 'ArrowRight') showExample(S.cur + 1);
    else if (e.key === 'Escape') { setTool('none'); $('rvCodePick').hidden = true; }
});

// ── вкладки и редактор ───────────────────────────────────────────────────────
let editor = null, editorSource = null;
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
async function setTab(t) {
    document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
    $('rvTabCheck').hidden = t !== 'check'; $('rvTabEdit').hidden = t !== 'edit';
    if (t === 'edit') {
        if (!editor) {
            const { mountStructuredEditor } = await import('./gms-structured-editor.js');
            editor = await mountStructuredEditor($('rvEditor'), { mode: 'reference', source: S.source });
            editorSource = curEx().id;
        } else if (editorSource !== curEx().id) loadIntoEditor();
        $('rvEditTitle').textContent = curEx().title;
    } else renderStage();
}
function loadIntoEditor() { if (!editor) return; editor.setSource(S.source); editorSource = curEx().id; $('rvEditTitle').textContent = curEx().title; }
async function openEditorWith(code) { await setTab('edit'); editor.setSource(code); }
$('rvEditReset').onclick = () => { if (confirm('Вернуть исходный код примера?')) editor.setSource(S.source); };
$('rvEditBlank').onclick = () => { if (confirm('Начать с пустой сцены?')) editor.setSource('[\ndescription = "Новая сцена"\nfield width = 20;\nfield height = 12;\nshow axes = true;\nshow grid = true;\n]'); };
$('rvEditDownload').onclick = () => download(new Blob([editor.getSource()], { type: 'text/plain' }), curEx().id + '.gms');
$('rvEditAttach').onclick = async () => {
    const code = editor.getSource();
    if (code === S.source) { alert('Код не отличается от исходного примера.'); return; }
    const text = prompt('Подпись к правке кода:', '') ;
    if (text === null) return;
    const n = newNote('code', { proposedCode: code, text, targets: ['example'] });
    S.curNote = n.id;
    await saveNote(n);
    await setTab('check'); renderNotes();
    status('Правка кода приложена к заметкам', 'ok');
};

// ── отправка ─────────────────────────────────────────────────────────────────
function status(msg, cls) { const s = $('rvSendStatus'); s.textContent = msg; s.className = 'rv-status' + (cls ? ' ' + cls : ''); }
function pending() { return [...S.notes.values()].filter(isUnsent); }
function updateSendButton() {
    const k = pending().length;
    $('rvSend').textContent = 'Отправить все обработанные' + (k ? ' (' + k + ')' : '');
}
$('rvSendMode').onchange = () => store.set('mf-review-send', $('rvSendMode').value);

function packageOf(notes) {
    const images = {};
    const items = notes.map((n) => {
        const ex = S.list.find((x) => x.id === n.exampleId) || { title: '', section: '' };
        const regions = (n.regions || []).map((r, i) => {
            let image = null;
            if (r.image) { image = 'img/' + n.id.replace(/[^\w-]/g, '_') + '-' + (i + 1) + '.png'; images[image] = r.image.replace(/^data:image\/png;base64,/, ''); }
            return { x: r.x, y: r.y, w: r.w, h: r.h, frameW: r.frameW, frameH: r.frameH, viewMode: r.viewMode, image };
        });
        const item = { id: n.id, exampleId: n.exampleId, file: 'data/examples/' + n.exampleId + '.gms', title: ex.title, section: ex.section, kind: n.kind,
            viewMode: n.viewMode, text: n.text || '', targets: n.targets || [], regions, elements: (n.elements || []).map((e) => ({ name: e.name, type: e.type, line: e.line, viewMode: e.viewMode })),
            updated: n.sentRev != null, changedAt: new Date(n.changedAt || n.createdAt).toISOString() };
        if (n.proposedCode) item.proposedCode = n.proposedCode;
        if (n.kind === 'status') item.checked = !!n.checked;
        if (n.deleted) item.deleted = true;
        return item;
    });
    return { pkg: { sentAt: new Date().toISOString(), count: items.length, items }, images };
}
function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
let jszipP = null;
function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (!jszipP) jszipP = new Promise((res, rej) => {
        const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s.onload = () => res(window.JSZip); s.onerror = () => { jszipP = null; rej(new Error('JSZip не загрузился')); };
        document.head.appendChild(s);
    });
    return jszipP;
}
async function sendRepo(notes) {
    const user = window.firebase && firebase.auth().currentUser;
    if (!user) throw new Error('Нужно войти в аккаунт');
    const token = await user.getIdToken();
    // пакеты не больше ~3 МБ (лимит тела запроса функции Vercel — 4,5 МБ)
    const batches = []; let cur = [], size = 0;
    for (const n of notes) {
        const sz = JSON.stringify(n).length;
        if (cur.length && size + sz > 3e6) { batches.push(cur); cur = []; size = 0; }
        cur.push(n); size += sz;
    }
    if (cur.length) batches.push(cur);
    const paths = [];
    for (const b of batches) {
        const { pkg, images } = packageOf(b);
        const r = await fetch('/api/review-notes', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ package: pkg, images }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
        await markSent(b);
        paths.push(d.path);
    }
    return paths;
}
async function sendFile(notes) {
    const JSZip = await loadJSZip();
    const { pkg, images } = packageOf(notes);
    const zip = new JSZip();
    zip.file('notes.json', JSON.stringify(pkg, null, 2));
    for (const [p, b64] of Object.entries(images)) zip.file(p, b64, { base64: true });
    const stamp = pkg.sentAt.replace(/[:.]/g, '-').slice(0, 19);
    download(await zip.generateAsync({ type: 'blob' }), 'review-notes-' + stamp + '.zip');
    await markSent(notes);
    return ['review-notes-' + stamp + '.zip'];
}
async function markSent(notes) {
    for (const n of notes) {
        n.sentRev = n.rev; n.sentAt = Date.now();
        if (n.deleted) { S.notes.delete(n.id); await delNote(n.id); }
        else await putNote(n);
    }
}
$('rvSend').onclick = async () => {
    const notes = pending();
    if (!notes.length) { status('Нечего отправлять — новых и изменённых заметок нет', 'ok'); return; }
    $('rvSend').disabled = true; status('Отправка ' + notes.length + '…');
    try {
        const paths = $('rvSendMode').value === 'file' ? await sendFile(notes) : await sendRepo(notes);
        status('Отправлено: ' + notes.length + ' → ' + paths.join(', '), 'ok');
    } catch (e) {
        status('Не отправлено: ' + (e.message || e), 'bad');
    } finally {
        $('rvSend').disabled = false;
        updateSendButton(); renderList(); renderNotes();
    }
};

// ── запуск после проверки доступа ───────────────────────────────────────────
function start() { boot().catch((e) => { status('Ошибка загрузки: ' + e.message, 'bad'); console.error(e); }); }
if (document.body.classList.contains('admin-granted')) start();
else document.addEventListener('rv-granted', start, { once: true });

// Для тестов и отладки
window.mfReview = { S, pending, packageOf, showExample, setTool, addRegion, pickElement };

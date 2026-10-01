// assets/js/gms-structured-editor.js
// Визуальный редактор «Все элементы»: любой объект new/draw GMS со всеми полями и все
// параметры сцены — через инспектор, с настоящим предпросмотром из компилятора.
//
//   mountStructuredEditor(host, {
//     mode: 'playground' | 'reference',  // как показывать сцену: песочница (без описания,
//                                         // тема из кода) или как в справочнике (с описанием)
//     source: 'код GMS',
//     onChange(src),                     // после каждой правки
//     toolbar: [{ label, title, onClick(src) }],  // свои кнопки в шапке
//   }) → { getSource(), setSource(src), select(name), destroy() }
//
// Типы, поля и шаблоны новых объектов — data/gms-docs/schema.json (tools/gms-schema/build.mjs).
// Разбор и запись кода — gms-structured-model.js: нетронутый код не меняется ни на байт.

import * as M from './gms-structured-model.js';

const SCHEMA_URL = new URL('../../data/gms-docs/schema.json', import.meta.url).href;
let schemaPromise = null;
export function loadSchema() {
    if (!schemaPromise) schemaPromise = fetch(SCHEMA_URL).then((r) => { if (!r.ok) throw new Error('schema.json: HTTP ' + r.status); return r.json(); })
        .catch((e) => { schemaPromise = null; throw e; });
    return schemaPromise;
}

const GROUPS = [
    ['Геометрия', ['Point', 'Line', 'Figure', 'Claster', 'Angle', 'draw Angle', 'Circle', 'draw Arc', 'Ellipse', 'Curve']],
    ['Пометки и подписи', ['draw Text', 'draw Formula', 'draw Vector', 'draw Punctir', 'draw InfLine', 'draw EquallySing', 'draw Filling', 'draw Image']],
    ['Графики и поля', ['draw Function', 'draw Surface', 'draw Field', 'draw Trajectory', 'draw Region', 'draw Locus', 'draw Trace', 'draw Complex']],
    ['Данные и статистика', ['draw Chart', 'draw Histogram', 'draw Distribution', 'draw Table', 'draw Tree', 'draw Graph', 'draw Diagram']],
    ['Динамика и фракталы', ['draw Fractal', 'draw Bifurcation', 'draw Cobweb', 'draw IFS', 'draw Automaton', 'draw Voronoi', 'draw Fourier', 'draw Hyperbolic']],
    ['3D', ['Primitive', 'Section', 'Boolean', 'Truncate', 'Hull', 'Minkowski', 'Angle3D', 'draw InfPlane', 'draw TensorField', 'draw Scatter3D', 'draw Histogram3D']],
    ['Интерфейс', ['UI']],
];
const TYPE_TITLES = {
    'Point': 'Точка', 'Line': 'Отрезок', 'Figure': 'Многоугольник', 'Claster': 'Кластер / шаг', 'Angle': 'Угол', 'draw Angle': 'Дуга угла',
    'Circle': 'Окружность', 'draw Arc': 'Дуга', 'Ellipse': 'Эллипс', 'Curve': 'Кривая', 'draw Text': 'Текст', 'draw Formula': 'Формула',
    'draw Vector': 'Стрелка', 'draw Punctir': 'Пунктир', 'draw InfLine': 'Прямая', 'draw EquallySing': 'Знак равенства', 'draw Filling': 'Заливка',
    'draw Image': 'Картинка', 'draw Function': 'График функции', 'draw Surface': 'Поверхность', 'draw Field': 'Векторное поле',
    'draw Trajectory': 'Траектория', 'draw Region': 'Область', 'draw Locus': 'ГМТ', 'draw Trace': 'След точки', 'draw Complex': 'Комплексная функция',
    'draw Chart': 'Диаграмма', 'draw Histogram': 'Гистограмма', 'draw Distribution': 'Распределение', 'draw Table': 'Таблица', 'draw Tree': 'Дерево',
    'draw Graph': 'Граф', 'draw Diagram': 'Диаграмма состояний', 'draw Fractal': 'Фрактал', 'draw Bifurcation': 'Бифуркации',
    'draw Cobweb': 'Лестница Ламерея', 'draw IFS': 'IFS', 'draw Automaton': 'Клеточный автомат', 'draw Voronoi': 'Вороной / Делоне',
    'draw Fourier': 'Эпициклы Фурье', 'draw Hyperbolic': 'Гиперболическая геометрия', 'Primitive': 'Тело', 'Section': 'Сечение',
    'Boolean': 'Булева операция', 'Truncate': 'Усечение', 'Hull': 'Выпуклая оболочка', 'Minkowski': 'Сумма Минковского', 'Angle3D': 'Угол в 3D',
    'draw InfPlane': 'Плоскость', 'draw TensorField': 'Тензорное поле', 'draw Scatter3D': 'Точечная 3D-диаграмма', 'draw Histogram3D': '3D-гистограмма', 'UI': 'Элемент управления',
};
const SCENE_TITLES = {
    'description': 'Описание', 'description align': 'Выравнивание описания', 'description color': 'Цвет описания', 'description size': 'Размер описания',
    'show description': 'Показывать описание (песочница)', 'field width': 'Ширина поля', 'field height': 'Высота поля', 'field depth': 'Глубина поля (3D)',
    'field color': 'Цвет поля', 'frame color': 'Цвет рамки', 'frame width': 'Толщина рамки', 'theme': 'Тема', 'show axes': 'Оси', 'show grid': 'Сетка',
    'grid size': 'Шаг сетки', 'grid color': 'Цвет сетки', 'axes color': 'Цвет осей', 'axes size': 'Длина осей', 'snap': 'Привязка к сетке',
    'snap grid': 'Шаг привязки', 'snap distance': 'Радиус привязки', 'camera type': 'Камера', 'camera projection': 'Проекция',
    'can rotate camera': 'Вращать камеру', 'can zoom camera': 'Масштабировать', 'drag smoothing': 'Плавность перетаскивания',
    'steps animation': 'Анимация шагов', 'steps duration': 'Длительность шага, мс', 'ui position': 'Панель UI', 'ui align': 'Выравнивание UI',
    'background': 'Фон вокруг сцены', 'scene padding': 'Отступ, px', 'frame radius': 'Скругление, px', 'scene aspect': 'Пропорции 3D', 'scene max width': 'Макс. ширина, px',
};
const KIND_HINT = { string: '"текст"', number: 'число или выражение', bool: 'true / false', color: '#rrggbb', ref: 'имя объекта', xyz: '(x, y, z)', tuple: '(a, b)', list: '(a, b, …)', names: '(A, B, …)', expr: 'выражение', enum: 'вариант' };

const CSS = `
.se{--se-mono:var(--pg-mono,ui-monospace,'SF Mono',Menlo,Consolas,monospace);display:grid;grid-template-columns:minmax(180px,230px) minmax(0,1fr) minmax(260px,330px);gap:.6rem;min-height:0;height:100%;font-size:.84rem;color:var(--text-primary)}
.se *{box-sizing:border-box}
.se-c1{order:1}.se-c3{order:2}.se-c2{order:3}
.se-stage{position:relative;width:100%;flex:1 0 auto;display:flex;flex-direction:column;align-items:center;gap:.4rem}
.se-stage>.se-inline{align-self:stretch;flex:1 0 auto;height:auto;min-height:440px}
.se-ov{position:absolute;z-index:30;touch-action:none;user-select:none;-webkit-user-select:none;cursor:default;overflow:visible}
.se-ov.hover{cursor:move}
.se-ov text{font:600 11px var(--se-mono);paint-order:stroke;stroke:var(--bg-body,#000);stroke-width:3px}
.se-hint{font-size:.72rem;color:var(--text-tertiary);text-align:center;max-width:640px}
.se-frame-wrap iframe.se-next{position:absolute;inset:0;opacity:0;pointer-events:none}
.se-inline.se-next{position:absolute;inset:0;opacity:0;pointer-events:none}
.se-col{display:flex;flex-direction:column;min-height:0;border:1px solid var(--border);border-radius:var(--r,10px);background:var(--bg-raised,var(--bg-card));overflow:hidden}
.se-h{display:flex;align-items:center;gap:.4rem;padding:.45rem .55rem;border-bottom:1px solid var(--border);min-height:2.4rem}
.se-h b{font-weight:600;font-size:.82rem}
.se-grow{flex:1}
.se-btn{font:inherit;font-size:.78rem;padding:.28rem .55rem;border-radius:6px;border:1px solid var(--border-strong,var(--border));background:transparent;color:var(--text-primary);cursor:pointer;white-space:nowrap}
.se-btn:hover{border-color:var(--accent)}
.se-btn.on{background:var(--accent-soft);border-color:var(--accent)}
.se-btn.danger:hover{border-color:#ef4444;color:#ef4444}
.se-btn:disabled{opacity:.45;cursor:default}
.se-search{width:100%;font:inherit;font-size:.8rem;padding:.3rem .5rem;border-radius:6px;border:1px solid var(--border);background:var(--bg-sunken,transparent);color:var(--text-primary)}
.se-list{flex:1;overflow:auto;padding:.25rem}
.se-item{display:flex;width:100%;gap:.45rem;align-items:baseline;border:0;background:transparent;color:var(--text-primary);font:inherit;font-size:.82rem;padding:.3rem .45rem;border-radius:6px;cursor:pointer;text-align:left}
.se-item:hover{background:var(--accent-soft)}
.se-item.on{background:var(--accent-soft);box-shadow:inset 2px 0 0 var(--accent)}
.se-item .t{color:var(--text-tertiary);font-size:.74rem;white-space:nowrap}
.se-item .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--se-mono)}
.se-item .ln{margin-left:auto;color:var(--text-tertiary);font-size:.7rem}
.se-insp{flex:1;overflow:auto;padding:.5rem .6rem;display:grid;gap:.35rem;align-content:start}
.se-row{display:grid;grid-template-columns:8.2rem minmax(0,1fr);align-items:center;gap:.45rem}
.se-row>span{color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem}
.se-row>span small{display:block;color:var(--text-tertiary);font-family:var(--se-mono);font-size:.68rem}
.se-row.set>span{color:var(--text-primary)}
.se-w{display:flex;gap:.3rem;min-width:0}
.se-w input,.se-w select,.se-w textarea{font:inherit;font-size:.8rem;min-width:0;flex:1;padding:.26rem .45rem;border-radius:6px;border:1px solid var(--border);background:var(--bg-sunken,transparent);color:var(--text-primary)}
.se-w input[type=text],.se-w textarea{font-family:var(--se-mono);font-size:.78rem}
.se-w input[type=color]{flex:0 0 2rem;padding:1px;height:1.75rem}
.se-w textarea{resize:vertical;min-height:4.5rem}
.se-w input:focus,.se-w select:focus,.se-w textarea:focus,.se-search:focus{outline:none;border-color:var(--accent)}
.se-sec{margin:.5rem 0 .1rem;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--text-tertiary)}
.se details>summary{cursor:pointer;color:var(--text-secondary);font-size:.78rem;padding:.3rem 0}
.se details[open]>summary{margin-bottom:.3rem}
.se-muted{color:var(--text-tertiary);font-size:.76rem;line-height:1.45}
.se-code{flex:1;width:100%;border:0;resize:none;padding:.6rem .7rem;font-family:var(--se-mono);font-size:.8rem;line-height:1.5;background:transparent;color:var(--text-primary);tab-size:4;white-space:pre;outline:none}
.se-prev-body{flex:1;overflow:auto;padding:.6rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;background:var(--bg-sunken,transparent)}
.se-frame-wrap{position:relative;width:100%;max-width:900px;border-radius:.75rem;overflow:hidden;border:1px solid var(--border);background:var(--bg-card);box-shadow:var(--shadow)}
.se-frame-wrap iframe{display:block;width:100%;height:100%;border:0;background:transparent}
.se-inline{width:100%;height:100%;min-height:360px}
.se-err{width:100%;max-width:640px;color:#ef4444;font-family:var(--se-mono);font-size:.76rem;white-space:pre-wrap}
.se-status{font-size:.74rem;color:var(--text-tertiary)}
.se-status.bad{color:#ef4444}
.se-cat{position:absolute;z-index:50;width:min(560px,92vw);max-height:min(70vh,560px);overflow:auto;padding:.6rem;border-radius:12px;border:1px solid var(--border-strong,var(--border));background:var(--bg-body,#0c1120);box-shadow:var(--shadow-lg,0 20px 50px rgba(0,0,0,.5))}
.se-cat h4{margin:.5rem 0 .3rem;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--text-tertiary);font-weight:600}
.se-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.3rem}
.se-cat button{font:inherit;font-size:.8rem;text-align:left;padding:.35rem .5rem;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text-primary);cursor:pointer;display:flex;flex-direction:column}
.se-cat button small{color:var(--text-tertiary);font-family:var(--se-mono);font-size:.68rem}
.se-cat button:hover{border-color:var(--accent);background:var(--accent-soft)}
.se-code-mode .se-col.se-c2{display:none}
.se-code-mode{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)}
.se-code-mode .se-col.se-c1 .se-list,.se-code-mode .se-col.se-c1 .se-search{display:none}
@media (max-width:1100px){.se{grid-template-columns:minmax(180px,220px) minmax(0,1fr);height:auto}.se-col.se-c3{grid-column:1/-1;order:0;min-height:480px}.se-col{max-height:70vh}}
@media (max-width:700px){.se{grid-template-columns:1fr}.se-col{max-height:none}.se-list{max-height:40vh}}
`;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const baseLabel = (b) => (b.kw === 'draw' ? 'draw ' : '') + (b.type === 'Angle3D' ? b.type : b.type.replace(/(2D|3D)$/, ''));

export async function mountStructuredEditor(host, opts = {}) {
    const schema = await loadSchema();
    const mode = opts.mode === 'reference' ? 'reference' : 'playground';
    const sceneKeys = schema.scene.map((s) => s.key);
    const typeByLabel = new Map(schema.types.map((t) => [t.label, t]));
    const sceneByKey = new Map(schema.scene.map((s) => [s.key, s]));

    if (!document.getElementById('se-style')) {
        const st = document.createElement('style'); st.id = 'se-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    host.innerHTML = `
      <div class="se">
        <div class="se-col se-c1">
          <div class="se-h"><b>Объекты</b><span class="se-grow"></span>
            <button type="button" class="se-btn" data-a="add" title="Добавить объект любого типа">+ Добавить</button>
            <button type="button" class="se-btn" data-a="code" title="Весь код сцены текстом">Код</button>
          </div>
          <div style="padding:.4rem .45rem 0"><input class="se-search" type="search" placeholder="Поиск: имя или тип" aria-label="Поиск объектов"></div>
          <div class="se-list" role="listbox" aria-label="Объекты сцены"></div>
          <textarea class="se-code" spellcheck="false" aria-label="Код GMS" hidden></textarea>
        </div>
        <div class="se-col se-c2">
          <div class="se-h se-insp-h"></div>
          <div class="se-insp"></div>
        </div>
        <div class="se-col se-c3">
          <div class="se-h"><b>Сцена</b><span class="se-status"></span><span class="se-grow"></span>
            <span class="se-tools"></span>
            <button type="button" class="se-btn on" data-a="edit" title="Правка мышью: выделение, рамка, перетаскивание (Shift/Ctrl — несколько)">✥ Правка</button>
            <button type="button" class="se-btn" data-a="play" title="Сцена работает как у посетителя">▶ Просмотр</button>
          </div>
          <div class="se-prev-body"></div>
        </div>
      </div>`;
    const root = host.querySelector('.se');
    const q = (s) => root.querySelector(s);
    const listEl = q('.se-list'), inspEl = q('.se-insp'), inspH = q('.se-insp-h'), codeEl = q('.se-code');
    const searchEl = q('.se-search'), statusEl = q('.se-status'), prevBody = q('.se-prev-body'), toolsEl = q('.se-tools');

    let model = M.parseGms(opts.source || '[\n]', sceneKeys);
    let selected = 'scene';          // 'scene' | блок модели (основной выбранный)
    const sel = new Set();           // все выделенные объекты (мышью в сцене или Ctrl/Shift в списке)
    let editMode = true;             // правка мышью поверх предпросмотра
    let codeMode = false;

    const src = () => M.serializeGms(model);
    const is3D = () => /^\s*field depth\s*=/m.test(src()) || M.blocks(model).some((b) => /3D$/.test(b.type) || ((typeByLabel.get(baseLabel(b)) || {}).dim === '3D'));

    // ── список ────────────────────────────────────────────────────────────────
    function renderList() {
        const f = searchEl.value.trim().toLowerCase();
        const lines = M.segLines(model);
        const items = [`<button type="button" class="se-item${selected === 'scene' ? ' on' : ''}" data-i="scene"><span class="n">⚙ Сцена</span><span class="t">${M.blocks(model).length} об.</span></button>`];
        M.blocks(model).forEach((b, i) => {
            const name = M.unquote(M.getField(b, 'name') || '') || '—';
            const lbl = baseLabel(b);
            const title = TYPE_TITLES[lbl] || lbl;
            if (f && !(name.toLowerCase().includes(f) || lbl.toLowerCase().includes(f) || title.toLowerCase().includes(f))) return;
            items.push(`<button type="button" class="se-item${selected === b || sel.has(b) ? ' on' : ''}" data-i="${i}" title="${esc(b.kw + ' ' + b.type)}"><span class="n">${esc(name)}</span><span class="t">${esc(title)}</span><span class="ln">${lines.get(b)}</span></button>`);
        });
        listEl.innerHTML = items.join('');
    }
    listEl.addEventListener('click', (e) => {
        const it = e.target.closest('.se-item'); if (!it) return;
        const b = it.dataset.i === 'scene' ? 'scene' : M.blocks(model)[+it.dataset.i];
        if (b !== 'scene' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
            if (selected !== 'scene') sel.add(selected);
            if (sel.has(b)) { sel.delete(b); selected = [...sel].pop() || 'scene'; } else { sel.add(b); selected = b; }
            renderList(); renderInspector(); drawOverlay();
            return;
        }
        select(b);
    });
    searchEl.addEventListener('input', renderList);

    // ── виджеты ───────────────────────────────────────────────────────────────
    // Поле объекта или параметр сцены: kind — вид из схемы; get/set — сырое значение GMS.
    function widget(kind, value, options, set, placeholder) {
        const w = document.createElement('div'); w.className = 'se-w';
        const v = value == null ? '' : value;
        const mkText = (ph) => {
            const inp = document.createElement('input'); inp.type = 'text'; inp.value = v; inp.placeholder = ph || '';
            inp.addEventListener('input', () => set(inp.value.trim()));
            return inp;
        };
        if (kind === 'bool' && (v === '' || v === 'true' || v === 'false')) {
            const s = document.createElement('select');
            s.innerHTML = `<option value="">${esc(placeholder ? 'по умолчанию (' + placeholder + ')' : 'по умолчанию')}</option><option>true</option><option>false</option>`;
            s.value = v; s.addEventListener('change', () => set(s.value));
            w.append(s);
        } else if ((kind === 'enum' || kind === 'qenum') && options && (v === '' || options.includes(M.unquote(v)))) {
            const s = document.createElement('select');
            s.innerHTML = `<option value="">${esc(placeholder ? 'по умолчанию (' + placeholder + ')' : 'по умолчанию')}</option>` + options.map((o) => `<option>${esc(o)}</option>`).join('');
            s.value = M.unquote(v); s.addEventListener('change', () => set(s.value && kind === 'qenum' ? '"' + s.value + '"' : s.value));
            w.append(s);
        } else if (kind === 'color' || kind === 'qcolor') {
            const inp = mkText(placeholder || '#rrggbb');
            const c = document.createElement('input'); c.type = 'color';
            const hex = /^"?(#[0-9a-f]{6})"?$/i.exec(v); c.value = hex ? hex[1] : '#808080';
            c.title = 'Выбрать цвет';
            c.addEventListener('input', () => { inp.value = kind === 'qcolor' ? '"' + c.value + '"' : c.value; set(inp.value); });
            inp.addEventListener('input', () => { const h = /^"?(#[0-9a-f]{6})"?$/i.exec(inp.value); if (h) c.value = h[1]; });
            w.append(c, inp);
        } else if (kind === 'text') {
            const ta = document.createElement('textarea');
            const simple = /^"((?:[^"\\]|\\.)*)"$/.exec(v);
            ta.value = simple ? simple[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : v;
            ta.placeholder = 'Текст описания; {имя} — значение переменной, $…$ — формула';
            ta.addEventListener('input', () => set(ta.value === '' ? '' : (simple || !v ? '"' + ta.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"' : ta.value)));
            w.append(ta);
        } else {
            w.append(mkText(placeholder || KIND_HINT[kind] || ''));
        }
        return w;
    }
    function row(title, sub, w, isSet) {
        const r = document.createElement('label'); r.className = 'se-row' + (isSet ? ' set' : '');
        r.innerHTML = `<span title="${esc(sub || title)}">${esc(title)}${sub && sub !== title ? `<small>${esc(sub)}</small>` : ''}</span>`;
        r.append(w);
        return r;
    }
    const fmtDef = (d) => d === undefined ? '' : (Array.isArray(d) ? '(' + d.join(', ') + ')' : String(d));

    // ── инспектор ────────────────────────────────────────────────────────────
    function renderInspector() {
        inspEl.innerHTML = '';
        if (selected === 'scene') return renderScene();
        if (sel.size > 1) return renderMulti();
        const b = selected;
        const lbl = baseLabel(b), t = typeByLabel.get(lbl);
        inspH.innerHTML = `<b>${esc(TYPE_TITLES[lbl] || lbl)}</b><span class="se-muted" style="font-family:var(--se-mono)">${esc(b.kw + ' ' + b.type)}</span><span class="se-grow"></span>
          <button type="button" class="se-btn" data-b="up" title="Выше">↑</button><button type="button" class="se-btn" data-b="down" title="Ниже">↓</button>
          <button type="button" class="se-btn" data-b="dup" title="Дублировать">⧉</button><button type="button" class="se-btn danger" data-b="del" title="Удалить">✕</button>`;
        const fields = t ? t.fields : [];
        const known = new Set(fields.map((f) => f.name));
        const present = b.fields.filter((f) => f.key);
        const onSet = (key, nameChanged) => (val) => { M.setField(b, key, val); changed(key === 'name'); };
        // 1) заданные поля — в порядке кода
        if (present.length) inspEl.insertAdjacentHTML('beforeend', '<div class="se-sec">Заданные поля</div>');
        for (const f of present) {
            const sf = fields.find((x) => x.name === f.key);
            const kind = sf ? sf.kind : 'expr';
            inspEl.append(row(sf && sf.label ? sf.label : f.key, f.key + (sf ? '' : ' · нет в схеме'), widget(kind, f.value, sf && sf.options, onSet(f.key), fmtDef(sf && sf.default)), true));
        }
        // 2) все остальные поля типа
        const rest = fields.filter((f) => !present.some((p) => p.key === f.name));
        if (rest.length) {
            const d = document.createElement('details'); d.open = present.length < 4;
            d.innerHTML = `<summary>Все поля типа (${rest.length})</summary>`;
            const box = document.createElement('div'); box.style.cssText = 'display:grid;gap:.35rem';
            for (const f of rest) box.append(row(f.label || f.name, f.name + (f.required ? ' · обязательное' : ''), widget(f.kind, '', f.options, (val) => { M.setField(b, f.name, val); changed(false, true); }, fmtDef(f.default)), false));
            d.append(box); inspEl.append(d);
        }
        // 3) своё поле
        const add = document.createElement('div'); add.className = 'se-w'; add.style.marginTop = '.4rem';
        add.innerHTML = '<input type="text" placeholder="своё поле = значение" aria-label="Добавить поле"><button type="button" class="se-btn">Добавить</button>';
        add.querySelector('button').onclick = () => {
            const m = /^\s*([A-Za-z_]\w*)\s*=\s*([\s\S]+?)\s*;?\s*$/.exec(add.querySelector('input').value);
            if (!m) return;
            M.setField(b, m[1], m[2]); changed(true, true);
        };
        inspEl.append(add);
        if (t && t.hint) inspEl.insertAdjacentHTML('beforeend', `<p class="se-muted">Обязательно: ${esc((/\(([^)]*)\)/.exec(t.hint) || [, t.hint])[1])}</p>`);
        void known;
    }
    inspH.addEventListener('click', (e) => {
        const a = e.target.closest('[data-b]'); if (!a || selected === 'scene') return;
        const b = selected;
        if (a.dataset.b === 'up') M.moveBlock(model, b, -1);
        else if (a.dataset.b === 'down') M.moveBlock(model, b, 1);
        else if (a.dataset.b === 'dup') {
            const c = M.cloneBlock(b); const n = M.unquote(M.getField(c, 'name') || '');
            if (n) M.setField(c, 'name', '"' + uniqueName(n + '_copy') + '"');
            M.addBlock(model, c, b); selected = c;
        } else if (a.dataset.b === 'del') {
            if (!confirm('Удалить объект ' + (M.unquote(M.getField(b, 'name') || '') || b.type) + '?')) return;
            M.removeBlock(model, b); selected = 'scene'; sel.clear();
        }
        changed(true, true);
    });

    function renderScene() {
        inspH.innerHTML = '<b>Параметры сцены</b><span class="se-grow"></span><span class="se-muted">пусто = по умолчанию</span>';
        const groups = new Map();
        for (const p of schema.scene) {
            if (mode === 'reference' && /^(ui |show description|background|scene |frame radius)/.test(p.key)) { /* профиль песочницы — в справочнике не влияет */ }
            if (!groups.has(p.group)) groups.set(p.group, []);
            groups.get(p.group).push(p);
        }
        const order = ['Описание', 'Поле', 'Оси и сетка', 'Камера', 'Привязка', 'Шаги', 'Песочница', 'Прочее'];
        for (const g of order) {
            const list = groups.get(g); if (!list) continue;
            const d = document.createElement('details');
            const setCount = list.filter((p) => M.getParam(model, p.key) !== undefined).length;
            d.open = g === 'Описание' || g === 'Поле' || setCount > 0;
            d.innerHTML = `<summary>${esc(g)}${setCount ? ` · ${setCount}` : ''}${g === 'Песочница' && mode === 'reference' ? ' (в справочнике не действуют)' : ''}</summary>`;
            const box = document.createElement('div'); box.style.cssText = 'display:grid;gap:.35rem';
            for (const p of list) {
                const v = M.getParam(model, p.key);
                box.append(row(SCENE_TITLES[p.key] || p.key, p.key, widget(p.kind, v, p.options, (val) => { M.setParam(model, p.key, val); changed(false); }), v !== undefined));
            }
            d.append(box); inspEl.append(d);
        }
    }

    // ── каталог «+ Добавить» ────────────────────────────────────────────────
    let catEl = null;
    function closeCat() { if (catEl) { catEl.remove(); catEl = null; document.removeEventListener('pointerdown', outside, true); } }
    function outside(e) { if (catEl && !catEl.contains(e.target) && !e.target.closest('[data-a="add"]')) closeCat(); }
    function openCat(anchor) {
        if (catEl) return closeCat();
        catEl = document.createElement('div'); catEl.className = 'se-cat';
        const three = is3D();
        catEl.innerHTML = `<input class="se-search" type="search" placeholder="Найти тип…" aria-label="Найти тип"><p class="se-muted" style="margin:.4rem 0 0">Сцена сейчас ${three ? '3D' : '2D'}: объекты добавляются в ${three ? '3D' : '2D'}-варианте. Вместе с объектом добавляется всё, что ему нужно (точки, функции, данные).</p>` +
            GROUPS.map(([g, labels]) => `<h4>${esc(g)}</h4><div class="se-cat-grid">` + labels.filter((l) => typeByLabel.has(l)).map((l) =>
                `<button type="button" data-t="${esc(l)}"><span>${esc(TYPE_TITLES[l] || l)}</span><small>${esc(l.startsWith('draw ') ? l : 'new ' + l)}</small></button>`).join('') + '</div>').join('');
        const r = anchor.getBoundingClientRect(), hr = host.getBoundingClientRect();
        host.style.position = host.style.position || 'relative';
        catEl.style.left = Math.max(0, r.left - hr.left) + 'px'; catEl.style.top = (r.bottom - hr.top + 6) + 'px';
        host.appendChild(catEl);
        const s = catEl.querySelector('input'); s.focus();
        s.addEventListener('input', () => {
            const f = s.value.trim().toLowerCase();
            catEl.querySelectorAll('[data-t]').forEach((b) => { b.hidden = f && !b.textContent.toLowerCase().includes(f); });
        });
        catEl.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { addType(b.dataset.t); closeCat(); } });
        document.addEventListener('pointerdown', outside, true);
    }
    function uniqueName(base) {
        const s = src(); let n = base, k = 1;
        while (s.includes('"' + n + '"')) n = base + (++k);
        return n;
    }
    function addType(label) {
        const t = typeByLabel.get(label); if (!t || !t.template) return;
        let code = (is3D() && t.template.code3) || t.template.code;
        const s = src();
        let n = 1;
        const names = (c) => [...c.matchAll(/name\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
        while (names(code.split('$').join(String(n))).some((nm) => s.includes('"' + nm + '"') || new RegExp('\\b' + nm + '\\b').test(s))) n++;
        code = code.split('$').join(String(n));
        const at = s.lastIndexOf(']');
        const before = at >= 0 ? s.slice(0, at).replace(/\s*$/, '\n') : s + '\n';
        const next = before + code + '\n' + (at >= 0 ? s.slice(at) : '');
        const mainName = names(code).pop();
        model = M.parseGms(next, sceneKeys);
        selected = M.blocks(model).find((b) => M.unquote(M.getField(b, 'name') || '') === mainName) || 'scene';
        setSel(selected === 'scene' ? [] : [selected]);
        changed(true, true);
    }

    // ── режим «Код» ──────────────────────────────────────────────────────────
    function setCodeMode(on) {
        codeMode = on;
        root.classList.toggle('se-code-mode', on);
        codeEl.hidden = !on;
        q('[data-a="code"]').classList.toggle('on', on);
        q('[data-a="code"]').textContent = on ? 'Объекты' : 'Код';
        if (on) { codeEl.value = src(); codeEl.focus(); }
        else { renderList(); renderInspector(); }
    }
    let codeTimer = 0;
    codeEl.addEventListener('input', () => {
        clearTimeout(codeTimer);
        codeTimer = setTimeout(() => {
            const keepName = selected !== 'scene' ? M.unquote(M.getField(selected, 'name') || '') : null;
            model = M.parseGms(codeEl.value, sceneKeys); sel.clear();
            selected = (keepName && M.blocks(model).find((b) => M.unquote(M.getField(b, 'name') || '') === keepName)) || 'scene';
            emit(); schedule();
        }, 250);
    });
    codeEl.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') { e.preventDefault(); const p = codeEl.selectionStart; codeEl.setRangeText('    ', p, codeEl.selectionEnd, 'end'); codeEl.dispatchEvent(new Event('input')); }
    });

    root.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]'); if (!a) return;
        if (a.dataset.a === 'add') openCat(a);
        if (a.dataset.a === 'code') setCodeMode(!codeMode);
        if (a.dataset.a === 'edit' || a.dataset.a === 'play') setEditMode(a.dataset.a === 'edit');
    });

    // ── изменения и предпросмотр ─────────────────────────────────────────────
    function emit() { if (opts.onChange) { try { opts.onChange(src()); } catch (e) { console.warn(e); } } }
    function changed(relist, reinspect) {
        if (relist) renderList();
        else {
            // обновить подпись выбранного объекта в списке без перерисовки
            const on = listEl.querySelector('.se-item.on .n');
            if (on && selected !== 'scene') on.textContent = M.unquote(M.getField(selected, 'name') || '') || '—';
        }
        if (reinspect) renderInspector();
        emit(); schedule();
    }
    function setSel(list) { sel.clear(); for (const b of list) sel.add(b); }
    function select(sel) {
        if (typeof sel === 'string' && sel !== 'scene') sel = M.blocks(model).find((b) => M.unquote(M.getField(b, 'name') || '') === sel) || 'scene';
        selected = sel; setSel(sel === 'scene' ? [] : [sel]);
        renderList(); renderInspector(); drawOverlay();
        const on = listEl.querySelector('.se-item.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    }

    let inlineSeq = 0, inlineHost = null;
    let compileTimer = 0, compiler = null, frame = null, detach = null, inline = null, lastHtml = '';
    function schedule() { clearTimeout(compileTimer); compileTimer = setTimeout(preview, 380); }
    async function preview() {
        if (!compiler) compiler = await import(new URL('./gms-compiler.js', import.meta.url).href);
        const s = src();
        let r;
        try { r = mode === 'playground' ? compiler.compile(s, { target: 'playground' }) : compiler.compile(s); }
        catch (e) { r = { success: false, errors: [String(e && e.message || e)] }; }
        let errBox = prevBody.querySelector('.se-err');
        if (!r.success) {
            statusEl.textContent = '· ошибка'; statusEl.classList.add('bad');
            if (!errBox) { errBox = document.createElement('div'); errBox.className = 'se-err'; prevBody.prepend(errBox); }
            errBox.textContent = r.errors.join('\n');
            return;
        }
        if (errBox) errBox.remove();
        statusEl.textContent = '· ок'; statusEl.classList.remove('bad');
        if (r.html === lastHtml) return;
        lastHtml = r.html;
        const stage = ensureStage();
        if (mode === 'reference') {
            let wrap = stage.querySelector('.se-frame-wrap');
            if (!wrap) { wrap = document.createElement('div'); wrap.className = 'se-frame-wrap'; wrap.style.height = '420px'; stage.prepend(wrap); }
            const embed = await import(new URL('./gms-embed.js', import.meta.url).href);
            const nf = document.createElement('iframe');
            nf.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-popups');
            nf.title = 'Предпросмотр примера';
            if (frame) nf.className = 'se-next';
            wrap.append(nf);
            const nd = embed.attachFrame(nf, { fit: wrap, onLoad: () => {
                if (frame && frame !== nf) { try { if (detach) detach(); } catch (e) {} frame.remove(); }
                nf.className = ''; frame = nf; detach = nd;
                setTimeout(drawOverlay, 60);
            } });
            nf.srcdoc = r.html;
        } else {
            const { mountInline } = await import(new URL('./gms-inline.js', import.meta.url).href);
            const old = inline, oldHost = stage.querySelector('.se-inline:not(.se-next)');
            const h = document.createElement('div'); h.className = 'se-inline' + (old ? ' se-next' : ''); stage.prepend(h);
            const seq = ++inlineSeq;
            const ni = await mountInline(h, r.html, { onError: (m) => { statusEl.textContent = '· ' + m; statusEl.classList.add('bad'); } });
            if (seq !== inlineSeq) { try { ni.destroy(); } catch (e) {} h.remove(); return; }   // уже собирается более новая версия
            try { ni.setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark'); } catch (e) {}
            if (old) { try { old.destroy(); } catch (e) {} }
            if (oldHost) oldHost.remove();
            h.className = 'se-inline'; inline = ni; inlineHost = h;
            stage.querySelectorAll('.se-inline').forEach((x) => { if (x !== h && !x.classList.contains('se-next')) x.remove(); });
            setTimeout(drawOverlay, 80);
        }
    }

    // ── правка мышью прямо в сцене (2D) ──────────────────────────────────────
    // Поверх холста лежит прозрачный SVG-слой: щелчок выделяет объект (Shift/Ctrl —
    // добавить к выделению), рамка по пустому месту выделяет всё внутри, перетаскивание
    // двигает все выделенные объекты. Двигаются точки с числовыми координатами
    // pos = (x, y): у отрезка, окружности, фигуры, угла и т. п. — точки, на которых они
    // построены; у текста, формулы, картинки, диаграмм — их собственный pos.
    let ov = null, ovStage = null;
    function ensureStage() {
        let st = prevBody.querySelector('.se-stage');
        if (!st) {
            st = document.createElement('div'); st.className = 'se-stage';
            st.innerHTML = '<p class="se-hint">Щелчок — выделить · Shift/Ctrl+щелчок — добавить · рамка по пустому месту — выделить несколько · тяните — переместить (Shift — по сетке 0,5) · Delete — удалить · Ctrl+D — копия · стрелки — сдвиг</p>';
            prevBody.append(st);
            ov = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ov.setAttribute('class', 'se-ov'); ov.setAttribute('tabindex', '0');
            st.append(ov); ovStage = st;
            bindOverlay();
        }
        return st;
    }
    function setEditMode(on) {
        editMode = on;
        q('[data-a="edit"]').classList.toggle('on', on); q('[data-a="play"]').classList.toggle('on', !on);
        drawOverlay();
    }
    const nameOf = (b) => M.unquote(M.getField(b, 'name') || '');
    const byName = () => { const m = new Map(); for (const b of M.blocks(model)) { const n = nameOf(b); if (n) m.set(n, b); } return m; };
    const NUM = '\\s*(-?(?:\\d+\\.?\\d*|\\.\\d+))\\s*';
    const LIT2 = new RegExp('^\\(' + NUM + ',' + NUM + '\\)$');
    const litPos = (b) => { const v = M.getField(b, 'pos'); const m = v && LIT2.exec(v); return m ? { x: +m[1], y: +m[2] } : null; };

    // Окно сцены, её холст и его прямоугольник в координатах слоя.
    function sceneCtx() {
        const w = sceneWindow(); if (!w || !ovStage) return null;
        let canvas = null, off = { x: 0, y: 0 };
        try {
            if (mode === 'reference') {
                const d = frame && frame.contentDocument; if (!d) return null;
                canvas = d.querySelector('.canvas-wrapper canvas') || d.querySelector('canvas');
                const fr = frame.getBoundingClientRect(); off = { x: fr.left, y: fr.top };
            } else {
                const h = inlineHost;
                const root = h && h.shadowRoot; canvas = root && (root.querySelector('.canvas-wrapper canvas') || root.querySelector('canvas'));
            }
        } catch (e) { return null; }
        let cam = null; try { cam = w.camera; } catch (e) {}
        if (!canvas || !cam || typeof cam.offsetX !== 'number') return null;   // 3D-сцены — только список и инспектор
        const cr = canvas.getBoundingClientRect(), sr = ovStage.getBoundingClientRect();
        const rect = { left: off.x + cr.left - sr.left, top: off.y + cr.top - sr.top, width: cr.width, height: cr.height };
        const num = (k, d) => { const v = parseFloat(M.getParam(model, k)); return isFinite(v) && v > 0 ? v : d; };
        const FW = num('field width', 50), FH = num('field height', 30);
        const scale = Math.min(rect.width / FW, rect.height / FH) * (cam.zoom || 1);
        return {
            w, rect, scale,
            px: (x, y) => ({ x: rect.width / 2 + (x - cam.offsetX) * scale, y: rect.height / 2 - (y - cam.offsetY) * scale }),
            fx: (x, y) => ({ x: (x - rect.width / 2) / scale + cam.offsetX, y: -(y - rect.height / 2) / scale + cam.offsetY }),
        };
    }
    // Геометрия объектов для выделения: из рантайма сцены (точки, отрезки, окружности),
    // остальное — по собственному числовому pos.
    function sceneItems(ctx) {
        const out = [];
        const w = ctx.w, names = byName();
        const rt = (arr) => { try { return Array.isArray(w[arr]) ? w[arr] : []; } catch (e) { return []; } };
        const seen = new Set();
        for (const p of rt('points')) { const b = names.get(p && p.name); if (!b || !p.pos || p.active === false) continue; seen.add(b); out.push({ b, kind: 'pt', a: ctx.px(p.pos.x, p.pos.y), rt: p }); }
        for (const l of rt('lines')) { const b = names.get(l && l.name); if (!b || !l.pA || !l.pB || l.active === false) continue; seen.add(b); out.push({ b, kind: 'seg', a: ctx.px(l.pA.pos.x, l.pA.pos.y), c: ctx.px(l.pB.pos.x, l.pB.pos.y) }); }
        for (const c of rt('circles')) {
            const b = names.get(c && c.name), ctr = c && (c.center || c.centerPoint);
            if (!b || !ctr || !ctr.pos || !(typeof c.radius === 'number')) continue;
            seen.add(b); out.push({ b, kind: 'circ', a: ctx.px(ctr.pos.x, ctr.pos.y), r: c.radius * ctx.scale });
        }
        for (const b of M.blocks(model)) {
            if (seen.has(b)) continue;
            const lp = litPos(b); if (lp) out.push({ b, kind: 'box', a: ctx.px(lp.x, lp.y) });
        }
        return out;
    }
    function hitTest(items, p) {
        let best = null;
        const consider = (it, d, lim) => { if (d <= lim && (!best || d < best.d)) best = { it, d }; };
        for (const it of items) {
            if (it.kind === 'pt' || it.kind === 'box') consider(it, Math.hypot(it.a.x - p.x, it.a.y - p.y) - 4, 12);
            else if (it.kind === 'seg') {
                const dx = it.c.x - it.a.x, dy = it.c.y - it.a.y, L = dx * dx + dy * dy || 1;
                const t = Math.max(0, Math.min(1, ((p.x - it.a.x) * dx + (p.y - it.a.y) * dy) / L));
                consider(it, Math.hypot(it.a.x + t * dx - p.x, it.a.y + t * dy - p.y) + 2, 8);
            } else if (it.kind === 'circ') consider(it, Math.abs(Math.hypot(it.a.x - p.x, it.a.y - p.y) - it.r) + 2, 8);
        }
        return best && best.it.b;
    }
    // Что фактически сдвигается при перемещении набора объектов.
    function movables(list) {
        const names = byName(), out = new Set(), seen = new Set();
        const visit = (b, direct) => {
            if (!b || seen.has(b)) return; seen.add(b);
            if (litPos(b)) { out.add(b); return; }
            if (b.kw === 'new' && /^Point/.test(b.type) && !direct) return;   // построенная точка — не трогаем её опоры
            for (const f of b.fields) {
                if (!f.key || f.key === 'name') continue;
                for (const m of String(f.value).matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) { const r = names.get(m[0]); if (r && r !== b) visit(r, false); }
            }
        };
        for (const b of list) visit(b, true);
        return [...out];
    }

    let drag = null, hoverB = null;
    function drawOverlay() {
        if (!ov) return;
        const ctx = editMode && !codeMode ? sceneCtx() : null;
        if (!ctx) { ov.style.display = 'none'; return; }
        ov.style.display = '';
        Object.assign(ov.style, { left: ctx.rect.left + 'px', top: ctx.rect.top + 'px', width: ctx.rect.width + 'px', height: ctx.rect.height + 'px' });
        const items = sceneItems(ctx);
        const accent = 'var(--accent,#5b8cff)';
        const dd = drag && drag.moved ? drag.dpx : { x: 0, y: 0 };
        const movedSet = drag && drag.moved ? new Set(drag.list) : null;
        const parts = [];
        for (const it of items) {
            const on = sel.has(it.b) || selected === it.b, hv = it.b === hoverB;
            if (!on && !hv) continue;
            const o = movedSet && (movedSet.has(it.b) || drag.mov.includes(it.b)) ? dd : { x: 0, y: 0 };
            const st = `style="stroke:${accent}" stroke-width="${on ? 3 : 1.5}" fill="none" opacity="${on ? 0.9 : 0.55}"`;
            if (it.kind === 'pt') parts.push(`<circle cx="${it.a.x + o.x}" cy="${it.a.y + o.y}" r="10" ${st}/>`);
            else if (it.kind === 'box') parts.push(`<rect x="${it.a.x + o.x - 9}" y="${it.a.y + o.y - 9}" width="18" height="18" rx="3" ${st}/>`);
            else if (it.kind === 'seg') parts.push(`<line x1="${it.a.x + o.x}" y1="${it.a.y + o.y}" x2="${it.c.x + o.x}" y2="${it.c.y + o.y}" ${st} stroke-linecap="round" stroke-opacity=".5" stroke-width="${on ? 8 : 5}"/>`);
            else if (it.kind === 'circ') parts.push(`<circle cx="${it.a.x + o.x}" cy="${it.a.y + o.y}" r="${it.r}" ${st}/>`);
            if (on || hv) parts.push(`<text x="${it.a.x + o.x + 12}" y="${it.a.y + o.y - 10}" style="fill:${accent}">${esc(nameOf(it.b))}</text>`);
        }
        if (drag && drag.box) {
            const b = drag.box;
            parts.push(`<rect x="${Math.min(b.x0, b.x1)}" y="${Math.min(b.y0, b.y1)}" width="${Math.abs(b.x1 - b.x0)}" height="${Math.abs(b.y1 - b.y0)}" style="fill:${accent};stroke:${accent}" fill-opacity=".1" stroke-dasharray="4 3"/>`);
        }
        ov.innerHTML = parts.join('');
    }
    function bindOverlay() {
        const pt = (e) => { const r = ov.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
        ov.addEventListener('pointermove', (e) => {
            const ctx = sceneCtx(); if (!ctx) return;
            const p = pt(e);
            if (!drag) {
                const h = hitTest(sceneItems(ctx), p);
                if (h !== hoverB) { hoverB = h; ov.classList.toggle('hover', !!h); drawOverlay(); }
                return;
            }
            if (drag.box) { drag.box.x1 = p.x; drag.box.y1 = p.y; drawOverlay(); return; }
            let dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
            if (!drag.moved && Math.hypot(dx, dy) < 3) return;
            drag.moved = true;
            // смещение в единицах поля (Shift — шаг 0,5)
            let fdx = dx / ctx.scale, fdy = -dy / ctx.scale;
            if (e.shiftKey) { fdx = Math.round(fdx * 2) / 2; fdy = Math.round(fdy * 2) / 2; dx = fdx * ctx.scale; dy = -fdy * ctx.scale; }
            drag.fd = { x: fdx, y: fdy }; drag.dpx = { x: dx, y: dy };
            // точки в живой сцене двигаются сразу — за ними тянется всё построенное на них
            for (const r of drag.rt) { r.p.pos.x = r.x + fdx; r.p.pos.y = r.y + fdy; }
            try { ctx.w.dispatchEvent(new Event('resize')); } catch (er) {}
            drawOverlay();
        });
        ov.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const ctx = sceneCtx(); if (!ctx) return;
            ov.setPointerCapture(e.pointerId); ov.focus({ preventScroll: true });
            const p = pt(e), multi = e.shiftKey || e.ctrlKey || e.metaKey;
            const h = hitTest(sceneItems(ctx), p);
            if (h) {
                if (multi) { if (sel.has(h)) { sel.delete(h); if (selected === h) selected = [...sel].pop() || 'scene'; } else { if (selected !== 'scene') sel.add(selected); sel.add(h); selected = h; } }
                else if (!sel.has(h)) { setSel([h]); selected = h; }
                else selected = h;
                renderList(); renderInspector();
                const list = [...sel];
                const mov = movables(list);
                const names = new Set(mov.map(nameOf));
                const rt = []; try { for (const q of ctx.w.points || []) if (q && names.has(q.name) && q.pos) rt.push({ p: q, x: q.pos.x, y: q.pos.y }); } catch (er) {}
                drag = { p0: p, list, mov, rt, moved: false, fd: { x: 0, y: 0 }, dpx: { x: 0, y: 0 } };
            } else {
                if (!multi) { setSel([]); selected = 'scene'; renderList(); renderInspector(); }
                drag = { p0: p, box: { x0: p.x, y0: p.y, x1: p.x, y1: p.y }, add: multi };
            }
            drawOverlay();
        });
        const end = (e) => {
            if (!drag) return;
            const d = drag; drag = null;
            if (d.box) {
                const ctx = sceneCtx();
                const b = d.box, x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
                if (ctx && x1 - x0 > 3 && y1 - y0 > 3) {
                    const inside = (q) => q.x >= x0 && q.x <= x1 && q.y >= y0 && q.y <= y1;
                    const got = sceneItems(ctx).filter((it) => it.kind === 'seg' ? inside(it.a) && inside(it.c) : inside(it.a)).map((it) => it.b);
                    if (!d.add) sel.clear();
                    for (const g of got) sel.add(g);
                    selected = [...sel].pop() || 'scene';
                    renderList(); renderInspector();
                }
                drawOverlay(); return;
            }
            if (d.moved && (d.fd.x || d.fd.y)) moveBlocks(d.mov, d.fd.x, d.fd.y);
            else drawOverlay();
        };
        ov.addEventListener('pointerup', end);
        ov.addEventListener('pointercancel', end);
        ov.addEventListener('pointerleave', () => { if (!drag && hoverB) { hoverB = null; drawOverlay(); } });
        ov.addEventListener('dblclick', (e) => { if (selected !== 'scene') { const f = inspEl.querySelector('input,textarea,select'); if (f) f.focus(); } });
        // клавиатура: удаление, копия, сдвиг стрелками, выделить всё
        // клавиши действуют, пока последний щелчок был по сцене (а не по полю ввода)
        document.addEventListener('pointerdown', (e) => { kbActive = !!(ov && ov.contains(e.target)); }, true);
        document.addEventListener('keydown', (e) => {
            if (!kbActive || !host.isConnected || !editMode || codeMode) return;
            if (e.target && e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
            const list = [...sel].length ? [...sel] : (selected !== 'scene' ? [selected] : []);
            if (e.key === 'Escape') { setSel([]); selected = 'scene'; renderList(); renderInspector(); drawOverlay(); return; }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault(); const ctx = sceneCtx(); if (!ctx) return;
                setSel(sceneItems(ctx).map((i) => i.b)); selected = [...sel].pop() || 'scene'; renderList(); renderInspector(); drawOverlay(); return;
            }
            if (!list.length) return;
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteBlocks(list); return; }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateBlocks(list); return; }
            const step = e.shiftKey ? 1 : 0.1;
            const dir = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
            if (dir) { e.preventDefault(); moveBlocks(movables(list), dir[0], dir[1]); }
        });
        // слой следует за сценой: прокрутка, изменение размеров, загрузка
        const ro = new ResizeObserver(() => drawOverlay()); ro.observe(prevBody);
        prevBody.addEventListener('scroll', () => drawOverlay(), { passive: true });
        window.addEventListener('resize', drawOverlay);
        // сцена сама меняет размер холста после запуска и при смене панели UI/описания —
        // слой сверяется с холстом несколько раз в секунду (дёшево: только сравнение)
        let sig = '';
        syncTimer = setInterval(() => {
            if (drag || !editMode || codeMode || !host.isConnected) return;
            const c = sceneCtx();
            let cam = null; try { cam = c && c.w.camera; } catch (e) {}
            const k = c ? [c.rect.left, c.rect.top, c.rect.width, c.rect.height, cam.zoom, cam.offsetX, cam.offsetY].map((v) => Math.round(v * 10)).join() : '';
            if (k !== sig) { sig = k; drawOverlay(); }
        }, 250);
    }
    let syncTimer = 0, kbActive = false;
    const r2 = (x) => String(Math.round(x * 100) / 100);
    function moveBlocks(list, dx, dy) {
        if (!list.length) { statusEl.textContent = '· у выделенного нет точек с числовыми координатами'; return; }
        for (const b of list) { const p = litPos(b); if (p) M.setField(b, 'pos', '(' + r2(p.x + dx) + ', ' + r2(p.y + dy) + ')'); }
        statusEl.textContent = '· сдвинуто: ' + list.map(nameOf).join(', ');
        statusEl.classList.remove('bad');
        changed(false, true);
    }
    function deleteBlocks(list) {
        if (!confirm('Удалить: ' + list.map((b) => nameOf(b) || b.type).join(', ') + '?')) return;
        for (const b of list) M.removeBlock(model, b);
        sel.clear(); selected = 'scene';
        changed(true, true);
    }
    // Копия вместе с опорными точками (у копии отрезка — свои концы), ссылки переименовываются.
    function duplicateBlocks(list) {
        const all = [...new Set(movables(list).filter((b) => !list.includes(b)).concat(list))];   // сначала опорные точки
        const ren = new Map();
        for (const b of all) { const n = nameOf(b); if (n) ren.set(n, uniqueName(n + '_copy')); }
        // имена не должны совпасть между собой
        const used = new Set();
        for (const [k, v] of ren) { let n = v, i = 2; while (used.has(n)) n = v + (i++); used.add(n); ren.set(k, n); }
        const re = ren.size ? new RegExp('\\b(' + [...ren.keys()].map((k) => k.replace(/[$]/g, '\\$&')).join('|') + ')\\b', 'g') : null;
        const copies = [];
        for (const b of all) {
            const c = M.cloneBlock(b);
            for (const f of c.fields) if (f.key && re) f.value = f.key === 'name' ? f.value : f.value.replace(re, (m) => ren.get(m));
            const n = nameOf(c); if (n && ren.has(n)) M.setField(c, 'name', '"' + ren.get(n) + '"');
            const p = litPos(c); if (p) M.setField(c, 'pos', '(' + r2(p.x + 1) + ', ' + r2(p.y - 1) + ')');
            M.addBlock(model, c); copies.push(c);
        }
        const shown = copies.filter((c, i) => list.includes(all[i]));
        setSel(shown); selected = shown[shown.length - 1] || 'scene';
        changed(true, true);
    }
    // Несколько выделенных: общие поля задаются всем сразу.
    function renderMulti() {
        const list = [...sel];
        inspH.innerHTML = `<b>Выбрано: ${list.length}</b><span class="se-grow"></span>
          <button type="button" class="se-btn" data-m="dup" title="Копии (Ctrl+D)">⧉</button><button type="button" class="se-btn danger" data-m="del" title="Удалить (Delete)">✕</button>`;
        inspH.querySelector('[data-m="dup"]').onclick = () => duplicateBlocks(list);
        inspH.querySelector('[data-m="del"]').onclick = () => deleteBlocks(list);
        inspEl.insertAdjacentHTML('beforeend', `<p class="se-muted">${list.map((b) => esc(nameOf(b) || b.type)).join(', ')}</p><div class="se-sec">Общие поля</div>`);
        const fieldSets = list.map((b) => { const t = typeByLabel.get(baseLabel(b)); return new Map((t ? t.fields : []).map((f) => [f.name, f])); });
        const common = [...fieldSets[0].values()].filter((f) => f.name !== 'name' && fieldSets.every((m) => m.has(f.name)));
        const rest = document.createElement('details');
        rest.innerHTML = '<summary>Остальные общие поля</summary>';
        const restBox = document.createElement('div'); restBox.style.cssText = 'display:grid;gap:.35rem'; rest.append(restBox);
        for (const f of common) {
            const vals = list.map((b) => M.getField(b, f.name) || '');
            const same = vals.every((v) => v === vals[0]);
            (vals.some((v) => v !== '') || /^(color|thickness|layer|active|size|opacity)$/.test(f.name) ? inspEl : restBox).append(row(f.label || f.name, f.name + (same ? '' : ' · разные'), widget(f.kind, same ? vals[0] : '', f.options, (val) => { for (const b of list) M.setField(b, f.name, val); changed(false); }, same ? fmtDef(f.default) : 'разные значения'), same && vals[0] !== ''));
        }
        if (restBox.childElementCount) inspEl.append(rest);
        if (!common.length) inspEl.insertAdjacentHTML('beforeend', '<p class="se-muted">У выбранных объектов нет общих полей.</p>');
    }

    // Забрать положения перетащенных точек из предпросмотра в поля pos (только числа).
    function sceneWindow() { return mode === 'reference' ? (frame && frame.contentWindow) : (inline && inline.window); }
    function pullPositions() {
        const w = sceneWindow(); if (!w) return 0;
        let n = 0;
        for (const b of M.blocks(model)) {
            if (b.kw !== 'new' || !/^Point(2D|3D)?$/.test(b.type)) continue;
            const name = M.unquote(M.getField(b, 'name') || ''), pos = M.getField(b, 'pos');
            if (!name || !pos || !/^\(\s*-?[\d.]+\s*,\s*-?[\d.]+\s*(,\s*-?[\d.]+\s*)?\)$/.test(pos)) continue;
            let o; try { o = w[name]; } catch (e) { o = null; }
            const p = o && (o.pos || o.position);
            if (!p || typeof p.x !== 'number') continue;
            const r = (x) => String(Math.round(x * 100) / 100);
            const three = pos.split(',').length === 3;
            const nv = '(' + r(p.x) + ', ' + r(p.y) + (three ? ', ' + r(p.z || 0) : '') + ')';
            if (nv !== pos) { M.setField(b, 'pos', nv); n++; }
        }
        if (n) changed(true, true);
        return n;
    }
    const tb = [{ label: 'Забрать положения', title: 'Записать в код положения точек, перетащенных в предпросмотре', onClick: () => { const n = pullPositions(); statusEl.textContent = n ? '· обновлено точек: ' + n : '· точки на месте'; } }]
        .concat(opts.toolbar || []);
    tb.forEach((t) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'se-btn'; b.textContent = t.label; b.title = t.title || '';
        b.onclick = () => t.onClick(src(), api);
        toolsEl.append(b);
    });

    const themeObs = new MutationObserver(() => { if (inline) try { inline.setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark'); } catch (e) {} });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    renderList(); renderInspector(); preview();

    const api = {
        getSource: src,
        setSource(s) { model = M.parseGms(s || '[\n]', sceneKeys); selected = 'scene'; sel.clear(); lastHtml = ''; if (codeMode) codeEl.value = src(); renderList(); renderInspector(); schedule(); },
        select,
        get sceneWindow() { return sceneWindow(); },
        destroy() { clearInterval(syncTimer); closeCat(); themeObs.disconnect(); clearTimeout(compileTimer); if (detach) detach(); if (inline) try { inline.destroy(); } catch (e) {} host.innerHTML = ''; },
    };
    return api;
}

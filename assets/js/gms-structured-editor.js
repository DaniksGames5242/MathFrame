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
.se{--se-mono:var(--pg-mono,ui-monospace,'SF Mono',Menlo,Consolas,monospace);display:grid;grid-template-columns:minmax(200px,250px) minmax(260px,340px) minmax(0,1fr);gap:.6rem;min-height:0;height:100%;font-size:.84rem;color:var(--text-primary)}
.se *{box-sizing:border-box}
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
.se-frame-wrap{position:relative;width:100%;max-width:640px;border-radius:.75rem;overflow:hidden;border:1px solid var(--border);background:var(--bg-card);box-shadow:var(--shadow)}
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
.se-code-mode{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}
.se-code-mode .se-col.se-c1 .se-list,.se-code-mode .se-col.se-c1 .se-search{display:none}
@media (max-width:1100px){.se{grid-template-columns:minmax(190px,230px) minmax(0,1fr);height:auto}.se-col.se-c3{grid-column:1/-1;min-height:480px}.se-col{max-height:70vh}}
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
          <div class="se-h"><b>Предпросмотр</b><span class="se-status"></span><span class="se-grow"></span><span class="se-tools"></span></div>
          <div class="se-prev-body"></div>
        </div>
      </div>`;
    const root = host.querySelector('.se');
    const q = (s) => root.querySelector(s);
    const listEl = q('.se-list'), inspEl = q('.se-insp'), inspH = q('.se-insp-h'), codeEl = q('.se-code');
    const searchEl = q('.se-search'), statusEl = q('.se-status'), prevBody = q('.se-prev-body'), toolsEl = q('.se-tools');

    let model = M.parseGms(opts.source || '[\n]', sceneKeys);
    let selected = 'scene';          // 'scene' | блок модели
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
            items.push(`<button type="button" class="se-item${selected === b ? ' on' : ''}" data-i="${i}" title="${esc(b.kw + ' ' + b.type)}"><span class="n">${esc(name)}</span><span class="t">${esc(title)}</span><span class="ln">${lines.get(b)}</span></button>`);
        });
        listEl.innerHTML = items.join('');
    }
    listEl.addEventListener('click', (e) => {
        const it = e.target.closest('.se-item'); if (!it) return;
        select(it.dataset.i === 'scene' ? 'scene' : M.blocks(model)[+it.dataset.i]);
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
            M.removeBlock(model, b); selected = 'scene';
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
            model = M.parseGms(codeEl.value, sceneKeys);
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
    function select(sel) {
        if (typeof sel === 'string' && sel !== 'scene') sel = M.blocks(model).find((b) => M.unquote(M.getField(b, 'name') || '') === sel) || 'scene';
        selected = sel; renderList(); renderInspector();
        const on = listEl.querySelector('.se-item.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    }

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
        if (mode === 'reference') {
            if (!frame) {
                const wrap = document.createElement('div'); wrap.className = 'se-frame-wrap'; wrap.style.height = '420px';
                frame = document.createElement('iframe');
                frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-popups');
                frame.title = 'Предпросмотр примера';
                wrap.append(frame); prevBody.append(wrap);
                const embed = await import(new URL('./gms-embed.js', import.meta.url).href);
                detach = embed.attachFrame(frame, { fit: wrap });
            }
            frame.srcdoc = r.html;
        } else {
            const { mountInline } = await import(new URL('./gms-inline.js', import.meta.url).href);
            if (inline) { try { inline.destroy(); } catch (e) {} }
            let h = prevBody.querySelector('.se-inline');
            if (!h) { h = document.createElement('div'); h.className = 'se-inline'; prevBody.append(h); }
            inline = await mountInline(h, r.html, { onError: (m) => { statusEl.textContent = '· ' + m; statusEl.classList.add('bad'); } });
            try { inline.setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark'); } catch (e) {}
        }
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
        setSource(s) { model = M.parseGms(s || '[\n]', sceneKeys); selected = 'scene'; lastHtml = ''; if (codeMode) codeEl.value = src(); renderList(); renderInspector(); schedule(); },
        select,
        get sceneWindow() { return sceneWindow(); },
        destroy() { closeCat(); themeObs.disconnect(); clearTimeout(compileTimer); if (detach) detach(); if (inline) try { inline.destroy(); } catch (e) {} host.innerHTML = ''; },
    };
    return api;
}

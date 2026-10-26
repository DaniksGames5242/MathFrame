/* Английский язык сайта (настройки → Язык → English). Подключается из common.js.
   Как работает:
   1. Словарь /assets/i18n/en.json: «русский текст → английский». Подменяются целые текстовые узлы и атрибуты
      (placeholder, title, aria-label, alt, значения кнопок), в том числе всё, что скрипты добавляют на страницу позже
      (MutationObserver). Ключи с {0}, {1} — шаблоны для строк с числами («Найдено {0} тем»).
   2. Чего нет в словаре (например, названия тем), переводит нейросеть через /api/translate пачками; ответы запоминаются
      в браузере (IndexedDB) и на сервере, так что каждый текст переводится один раз.
   3. Описания тем переводятся отдельно: MF_i18n.translateHtml(html) → Promise<html> (спец. разбиение на куски и кэш).
   Не переводится: пользовательский текст (статьи и ответы форума, имена), формулы, код, поля ввода, сообщения чата.
   Русский язык: скрипт ничего не делает.
   Чтобы исключить элемент из перевода: атрибут translate="no" или data-i18n-skip. */
(function () {
  'use strict';
  var lang = 'ru';
  try { lang = localStorage.getItem('mf-lang') === 'en' ? 'en' : 'ru'; } catch (e) {}
  window.MF_LANG = lang;
  window.MF_t = function (s) { return s; };
  window.MF_i18n = { lang: lang, translateHtml: function (h) { return Promise.resolve(h); } };
  if (lang !== 'en' || window.MF_DESKTOP) return;
  var NO_AI = !!window.MF_I18N_NO_AI;   // внутри рамки с примером: только словарь, без запросов к нейросети

  document.documentElement.lang = 'en';
  var CYR = /[А-Яа-яЁё]/;
  // контейнеры, внутри которых ничего не переводим (формулы, код, пользовательский и сгенерированный текст)
  var CONTENT = 'script,style,noscript,code,pre,.katex,[translate="no"],[data-i18n-skip],iframe,' +
    '.content-body,.reply-body,.excerpt,.card-author,.reply-top,.spr-description,.ag-msg-body,.ai-msg-body,.msg-text,.chat-msg,.md-body';
  // текст внутри полей ввода не трогаем, но их placeholder/title переводятся
  var TEXT_ONLY = 'textarea,input,[contenteditable="true"]';
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var AI_MAX = 400, AI_BATCH = 40;

  var dict = {}, patterns = [];
  var aiCache = new Map();            // ключ (шаблон с {1}) → перевод
  var pending = new Map();            // ключ → [{kind,node,attr,orig,nums}]
  var inflight = new Set();
  var tried = new Set();              // ключи, которые уже отправлялись (повторно не шлём, даже если ответ вернул кириллицу)
  var produced = new Set();           // тексты, которые записали мы сами — повторно не переводим
  var flushTimer = null, dictReady = false;

  /* ---------- нормализация и словарь ---------- */
  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function esc(s) { return s.replace(/[.*+?^$()|[\]\\]/g, '\\$&'); }
  var NUM = /\d+(?:[.,]\d+)?/g;
  function buildPatterns(d) {
    // ключи с числами («✓ скомпилировано за 104 мс») работают и для других чисел
    Object.keys(d).forEach(function (k) {
      if (/\{\d+\}/.test(k) || !NUM.test(k)) { NUM.lastIndex = 0; return; }
      NUM.lastIndex = 0;
      var nums = k.match(NUM), to = d[k], ok = true, idx = 0;
      var key = k.replace(NUM, function () { idx++; return '{' + idx + '}'; });
      var tt = to;
      nums.forEach(function (n, i) {
        var at = tt.indexOf(n);
        if (at < 0) { ok = false; return; }
        tt = tt.slice(0, at) + '{' + (i + 1) + '}' + tt.slice(at + n.length);
      });
      if (ok && key.replace(/\{\d+\}/g, '').replace(/[^A-Za-zА-Яа-яЁё]/g, '').length >= 4) { dict[key] = tt; }
    });
    Object.keys(d).forEach(function (k) {
      if (!/\{\d+\}/.test(k)) return;
      var order = [];
      var re = '^' + esc(k).replace(/\{(\d+)\}/g, function (m, n) { order.push(+n); return '(.+?)'; }) + '$';
      patterns.push({ re: new RegExp(re), order: order, to: d[k] });
    });
  }
  function fromDict(text) {
    var k = norm(text);
    if (Object.prototype.hasOwnProperty.call(dict, k)) return dict[k];
    for (var i = 0; i < patterns.length; i++) {
      var m = patterns[i].re.exec(k);
      if (m) {
        var vals = {};
        patterns[i].order.forEach(function (n, j) { vals[n] = m[j + 1]; });
        return patterns[i].to.replace(/\{(\d+)\}/g, function (x, n) { return vals[n] != null ? vals[n] : x; });
      }
    }
    return null;
  }

  /* ---------- IndexedDB: запомненные переводы ---------- */
  var idb = null;
  function openDb() {
    return new Promise(function (resolve) {
      try {
        var rq = indexedDB.open('mf-i18n', 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore('tr'); };
        rq.onsuccess = function () { idb = rq.result; resolve(); };
        rq.onerror = function () { resolve(); };
      } catch (e) { resolve(); }
    });
  }
  function idbGet(keys) {
    return new Promise(function (resolve) {
      if (!idb) return resolve({});
      var out = {};
      try {
        var st = idb.transaction('tr', 'readonly').objectStore('tr'), left = keys.length;
        if (!left) return resolve(out);
        keys.forEach(function (k) {
          var r = st.get(k);
          r.onsuccess = function () { if (typeof r.result === 'string') out[k] = r.result; if (!--left) resolve(out); };
          r.onerror = function () { if (!--left) resolve(out); };
        });
      } catch (e) { resolve(out); }
    });
  }
  function idbPut(obj) {
    if (!idb) return;
    try { var st = idb.transaction('tr', 'readwrite').objectStore('tr'); Object.keys(obj).forEach(function (k) { st.put(obj[k], k); }); } catch (e) {}
  }

  /* ---------- числа: «Найдено 37 тем» → «Найдено {1} тем» ---------- */
  function templ(s) {
    var nums = [];
    var t = s.replace(/\d+(?:[.,]\d+)?/g, function (m) { nums.push(m); return '{' + nums.length + '}'; });
    return { key: t, nums: nums };
  }
  function fill(t, nums) { return t.replace(/\{(\d+)\}/g, function (m, n) { return nums[n - 1] != null ? nums[n - 1] : m; }); }

  /* ---------- применение к узлам ---------- */
  function skipped(el) { return !el || (el.closest && el.closest(CONTENT + ',' + TEXT_ONLY)); }
  function skippedAttr(el) { return !el || (el.closest && el.closest(CONTENT)); }
  function setText(node, orig, tr) {
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(orig);
    var v = m[1] + tr + m[3];
    produced.add(norm(tr));
    if (node.nodeValue !== v) node.nodeValue = v;
  }
  function handleText(node) {
    var v = node.nodeValue;
    if (!v || !CYR.test(v) || skipped(node.parentElement) || produced.has(norm(v))) return;
    var tr = fromDict(v);
    if (tr != null) { setText(node, v, tr); return; }
    queue({ kind: 't', node: node, orig: v }, v);
  }
  function handleAttr(el, attr) {
    var v = el.getAttribute(attr);
    if (!v || !CYR.test(v) || skippedAttr(el) || produced.has(norm(v))) return;
    var tr = fromDict(v);
    if (tr != null) { produced.add(norm(tr)); el.setAttribute(attr, tr); return; }
    queue({ kind: 'a', node: el, attr: attr, orig: v }, v);
  }
  function applyTo(item, tr) {
    if (item.kind === 't') { if (item.node.nodeValue === item.orig) setText(item.node, item.orig, tr); }
    else if (item.node.getAttribute(item.attr) === item.orig) { produced.add(norm(tr)); item.node.setAttribute(item.attr, tr); }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { handleText(root); return; }
    if (root.nodeType !== 1 || skippedAttr(root)) return;
    if (root.matches && root.matches('input[type=button],input[type=submit],input[type=reset]')) handleAttr(root, 'value');
    ATTRS.forEach(function (a) { if (root.hasAttribute(a)) handleAttr(root, a); });
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { return n.nodeType === 1 && skippedAttr(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) handleText(n);
      else {
        if (n.matches('input[type=button],input[type=submit],input[type=reset]')) handleAttr(n, 'value');
        for (var i = 0; i < ATTRS.length; i++) if (n.hasAttribute(ATTRS[i])) handleAttr(n, ATTRS[i]);
      }
    }
  }

  /* ---------- перевод встроенным переводчиком браузера (Translator API, Chrome 138+) ----------
     Бесплатно, без лимитов сервера и без отправки текста куда-либо. Если браузер его не поддерживает или языковой пакет
     ещё не скачан (скачивание требует клика пользователя — первый клик по странице запускает его), используется нейросеть сайта. */
  var btPromise = null;
  function browserTranslator() {
    if (btPromise) return btPromise;
    btPromise = (async function () {
      try {
        var T = self.Translator;
        if (!T || !T.create) return null;
        var opts = { sourceLanguage: 'ru', targetLanguage: 'en' };
        var av = T.availability ? await T.availability(opts) : 'available';
        if (av === 'unavailable') return null;
        if (av === 'available') return await T.create(opts);
        // 'downloadable' / 'downloading': нужен жест пользователя — создадим при первом клике и в этот раз вернём null
        document.addEventListener('pointerdown', function once() {
          document.removeEventListener('pointerdown', once, true);
          try { T.create(opts).then(function () { btPromise = null; }, function () {}); } catch (e) {}
        }, true);
        return null;
      } catch (e) { return null; }
    })();
    return btPromise;
  }
  var MATH_RE = /(\$\$[\s\S]*?\$\$|\$[^$\n]*\$)/;
  function btText(tr, text) {
    // формулы $…$ не переводим; пробелы по краям сохраняем
    return Promise.all(text.split(MATH_RE).map(function (part, i) {
      if (i % 2 === 1 || !CYR.test(part)) return part;
      var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(part);
      return tr.translate(m[2]).then(function (r) { return m[1] + r + m[3]; });
    })).then(function (a) { return a.join(''); });
  }
  function callStrings(batch) {
    return browserTranslator().then(function (tr) {
      var okBt = tr && batch.every(function (k) { return !/\{\d+\}/.test(k); });
      if (okBt) {
        return Promise.all(batch.map(function (k) { return btText(tr, k); })).then(function (items) { return { items: items }; }, function () { return null; });
      }
      return null;
    }).then(function (res) {
      if (res) return res;
      return fetch('/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'strings', items: batch }) })
        .then(function (r) { return r.ok ? r.json() : null; });
    });
  }
  function callHtml(chunk) {
    return browserTranslator().then(function (tr) {
      if (!tr) return null;
      var doc = new DOMParser().parseFromString('<body>' + chunk + '</body>', 'text/html');
      var nodes = [], tw = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT), n;
      while ((n = tw.nextNode())) { if (CYR.test(n.nodeValue) && !n.parentElement.closest('script,style,pre,code')) nodes.push(n); }
      return Promise.all(nodes.map(function (node) { return btText(tr, node.nodeValue).then(function (r) { node.nodeValue = r; }); }))
        .then(function () { return doc.body.innerHTML; }, function () { return null; });
    }).then(function (res) {
      if (res) return { text: res };
      return fetch('/api/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'html', text: chunk }) })
        .then(function (r) { return r.ok ? r.json() : null; });
    });
  }

  /* ---------- нейросеть для недостающего ---------- */
  // В нейросеть уходит только то, что человек видит: невидимые (свёрнутое дерево тем, закрытые окна) и далёкие по прокрутке
  // элементы ждут, пока не покажутся на экране (IntersectionObserver), — иначе справочник отправил бы на перевод все 2000+ названий тем.
  var watch = new Map();              // элемент → [{item,text}]
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var list = watch.get(en.target); watch.delete(en.target); io.unobserve(en.target);
      (list || []).forEach(function (w) { enqueue(w.item, w.text); });
    });
  }, { rootMargin: '150px' }) : null;
  function elOf(item) { return item.kind === 't' ? item.node.parentElement : item.node; }
  function queue(item, text) {
    if (NO_AI) return;
    var s = norm(text);
    if (s.length < 2 || s.length > AI_MAX || (s.match(/[А-Яа-яЁё]/g) || []).length < 2) return;
    var t = templ(s); item.nums = t.nums;
    var cached = aiCache.get(t.key);
    if (cached) { applyTo(item, fill(cached, t.nums)); return; }
    if (tried.has(t.key)) return;
    var el = elOf(item);
    if (io && el) {
      if (!watch.has(el)) { watch.set(el, []); io.observe(el); }
      watch.get(el).push({ item: item, text: text });
      return;
    }
    enqueue(item, text);
  }
  function enqueue(item, text) {
    var s = norm(text), t = templ(s);
    if ((item.kind === 't' && item.node.nodeValue !== item.orig) || (item.kind === 'a' && item.node.getAttribute(item.attr) !== item.orig)) return;
    var cached = aiCache.get(t.key);
    if (cached) { applyTo(item, fill(cached, t.nums)); return; }
    if (!pending.has(t.key)) pending.set(t.key, []);
    pending.get(t.key).push(item);
    schedule();
  }
  function schedule() { if (!flushTimer) flushTimer = setTimeout(flush, 120); }
  function flush() {
    flushTimer = null;
    var keys = [];
    pending.forEach(function (v, k) { if (!inflight.has(k)) keys.push(k); });
    if (!keys.length) return;
    idbGet(keys).then(function (hit) {
      var rest = [];
      keys.forEach(function (k) { if (hit[k] != null) done(k, hit[k]); else rest.push(k); });
      for (var i = 0; i < rest.length; i += AI_BATCH) send(rest.slice(i, i + AI_BATCH));
    });
  }
  function done(k, tr) {
    aiCache.set(k, tr);
    var items = pending.get(k) || []; pending.delete(k); inflight.delete(k);
    items.forEach(function (it) { applyTo(it, fill(tr, it.nums)); });
  }
  function send(batch) {
    batch.forEach(function (k) { inflight.add(k); tried.add(k); });
    callStrings(batch)
      .then(function (d) {
        if (!d || !Array.isArray(d.items) || d.items.length !== batch.length || d.skipped) { batch.forEach(function (k) { inflight.delete(k); pending.delete(k); }); return; }
        var store = {};
        batch.forEach(function (k, i) {
          var tr = d.items[i];
          // перевод должен сохранить все {n}; иначе оставляем оригинал
          var ok = typeof tr === 'string' && tr.trim() && (k.match(/\{\d+\}/g) || []).every(function (p) { return tr.indexOf(p) >= 0; });
          if (ok) { store[k] = tr; done(k, tr); } else { inflight.delete(k); pending.delete(k); }
        });
        idbPut(store);
      })
      .catch(function () { batch.forEach(function (k) { inflight.delete(k); pending.delete(k); }); });
  }

  /* ---------- описания тем (HTML) ---------- */
  var HTML_CHUNK = 3500;
  function splitHtml(html) {
    // режем по границам блоков, чтобы не ломать теги
    var parts = html.split(/(?<=<\/(?:p|ul|ol|h[1-6]|blockquote|pre|table)>)\s*/i), out = [], cur = '';
    parts.forEach(function (p) {
      if (cur && cur.length + p.length > HTML_CHUNK) { out.push(cur); cur = ''; }
      cur += (cur ? '\n' : '') + p;
    });
    if (cur) out.push(cur);
    return out;
  }
  function hashKey(s) {
    var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return 'h:' + (h >>> 0).toString(36) + ':' + s.length;
  }
  function translateChunk(chunk) {
    var key = hashKey(chunk);
    return idbGet([key]).then(function (hit) {
      if (hit[key]) return hit[key];
      return callHtml(chunk)
        .then(function (d) {
          if (!d || typeof d.text !== 'string' || d.skipped) return chunk;
          var o = {}; o[key] = d.text; idbPut(o); return d.text;
        })
        .catch(function () { return chunk; });
    });
  }
  window.MF_i18n.translateHtml = function (html) {
    html = String(html || '');
    if (!CYR.test(html)) return Promise.resolve(html);
    return Promise.all(splitHtml(html).map(translateChunk)).then(function (parts) { return parts.join('\n'); });
  };

  /* ---------- интерактивные примеры (.gms): тексты в кавычках ---------- */
  // Переводятся только «фразовые» строки с кириллицей (с пробелом или знаком препинания): имена объектов и ссылки на них
  // (line = "ab") не трогаем. Перевод должен сохранить \n, {…}, $, ** — иначе остаётся оригинал.
  var gmsMem = new Map();
  function gmsOk(ru, en) {
    var cnt = function (str, re) { return (str.match(re) || []).length; };
    return typeof en === 'string' && en.trim() && !/[\r\n]/.test(en) &&
      cnt(ru, /\\n/g) === cnt(en, /\\n/g) && cnt(ru, /\$/g) === cnt(en, /\$/g) && cnt(ru, /\*\*/g) === cnt(en, /\*\*/g) &&
      cnt(ru, /\{/g) === cnt(en, /\{/g) && cnt(ru, /\}/g) === cnt(en, /\}/g);
  }
  window.MF_i18n.translateGms = function (src) {
    src = String(src || '');
    var lits = [], seen = {};
    // имена объектов (name = "…"): на них ссылаются другие строки, поэтому такие слова не переводим
    var names = {}, nm, nre = /\bname\s*=\s*"([^"\n]+)"/g;
    while ((nm = nre.exec(src))) names[nm[1]] = 1;
    src.split('\n').forEach(function (line) {
      var cut = line.indexOf('//'); var code = cut >= 0 && !/["][^"]*\/\/[^"]*["]/.test(line) ? line.slice(0, cut) : line;
      var re = /"((?:[^"\\\n]|\\.)*)"/g, m;
      while ((m = re.exec(code))) {
        var t = m[1];
        if (!CYR.test(t) || t.length > AI_MAX || seen[t]) continue;
        var letters = (t.match(/[А-Яа-яЁё]/g) || []).length, phrase = /[\s.,:;!?—()«»]/.test(t);
        if (names[t] || letters < 2 || (!phrase && letters < 3)) continue;
        seen[t] = 1; lits.push(t);
      }
    });
    if (!lits.length) return Promise.resolve(src);
    var out = {};
    var apply = function () {
      // подставляем по самым длинным строкам вперёд, чтобы короткие не портили вложенные
      return lits.slice().sort(function (a, b) { return b.length - a.length; }).reduce(function (acc, ru) {
        var en = out[ru]; return en ? acc.split('"' + ru + '"').join('"' + en.replace(/"/g, '\\"') + '"') : acc;
      }, src);
    };
    var todo = [];
    lits.forEach(function (ru) {
      var d = fromDict(ru);
      if (d != null && gmsOk(ru, d)) out[ru] = d; else if (gmsMem.has(ru)) out[ru] = gmsMem.get(ru); else todo.push(ru);
    });
    if (!todo.length || NO_AI) return Promise.resolve(apply());
    var keys = todo.map(function (x) { return 'g:' + hashKey(x); });
    return idbGet(keys).then(function (hit) {
      var rest = [];
      todo.forEach(function (ru, i) { var h = hit[keys[i]]; if (h != null && gmsOk(ru, h)) { out[ru] = h; gmsMem.set(ru, h); } else rest.push(ru); });
      var jobs = [];
      for (var i = 0; i < rest.length; i += AI_BATCH) jobs.push(rest.slice(i, i + AI_BATCH));
      return Promise.all(jobs.map(function (batch) {
        return callStrings(batch)
          .then(function (d) {
            if (!d || !Array.isArray(d.items) || d.items.length !== batch.length || d.skipped) return;
            var store = {};
            batch.forEach(function (ru, i) { var en = d.items[i]; if (gmsOk(ru, en)) { out[ru] = en.trim(); gmsMem.set(ru, out[ru]); store['g:' + hashKey(ru)] = out[ru]; } });
            idbPut(store);
          }).catch(function () {});
      }));
    }).then(apply);
  };
  window.MF_i18n.injectIntoHtml = function (html) {
    var tag = '<script>window.MF_I18N_NO_AI=1;<\/script><script src="' + location.origin + '/assets/js/i18n.js"><\/script>';
    return String(html).indexOf('</body>') >= 0 ? String(html).replace('</body>', tag + '</body>') : String(html) + tag;
  };

  /* ---------- служебное: MF_t, диалоги, заголовок ---------- */
  window.MF_t = function (s) {
    if (typeof s !== 'string' || !CYR.test(s)) return s;
    var tr = fromDict(s); return tr != null ? tr : s;
  };
  ['alert', 'confirm', 'prompt'].forEach(function (name) {
    var orig = window[name]; if (typeof orig !== 'function') return;
    window[name] = function (msg) { var a = Array.prototype.slice.call(arguments); a[0] = window.MF_t(String(msg)); return orig.apply(window, a); };
  });
  function translateTitle() {
    var t = document.title;
    if (!CYR.test(t)) return;
    var tr = fromDict(t);
    if (tr == null) { var p = t.split(' — '); tr = p.map(function (x) { return fromDict(x) || x; }).join(' — '); }
    if (tr !== t) document.title = tr;
  }

  /* ---------- запуск ---------- */
  var queueMut = [], mutTimer = null;
  function onMutations(list) {
    list.forEach(function (m) {
      if (m.type === 'characterData') queueMut.push(m.target);
      else if (m.type === 'attributes') queueMut.push({ attr: m.attributeName, el: m.target });
      else m.addedNodes.forEach(function (n) { queueMut.push(n); });
    });
    // сразу, в той же микрозадаче: страница не успевает показать русский текст
    if (!mutTimer) { mutTimer = true; Promise.resolve().then(runMut); }
  }
  function runMut() {
    mutTimer = null;
    var list = queueMut; queueMut = [];
    list.forEach(function (x) { if (x && x.attr) handleAttr(x.el, x.attr); else walk(x); });
    translateTitle();
  }
  function start() {
    walk(document.body); translateTitle();
    new MutationObserver(onMutations).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  openDb();
  fetch('/assets/i18n/en.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (d) {
    dict = d || {}; buildPatterns(dict); dictReady = true;
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  });
})();

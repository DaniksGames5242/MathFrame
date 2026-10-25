/* support.js — форма обращения в поддержку и «Сообщить об ошибке» (справочник).
   Письмо уходит владельцу через /api/support (api/support.js).

   MFSupport.mountForm(container, { type: 'support' | 'error', topicId, topicTitle })
   MFSupport.openError({ topicId, topicTitle })   — окно «Сообщить об ошибке» поверх страницы
   Работает и без входа в аккаунт; если пользователь вошёл, его токен прикладывается к запросу. */
(function () {
  'use strict';

  var CSS = '' +
    '.mfs-form{display:grid;gap:.85rem}' +
    '.mfs-form label{display:grid;gap:.3rem;font-size:.86rem;color:var(--text-secondary)}' +
    '.mfs-form input,.mfs-form textarea{width:100%;box-sizing:border-box;padding:.6rem .75rem;border-radius:var(--r-sm,8px);border:1px solid var(--border);background:var(--bg-raised,transparent);color:var(--text-primary);font:inherit;font-size:.95rem}' +
    '.mfs-form input:focus-visible,.mfs-form textarea:focus-visible{outline:2px solid var(--accent);outline-offset:1px}' +
    '.mfs-form textarea{resize:vertical;min-height:7rem}' +
    '.mfs-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}' +
    '.mfs-topic{margin:0;padding:.55rem .75rem;border-left:3px solid var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent);border-radius:var(--r-sm,8px);font-size:.9rem}' +
    '.mfs-row{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}' +
    '.mfs-status{font-size:.88rem}.mfs-status.err{color:#f87171}.mfs-status.ok{color:#34d399}' +
    '.mfs-overlay{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:1rem;overflow:auto}' +
    '.mfs-modal{position:relative;width:100%;max-width:520px;max-height:100%;overflow:auto;background:var(--bg-card,#111);color:var(--text-primary);border:1px solid var(--border);border-radius:var(--r-lg,14px);padding:1.3rem 1.4rem}' +
    '.mfs-modal h2{margin:0 0 .9rem;font-size:1.25rem}' +
    '.mfs-x{position:absolute;top:.6rem;right:.7rem;width:34px;height:34px;border:0;background:transparent;color:var(--text-secondary);font-size:1.5rem;line-height:1;cursor:pointer;border-radius:8px}' +
    '.mfs-x:hover{color:var(--text-primary)}';

  function injectCss() {
    if (document.getElementById('mfs-css')) return;
    var st = document.createElement('style'); st.id = 'mfs-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function currentUser() { try { return window.Auth && window.Auth.getCurrentUser && window.Auth.getCurrentUser(); } catch (e) { return null; } }

  function send(payload) {
    var u = currentUser();
    return (u && u.getIdToken ? u.getIdToken().catch(function () { return ''; }) : Promise.resolve('')).then(function (token) {
      var headers = { 'content-type': 'application/json' };
      if (token) headers.authorization = 'Bearer ' + token;
      return fetch('/api/support', { method: 'POST', headers: headers, body: JSON.stringify(payload) });
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (d) {
        if (!r.ok) throw new Error((d && d.error) || ('Ошибка ' + r.status));
        return d;
      });
    }, function () { throw new Error('Нет связи с сервером. Проверьте интернет и повторите.'); });
  }

  function mountForm(container, opts) {
    injectCss();
    opts = opts || {};
    var isErr = opts.type === 'error';
    var u = currentUser();
    container.innerHTML =
      '<form class="mfs-form" novalidate>' +
      (isErr ? '<p class="mfs-topic">Тема справочника: <b>' + esc(opts.topicTitle || 'не указана') + '</b></p>' : '') +
      '<label>Ваше имя (необязательно)<input name="name" maxlength="100" autocomplete="name" value="' + esc(u && u.displayName || '') + '"></label>' +
      '<label>Почта для ответа (необязательно)<input name="email" type="email" maxlength="200" autocomplete="email" value="' + esc(u && u.email || '') + '"></label>' +
      '<label>' + (isErr ? 'Что не так? Опишите ошибку и, если можно, как правильно' : 'Ваш вопрос или сообщение') +
      '<textarea name="message" maxlength="4000" required placeholder="' + (isErr ? 'Например: в формуле опечатка — должно быть …' : 'Опишите, что случилось или что хотите узнать…') + '"></textarea></label>' +
      '<div class="mfs-hp" aria-hidden="true"><label>Сайт<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="mfs-row"><button type="submit" class="btn primary">Отправить</button><span class="mfs-status" role="status" aria-live="polite"></span></div>' +
      '</form>';
    var form = container.querySelector('form'), status = form.querySelector('.mfs-status'), btn = form.querySelector('button');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var message = f.message.value.trim();
      status.className = 'mfs-status';
      if (message.length < 10) { status.className = 'mfs-status err'; status.textContent = 'Опишите подробнее (минимум 10 символов).'; return; }
      btn.disabled = true; status.textContent = 'Отправляем…';
      send({
        type: isErr ? 'error' : 'support', message: message, name: f.name.value.trim(), email: f.email.value.trim(), website: f.website.value,
        topicId: opts.topicId || '', topicTitle: opts.topicTitle || '', url: location.href,
      }).then(function () {
        form.innerHTML = '<p class="mfs-status ok">Спасибо! Сообщение отправлено — ' + (isErr ? 'мы проверим и исправим.' : 'мы ответим на почту, если вы её указали.') + '</p>';
        if (opts.onDone) opts.onDone();
      }).catch(function (err) {
        status.className = 'mfs-status err'; status.textContent = err.message; btn.disabled = false;
      });
    });
    return form;
  }

  function openError(opts) {
    injectCss();
    var prev = document.activeElement;
    var ov = document.createElement('div'); ov.className = 'mfs-overlay';
    ov.innerHTML = '<div class="mfs-modal" role="dialog" aria-modal="true" aria-label="Сообщить об ошибке"><button type="button" class="mfs-x" aria-label="Закрыть">×</button><h2>Сообщить об ошибке</h2><div class="mfs-body"></div></div>';
    document.body.appendChild(ov);
    function close() { document.removeEventListener('keydown', onKey, true); ov.remove(); if (prev && prev.focus) try { prev.focus(); } catch (e) {} }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', onKey, true);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.mfs-x').onclick = close;
    var form = mountForm(ov.querySelector('.mfs-body'), Object.assign({}, opts, { type: 'error' }));
    var ta = form.elements.message; if (ta) setTimeout(function () { try { ta.focus(); } catch (e) {} }, 50);
  }

  window.MFSupport = { mountForm: mountForm, openError: openError, send: send };
})();

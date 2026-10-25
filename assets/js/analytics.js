/* Аналитика (Яндекс.Метрика) только с согласия посетителя.
   Чтобы включить: впишите номер счётчика в METRIKA_ID — пока там 0, ничего не загружается и баннер не показывается.
   Подключается из common.js; в админке и настольном приложении не работает. */
(function () {
  'use strict';
  var METRIKA_ID = 0;

  var KEY = 'mf-consent';
  if (!METRIKA_ID || window.MF_DESKTOP || /^\/(admin|pages\/admin)\//.test(location.pathname)) return;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadMetrika() {
    if (window.__mfMetrika) return;
    window.__mfMetrika = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(METRIKA_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }

  function hideBanner() { var b = document.getElementById('mf-consent'); if (b) b.remove(); }

  function showBanner() {
    if (document.getElementById('mf-consent')) return;
    var b = document.createElement('div');
    b.id = 'mf-consent';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Статистика посещений');
    b.innerHTML = '<p>Мы используем Яндекс.Метрику, чтобы понимать, какие разделы полезны. Она использует cookie и ваш IP-адрес. ' +
      'Сайт работает и без неё. <a href="/privacy/">Подробнее</a></p>' +
      '<div class="mf-consent-btns"><button type="button" class="btn small" data-v="no">Отказаться</button>' +
      '<button type="button" class="btn small primary" data-v="yes">Принять</button></div>';
    b.addEventListener('click', function (ev) {
      var v = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-v');
      if (!v) return;
      write(v);
      hideBanner();
      if (v === 'yes') loadMetrika();
    });
    document.body.appendChild(b);
  }

  // «Настройки cookie» в подвале: ссылка с атрибутом data-mf-cookie заново открывает выбор
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('[data-mf-cookie]');
    if (!a) return;
    ev.preventDefault();
    showBanner();
  });

  function init() {
    var v = read();
    if (v === 'yes') loadMetrika();
    else if (v !== 'no') showBanner();
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();

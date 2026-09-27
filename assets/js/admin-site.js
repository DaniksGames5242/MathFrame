// admin-site.js — вкладка «Сайт»: баннер-объявление и режим техработ.
//
// Хранится в Firestore settings/site:
//   banner: { enabled, text, kind:'info'|'warn'|'success', linkUrl, linkText,
//             dismissible, version, expiresAt:Timestamp|null }
//   maintenance: { enabled, message, until:Timestamp|null }
//   updatedAt, updatedBy
// Показывает их на страницах общий код (common.js) — фрагмент для него описан в
// отчёте к задаче; сама панель common.js не меняет. version растёт при каждом
// сохранении баннера, чтобы закрытый посетителем баннер показался снова, если
// текст изменился.

(function () {
  'use strict';
  const A = window.MFAdmin;
  const esc = A.esc;
  let current = {};

  A.registerTab('site', {
    init() {
      const bf = document.getElementById('bannerForm');
      const mf = document.getElementById('maintForm');
      bf.addEventListener('input', renderPreview);
      bf.addEventListener('change', renderPreview);
      bf.addEventListener('submit', saveBanner);
      mf.addEventListener('submit', saveMaintenance);
      document.getElementById('bannerOffBtn').onclick = disableBanner;
      if (!A.isSuper) {
        mf.querySelectorAll('input, textarea, button').forEach(x => { x.disabled = true; });
        document.getElementById('maintOwnerNote').hidden = false;
      }
      load();
    },
  });

  const toLocalInput = d => {
    d = A.toDate(d);
    if (!d) return '';
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const fromLocalInput = s => { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : firebase.firestore.Timestamp.fromDate(d); };

  async function load() {
    try {
      const d = await A.db.collection('settings').doc('site').get();
      current = d.exists ? d.data() : {};
      document.getElementById('siteMeta').textContent = current.updatedAt ? `Изменено ${A.fmtDate(current.updatedAt)}${current.updatedBy ? ' · ' + current.updatedBy : ''}` : 'Настройки ещё не сохранялись.';
    } catch (e) {
      current = {};
      document.getElementById('siteMeta').textContent = 'Не удалось прочитать settings/site: ' + A.errText(e);
    }
    const b = current.banner || {};
    const bf = document.getElementById('bannerForm');
    bf.enabled.checked = !!b.enabled;
    bf.text.value = b.text || '';
    bf.kind.value = b.kind || 'info';
    bf.linkUrl.value = b.linkUrl || '';
    bf.linkText.value = b.linkText || '';
    bf.dismissible.checked = b.dismissible !== false;
    bf.expiresAt.value = toLocalInput(b.expiresAt);
    const m = current.maintenance || {};
    const mf = document.getElementById('maintForm');
    mf.enabled.checked = !!m.enabled;
    mf.message.value = m.message || '';
    mf.until.value = toLocalInput(m.until);
    renderStatus();
    renderPreview();
  }

  function renderStatus() {
    const b = current.banner || {}, m = current.maintenance || {};
    const exp = A.toDate(b.expiresAt);
    const bannerLive = b.enabled && b.text && !(exp && exp < new Date());
    document.getElementById('bannerStatus').innerHTML = bannerLive ? '<span class="badge yes">показывается</span>' : (b.enabled && exp && exp < new Date() ? '<span class="badge no">срок истёк</span>' : '<span class="badge no neutral">выключен</span>');
    document.getElementById('maintStatus').innerHTML = m.enabled ? '<span class="badge banned">сайт закрыт</span>' : '<span class="badge yes">сайт открыт</span>';
  }

  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^\/(?!\/)/.test(u)) return u;          // внутренняя ссылка
    if (/^https:\/\/[^\s"<>]+$/i.test(u)) return u;
    return null;
  }

  function renderPreview() {
    const f = document.getElementById('bannerForm');
    const box = document.getElementById('bannerPreview');
    const text = f.text.value.trim();
    document.getElementById('bannerLen').textContent = `${f.text.value.length}/300`;
    if (!text) { box.innerHTML = '<p class="empty-hint">Введите текст — здесь появится предпросмотр</p>'; return; }
    const url = safeUrl(f.linkUrl.value);
    box.innerHTML = `<div class="mf-site-banner kind-${esc(f.kind.value)}${f.enabled.checked ? '' : ' is-off'}" role="note">
      <span class="msb-text">${esc(text)}</span>
      ${url ? `<a class="msb-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(f.linkText.value.trim() || 'Подробнее')}</a>` : ''}
      ${f.dismissible.checked ? '<button type="button" class="msb-close" aria-label="Закрыть" tabindex="-1">×</button>' : ''}
    </div>${f.enabled.checked ? '' : '<p class="adm-note">Баннер выключен — посетители его не увидят.</p>'}`;
  }

  async function saveBanner(e) {
    e.preventDefault();
    const f = e.currentTarget;
    const text = f.text.value.trim().slice(0, 300);
    const url = safeUrl(f.linkUrl.value);
    if (f.enabled.checked && !text) { A.toast('Введите текст баннера', 'bad'); return; }
    if (url === null) { A.toast('Ссылка должна начинаться с https:// или с / (страница сайта)', 'bad'); return; }
    const banner = {
      enabled: f.enabled.checked, text, kind: ['info', 'warn', 'success'].includes(f.kind.value) ? f.kind.value : 'info',
      linkUrl: url || null, linkText: f.linkText.value.trim().slice(0, 40) || null,
      dismissible: f.dismissible.checked, expiresAt: fromLocalInput(f.expiresAt.value),
      version: ((current.banner && current.banner.version) || 0) + 1,
    };
    const ok = await A.confirm({
      title: 'Опубликовать баннер',
      text: banner.enabled ? `Баннер увидят все посетители сайта:<br><br><i>${esc(text)}</i>` : 'Баннер будет сохранён выключенным.',
      confirmLabel: banner.enabled ? 'Опубликовать' : 'Сохранить',
    });
    if (!ok) return;
    await save({ banner }, f.querySelector('button[type="submit"]'), banner.enabled ? 'Баннер опубликован' : 'Баннер сохранён');
  }

  async function disableBanner(e) {
    if (!(current.banner && current.banner.enabled)) { A.toast('Баннер и так выключен'); return; }
    const ok = await A.confirm({ title: 'Скрыть баннер', text: 'Баннер перестанет показываться на всех страницах.', confirmLabel: 'Скрыть', danger: true });
    if (!ok) return;
    await save({ banner: Object.assign({}, current.banner, { enabled: false }) }, e.currentTarget, 'Баннер скрыт');
  }

  async function saveMaintenance(e) {
    e.preventDefault();
    if (!A.isSuper) return;
    const f = e.currentTarget;
    const maintenance = { enabled: f.enabled.checked, message: f.message.value.trim().slice(0, 500) || null, until: fromLocalInput(f.until.value) };
    const ok = await A.confirm({
      title: maintenance.enabled ? 'Включить режим техработ' : 'Сохранить режим техработ',
      text: maintenance.enabled
        ? 'Все страницы сайта, кроме админ-панели, покажут заглушку «Идут технические работы». Администраторы продолжат видеть сайт как обычно.'
        : 'Сайт будет открыт для всех.',
      typeWord: maintenance.enabled ? 'техработы' : '', confirmLabel: maintenance.enabled ? 'Включить' : 'Сохранить', danger: maintenance.enabled,
    });
    if (!ok) return;
    await save({ maintenance }, f.querySelector('button[type="submit"]'), maintenance.enabled ? 'Режим техработ включён' : 'Сохранено');
  }

  async function save(patch, btn, msg) {
    const data = Object.assign({}, patch, { updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: A.user.email });
    const res = await A.run(btn, () => A.db.collection('settings').doc('site').set(data, { merge: true }).then(() => true), msg);
    if (res) load();
  }
})();

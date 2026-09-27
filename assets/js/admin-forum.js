// admin-forum.js — вкладка «Форум»: модерация статей, ответов и тегов.
//
// Данные: forumArticles/{id} { title, bodyHTML, tags[], topicRef, authorUid, authorName,
//   authorPhoto, createdAt, updatedAt, views, bestId }
//   └ replies/{id} { parentId, bodyHTML, authorUid, authorName, createdAt, likes,
//                    dislikes, voters{}, deleted }
// Модерация добавляет статье поля (updatedAt не трогаем — иначе на форуме появится «ред.»):
//   pinned:boolean  — закреплена вверху ленты
//   featured:boolean — отмечена как «Популярное»
//   hidden:boolean  — скрыта из ленты
//   moderatedBy / moderatedAt — кто и когда менял
// Чтобы форум учитывал pinned/featured/hidden, в pages/forum.html нужна небольшая
// правка (описана в отчёте к задаче) — сама панель её не делает.

(function () {
  'use strict';
  const A = window.MFAdmin;
  const esc = A.esc;
  const FV = () => firebase.firestore.FieldValue;
  const artRef = id => A.db.collection('forumArticles').doc(id);

  let view = 'articles';
  let artFilter = 'all', repFilter = 'all';

  A.registerTab('forum', {
    init() {
      document.querySelectorAll('#forumViews [data-fview]').forEach(b => b.addEventListener('click', () => {
        view = b.dataset.fview;
        document.querySelectorAll('#forumViews [data-fview]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
        document.querySelectorAll('[data-fpanel]').forEach(p => { p.hidden = p.dataset.fpanel !== view; });
        render();
      }));
      document.querySelectorAll('#artChips [data-afilter]').forEach(b => b.addEventListener('click', () => {
        artFilter = b.dataset.afilter;
        document.querySelectorAll('#artChips [data-afilter]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
        renderArticles();
      }));
      document.querySelectorAll('#repChips [data-rfilter]').forEach(b => b.addEventListener('click', () => {
        repFilter = b.dataset.rfilter;
        document.querySelectorAll('#repChips [data-rfilter]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
        renderReplies();
      }));
      document.getElementById('artSearch').addEventListener('input', A.debounce(renderArticles, 120));
      document.getElementById('artSort').addEventListener('change', renderArticles);
      document.getElementById('repSearch').addEventListener('input', A.debounce(renderReplies, 120));
      document.getElementById('forumRefresh').onclick = () => reload(true);
      document.getElementById('artTbody').addEventListener('click', onArticleClick);
      document.getElementById('repTbody').addEventListener('click', onReplyClick);
      document.getElementById('tagsList').addEventListener('click', onTagClick);
      document.getElementById('exportForumCsv').onclick = exportArticlesCsv;
      document.getElementById('exportRepliesCsv').onclick = exportRepliesCsv;
      document.getElementById('exportForumJson').onclick = exportForumJson;
      reload(false);
    },
  });
  A.on('forum-changed', () => { if (A.cache.forum || document.getElementById('artTbody')) reload(true); });

  async function reload(force) {
    if (force) A.invalidate('forum');
    document.getElementById('forumState').textContent = 'загрузка…';
    try {
      const f = await A.loadForum();
      document.getElementById('forumState').textContent = f.replyErrors ? `ответы части статей не прочитаны (${f.replyErrors})` : '';
    } catch (e) {
      document.getElementById('forumState').textContent = '';
      A.toast('Форум: ' + A.errText(e), 'bad');
    }
    render();
    if (force) A.emit('data-changed');
  }

  function render() {
    const f = A.peek('forum');
    const n = f ? f.articles.length : 0;
    const r = f ? f.replies.filter(x => !x.deleted).length : 0;
    document.getElementById('fvArticles').textContent = f ? n : '…';
    document.getElementById('fvReplies').textContent = f ? r : '…';
    document.getElementById('fvTags').textContent = f ? tagStats(f).length : '…';
    if (view === 'articles') renderArticles();
    else if (view === 'replies') renderReplies();
    else renderTags();
  }

  /* ------------------------------------------------------------ статьи */
  const ts = v => (A.toDate(v) || 0) - 0;
  function filteredArticles() {
    const f = A.peek('forum');
    if (!f) return [];
    const q = document.getElementById('artSearch').value.trim().toLowerCase();
    let list = f.articles.filter(a => {
      if (q && !(`${a.title || ''} ${a.authorName || ''} ${(a.tags || []).join(' ')}`.toLowerCase().includes(q))) return false;
      if (artFilter === 'pinned') return !!a.pinned;
      if (artFilter === 'featured') return !!a.featured;
      if (artFilter === 'hidden') return !!a.hidden;
      if (artFilter === 'noreplies') return !a.liveReplies;
      return true;
    });
    const sort = document.getElementById('artSort').value;
    if (sort === 'views') list.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sort === 'replies') list.sort((a, b) => b.liveReplies - a.liveReplies);
    else if (sort === 'old') list.sort((a, b) => ts(a.createdAt) - ts(b.createdAt));
    else list.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
    return list;
  }

  function flags(a) {
    return [
      a.pinned ? '<span class="badge pin">закреплена</span>' : '',
      a.featured ? '<span class="badge feat">популярное</span>' : '',
      a.hidden ? '<span class="badge banned">скрыта</span>' : '',
    ].join(' ');
  }

  function renderArticles() {
    const f = A.peek('forum');
    const tbody = document.getElementById('artTbody');
    const rows = filteredArticles();
    document.getElementById('artEmpty').style.display = f && !rows.length ? 'block' : 'none';
    tbody.innerHTML = rows.slice(0, 400).map(a => `
      <tr data-id="${esc(a.id)}"${a.hidden ? ' class="is-hidden"' : ''}>
        <td class="title-cell"><a href="/forum/#article/${encodeURIComponent(a.id)}" target="_blank" rel="noopener">${esc(a.title || 'без названия')}</a>
          <div class="flags">${flags(a)}${a.topicRef && a.topicRef.title ? `<span class="topic-ref">${esc(a.topicRef.title)}</span>` : ''}</div></td>
        <td><button type="button" class="link-btn" data-act="author" data-uid="${esc(a.authorUid || '')}">${esc(a.authorName || 'Аноним')}</button></td>
        <td class="date">${A.fmtDate(a.createdAt)}</td>
        <td class="num-cell">${A.fmtNum(a.views || 0)}</td>
        <td class="num-cell">${a.liveReplies}</td>
        <td class="tags-cell">${(a.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join(' ') || '<span class="muted">—</span>'}</td>
        <td class="actions-cell">
          <button class="btn small" data-act="pin">${a.pinned ? 'Открепить' : 'Закрепить'}</button>
          <button class="btn small" data-act="hide">${a.hidden ? 'Показать' : 'Скрыть'}</button>
          <button class="btn small" data-act="more" aria-haspopup="dialog">Ещё…</button>
        </td>
      </tr>`).join('');
  }

  function findArticle(id) { const f = A.peek('forum'); return f ? f.articles.find(a => a.id === id) : null; }

  // Локально обновить статью в кэше без перечитывания форума
  function patchLocal(id, patch) {
    const a = findArticle(id);
    if (a) Object.assign(a, patch);
    render();
    A.emit('data-changed');
  }

  async function updateArticle(id, patch, btn, okMsg) {
    const full = Object.assign({}, patch, { moderatedBy: A.user.email, moderatedAt: FV().serverTimestamp() });
    const res = await A.run(btn, () => artRef(id).update(full).then(() => true), okMsg);
    if (res) patchLocal(id, patch);
    return res;
  }

  async function onArticleClick(e) {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'author') { if (b.dataset.uid) A.openUserCard(b.dataset.uid); return; }
    const id = b.closest('tr').dataset.id;
    const a = findArticle(id);
    if (!a) return;
    if (b.dataset.act === 'pin') {
      const ok = await A.confirm({ title: a.pinned ? 'Открепить статью' : 'Закрепить статью', text: `«${esc(a.title)}» ${a.pinned ? 'перестанет быть закреплённой' : 'будет показываться первой в ленте форума'}.`, confirmLabel: a.pinned ? 'Открепить' : 'Закрепить' });
      if (ok) updateArticle(id, { pinned: !a.pinned }, b, a.pinned ? 'Статья откреплена' : 'Статья закреплена');
    } else if (b.dataset.act === 'hide') {
      const ok = await A.confirm({ title: a.hidden ? 'Показать статью' : 'Скрыть статью', text: a.hidden ? `«${esc(a.title)}» снова появится в ленте.` : `«${esc(a.title)}» пропадёт из ленты форума (статья и ответы сохранятся, её можно вернуть).`, confirmLabel: a.hidden ? 'Показать' : 'Скрыть', danger: !a.hidden });
      if (ok) updateArticle(id, { hidden: !a.hidden }, b, a.hidden ? 'Статья снова видна' : 'Статья скрыта');
    } else if (b.dataset.act === 'more') {
      articleDialog(a);
    }
  }

  async function articleDialog(a) {
    const html = `
      <p class="adm-dlg-text"><b>${esc(a.title || 'без названия')}</b><br>
        <small>${esc(a.authorName || 'Аноним')} · ${A.fmtDate(a.createdAt)} · ${A.fmtNum(a.views || 0)} просмотров · ${a.liveReplies} ответов</small></p>
      <div class="flags">${flags(a)}</div>
      <p class="adm-excerpt">${esc(A.stripHtml(a.bodyHTML).slice(0, 360))}${A.stripHtml(a.bodyHTML).length > 360 ? '…' : ''}</p>
      <label class="adm-field"><span>Теги — через запятую, до 8</span><input type="text" id="dlgTags" value="${esc((a.tags || []).join(', '))}"></label>`;
    const r = await A.dialog({
      title: 'Статья', html, wide: true,
      actions: [
        { label: 'Удалить', value: 'delete', danger: true },
        { label: 'Обнулить просмотры', value: 'views' },
        { label: a.featured ? 'Убрать из «Популярного»' : 'В «Популярное»', value: 'feat' },
        { label: 'Сохранить теги', value: 'tags', primary: true },
      ],
    });
    if (!r.value) return;
    if (r.value === 'tags') {
      const tags = parseTags(r.root.querySelector('#dlgTags').value);
      updateArticle(a.id, { tags }, null, 'Теги сохранены');
    } else if (r.value === 'feat') {
      updateArticle(a.id, { featured: !a.featured }, null, a.featured ? 'Убрано из «Популярного»' : 'Отмечено как «Популярное»');
    } else if (r.value === 'views') {
      const ok = await A.confirm({ title: 'Обнулить просмотры', text: `Счётчик просмотров «${esc(a.title)}» (${A.fmtNum(a.views || 0)}) станет 0.`, confirmLabel: 'Обнулить', danger: true });
      if (ok) updateArticle(a.id, { views: 0 }, null, 'Просмотры обнулены');
    } else if (r.value === 'delete') {
      const ok = await A.confirm({ title: 'Удалить статью', text: `«${esc(a.title)}» и все ответы к ней (${a.replyCount}) будут удалены безвозвратно. Если нужно лишь убрать её из ленты — лучше скрыть.`, typeWord: 'удалить', confirmLabel: 'Удалить', danger: true });
      if (!ok) return;
      const done = await A.run(null, () => A.deleteArticleDeep(a.id).then(() => true), 'Статья удалена');
      if (done) {
        const f = A.peek('forum');
        f.articles = f.articles.filter(x => x.id !== a.id);
        f.replies = f.replies.filter(x => x.articleId !== a.id);
        render(); A.emit('data-changed');
      }
    }
  }

  function parseTags(s) {
    const seen = new Set();
    return String(s || '').split(',').map(t => t.trim().replace(/^#/, '').slice(0, 40)).filter(t => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase())).slice(0, 8);
  }

  /* ------------------------------------------------------------ ответы */
  function filteredReplies() {
    const f = A.peek('forum');
    if (!f) return [];
    const q = document.getElementById('repSearch').value.trim().toLowerCase();
    return f.replies.filter(r => {
      if (repFilter === 'deleted') { if (!r.deleted) return false; }
      else if (r.deleted) return false;
      if (repFilter === 'disliked' && !((r.dislikes || 0) > 0 && (r.dislikes || 0) >= (r.likes || 0))) return false;
      if (repFilter === 'today' && !(A.toDate(r.createdAt) && Date.now() - A.toDate(r.createdAt) < 864e5)) return false;
      if (q && !(`${A.stripHtml(r.bodyHTML)} ${r.authorName || ''} ${r.articleTitle}`.toLowerCase().includes(q))) return false;
      return true;
    }).sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
  }

  function renderReplies() {
    const f = A.peek('forum');
    const rows = filteredReplies();
    document.getElementById('repEmpty').style.display = f && !rows.length ? 'block' : 'none';
    document.getElementById('repTbody').innerHTML = rows.slice(0, 400).map(r => {
      const text = A.stripHtml(r.bodyHTML);
      const media = /<(img|audio)\b/i.test(r.bodyHTML || '') ? ' <span class="badge no neutral">вложение</span>' : '';
      return `<tr data-aid="${esc(r.articleId)}" data-rid="${esc(r.id)}">
        <td class="reply-cell">${r.deleted ? '<span class="muted">удалено</span>' : esc(text.slice(0, 220)) + (text.length > 220 ? '…' : '') + media}</td>
        <td><button type="button" class="link-btn" data-act="author" data-uid="${esc(r.authorUid || '')}">${esc(r.authorName || 'Аноним')}</button></td>
        <td><a href="/forum/#article/${encodeURIComponent(r.articleId)}" target="_blank" rel="noopener">${esc((r.articleTitle || 'статья').slice(0, 60))}</a></td>
        <td class="date">${A.fmtDate(r.createdAt)}</td>
        <td class="num-cell" title="нравится / не нравится">${r.likes || 0} / ${r.dislikes || 0}</td>
        <td class="actions-cell">${r.deleted ? '' : '<button class="btn small danger" data-act="del">Удалить</button>'}</td>
      </tr>`;
    }).join('');
  }

  async function onReplyClick(e) {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'author') { if (b.dataset.uid) A.openUserCard(b.dataset.uid); return; }
    const tr = b.closest('tr');
    const f = A.peek('forum');
    const r = f && f.replies.find(x => x.id === tr.dataset.rid && x.articleId === tr.dataset.aid);
    if (!r || b.dataset.act !== 'del') return;
    const ok = await A.confirm({
      title: 'Удалить ответ',
      text: `Ответ <b>${esc(r.authorName || 'Аноним')}</b> будет заменён пометкой «Сообщение удалено» (как при удалении на самом форуме — ветка ответов на него сохранится).<br><br><i>${esc(A.stripHtml(r.bodyHTML).slice(0, 200))}</i>`,
      confirmLabel: 'Удалить', danger: true,
    });
    if (!ok) return;
    const done = await A.run(b, () => artRef(r.articleId).collection('replies').doc(r.id).update({ deleted: true, bodyHTML: '' }).then(() => true), 'Ответ удалён');
    if (done) {
      r.deleted = true; r.bodyHTML = '';
      const a = findArticle(r.articleId); if (a) a.liveReplies = Math.max(0, a.liveReplies - 1);
      render(); A.emit('data-changed');
    }
  }

  /* ------------------------------------------------------------ теги */
  function tagStats(f) {
    const m = new Map();
    f.articles.forEach(a => (a.tags || []).forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'));
  }
  function renderTags() {
    const f = A.peek('forum');
    const list = document.getElementById('tagsList');
    if (!f) { list.innerHTML = '<p class="empty-hint">Загрузка…</p>'; return; }
    const tags = tagStats(f);
    list.innerHTML = tags.length ? tags.map(([t, n]) => `<button type="button" class="tag-btn" data-tag="${esc(t)}">#${esc(t)} <b>${n}</b></button>`).join('')
      : '<p class="empty-hint">Тегов пока нет</p>';
  }
  async function onTagClick(e) {
    const b = e.target.closest('[data-tag]');
    if (!b) return;
    const tag = b.dataset.tag;
    const f = A.peek('forum');
    const affected = f.articles.filter(a => (a.tags || []).includes(tag));
    const r = await A.dialog({
      title: 'Тег #' + tag,
      html: `<p class="adm-dlg-text">Используется в ${affected.length} ${A.plural(affected.length, 'статье', 'статьях', 'статьях')}.</p>
        <label class="adm-field"><span>Новое название (если такой тег уже есть — теги сольются)</span><input type="text" id="tagNew" value="${esc(tag)}" maxlength="40" autofocus></label>`,
      actions: [{ label: 'Удалить тег', value: 'delete', danger: true }, { label: 'Отмена', value: null }, { label: 'Переименовать', value: 'rename', primary: true }],
      validate: (v, root) => v === 'rename' && !root.querySelector('#tagNew').value.trim().replace(/^#/, '') ? 'Введите название' : '',
    });
    if (!r.value) return;
    const newName = r.root.querySelector('#tagNew').value.trim().replace(/^#/, '').slice(0, 40);
    if (r.value === 'rename' && newName === tag) return;
    const ok = await A.confirm({
      title: r.value === 'delete' ? 'Удалить тег' : 'Переименовать тег',
      text: r.value === 'delete' ? `Убрать #${esc(tag)} из ${affected.length} статей?` : `Заменить #${esc(tag)} на #${esc(newName)} в ${affected.length} статьях?`,
      confirmLabel: r.value === 'delete' ? 'Удалить' : 'Переименовать', danger: r.value === 'delete',
    });
    if (!ok) return;
    const updates = affected.map(a => {
      let tags = (a.tags || []).filter(t => t !== tag);
      if (r.value === 'rename' && !tags.some(t => t.toLowerCase() === newName.toLowerCase())) tags.splice((a.tags || []).indexOf(tag), 0, newName);
      return { a, tags: tags.slice(0, 8) };
    });
    const done = await A.run(null, async () => {
      for (let i = 0; i < updates.length; i += 400) {
        const batch = A.db.batch();
        updates.slice(i, i + 400).forEach(u => batch.update(artRef(u.a.id), { tags: u.tags, moderatedBy: A.user.email, moderatedAt: FV().serverTimestamp() }));
        await batch.commit();
      }
      return true;
    }, r.value === 'delete' ? 'Тег удалён' : 'Тег переименован');
    if (done) { updates.forEach(u => { u.a.tags = u.tags; }); render(); }
  }

  /* ------------------------------------------------------------ экспорт */
  function exportArticlesCsv() {
    const rows = filteredArticles();
    A.download(`mathframe-forum-articles-${A.stamp()}.csv`, A.toCsv(rows, [
      { key: 'id', label: 'ID' }, { key: 'title', label: 'Заголовок' }, { key: 'authorName', label: 'Автор' }, { key: 'authorUid', label: 'UID автора' },
      { label: 'Создана', get: a => { const d = A.toDate(a.createdAt); return d ? d.toISOString() : ''; } },
      { label: 'Просмотры', get: a => a.views || 0 }, { label: 'Ответы', get: a => a.liveReplies },
      { label: 'Теги', get: a => (a.tags || []).join(', ') }, { label: 'Тема справочника', get: a => a.topicRef ? a.topicRef.title : '' },
      { label: 'Закреплена', get: a => a.pinned ? 'да' : '' }, { label: 'Популярное', get: a => a.featured ? 'да' : '' }, { label: 'Скрыта', get: a => a.hidden ? 'да' : '' },
      { label: 'Символов текста', get: a => A.stripHtml(a.bodyHTML).length },
    ]), 'text/csv;charset=utf-8');
  }
  function exportRepliesCsv() {
    const rows = filteredReplies();
    A.download(`mathframe-forum-replies-${A.stamp()}.csv`, A.toCsv(rows, [
      { key: 'id', label: 'ID' }, { key: 'articleId', label: 'ID статьи' }, { key: 'articleTitle', label: 'Статья' },
      { key: 'authorName', label: 'Автор' }, { key: 'authorUid', label: 'UID автора' },
      { label: 'Создан', get: r => { const d = A.toDate(r.createdAt); return d ? d.toISOString() : ''; } },
      { label: 'Текст', get: r => A.stripHtml(r.bodyHTML) }, { label: 'Лайки', get: r => r.likes || 0 }, { label: 'Дизлайки', get: r => r.dislikes || 0 },
      { label: 'Удалён', get: r => r.deleted ? 'да' : '' },
    ]), 'text/csv;charset=utf-8');
  }
  function exportForumJson() {
    const f = A.peek('forum');
    if (!f) return;
    const data = f.articles.map(a => A.plain({ ...a, replies: f.replies.filter(r => r.articleId === a.id).map(({ articleId, articleTitle, voters, ...rest }) => rest) }));
    A.download(`mathframe-forum-${A.stamp()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), articles: data }, null, 2), 'application/json');
  }
})();

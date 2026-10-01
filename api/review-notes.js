// api/review-notes.js
// Приём заметок со страницы проверки примеров (/admin/review/, assets/js/review.js).
//
// POST { package: { sentAt, count, items: [...] }, images: { 'img/<id>-<n>.png': base64 } }
// Authorization: Bearer <Firebase ID token> — только владельцы сайта и администраторы
// (та же проверка, что у AI-агента: api/chat.js › identify).
//
// Пакет одним коммитом в main (Git Data API):
//   data/review-notes/<дата-время>.json   — заметки; пути картинок в нём
//   data/review-notes/<дата-время>/img/…  — снимки выделенных областей
// Разбор пакетов описан в CLAUDE.md («Заметки проверки примеров»).

const { OWNER, REPO, BRANCH, ghHeaders, requireToken } = require('./_github');
const { identify, bearerToken } = require('./chat')._internal;

const MAX_ITEMS = 2000;
const MAX_IMAGES = 400;
const MAX_IMAGE_B64 = 2.5e6;
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

async function gh(path, opts = {}) {
  const r = await fetch(API + path, { ...opts, headers: { ...ghHeaders(), 'content-type': 'application/json', ...(opts.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('GitHub ' + r.status + ': ' + (d.message || path));
  return d;
}

function validate(body) {
  const pkg = body && body.package;
  if (!pkg || !Array.isArray(pkg.items) || !pkg.items.length) return 'Пустой пакет';
  if (pkg.items.length > MAX_ITEMS) return 'Слишком много заметок в одном пакете';
  for (const it of pkg.items) {
    if (!it || typeof it !== 'object' || typeof it.exampleId !== 'string' || !/^[\w.-]{1,200}$/.test(it.exampleId)) return 'Некорректная заметка';
  }
  const images = body.images || {};
  if (typeof images !== 'object' || Array.isArray(images)) return 'Некорректные картинки';
  const keys = Object.keys(images);
  if (keys.length > MAX_IMAGES) return 'Слишком много картинок';
  for (const k of keys) {
    if (!/^img\/[\w-]{1,120}\.png$/.test(k)) return 'Некорректное имя картинки: ' + k;
    if (typeof images[k] !== 'string' || images[k].length > MAX_IMAGE_B64 || !/^[A-Za-z0-9+/=]+$/.test(images[k])) return 'Некорректная картинка: ' + k;
  }
  return null;
}

async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Только POST' }); }
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Нужен вход в аккаунт' });
  const who = await identify(token);
  if (!who) return res.status(401).json({ error: 'Недействительный токен' });
  if (who.role !== 'owner' && who.role !== 'admin') return res.status(403).json({ error: 'Только для администраторов' });
  if (!requireToken(res)) return;

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const bad = validate(body);
  if (bad) return res.status(400).json({ error: bad });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '-' + Math.random().toString(36).slice(2, 6);
  const dir = 'data/review-notes';
  const images = body.images || {};
  // пути картинок в заметках → относительно корня репозитория
  const items = body.package.items.map((it) => ({
    ...it,
    regions: Array.isArray(it.regions) ? it.regions.map((r) => ({ ...r, image: r && r.image && images[r.image] ? `${dir}/${stamp}/${r.image}` : null })) : [],
  }));
  const pkg = { sentAt: body.package.sentAt || new Date().toISOString(), sentBy: who.email, count: items.length, items };

  try {
    const ref = await gh(`/git/ref/heads/${BRANCH}`);
    const head = await gh(`/git/commits/${ref.object.sha}`);
    const tree = [{ path: `${dir}/${stamp}.json`, mode: '100644', type: 'blob', content: JSON.stringify(pkg, null, 2) + '\n' }];
    for (const [name, b64] of Object.entries(images)) {
      const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: b64, encoding: 'base64' }) });
      tree.push({ path: `${dir}/${stamp}/${name}`, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const t = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
    const c = await gh('/git/commits', { method: 'POST', body: JSON.stringify({ message: `Заметки проверки примеров: ${items.length} (${who.email})`, tree: t.sha, parents: [head.sha] }) });
    await gh(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: c.sha }) });
    return res.status(200).json({ ok: true, path: `${dir}/${stamp}.json`, commit: c.sha, count: items.length });
  } catch (e) {
    return res.status(502).json({ error: e.message || String(e) });
  }
}

module.exports = handler;
module.exports._internal = { validate };

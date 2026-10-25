// api/example.js
//
// Создаёт (POST) или удаляет (DELETE) ОДИН файл примера в data/examples/
// через GitHub Contents API. Парная функция к api/examples.js, которая
// только перечисляет примеры (GET) — разные файлы, потому что у Vercel
// имя файла и есть маршрут: /api/example (один) и /api/examples (список).
//
// Доступ: только владелец и администраторы (Firebase ID-токен в Authorization, api/_admin.js).

const { OWNER, REPO, BRANCH, ghHeaders, requireToken } = require('./_github');
const { requireAdmin } = require('./_admin');

const GITHUB_API = 'https://api.github.com';

// Разрешаем писать/удалять только внутри data/examples/, с расширением
// .gms — этот эндпоинт не должен становиться способом менять произвольный
// файл в репозитории через подставленный path.
function isValidExamplePath(path) {
  if (typeof path !== 'string') return false;
  if (path.includes('..')) return false;
  return /^data\/examples\/[a-zA-Z0-9._-]+\.gms$/.test(path);
}

async function githubGetFile(path) {
  const url = GITHUB_API + '/repos/' + OWNER + '/' + REPO + '/contents/' +
    path + '?ref=' + encodeURIComponent(BRANCH);
  const r = await fetch(url, { headers: ghHeaders() });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('GitHub GET ' + path + ' -> HTTP ' + r.status);
  return r.json();
}

module.exports = async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  if (!requireToken(res)) return;

  try {
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      const { path, content } = body;
      if (!isValidExamplePath(path)) {
        res.status(400).json({ ok: false, error: 'Некорректный путь — ожидается data/examples/<имя>.gms' });
        return;
      }
      const existing = await githubGetFile(path);
      if (existing) {
        res.status(409).json({ ok: false, error: 'Файл с таким путём уже существует.' });
        return;
      }
      const putRes = await fetch(
        GITHUB_API + '/repos/' + OWNER + '/' + REPO + '/contents/' + path,
        {
          method: 'PUT',
          headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders()),
          body: JSON.stringify({
            message: 'Создан пример: ' + path,
            content: Buffer.from(String(content || ''), 'utf-8').toString('base64'),
            branch: BRANCH,
          }),
        }
      );
      const putData = await putRes.json().catch(() => null);
      if (!putRes.ok) {
        res.status(putRes.status).json({ ok: false, error: (putData && putData.message) || ('GitHub PUT -> HTTP ' + putRes.status) });
        return;
      }
      res.status(200).json({ ok: true, path, commit: putData && putData.commit && putData.commit.sha });
      return;
    }

    if (req.method === 'DELETE') {
      const path = (req.query && req.query.path) || '';
      if (!isValidExamplePath(path)) {
        res.status(400).json({ ok: false, error: 'Некорректный путь — ожидается data/examples/<имя>.gms' });
        return;
      }
      const existing = await githubGetFile(path);
      if (!existing) {
        res.status(404).json({ ok: false, error: 'Файл не найден.' });
        return;
      }
      const delRes = await fetch(
        GITHUB_API + '/repos/' + OWNER + '/' + REPO + '/contents/' + path,
        {
          method: 'DELETE',
          headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders()),
          body: JSON.stringify({
            message: 'Удалён пример: ' + path,
            sha: existing.sha,
            branch: BRANCH,
          }),
        }
      );
      const delData = await delRes.json().catch(() => null);
      if (!delRes.ok) {
        res.status(delRes.status).json({ ok: false, error: (delData && delData.message) || ('GitHub DELETE -> HTTP ' + delRes.status) });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ ok: false, error: 'Метод не поддерживается.' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
};

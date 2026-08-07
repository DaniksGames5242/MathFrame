// api/file.js
// GET ?path=data/examples/foo.gms -> raw text content of that file, read
// from the repo through the GitHub API. Restricted to the data/ folder so
// this can't be used as a general-purpose repo file reader.

const { OWNER, REPO, BRANCH, ghHeaders, requireToken } = require('./_github');

const ALLOWED_PREFIX = 'data/';

module.exports = async (req, res) => {
  if (!requireToken(res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Метод не поддерживается' });
    return;
  }

  const path = String((req.query && req.query.path) || '');
  if (!path || path.includes('..') || !path.startsWith(ALLOWED_PREFIX)) {
    res.status(400).json({ error: 'Некорректный путь к файлу.' });
    return;
  }

  try {
    const r = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
      { headers: ghHeaders() }
    );
    if (!r.ok) {
      const details = await r.text();
      res.status(r.status).json({ error: `GitHub API вернул ${r.status} при чтении файла`, details });
      return;
    }
    const data = await r.json();
    if (Array.isArray(data)) {
      res.status(400).json({ error: 'Указанный путь — папка, а не файл.' });
      return;
    }
    const raw = Buffer.from(data.content, 'base64').toString('utf-8');
    res.status(200).send(raw);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

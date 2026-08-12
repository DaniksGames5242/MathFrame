// api/config.js
// GET  -> returns the current data/topics/config.json from GitHub, parsed.
// POST -> commits a new version of data/topics/config.json to GitHub.
//
// The GitHub token never leaves this server-side function.

const { OWNER, REPO, BRANCH, ghHeaders, requireToken } = require('./_github');

const CONFIG_PATH = 'data/topics/config.json';
const CONTENTS_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${CONFIG_PATH}`;

module.exports = async (req, res) => {
  if (!requireToken(res)) return;

  if (req.method === 'GET') {
    try {
      // Read with the "raw" media type instead of the default JSON metadata
      // envelope. The default envelope carries the file inline as base64 —
      // but ONLY for files under 1 MB; above that GitHub returns the metadata
      // with an empty `content`, which used to decode to "" and then fail
      // JSON.parse with a very misleading "config.json повреждён" error.
      // config.json passed 1 MB once descriptions started being generated
      // into it (it is several MB now), so the raw media type — good up to
      // 100 MB — is the only form of this read that keeps working.
      const r = await fetch(`${CONTENTS_URL}?ref=${BRANCH}`, {
        headers: { ...ghHeaders(), Accept: 'application/vnd.github.raw' },
      });
      if (!r.ok) {
        const details = await r.text();
        res.status(r.status).json({ error: `GitHub API вернул ${r.status} при чтении config.json`, details });
        return;
      }
      const raw = await r.text();
      if (!raw.trim()) {
        res.status(502).json({ error: 'GitHub вернул пустой config.json — файл не прочитан целиком.' });
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        res.status(502).json({ error: `config.json в репозитории повреждён (не валидный JSON): ${e.message}` });
        return;
      }
      res.status(200).json({ content: parsed });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
      const topics = body.content;
      if (!Array.isArray(topics)) {
        res.status(400).json({ error: 'Ожидался { content: [...] } — плоский массив тем.' });
        return;
      }

      // Re-fetch the current sha right before writing, so a save from another
      // tab/device in between doesn't get silently overwritten.
      let sha;
      const shaRes = await fetch(`${CONTENTS_URL}?ref=${BRANCH}`, { headers: ghHeaders() });
      if (shaRes.ok) {
        sha = (await shaRes.json()).sha;
      } else if (shaRes.status !== 404) {
        const details = await shaRes.text();
        res.status(shaRes.status).json({ error: `GitHub API вернул ${shaRes.status} при проверке текущей версии файла`, details });
        return;
      }

      const jsonText = JSON.stringify(topics, null, 2);
      const putRes = await fetch(CONTENTS_URL, {
        method: 'PUT',
        headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: body.message || 'Обновление тем справочника (редактор тем)',
          content: Buffer.from(jsonText, 'utf-8').toString('base64'),
          branch: BRANCH,
          ...(sha ? { sha } : {}),
        }),
      });
      if (!putRes.ok) {
        const details = await putRes.text();
        res.status(putRes.status).json({ error: `GitHub API вернул ${putRes.status} при сохранении`, details });
        return;
      }
      const result = await putRes.json();
      res.status(200).json({
        ok: true,
        sha: result.content && result.content.sha,
        commit: result.commit && result.commit.sha,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'Метод не поддерживается' });
};

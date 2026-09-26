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

      let topics;
      if (body.patch && typeof body.patch === 'object') {
        // Partial update, used by the AI auto-generation job's periodic
        // auto-commit: config.json is several MB by now, and a full replace
        // on every auto-commit sends that whole file as the *request body*
        // from the browser — which runs into Vercel's ~4.5 MB payload limit
        // on the way in, well before GitHub's own (much larger) limit on the
        // way out. Sending just the handful of topics a generation batch
        // actually touched (id + the changed field(s), typically
        // description or type) keeps the incoming request tiny regardless
        // of how big the file has grown; the merge onto the full array
        // happens here, server-side, where there's no such limit.
        const upsert = Array.isArray(body.patch.upsert) ? body.patch.upsert : [];
        const removeIds = Array.isArray(body.patch.removeIds)
          ? body.patch.removeIds.filter(id => typeof id === 'string') : [];
        if (!upsert.length && !removeIds.length) {
          res.status(400).json({ error: 'Пустой patch — нечего сохранять.' });
          return;
        }
        // Only the raw media type carries the actual bytes for a file this
        // size (see the GET handler above) — the metadata fetch just above
        // this block only ever gave us `sha`.
        const contentRes = await fetch(`${CONTENTS_URL}?ref=${BRANCH}`, {
          headers: { ...ghHeaders(), Accept: 'application/vnd.github.raw' },
        });
        if (!contentRes.ok) {
          const details = await contentRes.text();
          res.status(contentRes.status).json({ error: `GitHub API вернул ${contentRes.status} при чтении текущего config.json для патча`, details });
          return;
        }
        const raw = await contentRes.text();
        let current;
        try {
          current = JSON.parse(raw);
        } catch (e) {
          res.status(502).json({ error: `Текущий config.json в репозитории повреждён (не валидный JSON): ${e.message}` });
          return;
        }
        if (!Array.isArray(current)) {
          res.status(502).json({ error: 'Текущий config.json в репозитории не является массивом тем.' });
          return;
        }
        const indexById = new Map(current.map((t, i) => [t && t.id, i]));
        const missing = [];
        upsert.forEach(item => {
          if (!item || typeof item.id !== 'string') return;
          const idx = indexById.get(item.id);
          if (idx === undefined) { missing.push(item.id); return; }
          // Shallow merge onto the existing entry — only whatever fields the
          // client actually sent (description/type, usually) are touched;
          // title, parent, class, difficulty etc. stay exactly as they were.
          current[idx] = Object.assign({}, current[idx], item);
        });
        if (missing.length) {
          // Not fatal for the rest of the batch, but worth knowing about —
          // it means a topic the job generated for no longer exists under
          // that id (renamed/deleted after the job started).
          console.warn('config.json patch: id не найден в текущем файле:', missing.join(', '));
        }
        topics = removeIds.length
          ? current.filter(t => !(t && removeIds.includes(t.id)))
          : current;
      } else {
        topics = body.content;
        if (!Array.isArray(topics)) {
          res.status(400).json({ error: 'Ожидался { content: [...] } или { patch: { upsert, removeIds } }.' });
          return;
        }
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

// api/examples.js
// GET -> lists every file under data/examples/ in the repo, so the editor
// can offer a visual picker instead of a free-text path field.

const { OWNER, REPO, BRANCH, ghHeaders, requireToken } = require('./_github');
const { requireAdmin } = require('./_admin');

const EXAMPLES_DIR = 'data/examples';

module.exports = async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  if (!requireToken(res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Метод не поддерживается' });
    return;
  }

  try {
    const refRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`,
      { headers: ghHeaders() }
    );
    if (!refRes.ok) {
      const details = await refRes.text();
      res.status(refRes.status).json({ error: `Не удалось получить ветку ${BRANCH}`, details });
      return;
    }
    const ref = await refRes.json();
    const commitSha = ref.object.sha;

    const treeRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${commitSha}?recursive=1`,
      { headers: ghHeaders() }
    );
    if (!treeRes.ok) {
      const details = await treeRes.text();
      res.status(treeRes.status).json({ error: 'Не удалось получить список файлов репозитория', details });
      return;
    }
    const tree = await treeRes.json();
    const files = (tree.tree || [])
      .filter((item) => item.type === 'blob' && item.path.startsWith(EXAMPLES_DIR + '/'))
      .map((item) => ({ path: item.path, size: item.size }))
      .sort((a, b) => a.path.localeCompare(b.path));

    res.status(200).json({ files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

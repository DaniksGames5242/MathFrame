// api/_github.js
// Small shared helper around the GitHub REST API. The token is read only
// from the server-side environment variable — it is never sent to the
// browser and never appears in any file committed to the repo.

const OWNER = process.env.GITHUB_OWNER || 'DaniksGames5242';
const REPO = process.env.GITHUB_REPO || 'MathFrame';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN;

function ghHeaders() {
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'mathframe-topics-editor',
  };
}

function requireToken(res) {
  if (!TOKEN) {
    res.status(500).json({
      error: 'GITHUB_TOKEN не задан на сервере. Добавьте его в Vercel → Settings → Environment Variables и передеплойте проект.',
    });
    return false;
  }
  return true;
}

module.exports = { OWNER, REPO, BRANCH, TOKEN, ghHeaders, requireToken };

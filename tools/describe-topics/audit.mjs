// Whole-config audit after a run: KaTeX that doesn't compile, leftover code
// fences, empty «Формулы» sections, repeated links, links in headings.
import fs from 'node:fs';
import katex from 'katex';

const topics = JSON.parse(fs.readFileSync(new URL('../../data/topics/config.json', import.meta.url), 'utf8'));
const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const out = { katex: [], fences: [], emptyFormulas: [], dupLinks: [], headingLinks: [] };
for (const t of topics){
  const h = t.description || '';
  if (/```/.test(h)) out.fences.push(t.id);
  const text = h.replace(/<[^>]*>/g, ' ');
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g; let m;
  while ((m = re.exec(text))){
    const tex = decode(m[1] != null ? m[1] : m[2]);
    try { katex.renderToString(tex, { throwOnError: true, displayMode: m[1] != null, strict: 'ignore' }); }
    catch (e){ out.katex.push(t.id + ': ' + tex.slice(0, 60)); }
  }
  const f = h.match(/<h2>\s*Формулы[^<]*<\/h2>([\s\S]*?)(?=<h2>|$)/i);
  if (f && !f[1].includes('$')) out.emptyFormulas.push(t.id);
  const ids = [...h.matchAll(/href="(topic:[^"]+)"/g)].map(x => x[1]);
  if (new Set(ids).size !== ids.length) out.dupLinks.push(t.id);
  if (/<h[1-6][^>]*>[^<]*<a\b/i.test(h)) out.headingLinks.push(t.id);
}
for (const [k, v] of Object.entries(out)) console.log(k, v.length, v.slice(0, 8));

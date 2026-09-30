// assets/js/geo/geo-markup.js
// Промежуточный этап: условие из любого источника (LaTeX/MathJax/KaTeX, Markdown,
// HTML, MathML, AsciiMath, Word/Unicode-символы, копия из чатов и решебников) →
// простой текст, который понимает geo-parse.js:
//   \[ABC\], \(AB = 13\), $...$, $$...$$ → ABC, AB = 13
//   C_{1}, C_1, C₁ → C1;  60^{\circ}, 60^\circ, 60\degree → 60°
//   \frac{a}{b} → (a)/(b);  \sqrt{3}, \sqrt3 → √3;  \cdot, \times → ·
//   \cos A → cos A;  \angle ABC → ∠ABC;  \parallel → ∥;  \perp → ⊥
//   <sub>1</sub>, <b>…</b>, &nbsp; → текст;  **жирный**, `код` → текст

const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const ENT = { nbsp: ' ', lt: '<', gt: '>', amp: '&', quot: '"', deg: '°', ang: '∠', middot: '·', times: '×', minus: '−', le: '≤', ge: '≥', ne: '≠', radic: '√', pi: 'π', alpha: 'α', beta: 'β', gamma: 'γ' };
const CMD = {
  angle: '∠', measuredangle: '∠', triangle: '△', parallel: '∥', perp: '⊥', cdot: '·', times: '·', circ: '°', degree: '°',
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', pi: 'π', alpha: 'α', beta: 'β', gamma: 'γ',
  varphi: 'φ', phi: 'φ', infty: '∞', colon: ':', ldots: '…', dots: '…', quad: ' ', qquad: ' ', ',': ' ', ';': ' ', '!': '', ' ': ' ',
  cos: 'cos', sin: 'sin', tan: 'tg', tg: 'tg', cot: 'ctg', ctg: 'ctg', arccos: 'arccos', arcsin: 'arcsin', arctan: 'arctg',
  overline: '', overrightarrow: '', vec: '', mathrm: '', text: '', textbf: '', textit: '', mathit: '', mathbf: '', operatorname: '',
  left: '', right: '', big: '', Big: '', displaystyle: '', lbrace: '{', rbrace: '}', hline: '',
};

// Содержимое {…} с учётом вложенности, начиная с позиции открывающей скобки.
function group(s, i) {
  if (s[i] !== '{') {
    // одиночный аргумент без скобок: \sqrt3, \frac12
    return { body: s[i] || '', end: i + 1 };
  }
  let d = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}') { d--; if (d === 0) return { body: s.slice(i + 1, j), end: j + 1 }; }
  }
  return { body: s.slice(i + 1), end: s.length };
}

function latexToText(s) {
  let out = '', i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '\\') {
      const m = s.slice(i + 1).match(/^([A-Za-z]+|.)/);
      if (!m) { i++; continue; }
      const name = m[1];
      i += 1 + name.length;
      while (/[A-Za-z]/.test(name) && s[i] === ' ' && /^(frac|dfrac|tfrac|sqrt)$/.test(name)) i++;
      if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
        const a = group(s, i); const b = group(s, a.end);
        out += '(' + latexToText(a.body) + ')/(' + latexToText(b.body) + ')';
        i = b.end; continue;
      }
      if (name === 'sqrt') {
        let deg = '';
        if (s[i] === '[') { const e = s.indexOf(']', i); deg = s.slice(i + 1, e); i = e + 1; }
        const a = group(s, i); i = a.end;
        const inner = latexToText(a.body);
        out += (deg ? 'root(' + deg + ', ' + inner + ')' : (/^[\d.,]+$/.test(inner) ? '√' + inner : '√(' + inner + ')'));
        continue;
      }
      if (CMD[name] !== undefined) {
        const v = CMD[name];
        // команды оформления с аргументом — берём аргумент как есть
        if (v === '' && s[i] === '{' && !/^(left|right|big|Big|displaystyle|hline)$/.test(name)) { const a = group(s, i); out += latexToText(a.body); i = a.end; continue; }
        out += /^[a-zа-я]+$/i.test(v) ? v + ' ' : v;
        continue;
      }
      // неизвестная команда: \{ \} и т. п. — сам символ, буквенная — пропускаем имя
      if (!/[A-Za-z]/.test(name)) out += name;
      continue;
    }
    if (ch === '^') {
      const a = group(s, i + 1); i = a.end;
      const t = latexToText(a.body).trim();
      if (t === '°' || t === 'o' || t === '0' && false) out += '°';
      else if (/^[\d]+$/.test(t) && t.length === 1) out += '^' + t;
      else out += '^(' + t + ')';
      continue;
    }
    if (ch === '_') {
      const a = group(s, i + 1); i = a.end;
      out += latexToText(a.body).replace(/[{}\s]/g, '');
      continue;
    }
    if (ch === '{' || ch === '}') { i++; continue; }
    if (ch === '~') { out += ' '; i++; continue; }
    out += ch; i++;
  }
  return out;
}

export function normalizeMarkup(src) {
  let t = String(src || '');
  // HTML / MathML
  t = t.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr)>/gi, '\n');
  t = t.replace(/<sub>\s*([^<]*)<\/sub>/gi, '$1').replace(/<sup>\s*(°|o|&deg;)\s*<\/sup>/gi, '°').replace(/<sup>\s*([^<]*)<\/sup>/gi, '^($1)');
  t = t.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/gi, '');
  t = t.replace(/<[^>]+>/g, '');
  t = t.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENT[e.toLowerCase()] !== undefined ? ENT[e.toLowerCase()] : m;
  });
  // Markdown
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/^#+\s*/gm, '').replace(/^\s*[-*]\s+/gm, '');
  // Разделители формул LaTeX: \[ \], \( \), $$ $$, $ $, \begin{…}
  t = t.replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}/g, ' ');
  t = t.replace(/\\\[([\s\S]*?)\\\]/g, (m, x) => latexToText(x))
       .replace(/\\\(([\s\S]*?)\\\)/g, (m, x) => latexToText(x))
       .replace(/\$\$([\s\S]*?)\$\$/g, (m, x) => latexToText(x))
       .replace(/\$([^$]+)\$/g, (m, x) => latexToText(x));
  // Оставшиеся команды без разделителей (скопировано «как есть»)
  if (/\\[A-Za-z]|[_^]\{/.test(t)) t = latexToText(t);
  // Unicode-индексы, степени, штрихи
  t = t.replace(/[₀-₉]/g, c => SUB[c]).replace(/([A-Za-zА-Яа-я])([⁰-⁹¹²³]+)/g, (m, a, b) => a + '^' + [...b].map(c => SUP[c]).join(''));
  t = t.replace(/[⁰¹²³⁴-⁹]/g, c => '^' + SUP[c]);
  t = t.replace(/\^\(°\)|\^°|\^\(\\?circ\)/g, '°').replace(/(\d)\s*°/g, '$1°');
  t = t.replace(/[‐‑‒–—−]/g, m => (m === '—' ? '—' : '-')).replace(/[∗⋅•×]/g, '·').replace(/∶/g, ':');
  // AsciiMath-подобное: sqrt(3) оставляем — его понимает geo-parse
  t = t.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').trim();
  return t;
}

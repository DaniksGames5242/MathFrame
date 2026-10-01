// assets/js/geo/geo-ai.js
// Клиент автоматических функций нейросети (сервер — api/ai-task.js):
//   aiParseGeometry(text, draft) → IR задачи, которую не понял локальный разбор;
//   recognizePhoto(file, mode)   → текст примера/задачи с фотографии.
// Модели выбирает сервер; ключ сайта в браузер не попадает.

async function authHeader() {
  try {
    const u = window.Auth && window.Auth.getCurrentUser && window.Auth.getCurrentUser();
    if (u) return { authorization: 'Bearer ' + (await u.getIdToken()) };
  } catch (e) { /* без входа — тоже можно, с меньшим лимитом */ }
  return {};
}

async function post(body) {
  const r = await fetch('/api/ai-task', {
    method: 'POST',
    headers: Object.assign({ 'content-type': 'application/json' }, await authHeader()),
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error((d && d.error) || ('ошибка сервера (' + r.status + ')'));
  return d || {};
}

export async function aiParseGeometry(text, draft) {
  const d = await post({ task: 'geometry', text, draft });
  if (!d.ir) throw new Error('нейросеть не вернула условие');
  return d.ir;
}

// Уменьшаем фото до 1600 px по большей стороне и перекодируем в JPEG — так
// запрос укладывается в лимиты и быстрее доходит с телефона.
export function fileToDataUrl(file, maxSide) {
  maxSide = maxSide || 1600;
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error('это не картинка')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('не удалось открыть картинку')); };
    img.src = url;
  });
}

export async function recognizePhoto(file, mode) {
  const image = await fileToDataUrl(file);
  const d = await post({ task: 'ocr', mode: mode === 'geometry' ? 'geometry' : 'algebra', image });
  const text = String(d.text || '').trim();
  if (!text) throw new Error('на фото не нашлось ' + (mode === 'geometry' ? 'условия задачи' : 'примера'));
  return text;
}

// Полное решение нейросетью (для задач вне модели локального решателя).
export async function aiSolveGeometry(text) {
  const d = await post({ task: 'solve', text });
  if (!Array.isArray(d.steps) || !d.steps.length) throw new Error('нейросеть не вернула решения');
  return d;
}

// Алгебра: формулировка, которую не понял калькулятор (текстовая задача и т. п.).
// Нематематический текст отсекается и здесь, и на сервере.
const MATH_WORDS = /уравнен|неравенств|систем|выражен|упрост|вычисл|реш|найд|корн|производн|интеграл|предел|функци|график|дроб|процент|скорост|сумм|разност|произведен|частн|степен|логарифм|синус|косинус|тангенс|числ|множител|многочлен|прогресс|модул/;
export function checkMathText(text) {
  const t = String(text || '').toLowerCase().trim();
  if (t.replace(/\s/g, '').length < 2) return 'Слишком короткий запрос.';
  const formula = /\d|[=<>^√∫∑π]|\b[a-z]\b|\b(sin|cos|tg|tan|log|ln|sqrt|lim)\b/.test(t);
  if (!formula && !MATH_WORDS.test(t)) return 'Некорректный запрос: калькулятор решает только математические выражения, уравнения и задачи.';
  return null;
}
export async function aiSolveAlgebra(text) {
  const bad = checkMathText(text);
  if (bad) throw new Error(bad);
  const d = await post({ task: 'algebra', text });
  if (!Array.isArray(d.steps) || !d.steps.length) throw new Error('нейросеть не вернула решения');
  return d;
}

// Команда со формулой («Решите уравнение x² − 5x + 6 = 0», «Упростите $\\frac{x^2-1}{x-1}$»,
// «Вычислите 2^10») → формула для калькулятора. null — если это не «команда + формула».
import { normalizeMarkup } from './geo-markup.js';
export function extractFormula(text) {
  let t = normalizeMarkup(String(text || '')).trim();
  const cmd = /^(?:пожалуйста\s*,?\s*)?(?:реши(?:те)?|решить|найди(?:те)?|найти|вычисли(?:те)?|вычислить|упрости(?:те)?|упростить|посчитай(?:те)?|сколько\s+будет|чему\s+равно|разложи(?:те)?\s+на\s+множители|раскрой(?:те)?\s+скобки)\s*(?:уравнение|неравенство|систему(?:\s+уравнений)?|выражение|значение(?:\s+выражения)?|пример|корни(?:\s+уравнения)?)?\s*:?\s*/i;
  const m = t.match(cmd);
  if (m) t = t.slice(m[0].length);
  t = t.replace(/[.?!]+$/, '').trim();
  // в формуле не должно остаться русских слов (кроме разделителя систем)
  if (!t || /[а-яё]{2,}/i.test(t.replace(/\s+и\s+/g, ';'))) return null;
  t = t.replace(/\s+и\s+/g, ';').replace(/\s*;\s*/g, ';');
  return t;
}

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

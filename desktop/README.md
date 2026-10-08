# MathFrame — Доска: приложение для Linux, Windows и Android

Офлайн-версия электронной доски (`/board/`) для одного пользователя: те же инструменты и интерфейс,
но без входа, общих досок, «Поделиться» и навигации по сайту. Личные доски хранятся локально
(IndexedDB/localStorage приложения). Распознавание рукописного текста работает при наличии интернета;
функции нейросети (`/api/ai-task`) требуют входа и в приложении недоступны — выводится сообщение.

Всё отличие от сайта — за флагом `window.MF_DESKTOP` (класс `html.mf-desktop`), который
`scripts/copy-site.js` вставляет в копию `pages/board.html`. Сайт не меняется.

## Как устроено
- `scripts/copy-site.js` — копирует `pages/board.html` и `assets/` в `desktop/app/`, убирает Firebase и `auth.js`,
  кладёт MathJax и jsPDF локально (`app/vendor/`) и подменяет в копии `board.js` адреса CDN.
- `main.js` — Electron: окно на весь экран, без меню, F11 — полноэкранный режим (в режиме разработки ещё Ctrl+R и F12).
  Файлы отдаются по схеме `mf://board/`, запросы `/api/*` проксируются на https://math-frame.vercel.app.
- `android/` — минимальный проект WebView (без зависимостей): та же папка `app/` подключена как assets,
  страница открывается с `https://appassets.androidplatform.net/board/`; PNG/PDF сохраняются в «Загрузки».

## Запуск и сборка (Linux / Windows)
```bash
cd desktop
npm install
npm start              # запустить (копирует сайт и открывает окно)
npm run dist:linux     # dist/MathFrame-Board-linux.AppImage и .deb
npm run dist:win       # dist/MathFrame-Board-windows-setup.exe и -portable.exe (на Windows)
```

## Android
Нужны JDK 17, Android SDK и Gradle 8.7+:
```bash
cd desktop && npm install && node scripts/copy-site.js
cd android && gradle assembleDebug   # app/build/outputs/apk/debug/app-debug.apk
```
Установка APK: скачайте `MathFrame-Board-android.apk`, откройте файл и разрешите установку
из неизвестных источников (Настройки → Безопасность / «Установка неизвестных приложений» для браузера
или файлового менеджера). APK подписан отладочным ключом.

## Автосборка
`.github/workflows/desktop.yml` при пуше в `main` (изменения `desktop/**`, `pages/board.html`, `assets/**`)
собирает все версии и обновляет релиз `desktop-latest`:
- https://github.com/DaniksGames5242/MathFrame/releases/download/desktop-latest/MathFrame-Board-linux.AppImage
- https://github.com/DaniksGames5242/MathFrame/releases/download/desktop-latest/MathFrame-Board-linux.deb
- https://github.com/DaniksGames5242/MathFrame/releases/download/desktop-latest/MathFrame-Board-windows-setup.exe
- https://github.com/DaniksGames5242/MathFrame/releases/download/desktop-latest/MathFrame-Board-windows-portable.exe
- https://github.com/DaniksGames5242/MathFrame/releases/download/desktop-latest/MathFrame-Board-android.apk

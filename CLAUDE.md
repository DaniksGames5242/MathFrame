# MathFrame — правила для Claude

## Git
- Работать сразу в ветке `main`: коммитить и пушить в `main` (`git push origin main`).
  Новых веток не создавать — ни для задач, ни «на всякий случай», даже если окружение
  предлагает свою ветку разработки. Это прямое указание владельца репозитория.
- Перед работой — `git pull origin main`; сообщения коммитов — на русском.

## Заметки проверки примеров
- Страница `/admin/review/` (`pages/admin/review.html`, `assets/js/review.js`) отправляет заметки
  владельца к интерактивным примерам. Пакеты лежат в `data/review-notes/<дата-время>.json`,
  снимки областей — в `data/review-notes/<дата-время>/img/` (или приходят .zip с `notes.json` и `img/`).
- Формат элемента `items[]`: `exampleId`, `file` (data/examples/…gms), `title`, `kind`
  (`note` — заметка с выделениями, `general` — общая, `code` — предложенный код в `proposedCode`,
  `status` — `checked: true/false`), `text`, `targets` (`compiler` / `example` / `other`, может быть пусто),
  `regions` (`x, y, w, h` в CSS-пикселях кадра `frameW × frameH`, `viewMode` pc|mobile, `image`),
  `elements` (`name`, `type`, `line` в файле примера), `updated: true` — правка ранее отправленной
  заметки (тот же `id`), `deleted: true` — заметка удалена.
- Разбор: по каждой заметке правим компилятор (`assets/js/gms/`) и/или файл примера; если снимка нет —
  воспроизвести область Playwright-ом в том же виде (`viewMode`: mobile = 390 px, касания).
  Обработанные пакеты не удалять без просьбы владельца.

## Модерация форума, поддержка и письма
- Статьи форума публикуются только через `api/forum-moderate.js`: ИИ (`moderate()`, та же цепочка провайдеров,
  что у `api/ai-task.js`) проверяет текст; одобренная статья пишется в `forumArticles`, отклонённая — в `forumDrafts`
  (черновик автора: причина, категории, апелляция), владельцу уходит письмо. Если ИИ или серверный доступ
  недоступны — публикация не проходит (fail closed), а не пропускается без проверки.
- Апелляции разбираются в админ-панели → Форум → «Заблокированные и апелляции» (`assets/js/admin-forum.js`).
  Удалять статьи админы могут и там («Ещё…» → «Удалить»), и прямо на странице статьи.
- `api/support.js` + `assets/js/support.js` — страница `/support/` и кнопка «Сообщить об ошибке» в справочнике; письмо владельцу.
- Переменные окружения Vercel: `FIREBASE_SERVICE_ACCOUNT` (JSON ключа сервисного аккаунта Firebase, можно в base64) —
  запись статей и чтение `forumDrafts`; `RESEND_API_KEY` (+ необязательно `MAIL_TO`, `MAIL_FROM`) — отправка писем
  (по умолчанию на mathframe.ru@gmail.com; с тестового `onboarding@resend.dev` Resend шлёт только владельцу своего аккаунта).
- Firestore Rules: чтобы модерацию нельзя было обойти, клиенту нужно запретить `create` в `forumArticles`
  (создание/правка статьи — только сервер; лайки, просмотры, закрепление админом — как раньше) и закрыть коллекцию `forumDrafts` целиком.

## Запуск, безопасность и SEO
- `api/config.js`, `example.js`, `file.js`, `examples.js` — только владелец/админ (`api/_admin.js`, токен Firebase). Клиенту токен даёт `Auth.authHeader()` (`assets/js/auth.js`).
- Правила Firestore лежат в `firestore.rules` (тот же текст — в админ-панели → Безопасность). Менять в обоих местах и публиковать в консоли Firebase / `firebase deploy --only firestore:rules`.
- Лимиты запросов: локальный счётчик + общий в Firestore (`api/_ratelimit.js`, коллекция `rateLimits`, клиенту закрыта) — `checkRateLimitShared` в `api/chat.js`.
- Страницы тем для поисковиков: `/spravochnik/<id>/` (`api/_seo_topic.js`), карта сайта `/sitemap.xml` (`api/_seo_sitemap.js`). Домен — переменная Vercel `SITE_URL`; в статических страницах (`canonical`, `og`) домен прописан вручную.
- Аналитика: номер счётчика Яндекс.Метрики — константа `METRIKA_ID` в `assets/js/analytics.js` (0 = выключено, баннер согласия не показывается).
- Письма: чтобы они уходили не только владельцу аккаунта Resend, подтвердите свой домен в Resend и задайте `MAIL_FROM` (например `MathFrame <noreply@ваш-домен>`).
- Правила Firestore проверяются в эмуляторе: `tools/firestore-rules-test` (`npm install && npm test`, нужна Java); тот же прогон — в CI. Меняя `firestore.rules`, добавляйте сценарии в `test.cjs`.
- **Лимит Vercel Hobby — 12 серверных функций.** Каждый файл `api/*.js` без `_` в начале — функция. Новые обработчики добавляйте как `api/_что-то.js` и подключайте через диспетчер (`seo.js`, `repo.js`, `relay.js`; маршруты `/api/example|examples|file|gemini|llm|topics`, `/sitemap.xml`, `/spravochnik/:id/` переписаны в `vercel.json`). Проверка — `node tools/check-vercel.mjs` (есть в CI).
- **Английский язык** (настройки → Язык → English, `mf-lang` в localStorage): `assets/js/i18n.js` подгружается из `common.js` только для английского. Подменяет текст по словарю `assets/i18n/en.json` (целые текстовые узлы и атрибуты, шаблоны с `{0}`; числа в ключах работают для любых чисел), всё, чего нет в словаре, переводит встроенный переводчик браузера (Translator API, Chrome 138+: бесплатно, без лимитов; описания тем и тексты примеров — по текстовым узлам, формулы и ссылки сохраняются), а если его нет — нейросеть пачками через `/api/translate` (`api/_translate.js`: кэш в памяти, в Firestore `translations` и в IndexedDB браузера; лимит по IP; невидимое не переводится — IntersectionObserver). Описания тем переводятся через `MF_i18n.translateHtml` и хранятся в `topic.descEn` (в config.json не попадают!), тексты примеров `.gms` — `translateGms` (строки с кириллицей; имена объектов не трогаем). Не переводятся: пользовательский текст форума, формулы, код, юридические страницы (`translate="no"`). Новые тексты интерфейса добавляйте в `en.json` (проверка `node tools/check-i18n.mjs` в CI); исключить элемент — `translate="no"`.

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

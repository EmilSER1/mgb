# Bitrix Meetings Stub (MVP draft)

Временная заглушка: простой сервер + HTML-интерфейс для рейтинга "кто сегодня больше назначил встреч".

## Запуск
```bash
cd bitrix_meetings_stub
npm start
```

Откройте: `http://localhost:3000`

## Что внутри
- `server.js` — простой Node HTTP сервер.
- `mock-data.json` — данные-заглушка (можно менять вручную для демо).
- `public/index.html` — страница рейтинга.
- `public/styles.css` — стили.
- `public/app.js` — polling, рендер, toast-уведомления.

## API (заглушка)
- `GET /api/meetings/today` — отдаёт данные из `mock-data.json`.

## Следующий шаг
Когда пришлёте webhook и точные поля Bitrix, заменим чтение заглушки на реальные запросы к Bitrix API.

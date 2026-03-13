# Bitrix Meetings Stub (ready for hosting)

Лёгкий сервис для рейтинга "кто сегодня назначил больше встреч".

## 1) Быстрый запуск (локально)
```bash
cd bitrix_meetings_stub
cp .env.example .env
npm start
```

Откройте: `http://localhost:3000`

## 2) Режимы работы
Управляется переменной `USE_MOCK`:

- `USE_MOCK=true` — режим заглушки (читает `mock-data.json`).
- `USE_MOCK=false` — режим Bitrix API (через webhook).

## 3) Переменные окружения
См. `.env.example`:

- `PORT` — порт сервера.
- `USE_MOCK` — mock/bitrix режим.
- `BITRIX_WEBHOOK_URL` — webhook Bitrix (нужен при `USE_MOCK=false`).
- `BITRIX_MEETING_STAGE_ID` — этап "Назначена встреча" (нужен при `USE_MOCK=false`).

## 4) API
- `GET /api/meetings/today`

Ответ:
```json
{
  "generatedAt": "2026-03-13T08:20:00.000Z",
  "summary": {
    "totalMeetings": 14,
    "activeEmployees": 4
  },
  "stats": [
    {
      "employeeId": "101",
      "employeeName": "Айгерим С.",
      "position": "Оператор",
      "meetingsCount": 5
    }
  ]
}
```

## 5) Деплой на хостинг (минимум)
1. Залить папку `bitrix_meetings_stub` на сервер.
2. Поставить Node.js 18+.
3. Создать `.env` (из `.env.example`).
4. Запустить `node server.js` (или через pm2/systemd).
5. Пробросить домен через Nginx/Caddy на порт сервиса.

## 6) Что правим дальше
Когда отправите webhook и точные поля, докрутим фильтры и отображаемые колонки под ваш Bitrix.


## 7) Создать архив для хостинга
```bash
cd bitrix_meetings_stub
./build-archive.sh
```

Скрипт создаст `.tar.gz` в папке `dist/` и выведет полный путь к архиву.

Распаковка на сервере:
```bash
tar -xzf bitrix_meetings_stub_YYYYMMDD_HHMMSS.tar.gz
cd bitrix_meetings_stub
cp .env.example .env
# заполните .env
node server.js
```

# Backend

Express API для HOME-DECOR.

**Полная документация** (локальный запуск, деплой, CI/CD, env) — [README.md](../README.md) в корне репозитория.

## Быстрый старт

```bash
cp .env.example .env
# заполни SECRET и SESSION_SECRET в .env (разные строки)

npm ci
npx migrate-mongo up
npm start
```

API: http://localhost:3000/api/

> `"start": "nodemon app.js"` — для прода на сервере используется `npm run start:prod` (просто `node app.js`).

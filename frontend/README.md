# Frontend

Angular-приложение HOME-DECOR.

**Полная документация** (локальный запуск, деплой, CI/CD, env) — [README.md](../README.md) в корне репозитория.

## Быстрый старт

```bash
npm ci
npm start
```

http://localhost:4200/

## Prod-сборка

```bash
npm ci
npm run build
```

Артефакты: `dist/frontend/browser/` (Angular 19, builder `application`).

Для production-конфигурации: `npx ng build --configuration production` (в CI используется именно так).

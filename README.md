# HOME-DECOR

Учебный демо-интернет-магазин декора для дома. Заказы не исполняются, оплаты нет — проект для портфолио.

**Прод:** https://h-decor.shop  
**Репозиторий:** https://github.com/esukhova/HOME-DECOR

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | Angular 19, Angular Material, RxJS, SCSS |
| Backend | Node.js 22, Express, Mongoose, Passport JWT |
| БД | MongoDB |
| Прод | nginx, PM2, Let's Encrypt (Certbot) |
| CI/CD | GitHub Actions (двухэтапный деплой) |

---

## Структура репозитория

```
HOME-DECOR/
├── frontend/          # Angular SPA
├── backend/           # Express API
│   ├── app.js
│   ├── migrations/    # migrate-mongo
│   ├── public/images/products/   # картинки товаров (в git для локальной разработки)
│   └── src/
└── .github/workflows/
    ├── upload.yml     # push → сборка + заливка на сервер
    └── release.yml    # кнопка → публикация на домен
```

---

## Локальный запуск

### Требования

- Node.js **22**
- MongoDB (локально на `127.0.0.1:27017`)
- Angular CLI (или `npx ng`)

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Заполни в `.env` минимум `SECRET` и `SESSION_SECRET` — **разные** случайные строки (обязательны всегда, в том числе для миграций):

```bash
# Пример генерации секрета (PowerShell / bash):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
npm ci
npx migrate-mongo up
npm start
```

API: http://localhost:3000/api/

### 2. Frontend

```bash
cd frontend
npm ci
npm start
```

Сайт: http://localhost:4200/

### 3. Картинки товаров

Файлы лежат в `backend/public/images/products/`. В репозитории они **есть** — после `git clone` папка уже на месте, локально ничего докладывать не нужно.

**На проде** картинки устроены иначе: CI при деплое **не перезаливает** `public/images/products/` в каждый релиз. Они хранятся в `shared/` и подключаются symlink (см. ниже). Это не «жалко места», а защита от потери файлов при `rsync --delete` и от дублирования в каждой папке `releases/`.

**Обновить картинки на проде** (если добавила новые в git):

```powershell
# С локальной машины — в shared на сервере (не в releases/)
scp backend/public/images/products/* deploy@<IP>:/var/www/h-decor/shared/backend/public/images/products/
```

На сервере в релизах `public/images/products` — symlink на эту же папку `shared/`, поэтому новые файлы видны сразу. Upload + Release для картинок **не нужен**.

---

## Переменные окружения (backend)

Файл: `backend/.env` (образец — `backend/.env.example`).

| Переменная | Обязательна | Dev | Prod |
|------------|-------------|-----|------|
| `NODE_ENV` | нет | `development` | `production` |
| `PORT` | нет | `3000` | `3001` |
| `SECRET` | **да** | случайная строка | случайная строка |
| `SESSION_SECRET` | **да** | другая случайная строка (не копировать из `SECRET`) | другая случайная строка (не копировать из `SECRET`) |
| `DB_URL` | в prod — да | `mongodb://127.0.0.1:27017` | `mongodb://127.0.0.1:27017` |
| `DB_NAME` | в prod — да | `home-decor` | `home-decor` |
| `COOKIE_SECURE` | нет | `false` | `true` (только после HTTPS) |
| `CORS_ORIGINS` | нет | `http://localhost:4200` | `https://h-decor.shop,https://www.h-decor.shop` |

`SECRET` — подпись JWT (login, refresh). `SESSION_SECRET` — подпись cookie сессии (гостевая корзина). Разные переменные — на случай утечки одного из секретов.

---

## Архитектура прода

Сервер VPS (FirstVDS), на том же хосте работает другой проект (ITStorm на порту **3000**). HOME-DECOR использует порт **3001**.

```
Посетитель → DNS (h-decor.shop) → nginx :443
                                    ├─ /           → /var/www/h-decor/current/frontend  (Angular)
                                    ├─ /api/       → 127.0.0.1:3001  (PM2 h-decor-api)
                                    └─ /images/    → 127.0.0.1:3001
                                                          ↓
                                                    MongoDB (база home-decor)
```

### Каталоги на сервере

```
/var/www/h-decor/
├── releases/
│   ├── YYYYMMDD-HHMMSS-<sha>/   # каждый upload
│   │   ├── frontend/
│   │   └── backend/
│   └── .latest                  # имя последнего upload
├── current → releases/...       # активный релиз (symlink)
└── shared/
    ├── backend/.env             # секреты (не перезаписываются при деплое)
    ├── backend/public/images/products/   # картинки товаров
    └── ecosystem.config.js      # конфиг PM2
```

- PM2-процесс `h-decor-api` запущен под пользователем **`deploy`**
- В каждом релизе `.env` и `public/images/products` — **symlink** на `shared/` (при Upload не перезаписываются из git)

---

## CI/CD (GitHub Actions)

Два workflow — **заливка** и **публикация** разделены намеренно.

### Upload release (`upload.yml`)

- **Когда:** каждый push в ветку `main`
- **Что делает:** собирает Angular, rsync на сервер в `releases/<имя>/`, `npm ci --omit=dev`, обновляет `.latest`
- **Сайт не меняет** — `current` остаётся на старом релизе

Имя релиза: `YYYYMMDD-HHMMSS-<7 символов commit sha>`. Дата/время — **UTC** (часовой пояс GitHub runner).

> Angular 19: prod-сборка лежит в `frontend/dist/frontend/browser/`, не в `dist/frontend/`.

### Release (`release.yml`)

- **Когда:** вручную — GitHub → **Actions** → **Release** → **Run workflow**
- **Поле release:** оставить пустым → возьмётся `.latest`; или указать имя папки из `releases/`
- **Что делает:** `migrate-mongo up` → переключение symlink `current` → `pm2 restart` → health-check (до 15 попыток × 2 сек) → при ошибке **автооткат** symlink

### GitHub Secrets (Repository secrets)

| Secret | Значение |
|--------|----------|
| `SSH_HOST` | IP сервера, например `157.22.204.126` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | приватный ключ CI (ed25519), целиком с `BEGIN`/`END` |
| `SSH_KNOWN_HOSTS` | вывод `ssh-keyscan -H <IP>` **с Linux-сервера** (на Windows keyscan часто не работает) |

### Обычный цикл деплоя

1. `git push origin main`
2. Дождаться зелёного **Upload release**
3. **Actions → Release → Run workflow** (release пустой)
4. Проверить https://h-decor.shop

---

## Ручной откат (без GitHub)

```bash
su - deploy
ls /var/www/h-decor/releases/
readlink -f /var/www/h-decor/current

# Подставь имя нужной папки из releases/
PREV="/var/www/h-decor/releases/YYYYMMDD-HHMMSS-abc1234"
ln -sfn "${PREV}" /var/www/h-decor/current.tmp
mv -T /var/www/h-decor/current.tmp /var/www/h-decor/current
pm2 restart h-decor-api
curl -s http://127.0.0.1:3001/api/categories | head -c 100
```

---

## Ручной деплой (без GitHub Actions)

Если CI недоступен — повторить логику `upload.yml` + `release.yml` вручную.

```powershell
# 1. Сборка frontend (Windows)
cd frontend
npm ci
npx ng build --configuration production
```

```bash
# 2. На сервере — создать релиз (под deploy или root)
RELEASE="manual-$(date +%Y%m%d-%H%M%S)"
mkdir -p /var/www/h-decor/releases/${RELEASE}/frontend
mkdir -p /var/www/h-decor/releases/${RELEASE}/backend
```

```powershell
# 3. Заливка с Windows (подставь IP и имя RELEASE)
scp -r dist/frontend/browser/* deploy@<IP>:/var/www/h-decor/releases/<RELEASE>/frontend/
scp -r backend/app.js backend/src backend/migrations backend/package.json backend/package-lock.json backend/migrate-mongo-config.js deploy@<IP>:/var/www/h-decor/releases/<RELEASE>/backend/
```

```bash
# 4. На сервере — symlink shared, зависимости, публикация
BACKEND="/var/www/h-decor/releases/${RELEASE}/backend"
ln -sf /var/www/h-decor/shared/backend/.env "${BACKEND}/.env"
mkdir -p "${BACKEND}/public/images"
ln -sf /var/www/h-decor/shared/backend/public/images/products "${BACKEND}/public/images/products"
cd "${BACKEND}" && npm ci --omit=dev
cd "${BACKEND}" && npx migrate-mongo up
ln -sfn "/var/www/h-decor/releases/${RELEASE}" /var/www/h-decor/current.tmp
mv -T /var/www/h-decor/current.tmp /var/www/h-decor/current
su - deploy -c "pm2 restart h-decor-api"
```

---

## Эксплуатация

```bash
# Статус API (под deploy)
su - deploy -c "pm2 list"
su - deploy -c "pm2 logs h-decor-api --lines 50"

# nginx
sudo nginx -t
sudo systemctl reload nginx

# Продление SSL (Certbot)
sudo certbot renew --dry-run

# Дамп базы
mongodump --db home-decor --out /tmp/home-decor-backup
```

---

## Типичные проблемы

| Симптом | Причина | Решение |
|---------|---------|---------|
| `Host key verification failed` в Actions | Пустой/неверный `SSH_KNOWN_HOSTS` | `ssh-keyscan -H <IP>` **на Linux-сервере**, вставить в secret |
| `rsync: command not found` | rsync не установлен на VPS | `sudo apt install -y rsync` |
| `index.html` not found после scp | Залит `dist/frontend/` вместо `browser/` | Заливать `dist/frontend/browser/*` |
| Release падает сразу после PM2 restart | Health-check раньше старта API | В `release.yml` уже есть retry; API стартует после MongoDB (~2–5 сек) |
| Login не работает на HTTPS | `COOKIE_SECURE=false` или CORS | В prod `.env`: `COOKIE_SECURE=true`, `CORS_ORIGINS=https://h-decor.shop,https://www.h-decor.shop` |
| Картинки не грузятся | Нет файлов или symlink | Проверить `shared/backend/public/images/products/` |
| Новые картинки из git не на проде | CI исключает `products/` из rsync | Скопировать в `shared/backend/public/images/products/` вручную (см. раздел «Картинки товаров») |
| Certbot ошибка локали | Неверная locale | `export LC_ALL=C.UTF-8 LANG=C.UTF-8` перед certbot |
| Certbot идёт не на тот IP | AAAA-запись в DNS | Удалить AAAA, оставить только A → IP сервера |
| nginx 403 на статику | Права каталогов | `chmod 755` на папки, `644` на файлы; nginx читает от `www-data` |

---

## Prod-сборка frontend (локальная проверка)

```bash
cd frontend
npm ci
npx ng build --configuration production
```

Артефакты: `frontend/dist/frontend/browser/`

Убедиться, что в сборке нет `localhost:3000` (должен быть `h-decor.shop`):

```bash
# Linux / Git Bash
grep -r "localhost:3000" dist/frontend/browser/ || echo "OK"
```

```powershell
# PowerShell
Select-String -Path dist\frontend\browser\* -Pattern "localhost:3000" -Recurse
# нет вывода — OK
```

---

## Маршруты приложения

| URL | Страница |
|-----|----------|
| `/` | Главная |
| `/catalog` | Каталог |
| `/product/:url` | Карточка товара |
| `/cart` | Корзина |
| `/order` | Оформление заказа |
| `/login`, `/signup` | Авторизация |
| `/profile`, `/favorite`, `/orders` | Личный кабинет |
| `/privacy`, `/terms`, `/consent` | Юридические страницы (демо) |

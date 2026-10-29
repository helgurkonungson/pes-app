# Chompbook Pro: настройка сервисов (ADR-037)

Что где живёт:

| Часть | Где | Секреты |
|---|---|---|
| Покупка подписки | Google Play Billing (приложение `online.chompbook.app`) | — |
| Проверка подписки | RevenueCat (проект «Chompbook») | public SDK key → GitHub; secret API key → Cloudflare |
| Сервер Chompbook AI | Cloudflare Worker `chompbook-api` (папка `api/`), домен `api.chompbook.online`, база D1 `chompbook-api` | `OPENROUTER_KEY`, `REVENUECAT_SECRET` — только в Cloudflare |
| Модель AI | OpenRouter, ключ `chompbook-pro` с лимитом расходов | — |

Цены (решение Олега, 29.10.2026): $4,99 в месяц или $39,99 в год, 7 дней бесплатно для новых подписчиков; для стран СНГ — около $2,99 / $24,99 (задаётся по странам в Play Console, см. шаг 5 ниже). Лимит честного использования — `DAILY_TOKENS` = 600 000 токенов в сутки (UTC) ≈ 10 AI-уроков по 15 минут.

Порядок: сначала шаги 1–4 (сервисы) и переменная `REVENUECAT_ANDROID_KEY`, затем сборка с Pro во «Внутреннее тестирование» Google Play (общий порядок публикации — `docs/STORE_PUBLISHING.md`, ответы анкет — `docs/STORE_FORMS.md`), затем шаги 5–8 здесь.

## 1. OpenRouter

1. openrouter.ai → Settings → **Credits**: пополните баланс (на старте $20–30).
2. Settings → **API Keys** → Create key, имя `chompbook-pro`, **Credit limit** — например $20 (потом поднимете). Скопируйте ключ (`sk-or-v1-…`) — он понадобится в шаге 3. Никуда больше его не вставляйте и не присылайте.
3. Settings → **Privacy**: выключите «Enable training and logging» / провайдеров, которые могут обучаться на запросах, и не включайте логирование запросов. Так обещает политика конфиденциальности.
4. Модель по умолчанию — `anthropic/claude-haiku-5.5`, запасная — `deepseek/deepseek-v4.1-flash-1017` (`api/wrangler.jsonc`, переменные `MODEL` и `FALLBACK_MODELS`; их можно менять в панели Cloudflare без обновления приложения). Если модель переименуют — поменяйте там.

## 2. Cloudflare: база D1

1. dash.cloudflare.com → **Storage & Databases → D1 → Create**, имя `chompbook-api`, регион — ближе к пользователям (автоматически).
2. Скопируйте **Database ID** и пришлите Claude (или впишите сами в `api/wrangler.jsonc` вместо `00000000-0000-0000-0000-000000000000` и запушьте). Таблицы сервер создаёт сам при первом запросе.

## 3. Cloudflare: Worker `chompbook-api`

1. **Workers & Pages → Create → Import a repository** → `helgurkonungson/pes-app`, ветка `main`, **Root directory: `api`**. Команды сборки оставьте по умолчанию (`npx wrangler deploy`). Имя Worker'а — `chompbook-api` (из `api/wrangler.jsonc`). В настройках сборки (Settings → Build → Build watch paths) укажите `api/*`, чтобы сервер пересобирался только при изменениях в `api/`.
2. После первого деплоя: Worker → **Settings → Variables and Secrets → Add**:
   - `OPENROUTER_KEY` (Secret) — ключ из шага 1;
   - `REVENUECAT_SECRET` (Secret) — secret API key RevenueCat из шага 4.
3. Домен: `api.chompbook.online` подключится сам (в `wrangler.jsonc` `custom_domain: true`), если зона `chompbook.online` в этом же аккаунте Cloudflare. Проверка: https://api.chompbook.online/health → `{"ok":true,"service":"chompbook-ai"}`.
4. Очистка данных идёт по расписанию (cron `17 3 * * *`): счётчики старше 90 дней, сохранённые ответы RevenueCat старше 30 дней. Журналы запросов выключены (`invocation_logs: false`) — не включайте их: политика обещает, что их нет.

## 4. RevenueCat: проект и ключи

1. app.revenuecat.com → **Create project** «Chompbook» → **Apps & providers → Add app → Google Play Store**, package name `online.chompbook.app`.
2. **API keys**: public SDK key для Android (`goog_…`) → GitHub → репозиторий → Settings → Secrets and variables → Actions → **Variables** → `REVENUECAT_ANDROID_KEY`. Он публичный по своей природе и попадает в приложение.
3. Там же создайте **Secret API key** (v1, полный доступ к Customers на чтение) → в Cloudflare как `REVENUECAT_SECRET` (шаг 3.2). Никуда больше.

## 5. Подписки в Play Console (Monetize with Play → Products → Subscriptions)

Раздел открывается после загрузки сборки с биллингом (любой AAB, начиная с версии с Pro).

1. **Create subscription**: Product ID `pro_monthly`, имя «Chompbook Pro». **Add base plan**: ID `monthly`, Auto-renewing, Billing period **1 month**, Grace period 7 days; **Set prices**: $4.99 USD → Google пересчитает в местные валюты. Затем вручную для стран СНГ (≈ $2.99): Armenia, Azerbaijan, Georgia, Kazakhstan, Kyrgyzstan, Moldova, Tajikistan, Uzbekistan — Console покажет, где подписки доступны. **Activate**.
2. В base plan `monthly` → **Add offer**: ID `trial-7d`, Eligibility — **New customer acquisition: Never had this subscription**, Phase — **Free trial, 7 days**. Activate.
3. Второй продукт: `pro_annual`, base plan `annual`, Billing period **1 year**, $39.99 (СНГ ≈ $24.99), то же предложение `trial-7d`.
4. Benefits (видны в Play): «AI lessons from any of your materials», «Feedback on your written answers», «No keys or AI accounts», «About 10 AI lessons a day» (и по-русски).

## 6. RevenueCat ↔ Google Play (сервисный аккаунт)

Нужен, чтобы RevenueCat проверял покупки в Google Play.

1. console.cloud.google.com → создайте проект (или используйте существующий) → **APIs & Services → Enable APIs**: «Google Play Android Developer API», «Google Play Developer Reporting API» и «Cloud Pub/Sub API».
2. **IAM & Admin → Service Accounts → Create**: `revenuecat`; роли **Pub/Sub Admin** и **Monitoring Viewer** (без Pub/Sub Admin кнопка Connect to Google в шаге 6.5 падает с «do not have permission to add Google Play as a publisher»). Откройте его → **Keys → Add key → JSON** — скачается файл.
3. Play Console → **Users and permissions → Invite new users** → email сервисного аккаунта, вкладка **Account permissions**: «View app information and download bulk reports (read-only)», «View financial data, orders, and cancellation survey responses», «Manage orders and subscriptions». Invite.
4. RevenueCat → приложение Google Play → **Service Account credentials JSON** → загрузите файл. Проверка может занять до 36 часов — это нормально.
5. (Рекомендуется) **Real-time developer notifications**: в RevenueCat у приложения есть кнопка Connect to Google — она создаст тему Pub/Sub; скопируйте её имя в Play Console → **Monetize with Play → Monetization setup → Real-time developer notifications** и нажмите «Send test notification».

## 7. Подписки в RevenueCat

После того как подписки созданы в Play Console (шаг 5):

1. **Product catalog → Products → Import** из Google Play: `pro_monthly:monthly` и `pro_annual:annual`.
2. **Entitlements → New**: идентификатор строго `pro`; прикрепите оба продукта.
3. **Offerings**: offering `default` (сделайте его Current) с пакетами `$rc_monthly` → `pro_monthly:monthly` и `$rc_annual` → `pro_annual:annual`. Приложение показывает годовой тариф первым и само считает экономию.

## 8. Проверка

1. В Play Console добавьте свой Gmail в **License testing** (тестовые покупки бесплатны, месячная подписка продлевается каждые 5 минут, пробный период — 3 минуты).
2. Установите версию из внутреннего тестирования → Настройки → Chompbook Pro: видны оба тарифа, «7 дней бесплатно», текст о продлении → оформить → «У вас Chompbook Pro», «AI на сегодня: осталось около 10 уроков».
3. Создайте навык со своим текстом → урок пишет Chompbook AI. В RevenueCat → Customers появится анонимный покупатель.
4. Отмените подписку в Google Play → после окончания периода урок соберётся без AI, а приложение предложит продлить Pro.

## Если что-то не так

| Симптом | Причина |
|---|---|
| «Не удалось загрузить тарифы» | нет offering `default` или продукты не привязаны; сервисный аккаунт ещё не активен (до 36 ч); приложение установлено не из Google Play |
| Pro оплачен, но «Chompbook Pro не активна» | entitlement называется не `pro`; неверный `REVENUECAT_SECRET` |
| Уроки с Pro падают с «временно недоступен» | нет `OPENROUTER_KEY`, исчерпан лимит ключа OpenRouter или модель переименована |
| В приложении нет раздела покупки | сборка без переменной `REVENUECAT_ANDROID_KEY` |

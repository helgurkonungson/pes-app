# Ответы для анкет Google Play Console и App Store Connect

Подготовлено 29.10.2026 по коду версии 0.18.0 (жалобы и журнал ошибок уходят на chompbook.online/api/report) и разрешениям APK 0.17.0. Если поведение приложения изменится (аналитика, подписка, новые данные в отчётах), ответы нужно пересмотреть. Я не юрист: Data safety и возрастные анкеты — это юридические заявления разработчика.

## Что приложение реально передаёт с телефона (основа всех ответов)

| Что | Куда | Когда | Хранится у нас? |
|---|---|---|---|
| Отрывки материалов пользователя, название и цель навыка, ответы на вопросы | В AI-сервис, выбранный пользователем (Gemini, OpenRouter, Groq, Mistral, Claude, ChatGPT, Алиса AI, Qwen, NVIDIA, свой сервер) — напрямую, с ключом пользователя | Только если пользователь подключил AI и запускает урок с AI | Нет |
| Код OAuth OpenRouter | Страница `chompbook.online/oauth/openrouter/` передаёт его в приложение | Однократно при входе через OpenRouter | Нет (страница ничего не сохраняет) |
| Вход Google (scope `cloud-platform`) | Google, чтобы создать ключ Gemini в аккаунте пользователя | Однократно, по согласию | Нет (токен, e-mail и имя не сохраняются) |
| Жалоба на урок (причина, комментарий, текст урока, название, сервис и модель AI, версия) | Сервер chompbook.online/api/report (Cloudflare Worker → база D1, уведомление в Telegram) | Когда пользователь отправляет жалобу; без связи — повтор позже | Да, в базе Cloudflare вместе со страной запроса; срок — по политике |
| Журнал ошибок (сообщения об ошибках, версия, платформа, язык, модель телефона) | Тот же сервер | По кнопке «Отправить разработчику» или автоматически, если пользователь включил (по умолчанию выключено) | Да |
| Веб-страница, добавленная как источник | Сайт этой страницы | По действию пользователя | Нет |
| Проверка обновлений (сборка с GitHub) | api.github.com | Раз в день | Нет. **В сборке для Play её быть не должно** — см. to-do |

Не передаётся: имя, возрастная группа, прогресс, идентификаторы устройства. IP-адрес сервер использует на мгновение для ограничения частоты запросов и не хранит. Рекламы, аналитики и SDK для отчётов о сбоях нет. Разрешения APK 0.17.0: INTERNET, POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED, WAKE_LOCK, VIBRATE, USE_BIOMETRIC / USE_FINGERPRINT (защищённое хранилище ключей), USE_CREDENTIALS (вход Google). `AD_ID` нет, точных будильников нет.

---

## Google Play Console

### Основные сведения (Main store listing, App details)
- **Название приложения:** `Chompbook` (по локалям — заголовок из `store/listing/<lang>.md`; для ru — «Грызи: учись по кусочку»).
- **Тип:** приложение (App), **бесплатное**.
- **Категория:** Education (Образование). **Теги:** Education, Productivity, Books & Reference — выбрать из предложенных.
- **E-mail для связи:** support@chompbook.online. **Сайт:** https://chompbook.online. **Телефон:** не обязателен.
- **Политика конфиденциальности:** https://chompbook.online/privacy/
- **Тексты и графика:** `store/listing/*.md` и архив `chompbook-store-google-play.zip`. Внутри: значок 512×512, картинка 1024×500 на 9 языках, по 6 скриншотов телефона 1080×1920 и 10-дюймового планшета 1600×2560 на каждом языке. Для 7-дюймовых планшетов подходят те же 10-дюймовые.

### App content (Контент приложения)
| Раздел | Ответ |
|---|---|
| **Privacy policy** | https://chompbook.online/privacy/ |
| **App access** | «All functionality is available without special access». Входа в приложение нет. Для проверяющих в комментарии: «No login. AI features are optional and use the user's own key; everything else (built-in courses, lessons from own files) works without AI. Free courses: Skillsets → Free courses.» |
| **Ads** | No, my app does not contain ads |
| **Content rating** | Анкета IARC — см. ниже |
| **Target audience and content** | Возрастные группы **13–15, 16–17, 18 и старше**. «Может ли приложение непреднамеренно привлекать детей?» → **No**: детских персонажей, игр и маркетинга для детей нет. Магазин может спросить про мини-игру с червяком: это экран ожидания, а не детский контент |
| **News app** | No |
| **COVID-19 contact tracing / status** | No |
| **Data safety** | См. ниже |
| **Government apps** | No |
| **Financial features** | «My app doesn't provide any financial features». Курс по финансовой грамотности — обучение, а не финансовая услуга |
| **Health apps** | No health features |
| **Actor / celebrity, gambling, VPN** | Не применимо |
| **Generative AI** (если Play спросит в анкетах) | Приложение генерирует учебный текст с помощью сторонних AI-моделей. Пожаловаться можно прямо в уроке (флажок). Фильтры безопасности — на стороне поставщиков моделей |

### Content rating — анкета IARC
- **Категория:** *Reference, News, or Educational*.
- Насилие, кровь, страх — **No**. Сексуальный контент и нагота — **No**. Ненормативная лексика — **No**. Наркотики, алкоголь, табак — **No**. Азартные игры и симуляция казино — **No**.
- **Взаимодействие пользователей / обмен контентом между пользователями** — **No**: пользователи ничего не публикуют друг для друга.
- **Передаёт местоположение** — **No**. **Цифровые покупки** — **No** (пока нет подписки Pro).
- **Неограниченный доступ в интернет** — **No**: встроенный браузер открывает только страницы ключей AI-сервисов. Источники-ссылки скачиваются как текст.
- **Контент, созданный AI** (если есть такой вопрос) — **Yes**, учебные тексты. Есть жалоба в приложении.
- Ожидаемый результат: Everyone / PEGI 3 / USK 0, возможно с пометкой о контенте, созданном AI. Если анкета даст больше — оставить её результат.

### Data safety
Логика: «собранными» Google считает данные, которые приложение передаёт за пределы телефона. Отрывки материалов уходят в AI-сервис **по действию пользователя**, и экран согласия заранее об этом предупреждает. Поэтому это **сбор (collected)**, но **не передача третьим лицам (not shared)**: Google делает исключение для передачи, которую пользователь инициирует сам и ожидает. Самый осторожный вариант — отметить «Shared» тоже. Решение за вами и юристом.

| Вопрос | Ответ |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS). Исключение — адрес своего сервера по http://, который пользователь вводит сам, например компьютер в домашней сети |
| Do you provide a way for users to request that their data is deleted? | **Yes**: Настройки → «Удалить все данные». Аккаунтов нет. Жалобу можно удалить письмом на privacy@chompbook.online |
| **App activity → Other user-generated content** | Collected: **Yes** — (1) отрывки материалов для AI-сервиса, выбранного пользователем; (2) жалобы на уроки, которые хранятся на нашем сервере. Shared: **No** (передача в AI инициирована пользователем; Cloudflare — наш поставщик услуг). Processed ephemerally: **No** (жалобы хранятся). Required or optional: **Optional**. Purpose: **App functionality** |
| **App activity → Other actions** (ответы на вопросы, отправляемые на проверку AI) | То же, что строка выше. Можно отметить ту же категорию, если анкета разделяет |
| Personal info (имя, e-mail, адрес, возраст) | **Not collected** — имя и возрастная группа остаются на телефоне. E-mail в жалобе пользователь отправляет сам из своей почты, приложение его не передаёт |
| Location, Financial info, Health, Messages, Photos/Videos, Audio, Files and docs, Calendar, Contacts, Web browsing | **Not collected**. Файлы читаются на телефоне, наружу уходит только текст отрывков — это «User-generated content» выше |
| **App info and performance → Crash logs, Diagnostics** | Collected: **Yes** (с 0.18 — журнал ошибок по кнопке или автоматически, если пользователь включил). Shared: **No** (Cloudflare обрабатывает от нашего имени — это поставщик услуг, не «третья сторона» в смысле Play). Optional. Purpose: **App functionality** (исправление ошибок) |
| Device or other IDs | **Not collected** |

Модель телефона в отчёте об ошибке — это диагностические данные (уже учтены в Crash logs / Diagnostics), не идентификатор устройства.

### Advertising ID
«Does your app use advertising ID?» → **No** (в APK 0.17.0 нет `AD_ID`).

### Цены и распространение
- Free. Страны — все доступные. Gemini в некоторых странах недоступен, но приложение там работает с другими сервисами и без AI.
- «Contains ads» — No. «Designed for Families» — **не участвовать**.

### Сведения о разработчике (DSA, ЕС)
Play попросит указать статус «трейдер / не трейдер» по закону ЕС о цифровых услугах (DSA). Трейдер — тот, кто зарабатывает на приложении. Для трейдера адрес, телефон и e-mail показываются публично. Пока приложение бесплатное и без монетизации, можно указать «не трейдер». С подпиской Pro — трейдер. Аккаунт организации (HW GROUP (CYPRUS) LIMITED) показывает данные компании.

---

## App Store Connect (когда будет iOS-сборка)

| Раздел | Ответ |
|---|---|
| **Категория** | Primary: Education. Secondary: Productivity |
| **Цена** | Free |
| **App Privacy («этикетки»)** | Осторожный вариант: **User Content → Other User Content**, used for **App Functionality**, **Not linked to the user's identity**, **Not used for tracking**. Альтернатива — «Data Not Collected»: Apple не считает сбором передачу в сервис, который пользователь подключил сам. Решение за юристом. Всё остальное — Not collected |
| **Tracking (ATT)** | Нет, приложение не отслеживает пользователей |
| **Возрастной рейтинг** | Медицинский, сексуальный, насильственный контент и азартные игры — None. Unrestricted Web Access — **No** (только фиксированные страницы ключей). User-generated content / обмен между пользователями — No. Генерация контента AI — указать, если есть такой вопрос. Ожидается **4+ или 9+**, но из-за правил AI-сервисов приложение для 13+ — **не** отмечать «Made for Kids» |
| **Export compliance** | Используется только стандартное шифрование HTTPS → освобождено. В `Info.plist`: `ITSAppUsesNonExemptEncryption = NO` |
| **Sign in with Apple (4.8)** | Не нужен: вход Google не создаёт аккаунт в приложении. Объяснить в заметках для ревьюера |
| **5.1.2(i)** — передача данных стороннему AI | Явное согласие на экране подключения каждого сервиса |
| **1.2** — жалобы на контент | Флажок «Пожаловаться на урок» на страницах, созданных AI |
| **Заметки для ревьюера** | «No account needed. Built-in courses (Skillsets → Free courses) work without AI. AI is optional and uses the user's own key from the chosen provider; the consent screen explains what is sent. Report flag in every AI lesson.» |
| **Support URL / Marketing URL / Privacy URL** | https://chompbook.online · https://chompbook.online · https://chompbook.online/privacy/ |
| **Скриншоты** | Архив `chompbook-store-app-store.zip`: iPhone 6.9" (1320×2868) и iPad 13" (2064×2752), по 6 на каждом языке. Белорусского в App Store нет — используйте ru или en |

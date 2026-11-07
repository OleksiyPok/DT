# Структура проекта

```
index.html
README.md
STRUCTURE.md
config/
  config.json              ЕДИНСТВЕННОЕ место настроек по умолчанию
docs/
  readme/                  README.<lang>.md (13 языков) и img/ (картинки для README)
  help/                    help.<lang>.html и help/img/
assets/
  icons/                   icon_<APP>_<size>.png
src/
  i18n/                    <lang>.json: { "ui": {...}, "languages": {...} }
  css/
    main.css               список подключения файлов (порядок важен)
    base.css ... themes.css
  js/
    theme-boot.js          обычный скрипт: тема до первой отрисовки
    main.js                точка входа: создаёт модули и связывает их
    core/                  основа: config, event-bus, event-types, i18n, presets, state, theme-registry, utils
    features/              возможности: app, ui (+ ui-elements, ui-labels, ui-selects, ui-buttons, ui-presets, ui-mirrors, theme, help, modals), translate, speech, clipboard, developer, scroll-steps, main-snap, live-select, textarea-sync, mymemory-usage
```

## Правила

- Имена файлов: kebab-case.
- Настройки по умолчанию: только `config/config.json`. В коде значений по умолчанию нет. Единственное исключение: имя темы по умолчанию в `theme-boot.js` (тема ставится до загрузки config.json); значения должны совпадать.
- Версия приложения: только `APP_VERSION` в `core/config.js`; меняется при каждом изменении.
- Ключи текстов в `src/i18n/*.json`: `<имя>Label` (подписи), `<имя>Title` (подсказки и заголовки), `<имя>Placeholder`; во всех языках набор ключей одинаковый. Недостающий текст берётся из английского.
- Иконки кнопок и режимов темы: символы в SVG-спрайте в `index.html`, на странице через `<use href="#i-...">`.
- Нет inline-обработчиков (`onclick`) в HTML: все события вешает код из `features/`.
- Ключи localStorage: `DT-settings` и другие `<APP>-...`; все объявлены в `core/config.js`.
- Режим developer (`developerMode`) задаётся только в `config/config.json`; в сохранённых настройках его нет.
- Клавиши: F1 открывает справку; Esc закрывает открытое окно.
- Иконки: `assets/icons/icon_<APP>_<ширина>x<высота>.png`.
- JS: ES-модули, без глобальных переменных. Модули создаются фабриками `createXxx({...})` в `main.js` и общаются через шину событий (`core/event-bus.js`, имена событий в `core/event-types.js`). Настройки только в `core/state.js`; то, что сейчас показано на странице (конфигурации, редактируемые вкладки), хранится в `view` контекста `ui-elements.js`.
- `core/` не знает о `features/`.
- Файлы, общие для всех приложений (`help.js`, `modals.js`, `developer.js`, `theme.js`, `live-select.js`, `ui-mirrors.js`, `scroll-steps.js`, `core/event-bus.js`, `core/i18n.js`, `core/theme-registry.js`, `themes.css`, а также `base.css`, `help.css`, `icons.css`, `developer.css`, `live-select.css`, `modals.css`), одинаковы побайтно: их меняют сразу во всех приложениях.
- Новый язык: файл `src/i18n/<lang>.json`, справка `docs/help/help.<lang>.html`, код языка в `core/config.js` (`LANG_CODES`) и в `index.html` (списки языков).
- Только для переводчика: `service.css` (строки сервиса и разработчика, счётчик MyMemory; идёт после `developer.css` и переопределяет его), `text-buttons.css` (иконки кнопок текстовых блоков), `text-fields.css`.
- Порядок CSS задаёт `src/css/main.css`: позже стоящий файл переопределяет раньше стоящий.
- Приложение нужно открывать по HTTP (модули и `fetch` не работают с `file://`).

## Карта модулей

| Файл                                                      | За что отвечает                                                             |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| `core/config.js`                                          | константы, версия, кнопки конфигураций, загрузка `config/config.json`       |
| `core/event-bus.js`, `core/event-types.js`                | шина событий и имена событий                                                |
| `core/state.js`                                           | настройки: проверка, значения по умолчанию, сохранение в localStorage       |
| `core/presets.js`                                         | проверка данных конфигураций (чистые функции)                               |
| `core/i18n.js`                                            | загрузка и выдача текстов интерфейса                                        |
| `core/utils.js`                                           | отладочный вывод                                                            |
| `features/app.js`                                         | запуск, события настроек, клавиши                                           |
| `features/ui.js`                                          | страница: связывает ui-модули, обработчики событий                          |
| `features/ui-elements.js`                                 | элементы страницы и общее состояние ui-модулей                              |
| `features/ui-labels.js`                                   | подстановка текстов интерфейса                                              |
| `features/ui-selects.js`                                  | списки языков                                                               |
| `features/ui-presets.js`, `features/ui-buttons.js`        | конфигурации и видимость кнопок                                             |
| `features/ui-mirrors.js`                                  | копии блоков (в DT не используются: нет блоков с копиями)                   |
| `features/theme.js`, `core/theme-registry.js`             | темы и режимы                                                               |
| `features/translate.js`, `features/translate-services.js` | перевод и сервисы                                                           |
| `features/speech.js`, `features/clipboard.js`             | голос, буфер обмена                                                         |
| `features/modals.js`, `features/help.js`                  | окна и справка (язык справки выбирается в самом окне)                       |
| `features/developer.js`                                   | секретный жест на «Сброс настроек»                                          |
| `features/mymemory-usage.js`                              | счётчик запросов и символов MyMemory за день (строка в панели developer)    |
| `features/scroll-steps.js`, `features/main-snap.js`       | ступеньки прокрутки: окно настроек и главный экран                          |
| `features/live-select.js`                                 | «живые» списки темы и режима                                                |
| `features/textarea-sync.js`                               | связанная высота трёх текстовых полей (своя ручка растягивания в углу поля) |

## Запуск, настройки и службы перевода (раньше были в README.md)

- Сборка не нужна. Папку отдают по HTTP(S) и открывают `index.html`, например: `python -m http.server 8000`, затем <http://localhost:8000>. Окно справки загружает текст через `fetch`, поэтому из `file://` оно не работает.
- Голосовой ввод требует браузер с распознаванием речи (Chrome, Edge) и безопасный контекст (HTTPS или `localhost`).
- Настройки по умолчанию (тема, языки конфигураций, видимые кнопки и т. д.) лежат только в `config/config.json`. Они используются при первом запуске и кнопкой «Reset defaults». Каждая конфигурация перечисляет свои кнопки в `buttons` (секции `source`, `target1`, `target2`); `false` скрывает кнопку по умолчанию.
- Служба перевода по умолчанию: [MyMemory](https://mymemory.translated.net/) (бесплатно, с дневным лимитом). В режиме developer также доступны LibreTranslate и Google Cloud Translate; для Google нужен свой ключ API в `src/js/core/config.js` (он виден в коде страницы, ограничьте его своим сайтом в Google Cloud). Панель developer показывает, сколько символов MyMemory перевёл за день.
- Автор: Oleksii Pokormiakho.

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
    main.js                точка входа
    core/                  основа: config, defaults, state, dom, i18n, storage, theme-registry
    features/              возможности, по одному файлу на задачу
```

## Правила

- Имена файлов: kebab-case.
- Настройки по умолчанию: только `config/config.json`. В коде значений по умолчанию нет. Единственное исключение: имя темы по умолчанию в `theme-boot.js` (тема ставится до загрузки config.json); значения должны совпадать.
- Версия приложения: только `APP_VERSION` в `core/config.js`; меняется при каждом изменении.
- Ключи текстов в `src/i18n/*.json`: `<имя>Label` (подписи), `<имя>Title` (подсказки и заголовки), `<имя>Placeholder`; во всех языках набор ключей одинаковый. Недостающий текст берётся из английского.
- Иконки кнопок и режимов темы: символы в SVG-спрайте в `index.html`, на странице через `<use href="#i-...">`.
- Нет inline-обработчиков (`onclick`) в HTML: все события вешает код из `features/`.
- Ключи localStorage: `DT-settings` и другие `<APP>-...`; все объявлены в `core/config.js`.
- Иконки: `assets/icons/icon_<APP>_<ширина>x<высота>.png`.
- JS: ES-модули, без глобальных переменных. Общее состояние только в `core/state.js`.
- `core/` не знает о `features/`, кроме `core/storage.js` (читает тему из `features/theme.js`).
- Новый язык: файл `src/i18n/<lang>.json`, справка `docs/help/help.<lang>.html`, код языка в `core/config.js` (`LANG_CODES`) и в `index.html` (списки языков).
- Порядок CSS задаёт `src/css/main.css`: позже стоящий файл переопределяет раньше стоящий.
- Приложение нужно открывать по HTTP (модули и `fetch` не работают с `file://`).

## Карта модулей

| Файл                                                      | За что отвечает                                                             |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| `core/config.js`                                          | константы, пути, версия                                                     |
| `core/defaults.js`                                        | загрузка настроек по умолчанию из `config/config.json`                      |
| `core/state.js`                                           | общее состояние конфигураций                                                |
| `core/i18n.js`                                            | загрузка и выдача текстов интерфейса, окна с сообщениями                    |
| `core/storage.js`                                         | чтение и запись настроек в localStorage                                     |
| `features/theme.js`, `core/theme-registry.js`             | темы и режимы                                                               |
| `features/ui.js`                                          | подстановка текстов интерфейса на страницу                                  |
| `features/settings.js`                                    | применение настроек, сброс                                                  |
| `features/presets.js`, `features/buttons.js`              | конфигурации и видимость кнопок                                             |
| `features/translate.js`, `features/translate-services.js` | перевод и сервисы                                                           |
| `features/speech.js`, `features/clipboard.js`             | голос, буфер обмена                                                         |
| `features/modals.js`, `features/help.js`                  | окна и справка (язык справки выбирается в самом окне)                       |
| `features/developer.js`                                   | панель developer и выбор сервиса (настройка и секретный жест)               |
| `features/mymemory-usage.js`                              | счётчик запросов и символов MyMemory за день (строка в панели developer)    |
| `features/scroll-steps.js`, `features/live-select.js`     | прокрутка по шагам, «живые» списки                                          |
| `features/textarea-sync.js`                               | связанная высота трёх текстовых полей (своя ручка растягивания в углу поля) |
| `features/events.js`                                      | обработчики событий                                                         |

## Запуск, настройки и службы перевода (раньше были в README.md)

- Сборка не нужна. Папку отдают по HTTP(S) и открывают `index.html`, например: `python -m http.server 8000`, затем <http://localhost:8000>. Окно справки загружает текст через `fetch`, поэтому из `file://` оно не работает.
- Голосовой ввод требует браузер с распознаванием речи (Chrome, Edge) и безопасный контекст (HTTPS или `localhost`).
- Настройки по умолчанию (тема, языки конфигураций, видимые кнопки и т. д.) лежат только в `config/config.json`. Они используются при первом запуске и кнопкой «Reset defaults». Каждая конфигурация перечисляет свои кнопки в `buttons` (секции `source`, `target1`, `target2`); `false` скрывает кнопку по умолчанию.
- Служба перевода по умолчанию: [MyMemory](https://mymemory.translated.net/) (бесплатно, с дневным лимитом). В режиме developer также доступны LibreTranslate и Google Cloud Translate; для Google нужен свой ключ API в `src/js/core/config.js` (он виден в коде страницы, ограничьте его своим сайтом в Google Cloud). Панель developer показывает, сколько символов MyMemory перевёл за день.
- Автор: Oleksii Pokormiakho.

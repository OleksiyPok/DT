# Структура проекта (стандарт для DT и NLT)

```
index.html
README.md
STRUCTURE.md
config/
  config.json              ЕДИНСТВЕННОЕ место настроек по умолчанию
docs/
  readme/img/              картинки для README
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
    core/                  основа: config, state, dom, i18n, storage, theme, theme-registry
    features/              возможности, по одному файлу на задачу
```

## Правила

- Имена файлов: kebab-case.
- Настройки по умолчанию: только `config/config.json`. В коде значений по умолчанию нет. Единственное исключение: имя темы по умолчанию в `theme-boot.js` (тема ставится до загрузки config.json); значения должны совпадать.
- Версия приложения: только `APP_VERSION` в `core/config.js`; меняется при каждом изменении.
- Ключи текстов в `src/i18n/*.json`: `<имя>Label` (подписи), `<имя>Title` (подсказки и заголовки), `<имя>Placeholder`; во всех языках набор ключей одинаковый. Недостающий текст берётся из английского.
- Иконки кнопок и режимов темы: символы в SVG-спрайте в `index.html`, на странице через `<use href="#i-...">`.
- Нет inline-обработчиков (`onclick`) в HTML: все события вешает код из `features/`.
- Ключи localStorage: `<APP>-settings` (`DT-settings`, `NLT-settings`) и другие `<APP>-...`; все объявлены в `core/config.js`.
- Иконки: `assets/icons/icon_<APP>_<ширина>x<высота>.png`.
- JS: ES-модули, без глобальных переменных. Общее состояние только в `core/state.js`.
- `core/` не знает о `features/`, кроме `core/theme.js` (список «живых» select).
- Новый язык: файл `src/i18n/<lang>.json`, справка `docs/help/help.<lang>.html`, код языка в `core/config.js` (`LANG_CODES`) и в `index.html` (списки языков).
- Порядок CSS задаёт `src/css/main.css`: позже стоящий файл переопределяет раньше стоящий.
- Приложение нужно открывать по HTTP (модули и `fetch` не работают с `file://`).

## Карта модулей DT

| Файл | За что отвечает |
|---|---|
| `core/config.js` | константы, пути, версия |
| `core/defaults.js` | загрузка настроек по умолчанию из `config/config.json` |
| `core/state.js` | общее состояние конфигураций |
| `core/i18n.js` | загрузка и выдача текстов интерфейса, окна с сообщениями |
| `core/storage.js` | чтение и запись настроек в localStorage |
| `core/theme.js`, `core/theme-registry.js` | темы и режимы |
| `features/ui.js` | подстановка текстов интерфейса на страницу |
| `features/settings.js` | применение настроек, сброс |
| `features/presets.js`, `features/buttons.js` | конфигурации и видимость кнопок |
| `features/translate.js`, `features/translate-services.js` | перевод и сервисы |
| `features/speech.js`, `features/clipboard.js` | голос, буфер обмена |
| `features/modals.js`, `features/help.js` | окна и справка (язык справки выбирается в самом окне) |
| `features/developer.js` | панель developer и выбор сервиса (настройка и секретный жест) |
| `features/mymemory-usage.js` | счётчик запросов и символов MyMemory за день (строка в панели developer) |
| `features/scroll-steps.js`, `features/live-select.js` | прокрутка по шагам, «живые» списки |
| `features/events.js` | обработчики событий |

## Шаги работы

1. DT: структура папок, пути, ключ localStorage, иконки. (готово)
2. DT: код на модули, тексты в JSON по языкам, CSS на файлы. (готово)
2b. DT: устранены странности и ошибки, единый config.json. (готово)
3. NLT: структура папок, пути, ключ localStorage, иконки.
4. NLT: код на модули по тому же стандарту.
5. NLT: дизайн по образцу DT.

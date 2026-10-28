# Структура проекта (стандарт для DT и NLT)

```
index.html
README.md
STRUCTURE.md
config/
  config.json            настройки по умолчанию
docs/
  readme/img/            картинки для README
  help/                  help.<lang>.html и help/img/
assets/
  icons/                 icon_<APP>_<size>.png
src/
  js/                    код (шаг 2: разбивается на core/ и features/)
  css/                   стили
```

## Правила

- Имена файлов: kebab-case (`theme-registry.js`).
- Ключ в localStorage: `<APP>-settings` (`DT-settings`, `NLT-settings`).
- Иконки: `assets/icons/icon_<APP>_<ширина>x<высота>.png`.
- Один файл отвечает за одну задачу.
- Общие файлы DT и NLT (темы, базовый CSS, работа с темой) держим одинаковыми в обоих проектах.

## Шаги работы

1. DT: структура папок, пути, ключ localStorage, иконки. (готово)
2. DT: код на модули, тексты в JSON по языкам, CSS на файлы.
3. NLT: структура папок, пути, ключ localStorage, иконки.
4. NLT: код на модули по тому же стандарту.
5. NLT: дизайн по образцу DT.

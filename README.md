# Photographer Portfolio

Портфоліо фотографа на базі Jekyll з використанням Liquid та JavaScript.

## Технології

- Ruby
- Jekyll
- Liquid
- JavaScript
- SCSS

## Локальна розробка

1. Встановіть залежності:
```bash
bundle install
```

2. Запустіть локальний сервер:
```bash
bundle exec jekyll serve
```

3. Відкрийте браузер на `http://localhost:4000`

## Деплой на GitHub Pages

### Варіант 1: Автоматичний (рекомендовано)

1. Створіть репозиторій на GitHub
2. Завантажте код:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_ЮЗЕРНЕЙМ/НАЗВА_РЕПО.git
git push -u origin main
```

3. У налаштуваннях репозиторію:
   - Перейдіть до Settings → Pages
   - У Source виберіть "Deploy from a branch"
   - Виберіть branch: `main` та folder: `/ (root)`
   - Натисніть Save

4. GitHub автоматично збере сайт через кілька хвилин

### Варіант 2: З GitHub Actions (для Jekyll 4)

Якщо потрібна підтримка Jekyll 4, створіть `.github/workflows/jekyll.yml`:

```yaml
name: Jekyll site CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: ruby/setup-ruby@v1
      with:
        ruby-version: '3.1'
        bundler-cache: true
    - name: Jekyll build
      run: bundle exec jekyll build
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./_site
```

## Структура проєкту

- `_data/media.yml` - URL фотографій та відео
- `_layouts/default.html` - Основний layout
- `index.html` - Головна сторінка
- `contacts.html` - Сторінка контактів
- `assets/css/main.scss` - Стилі з темною темою
- `assets/js/main.js` - JavaScript функціонал

## Налаштування

Всі URL фотографій та відео знаходяться в файлі `_data/media.yml`. Просто відредагуйте цей файл, щоб додати або змінити медіа. Відео та фото об'єднані в один масив `gallery` з полем `type: "photo"` або `type: "video"`.

## Особливості

- Темна кольорова гамма
- Повністю респонсивний дизайн
- Оптимізація зображень (lazy loading)
- Статична навігаційна панель
- Головне фото на всю ширину з назвою "Holy Father Photo"
- Мозаїчна галерея з інтерактивним збільшенням фото
- Автоматичне розміщення фото різних форматів

## Важливо для GitHub Pages

- Якщо репозиторій називається `username.github.io` - сайт буде доступний на `https://username.github.io`
- Якщо репозиторій має іншу назву - сайт буде на `https://username.github.io/назва-репозиторію`
- У другому випадку в `_config.yml` встановіть `baseurl: "/назва-репозиторію"`

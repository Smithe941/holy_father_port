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

## Додавання контенту

Всі медіа-файли (фото та відео) налаштовуються в файлі `_data/media.yml`.

### Структура файлу `_data/media.yml`

```yaml
# Hero фото (на всю ширину вгорі)
hero:
  url: "URL_ФОТО"
  alt: "Опис фото"

# Головна галерея - фото та відео разом
main:
  - type: "photo"
    url: "URL_ФОТО"
    alt: "Опис фото"
  
  - type: "video"
    url: "URL_ВІДЕО"
    thumbnail: "URL_ТАМБНЕЙЛУ"  # опціонально
    alt: "Опис відео"

# Галереї - перелік галерей
galleries:
  gallery_name:
    title: "Назва галереї"
    title_photo:
      url: "URL_ФОТО_ДЛЯ_ПРЕВЬЮ"
      alt: "Опис"
    items:
      - type: "photo"
        url: "URL_ФОТО"
        alt: "Опис фото"
      - type: "video"
        url: "URL_ВІДЕО"
        thumbnail: "URL_ТАМБНЕЙЛУ"  # опціонально
        alt: "Опис відео"
```

### Як додати фото на головну сторінку

1. Відкрийте `_data/media.yml`
2. Знайдіть секцію `main:`
3. Додайте новий елемент:
```yaml
  - type: "photo"
    url: "https://example.com/photo.jpg"
    alt: "Опис фото"
```

### Як додати відео на головну сторінку

1. Відкрийте `_data/media.yml`
2. Знайдіть секцію `main:`
3. Додайте новий елемент:
```yaml
  - type: "video"
    url: "https://example.com/video.mp4"
    thumbnail: "https://example.com/thumbnail.jpg"  # опціонально
    alt: "Опис відео"
```

**Примітка:** Якщо `thumbnail` не вказано, відео буде використовуватися як превью (перший кадр).

### Як створити нову галерею

1. Відкрийте `_data/media.yml`
2. Знайдіть секцію `galleries:`
3. Додайте нову галерею:
```yaml
  gallery_key:  # унікальний ключ (латиницею, без пробілів)
    title: "Назва галереї"
    title_photo:
      url: "URL_ФОТО_ДЛЯ_ПРЕВЬЮ"
      alt: "Опис"
    items:
      - type: "photo"
        url: "URL_ФОТО"
        alt: "Опис фото"
      - type: "photo"
        url: "URL_ФОТО"
        alt: "Опис фото"
```

**Важливо:** 
- Галерея автоматично з'явиться на сторінці `/galleries`
- Сторінка галереї буде доступна за адресою `/gallery/gallery_key/`
- Для кращого візуального вигляду рекомендується мати **2-5 галерей**

### Як змінити hero фото

1. Відкрийте `_data/media.yml`
2. Знайдіть секцію `hero:`
3. Оновіть `url` та `alt`:
```yaml
hero:
  url: "НОВИЙ_URL_ФОТО"
  alt: "Новий опис"
```

### Формати підтримуваних медіа

- **Фото:** Будь-які формати (JPG, PNG, WebP тощо)
- **Відео:** MP4 (рекомендовано)
- **Розміри:** Підтримуються різні розміри та пропорції (широкі, високі, квадратні)

### Поради

- Використовуйте якісні зображення з хорошим роздільністю
- Додавайте описові `alt` тексти для доступності
- Для відео рекомендовано додавати `thumbnail` для кращого превью
- Кількість галерей: **2-5 галерей** виглядають найкраще візуально

# Mentali

Учебный MVP web-платформы для психологов и специалистов помогающих практик.

## Стек

- React
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Node.js
- Express
- SQLite через встроенный `node:sqlite`

## Страницы

- Главная страница с регистрацией
- Авторизация
- Dashboard
- Календарь
- Клиенты
- Настройки

## Запуск

```bash
npm install
npm run dev
```

Открыть frontend:

```text
https://maksimovann.github.io/mentali
```

Backend API:

```text
http://localhost:3001/api/health
```

SQLite база создается автоматически в `server/data/mentali.sqlite`.

## GitHub Pages

На GitHub Pages проект работает в demo-режиме без backend API.
Регистрация, вход, клиенты, услуги и записи сохраняются в `localStorage` браузера.

## Сборка frontend

```bash
npm run build
```


# HelpDesk

[![Deploy to GitHub Pages](https://github.com/DASFL/ahj-http-homework/actions/workflows/deploy.yml/badge.svg)](https://github.com/DASFL/ahj-http-homework/actions/workflows/deploy.yml)

Интерфейс службы поддержки для создания, просмотра, редактирования, удаления и изменения статуса тикетов. Все изменения сохраняются через HTTP API.

**[Открыть приложение на GitHub Pages](https://dasfl.github.io/ahj-http-homework/)**

**[HelpDesk API](https://ahj-http-homework-api.onrender.com/health)**

## Запуск

```bash
npm install
npm start
```

Production-сборка:

```bash
npm run build
```

## Настройка

Локально приложение обращается к `http://localhost:7070/` — стандартному адресу официального backend из задания. Для публикации добавьте в настройках GitHub-репозитория переменную Actions `API_URL` с публичным HTTPS-адресом развёрнутого backend (с завершающим `/`). Workflow передаст её в Webpack при сборке.

Backend включён в репозиторий и запускается командой `npm run start:server`. Для публикации можно создать Render Blueprint из файла `render.yaml`, указав этот GitHub-репозиторий.

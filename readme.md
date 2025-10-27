# Сервис для получения данных о тарифах коробов

## Описание
Суть сервиса простая. Необходимо получить данные из сервиса WB и запись их в таблицу `Postgres`. А также в таблицу `Google Sheets`. Запись и обновления текущих данных должна происходить каждый час.

Сам сервис был выполнен на основе шаблона из репозитория [btlz-wb-test](https://github.com/lucard17/btlz-wb-test).

В шаблоне были настроены контейнеры для `postgres` и приложения на `nodejs`.  
Для взаимодействия с БД используется `knex.js`.  
В контейнере `app` используется `build` для приложения на `ts`.

Для взаимодействия с сервисами Google использовался пакет [googleapis](https://www.npmjs.com/package/googleapis).

Для работы с сервисом WB был написан класс `WBService`.

**Для хранения ключей можно создать `env` файл в корне проекта и записать в него**

## Команды:
Запуск базы данных:
```bash
docker compose up -d --build postgres
```

Для выполнения миграций и сидов не из контейнера:
```bash
npm run knex:dev migrate latest
```

```bash
npm run knex:dev seed run
```
Также можно использовать и остальные команды (`migrate make <name>`,`migrate up`, `migrate down` и т.д.)

Для запуска приложения в режиме разработки:
```bash
npm run dev
```

Запуск проверки самого приложения:
```bash
docker compose up -d --build app
```

Для финальной проверки рекомендую:
```bash
docker compose down --rmi local --volumes
docker compose up --build
```
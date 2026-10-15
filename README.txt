VM GUIDE — GitHub Pages

Гайд и GIF: https://zholdaskali.github.io/vm-guide/
Конструктор: https://zholdaskali.github.io/vm-quest/
Пульт: https://zholdaskali.github.io/vm-quest/teacher.html

Самостоятельный режим работает без Mac, регистрации аккаунта и кода группы.
Сборка хранится в localStorage браузера; кнопка «Скачать результат» выгружает JSON.
Файл отчёта можно изменить вручную; он не является защищённым доказательством оценки.

Живой групповой режим требует развёрнутого Supabase backend и публичных настроек online/config.js.
Пока endpoint пуст, интерфейс честно показывает, что живой режим не подключён.
Код функции, SQL и инструкция: backend/.
Секрет преподавателя и service-role ключи в публичные файлы не добавлять.

Модель не создаёт реальные VM. Настоящие Ubuntu, Debian, SSH и Java остаются в локальной лаборатории преподавателя.
Статическая версия работает в подпапке проекта GitHub Pages. index.html содержит шесть встроенных GIF.

Проверки:
node tests/engine.cjs — сравнение JS с исходным Python-движком (нужна локальная лаборатория для сравнения).
node --experimental-transform-types tests/edge.mjs — изолированный контракт функции на mock-базе (Node 25).
tests/browser.cjs — браузерная проверка самостоятельного и группового режима с mock API; Playwright берётся из локальной лаборатории.

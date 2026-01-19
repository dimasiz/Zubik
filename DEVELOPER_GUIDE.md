# 👨‍💻 Руководство разработчика

## Введение

Это руководство для разработчиков, работающих над системой управления стоматологической клиникой.

## Начало работы

### Клонирование и установка

```bash
git clone <repository-url>
cd dental-clinic
npm install
```

### Локальная разработка

```bash
npm run dev
# Откроется http://localhost:3000
```

## Архитектура приложения

### SPA (Single Page Application)

Приложение использует клиентскую маршрутизацию без перезагрузки страницы.

**Ключевые файлы:**
- `index.html` - точка входа
- `js/ui.js` - управление навигацией и рендерингом страниц
- `js/app.js` - инициализация приложения

### Модульная структура

Каждый модуль отвечает за свою область:

```
js/
├── firebase-config.js   # Firebase инициализация
├── auth.js              # Аутентификация
├── patient.js           # Логика пациента
├── doctor.js            # Логика врача
├── admin.js             # Логика администратора
├── notifications.js     # Email и PDF
├── ui.js                # UI и навигация
├── utils.js             # Вспомогательные функции
└── app.js               # Точка входа
```

## Работа с Firebase

### Конфигурация

Файл `js/firebase-config.js` содержит настройки подключения к Firebase.

**Важно:** Не коммитьте реальные API ключи в публичный репозиторий!

### Аутентификация

```javascript
import { login, register, logout } from './auth.js';

// Вход
const user = await login('email@example.com', 'password');

// Регистрация
const newUser = await register('email@example.com', 'password', {
    fullName: 'Иван Иванов',
    phone: '+7 (999) 123-45-67'
});

// Выход
await logout();
```

### Работа с Firestore

```javascript
import { db } from './firebase-config.js';
import { collection, getDocs } from 'firebase/firestore';

// Получить данные
const snapshot = await getDocs(collection(db, 'services'));
const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

## Добавление новых функций

### 1. Добавление новой страницы

#### Шаг 1: Создайте функцию загрузки в `ui.js`

```javascript
async function loadMyNewPage() {
    return `
        <div class="card">
            <div class="card-header">
                <h2>Моя новая страница</h2>
            </div>
            <div class="card-body">
                <p>Контент страницы</p>
            </div>
        </div>
    `;
}
```

#### Шаг 2: Добавьте роут в функцию `navigate()`

```javascript
export async function navigate(page) {
    // ...
    switch (page) {
        // Существующие роуты
        case 'my-new-page':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadMyNewPage();
            break;
        // ...
    }
}
```

#### Шаг 3: Добавьте ссылку в навигацию

```javascript
export function updateNavigation() {
    // ...
    navLinks.innerHTML = `
        <li><a href="#my-page" onclick="window.ui.navigate('my-new-page')">Моя страница</a></li>
        <!-- Другие ссылки -->
    `;
}
```

### 2. Добавление новой функции API

#### Создайте функцию в соответствующем модуле

```javascript
// В patient.js, doctor.js или admin.js

export async function myNewFunction(data) {
    try {
        showLoading();
        
        // Ваша логика
        const result = await someFirestoreOperation(data);
        
        showNotification('Операция успешна', 'success');
        hideLoading();
        return result;
    } catch (error) {
        hideLoading();
        showNotification('Ошибка операции', 'danger');
        throw error;
    }
}
```

### 3. Добавление новой коллекции Firestore

#### Шаг 1: Создайте структуру данных

```javascript
const newDocumentData = {
    field1: 'value1',
    field2: 123,
    createdAt: serverTimestamp()
};
```

#### Шаг 2: Обновите Firestore Rules

```javascript
// В firestore.rules
match /newCollection/{docId} {
    allow read: if isAuthenticated();
    allow create: if isAuthenticated() && hasRole('admin');
    allow update: if isAuthenticated() && hasRole('admin');
    allow delete: if isAuthenticated() && hasRole('admin');
}
```

#### Шаг 3: Создайте индексы (если нужны)

```json
// В firestore.indexes.json
{
    "collectionGroup": "newCollection",
    "queryScope": "COLLECTION",
    "fields": [
        { "fieldPath": "field1", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
}
```

## Стилизация

### CSS переменные

Используйте CSS переменные для согласованности:

```css
.my-component {
    background-color: var(--surface-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
}
```

### Utility классы

Используйте готовые утилиты:

```html
<div class="flex flex-between mt-2 mb-3">
    <button class="btn btn-primary">Сохранить</button>
    <button class="btn btn-secondary">Отмена</button>
</div>
```

### Адаптивность

```css
/* Desktop first */
.my-element {
    width: 50%;
}

/* Tablet */
@media (max-width: 992px) {
    .my-element {
        width: 75%;
    }
}

/* Mobile */
@media (max-width: 768px) {
    .my-element {
        width: 100%;
    }
}
```

## Обработка ошибок

### Стандартный паттерн

```javascript
export async function someFunction() {
    try {
        showLoading();
        
        // Ваш код
        const result = await someAsyncOperation();
        
        showNotification('Успех!', 'success');
        hideLoading();
        return result;
    } catch (error) {
        hideLoading();
        console.error('Ошибка:', error);
        showNotification('Произошла ошибка', 'danger');
        throw error; // Пробросить дальше если нужно
    }
}
```

## Валидация данных

### Использование утилит

```javascript
import { validateEmail, validatePhone } from './utils.js';

if (!validateEmail(email)) {
    showNotification('Неверный email', 'warning');
    return;
}

if (!validatePhone(phone)) {
    showNotification('Неверный телефон', 'warning');
    return;
}
```

### Создание своей валидации

```javascript
function validateMyField(value) {
    const regex = /^[a-zA-Z0-9]+$/;
    return regex.test(value);
}
```

## Работа с формами

### Стандартный паттерн

```javascript
// Обработчик формы
document.getElementById('app').addEventListener('submit', async (e) => {
    if (e.target.id === 'my-form') {
        e.preventDefault();
        
        const formData = {
            field1: document.getElementById('field1').value,
            field2: document.getElementById('field2').value
        };
        
        // Валидация
        if (!formData.field1) {
            showNotification('Заполните поле 1', 'warning');
            return;
        }
        
        // Отправка
        try {
            await myApiFunction(formData);
            // Очистить форму
            e.target.reset();
        } catch (error) {
            // Ошибка уже обработана в функции
        }
    }
});
```

## Модальные окна

### Создание модального окна

```javascript
import { createModal } from './utils.js';

createModal(
    'Заголовок',
    '<p>Контент модального окна</p>',
    [
        {
            text: 'Отмена',
            className: 'btn-secondary'
        },
        {
            text: 'Подтвердить',
            className: 'btn-primary',
            onClick: async () => {
                // Действие при подтверждении
                await myAction();
            }
        }
    ]
);
```

### Диалог подтверждения

```javascript
import { confirm } from './utils.js';

confirm('Вы уверены?', async () => {
    // Действие при подтверждении
    await deleteItem(id);
});
```

## Уведомления

```javascript
import { showNotification } from './utils.js';

// Типы: success, danger, warning, info
showNotification('Операция выполнена', 'success');
showNotification('Произошла ошибка', 'danger');
showNotification('Внимание!', 'warning');
showNotification('Информация', 'info');
```

## Тестирование

### Ручное тестирование

1. Проверьте все роли (patient, doctor, admin)
2. Проверьте все формы
3. Проверьте навигацию
4. Проверьте адаптивность
5. Проверьте темную тему

### Тестирование в разных браузерах

- Chrome
- Firefox
- Safari
- Edge
- Mobile Safari
- Chrome Mobile

## Отладка

### Консоль браузера

Используйте `console.log`, `console.error`, `console.warn` для отладки.

### Firebase Console

Проверяйте данные в:
- Authentication (пользователи)
- Firestore (данные)
- Rules Playground (тестирование правил)

### Network Inspector

Проверяйте запросы к Firebase в DevTools → Network.

## Деплой

### Локальная сборка

```bash
npm run build
```

### Развертывание на Firebase

```bash
# Все
firebase deploy

# Только хостинг
firebase deploy --only hosting

# Только правила
firebase deploy --only firestore:rules

# Только индексы
firebase deploy --only firestore:indexes
```

## Best Practices

### 1. Код

- Используйте async/await вместо then/catch
- Обрабатывайте все ошибки
- Используйте try/catch блоки
- Валидируйте данные перед отправкой
- Комментируйте сложную логику

### 2. Безопасность

- Не храните API ключи в коде
- Проверяйте права на клиенте И сервере
- Валидируйте данные на клиенте И в Firestore Rules
- Используйте HTTPS

### 3. Производительность

- Минимизируйте запросы к Firestore
- Используйте индексы
- Кешируйте данные где возможно
- Оптимизируйте изображения

### 4. UI/UX

- Показывайте индикаторы загрузки
- Показывайте уведомления об успехе/ошибке
- Валидируйте формы в реальном времени
- Делайте UI интуитивным

## Структура коммитов

Используйте осмысленные сообщения коммитов:

```bash
# Новая функция
git commit -m "feat: добавлена страница статистики врача"

# Исправление бага
git commit -m "fix: исправлена ошибка валидации email"

# Улучшение
git commit -m "refactor: улучшена структура кода в ui.js"

# Документация
git commit -m "docs: обновлен README"

# Стили
git commit -m "style: улучшена адаптивность на мобильных"
```

## Решение типичных проблем

### "Missing or insufficient permissions"

Проблема: Правила Firestore блокируют доступ.

Решение:
1. Проверьте, что пользователь авторизован
2. Проверьте роль пользователя
3. Проверьте Firestore Rules
4. Разверните правила: `firebase deploy --only firestore:rules`

### "Firebase: Error (auth/...)"

Проблема: Ошибка аутентификации.

Решение:
1. Проверьте, что метод входа включен в Firebase Console
2. Проверьте правильность email/пароля
3. Проверьте конфигурацию Firebase

### "Cannot read property of undefined"

Проблема: Попытка доступа к несуществующим данным.

Решение:
1. Проверьте, что данные загружены
2. Добавьте проверки на null/undefined
3. Используйте опциональную цепочку: `user?.name`

## Полезные ресурсы

- [Firebase Documentation](https://firebase.google.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS-Tricks](https://css-tricks.com/)
- [JavaScript.info](https://javascript.info/)

## Контакты команды

Для вопросов по разработке:
- Технический лид: [имя]
- Email: dev@dentaclinic.com
- Slack: #dental-clinic-dev

---

Обновлено: 19 января 2024

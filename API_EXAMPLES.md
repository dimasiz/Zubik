# 📚 Примеры использования API

Это руководство содержит примеры использования всех основных функций системы.

## Аутентификация

### Регистрация нового пациента

```javascript
import { register } from './js/auth.js';

const userData = {
    fullName: 'Иван Иванов',
    phone: '+7 (999) 123-45-67'
};

try {
    const user = await register('ivan@example.com', 'password123', userData);
    console.log('Пользователь зарегистрирован:', user);
} catch (error) {
    console.error('Ошибка регистрации:', error);
}
```

### Вход в систему

```javascript
import { login } from './js/auth.js';

try {
    const user = await login('ivan@example.com', 'password123');
    console.log('Пользователь вошел:', user);
} catch (error) {
    console.error('Ошибка входа:', error);
}
```

### Вход через Google

```javascript
import { loginWithGoogle } from './js/auth.js';

try {
    const user = await loginWithGoogle();
    console.log('Вход через Google успешен:', user);
} catch (error) {
    console.error('Ошибка входа через Google:', error);
}
```

### Восстановление пароля

```javascript
import { resetPassword } from './js/auth.js';

try {
    await resetPassword('ivan@example.com');
    console.log('Инструкции отправлены на email');
} catch (error) {
    console.error('Ошибка восстановления пароля:', error);
}
```

### Выход из системы

```javascript
import { logout } from './js/auth.js';

try {
    await logout();
    console.log('Выход выполнен');
} catch (error) {
    console.error('Ошибка выхода:', error);
}
```

## Функции пациента

### Получить список услуг

```javascript
import { getServices } from './js/patient.js';

try {
    const services = await getServices();
    console.log('Услуги:', services);
    // [{ id: '123', name: 'Консультация', price: 1500, category: 'Консультация' }, ...]
} catch (error) {
    console.error('Ошибка получения услуг:', error);
}
```

### Получить список врачей

```javascript
import { getDoctors } from './js/patient.js';

try {
    const doctors = await getDoctors();
    console.log('Врачи:', doctors);
    // [{ id: 'abc', fullName: 'Доктор Петров', specialty: 'Терапевт' }, ...]
} catch (error) {
    console.error('Ошибка получения врачей:', error);
}
```

### Создать запись на прием

```javascript
import { createAppointment } from './js/patient.js';

const appointmentData = {
    doctorId: 'doctor-id-123',
    serviceId: 'service-id-456',
    dateTime: new Date('2024-02-15T10:00:00'),
    notes: 'Болит зуб справа'
};

try {
    const appointment = await createAppointment(appointmentData);
    console.log('Запись создана:', appointment);
} catch (error) {
    console.error('Ошибка создания записи:', error);
}
```

### Получить свои записи

```javascript
import { getPatientAppointments } from './js/patient.js';

try {
    const appointments = await getPatientAppointments();
    console.log('Мои записи:', appointments);
} catch (error) {
    console.error('Ошибка получения записей:', error);
}
```

### Получить историю визитов

```javascript
import { getPatientHistory } from './js/patient.js';

try {
    const history = await getPatientHistory();
    console.log('История визитов:', history);
} catch (error) {
    console.error('Ошибка получения истории:', error);
}
```

### Оставить отзыв

```javascript
import { createFeedback } from './js/patient.js';

const feedbackData = {
    doctorId: 'doctor-id-123',
    appointmentId: 'appointment-id-789',
    rating: 5,
    comment: 'Отличный врач, всё прошло безболезненно!'
};

try {
    const feedback = await createFeedback(feedbackData);
    console.log('Отзыв добавлен:', feedback);
} catch (error) {
    console.error('Ошибка добавления отзыва:', error);
}
```

### Получить свои отзывы

```javascript
import { getPatientFeedbacks } from './js/patient.js';

try {
    const feedbacks = await getPatientFeedbacks();
    console.log('Мои отзывы:', feedbacks);
} catch (error) {
    console.error('Ошибка получения отзывов:', error);
}
```

### Обновить профиль

```javascript
import { updatePatientProfile } from './js/patient.js';

const profileData = {
    fullName: 'Иван Петрович Иванов',
    phone: '+7 (999) 999-99-99'
};

try {
    await updatePatientProfile(profileData);
    console.log('Профиль обновлен');
} catch (error) {
    console.error('Ошибка обновления профиля:', error);
}
```

## Функции врача

### Получить расписание

```javascript
import { getDoctorSchedule } from './js/doctor.js';

try {
    const schedule = await getDoctorSchedule();
    console.log('Расписание:', schedule);
} catch (error) {
    console.error('Ошибка получения расписания:', error);
}
```

### Получить список пациентов

```javascript
import { getDoctorPatients } from './js/doctor.js';

try {
    const patients = await getDoctorPatients();
    console.log('Мои пациенты:', patients);
} catch (error) {
    console.error('Ошибка получения пациентов:', error);
}
```

### Получить историю пациента

```javascript
import { getPatientMedicalHistory } from './js/doctor.js';

try {
    const history = await getPatientMedicalHistory('patient-id-123');
    console.log('История пациента:', history);
} catch (error) {
    console.error('Ошибка получения истории:', error);
}
```

### Обновить заметки в записи

```javascript
import { updateAppointmentNotes } from './js/doctor.js';

try {
    await updateAppointmentNotes(
        'appointment-id-789',
        'Проведено лечение кариеса',
        'Кариес дентина'
    );
    console.log('Заметки обновлены');
} catch (error) {
    console.error('Ошибка обновления заметок:', error);
}
```

### Завершить прием

```javascript
import { completeAppointment } from './js/doctor.js';

try {
    await completeAppointment('appointment-id-789');
    console.log('Прием завершен');
} catch (error) {
    console.error('Ошибка завершения приема:', error);
}
```

### Получить статистику

```javascript
import { getDoctorStatistics } from './js/doctor.js';

try {
    const stats = await getDoctorStatistics();
    console.log('Статистика:', stats);
    // { total: 150, scheduled: 25, completed: 120, cancelled: 5 }
} catch (error) {
    console.error('Ошибка получения статистики:', error);
}
```

### Получить отзывы о враче

```javascript
import { getDoctorFeedbacks } from './js/doctor.js';

try {
    const result = await getDoctorFeedbacks();
    console.log('Средний рейтинг:', result.averageRating);
    console.log('Всего отзывов:', result.totalFeedbacks);
    console.log('Отзывы:', result.feedbacks);
} catch (error) {
    console.error('Ошибка получения отзывов:', error);
}
```

### Поиск пациента

```javascript
import { searchPatient } from './js/doctor.js';

try {
    const patients = await searchPatient('Иван');
    console.log('Найденные пациенты:', patients);
} catch (error) {
    console.error('Ошибка поиска:', error);
}
```

## Функции администратора

### Управление услугами

#### Получить все услуги

```javascript
import { getAllServices } from './js/admin.js';

try {
    const services = await getAllServices();
    console.log('Все услуги:', services);
} catch (error) {
    console.error('Ошибка получения услуг:', error);
}
```

#### Добавить услугу

```javascript
import { addService } from './js/admin.js';

const serviceData = {
    name: 'Имплантация зуба',
    category: 'Хирургия',
    price: 25000,
    description: 'Установка импланта с последующим протезированием'
};

try {
    const service = await addService(serviceData);
    console.log('Услуга добавлена:', service);
} catch (error) {
    console.error('Ошибка добавления услуги:', error);
}
```

#### Обновить услугу

```javascript
import { updateService } from './js/admin.js';

try {
    await updateService('service-id-123', {
        price: 3000,
        description: 'Обновленное описание'
    });
    console.log('Услуга обновлена');
} catch (error) {
    console.error('Ошибка обновления услуги:', error);
}
```

#### Удалить услугу

```javascript
import { deleteService } from './js/admin.js';

try {
    await deleteService('service-id-123');
    console.log('Услуга удалена');
} catch (error) {
    console.error('Ошибка удаления услуги:', error);
}
```

### Управление записями

#### Получить все записи

```javascript
import { getAllAppointments } from './js/admin.js';

try {
    const appointments = await getAllAppointments();
    console.log('Все записи:', appointments);
} catch (error) {
    console.error('Ошибка получения записей:', error);
}
```

#### Отменить запись

```javascript
import { cancelAppointment } from './js/admin.js';

try {
    await cancelAppointment('appointment-id-789');
    console.log('Запись отменена');
} catch (error) {
    console.error('Ошибка отмены записи:', error);
}
```

### Управление врачами

#### Получить всех врачей

```javascript
import { getAllDoctors } from './js/admin.js';

try {
    const doctors = await getAllDoctors();
    console.log('Все врачи:', doctors);
    // Включает статистику и средний рейтинг
} catch (error) {
    console.error('Ошибка получения врачей:', error);
}
```

#### Обновить расписание врача

```javascript
import { updateDoctorSchedule } from './js/admin.js';

const scheduleData = {
    monday: { start: '09:00', end: '18:00' },
    tuesday: { start: '09:00', end: '18:00' },
    wednesday: { start: '09:00', end: '18:00' },
    thursday: { start: '09:00', end: '18:00' },
    friday: { start: '09:00', end: '18:00' },
    saturday: null,
    sunday: null
};

try {
    await updateDoctorSchedule('doctor-id-123', scheduleData);
    console.log('Расписание обновлено');
} catch (error) {
    console.error('Ошибка обновления расписания:', error);
}
```

### Управление материалами

#### Получить все материалы

```javascript
import { getAllMaterials } from './js/admin.js';

try {
    const materials = await getAllMaterials();
    console.log('Все материалы:', materials);
} catch (error) {
    console.error('Ошибка получения материалов:', error);
}
```

#### Добавить материал

```javascript
import { addMaterial } from './js/admin.js';

const materialData = {
    name: 'Пломбировочный материал',
    quantity: 50,
    cost: 5000
};

try {
    const material = await addMaterial(materialData);
    console.log('Материал добавлен:', material);
} catch (error) {
    console.error('Ошибка добавления материала:', error);
}
```

#### Обновить материал

```javascript
import { updateMaterial } from './js/admin.js';

try {
    await updateMaterial('material-id-123', {
        quantity: 30,
        cost: 4500
    });
    console.log('Материал обновлен');
} catch (error) {
    console.error('Ошибка обновления материала:', error);
}
```

#### Удалить материал

```javascript
import { deleteMaterial } from './js/admin.js';

try {
    await deleteMaterial('material-id-123');
    console.log('Материал удален');
} catch (error) {
    console.error('Ошибка удаления материала:', error);
}
```

### Получить общую статистику

```javascript
import { getAdminStatistics } from './js/admin.js';

try {
    const stats = await getAdminStatistics();
    console.log('Статистика:', stats);
    // {
    //   totalAppointments: 500,
    //   scheduledAppointments: 50,
    //   completedAppointments: 420,
    //   cancelledAppointments: 30,
    //   totalPatients: 200,
    //   totalDoctors: 5,
    //   totalServices: 20,
    //   totalMaterials: 15
    // }
} catch (error) {
    console.error('Ошибка получения статистики:', error);
}
```

## Утилиты

### Показать уведомление

```javascript
import { showNotification } from './js/utils.js';

showNotification('Операция выполнена успешно', 'success');
showNotification('Внимание!', 'warning');
showNotification('Произошла ошибка', 'danger');
showNotification('Информация', 'info');
```

### Форматирование

```javascript
import { formatDate, formatTime, formatDateTime, formatPrice } from './js/utils.js';

const date = new Date('2024-02-15T10:30:00');

console.log(formatDate(date));      // "15.02.2024"
console.log(formatTime(date));      // "10:30"
console.log(formatDateTime(date));  // "15.02.2024 10:30"
console.log(formatPrice(1500));     // "1 500,00 ₽"
```

### Модальные окна

```javascript
import { createModal, confirm } from './js/utils.js';

// Создать модальное окно
createModal(
    'Заголовок',
    '<p>Содержимое модального окна</p>',
    [
        {
            text: 'Отмена',
            className: 'btn-secondary'
        },
        {
            text: 'OK',
            className: 'btn-primary',
            onClick: () => console.log('OK нажато')
        }
    ]
);

// Подтверждение
confirm('Вы уверены?', () => {
    console.log('Подтверждено');
});
```

### Переключение темы

```javascript
import { toggleTheme } from './js/utils.js';

// Переключить тему
toggleTheme();
```

## Навигация

```javascript
import { navigate } from './js/ui.js';

// Перейти на другую страницу
navigate('patient-dashboard');
navigate('doctor-dashboard');
navigate('admin-dashboard');
navigate('services');
navigate('login');
```

## Email уведомления

### Отправить уведомление о записи

```javascript
import { sendAppointmentNotification } from './js/notifications.js';

const appointmentDetails = {
    patientName: 'Иван Иванов',
    doctorName: 'Доктор Петров',
    serviceName: 'Консультация',
    date: '15.02.2024',
    time: '10:00'
};

try {
    await sendAppointmentNotification('patient@example.com', appointmentDetails);
    console.log('Уведомление отправлено');
} catch (error) {
    console.error('Ошибка отправки уведомления:', error);
}
```

### Генерировать PDF чек

```javascript
import { generateReceiptPDF } from './js/notifications.js';

const receiptData = {
    receiptNumber: '000123',
    date: '15.02.2024',
    patientName: 'Иван Иванов',
    doctorName: 'Доктор Петров',
    services: [
        { name: 'Консультация', price: 1500 },
        { name: 'Лечение кариеса', price: 3500 }
    ],
    totalAmount: 5000
};

try {
    await generateReceiptPDF(receiptData);
    console.log('PDF чек сгенерирован');
} catch (error) {
    console.error('Ошибка генерации PDF:', error);
}
```

## Проверка прав доступа

```javascript
import { hasRole, isAuthenticated, getCurrentUserData } from './js/auth.js';

// Проверить, авторизован ли пользователь
if (isAuthenticated()) {
    console.log('Пользователь авторизован');
}

// Проверить роль
if (hasRole('admin')) {
    console.log('Пользователь - администратор');
}

// Получить данные текущего пользователя
const userData = getCurrentUserData();
console.log('Текущий пользователь:', userData);
```

// Главный файл приложения
import { onAuthChange } from './auth.js';
import { initUI, updateNavigation, navigate } from './ui.js';
import { login, register, loginWithGoogle, resetPassword } from './auth.js';
import { showNotification, validateEmail, validatePhone } from './utils.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('Приложение ДентаКлиник запущено');

    initUI();
    setupConnectionMonitoring();
    setupFormHandlers();

    // Навигация по хэшу
    window.addEventListener('hashchange', () => {
        navigate(getPageFromHash());
    });

    // Показать страницу из URL-хэша (если есть), чтобы страница не была пустой
    goTo(getPageFromHash());

    // Слушать изменения аутентификации
    onAuthChange((userData) => {
        updateNavigation();

        const requestedPage = getPageFromHash();

        if (userData) {
            const roleHome =
                userData.role === 'patient'
                    ? 'patient-dashboard'
                    : userData.role === 'doctor'
                        ? 'doctor-dashboard'
                        : 'admin-dashboard';

            // Если пользователь уже вошел, то страницы входа/регистрации не показываем
            if (['home', 'login', 'register'].includes(requestedPage)) {
                goTo(roleHome);
                return;
            }

            goTo(requestedPage);
            return;
        }

        // Неавторизованный пользователь может посещать только публичные страницы
        const publicPages = new Set(['home', 'services', 'login', 'register']);
        goTo(publicPages.has(requestedPage) ? requestedPage : 'login');
    });
});

function goTo(page) {
    const current = window.location.hash.replace('#', '').trim();

    if (current === page) {
        navigate(page);
        return;
    }

    window.location.hash = page;
}

function getPageFromHash() {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash) return 'home';

    const knownPages = new Set([
        'home',
        'services',
        'login',
        'register',
        'patient-dashboard',
        'new-appointment',
        'patient-history',
        'patient-profile',
        'doctor-dashboard',
        'doctor-patients',
        'doctor-statistics',
        'doctor-profile',
        'admin-dashboard',
        'admin-services',
        'admin-appointments',
        'admin-doctors',
        'admin-materials',
        'admin-receipts'
    ]);

    return knownPages.has(hash) ? hash : 'home';
}

// Мониторинг подключения
function setupConnectionMonitoring() {
    const statusIndicator = document.getElementById('connection-status');
    if (!statusIndicator) return;

    function updateStatus() {
        if (navigator.onLine) {
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');
            statusIndicator.title = 'В сети (Firebase синхронизирован)';
        } else {
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            statusIndicator.title = 'Офлайн (используется локальная база данных)';
            showNotification('Вы работаете в автономном режиме. Данные сохраняются локально.', 'info');
        }
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

// Настроить обработчики форм
function setupFormHandlers() {
    // Использовать делегирование событий для динамического контента
    document.getElementById('app').addEventListener('submit', async (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            await handleLogin();
        } else if (e.target.id === 'register-form') {
            e.preventDefault();
            await handleRegister();
        }
    });
    
    document.getElementById('app').addEventListener('click', async (e) => {
        if (e.target.id === 'google-login-btn') {
            e.preventDefault();
            await handleGoogleLogin();
        } else if (e.target.id === 'forgot-password-link') {
            e.preventDefault();
            await handleForgotPassword();
        }
    });
}

// Обработчик формы входа
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!validateEmail(email)) {
        showNotification('Введите корректный email', 'warning');
        return;
    }
    
    try {
        await login(email, password);
        // Навигация произойдет автоматически через onAuthChange
    } catch (error) {
        console.error('Ошибка входа:', error);
    }
}

// Обработчик формы регистрации
async function handleRegister() {
    const fullName = document.getElementById('register-fullname').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    // Валидация
    if (!fullName || !email || !phone || !password) {
        showNotification('Заполните все поля', 'warning');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Введите корректный email', 'warning');
        return;
    }
    
    if (!validatePhone(phone)) {
        showNotification('Введите корректный номер телефона', 'warning');
        return;
    }
    
    if (password !== passwordConfirm) {
        showNotification('Пароли не совпадают', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Пароль должен быть не менее 6 символов', 'warning');
        return;
    }
    
    try {
        await register(email, password, {
            fullName,
            phone
        });
        // Навигация произойдет автоматически через onAuthChange
    } catch (error) {
        console.error('Ошибка регистрации:', error);
    }
}

// Обработчик входа через Google
async function handleGoogleLogin() {
    try {
        await loginWithGoogle();
        // Навигация произойдет автоматически через onAuthChange
    } catch (error) {
        console.error('Ошибка входа через Google:', error);
    }
}

// Обработчик восстановления пароля
async function handleForgotPassword() {
    const email = prompt('Введите ваш email для восстановления пароля:');
    
    if (!email) return;
    
    if (!validateEmail(email)) {
        showNotification('Введите корректный email', 'warning');
        return;
    }
    
    try {
        await resetPassword(email);
    } catch (error) {
        console.error('Ошибка восстановления пароля:', error);
    }
}

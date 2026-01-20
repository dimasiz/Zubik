// Главный файл приложения
import { onAuthChange } from './auth.js';
import { initUI, updateNavigation, navigate, showAuthModal, hideAuthModal } from './ui.js';
import { login, register, loginWithGoogle, resetPassword } from './auth.js';
import { showNotification, validateEmail, validatePhone } from './utils.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('Приложение ДентаКлиник запущено');

    initUI();
    setupConnectionMonitoring();
    setupFormHandlers();
    setupNavigationClicks();

    // Навигация по хэшу
    window.addEventListener('hashchange', () => {
        const page = getPageFromHash();
        if (['login', 'register'].includes(page)) {
            showAuthModal(page);
        } else {
            navigate(page);
        }
    });

    // Показать страницу из URL-хэша (если есть), чтобы страница не была пустой
    const initialPage = getPageFromHash();
    if (['login', 'register'].includes(initialPage)) {
        showAuthModal(initialPage);
    } else {
        goTo(initialPage);
    }

    // Слушать изменения аутентификации
    onAuthChange((userData) => {
        updateNavigation();

        const requestedPage = getPageFromHash();
        const modal = document.getElementById('auth-modal');
        const isModalOpen = modal && !modal.classList.contains('hidden') && modal.classList.contains('show');

        if (userData) {
            // Если модальное окно открыто, закрыть его
            if (isModalOpen) {
                hideAuthModal();
            }

            const roleHome =
                userData.role === 'patient'
                    ? 'patient-dashboard'
                    : userData.role === 'doctor'
                        ? 'doctor-dashboard'
                        : 'admin-dashboard';

            // Если пользователь уже вошел, то страницы входа/регистрации не показываем
            if (['home', 'services', 'login', 'register'].includes(requestedPage)) {
                goTo(roleHome);
                return;
            }

            goTo(requestedPage);
            return;
        }

        // Неавторизованный пользователь может посещать только публичные страницы
        const publicPages = new Set(['home', 'services', 'login', 'register']);
        const targetPage = publicPages.has(requestedPage) ? requestedPage : 'home';
        
        if (['login', 'register'].includes(targetPage) && !isModalOpen) {
            showAuthModal(targetPage);
        } else if (!['login', 'register'].includes(targetPage)) {
            goTo(targetPage);
        }
    });
});

function setupNavigationClicks() {
    // Handle all [data-page] clicks for navigation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-page]');
        if (!link) return;

        e.preventDefault();
        const page = link.getAttribute('data-page');
        
        if (['login', 'register'].includes(page)) {
            showAuthModal(page);
        } else {
            goTo(page);
        }
    });
}

function setupGlobalEventHandlers() {
    // Handle data-navigate attributes
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-navigate]');
        if (!button) return;

        e.preventDefault();
        const page = button.getAttribute('data-navigate');
        goTo(page);
    });

    // Handle data-action attributes for services refresh
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');
        
        switch (action) {
            case 'refresh-services':
                e.preventDefault();
                // The event will be handled in ui.js initServicesPage
                break;
            
            case 'feedback':
                e.preventDefault();
                // The event will be handled in ui.js initPatientHistoryPage
                break;
        }
    });
}

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

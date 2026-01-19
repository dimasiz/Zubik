// Главный файл приложения
import { onAuthChange } from './auth.js';
import { initUI, updateNavigation, navigate } from './ui.js';
import { login, register, loginWithGoogle, resetPassword } from './auth.js';
import { showNotification, validateEmail, validatePhone } from './utils.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('Приложение ДентаКлиник запущено');
    
    // Инициализировать UI
    initUI();
    
    // Слушать изменения аутентификации
    onAuthChange((userData) => {
        if (userData) {
            console.log('Пользователь вошел:', userData);
            updateNavigation();
            
            // Перенаправить на соответствующую панель
            if (userData.role === 'patient') {
                navigate('patient-dashboard');
            } else if (userData.role === 'doctor') {
                navigate('doctor-dashboard');
            } else if (userData.role === 'admin') {
                navigate('admin-dashboard');
            }
        } else {
            console.log('Пользователь не авторизован');
            updateNavigation();
            navigate('home');
        }
    });
    
    // Настроить обработчики форм после загрузки страницы
    setupFormHandlers();
});

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

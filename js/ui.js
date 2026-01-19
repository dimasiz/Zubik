// Управление UI
import { getCurrentUserData, logout, isAuthenticated } from './auth.js';
import { toggleTheme } from './utils.js';

// Текущая страница
let currentPage = 'home';

// Инициализация UI
export function initUI() {
    setupNavigation();
    setupThemeToggle();
    updateNavigation();
}

// Настройка навигации
function setupNavigation() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await logout();
        });
    }
}

// Настройка переключателя темы
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Обновить навигацию в зависимости от роли
export function updateNavigation() {
    const navLinks = document.getElementById('nav-links');
    const userName = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!navLinks) return;
    
    const userData = getCurrentUserData();
    
    if (!userData) {
        // Неавторизованный пользователь
        navLinks.innerHTML = `
            <li><a href="#home" onclick="window.ui.navigate('home')">Главная</a></li>
            <li><a href="#services" onclick="window.ui.navigate('services')">Услуги</a></li>
            <li><a href="#login" onclick="window.ui.navigate('login')">Вход</a></li>
            <li><a href="#register" onclick="window.ui.navigate('register')">Регистрация</a></li>
        `;
        userName.textContent = '';
        logoutBtn.style.display = 'none';
    } else {
        userName.textContent = `Привет, ${userData.fullName}!`;
        logoutBtn.style.display = 'inline-block';
        
        // Навигация в зависимости от роли
        if (userData.role === 'patient') {
            navLinks.innerHTML = `
                <li><a href="#dashboard" onclick="window.ui.navigate('patient-dashboard')">Мои записи</a></li>
                <li><a href="#new-appointment" onclick="window.ui.navigate('new-appointment')">Новая запись</a></li>
                <li><a href="#services" onclick="window.ui.navigate('services')">Услуги</a></li>
                <li><a href="#history" onclick="window.ui.navigate('patient-history')">История</a></li>
                <li><a href="#profile" onclick="window.ui.navigate('patient-profile')">Профиль</a></li>
            `;
        } else if (userData.role === 'doctor') {
            navLinks.innerHTML = `
                <li><a href="#dashboard" onclick="window.ui.navigate('doctor-dashboard')">Расписание</a></li>
                <li><a href="#patients" onclick="window.ui.navigate('doctor-patients')">Пациенты</a></li>
                <li><a href="#statistics" onclick="window.ui.navigate('doctor-statistics')">Статистика</a></li>
                <li><a href="#profile" onclick="window.ui.navigate('doctor-profile')">Профиль</a></li>
            `;
        } else if (userData.role === 'admin') {
            navLinks.innerHTML = `
                <li><a href="#dashboard" onclick="window.ui.navigate('admin-dashboard')">Панель</a></li>
                <li><a href="#services" onclick="window.ui.navigate('admin-services')">Услуги</a></li>
                <li><a href="#appointments" onclick="window.ui.navigate('admin-appointments')">Записи</a></li>
                <li><a href="#doctors" onclick="window.ui.navigate('admin-doctors')">Врачи</a></li>
                <li><a href="#materials" onclick="window.ui.navigate('admin-materials')">Материалы</a></li>
                <li><a href="#receipts" onclick="window.ui.navigate('admin-receipts')">Чеки</a></li>
            `;
        }
    }
}

// Навигация между страницами
export async function navigate(page) {
    currentPage = page;
    const app = document.getElementById('app');
    if (!app) return;
    
    // Загрузить соответствующую страницу
    switch (page) {
        case 'home':
            app.innerHTML = await loadHomePage();
            break;
        case 'login':
            app.innerHTML = await loadLoginPage();
            break;
        case 'register':
            app.innerHTML = await loadRegisterPage();
            break;
        case 'services':
            app.innerHTML = await loadServicesPage();
            break;
        case 'patient-dashboard':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadPatientDashboard();
            break;
        case 'new-appointment':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadNewAppointmentPage();
            break;
        case 'patient-history':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadPatientHistoryPage();
            break;
        case 'patient-profile':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadPatientProfilePage();
            break;
        case 'doctor-dashboard':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadDoctorDashboard();
            break;
        case 'doctor-patients':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadDoctorPatientsPage();
            break;
        case 'doctor-statistics':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadDoctorStatisticsPage();
            break;
        case 'doctor-profile':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadDoctorProfilePage();
            break;
        case 'admin-dashboard':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadAdminDashboard();
            break;
        case 'admin-services':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadAdminServicesPage();
            break;
        case 'admin-appointments':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadAdminAppointmentsPage();
            break;
        case 'admin-doctors':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadAdminDoctorsPage();
            break;
        case 'admin-materials':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadAdminMaterialsPage();
            break;
        case 'admin-receipts':
            if (!isAuthenticated()) return navigate('login');
            app.innerHTML = await loadAdminReceiptsPage();
            break;
        default:
            app.innerHTML = await loadHomePage();
    }
    
    // Прокрутить страницу вверх
    window.scrollTo(0, 0);
}

// Загрузить домашнюю страницу
async function loadHomePage() {
    return `
        <div class="text-center mt-3">
            <h1>🦷 Добро пожаловать в ДентаКлиник</h1>
            <p class="mt-2">Современная стоматология с заботой о вас</p>
            <div class="grid grid-3 mt-3">
                <div class="card">
                    <h3>Качество</h3>
                    <p>Мы используем только современное оборудование и материалы</p>
                </div>
                <div class="card">
                    <h3>Комфорт</h3>
                    <p>Безболезненное лечение в приятной атмосфере</p>
                </div>
                <div class="card">
                    <h3>Опыт</h3>
                    <p>Наши врачи - профессионалы с многолетним стажем</p>
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary" onclick="window.ui.navigate('services')">Наши услуги</button>
                <button class="btn btn-outline" onclick="window.ui.navigate('register')">Записаться на прием</button>
            </div>
        </div>
    `;
}

// Загрузить страницу входа
async function loadLoginPage() {
    return `
        <div class="card" style="max-width: 500px; margin: 2rem auto;">
            <div class="card-header">
                <h2>Вход в систему</h2>
            </div>
            <div class="card-body">
                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="login-email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Пароль</label>
                        <input type="password" class="form-control" id="login-password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Войти</button>
                    <button type="button" class="btn btn-outline" id="google-login-btn">Войти через Google</button>
                </form>
                <div class="mt-2">
                    <a href="#" onclick="window.ui.navigate('register')">Нет аккаунта? Зарегистрироваться</a>
                </div>
                <div class="mt-1">
                    <a href="#" id="forgot-password-link">Забыли пароль?</a>
                </div>
            </div>
        </div>
    `;
}

// Загрузить страницу регистрации
async function loadRegisterPage() {
    return `
        <div class="card" style="max-width: 500px; margin: 2rem auto;">
            <div class="card-header">
                <h2>Регистрация пациента</h2>
            </div>
            <div class="card-body">
                <form id="register-form">
                    <div class="form-group">
                        <label class="form-label">Полное имя</label>
                        <input type="text" class="form-control" id="register-fullname" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="register-email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Телефон</label>
                        <input type="tel" class="form-control" id="register-phone" placeholder="+7 (999) 123-45-67" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Пароль</label>
                        <input type="password" class="form-control" id="register-password" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Подтвердите пароль</label>
                        <input type="password" class="form-control" id="register-password-confirm" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
                </form>
                <div class="mt-2">
                    <a href="#" onclick="window.ui.navigate('login')">Уже есть аккаунт? Войти</a>
                </div>
            </div>
        </div>
    `;
}

// Загрузить страницу услуг
async function loadServicesPage() {
    return `
        <div class="card">
            <div class="card-header">
                <h2>Наши услуги</h2>
            </div>
            <div class="card-body" id="services-list">
                <p>Загрузка услуг...</p>
            </div>
        </div>
    `;
}

// Заглушки для страниц пациента
async function loadPatientDashboard() {
    return '<div class="card"><h2>Мои записи</h2><p>Страница в разработке</p></div>';
}

async function loadNewAppointmentPage() {
    return '<div class="card"><h2>Новая запись</h2><p>Страница в разработке</p></div>';
}

async function loadPatientHistoryPage() {
    return '<div class="card"><h2>История визитов</h2><p>Страница в разработке</p></div>';
}

async function loadPatientProfilePage() {
    return '<div class="card"><h2>Мой профиль</h2><p>Страница в разработке</p></div>';
}

// Заглушки для страниц врача
async function loadDoctorDashboard() {
    return '<div class="card"><h2>Расписание</h2><p>Страница в разработке</p></div>';
}

async function loadDoctorPatientsPage() {
    return '<div class="card"><h2>Мои пациенты</h2><p>Страница в разработке</p></div>';
}

async function loadDoctorStatisticsPage() {
    return '<div class="card"><h2>Статистика</h2><p>Страница в разработке</p></div>';
}

async function loadDoctorProfilePage() {
    return '<div class="card"><h2>Профиль врача</h2><p>Страница в разработке</p></div>';
}

// Заглушки для страниц администратора
async function loadAdminDashboard() {
    return '<div class="card"><h2>Панель администратора</h2><p>Страница в разработке</p></div>';
}

async function loadAdminServicesPage() {
    return '<div class="card"><h2>Управление услугами</h2><p>Страница в разработке</p></div>';
}

async function loadAdminAppointmentsPage() {
    return '<div class="card"><h2>Управление записями</h2><p>Страница в разработке</p></div>';
}

async function loadAdminDoctorsPage() {
    return '<div class="card"><h2>Управление врачами</h2><p>Страница в разработке</p></div>';
}

async function loadAdminMaterialsPage() {
    return '<div class="card"><h2>Учет материалов</h2><p>Страница в разработке</p></div>';
}

async function loadAdminReceiptsPage() {
    return '<div class="card"><h2>Электронные чеки</h2><p>Страница в разработке</p></div>';
}

// Экспорт для глобального доступа
window.ui = {
    navigate,
    updateNavigation
};

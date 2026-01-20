// Управление UI
import { getCurrentUserData, logout, isAuthenticated } from './auth.js';
import {
    toggleTheme,
    showNotification,
    formatDateTime,
    formatPrice,
    generateStarRating,
    createModal,
    confirm
} from './utils.js';

const fallbackServices = [
    {
        id: 'demo-cleaning',
        name: 'Профессиональная чистка',
        category: 'Гигиена',
        price: 3500,
        description: 'Удаление налета и камня ультразвуком, полировка и рекомендации по уходу.'
    },
    {
        id: 'demo-filling',
        name: 'Лечение кариеса',
        category: 'Терапия',
        price: 4900,
        description: 'Диагностика, бережная обработка и современная пломбировка.'
    },
    {
        id: 'demo-whitening',
        name: 'Отбеливание',
        category: 'Эстетика',
        price: 12000,
        description: 'Осветление эмали с контролем чувствительности и подбором режима.'
    }
];

const fallbackDoctors = [
    {
        id: 'demo-doctor-1',
        fullName: 'Врач-стоматолог Анна Смирнова',
        email: 'doctor@example.com',
        phone: '+7 (999) 000-00-00'
    },
    {
        id: 'demo-doctor-2',
        fullName: 'Врач-стоматолог Дмитрий Иванов',
        email: 'doctor2@example.com',
        phone: '+7 (999) 111-11-11'
    }
];

let cachedServices = null;
let cachedDoctors = null;

// Функция для показа модального окна отзыва
function showFeedbackModal(appointment, createFeedback, servicesMap, doctorsMap) {
    const modal = createModal(
        'Отзыв о приеме',
        `
            <div class="form-group">
                <label class="form-label" for="feedback-rating">Оценка</label>
                <select class="form-select" id="feedback-rating">
                    <option value="5">5 — отлично</option>
                    <option value="4">4 — хорошо</option>
                    <option value="3">3 — нормально</option>
                    <option value="2">2 — плохо</option>
                    <option value="1">1 — очень плохо</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="feedback-comment">Комментарий</label>
                <textarea class="form-control" id="feedback-comment" rows="4" placeholder="Что понравилось? Что можно улучшить?"></textarea>
            </div>
        `,
        [
            { text: 'Отмена', className: 'btn-secondary' },
            {
                text: 'Отправить',
                className: 'btn-primary',
                onClick: async () => {
                    const rating = parseInt(modal.querySelector('#feedback-rating')?.value || '5', 10);
                    const comment = modal.querySelector('#feedback-comment')?.value || '';

                    if (!comment.trim()) {
                        showNotification('Пожалуйста, напишите комментарий', 'warning');
                        return;
                    }

                    try {
                        await createFeedback({
                            appointmentId: appointment.id,
                            doctorId: appointment.doctorId,
                            rating,
                            comment
                        });

                        showNotification('Спасибо за ваш отзыв!', 'success');
                        modal.close();
                        
                        // Обновить страницу для отображения отправленного отзыва
                        initPatientHistoryPage();
                    } catch (error) {
                        console.error('Ошибка отправки отзыва:', error);
                        showNotification('Ошибка отправки отзыва', 'error');
                    }
                }
            }
        ]
    );
}

// Инициализация UI
export function initUI() {
    setupNavigation();
    setupThemeToggle();
    setupAppNavigationDelegation();
    setupModalAuth();
    updateNavigation();
    setupGlobalEventHandlers();
}

function setupGlobalEventHandlers() {
    // Глобальные обработчики для кнопок
    document.addEventListener('refreshServices', () => {
        initServicesPage();
    });

    document.addEventListener('deleteService', async (e) => {
        const serviceId = e.detail.serviceId;
        try {
            const { deleteService } = await import('./admin.js');
            await deleteService(serviceId);
            showNotification('Услуга удалена', 'success');
            
            // Обновить страницу услуг если мы на ней
            const currentPage = getCurrentPageFromHash();
            if (currentPage === 'admin-services') {
                initAdminServicesPage();
            }
        } catch (error) {
            console.error('Ошибка удаления услуги:', error);
            showNotification('Ошибка удаления услуги', 'error');
        }
    });

    document.addEventListener('editService', async (e) => {
        const serviceId = e.detail.serviceId;
        // Показываем модальное окно редактирования (можно реализовать позже)
        showNotification('Функция редактирования будет добавлена позже', 'info');
    });

    document.addEventListener('updateAppointmentStatus', async (e) => {
        const { appointmentId, status } = e.detail;
        try {
            const { updateAppointmentStatus } = await import('./admin.js');
            await updateAppointmentStatus(appointmentId, status);
            showNotification('Статус обновлен', 'success');
            
            // Обновить текущую страницу
            const currentPage = getCurrentPageFromHash();
            if (currentPage === 'admin-appointments') {
                initAdminAppointmentsPage();
            } else if (currentPage === 'doctor-dashboard') {
                initDoctorDashboardPage();
            }
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            showNotification('Ошибка обновления статуса', 'error');
        }
    });

    document.addEventListener('cancelAppointment', async (e) => {
        const appointmentId = e.detail.appointmentId;
        try {
            const { cancelAppointment } = await import('./admin.js');
            await cancelAppointment(appointmentId);
            showNotification('Запись отменена', 'success');
            
            // Обновить текущую страницу
            const currentPage = getCurrentPageFromHash();
            if (currentPage === 'admin-appointments') {
                initAdminAppointmentsPage();
            } else if (currentPage === 'patient-dashboard') {
                initPatientDashboardPage();
            }
        } catch (error) {
            console.error('Ошибка отмены записи:', error);
            showNotification('Ошибка отмены записи', 'error');
        }
    });
}

function getCurrentPageFromHash() {
    const hash = window.location.hash.replace('#', '').trim();
    return hash || 'home';
}

function setupAppNavigationDelegation() {
    const app = document.getElementById('app');
    if (!app) return;

    // Для кнопок используем data-navigate, а навигацию делаем через hash (app.js обработает hashchange)
    app.addEventListener('click', (e) => {
        const target = e.target.closest('[data-navigate]');
        if (!target) return;

        const page = target.getAttribute('data-navigate');
        if (!page) return;

        window.location.hash = page;
    });
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

// Обработчик делегирования для навигации
document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (!link) return;

    const page = link.getAttribute('data-page');
    if (page === 'login' || page === 'register') {
        e.preventDefault();
        showAuthModal(page);
    }
});

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

    if (!navLinks || !userName || !logoutBtn) return;

    const userData = getCurrentUserData();

    const createLink = (label, page, hash = page) => `<li><a href="#${hash}" data-page="${page}">${label}</a></li>`;

    if (!userData) {
        navLinks.innerHTML = [
            createLink('Главная', 'home', 'home'),
            createLink('Услуги', 'services', 'services'),
            createLink('Вход', 'login', 'login'),
            createLink('Регистрация', 'register', 'register')
        ].join('');

        userName.textContent = '';
        logoutBtn.style.display = 'none';
        return;
    }

    userName.textContent = `Привет, ${userData.fullName || 'пользователь'}!`;
    logoutBtn.style.display = 'inline-block';

    if (userData.role === 'patient') {
        navLinks.innerHTML = [
            createLink('Мои записи', 'patient-dashboard'),
            createLink('Новая запись', 'new-appointment'),
            createLink('Услуги', 'services'),
            createLink('История', 'patient-history'),
            createLink('Профиль', 'patient-profile')
        ].join('');
    } else if (userData.role === 'doctor') {
        navLinks.innerHTML = [
            createLink('Расписание', 'doctor-dashboard'),
            createLink('Пациенты', 'doctor-patients'),
            createLink('Статистика', 'doctor-statistics'),
            createLink('Профиль', 'doctor-profile')
        ].join('');
    } else if (userData.role === 'admin') {
        navLinks.innerHTML = [
            createLink('Панель', 'admin-dashboard'),
            createLink('Услуги', 'admin-services'),
            createLink('Записи', 'admin-appointments'),
            createLink('Врачи', 'admin-doctors'),
            createLink('Материалы', 'admin-materials'),
            createLink('Чеки', 'admin-receipts')
        ].join('');
    }
}

// Навигация между страницами
export async function navigate(page) {
    const app = document.getElementById('app');
    if (!app) return;

    const setContent = async (htmlPromise) => {
        app.innerHTML = await htmlPromise;
    };

    switch (page) {
        case 'home':
            await setContent(loadTemplate('tpl-home'));
            break;
        case 'login':
            await setContent(loadTemplate('tpl-login'));
            break;
        case 'register':
            await setContent(loadTemplate('tpl-register'));
            break;
        case 'services':
            await setContent(loadTemplate('tpl-services'));
            break;

        case 'patient-dashboard':
            if (!requireRole('patient')) return;
            await setContent(loadTemplate('tpl-patient-dashboard'));
            break;
        case 'new-appointment':
            if (!requireRole('patient')) return;
            await setContent(loadTemplate('tpl-new-appointment'));
            break;
        case 'patient-history':
            if (!requireRole('patient')) return;
            await setContent(loadTemplate('tpl-patient-history'));
            break;
        case 'patient-profile':
            if (!requireRole('patient')) return;
            await setContent(loadTemplate('tpl-patient-profile'));
            break;

        case 'doctor-dashboard':
            if (!requireRole('doctor')) return;
            await setContent(loadTemplate('tpl-doctor-dashboard'));
            break;
        case 'doctor-patients':
            if (!requireRole('doctor')) return;
            await setContent(loadTemplate('tpl-doctor-patients'));
            break;
        case 'doctor-statistics':
            if (!requireRole('doctor')) return;
            await setContent(loadTemplate('tpl-doctor-statistics'));
            break;
        case 'doctor-profile':
            if (!requireRole('doctor')) return;
            await setContent(loadTemplate('tpl-doctor-profile'));
            break;

        case 'admin-dashboard':
            if (!requireRole('admin')) return;
            await setContent(loadTemplate('tpl-admin-dashboard'));
            break;
        case 'admin-services':
            if (!requireRole('admin')) return;
            await setContent(loadTemplate('tpl-admin-services'));
            break;
        case 'admin-appointments':
            if (!requireRole('admin')) return;
            await setContent(loadTemplate('tpl-admin-appointments'));
            break;
        case 'admin-doctors':
            if (!requireRole('admin')) return;
            await setContent(loadTemplate('tpl-admin-doctors'));
            break;
        case 'admin-materials':
            if (!requireRole('admin')) return;
            await setContent(loadTemplate('tpl-admin-materials'));
            break;
        case 'admin-receipts':
            if (!requireRole('admin')) return;
            await setContent(loadTemplate('tpl-admin-receipts'));
            break;

        default:
            await setContent(loadTemplate('tpl-home'));
    }

    window.scrollTo(0, 0);
    await initPage(page);
}

function loadTemplate(templateId) {
    const template = document.getElementById(templateId);
    if (!template) {
        return `<div class="card"><h2>Ошибка</h2><p>Шаблон <code>${escapeHtml(templateId)}</code> не найден.</p></div>`;
    }

    return template.innerHTML;
}

function requireRole(role) {
    if (!isAuthenticated()) {
        window.location.hash = 'login';
        return false;
    }

    const userData = getCurrentUserData();
    if (!userData || userData.role !== role) {
        showNotification('Недостаточно прав для доступа к странице', 'warning');
        window.location.hash = 'home';
        return false;
    }

    return true;
}

async function initPage(page) {
    switch (page) {
        case 'services':
            await initServicesPage();
            break;

        case 'patient-dashboard':
            await initPatientDashboardPage();
            break;
        case 'new-appointment':
            await initNewAppointmentPage();
            break;
        case 'patient-history':
            await initPatientHistoryPage();
            break;
        case 'patient-profile':
            await initPatientProfilePage();
            break;

        case 'doctor-dashboard':
            await initDoctorDashboardPage();
            break;
        case 'doctor-patients':
            await initDoctorPatientsPage();
            break;
        case 'doctor-statistics':
            await initDoctorStatisticsPage();
            break;
        case 'doctor-profile':
            await initDoctorProfilePage();
            break;

        case 'admin-dashboard':
            await initAdminDashboardPage();
            break;
        case 'admin-services':
            await initAdminServicesPage();
            break;
        case 'admin-appointments':
            await initAdminAppointmentsPage();
            break;
        case 'admin-doctors':
            await initAdminDoctorsPage();
            break;
        case 'admin-materials':
            await initAdminMaterialsPage();
            break;
        case 'admin-receipts':
            await initAdminReceiptsPage();
            break;

        default:
            break;
    }
}

async function initServicesPage() {
    const list = document.getElementById('services-list');
    if (!list) return;

    // Удаляем старый обработчик и добавляем новый через event listener
    const refreshBtn = document.querySelector('[data-action="refresh-services"]');
    if (refreshBtn) {
        refreshBtn.onclick = null; // Убираем старый обработчик
        refreshBtn.addEventListener('click', () => initServicesPage());
    }

    // Добавляем обработчик CustomEvent для глобального обновления
    const refreshServicesHandler = () => initServicesPage();
    document.addEventListener('refreshServices', refreshServicesHandler);

    list.innerHTML = '<p>Загрузка услуг...</p>';

    const services = await loadServices();

    if (!services.length) {
        list.innerHTML = '<p>Список услуг пуст.</p>';
        return;
    }

    list.innerHTML = services.map(renderServiceCard).join('');
}

async function initPatientDashboardPage() {
    const tbody = document.getElementById('patient-appointments-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4">Загрузка...</td></tr>';

    try {
        const [{ getPatientAppointments }, servicesMap, doctorsMap] = await Promise.all([
            import('./patient.js'),
            loadServicesMap(),
            loadDoctorsMap()
        ]);

        const appointments = await getPatientAppointments();

        if (!appointments.length) {
            tbody.innerHTML = '<tr><td colspan="4">У вас пока нет записей. Нажмите «Новая запись».</td></tr>';
            return;
        }

        tbody.innerHTML = appointments
            .map((a) => {
                const dt = toDate(a.dateTime);
                const service = servicesMap.get(a.serviceId);
                const doctor = doctorsMap.get(a.doctorId);

                return `
                    <tr>
                        <td>${escapeHtml(formatDateTime(dt) || '')}</td>
                        <td>${escapeHtml(service?.name || a.serviceId || '')}</td>
                        <td>${escapeHtml(doctor?.fullName || a.doctorId || '')}</td>
                        <td>${renderStatusBadge(a.status)}</td>
                    </tr>
                `;
            })
            .join('');
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4">Не удалось загрузить записи. Проверьте подключение и настройки Firebase.</td></tr>';
    }
}

async function initNewAppointmentPage() {
    const form = document.getElementById('new-appointment-form');
    const serviceSelect = document.getElementById('appointment-service');
    const doctorSelect = document.getElementById('appointment-doctor');
    const dateTimeInput = document.getElementById('appointment-datetime');

    if (!form || !serviceSelect || !doctorSelect || !dateTimeInput) return;

    dateTimeInput.min = new Date().toISOString().slice(0, 16);

    const [services, doctors] = await Promise.all([loadServices(), loadDoctors()]);

    serviceSelect.innerHTML = services
        .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${escapeHtml(formatPrice(s.price))})</option>`)
        .join('');

    doctorSelect.innerHTML = doctors
        .map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.fullName || d.email || d.id)}</option>`)
        .join('');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const serviceId = serviceSelect.value;
        const doctorId = doctorSelect.value;
        const dateTimeValue = dateTimeInput.value;
        const notes = document.getElementById('appointment-notes')?.value || '';

        if (!serviceId || !doctorId || !dateTimeValue) {
            showNotification('Заполните все обязательные поля', 'warning');
            return;
        }

        try {
            const { createAppointment } = await import('./patient.js');
            await createAppointment({
                serviceId,
                doctorId,
                dateTime: new Date(dateTimeValue),
                notes
            });

            navigate('patient-dashboard');
        } catch (error) {
            console.error(error);
        }
    });
}

async function initPatientHistoryPage() {
    const tbody = document.getElementById('patient-history-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4">Загрузка...</td></tr>';

    try {
        const [{ getPatientHistory, createFeedback }, servicesMap, doctorsMap] = await Promise.all([
            import('./patient.js'),
            loadServicesMap(),
            loadDoctorsMap()
        ]);

        const history = await getPatientHistory();

        if (!history.length) {
            tbody.innerHTML = '<tr><td colspan="4">История пока пуста.</td></tr>';
            return;
        }

        tbody.innerHTML = history
            .map((a) => {
                const dt = toDate(a.dateTime);
                const service = servicesMap.get(a.serviceId);
                const doctor = doctorsMap.get(a.doctorId);

                return `
                    <tr>
                        <td>${escapeHtml(formatDateTime(dt) || '')}</td>
                        <td>${escapeHtml(service?.name || a.serviceId || '')}</td>
                        <td>${escapeHtml(doctor?.fullName || a.doctorId || '')}</td>
                        <td>
                            <button class="btn btn-outline btn-sm" type="button" data-action="feedback" data-appointment-id="${escapeHtml(a.id)}" data-doctor-id="${escapeHtml(a.doctorId)}">
                                Оставить отзыв
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join('');

        // Добавляем глобальные обработчики событий
        const showFeedbackHandler = (e) => {
            const appointmentId = e.detail.appointmentId;
            const historyItem = history.find(a => a.id === appointmentId);
            if (historyItem) {
                showFeedbackModal(historyItem, createFeedback, servicesMap, doctorsMap);
            }
        };
        
        document.addEventListener('showFeedback', showFeedbackHandler);

        // Локальный обработчик для обратной совместимости
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action="feedback"]');
            if (!btn) return;

            const appointmentId = btn.getAttribute('data-appointment-id');
            const doctorId = btn.getAttribute('data-doctor-id');
            if (!appointmentId || !doctorId) return;

            const historyItem = history.find(a => a.id === appointmentId);
            if (historyItem) {
                showFeedbackModal(historyItem, createFeedback, servicesMap, doctorsMap);
            }
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4">Не удалось загрузить историю.</td></tr>';
    }
}

async function initPatientProfilePage() {
    const fullNameInput = document.getElementById('profile-fullname');
    const phoneInput = document.getElementById('profile-phone');
    const emailInput = document.getElementById('profile-email');
    const form = document.getElementById('patient-profile-form');

    if (!fullNameInput || !phoneInput || !emailInput || !form) return;

    const userData = getCurrentUserData();
    fullNameInput.value = userData?.fullName || '';
    phoneInput.value = userData?.phone || '';
    emailInput.value = userData?.email || '';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const profileData = {
            fullName: fullNameInput.value.trim(),
            phone: phoneInput.value.trim()
        };

        try {
            const { updatePatientProfile } = await import('./patient.js');
            await updatePatientProfile(profileData);

            if (userData) {
                Object.assign(userData, profileData);
                updateNavigation();
            }
        } catch (error) {
            console.error(error);
        }
    });
}

async function initDoctorDashboardPage() {
    const tbody = document.getElementById('doctor-schedule-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5">Загрузка...</td></tr>';

    try {
        const [{ getDoctorSchedule, completeAppointment, updateAppointmentNotes }, servicesMap] = await Promise.all([
            import('./doctor.js'),
            loadServicesMap()
        ]);

        const schedule = await getDoctorSchedule();

        if (!schedule.length) {
            tbody.innerHTML = '<tr><td colspan="5">В расписании пока нет записей.</td></tr>';
            return;
        }

        tbody.innerHTML = schedule
            .map((a) => {
                const dt = toDate(a.dateTime);
                const service = servicesMap.get(a.serviceId);

                const actions = a.status === 'scheduled'
                    ? `
                        <button class="btn btn-outline btn-sm" type="button" data-action="notes" data-appointment-id="${escapeHtml(a.id)}">Заметки</button>
                        <button class="btn btn-primary btn-sm" type="button" data-action="complete" data-appointment-id="${escapeHtml(a.id)}">Завершить</button>
                    `
                    : `<button class="btn btn-outline btn-sm" type="button" data-action="notes" data-appointment-id="${escapeHtml(a.id)}">Заметки</button>`;

                return `
                    <tr>
                        <td>${escapeHtml(formatDateTime(dt) || '')}</td>
                        <td>${escapeHtml(a.patientId || '')}</td>
                        <td>${escapeHtml(service?.name || a.serviceId || '')}</td>
                        <td>${renderStatusBadge(a.status)}</td>
                        <td style="white-space: nowrap;">${actions}</td>
                    </tr>
                `;
            })
            .join('');

        tbody.onclick = (e) => {
            const completeBtn = e.target.closest('button[data-action="complete"]');
            if (completeBtn) {
                const appointmentId = completeBtn.getAttribute('data-appointment-id');
                if (!appointmentId) return;

                confirm('Завершить прием?', async () => {
                    try {
                        await completeAppointment(appointmentId);
                        initDoctorDashboardPage();
                    } catch (error) {
                        console.error(error);
                    }
                });

                return;
            }

            const notesBtn = e.target.closest('button[data-action="notes"]');
            if (notesBtn) {
                const appointmentId = notesBtn.getAttribute('data-appointment-id');
                if (!appointmentId) return;

                const modal = createModal(
                    'Заметки и диагноз',
                    `
                        <div class="form-group">
                            <label class="form-label" for="notes">Заметки</label>
                            <textarea class="form-control" id="notes" rows="4" placeholder="Ход лечения, рекомендации..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="diagnosis">Диагноз</label>
                            <input class="form-control" id="diagnosis" placeholder="Например: кариес, пульпит...">
                        </div>
                    `,
                    [
                        { text: 'Отмена', className: 'btn-secondary' },
                        {
                            text: 'Сохранить',
                            className: 'btn-primary',
                            onClick: async () => {
                                const notes = modal.querySelector('#notes')?.value || '';
                                const diagnosis = modal.querySelector('#diagnosis')?.value || '';

                                try {
                                    await updateAppointmentNotes(appointmentId, notes, diagnosis);
                                    initDoctorDashboardPage();
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        }
                    ]
                );
            }
        };
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5">Не удалось загрузить расписание.</td></tr>';
    }
}

async function initDoctorPatientsPage() {
    const tbody = document.getElementById('doctor-patients-tbody');
    const searchInput = document.getElementById('doctor-patient-search');
    if (!tbody || !searchInput) return;

    tbody.innerHTML = '<tr><td colspan="3">Загрузка...</td></tr>';

    try {
        const { getDoctorPatients } = await import('./doctor.js');
        const patients = await getDoctorPatients();

        const render = (rows) => {
            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="3">Пациенты не найдены.</td></tr>';
                return;
            }

            tbody.innerHTML = rows
                .map((p) => `
                    <tr>
                        <td>${escapeHtml(p.fullName || '')}</td>
                        <td>${escapeHtml(p.phone || '')}</td>
                        <td>${escapeHtml(p.email || '')}</td>
                    </tr>
                `)
                .join('');
        };

        render(patients);

        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            if (!q) {
                render(patients);
                return;
            }

            render(
                patients.filter((p) => {
                    const name = (p.fullName || '').toLowerCase();
                    const phone = (p.phone || '').toLowerCase();
                    return name.includes(q) || phone.includes(q);
                })
            );
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="3">Не удалось загрузить пациентов.</td></tr>';
    }
}

async function initDoctorStatisticsPage() {
    const statsEl = document.getElementById('doctor-stats');
    const feedbacksEl = document.getElementById('doctor-feedbacks');
    if (!statsEl || !feedbacksEl) return;

    statsEl.innerHTML = '<p>Загрузка...</p>';
    feedbacksEl.innerHTML = '';

    try {
        const { getDoctorStatistics, getDoctorFeedbacks } = await import('./doctor.js');

        const [stats, feedbackData] = await Promise.all([getDoctorStatistics(), getDoctorFeedbacks()]);

        statsEl.innerHTML = [
            renderStatCard('Всего', stats.total),
            renderStatCard('Запланировано', stats.scheduled),
            renderStatCard('Завершено', stats.completed)
        ].join('');

        feedbacksEl.innerHTML = `
            <div class="mb-1"><strong>Средняя оценка:</strong> ${escapeHtml(feedbackData.averageRating)} (${feedbackData.totalFeedbacks})</div>
            <div>
                ${(feedbackData.feedbacks || [])
                    .slice(0, 10)
                    .map((f) => `
                        <div class="card" style="padding: 1rem;">
                            <div class="flex-between">
                                <div>${generateStarRating(f.rating || 0)}</div>
                                <div class="text-secondary" style="font-size: 0.9rem;">${escapeHtml(toDate(f.date) ? formatDateTime(toDate(f.date)) : '')}</div>
                            </div>
                            <div class="mt-1">${escapeHtml(f.comment || '')}</div>
                        </div>
                    `)
                    .join('')}
            </div>
        `;
    } catch (error) {
        console.error(error);
        statsEl.innerHTML = '<p>Не удалось загрузить статистику.</p>';
    }
}

async function initDoctorProfilePage() {
    const container = document.getElementById('doctor-profile-info');
    if (!container) return;

    const userData = getCurrentUserData();

    container.innerHTML = `
        <div class="grid grid-2">
            <div class="card" style="padding: 1rem;">
                <div class="text-secondary">ФИО</div>
                <div><strong>${escapeHtml(userData?.fullName || '')}</strong></div>
            </div>
            <div class="card" style="padding: 1rem;">
                <div class="text-secondary">Email</div>
                <div><strong>${escapeHtml(userData?.email || '')}</strong></div>
            </div>
        </div>
    `;
}

async function initAdminDashboardPage() {
    const statsEl = document.getElementById('admin-stats');
    if (!statsEl) return;

    statsEl.innerHTML = '<p>Загрузка...</p>';

    try {
        const { getAdminStatistics } = await import('./admin.js');
        const stats = await getAdminStatistics();

        statsEl.innerHTML = [
            renderStatCard('Записей всего', stats.totalAppointments),
            renderStatCard('Запланировано', stats.scheduledAppointments),
            renderStatCard('Завершено', stats.completedAppointments),
            renderStatCard('Отменено', stats.cancelledAppointments),
            renderStatCard('Пациентов', stats.totalPatients),
            renderStatCard('Врачей', stats.totalDoctors),
            renderStatCard('Услуг', stats.totalServices),
            renderStatCard('Материалов', stats.totalMaterials)
        ].join('');
    } catch (error) {
        console.error(error);
        statsEl.innerHTML = '<p>Не удалось загрузить статистику.</p>';
    }
}

async function initAdminServicesPage() {
    const tbody = document.getElementById('admin-services-tbody');
    const form = document.getElementById('admin-add-service-form');

    if (!tbody || !form) return;

    const reload = async () => {
        tbody.innerHTML = '<tr><td colspan="4">Загрузка...</td></tr>';

        try {
            const { getAllServices } = await import('./admin.js');
            const services = await getAllServices();

            if (!services.length) {
                tbody.innerHTML = '<tr><td colspan="4">Услуги отсутствуют.</td></tr>';
                return;
            }

            tbody.innerHTML = services
                .map((s) => `
                    <tr>
                        <td>${escapeHtml(s.name || '')}</td>
                        <td>${escapeHtml(s.category || '')}</td>
                        <td>${escapeHtml(formatPrice(s.price))}</td>
                        <td style="white-space: nowrap;">
                            <button class="btn btn-outline btn-sm" type="button" data-action="edit" data-id="${escapeHtml(s.id)}">Редактировать</button>
                            <button class="btn btn-secondary btn-sm" type="button" data-action="delete" data-id="${escapeHtml(s.id)}">Удалить</button>
                        </td>
                    </tr>
                `)
                .join('');

            tbody.dataset.items = JSON.stringify(services);
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="4">Не удалось загрузить услуги.</td></tr>';
        }
    };

    await reload();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('service-name')?.value || '',
            category: document.getElementById('service-category')?.value || '',
            price: document.getElementById('service-price')?.value || '',
            description: document.getElementById('service-description')?.value || ''
        };

        try {
            const { addService } = await import('./admin.js');
            await addService(data);
            form.reset();
            await reload();
        } catch (error) {
            console.error(error);
        }
    });

    tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (!id || !action) return;

        const items = safeJsonParse(tbody.dataset.items) || [];
        const service = items.find((s) => s.id === id);

        if (action === 'delete') {
            confirm('Удалить услугу?', async () => {
                try {
                    const { deleteService } = await import('./admin.js');
                    await deleteService(id);
                    await reload();
                } catch (error) {
                    console.error(error);
                }
            });
            return;
        }

        if (action === 'edit' && service) {
            const modal = createModal(
                'Редактирование услуги',
                `
                    <div class="form-group">
                        <label class="form-label" for="edit-name">Название</label>
                        <input class="form-control" id="edit-name" value="${escapeHtml(service.name || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="edit-category">Категория</label>
                        <input class="form-control" id="edit-category" value="${escapeHtml(service.category || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="edit-price">Цена</label>
                        <input class="form-control" id="edit-price" type="number" min="0" step="0.01" value="${escapeHtml(String(service.price ?? ''))}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="edit-description">Описание</label>
                        <textarea class="form-control" id="edit-description" rows="3">${escapeHtml(service.description || '')}</textarea>
                    </div>
                `,
                [
                    { text: 'Отмена', className: 'btn-secondary' },
                    {
                        text: 'Сохранить',
                        className: 'btn-primary',
                        onClick: async () => {
                            try {
                                const { updateService } = await import('./admin.js');
                                await updateService(id, {
                                    name: modal.querySelector('#edit-name')?.value || '',
                                    category: modal.querySelector('#edit-category')?.value || '',
                                    price: parseFloat(modal.querySelector('#edit-price')?.value || '0'),
                                    description: modal.querySelector('#edit-description')?.value || ''
                                });
                                await reload();
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }
                ]
            );
        }
    });
}

async function initAdminAppointmentsPage() {
    const tbody = document.getElementById('admin-appointments-tbody');
    if (!tbody) return;

    const reload = async () => {
        tbody.innerHTML = '<tr><td colspan="6">Загрузка...</td></tr>';

        try {
            const [{ getAllAppointments, cancelAppointment }, servicesMap, doctorsMap] = await Promise.all([
                import('./admin.js'),
                loadServicesMap(),
                loadDoctorsMap()
            ]);

            const appointments = await getAllAppointments();

            if (!appointments.length) {
                tbody.innerHTML = '<tr><td colspan="6">Записей нет.</td></tr>';
                return;
            }

            tbody.innerHTML = appointments
                .map((a) => {
                    const dt = toDate(a.dateTime);
                    const service = servicesMap.get(a.serviceId);
                    const doctor = doctorsMap.get(a.doctorId);

                    const canCancel = a.status === 'scheduled';

                    return `
                        <tr>
                            <td>${escapeHtml(formatDateTime(dt) || '')}</td>
                            <td>${escapeHtml(a.patientId || '')}</td>
                            <td>${escapeHtml(doctor?.fullName || a.doctorId || '')}</td>
                            <td>${escapeHtml(service?.name || a.serviceId || '')}</td>
                            <td>${renderStatusBadge(a.status)}</td>
                            <td>
                                ${canCancel ? `<button class="btn btn-secondary btn-sm" type="button" data-action="cancel" data-id="${escapeHtml(a.id)}">Отменить</button>` : ''}
                            </td>
                        </tr>
                    `;
                })
                .join('');

            tbody.onclick = (e) => {
                const btn = e.target.closest('button[data-action="cancel"]');
                if (!btn) return;

                const id = btn.getAttribute('data-id');
                if (!id) return;

                confirm('Отменить запись?', async () => {
                    try {
                        await cancelAppointment(id);
                        await reload();
                    } catch (error) {
                        console.error(error);
                    }
                });
            };
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="6">Не удалось загрузить записи.</td></tr>';
        }
    };

    await reload();
}

async function initAdminDoctorsPage() {
    const tbody = document.getElementById('admin-doctors-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6">Загрузка...</td></tr>';

    try {
        const { getAllDoctors, updateDoctorSchedule } = await import('./admin.js');
        const doctors = await getAllDoctors();

        if (!doctors.length) {
            tbody.innerHTML = '<tr><td colspan="6">Врачи не найдены.</td></tr>';
            return;
        }

        tbody.innerHTML = doctors
            .map((d) => `
                <tr>
                    <td>${escapeHtml(d.fullName || '')}</td>
                    <td>${escapeHtml(d.email || '')}</td>
                    <td>${escapeHtml(d.phone || '')}</td>
                    <td>${escapeHtml(d.averageRating || 'N/A')}</td>
                    <td>${escapeHtml(String(d.appointmentsCount ?? 0))}</td>
                    <td>
                        <button class="btn btn-outline btn-sm" type="button" data-action="schedule" data-id="${escapeHtml(d.id)}">Расписание</button>
                    </td>
                </tr>
            `)
            .join('');

        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action="schedule"]');
            if (!btn) return;

            const doctorId = btn.getAttribute('data-id');
            if (!doctorId) return;

            const modal = createModal(
                'Расписание врача',
                `
                    <div class="form-help mb-1">Введите расписание в формате JSON (например: {\"mon\": [\"10:00-18:00\"], \"tue\": [\"10:00-18:00\"]}).</div>
                    <textarea class="form-control" id="schedule-json" rows="8" placeholder='{"mon": ["10:00-18:00"]}'></textarea>
                `,
                [
                    { text: 'Отмена', className: 'btn-secondary' },
                    {
                        text: 'Сохранить',
                        className: 'btn-primary',
                        onClick: async () => {
                            const json = modal.querySelector('#schedule-json')?.value || '';
                            const parsed = safeJsonParse(json);

                            if (!parsed) {
                                showNotification('Некорректный JSON', 'warning');
                                return;
                            }

                            try {
                                await updateDoctorSchedule(doctorId, parsed);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }
                ]
            );
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="6">Не удалось загрузить врачей.</td></tr>';
    }
}

async function initAdminMaterialsPage() {
    const tbody = document.getElementById('admin-materials-tbody');
    const form = document.getElementById('admin-add-material-form');

    if (!tbody || !form) return;

    const reload = async () => {
        tbody.innerHTML = '<tr><td colspan="4">Загрузка...</td></tr>';

        try {
            const { getAllMaterials } = await import('./admin.js');
            const materials = await getAllMaterials();

            if (!materials.length) {
                tbody.innerHTML = '<tr><td colspan="4">Материалов нет.</td></tr>';
                return;
            }

            tbody.innerHTML = materials
                .map((m) => `
                    <tr>
                        <td>${escapeHtml(m.name || '')}</td>
                        <td>${escapeHtml(String(m.quantity ?? ''))}</td>
                        <td>${escapeHtml(formatPrice(m.cost || 0))}</td>
                        <td style="white-space: nowrap;">
                            <button class="btn btn-outline btn-sm" type="button" data-action="edit" data-id="${escapeHtml(m.id)}">Редактировать</button>
                            <button class="btn btn-secondary btn-sm" type="button" data-action="delete" data-id="${escapeHtml(m.id)}">Удалить</button>
                        </td>
                    </tr>
                `)
                .join('');

            tbody.dataset.items = JSON.stringify(materials);
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="4">Не удалось загрузить материалы.</td></tr>';
        }
    };

    await reload();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('material-name')?.value || '',
            quantity: document.getElementById('material-quantity')?.value || '',
            cost: document.getElementById('material-cost')?.value || ''
        };

        try {
            const { addMaterial } = await import('./admin.js');
            await addMaterial(data);
            form.reset();
            await reload();
        } catch (error) {
            console.error(error);
        }
    });

    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (!id || !action) return;

        const items = safeJsonParse(tbody.dataset.items) || [];
        const material = items.find((m) => m.id === id);

        if (action === 'delete') {
            confirm('Удалить материал?', async () => {
                try {
                    const { deleteMaterial } = await import('./admin.js');
                    await deleteMaterial(id);
                    await reload();
                } catch (error) {
                    console.error(error);
                }
            });
            return;
        }

        if (action === 'edit' && material) {
            const modal = createModal(
                'Редактирование материала',
                `
                    <div class="form-group">
                        <label class="form-label" for="edit-name">Название</label>
                        <input class="form-control" id="edit-name" value="${escapeHtml(material.name || '')}">
                    </div>
                    <div class="grid grid-2" style="gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label" for="edit-quantity">Количество</label>
                            <input class="form-control" id="edit-quantity" type="number" min="0" step="1" value="${escapeHtml(String(material.quantity ?? ''))}">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="edit-cost">Стоимость</label>
                            <input class="form-control" id="edit-cost" type="number" min="0" step="0.01" value="${escapeHtml(String(material.cost ?? ''))}">
                        </div>
                    </div>
                `,
                [
                    { text: 'Отмена', className: 'btn-secondary' },
                    {
                        text: 'Сохранить',
                        className: 'btn-primary',
                        onClick: async () => {
                            try {
                                const { updateMaterial } = await import('./admin.js');
                                await updateMaterial(id, {
                                    name: modal.querySelector('#edit-name')?.value || '',
                                    quantity: parseInt(modal.querySelector('#edit-quantity')?.value || '0', 10),
                                    cost: parseFloat(modal.querySelector('#edit-cost')?.value || '0')
                                });
                                await reload();
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }
                ]
            );
        }
    });
}

async function initAdminReceiptsPage() {
    const tbody = document.getElementById('admin-receipts-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5">Загрузка...</td></tr>';

    try {
        const [{ getAllTransactions }, servicesMap, doctorsMap] = await Promise.all([
            import('./admin.js'),
            loadServicesMap(),
            loadDoctorsMap()
        ]);
        const { generateReceiptPDF } = await import('./notifications.js');

        const transactions = await getAllTransactions();

        if (!transactions.length) {
            tbody.innerHTML = '<tr><td colspan="5">Завершенных приемов нет.</td></tr>';
            return;
        }

        tbody.innerHTML = transactions
            .map((a) => {
                const dt = toDate(a.dateTime);
                const service = servicesMap.get(a.serviceId);
                const doctor = doctorsMap.get(a.doctorId);

                return `
                    <tr>
                        <td>${escapeHtml(formatDateTime(dt) || '')}</td>
                        <td>${escapeHtml(a.patientId || '')}</td>
                        <td>${escapeHtml(doctor?.fullName || a.doctorId || '')}</td>
                        <td>${escapeHtml(service?.name || a.serviceId || '')}</td>
                        <td>
                            <button class="btn btn-outline btn-sm" type="button" data-action="receipt" data-id="${escapeHtml(a.id)}">PDF</button>
                        </td>
                    </tr>
                `;
            })
            .join('');

        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action="receipt"]');
            if (!btn) return;

            const id = btn.getAttribute('data-id');
            const appointment = transactions.find((t) => t.id === id);
            if (!appointment) return;

            const dt = toDate(appointment.dateTime);
            const service = servicesMap.get(appointment.serviceId);

            generateReceiptPDF({
                receiptNumber: appointment.id,
                date: dt ? formatDateTime(dt) : '',
                patientName: appointment.patientId || '',
                doctorName: doctorsMap.get(appointment.doctorId)?.fullName || appointment.doctorId || '',
                services: [
                    {
                        name: service?.name || appointment.serviceId || 'Услуга',
                        price: service?.price || 0
                    }
                ],
                totalAmount: service?.price || 0
            });
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5">Не удалось загрузить чеки.</td></tr>';
    }
}

async function loadServices() {
    if (cachedServices) return cachedServices;

    try {
        const { getServices } = await import('./patient.js');
        cachedServices = await getServices();

        if (!Array.isArray(cachedServices) || cachedServices.length === 0) {
            cachedServices = fallbackServices;
        }

        return cachedServices;
    } catch (error) {
        console.error(error);
        showNotification('Не удалось загрузить услуги из базы данных. Показаны демо-данные.', 'info');
        cachedServices = fallbackServices;
        return cachedServices;
    }
}

async function loadDoctors() {
    if (cachedDoctors) return cachedDoctors;

    try {
        const { getDoctors } = await import('./patient.js');
        cachedDoctors = await getDoctors();

        if (!Array.isArray(cachedDoctors) || cachedDoctors.length === 0) {
            cachedDoctors = fallbackDoctors;
        }

        return cachedDoctors;
    } catch (error) {
        console.error(error);
        showNotification('Не удалось загрузить врачей из базы данных. Показаны демо-данные.', 'info');
        cachedDoctors = fallbackDoctors;
        return cachedDoctors;
    }
}

async function loadServicesMap() {
    const services = await loadServices();
    return new Map(services.map((s) => [s.id, s]));
}

async function loadDoctorsMap() {
    const doctors = await loadDoctors();
    return new Map(doctors.map((d) => [d.id, d]));
}

function renderServiceCard(service) {
    return `
        <div class="card service-card">
            <div class="flex-between">
                <h3 style="margin: 0;">${escapeHtml(service.name || '')}</h3>
                <span class="badge">${escapeHtml(service.category || '')}</span>
            </div>
            <div class="mt-1 text-secondary">${escapeHtml(service.description || '')}</div>
            <div class="mt-2"><strong>${escapeHtml(formatPrice(service.price || 0))}</strong></div>
        </div>
    `;
}

function renderStatusBadge(status) {
    const normalized = String(status || '').toLowerCase();

    const map = {
        scheduled: { label: 'Запланировано', className: 'badge-warning' },
        completed: { label: 'Завершено', className: 'badge-success' },
        cancelled: { label: 'Отменено', className: 'badge-danger' }
    };

    const item = map[normalized] || { label: normalized || '—', className: 'badge-secondary' };
    return `<span class="badge ${item.className}">${escapeHtml(item.label)}</span>`;
}

function renderStatCard(label, value) {
    return `
        <div class="card" style="padding: 1rem; margin-bottom: 0;">
            <div class="text-secondary">${escapeHtml(label)}</div>
            <div style="font-size: 1.8rem; font-weight: 700;">${escapeHtml(String(value ?? '0'))}</div>
        </div>
    `;
}

function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();

    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function safeJsonParse(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

// Функции для работы с модальным окном авторизации
function setupModalAuth() {
    const modal = document.getElementById('auth-modal');
    const loginTab = document.getElementById('auth-tab-login');
    const registerTab = document.getElementById('auth-tab-register');
    const closeBtn = document.getElementById('auth-modal-close');
    
    if (!modal || !loginTab || !registerTab || !closeBtn) {
        console.error('Modal elements not found');
        return;
    }

    // Закрытие модального окна
    closeBtn.addEventListener('click', hideAuthModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideAuthModal();
        }
    });

    // Переключение вкладок
    loginTab.addEventListener('click', () => showAuthTab('login'));
    registerTab.addEventListener('click', () => showAuthTab('register'));
}

export function showAuthModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    const body = document.getElementById('auth-modal-body');
    
    if (!modal || !body) return;

    // Загрузить нужный шаблон
    const templateId = tab === 'login' ? 'tpl-login' : 'tpl-register';
    body.innerHTML = loadTemplate(templateId);

    // Показать модальное окно
    showAuthTab(tab);
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);

    // Инициализировать форму
    setTimeout(() => {
        if (tab === 'login') {
            initLoginForm();
        } else {
            initRegisterForm();
        }
    }, 100);
}

export function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function showAuthTab(tab) {
    const modal = document.getElementById('auth-modal');
    const loginTab = document.getElementById('auth-tab-login');
    const registerTab = document.getElementById('auth-tab-register');
    const body = document.getElementById('auth-modal-body');

    if (!modal || !loginTab || !registerTab || !body) return;

    // Переключить активную вкладку
    loginTab.classList.toggle('active', tab === 'login');
    registerTab.classList.toggle('active', tab === 'register');

    // Загрузить нужный шаблон
    const templateId = tab === 'login' ? 'tpl-login' : 'tpl-register';
    body.innerHTML = loadTemplate(templateId);

    // Инициализировать форму
    setTimeout(() => {
        if (tab === 'login') {
            initLoginForm();
        } else {
            initRegisterForm();
        }
    }, 100);
}

function initLoginForm() {
    const form = document.querySelector('#login-form');
    const googleBtn = document.querySelector('#google-login-btn');
    const forgotLink = document.querySelector('#forgot-password-link');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLoginModal();
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const { loginWithGoogle } = await import('./auth.js');
            try {
                hideAuthModal();
                await loginWithGoogle();
            } catch (error) {
                console.error('Ошибка входа через Google:', error);
            }
        });
    }

    if (forgotLink) {
        forgotLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('Введите ваш email для восстановления пароля:');
            if (!email) return;

            const { resetPassword, showNotification } = await import('./auth.js');
            try {
                await resetPassword(email);
            } catch (error) {
                console.error('Ошибка восстановления пароля:', error);
            }
        });
    }
}

function initRegisterForm() {
    const form = document.querySelector('#register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleRegisterModal();
    });
}

async function handleLoginModal() {
    const email = document.querySelector('#login-email')?.value;
    const password = document.querySelector('#login-password')?.value;
    
    if (!email || !password) {
        const { showNotification } = await import('./utils.js');
        showNotification('Заполните все поля', 'warning');
        return;
    }

    try {
        const { login } = await import('./auth.js');
        hideAuthModal();
        await login(email, password);
    } catch (error) {
        console.error('Ошибка входа:', error);
    }
}

async function handleRegisterModal() {
    const fullName = document.querySelector('#register-fullname')?.value;
    const email = document.querySelector('#register-email')?.value;
    const phone = document.querySelector('#register-phone')?.value;
    const password = document.querySelector('#register-password')?.value;
    const passwordConfirm = document.querySelector('#register-password-confirm')?.value;

    // Валидация
    if (!fullName || !email || !phone || !password) {
        const { showNotification } = await import('./utils.js');
        showNotification('Заполните все поля', 'warning');
        return;
    }

    const { validateEmail, validatePhone, showNotification } = await import('./utils.js');
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
        const { register } = await import('./auth.js');
        hideAuthModal();
        await register(email, password, { fullName, phone });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
    }
}

// Экспорт для глобального доступа
window.ui = {
    navigate,
    updateNavigation,
    showAuthModal,
    hideAuthModal
};

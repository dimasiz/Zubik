// Функции для администраторов
import { db } from './firebase-config.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showLoading, hideLoading, showNotification } from './utils.js';

// Управление услугами

// Получить все услуги
export async function getAllServices() {
    try {
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        return servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения услуг:', error);
        throw error;
    }
}

// Добавить новую услугу
export async function addService(serviceData) {
    try {
        showLoading();
        
        const service = {
            name: serviceData.name,
            category: serviceData.category,
            price: parseFloat(serviceData.price),
            description: serviceData.description || '',
            createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'services'), service);
        
        showNotification('Услуга добавлена', 'success');
        hideLoading();
        return { id: docRef.id, ...service };
    } catch (error) {
        hideLoading();
        showNotification('Ошибка добавления услуги', 'danger');
        throw error;
    }
}

// Обновить услугу
export async function updateService(serviceId, serviceData) {
    try {
        showLoading();
        
        await updateDoc(doc(db, 'services', serviceId), serviceData);
        
        showNotification('Услуга обновлена', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Ошибка обновления услуги', 'danger');
        throw error;
    }
}

// Удалить услугу
export async function deleteService(serviceId) {
    try {
        showLoading();
        
        await deleteDoc(doc(db, 'services', serviceId));
        
        showNotification('Услуга удалена', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Ошибка удаления услуги', 'danger');
        throw error;
    }
}

// Управление записями

// Получить все записи
export async function getAllAppointments() {
    try {
        const q = query(collection(db, 'appointments'), orderBy('dateTime', 'desc'));
        const appointmentsSnapshot = await getDocs(q);
        return appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения записей:', error);
        throw error;
    }
}

// Отменить запись
export async function cancelAppointment(appointmentId) {
    try {
        showLoading();
        
        await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'cancelled'
        });
        
        showNotification('Запись отменена', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Ошибка отмены записи', 'danger');
        throw error;
    }
}

// Управление врачами

// Получить всех врачей
export async function getAllDoctors() {
    try {
        const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
        const doctorsSnapshot = await getDocs(q);
        
        const doctors = [];
        for (const docSnapshot of doctorsSnapshot.docs) {
            const doctorData = { id: docSnapshot.id, ...docSnapshot.data() };
            
            // Получить статистику врача
            const appointmentsQuery = query(
                collection(db, 'appointments'),
                where('doctorId', '==', docSnapshot.id)
            );
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            doctorData.appointmentsCount = appointmentsSnapshot.size;
            
            // Получить средний рейтинг
            const feedbacksQuery = query(
                collection(db, 'feedbacks'),
                where('doctorId', '==', docSnapshot.id)
            );
            const feedbacksSnapshot = await getDocs(feedbacksQuery);
            const feedbacks = feedbacksSnapshot.docs.map(d => d.data());
            doctorData.averageRating = feedbacks.length > 0
                ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
                : 'N/A';
            
            doctors.push(doctorData);
        }
        
        return doctors;
    } catch (error) {
        console.error('Ошибка получения врачей:', error);
        throw error;
    }
}

// Обновить расписание врача
export async function updateDoctorSchedule(doctorId, scheduleData) {
    try {
        showLoading();
        
        const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
        if (!doctorDoc.exists()) {
            // Создать документ врача, если не существует
            await setDoc(doc(db, 'doctors', doctorId), {
                userId: doctorId,
                schedule: scheduleData
            });
        } else {
            await updateDoc(doc(db, 'doctors', doctorId), {
                schedule: scheduleData
            });
        }
        
        showNotification('Расписание обновлено', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Ошибка обновления расписания', 'danger');
        throw error;
    }
}

// Управление материалами

// Получить все материалы
export async function getAllMaterials() {
    try {
        const q = query(collection(db, 'materials'), orderBy('date', 'desc'));
        const materialsSnapshot = await getDocs(q);
        return materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения материалов:', error);
        throw error;
    }
}

// Добавить материал
export async function addMaterial(materialData) {
    try {
        showLoading();
        
        const material = {
            name: materialData.name,
            quantity: parseInt(materialData.quantity),
            cost: parseFloat(materialData.cost),
            date: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'materials'), material);
        
        showNotification('Материал добавлен', 'success');
        hideLoading();
        return { id: docRef.id, ...material };
    } catch (error) {
        hideLoading();
        showNotification('Ошибка добавления материала', 'danger');
        throw error;
    }
}

// Обновить материал
export async function updateMaterial(materialId, materialData) {
    try {
        showLoading();
        
        await updateDoc(doc(db, 'materials', materialId), materialData);
        
        showNotification('Материал обновлен', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Ошибка обновления материала', 'danger');
        throw error;
    }
}

// Удалить материал
export async function deleteMaterial(materialId) {
    try {
        showLoading();
        
        await deleteDoc(doc(db, 'materials', materialId));
        
        showNotification('Материал удален', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Ошибка удаления материала', 'danger');
        throw error;
    }
}

// Электронные чеки

// Получить все транзакции
export async function getAllTransactions() {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('status', '==', 'completed'),
            orderBy('dateTime', 'desc')
        );
        const transactionsSnapshot = await getDocs(q);
        return transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения транзакций:', error);
        throw error;
    }
}

// Статистика

// Получить общую статистику
export async function getAdminStatistics() {
    try {
        const [appointmentsSnapshot, usersSnapshot, servicesSnapshot, materialsSnapshot] = await Promise.all([
            getDocs(collection(db, 'appointments')),
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'services')),
            getDocs(collection(db, 'materials'))
        ]);
        
        const appointments = appointmentsSnapshot.docs.map(doc => doc.data());
        const users = usersSnapshot.docs.map(doc => doc.data());
        
        return {
            totalAppointments: appointments.length,
            scheduledAppointments: appointments.filter(a => a.status === 'scheduled').length,
            completedAppointments: appointments.filter(a => a.status === 'completed').length,
            cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
            totalPatients: users.filter(u => u.role === 'patient').length,
            totalDoctors: users.filter(u => u.role === 'doctor').length,
            totalServices: servicesSnapshot.size,
            totalMaterials: materialsSnapshot.size
        };
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        throw error;
    }
}

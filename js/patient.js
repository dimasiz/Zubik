// Функции для пациентов
import { db } from './firebase-config.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getCurrentUserData } from './auth.js';
import { showLoading, hideLoading, showNotification } from './utils.js';

// Получить все услуги
export async function getServices() {
    try {
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        return servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения услуг:', error);
        throw error;
    }
}

// Получить всех врачей
export async function getDoctors() {
    try {
        const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
        const doctorsSnapshot = await getDocs(q);
        return doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения врачей:', error);
        throw error;
    }
}

// Создать новую запись на прием
export async function createAppointment(appointmentData) {
    try {
        showLoading();
        const userData = getCurrentUserData();
        
        const appointment = {
            patientId: userData.id,
            doctorId: appointmentData.doctorId,
            serviceId: appointmentData.serviceId,
            dateTime: appointmentData.dateTime,
            status: 'scheduled',
            notes: appointmentData.notes || '',
            createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'appointments'), appointment);
        
        showNotification('Запись успешно создана', 'success');
        hideLoading();
        return { id: docRef.id, ...appointment };
    } catch (error) {
        hideLoading();
        showNotification('Ошибка создания записи', 'danger');
        throw error;
    }
}

// Получить все записи пациента
export async function getPatientAppointments() {
    try {
        const userData = getCurrentUserData();
        const q = query(
            collection(db, 'appointments'),
            where('patientId', '==', userData.id),
            orderBy('dateTime', 'desc')
        );
        
        const appointmentsSnapshot = await getDocs(q);
        return appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения записей:', error);
        throw error;
    }
}

// Получить историю визитов пациента
export async function getPatientHistory() {
    try {
        const userData = getCurrentUserData();
        const q = query(
            collection(db, 'appointments'),
            where('patientId', '==', userData.id),
            where('status', '==', 'completed'),
            orderBy('dateTime', 'desc')
        );
        
        const historySnapshot = await getDocs(q);
        return historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения истории:', error);
        throw error;
    }
}

// Оставить отзыв
export async function createFeedback(feedbackData) {
    try {
        showLoading();
        const userData = getCurrentUserData();
        
        const feedback = {
            patientId: userData.id,
            doctorId: feedbackData.doctorId,
            appointmentId: feedbackData.appointmentId,
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            date: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'feedbacks'), feedback);
        
        showNotification('Отзыв успешно добавлен', 'success');
        hideLoading();
        return { id: docRef.id, ...feedback };
    } catch (error) {
        hideLoading();
        showNotification('Ошибка добавления отзыва', 'danger');
        throw error;
    }
}

// Получить отзывы пациента
export async function getPatientFeedbacks() {
    try {
        const userData = getCurrentUserData();
        const q = query(
            collection(db, 'feedbacks'),
            where('patientId', '==', userData.id),
            orderBy('date', 'desc')
        );
        
        const feedbacksSnapshot = await getDocs(q);
        return feedbacksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения отзывов:', error);
        throw error;
    }
}

// Обновить профиль пациента
export async function updatePatientProfile(profileData) {
    try {
        showLoading();
        const userData = getCurrentUserData();
        
        await updateDoc(doc(db, 'users', userData.id), profileData);
        
        showNotification('Профиль успешно обновлен', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Ошибка обновления профиля', 'danger');
        throw error;
    }
}

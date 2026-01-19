// Функции для врачей
import { db } from './firebase-config.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getCurrentUserData } from './auth.js';
import { showLoading, hideLoading, showNotification } from './utils.js';

// Получить расписание врача
export async function getDoctorSchedule(date) {
    try {
        const userData = getCurrentUserData();
        const q = query(
            collection(db, 'appointments'),
            where('doctorId', '==', userData.id),
            orderBy('dateTime', 'asc')
        );
        
        const appointmentsSnapshot = await getDocs(q);
        return appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения расписания:', error);
        throw error;
    }
}

// Получить список пациентов врача
export async function getDoctorPatients() {
    try {
        const userData = getCurrentUserData();
        const q = query(
            collection(db, 'appointments'),
            where('doctorId', '==', userData.id)
        );
        
        const appointmentsSnapshot = await getDocs(q);
        const patientIds = [...new Set(appointmentsSnapshot.docs.map(doc => doc.data().patientId))];
        
        const patients = [];
        for (const patientId of patientIds) {
            const patientDoc = await getDoc(doc(db, 'users', patientId));
            if (patientDoc.exists()) {
                patients.push({ id: patientId, ...patientDoc.data() });
            }
        }
        
        return patients;
    } catch (error) {
        console.error('Ошибка получения пациентов:', error);
        throw error;
    }
}

// Получить историю пациента
export async function getPatientMedicalHistory(patientId) {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('patientId', '==', patientId),
            where('status', '==', 'completed'),
            orderBy('dateTime', 'desc')
        );
        
        const historySnapshot = await getDocs(q);
        return historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Ошибка получения истории пациента:', error);
        throw error;
    }
}

// Обновить заметки в записи
export async function updateAppointmentNotes(appointmentId, notes, diagnosis) {
    try {
        showLoading();
        
        await updateDoc(doc(db, 'appointments', appointmentId), {
            notes: notes,
            diagnosis: diagnosis
        });
        
        showNotification('Заметки успешно обновлены', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Ошибка обновления заметок', 'danger');
        throw error;
    }
}

// Завершить прием
export async function completeAppointment(appointmentId) {
    try {
        showLoading();
        
        await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'completed'
        });
        
        showNotification('Прием завершен', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Ошибка завершения приема', 'danger');
        throw error;
    }
}

// Получить статистику врача
export async function getDoctorStatistics() {
    try {
        const userData = getCurrentUserData();
        const q = query(
            collection(db, 'appointments'),
            where('doctorId', '==', userData.id)
        );
        
        const appointmentsSnapshot = await getDocs(q);
        const appointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const stats = {
            total: appointments.length,
            scheduled: appointments.filter(a => a.status === 'scheduled').length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length
        };
        
        return stats;
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        throw error;
    }
}

// Получить отзывы о враче
export async function getDoctorFeedbacks() {
    try {
        const userData = getCurrentUserData();
        const q = query(
            collection(db, 'feedbacks'),
            where('doctorId', '==', userData.id),
            orderBy('date', 'desc')
        );
        
        const feedbacksSnapshot = await getDocs(q);
        const feedbacks = feedbacksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Рассчитать средний рейтинг
        const avgRating = feedbacks.length > 0
            ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
            : 0;
        
        return {
            feedbacks,
            averageRating: avgRating.toFixed(1),
            totalFeedbacks: feedbacks.length
        };
    } catch (error) {
        console.error('Ошибка получения отзывов:', error);
        throw error;
    }
}

// Поиск пациента
export async function searchPatient(searchTerm) {
    try {
        const patientsSnapshot = await getDocs(collection(db, 'users'));
        const patients = patientsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => user.role === 'patient')
            .filter(user => 
                user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.phone && user.phone.includes(searchTerm))
            );
        
        return patients;
    } catch (error) {
        console.error('Ошибка поиска пациента:', error);
        throw error;
    }
}

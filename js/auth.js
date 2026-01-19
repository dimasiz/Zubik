// Аутентификация пользователей
import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { showLoading, hideLoading, showNotification } from './utils.js';

// Текущий пользователь
let currentUser = null;
let currentUserData = null;

// Получить текущего пользователя
export function getCurrentUser() {
    return currentUser;
}

// Получить данные текущего пользователя
export function getCurrentUserData() {
    return currentUserData;
}

// Вход пользователя
export async function login(email, password) {
    try {
        showLoading();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Получить данные пользователя из Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            throw new Error('Данные пользователя не найдены');
        }
        
        currentUser = user;
        currentUserData = { id: user.uid, ...userDoc.data() };
        
        showNotification('Вход выполнен успешно', 'success');
        hideLoading();
        return currentUserData;
    } catch (error) {
        hideLoading();
        showNotification(getErrorMessage(error), 'danger');
        throw error;
    }
}

// Регистрация нового пациента
export async function register(email, password, userData) {
    try {
        showLoading();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Создать документ пользователя
        const userDocData = {
            email: email,
            fullName: userData.fullName,
            phone: userData.phone,
            role: 'patient',
            createdAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', user.uid), userDocData);
        
        // Создать документ пациента
        const patientDocData = {
            userId: user.uid,
            medicalHistory: [],
            feedbacks: [],
            appointments: []
        };
        
        await setDoc(doc(db, 'patients', user.uid), patientDocData);
        
        currentUser = user;
        currentUserData = { id: user.uid, ...userDocData };
        
        showNotification('Регистрация успешна', 'success');
        hideLoading();
        return currentUserData;
    } catch (error) {
        hideLoading();
        showNotification(getErrorMessage(error), 'danger');
        throw error;
    }
}

// Вход через Google
export async function loginWithGoogle() {
    try {
        showLoading();
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Проверить, существует ли пользователь
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Создать нового пользователя как пациента
            const userDocData = {
                email: user.email,
                fullName: user.displayName || 'Пользователь',
                phone: user.phoneNumber || '',
                role: 'patient',
                createdAt: serverTimestamp()
            };
            
            await setDoc(doc(db, 'users', user.uid), userDocData);
            
            // Создать документ пациента
            const patientDocData = {
                userId: user.uid,
                medicalHistory: [],
                feedbacks: [],
                appointments: []
            };
            
            await setDoc(doc(db, 'patients', user.uid), patientDocData);
            
            currentUserData = { id: user.uid, ...userDocData };
        } else {
            currentUserData = { id: user.uid, ...userDoc.data() };
        }
        
        currentUser = user;
        showNotification('Вход через Google выполнен успешно', 'success');
        hideLoading();
        return currentUserData;
    } catch (error) {
        hideLoading();
        showNotification(getErrorMessage(error), 'danger');
        throw error;
    }
}

// Выход из системы
export async function logout() {
    try {
        await signOut(auth);
        currentUser = null;
        currentUserData = null;
        showNotification('Вы вышли из системы', 'info');
        window.location.href = '/';
    } catch (error) {
        showNotification(getErrorMessage(error), 'danger');
        throw error;
    }
}

// Восстановление пароля
export async function resetPassword(email) {
    try {
        showLoading();
        await sendPasswordResetEmail(auth, email);
        showNotification('Инструкции отправлены на email', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification(getErrorMessage(error), 'danger');
        throw error;
    }
}

// Слушатель состояния аутентификации
export function onAuthChange(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    currentUser = user;
                    currentUserData = { id: user.uid, ...userDoc.data() };
                    callback(currentUserData);
                } else {
                    currentUser = null;
                    currentUserData = null;
                    callback(null);
                }
            } catch (error) {
                console.error('Ошибка получения данных пользователя:', error);
                callback(null);
            }
        } else {
            currentUser = null;
            currentUserData = null;
            callback(null);
        }
    });
}

// Получить сообщение об ошибке
function getErrorMessage(error) {
    const errorMessages = {
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/email-already-in-use': 'Email уже используется',
        'auth/weak-password': 'Слабый пароль (минимум 6 символов)',
        'auth/invalid-email': 'Неверный формат email',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже'
    };
    
    return errorMessages[error.code] || error.message || 'Произошла ошибка';
}

// Проверка роли пользователя
export function hasRole(role) {
    return currentUserData && currentUserData.role === role;
}

// Проверка авторизации
export function isAuthenticated() {
    return currentUser !== null;
}

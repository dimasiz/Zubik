// Email уведомления (используя EmailJS или Firebase Cloud Functions)

// Конфигурация EmailJS (замените на свои данные)
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

// Инициализация EmailJS
export function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
}

// Отправить уведомление о новой записи
export async function sendAppointmentNotification(patientEmail, appointmentDetails) {
    try {
        const templateParams = {
            to_email: patientEmail,
            patient_name: appointmentDetails.patientName,
            doctor_name: appointmentDetails.doctorName,
            service_name: appointmentDetails.serviceName,
            date: appointmentDetails.date,
            time: appointmentDetails.time
        };
        
        if (typeof emailjs !== 'undefined') {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
            console.log('Уведомление отправлено');
        } else {
            console.log('EmailJS не загружен');
        }
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
    }
}

// Отправить уведомление об отмене записи
export async function sendCancellationNotification(patientEmail, appointmentDetails) {
    try {
        const templateParams = {
            to_email: patientEmail,
            patient_name: appointmentDetails.patientName,
            date: appointmentDetails.date,
            time: appointmentDetails.time,
            reason: appointmentDetails.reason || 'Запись отменена администратором'
        };
        
        if (typeof emailjs !== 'undefined') {
            await emailjs.send(EMAILJS_SERVICE_ID, 'cancellation_template', templateParams);
            console.log('Уведомление об отмене отправлено');
        } else {
            console.log('EmailJS не загружен');
        }
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
    }
}

// Отправить уведомление о новых рекомендациях
export async function sendRecommendationsNotification(patientEmail, recommendationsDetails) {
    try {
        const templateParams = {
            to_email: patientEmail,
            patient_name: recommendationsDetails.patientName,
            doctor_name: recommendationsDetails.doctorName,
            recommendations: recommendationsDetails.recommendations
        };
        
        if (typeof emailjs !== 'undefined') {
            await emailjs.send(EMAILJS_SERVICE_ID, 'recommendations_template', templateParams);
            console.log('Уведомление о рекомендациях отправлено');
        } else {
            console.log('EmailJS не загружен');
        }
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
    }
}

// Отправить электронный чек
export async function sendReceipt(patientEmail, receiptDetails) {
    try {
        const templateParams = {
            to_email: patientEmail,
            patient_name: receiptDetails.patientName,
            receipt_number: receiptDetails.receiptNumber,
            services: receiptDetails.services,
            total_amount: receiptDetails.totalAmount,
            date: receiptDetails.date
        };
        
        if (typeof emailjs !== 'undefined') {
            await emailjs.send(EMAILJS_SERVICE_ID, 'receipt_template', templateParams);
            console.log('Чек отправлен');
        } else {
            console.log('EmailJS не загружен');
        }
    } catch (error) {
        console.error('Ошибка отправки чека:', error);
    }
}

// Генерация PDF чека (используя html2pdf или jsPDF)
export async function generateReceiptPDF(receiptData) {
    try {
        // Создать HTML контент для чека
        const receiptHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="text-align: center;">ДентаКлиник</h1>
                <h2 style="text-align: center;">Электронный чек</h2>
                <hr>
                <p><strong>Чек №:</strong> ${receiptData.receiptNumber}</p>
                <p><strong>Дата:</strong> ${receiptData.date}</p>
                <p><strong>Пациент:</strong> ${receiptData.patientName}</p>
                <p><strong>Врач:</strong> ${receiptData.doctorName}</p>
                <hr>
                <h3>Услуги:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid #000;">
                            <th style="text-align: left; padding: 8px;">Услуга</th>
                            <th style="text-align: right; padding: 8px;">Цена</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${receiptData.services.map(service => `
                            <tr>
                                <td style="padding: 8px;">${service.name}</td>
                                <td style="text-align: right; padding: 8px;">${service.price} ₽</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <hr>
                <h3 style="text-align: right;">Итого: ${receiptData.totalAmount} ₽</h3>
                <hr>
                <p style="text-align: center; font-size: 12px;">Спасибо за обращение в нашу клинику!</p>
            </div>
        `;
        
        // Если есть html2pdf, использовать его
        if (typeof html2pdf !== 'undefined') {
            const element = document.createElement('div');
            element.innerHTML = receiptHTML;
            
            const opt = {
                margin: 1,
                filename: `receipt-${receiptData.receiptNumber}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            
            await html2pdf().set(opt).from(element).save();
            console.log('PDF чек сгенерирован');
        } else {
            console.log('html2pdf не загружен');
            // Альтернатива: открыть в новом окне для печати
            const printWindow = window.open('', '_blank');
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            printWindow.print();
        }
    } catch (error) {
        console.error('Ошибка генерации PDF:', error);
    }
}

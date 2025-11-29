// /js/ApiService.js (ФИНАЛЬНЫЙ КОД С ЛОГОМ ДЛЯ ДИАГНОСТИКИ)

// ⭐️ КОРРЕКТИРОВКА: Используем только хост и порт, так как пути API не унифицированы.
const BASE_URL = 'https://definable-outspokenly-janyce.ngrok-free.dev';

/**
 * Вспомогательная функция для чтения JWT-токена.
 */
function getAuthToken() {
    return localStorage.getItem('jwt_token');
}

/**
 * Универсальный обработчик ошибок API.
 */
async function handleApiError(response, context) {
    let errorData = {};
    
    // 🚨 ЧИТАЕМ ОТВЕТ КАК ТЕКСТ (чтобы избежать SyntaxError на HTML)
    const responseText = await response.text();
    
    // ⭐️ КРИТИЧЕСКИЙ ЛОГ: Выводим полный текст ответа для отладки
    console.error(`ОТЛАДКА (${context}): Получен не-JSON ответ (ТЕКСТ):`, responseText); 
    
    try { 
        errorData = JSON.parse(responseText); 
    } catch (e) {
        // Если парсинг не удался (это HTML от Ngrok)
        const snippet = responseText.substring(0, 50);
        throw new Error(`Ошибка ${response.status} при ${context}. Сервер вернул HTML! (Начало: ${snippet}).`);
    }
    
    throw new Error(errorData.message || `Ошибка ${response.status} при ${context}.`);
}

// ------------------------------------------------------------------
// ⭐️ 1. ФУНКЦИЯ АВТОРИЗАЦИИ (POST /api/auth/telegram)
// ------------------------------------------------------------------
export async function authenticateTelegram(initData) {
    const API_PATH = '/api/auth/telegram'; 
    const requestBody = { initData: initData };

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        return handleApiError(response, "аутентификации");
    }
    
    const data = await response.json(); 
    
    // ✅ Токен сохраняется здесь
    localStorage.setItem('jwt_token', data.token); 
    localStorage.setItem('profileSetupNeeded', data.requiresProfileSetup ? 'true' : 'false');
    
    return data;
}

// ------------------------------------------------------------------
// ⭐️ 3. ПОЛУЧЕНИЕ ДАШБОРДА (GET /dashboard) - С ЛОГОМ ТОКЕНА
// ------------------------------------------------------------------
export async function fetchDashboard() {
    const API_PATH = '/dashboard'; 
    const token = getAuthToken();
    
    // ⭐️ КРИТИЧЕСКИЙ ЛОГ: Проверяем, существует ли токен
    console.log("ОТЛАДКА: Токен, найденный для дашборда:", token ? "найден" : "ОТСУТСТВУЕТ"); 

    if (!token) throw new Error("Требуется авторизация.");

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}` 
        }
    });

    if (!response.ok) {
        return handleApiError(response, "получении дашборда");
    }

    return await response.json(); 
}

// ... (Оставьте updatePlayerProfile, если он есть, или удалите, если он не нужен)

// /js/ApiService.js (ФИНАЛЬНЫЙ, ЗАЩИЩЕННЫЙ КОД)

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
 * Пытается прочитать JSON, если не удается, выводит текст (HTML) для отладки.
 */
async function handleApiError(response, context) {
    let errorData = {};
    
    // 🚨 ЧИТАЕМ ОТВЕТ КАК ТЕКСТ (чтобы избежать SyntaxError на HTML)
    const responseText = await response.text();
    
    // ⭐️ КРИТИЧЕСКИЙ ЛОГ: Выводим полный текст ответа для отладки
    console.error(`ОТЛАДКА (${context}): Получен не-JSON ответ (ТЕКСТ):`, responseText); 
    
    try { 
        // Пытаемся парсить текст как JSON (сработает для JSON 401 от Spring)
        errorData = JSON.parse(responseText); 
    } catch (e) {
        // Если парсинг не удался (потому что это HTML от Ngrok), формируем сообщение
        const snippet = responseText.substring(0, 50);
        throw new Error(`Ошибка ${response.status} при ${context}. Сервер вернул HTML! (Начало: ${snippet}).`);
    }
    
    // Если это был JSON с ошибкой
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
    
    localStorage.setItem('jwt_token', data.token); 
    localStorage.setItem('profileSetupNeeded', data.requiresProfileSetup ? 'true' : 'false');
    
    return data;
}

// ------------------------------------------------------------------
// ⭐️ 2. ОБНОВЛЕНИЕ ПРОФИЛЯ (PUT /player/profile)
// ------------------------------------------------------------------
export async function updatePlayerProfile(nickname, position) {
    const API_PATH = '/player/profile'; 
    const token = getAuthToken();
    if (!token) throw new Error("Требуется авторизация.");
    
    const requestBody = { nickname: nickname, position: position };

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        return handleApiError(response, "обновлении профиля");
    }

    const data = await response.json(); 
    const positionDisplayMap = { 'gk': 'Вратарь', 'df': 'Защитник', 'mf': 'Полузащитник', 'fw': 'Нападающий' };
    localStorage.setItem('player_position_display', positionDisplayMap[data.position] || data.position);
    
    return data;
}

// ------------------------------------------------------------------
// ⭐️ 3. ПОЛУЧЕНИЕ ДАШБОРДА (GET /dashboard)
// ------------------------------------------------------------------
export async function fetchDashboard() {
    const API_PATH = '/dashboard'; 
    const token = getAuthToken();
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

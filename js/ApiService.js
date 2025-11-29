// /js/ApiService.js (ПОЛНЫЙ ИСПРАВЛЕННЫЙ КОД)

// ⭐️ ВАЖНО: Убедитесь, что это актуальный адрес Ngrok.
const BASE_URL = 'https://definable-outspokenly-janyce.ngrok-free.dev/';


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
        // Пытаемся парсить текст как JSON (сработает для JSON 401 от Spring)
        errorData = JSON.parse(responseText); 
    } catch (e) {
        // Если парсинг не удался (потому что это HTML от Ngrok)
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
    
    localStorage.setItem('jwt_token', data.token); 
    localStorage.setItem('profileSetupNeeded', data.requiresProfileSetup ? 'true' : 'false');
    
    return data;
}

// ------------------------------------------------------------------
// ⭐️ 2. ОБНОВЛЕНИЕ ПРОФИЛЯ (PUT /player/profile) - ВОССТАНОВЛЕН и ЭКСПОРТИРОВАН
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
// ⭐️ 3. ПОЛУЧЕНИЕ ДАШБОРДА (GET /dashboard) - С ЛОГОМ ТОКЕНА
// ------------------------------------------------------------------
export async function fetchDashboard() {
    const API_PATH = '/api/dashboard';
    const token = getAuthToken();

    console.log("ОТЛАДКА: токен:", token);

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const raw = await response.text();
    console.log("RAW DASHBOARD RESPONSE:", raw);

    // если ответ не JSON → сразу ошибка
    try {
        return JSON.parse(raw);
    } catch (e) {
        throw new Error("Сервер вернул HTML вместо JSON. Начало ответа: " + raw.substring(0, 100));
    }
}


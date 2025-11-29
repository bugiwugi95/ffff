// /js/ApiService.js

// ⭐️ ВАЖНО: актуальный адрес Ngrok (без лишнего слэша)
const BASE_URL = "http://localhost:8080";

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
    const responseText = await response.text();
    console.error(`ОТЛАДКА (${context}): raw response:`, responseText);

    try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || `Ошибка ${response.status} при ${context}`);
    } catch (e) {
        throw new Error(`Ошибка ${response.status} при ${context}. Сервер вернул HTML/не JSON! Начало: ${responseText.substring(0, 100)}`);
    }
}

// ------------------------------------------------------------------
// ⭐️ 1. АВТОРИЗАЦИЯ (POST /api/auth/telegram)
// ------------------------------------------------------------------
export async function authenticateTelegram(initData) {
    const API_PATH = "/api/auth/telegram";

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
    });

    if (!response.ok) {
        return handleApiError(response, "аутентификации");
    }

    const raw = await response.text();
    console.log("RAW AUTH RESPONSE:", raw);

    try {
        const data = JSON.parse(raw);
        localStorage.setItem('jwt_token', data.token);
        localStorage.setItem('profileSetupNeeded', data.requiresProfileSetup ? 'true' : 'false');
        return data;
    } catch (e) {
        throw new Error("Сервер вернул не JSON при аутентификации. Начало: " + raw.substring(0, 100));
    }
}

// ------------------------------------------------------------------
// ⭐️ 2. ОБНОВЛЕНИЕ ПРОФИЛЯ (PUT /player/profile)
// ------------------------------------------------------------------
export async function updatePlayerProfile(nickname, position) {
    const API_PATH = "/player/profile";
    const token = getAuthToken();
    if (!token) throw new Error("Требуется авторизация.");

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nickname, position })
    });

    if (!response.ok) {
        return handleApiError(response, "обновлении профиля");
    }

    const raw = await response.text();
    console.log("RAW PROFILE RESPONSE:", raw);

    try {
        const data = JSON.parse(raw);
        const positionDisplayMap = { 'gk': 'Вратарь', 'df': 'Защитник', 'mf': 'Полузащитник', 'fw': 'Нападающий' };
        localStorage.setItem('player_position_display', positionDisplayMap[data.position] || data.position);
        return data;
    } catch (e) {
        throw new Error("Сервер вернул не JSON при обновлении профиля. Начало: " + raw.substring(0, 100));
    }
}

// ------------------------------------------------------------------
// ⭐️ 3. ПОЛУЧЕНИЕ ДАШБОРДА (GET /api/dashboard)
// ------------------------------------------------------------------
export async function fetchDashboard() {
    const API_PATH = "/api/dashboard";
    const token = getAuthToken();
    if (!token) throw new Error("Требуется авторизация.");

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const raw = await response.text();
    console.log("RAW DASHBOARD RESPONSE:", raw);

    try {
        return JSON.parse(raw);
    } catch (e) {
        throw new Error("Сервер вернул HTML/не JSON вместо дашборда. Начало ответа: " + raw.substring(0, 100));
    }
}




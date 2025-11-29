// /js/ApiService.js

// ⭐️ ВАЖНО: актуальный адрес Ngrok (без лишнего слэша)
const BASE_URL = "http://localhost:8080"; // <-- Оставил твой адрес

/**
 * Вспомогательная функция для чтения JWT-токена.
 */
function getAuthToken() {
    return localStorage.getItem('jwt_token');
}

/**
 * Универсальный обработчик ошибок API.
 * * 🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Теперь корректно обрабатывает 401/403, 
 * когда бэкенд возвращает не JSON (например, HTML-страницу ошибки).
 */
async function handleApiError(response, context) {
    const status = response.status;
    const responseText = await response.text();
    console.error(`ОТЛАДКА (${context} - ${status}): raw response:`, responseText.substring(0, 200) + '...');

    // 1. Сначала проверяем на ошибки авторизации/доступа
    if (status === 401 || status === 403) {
        // Мы предполагаем, что при 401/403 токен невалиден или отсутствует.
        // Spring Security часто не возвращает JSON в этом случае.
        const authError = status === 401 ? "Неавторизованный доступ (401)" : "Доступ запрещен (403)";
        throw new Error(`${authError} при ${context}. Требуется перезапуск.`);
    }

    // 2. Для остальных ошибок (4xx, 5xx) пытаемся разобрать JSON
    try {
        const errorData = JSON.parse(responseText);
        // Используем сообщение от сервера, если оно есть
        throw new Error(errorData.message || `Ошибка ${status} при ${context}`);
    } catch (e) {
        // Если парсинг не удался (например, это HTML или пустой ответ)
        throw new Error(`Ошибка ${status} при ${context}. Сервер вернул нечитаемый ответ.`);
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
        // handleApiError теперь защищен от 401/403
        return handleApiError(response, "аутентификации"); 
    }

    const raw = await response.text();
    console.log("RAW AUTH RESPONSE:", raw.substring(0, 100) + '...');

    try {
        const data = JSON.parse(raw);
        // 🚨 Здесь происходит сохранение токена
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
    const API_PATH = "/api/player/profile"; // 🚨 ИСПРАВЛЕНИЕ: Добавил /api/
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
    console.log("RAW PROFILE RESPONSE:", raw.substring(0, 100) + '...');

    // 🚀 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: После успешного обновления профиля,
    // мы больше не нуждаемся в настройке.
    localStorage.setItem('profileSetupNeeded', 'false');

    try {
        const data = JSON.parse(raw);
        const positionDisplayMap = { 'gk': 'Вратарь', 'df': 'Защитник', 'mf': 'Полузащитник', 'fw': 'Нападающий' };
        localStorage.setItem('player_position_display', positionDisplayMap[data.position] || data.position);
        return data;
    } catch (e) {
        // Если ответ 200 OK пустой (No Content), это тоже может вызвать ошибку парсинга
        if (response.status === 200 && raw.trim() === '') {
             return {}; // Просто возвращаем пустой объект, если сервер вернул 200 без тела
        }
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

    if (!response.ok) {
        // handleApiError теперь защищен от 401/403
        return handleApiError(response, "загрузке дашборда");
    }

    const raw = await response.text();
    console.log("RAW DASHBOARD RESPONSE:", raw.substring(0, 100) + '...');

    try {
        return JSON.parse(raw);
    } catch (e) {
        throw new Error("Сервер вернул не JSON вместо дашборда. Начало ответа: " + raw.substring(0, 100));
    }
}

// ------------------------------------------------------------------
// ⭐️ 4. (ОБЩАЯ ФУНКЦИЯ)
// ------------------------------------------------------------------

/**
 * ВАЖНО: Это просто заглушка, чтобы не ломать старые импорты.
 * Твоя логика уже использует 'Authorization' напрямую, что хорошо.
 */
export async function authenticatedFetch(path, options = {}) {
    // Вся логика fetch теперь должна быть в отдельных функциях (fetchDashboard, updatePlayerProfile)
    // Эта функция не используется, но может быть заглушкой, если где-то еще остался импорт.
    console.warn('authenticatedFetch не используется. Используй конкретные функции API.');
    throw new Error('Функция authenticatedFetch не реализована. Используй конкретные функции API.');
}



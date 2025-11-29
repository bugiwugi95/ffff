// /js/ApiService.js

// ⭐️ ВАЖНО: Базовый адрес API. 
const BASE_URL = "https://definable-outspokenly-janyce.ngrok-free.dev"; 

/**
 * Вспомогательная функция: Чтение JWT-токена из локального хранилища.
 */
function getAuthToken() {
    console.log("LOG: API Service: Запрошен токен.");
    return localStorage.getItem('jwt_token');
}

/**
 * Вспомогательная функция: Удаление JWT-токена из локального хранилища.
 * 🛑 КРИТИЧНО: Вызывается при получении ошибки 401/403.
 */
function clearAuthToken() {
    console.log("LOG: API Service: Токен удален из localStorage (требуется переавторизация).");
    localStorage.removeItem('jwt_token');
}

/**
 * Универсальный обработчик ошибок API.
 * 🚨 ГАРАНТИЯ: При 401/403 удаляет токен и бросает исключение.
 */
async function handleApiError(response, context) {
    const status = response.status;
    const responseText = await response.text();
    console.error(`LOG: API ERROR (${context} - ${status}): Raw response start:`, responseText.substring(0, 200) + '...');

    // 1. Обработка ошибок авторизации/доступа (401/403)
    if (status === 401 || status === 403) {
        // 🛑 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Удаляем нерабочий токен.
        clearAuthToken(); 
        
        const authError = status === 401 ? "Неавторизованный доступ (401)" : "Доступ запрещен (403)";
        console.error(`LOG: FATAL ERROR: ${authError}. Бросаем исключение.`);
        throw new Error(`${authError} при ${context}. Требуется перезапуск.`);
    }

    // 2. Для остальных ошибок (4xx, 5xx) пытаемся разобрать JSON
    try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || `Ошибка ${status}`;
        console.error(`LOG: SERVER ERROR: ${errorMessage}`);
        throw new Error(errorMessage + ` при ${context}`);
    } catch (e) {
        // Если ответ не является валидным JSON 
        console.error(`LOG: NON-JSON ERROR: Сервер вернул нечитаемый ответ при статусе ${status}.`);
        throw new Error(`Ошибка ${status} при ${context}. Сервер вернул нечитаемый ответ.`);
    }
}

// ------------------------------------------------------------------
// ⭐️ 1. АВТОРИЗАЦИЯ (POST /api/auth/telegram)
// ------------------------------------------------------------------
export async function authenticateTelegram(initData) {
    const API_PATH = "/api/auth/telegram";
    console.log("LOG: AUTH: Начинаем аутентификацию.");

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
    });
    
    if (!response.ok) {
        console.error("LOG: AUTH: Аутентификация провалена. Статус:", response.status);
        return handleApiError(response, "аутентификации"); 
    }

    const raw = await response.text();
    console.log("LOG: AUTH: Успешный RAW ответ:", raw.substring(0, 100) + '...');

    try {
        const data = JSON.parse(raw);
        // 🚨 КРИТИЧНО: Сохраняем полученный токен
        localStorage.setItem('jwt_token', data.token);
        localStorage.setItem('profileSetupNeeded', data.requiresProfileSetup ? 'true' : 'false');
        console.log("LOG: AUTH: Токен и флаг настройки профиля сохранены.");
        return data;
    } catch (e) {
        console.error("LOG: AUTH: Ошибка парсинга JSON ответа.", e);
        throw new Error("Сервер вернул не JSON при аутентификации. Начало: " + raw.substring(0, 100));
    }
}

// ------------------------------------------------------------------
// ⭐️ 2. ОБНОВЛЕНИЕ ПРОФИЛЯ (PUT /player/profile)
// ------------------------------------------------------------------
export async function updatePlayerProfile(nickname, position) {
    const API_PATH = "/api/player/profile"; 
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

    localStorage.setItem('profileSetupNeeded', 'false');

    try {
        const data = JSON.parse(raw);
        const positionDisplayMap = { 'gk': 'Вратарь', 'df': 'Защитник', 'mf': 'Полузащитник', 'fw': 'Нападающий' };
        localStorage.setItem('player_position_display', positionDisplayMap[data.position] || data.position);
        return data;
    } catch (e) {
        if (response.status === 200 && raw.trim() === '') {
             return {};
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
    console.log("LOG: DASHBOARD: Вызов API. Токен:", token ? "Найдено" : "НЕ НАЙДЕНО");

    // Защита: Если токена нет, то не отправляем запрос
    if (!token) {
        console.error("LOG: DASHBOARD: Токен отсутствует в хранилище. Бросаем ошибку.");
        throw new Error("Требуется авторизация. Токен отсутствует.");
    }

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'GET',
        headers: { 
            // 1. Заголовок авторизации
            'Authorization': `Bearer ${token}`, // <-- ТУТ БЫЛА ПРОПУЩЕНА ЗАПЯТАЯ
            // 2. Заголовок типа данных
            'Accept': 'application/json' 
        }
    });
    
    if (!response.ok) {
        console.error("LOG: DASHBOARD: Запрос дашборда провален. Статус:", response.status);
        return handleApiError(response, "загрузке дашборда");
    }

    const raw = await response.text();
    console.log("LOG: DASHBOARD: Успешный RAW ответ:", raw.substring(0, 100) + '...');

    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error("LOG: DASHBOARD: Ошибка парсинга JSON ответа.", e);
        throw new Error("Сервер вернул не JSON вместо дашборда. Начало ответа: " + raw.substring(0, 100));
    }
}

// ------------------------------------------------------------------
// ⭐️ 4. (ОБЩАЯ ФУНКЦИЯ)
// ------------------------------------------------------------------
export async function authenticatedFetch(path, options = {}) {
    console.warn('LOG: WARN: authenticatedFetch не используется. Используй конкретные функции API.');
    throw new Error('Функция authenticatedFetch не реализована. Используй конкретные функции API.');
}

export { clearAuthToken }; // Экспортируем для resetApp в main.js

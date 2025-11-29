// /js/ApiService.js

// ⭐️ ВАЖНО: Базовый адрес API. Должен совпадать с адресом бэкенда.
const BASE_URL = "http://localhost:8080"; 

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
 * 🚨 ГАРАНТИЯ: При 401/403 удаляет токен и бросает исключение для перезапуска.
 */
async function handleApiError(response, context) {
    const status = response.status;
    const responseText = await response.text();
    console.error(`LOG: API ERROR (${context} - ${status}): Raw response start:`, responseText.substring(0, 200) + '...');

    // 1. Обработка ошибок авторизации/доступа (401: Unauthorized, 403: Forbidden)
    if (status === 401 || status === 403) {
        // 🛑 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Удаляем нерабочий токен.
        clearAuthToken(); 
        
        const authError = status === 401 ? "Неавторизованный доступ (401)" : "Доступ запрещен (403)";
        console.error(`LOG: FATAL ERROR: ${authError}. Бросаем исключение для прерывания работы.`);
        throw new Error(`${authError} при ${context}. Требуется перезапуск.`);
    }

    // 2. Для остальных ошибок (например, 500 Internal Server Error)
    try {
        const errorData = JSON.parse(responseText);
        // Используем сообщение от сервера
        const errorMessage = errorData.message || `Ошибка ${status}`;
        console.error(`LOG: SERVER ERROR: ${errorMessage}`);
        throw new Error(errorMessage + ` при ${context}`);
    } catch (e) {
        // Если ответ не является валидным JSON (например, HTML от Spring)
        console.error(`LOG: NON-JSON ERROR: Сервер вернул нечитаемый ответ при статусе ${status}.`);
        throw new Error(`Ошибка ${status} при ${context}. Сервер вернул нечитаемый ответ.`);
    }
}

// ------------------------------------------------------------------
// ⭐️ 1. АУТЕНТИФИКАЦИЯ (POST /api/auth/telegram)
// ------------------------------------------------------------------
export async function authenticateTelegram(initData) {
    const API_PATH = "/api/auth/telegram";
    console.log("LOG: AUTH: Начинаем аутентификацию.");

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
    });
    
    // Проверка статуса ответа
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
// ⭐️ 3. ПОЛУЧЕНИЕ ДАШБОРДА (GET /api/dashboard)
// ------------------------------------------------------------------
export async function fetchDashboard() {
    const API_PATH = "/api/dashboard";
    const token = getAuthToken();
    console.log("LOG: DASHBOARD: Вызов API. Токен:", token ? "Найдено" : "НЕ НАЙДЕНО");

    // Защита: Если токена нет, то не отправляем запрос, а сразу бросаем ошибку
    if (!token) {
        console.error("LOG: DASHBOARD: Токен отсутствует в хранилище. Исключаем запрос.");
        throw new Error("Требуется авторизация. Токен отсутствует.");
    }

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Проверка статуса ответа
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


// (Остальные функции, как updatePlayerProfile и заглушка authenticatedFetch, 
// были опущены для краткости и фокуса на главной проблеме, но ты можешь их добавить из своего кода.)

export { 
    authenticateTelegram, 
    fetchDashboard,
    clearAuthToken // Добавим для возможного внешнего использования
};

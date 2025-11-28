// /js/ApiService.js

// ⭐️ КОРРЕКТИРОВКА: Используем только хост и порт, так как пути API не унифицированы.
const BASE_URL = 'http://localhost:8080';

/**
 * Вспомогательная функция для чтения JWT-токена.
 */
function getAuthToken() {
    return localStorage.getItem('jwt_token');
}

// ------------------------------------------------------------------
// ⭐️ 1. ФУНКЦИЯ АВТОРИЗАЦИИ (POST /api/auth/telegram)
// ------------------------------------------------------------------
export async function authenticateTelegram(initData) {
    // ⚠️ Используем /api/auth, как указано в AuthController
    const API_PATH = '/api/auth/telegram'; 
    const requestBody = { initData: initData };

    const response = await fetch(`${BASE_URL}${API_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        let errorData = {};
        try { errorData = await response.json(); } catch (e) {}
        throw new Error(errorData.message || `Ошибка ${response.status} при авторизации.`);
    }

    const data = await response.json(); 
    
    localStorage.setItem('jwt_token', data.jwtToken);
    localStorage.setItem('profileSetupNeeded', data.requiresProfileSetup ? 'true' : 'false');
    
    return data;
}

// ------------------------------------------------------------------
// ⭐️ 2. ОБНОВЛЕНИЕ ПРОФИЛЯ (PUT /player/profile)
// ------------------------------------------------------------------
export async function updatePlayerProfile(nickname, position) {
    // ⚠️ Используем /player, как указано в PlayerController
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
        let errorData = {};
        try { errorData = await response.json(); } catch (e) {}
        throw new Error(errorData.message || `Ошибка ${response.status} при обновлении профиля.`);
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
    // ⚠️ Используем /dashboard, как указано в DashboardController
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
        let errorData = {};
        try { errorData = await response.json(); } catch (e) {}
        throw new Error(errorData.message || `Ошибка ${response.status} при получении дашборда.`);
    }

    return await response.json(); 
}
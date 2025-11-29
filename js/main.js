// 🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Гарантированная инициализация BASE_PATH до импорта модулей.
// Используем IIFE, чтобы создать и присвоить BASE_PATH немедленно.
(function() {
    function getBasePath() {
        let path = window.location.pathname; 
        
        // 1. Удаляем из пути '/js/main.js' или '/js/'
        path = path.substring(0, path.lastIndexOf('/')); 
        
        // 2. Если путь заканчивается на /js, мы поднимаемся на уровень выше, чтобы получить корень приложения (/ffff/)
        if (path.endsWith('/js')) {
            path = path.substring(0, path.lastIndexOf('/')); 
        }
        
        // 3. Убедимся, что путь заканчивается слэшем, например: /ffff/
        if (!path.endsWith('/')) {
            path = path + '/';
        }
        
        return path; 
    }
    
    // Присваиваем глобальную переменную немедленно
    window.BASE_PATH = getBasePath(); 
    
    // Проверка для отладки:
    console.log("BASE_PATH инициализирован:", window.BASE_PATH);
})();

// ------------------------------------------------------------------------
// ИМПОРТЫ МОДУЛЕЙ (Они теперь могут использовать BASE_PATH)
// ------------------------------------------------------------------------

import { renderPositionSelectionScreen } from './PositionSelection.js'; 
import { renderPlayerDashboardScreen } from './PlayerDashboard.js';     
import { authenticateTelegram } from './ApiService.js'; 

// ⭐️ НОВЫЙ ФЛАГ: Для защиты от двойного вызова (например, в React StrictMode)
let isAuthAttempted = false; // 👈 ЭТО НОВАЯ СТРОКА!

const appRoot = document.getElementById('app-root');

const screens = {
    'position-selection': renderPositionSelectionScreen,
    'dashboard': renderPlayerDashboardScreen, 
};

export function navigateTo(screenName) {
    if (!appRoot) {
        console.error('Root element #app-root not found.');
        return;
    }

    const renderFunction = screens[screenName];
    if (renderFunction) {
        appRoot.innerHTML = ''; 
        renderFunction(appRoot);
    } else {
        console.error(`Screen not found: ${screenName}`);
        appRoot.innerHTML = `<div class="p-10 text-center text-red-500">Ошибка навигации. Экран "${screenName}" не найден.</div>`;
    }
}

/**
 * ⭐️ ГЛАВНЫЙ ФЛОУ: Инициализация, Авторизация, Навигация
 */
async function initializeApp() {
    // 🛑 Защита от двойного вызова
    if (isAuthAttempted) { // 👈 НОВАЯ ЛОГИКА
        console.warn("Попытка повторного запуска initializeApp. Игнорируем.");
        return; // 👈 НОВАЯ ЛОГИКА
    }
    isAuthAttempted = true; // 👈 НОВАЯ ЛОГИКА

    appRoot.innerHTML = `
        <div class="p-10 text-center min-h-screen flex flex-col justify-center items-center">
            <div class="mt-4 animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p class="mt-2 text-slate-500 dark:text-slate-400">
                Подключение к бэкенду и авторизация...
            </p>
        </div>
    `;

    // ⭐️ КРИТИЧНО: Получение данных инициализации от Telegram
    const initData = window.Telegram?.WebApp?.initData; 

    if (!initData) {
        // Режим разработки, если запущен не в Telegram
        console.warn("InitData не найдена. Запуск в режиме разработки/отладки.");
        const setupNeeded = localStorage.getItem('profileSetupNeeded');
        if (setupNeeded === 'false') {
            navigateTo('dashboard');
        } else {
            navigateTo('position-selection');
        }
        return;
    }

    try {
        // ⭐️ Шаг 1: АУТЕНТИФИКАЦИЯ (вызываем Spring Boot)
        const authResponse = await authenticateTelegram(initData);
        
        // ⭐️ Шаг 2: НАВИГАЦИЯ по флагу от бэкенда
        if (authResponse.requiresProfileSetup) {
            navigateTo('position-selection');
        } else {
            navigateTo('dashboard');
        }
        
    } catch (error) {
        console.error("Ошибка аутентификации:", error);
        appRoot.innerHTML = `<div class="p-10 text-center text-red-500">
            Ошибка авторизации. Бэкенд (Spring) недоступен или отклонил: ${error.message}
        </div>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

// Функция для сброса состояния
export function resetApp() {
    localStorage.removeItem('profileSetupNeeded');
    localStorage.removeItem('player_position_display');
    localStorage.removeItem('jwt_token');
    initializeApp();
}

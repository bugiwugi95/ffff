
// 🚨 КРИТИЧЕСКАЯ БЛОКИРОВКА ПОВТОРНОЙ ЗАГРУЗКИ МОДУЛЯ
if (window._mainModuleLoaded) {
    console.warn("Повторная загрузка модуля main.js заблокирована.");
    // 🛑 Запрещаем дальнейшее выполнение файла
    throw new Error('Модуль уже загружен.'); 
}
window._mainModuleLoaded = true;
// 🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Гарантированная инициализация BASE_PATH до импорта модулей.
(function() {
    function getBasePath() {
        let path = window.location.pathname; 
        
        path = path.substring(0, path.lastIndexOf('/')); 
        
        if (path.endsWith('/js')) {
            path = path.substring(0, path.lastIndexOf('/')); 
        }
        
        if (!path.endsWith('/')) {
            path = path + '/';
        }
        
        return path; 
    }
    
    window.BASE_PATH = getBasePath(); 
    console.log("BASE_PATH инициализирован:", window.BASE_PATH);
})();

// ------------------------------------------------------------------------
// ИМПОРТЫ МОДУЛЕЙ
// ------------------------------------------------------------------------

import { renderPositionSelectionScreen } from './PositionSelection.js'; 
import { renderPlayerDashboardScreen } from './PlayerDashboard.js';     
import { authenticateTelegram } from './ApiService.js'; 

// 🛑 УБРАН ФЛАГ isAuthAttempted, т.к. он не справляется в некоторых окружениях.

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

// Функция для сброса состояния
export function resetApp() {
    localStorage.removeItem('profileSetupNeeded');
    localStorage.removeItem('player_position_display');
    localStorage.removeItem('jwt_token');
}

/**
 * ⭐️ ГЛАВНЫЙ ФЛОУ: Инициализация, Авторизация, Навигация
 */
async function initializeApp() {
    
    // 🛑 ЛОГИКА ЗАЩИТЫ ОТ ПОВТОРНОГО ВЫЗОВА:
    // Мы добавим специальный флаг в глобальный объект, который не сбрасывается.
    if (window._appInitialized) {
        console.warn("Попытка повторного запуска initializeApp (через глобальный флаг). Игнорируем.");
        return;
    }
    window._appInitialized = true; // Устанавливаем флаг.
    // -------------------------------------

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
    
    // 🛑 НОВАЯ ЛОГИКА ДЛЯ DEBUG-СБРОСА
    const urlParams = new URLSearchParams(window.location.search);
    const shouldReset = urlParams.get('reset') === 'true';

    if (shouldReset) {
        resetApp();
        console.log("DEBUG: Локальное хранилище сброшено.");
        appRoot.innerHTML = `<div class="p-10 text-center text-primary">
            ✅ Настройки сброшены. Обновите страницу, чтобы начать заново (уже без ?reset=true).
        </div>`;
        return;
    }
    // -------------------------------------

    if (!initData) {
        // Режим разработки/отладки
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

// 🛑 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Вызываем функцию немедленно, а не по событию DOMContentLoaded.
// initializeApp(); 

// 🛑 ЕЩЕ БОЛЕЕ НАДЕЖНЫЙ ВЫЗОВ (особенно для модулей):
// Сначала ждем DOMContentLoaded, но затем используем нашу собственную защиту.
document.addEventListener('DOMContentLoaded', initializeApp);

// 🛑 ЛУЧШЕЕ РЕШЕНИЕ: Вызываем немедленно, но с защитой, которая находится внутри.
// (Эта логика теперь реализована с помощью window._appInitialized внутри initializeApp)

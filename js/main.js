// 🚨 КРИТИЧЕСКАЯ БЛОКИРОВКА ПОВТОРНОЙ ЗАГРУЗКИ МОДУЛЯ
if (window._mainModuleLoaded) {
    console.warn("LOG: MODULE BLOCK: Повторная загрузка модуля main.js заблокирована.");
    throw new Error('Модуль уже загружен.'); 
}
window._mainModuleLoaded = true;
console.log("LOG: MODULE BLOCK: _mainModuleLoaded установлен в true.");

// 🛑 ГЛОБАЛЬНАЯ ЗАЩИТА ОТ ДВОЙНОГО ВЫЗОВА initializeApp
if (window._appInitialized) {
    console.warn("LOG: APP BLOCK: Попытка повторного запуска initializeApp заблокирована.");
}
window._appInitialized = true;
console.log("LOG: APP BLOCK: _appInitialized установлен в true.");

// -------------------------------------------------------------
// 🚨 ИНИЦИАЛИЗАЦИЯ BASE_PATH
(function() {
    function getBasePath() {
        let path = window.location.pathname; 
        path = path.substring(0, path.lastIndexOf('/')); 
        if (path.endsWith('/js')) {
            path = path.substring(0, path.lastIndexOf('/')); 
        }
        if (!path.endsWith('/')) path += '/';
        return path; 
    }
    
    window.BASE_PATH = getBasePath(); 
    console.log("LOG: PATH: BASE_PATH инициализирован:", window.BASE_PATH);
})();

// ------------------------------------------------------------------------
// ИМПОРТЫ
import { renderPositionSelectionScreen } from './PositionSelection.js'; 
import { renderPlayerDashboardScreen } from './PlayerDashboard.js'; 
import { renderCreateMatchScreen } from './CreateMatch.js';
import { MatchesScreen } from './MatchesScreen.js';
import { authenticateTelegram, clearAuthToken } from './ApiService.js'; 

const appRoot = document.getElementById('app-root');

const screens = {
    'position-selection': renderPositionSelectionScreen,
    'dashboard': renderPlayerDashboardScreen,
    'create-match': renderCreateMatchScreen,
    'matches': MatchesScreen,
};

// ------------------------------------------------------------------------
// Навигация с корректным добавлением элемента в DOM
export function navigateTo(screenName) {
    console.log(`LOG: NAVIGATION: Переход на экран: ${screenName}`);
    if (!appRoot) {
        console.error('LOG: NAVIGATION: Root element #app-root не найден.');
        return;
    }

    const renderFunction = screens[screenName];
    if (renderFunction) {
        appRoot.innerHTML = ''; 
        const screenElement = renderFunction(appRoot);
        if (screenElement) {
            appRoot.appendChild(screenElement);
            console.log('LOG: NAVIGATION: Экран вставлен в DOM');
        } else {
            console.warn('LOG: NAVIGATION: renderFunction не вернул элемент');
        }
    } else {
        console.error(`LOG: NAVIGATION: Экран не найден: ${screenName}`);
        appRoot.innerHTML = `<div class="p-10 text-center text-red-500">Ошибка навигации. Экран "${screenName}" не найден.</div>`;
    }
}

// ------------------------------------------------------------------------
// Привязка нижней навигации
document.getElementById('nav-matches')?.addEventListener('click', () => {
    console.log("LOG: NAVIGATION: Клик по nav-matches");
    navigateTo('matches');
});

// ------------------------------------------------------------------------
// Сброс состояния
export function resetApp() {
    console.warn("LOG: RESET: Сброс локального хранилища и флагов.");
    localStorage.removeItem('profileSetupNeeded');
    localStorage.removeItem('player_position_display');
    clearAuthToken(); 
    window._appInitialized = false; 
    window._mainModuleLoaded = false;
}

// ------------------------------------------------------------------------
// Инициализация приложения
async function initializeApp() {
    if (window._appInitialized === false) window._appInitialized = true;

    appRoot.innerHTML = `
        <div class="p-10 text-center min-h-screen flex flex-col justify-center items-center">
            <div class="mt-4 animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p class="mt-2 text-slate-500 dark:text-slate-400">
                Подключение к бэкенду и авторизация...
            </p>
        </div>
    `;

    const initData = window.Telegram?.WebApp?.initData; 
    const urlParams = new URLSearchParams(window.location.search);
    const shouldReset = urlParams.get('reset') === 'true';

    if (shouldReset) {
        resetApp();
        console.log("LOG: INIT: Локальное хранилище сброшено.");
        appRoot.innerHTML = `<div class="p-10 text-center text-primary">
            ✅ Настройки сброшены. Обновите страницу.
        </div>`;
        return;
    }

    if (!initData) {
        console.warn("LOG: INIT: InitData не найдена. Режим разработки.");
        const setupNeeded = localStorage.getItem('profileSetupNeeded');
        if (setupNeeded === 'false') navigateTo('dashboard');
        else navigateTo('position-selection');
        return;
    }

    try {
        console.log("LOG: INIT: Начинаем аутентификацию с InitData.");
        const authResponse = await authenticateTelegram(initData);
        if (authResponse.requiresProfileSetup) {
            console.log("LOG: INIT: Требуется настройка профиля. Переход на position-selection.");
            navigateTo('position-selection');
        } else {
            console.log("LOG: INIT: Профиль настроен. Переход на dashboard.");
            navigateTo('dashboard');
        }
    } catch (error) {
        console.error("LOG: INIT FATAL: Ошибка аутентификации.", error);
        appRoot.innerHTML = `<div class="p-10 text-center text-red-500">
            Ошибка авторизации: ${error.message}
        </div>`;
    }
}

// 🛑 Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', initializeApp);


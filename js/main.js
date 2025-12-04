// /js/main.js

// 🚨 Блокировка повторной загрузки модуля
if (window._mainModuleLoaded) {
    console.warn("LOG: MODULE BLOCK: Модуль main.js уже загружен.");
    throw new Error('Модуль уже загружен.');
}
window._mainModuleLoaded = true;
console.log("LOG: MODULE BLOCK: _mainModuleLoaded = true");

// 🛑 Глобальная защита от двойного вызова initializeApp
if (window._appInitialized) {
    console.warn("LOG: APP BLOCK: initializeApp уже был вызван.");
}
window._appInitialized = true;
console.log("LOG: APP BLOCK: _appInitialized = true");

// -------------------------------------------------------------
// BASE_PATH
(function() {
    function getBasePath() {
        let path = window.location.pathname;
        path = path.substring(0, path.lastIndexOf('/'));
        if (path.endsWith('/js')) path = path.substring(0, path.lastIndexOf('/'));
        if (!path.endsWith('/')) path += '/';
        return path;
    }
    window.BASE_PATH = getBasePath();
    console.log("LOG: PATH: BASE_PATH =", window.BASE_PATH);
})();

// ------------------------------------------------------------------------
// Импорты
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
// Навигация между экранами
export function navigateTo(screenName) {
    console.log("LOG: NAVIGATION: Переход на экран", screenName);

    if (!appRoot) {
        console.error("LOG: NAVIGATION: #app-root не найден");
        return;
    }

    const renderFunction = screens[screenName];
    if (!renderFunction) {
        console.error("LOG: NAVIGATION: Экран не найден:", screenName);
        appRoot.innerHTML = `<div class="p-10 text-center text-red-500">
            Ошибка навигации. Экран "${screenName}" не найден.
        </div>`;
        return;
    }

    appRoot.innerHTML = '';
    const rendered = renderFunction(appRoot);
    console.log("LOG: NAVIGATION: Экран", screenName, "отрендерен");

    // После рендера привязываем нижнюю навигацию
    setupBottomNavigation();
}

// ------------------------------------------------------------------------
// Привязка нижней навигации
// ------------------------------------------------------------------------
// Функция для привязки нижней навигации (кнопка "Матчи")
function setupBottomNavigation() {
    console.log("LOG: NAVIGATION: Запуск функции setupBottomNavigation");

    const navMatches = document.querySelector('#nav-matches'); // ищем кнопку глобально
    if (navMatches) {
        console.log("LOG: NAVIGATION: Кнопка #nav-matches найдена, привязываем обработчик клика");

        // проверяем, не повешен ли уже обработчик
        if (!navMatches.dataset.listenerAttached) {
            navMatches.addEventListener('click', () => {
                console.log("LOG: NAVIGATION: Клик по кнопке 'Матчи'");
                navigateTo('matches');
            });
            navMatches.dataset.listenerAttached = "true"; // флаг, чтобы не вешать повторно
            console.log("LOG: NAVIGATION: Обработчик на кнопку 'Матчи' успешно привязан");
        } else {
            console.log("LOG: NAVIGATION: Обработчик на кнопку 'Матчи' уже был привязан");
        }
    } else {
        console.warn("LOG: NAVIGATION: Кнопка #nav-matches не найдена, повторная проверка через 200ms");
        setTimeout(setupBottomNavigation, 200);
    }
}


// ------------------------------------------------------------------------
// Сброс приложения
export function resetApp() {
    console.warn("LOG: RESET: Сброс состояния приложения");
    localStorage.removeItem('profileSetupNeeded');
    localStorage.removeItem('player_position_display');
    clearAuthToken();
    window._appInitialized = false;
    window._mainModuleLoaded = false;
}

// ------------------------------------------------------------------------
// Инициализация приложения
async function initializeApp() {
    console.log("LOG: INIT: Старт initializeApp");

    if (!appRoot) {
        console.error("LOG: INIT: #app-root не найден!");
        return;
    }

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
        console.log("LOG: INIT: Локальное хранилище сброшено");
        appRoot.innerHTML = `<div class="p-10 text-center text-primary">
            ✅ Настройки сброшены. Обновите страницу (без ?reset=true)
        </div>`;
        return;
    }

    if (!initData) {
        console.warn("LOG: INIT: InitData отсутствует, режим разработки");
        const setupNeeded = localStorage.getItem('profileSetupNeeded');
        if (setupNeeded === 'false') {
            navigateTo('dashboard');
        } else {
            navigateTo('position-selection');
        }
        setupBottomNavigation();
        return;
    }

    try {
        console.log("LOG: INIT: Аутентификация с initData");
        const authResponse = await authenticateTelegram(initData);

        if (authResponse.requiresProfileSetup) {
            console.log("LOG: INIT: Требуется настройка профиля");
            navigateTo('position-selection');
        } else {
            console.log("LOG: INIT: Профиль настроен, переход на dashboard");
            navigateTo('dashboard');
        }

    } catch (error) {
        console.error("LOG: INIT FATAL: Ошибка аутентификации", error);
        appRoot.innerHTML = `<div class="p-10 text-center text-red-500">
            Ошибка авторизации: ${error.message}
        </div>`;
    }
}

// 🛑 Старт приложения после полной загрузки DOM
document.addEventListener('DOMContentLoaded', initializeApp);



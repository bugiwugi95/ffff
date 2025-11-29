// /js/PlayerDashboard.js

import { fetchDashboard } from './ApiService.js'; 

// 💡 НОВЫЙ ГЛОБАЛЬНЫЙ ФЛАГ для предотвращения повторного вызова fetchDashboard
let isDashboardDataLoaded = false; 

// 🔹 Так как dashboard.html лежит в корне проекта
const TEMPLATE_URL = window.BASE_PATH + 'dashboard.html';

/**
 * Загружает и рендерит экран Дашборда игрока.
 */
export async function renderPlayerDashboardScreen(targetElement) {
    
    // 🛑 КРИТИЧНОЕ ИСПРАВЛЕНИЕ: Блокируем, если данные уже загружаются/загружены
    if (isDashboardDataLoaded) {
        console.warn("Попытка повторного вызова renderPlayerDashboardScreen. Игнорируем.");
        return;
    }
    isDashboardDataLoaded = true; // Устанавливаем флаг перед началом
    // --------------------------------------------------------------------

    // Показываем спиннер, пока загружаются данные
    targetElement.innerHTML = `
        <div class="p-10 text-center">
            <div class="mt-4 animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p class="mt-2 text-slate-500 dark:text-slate-400">
                Загрузка данных дашборда...
            </p>
        </div>
    `;

    try {
        // 1️⃣ Загрузка данных с бэкенда.
        // Здесь происходит вызов, который мы теперь защитили от дублирования.
        const dashboardData = await fetchDashboard();

        // 2️⃣ Загрузка HTML-шаблона
        const response = await fetch(TEMPLATE_URL);
        if (!response.ok) {
            targetElement.innerHTML = `<div class="p-10 text-center text-red-500">
                Ошибка загрузки шаблона: ${response.status} ${response.statusText}.
                Проверьте, что dashboard.html лежит в корне проекта.
            </div>`;
            return;
        }
        const html = await response.text();
        
        // 3️⃣ Вставка шаблона в DOM
        targetElement.innerHTML = html;
        
        // 4️⃣ Заполнение данными
        fillDashboard(targetElement, dashboardData);

    } catch (error) {
        console.error("Dashboard render error:", error);
        targetElement.innerHTML = `<div class="p-10 text-center text-red-500">
            Не удалось загрузить дашборд: ${error.message}
        </div>`;
    } finally {
        // 💡 Очищаем флаг только после ошибки (чтобы можно было попробовать снова)
        // Если была ошибка (401), токен удаляется, и мы ждем перезапуска.
        if (targetElement.innerHTML.includes('Не удалось загрузить')) {
             isDashboardDataLoaded = false;
        }
    }
}

/**
 * Заполняет DOM-элементы данными из JSON без заглушек.
 */
function fillDashboard(rootElement, data) {
    // --- 1. Профиль ---
    const username = data.customNickname || data.nickname || "Игрок";
    rootElement.querySelector('#player-nickname').textContent = username;

    const position = localStorage.getItem('player_position_display') || data.position || "";
    const teamName = data.teamName || "";
    rootElement.querySelector('#player-position').textContent = teamName ? `${position} • ${teamName}` : position;

    // --- 2. Статистика ---
    rootElement.querySelector('#stat-goals').textContent = data.seasonGoals ?? '0';
    rootElement.querySelector('#stat-assists').textContent = data.seasonAssists ?? '0';
    rootElement.querySelector('#stat-matches').textContent = data.seasonMatches ?? '0';

    // --- 3. Ближайший матч ---
    const matchCard = rootElement.querySelector('#upcoming-match-card');
    const emptyState = rootElement.querySelector('#empty-match-state');

    if (data.nextMatch) {
        matchCard.classList.remove('hidden');
        emptyState.classList.add('hidden');

        rootElement.querySelector('#opponent-name').textContent = data.nextMatch.opponentTeamName || '';
        rootElement.querySelector('#match-date').textContent = data.nextMatch.matchDate || '';
        rootElement.querySelector('#match-time').textContent = data.nextMatch.matchTime || '';
        rootElement.querySelector('#match-location').textContent = data.nextMatch.location || '';
    } else {
        matchCard.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }

    // --- 4. Прогресс команды ---
    const chemistryScore = data.teamProgress?.chemistryScore ?? 0;
    rootElement.querySelector('#team-chemistry').textContent = `${chemistryScore} / 10`;
    rootElement.querySelector('#chemistry-bar').style.width = `${(chemistryScore * 10).toFixed(0)}%`;

    // --- 5. Последние результаты ---
    const resultsContainer = rootElement.querySelector('#results-container');
    resultsContainer.innerHTML = '';
    if (Array.isArray(data.teamProgress?.recentResults)) {
        data.teamProgress.recentResults.forEach(result => {
            resultsContainer.insertAdjacentHTML('beforeend', `<div class="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-200 px-4">
                <p class="text-gray-700 text-sm font-medium leading-normal">${result}</p>
            </div>`);
        });
    }
}




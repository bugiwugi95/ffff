// /js/screens/PlayerDashboard.js

import { fetchDashboard } from '../ApiService.js'; 

const TEMPLATE_URL = '../dashboard.html'; // 

/**
 * Загружает и рендерит экран Дашборда игрока.
 */
export async function renderPlayerDashboardScreen(targetElement) {
    targetElement.innerHTML = `
        <div class="p-10 text-center">
            <div class="mt-4 animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p class="mt-2 text-slate-500 dark:text-slate-400">
                Загрузка данных дашборда...
            </p>
        </div>
    `;

    try {
        // 1. 📡 Загрузка данных (моковая функция)
        const dashboardData = await fetchDashboard();

        // 2. 📡 Загрузка внешнего HTML-шаблона
        const response = await fetch(TEMPLATE_URL);
        if (!response.ok) {
             // 404 ОШИБКА, если файл dashboard.html не найден по пути
             targetElement.innerHTML = `<div class="p-10 text-center text-red-500">Ошибка загрузки шаблона: ${response.status} ${response.statusText}. Проверьте путь к /js/dashboard.html.</div>`;
             return;
        }
        const html = await response.text();
        
        // 3. 🖼️ Вставка разметки в DOM
        targetElement.innerHTML = html;
        
        // 4. ⭐️ Заполнение разметки данными
        fillDashboard(targetElement, dashboardData);

    } catch (error) {
        console.error("Dashboard render error:", error);
        targetElement.innerHTML = `<div class="p-10 text-center text-red-500">Не удалось загрузить дашборд: ${error.message}</div>`;
    }
}

/**
 * Заполняет DOM-элементы данными из объекта PlayerDashboard.
 */
function fillDashboard(rootElement, data) {
    // --- 1. Профиль ---
    rootElement.querySelector('#player-nickname').textContent = data.nickname;
    const position = localStorage.getItem('player_position_display') || data.position; 
    rootElement.querySelector('#player-position').textContent = `${position} • FC Dynamo`;
    
    // --- 2. Статистика ---
    rootElement.querySelector('#stat-goals').textContent = data.seasonGoals || '0';
    rootElement.querySelector('#stat-assists').textContent = data.seasonAssists || '0';
    rootElement.querySelector('#stat-matches').textContent = data.seasonMatches || '0';
    
    // --- 3. Ближайший матч ---
    const matchCard = rootElement.querySelector('#upcoming-match-card');
    const emptyState = rootElement.querySelector('#empty-match-state');

    if (data.nextMatch) {
        matchCard.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        rootElement.querySelector('#opponent-name').textContent = data.nextMatch.opponentTeamName;
        rootElement.querySelector('#match-date').textContent = data.nextMatch.matchDate;
        rootElement.querySelector('#match-time').textContent = data.nextMatch.matchTime;
        rootElement.querySelector('#match-location').textContent = data.nextMatch.location;
        
    } else {
        matchCard.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
    
    // --- 4. Прогресс команды ---
    const chemistryScore = data.teamProgress?.chemistryScore ?? 8.2;
    const scorePercentage = (chemistryScore * 10).toFixed(0); 

    rootElement.querySelector('#team-chemistry').textContent = `${chemistryScore} / 10`;
    rootElement.querySelector('#chemistry-bar').style.width = `${scorePercentage}%`;

    // --- 5. Последние результаты (МОК) ---
    const resultsContainer = rootElement.querySelector('#results-container');
    resultsContainer.innerHTML = ''; 
    const recentResults = ['Win', 'Win', 'Draw', 'Lose', 'Win'];
    
    recentResults.forEach(result => {
        let bgColor, textColor;
        if (result === 'Win') {
            bgColor = 'bg-green-500/20';
            textColor = 'text-green-400';
        } else if (result === 'Draw') {
            bgColor = 'bg-slate-500/20';
            textColor = 'text-slate-400';
        } else {
            bgColor = 'bg-red-500/20';
            textColor = 'text-red-400';
        }

        resultsContainer.insertAdjacentHTML('beforeend', `
            <div class="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full ${bgColor} px-4">
                <p class="${textColor} text-sm font-medium leading-normal">${result}</p>
            </div>
        `);
    });
}
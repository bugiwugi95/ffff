import { fetchDashboard } from './ApiService.js'; 

// 💡 КРИТИЧЕСКИ ВАЖНЫЙ ФЛАГ: Блокирует повторные вызовы fetchDashboard, 
// которые могут привести к "паразитному" 401.
let isDashboardDataLoaded = false; 

// 🔹 Путь к HTML-шаблону
// 🛑 УДАЛЕН ОТСЮДА: const TEMPLATE_URL = window.BASE_PATH + 'dashboard.html';

/**
 * Загружает и рендерит экран Дашборда игрока.
 */
export async function renderPlayerDashboardScreen(targetElement) {
    
    // ✅ ИСПРАВЛЕНИЕ: Определяем URL здесь, чтобы гарантировать, 
    // что window.BASE_PATH уже инициализирован main.js.
    const TEMPLATE_URL = window.BASE_PATH + 'dashboard.html'; 
    
    // 🛑 КРИТИЧНО: Проверка флага перед началом работы
    if (isDashboardDataLoaded) {
        console.warn("LOG: DASHBOARD RENDER: Повторный вызов renderPlayerDashboardScreen заблокирован.");
        return;
    }
    isDashboardDataLoaded = true; // Устанавливаем флаг
    console.log("LOG: DASHBOARD RENDER: Флаг isDashboardDataLoaded установлен в true.");

    // Показываем спиннер
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
        console.log("LOG: DASHBOARD RENDER: Запускаем fetchDashboard().");
        const dashboardData = await fetchDashboard();

        // 2️⃣ Загрузка HTML-шаблона
        console.log("LOG: DASHBOARD RENDER: Загружаем HTML-шаблон по пути:", TEMPLATE_URL); // Добавил лог для отладки
        const response = await fetch(TEMPLATE_URL);
        if (!response.ok) {
             console.error("LOG: DASHBOARD RENDER: Ошибка загрузки шаблона HTML:", response.status);
            targetElement.innerHTML = `<div class="p-10 text-center text-red-500">
                Ошибка загрузки шаблона: ${response.status} ${response.statusText}.
            </div>`;
            return;
        }
        const html = await response.text();
        
        // 3️⃣ Вставка шаблона и заполнение данными
        targetElement.innerHTML = html;
        fillDashboard(targetElement, dashboardData);
        console.log("LOG: DASHBOARD RENDER: Успешное заполнение дашборда.");

    } catch (error) {
        console.error("LOG: DASHBOARD RENDER: Общая ошибка рендеринга дашборда:", error);
        // Показываем сообщение об ошибке
        targetElement.innerHTML = `<div class="p-10 text-center text-red-500">
            Не удалось загрузить дашборд: ${error.message}
        </div>`;
    } finally {
        // 💡 Сбрасываем флаг, если произошла ошибка, чтобы при следующем запуске можно было попробовать снова
        if (targetElement.innerHTML.includes('Не удалось загрузить')) {
             isDashboardDataLoaded = false;
             console.log("LOG: DASHBOARD RENDER: Сброс флага isDashboardDataLoaded после ошибки.");
        }
    }
}

/**
 * Функция для заполнения DOM-элементов данными.
 */
function fillDashboard(rootElement, data) {
    console.log("LOG: DASHBOARD FILL: Начинаем заполнение данными.");

    const safeQuery = (selector) => {
        const el = rootElement.querySelector(selector);
        if (!el) console.warn(`LOG: DASHBOARD FILL: Элемент "${selector}" не найден.`);
        return el;
    };

    // --- 1. Профиль ---
    const usernameEl = safeQuery('#player-nickname');
    if (usernameEl) usernameEl.textContent = data.customNickname || data.nickname || "Игрок";

    const positionEl = safeQuery('#player-position');
    if (positionEl) {
        const position = localStorage.getItem('player_position_display') || data.position || "";
        const teamName = data.teamName || "";
        positionEl.textContent = teamName ? `${position} • ${teamName}` : position;
    }

    // --- 2. Статистика ---
    const goalsEl = safeQuery('#stat-goals');
    if (goalsEl) goalsEl.textContent = data.seasonGoals ?? '0';
    const assistsEl = safeQuery('#stat-assists');
    if (assistsEl) assistsEl.textContent = data.seasonAssists ?? '0';
    const matchesEl = safeQuery('#stat-matches');
    if (matchesEl) matchesEl.textContent = data.seasonMatches ?? '0';

    // --- 3. Ближайший матч ---
    const matchCard = safeQuery('#upcoming-match-card');
    const emptyState = safeQuery('#empty-match-state');
    if (matchCard && emptyState) {
        if (data.nextMatch && data.nextMatch.opponentTeamName !== "Нет матча") {
            matchCard.classList.remove('hidden');
            emptyState.classList.add('hidden');

            const opponentEl = safeQuery('#opponent-name');
            if (opponentEl) opponentEl.textContent = data.nextMatch.opponentTeamName || '';
            const dateEl = safeQuery('#match-date');
            if (dateEl) dateEl.textContent = data.nextMatch.matchDate || '';
            const timeEl = safeQuery('#match-time');
            if (timeEl) timeEl.textContent = data.nextMatch.matchTime || '';
            const locationEl = safeQuery('#match-location');
            if (locationEl) locationEl.textContent = data.nextMatch.location || '';
        } else {
            matchCard.classList.add('hidden');
            emptyState.classList.remove('hidden');
        }
    }

    // --- 4. Прогресс команды ---
    const chemistryEl = safeQuery('#team-chemistry');
    if (chemistryEl) chemistryEl.textContent = `${data.teamProgress?.chemistryScore ?? 0} / 10`;
    const chemistryBar = safeQuery('#chemistry-bar');
    if (chemistryBar) chemistryBar.style.width = `${((data.teamProgress?.chemistryScore ?? 0) * 10).toFixed(0)}%`;

    // --- 5. Последние результаты ---
    const resultsContainer = safeQuery('#results-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
        if (Array.isArray(data.teamProgress?.recentResults)) {
            data.teamProgress.recentResults.forEach(result => {
                resultsContainer.insertAdjacentHTML('beforeend', `<div class="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-200 px-4">
                    <p class="text-gray-700 text-sm font-medium leading-normal">${result}</p>
                </div>`);
            });
        }
    }
}






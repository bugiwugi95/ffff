import { renderCreateMatchScreen } from './CreateMatch.js';

export function MatchesScreen() {
    console.log("LOG: MatchesScreen: Инициализация экрана матчей");

    const container = document.createElement('div');
    container.style.padding = '16px';

    // Заголовок
    const title = document.createElement('h2');
    title.textContent = 'Матчи';
    container.appendChild(title);

    // Кнопки
    const btnContainer = document.createElement('div');
    btnContainer.style.marginBottom = '16px';
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '8px';

    const createMatchBtn = document.createElement('button');
    createMatchBtn.textContent = 'Создать матч';
    const historyBtn = document.createElement('button');
    historyBtn.textContent = 'История матчей';

    btnContainer.appendChild(createMatchBtn);
    btnContainer.appendChild(historyBtn);
    container.appendChild(btnContainer);

    // Контейнер для динамического контента
    const contentContainer = document.createElement('div');
    container.appendChild(contentContainer);

    // Обработчики кнопок с логами
    createMatchBtn.addEventListener('click', () => {
        console.log("LOG: MatchesScreen: Клик по Создать матч");
        contentContainer.innerHTML = '';
        renderCreateMatchScreen(contentContainer);
    });

    historyBtn.addEventListener('click', () => {
        console.log("LOG: MatchesScreen: Клик по История матчей");
        contentContainer.innerHTML = '';
        const placeholder = document.createElement('div');
        placeholder.textContent = 'Здесь будет история матчей (пока заглушка)';
        contentContainer.appendChild(placeholder);
    });

    return container;
}


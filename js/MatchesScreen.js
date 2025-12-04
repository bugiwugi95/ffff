import { renderCreateMatchScreen } from './CreateMatch.js';


export function MatchesScreen() {
    const container = document.createElement('div');
    container.style.padding = '16px';

    // Заголовок
    const title = document.createElement('h2');
    title.textContent = 'Матчи';
    container.appendChild(title);

    // Кнопки выбора экранов
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

    // Обработчики кнопок
    createMatchBtn.addEventListener('click', () => {
    contentContainer.innerHTML = '';
    renderCreateMatchScreen(contentContainer);
});

    });

    historyBtn.addEventListener('click', () => {
        contentContainer.innerHTML = '';
        const placeholder = document.createElement('div');
        placeholder.textContent = 'Здесь будет история матчей (пока заглушка)';
        contentContainer.appendChild(placeholder);
    });

    return container;
}

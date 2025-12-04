import { getAuthToken, handleApiError } from './ApiService.js';

let isCreateMatchLoaded = false;

export async function renderCreateMatchScreen(targetElement) {
    if (isCreateMatchLoaded) return;
    isCreateMatchLoaded = true;

    const TEMPLATE_URL = window.BASE_PATH + 'create-match.html';
    try {
        const response = await fetch(TEMPLATE_URL);
        if (!response.ok) throw new Error(`Ошибка загрузки шаблона: ${response.status}`);
        const html = await response.text();
        targetElement.innerHTML = html;

        const btn = targetElement.querySelector('#create-match-button');
        btn.addEventListener('click', async () => {
            await createMatch(targetElement);
        });
    } catch (error) {
        targetElement.innerHTML = `<div class="p-4 text-red-500">Не удалось загрузить экран: ${error.message}</div>`;
        isCreateMatchLoaded = false;
    }
}

async function createMatch(rootElement) {
    const opponent = rootElement.querySelector('#opponent-name-input').value.trim();
    const date = rootElement.querySelector('#match-date-input').value;
    const time = rootElement.querySelector('#match-time-input').value;
    const location = rootElement.querySelector('#match-location-input').value.trim();

    const msgBox = rootElement.querySelector('#message-container');
    msgBox.innerHTML = '';

    if (!opponent || !date || !time || !location) {
        msgBox.innerHTML = `<div class="message-box error">Заполните все поля!</div>`;
        return;
    }

    const token = getAuthToken();
    if (!token) {
        msgBox.innerHTML = `<div class="message-box error">Требуется авторизация.</div>`;
        return;
    }

    try {
        const res = await fetch(window.BASE_URL + '/api/matches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ opponentTeamName: opponent, matchDate: date, matchTime: time, location })
        });

        if (!res.ok) return handleApiError(res, "создании матча");

        msgBox.innerHTML = `<div class="message-box success">Матч успешно создан!</div>`;
        // Опционально: очистка формы
        rootElement.querySelector('#opponent-name-input').value = '';
        rootElement.querySelector('#match-date-input').value = '';
        rootElement.querySelector('#match-time-input').value = '';
        rootElement.querySelector('#match-location-input').value = '';
    } catch (err) {
        msgBox.innerHTML = `<div class="message-box error">${err.message}</div>`;
    }
}

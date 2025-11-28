// /js/screens/PositionSelection.js

import { updatePlayerProfile } from '../ApiService.js'; // ⬅️ ПУТЬ ИСПРАВЛЕН
import { navigateTo } from '../main.js'; 

// ------------------------------------------------------------------------
// СОСТОЯНИЕ
// ------------------------------------------------------------------------

let screenState = {
    selectedPositionId: null,
    // Получаем никнейм из хранилища (если есть)
    nickname: localStorage.getItem('player_nickname') || '@ivan_football' 
};

let rootElement; 
// ⬅️ ПУТЬ К ШАБЛОНУ ИСПРАВЛЕН
const TEMPLATE_URL = '../position-selection.html';

// ------------------------------------------------------------------------
// ЛОГИКА
// ------------------------------------------------------------------------

/**
 * Главная функция, которая загружает шаблон, рендерит экран и привязывает события.
 */
export async function renderPositionSelectionScreen(targetElement) {
    rootElement = targetElement;
    
    // 1. 📡 Загрузка внешнего HTML-шаблона
    try {
        const response = await fetch(TEMPLATE_URL);
        if (!response.ok) {
             rootElement.innerHTML = `<div class="message-box error">Ошибка загрузки шаблона: ${response.status}</div>`;
             return;
        }
        const html = await response.text();
        
        // 2. 🖼️ Вставка разметки в DOM
        rootElement.innerHTML = html;
        
        // 3. ⭐️ Инициализация UI и привязка событий
        initializeUI();
        bindEvents();
        updateButtonState(); 

    } catch (error) {
        console.error("Fetch error:", error);
        rootElement.innerHTML = `<div class="message-box error">Ошибка сети при загрузке шаблона.</div>`;
    }
}

function initializeUI() {
    // Устанавливаем никнейм из состояния в поле ввода
    const nicknameInput = rootElement.querySelector('#nickname-input');
    if (nicknameInput) {
         nicknameInput.value = screenState.nickname;
    }
    // Если позиция уже была выбрана (например, в состоянии), отображаем ее
    updateSelectedCard(screenState.selectedPositionId);
}


function updateButtonState() {
    const isEnabled = screenState.nickname.trim() !== "" && screenState.selectedPositionId !== null;
    const button = rootElement.querySelector('#save-button');
    if (button) {
        button.disabled = !isEnabled;
    }
}

function showMessage(type, message) {
    const container = rootElement.querySelector('#message-container');
    if (container) {
        container.innerHTML = `<div class="message-box ${type}">${message}</div>`;
        setTimeout(() => { container.innerHTML = ''; }, 5000);
    }
}

function updateSelectedCard(selectedId) {
    // 1. Сброс предыдущих стилей со всех карточек
    rootElement.querySelectorAll('.position-card').forEach(card => {
        card.classList.remove('selected-card', 'glow-border');
        // Возвращаем дефолтные стили границы
        card.classList.add('border-border-dark'); 
        
        // Сброс иконки: делаем ее серой
        const icon = card.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.classList.remove('text-primary');
            icon.classList.add('text-text-dark-secondary');
        }
        
        // Удаляем "галочку"
        const check = card.querySelector('.check-icon');
        if(check) {
            check.remove();
        }
    });

    // 2. Применение стилей к выбранной карточке
    const selectedCard = rootElement.querySelector(`[data-id="${selectedId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected-card', 'glow-border');
        selectedCard.classList.remove('border-border-dark');
        
        // Стили иконки: делаем ее синей
        const icon = selectedCard.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.classList.add('text-primary');
            icon.classList.remove('text-text-dark-secondary');
        }

        // Добавляем "галочку" (Ваша разметка из шаблона)
        selectedCard.insertAdjacentHTML('afterbegin', `
            <div class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary check-icon">
                <span class="material-icons text-sm text-white">check</span>
            </div>
        `);
    }
}

function handlePositionClick(event) {
    const card = event.currentTarget.closest('[data-id]');
    const positionId = card.getAttribute('data-id');

    screenState.selectedPositionId = positionId;
    updateSelectedCard(positionId);
    updateButtonState();
}

/**
 * Отправка данных на Spring бэкенд
 */
async function handleSaveClick() {
    if (!screenState.nickname || !screenState.selectedPositionId) return;
    
    const button = rootElement.querySelector('#save-button');
    const oldText = button.textContent;
    
    button.disabled = true;
    button.textContent = "Сохранение..."; 
    rootElement.querySelector('#message-container').innerHTML = ''; // Очищаем сообщения

    try {
        // Вызов API (Spring бэкенд)
        const response = await updatePlayerProfile(screenState.nickname, screenState.selectedPositionId);
        
        // Сохраняем и переходим
        localStorage.setItem('player_nickname', response.nickname);
        localStorage.setItem('profileSetupNeeded', 'false');

        showMessage('success', response.message);
        
        setTimeout(() => { navigateTo('dashboard'); }, 1000);
        
    } catch (error) {
        // Обработка ошибки
        showMessage('error', error.message || 'Неизвестная ошибка сохранения.');
        button.textContent = oldText;
        button.disabled = false;
        updateButtonState();
    }
}

function bindEvents() {
    // 1. Позиции
    rootElement.querySelectorAll('[data-id]').forEach(card => {
        card.addEventListener('click', handlePositionClick);
    });

    // 2. Никнейм
    const nicknameInput = rootElement.querySelector('#nickname-input');
    nicknameInput.addEventListener('input', (e) => {
        screenState.nickname = e.target.value;
        localStorage.setItem('player_nickname', screenState.nickname); 
        updateButtonState();
    });

    // 3. Кнопка
    rootElement.querySelector('#save-button').addEventListener('click', handleSaveClick);
}
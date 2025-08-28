const API_BASE = 'http://localhost:3000/api/auth';
let currentToken = localStorage.getItem('jwt_token') || '';

// Элементы DOM
const resultsDiv = document.getElementById('results');
const tokenDisplay = document.getElementById('tokenDisplay');
const userInfo = document.getElementById('userInfo');
const userData = document.getElementById('userData');

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    updateTokenDisplay();
    if (currentToken) {
        getCurrentUser();
    }
});

// Регистрация
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value
    };

    try {
        showResult('⏳ Регистрируем пользователя...', 'info');
        
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        
        if (response.ok) {
            showResult('✅ Регистрация успешна!', 'success');
            currentToken = data.token;
            saveToken();
            showUserInfo(data.user);
        } else {
            showResult(`❌ Ошибка: ${data.message}`, 'error');
        }
    } catch (error) {
        showResult('❌ Ошибка сети', 'error');
    }
});

// Вход
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const credentials = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    try {
        showResult('⏳ Входим в систему...', 'info');
        
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();
        
        if (response.ok) {
            showResult('✅ Вход выполнен успешно!', 'success');
            currentToken = data.token;
            saveToken();
            showUserInfo(data.user);
        } else {
            showResult(`❌ Ошибка: ${data.message}`, 'error');
        }
    } catch (error) {
        showResult('❌ Ошибка сети', 'error');
    }
});

// Получить текущего пользователя
async function getCurrentUser() {
    if (!currentToken) return;

    try {
        const response = await fetch(`${API_BASE}/me`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            showUserInfo(data.user);
        } else {
            logout();
        }
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
    }
}

// Защищенные данные
async function getProtectedData() {
    if (!currentToken) {
        showResult('❌ Сначала войдите в систему', 'error');
        return;
    }

    try {
        showResult('⏳ Запрашиваем защищенные данные...', 'info');
        
        const response = await fetch('http://localhost:3000/api/protected', {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            showResult('✅ Защищенные данные:\n' + JSON.stringify(data, null, 2), 'success');
        } else {
            showResult(`❌ Ошибка: ${data.message}`, 'error');
        }
    } catch (error) {
        showResult('❌ Ошибка сети', 'error');
    }
}

// Обновить токен
async function refreshToken() {
    if (!currentToken) {
        showResult('❌ Нет токена для обновления', 'error');
        return;
    }

    try {
        showResult('⏳ Обновляем токен...', 'info');
        
        const response = await fetch(`${API_BASE}/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            showResult('✅ Токен обновлен!', 'success');
            currentToken = data.token;
            saveToken();
        } else {
            showResult(`❌ Ошибка: ${data.message}`, 'error');
        }
    } catch (error) {
        showResult('❌ Ошибка сети', 'error');
    }
}

// Выйти
function logout() {
    currentToken = '';
    saveToken();
    userInfo.style.display = 'none';
    showResult('👋 Вы вышли из системы', 'info');
}

// Копировать токен
function copyToken() {
    if (!currentToken) {
        showResult('❌ Нет токена для копирования', 'error');
        return;
    }

    navigator.clipboard.writeText(currentToken)
        .then(() => showResult('✅ Токен скопирован в буфер обмена', 'success'))
        .catch(() => showResult('❌ Не удалось скопировать токен', 'error'));
}

// Вспомогательные функции
function showResult(message, type) {
    resultsDiv.innerHTML = `<div class="${type}">${message}</div>`;
}

function updateTokenDisplay() {
    tokenDisplay.value = currentToken;
}

function saveToken() {
    localStorage.setItem('jwt_token', currentToken);
    updateTokenDisplay();
}

function showUserInfo(user) {
    userData.innerHTML = `
        <strong>ID:</strong> ${user.id}<br>
        <strong>Username:</strong> ${user.username}<br>
        <strong>Email:</strong> ${user.email}<br>
        <strong>Created:</strong> ${new Date(user.createdAt).toLocaleString()}
    `;
    userInfo.style.display = 'block';
}
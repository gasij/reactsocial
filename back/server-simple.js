// server-simple.js - простой тестовый сервер без базы данных
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Разрешаем все CORS для тестирования
app.use(cors({
    origin: true, // разрешаем все домены
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Простые тестовые маршруты
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Простой сервер работает!',
        timestamp: new Date().toISOString()
    });
});

// Тестовый POST запрос
app.post('/api/test', (req, res) => {
    res.json({ 
        message: 'Тестовый POST запрос успешен!',
        receivedData: req.body,
        timestamp: new Date().toISOString()
    });
});

// Простая имитация регистрации
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    
    console.log('Регистрация:', { username, email });
    
    if (!username || !email || !password) {
        return res.status(400).json({ 
            message: 'Все поля обязательны для заполнения' 
        });
    }
    
    // Имитация успешной регистрации
    res.status(201).json({
        message: 'Пользователь успешно зарегистрирован!',
        user: {
            id: 1,
            username: username,
            email: email,
            createdAt: new Date().toISOString()
        },
        token: 'fake-jwt-token-for-testing-12345'
    });
});

// Простая имитация входа
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('Вход:', { email });
    
    if (!email || !password) {
        return res.status(400).json({ 
            message: 'Email и пароль обязательны' 
        });
    }
    
    // Имитация успешного входа
    res.json({
        message: 'Вход выполнен успешно!',
        user: {
            id: 1,
            username: 'testuser',
            email: email,
            createdAt: new Date().toISOString()
        },
        token: 'fake-jwt-token-for-testing-12345'
    });
});

// Защищенный маршрут (имитация)
app.get('/api/protected', (req, res) => {
    const token = req.headers.authorization;
    
    if (!token || !token.includes('Bearer')) {
        return res.status(401).json({ 
            message: 'Требуется авторизация' 
        });
    }
    
    res.json({
        message: 'Добро пожаловать в защищенную зону!',
        user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com'
        },
        secretData: 'Это очень секретные данные 🔐',
        timestamp: new Date().toISOString()
    });
});

// Обработка ошибок 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Маршрут не найден',
        path: req.originalUrl
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('====================================');
    console.log('🚀 ПРОСТОЙ ТЕСТОВЫЙ СЕРВЕР ЗАПУЩЕН');
    console.log('====================================');
    console.log(`📍 Порт: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('------------------------------------');
    console.log('📋 Доступные endpoints:');
    console.log('GET  /api/health           - Проверка работы сервера');
    console.log('POST /api/test             - Тестовый POST запрос');
    console.log('POST /api/auth/register    - Регистрация пользователя');
    console.log('POST /api/auth/login       - Вход в систему');
    console.log('GET  /api/protected        - Защищенный маршрут');
    console.log('====================================');
});

// Обработка graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Сервер останавливается...');
    process.exit(0);
});
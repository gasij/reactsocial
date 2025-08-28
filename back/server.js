require('dotenv').config();
const http = require('http');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    const method = req.method;

    console.log(`📨 ${method} ${url}`);

    try {
        // Health check
        if (url === '/api/health' && method === 'GET') {
            const result = await pool.query('SELECT 1');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'OK', 
                database: 'Connected',
                timestamp: new Date().toISOString()
            }));
            return;
        }

        // Login endpoint
        if (url === '/api/auth/login' && method === 'POST') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    console.log('📦 Body received:', body);
                    
                    const data = JSON.parse(body);
                    const { email, password } = data;

                    if (!email || !password) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Email и пароль обязательны' }));
                        return;
                    }

                    console.log(`🔐 Login attempt for: ${email}`);

                    // Ищем пользователя в базе
                    const userResult = await pool.query(
                        'SELECT id, username, email, password FROM users WHERE email = $1',
                        [email]
                    );

                    if (userResult.rows.length === 0) {
                        console.log('❌ User not found');
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Неверные учетные данные' }));
                        return;
                    }

                    const user = userResult.rows[0];
                    console.log('👤 User found:', user.username);

                    // Проверяем пароль
                    const isPasswordValid = await bcrypt.compare(password, user.password);
                    
                    if (!isPasswordValid) {
                        console.log('❌ Invalid password');
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Неверные учетные данные' }));
                        return;
                    }

                    // Генерируем токен
                    const token = generateToken(user.id);
                    console.log('✅ Login successful, token generated');

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        message: 'Вход выполнен успешно!',
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email
                        },
                        token: token
                    }));

                } catch (error) {
                    console.error('❌ Login error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        message: 'Внутренняя ошибка сервера',
                        error: error.message 
                    }));
                }
            });
            return;
        }

        // Register endpoint
        if (url === '/api/auth/register' && method === 'POST') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const { username, email, password } = data;

                    if (!username || !email || !password) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Все поля обязательны' }));
                        return;
                    }

                    // Хешируем пароль
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Сохраняем пользователя
                    const result = await pool.query(
                        `INSERT INTO users (username, email, password) 
                         VALUES ($1, $2, $3) 
                         RETURNING id, username, email, created_at`,
                        [username, email, hashedPassword]
                    );

                    const user = result.rows[0];
                    const token = generateToken(user.id);

                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        message: 'Пользователь создан успешно!',
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            createdAt: user.created_at
                        },
                        token: token
                    }));

                } catch (error) {
                    console.error('Registration error:', error);
                    
                    if (error.code === '23505') { // unique violation
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Пользователь с таким email или username уже существует' }));
                    } else {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Ошибка при создании пользователя' }));
                    }
                }
            });
            return;
        }

        // Если маршрут не найден
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Маршрут не найден' }));

    } catch (error) {
        console.error('❌ Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Внутренняя ошибка сервера',
            error: error.message 
        }));
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('====================================');
    console.log('🚀 СЕРВЕР С ЛОГИРОВАНИЕМ ЗАПУЩЕН');
    console.log('====================================');
    console.log(`📍 Порт: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('====================================');
});
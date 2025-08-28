require('dotenv').config();
const http = require('http');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const MessageHandler = require('./message-handler');
const authMiddleware = require('./middleware/auth');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const messageHandler = new MessageHandler();
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Функция для обработки тела запроса
const parseRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
    });
};

// Функция для отправки JSON ответа
const sendJsonResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
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
            sendJsonResponse(res, 200, { 
                status: 'OK', 
                database: 'Connected',
                timestamp: new Date().toISOString()
            });
            return;
        }

        // ==================== АУТЕНТИФИКАЦИЯ ====================
        // Login endpoint
        if (url === '/api/auth/login' && method === 'POST') {
            try {
                const data = await parseRequestBody(req);
                const { email, password } = data;

                if (!email || !password) {
                    return sendJsonResponse(res, 400, { message: 'Email и пароль обязательны' });
                }

                const userResult = await pool.query(
                    'SELECT id, username, email, password FROM users WHERE email = $1',
                    [email]
                );

                if (userResult.rows.length === 0) {
                    return sendJsonResponse(res, 401, { message: 'Неверные учетные данные' });
                }

                const user = userResult.rows[0];
                const isPasswordValid = await bcrypt.compare(password, user.password);
                
                if (!isPasswordValid) {
                    return sendJsonResponse(res, 401, { message: 'Неверные учетные данные' });
                }

                const token = generateToken(user.id);
                sendJsonResponse(res, 200, {
                    message: 'Вход выполнен успешно!',
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    },
                    token: token
                });

            } catch (error) {
                console.error('Login error:', error);
                sendJsonResponse(res, 500, { 
                    message: 'Внутренняя ошибка сервера',
                    error: error.message 
                });
            }
            return;
        }

        // Register endpoint
        if (url === '/api/auth/register' && method === 'POST') {
            try {
                const data = await parseRequestBody(req);
                const { username, email, password } = data;

                if (!username || !email || !password) {
                    return sendJsonResponse(res, 400, { message: 'Все поля обязательны' });
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const result = await pool.query(
                    `INSERT INTO users (username, email, password) 
                     VALUES ($1, $2, $3) 
                     RETURNING id, username, email, created_at`,
                    [username, email, hashedPassword]
                );

                const user = result.rows[0];
                const token = generateToken(user.id);

                sendJsonResponse(res, 201, {
                    message: 'Пользователь создан успешно!',
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        createdAt: user.created_at
                    },
                    token: token
                });

            } catch (error) {
                console.error('Registration error:', error);
                if (error.code === '23505') {
                    sendJsonResponse(res, 400, { message: 'Пользователь с таким email или username уже существует' });
                } else {
                    sendJsonResponse(res, 500, { message: 'Ошибка при создании пользователя' });
                }
            }
            return;
        }

        // ==================== СООБЩЕНИЯ ====================
        // Get users list
        if (url === '/api/users' && method === 'GET') {
            authMiddleware(req, async (error, userId) => {
                if (error) {
                    return sendJsonResponse(res, 401, { message: 'Неавторизован' });
                }

                try {
                    const users = await messageHandler.getUsers(userId);
                    sendJsonResponse(res, 200, { users });
                } catch (error) {
                    console.error('Users error:', error);
                    sendJsonResponse(res, 500, { message: 'Ошибка получения пользователей' });
                }
            });
            return;
        }

        // Send message
        if (url === '/api/messages/send' && method === 'POST') {
            authMiddleware(req, async (error, userId) => {
                if (error) {
                    return sendJsonResponse(res, 401, { message: 'Неавторизован' });
                }

                try {
                    const data = await parseRequestBody(req);
                    const { receiver_id, message_text } = data;

                    if (!receiver_id || !message_text) {
                        return sendJsonResponse(res, 400, { message: 'receiver_id и message_text обязательны' });
                    }

                    const message = await messageHandler.sendMessage(userId, receiver_id, message_text);
                    sendJsonResponse(res, 201, { 
                        message: 'Сообщение отправлено',
                        message_data: message
                    });

                } catch (error) {
                    console.error('Send message error:', error);
                    sendJsonResponse(res, 500, { message: 'Ошибка отправки сообщения' });
                }
            });
            return;
        }

        // Get conversation
        if (url.startsWith('/api/messages/') && method === 'GET') {
            authMiddleware(req, async (error, userId) => {
                if (error) {
                    return sendJsonResponse(res, 401, { message: 'Неавторизован' });
                }

                try {
                    const other_user_id = url.split('/').pop();
                    const messages = await messageHandler.getConversation(userId, other_user_id);
                    sendJsonResponse(res, 200, { messages });
                } catch (error) {
                    console.error('Get messages error:', error);
                    sendJsonResponse(res, 500, { message: 'Ошибка получения сообщений' });
                }
            });
            return;
        }

        // ==================== DEBUG ЭНДПОИНТЫ ====================
        // Debug endpoint - получить всех пользователей
        if (url === '/api/debug/users' && method === 'GET') {
            try {
                const result = await pool.query('SELECT id, username, email, created_at FROM users ORDER BY id');
                console.log('📊 Users in database:', result.rows);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    total: result.rows.length,
                    users: result.rows 
                }));
            } catch (error) {
                console.error('Debug users error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Ошибка получения пользователей' }));
            }
            return;
        }

        // Debug endpoint - создать тестовых пользователей
        if (url === '/api/debug/create-test-users' && method === 'POST') {
            try {
                console.log('🛠️ Creating test users...');
                
                const testUsers = [
                    { username: 'alice', email: 'alice@example.com', password: 'password123' },
                    { username: 'bob', email: 'bob@example.com', password: 'password123' },
                    { username: 'charlie', email: 'charlie@example.com', password: 'password123' },
                    { username: 'diana', email: 'diana@example.com', password: 'password123' }
                ];

                let createdCount = 0;

                for (const user of testUsers) {
                    try {
                        // Проверяем, существует ли пользователь
                        const existingUser = await pool.query(
                            'SELECT id FROM users WHERE email = $1',
                            [user.email]
                        );

                        if (existingUser.rows.length === 0) {
                            const hashedPassword = await bcrypt.hash(user.password, 10);
                            await pool.query(
                                'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
                                [user.username, user.email, hashedPassword]
                            );
                            createdCount++;
                            console.log(`✅ Created user: ${user.username}`);
                        }
                    } catch (error) {
                        console.log(`⚠️ Error creating ${user.username}:`, error.message);
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    message: `Создано ${createdCount} пользователей`,
                    total: createdCount
                }));

            } catch (error) {
                console.error('Create test users error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Ошибка создания пользователей' }));
            }
            return;
        }

        // Если маршрут не найден
        sendJsonResponse(res, 404, { message: 'Маршрут не найден' });

    } catch (error) {
        console.error('Server error:', error);
        sendJsonResponse(res, 500, { 
            message: 'Внутренняя ошибка сервера',
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('====================================');
    console.log('🚀 СЕРВЕР ЗАПУЩЕН');
    console.log('====================================');
    console.log(`📍 Порт: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('====================================');
});
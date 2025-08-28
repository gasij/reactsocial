// simple-server-http.js - с улучшенным логированием
require('dotenv').config();
const http = require('http');

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('✅ Preflight request handled');
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Parse URL
    const url = req.url;
    const method = req.method;
    
    console.log(`📨 ${method} ${url}`, req.headers);

    // Health check
    if (url === '/api/health' && method === 'GET') {
        console.log('✅ Health check passed');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'OK', 
            message: 'HTTP Server is running!',
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    // Handle POST requests
    if (method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = body ? JSON.parse(body) : {};
                console.log('📦 Request body:', data);

                if (url === '/api/auth/register') {
                    console.log('👤 Registration attempt:', data.email);
                    
                    if (!data.username || !data.email || !data.password) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            message: 'Все поля обязательны: username, email, password' 
                        }));
                        return;
                    }
                    
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        message: 'Регистрация успешна!',
                        user: {
                            id: Math.floor(Math.random() * 1000),
                            username: data.username,
                            email: data.email,
                            createdAt: new Date().toISOString()
                        },
                        token: 'test-jwt-token-' + Math.random().toString(36).substr(2)
                    }));
                    return;
                }
                
                if (url === '/api/auth/login') {
                    console.log('🔐 Login attempt:', data.email);
                    
                    if (!data.email || !data.password) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            message: 'Email и пароль обязательны' 
                        }));
                        return;
                    }
                    
                    // Простая проверка пароля (для теста)
                    if (data.password.length < 6) {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            message: 'Неверные учетные данные' 
                        }));
                        return;
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        message: 'Вход успешен!',
                        user: {
                            id: 1,
                            username: data.email.split('@')[0],
                            email: data.email,
                            createdAt: new Date().toISOString()
                        },
                        token: 'test-jwt-token-' + Math.random().toString(36).substr(2)
                    }));
                    return;
                }
                
                // Unknown POST route
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Route not found' }));
                
            } catch (error) {
                console.error('❌ JSON parse error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Invalid JSON format',
                    details: error.message 
                }));
            }
        });
        
        return;
    }
    
    // Handle GET requests
    if (method === 'GET') {
        if (url === '/api/protected') {
            const authHeader = req.headers.authorization;
            console.log('🔐 Auth header:', authHeader);
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    message: 'Требуется авторизация. Добавьте header: Authorization: Bearer <token>' 
                }));
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'Добро пожаловать в защищенную зону!',
                secret: 'Это очень секретные данные 🔐',
                user: {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com'
                },
                timestamp: new Date().toISOString()
            }));
            return;
        }
        
        // Default GET response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'GET request received',
            url: url,
            timestamp: new Date().toISOString()
        }));
        return;
    }
    
    // Handle other methods
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        message: 'Method not allowed',
        allowed: ['GET', 'POST', 'OPTIONS'] 
    }));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('====================================');
    console.log('🚀 HTTP СЕРВЕР С ЛОГИРОВАНИEM ЗАПУЩЕН');
    console.log('====================================');
    console.log(`📍 Порт: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('------------------------------------');
    console.log('📋 Тестовые данные для входа:');
    console.log('Email: любой валидный email');
    console.log('Password: любой пароль от 6 символов');
    console.log('====================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Сервер останавливается...');
    server.close(() => {
        process.exit(0);
    });
});
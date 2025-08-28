// insert-test-data.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function insertTestData() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Подключаемся к базе данных...');
        
        // Начинаем транзакцию
        await client.query('BEGIN');

        // Хешируем пароли
        const saltRounds = 10;
        const password1 = await bcrypt.hash('password123', saltRounds);
        const password2 = await bcrypt.hash('testpass456', saltRounds);
        const password3 = await bcrypt.hash('admin789', saltRounds);

        // Вставляем пользователей
        console.log('👥 Добавляем тестовых пользователей...');
        
        const users = [
            {
                username: 'john_doe',
                email: 'john@example.com',
                password: password1
            },
            {
                username: 'jane_smith',
                email: 'jane@example.com',
                password: password2
            },
            {
                username: 'admin_user',
                email: 'admin@example.com',
                password: password3
            }
        ];

        for (const user of users) {
            const result = await client.query(
                `INSERT INTO users (username, email, password) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (email) DO NOTHING 
                 RETURNING id, username, email, created_at`,
                [user.username, user.email, user.password]
            );
            
            if (result.rows.length > 0) {
                console.log(`✅ Добавлен пользователь: ${user.username} (${user.email})`);
            } else {
                console.log(`⚠️  Пользователь уже существует: ${user.email}`);
            }
        }

        // Коммитим транзакцию
        await client.query('COMMIT');
        console.log('🎉 Тестовые данные успешно добавлены!');

        // Показываем всех пользователей
        const allUsers = await client.query('SELECT id, username, email, created_at FROM users');
        console.log('\n📊 Все пользователи в базе:');
        console.table(allUsers.rows);

    } catch (error) {
        // Откатываем транзакцию в случае ошибки
        await client.query('ROLLBACK');
        console.error('❌ Ошибка при добавлении данных:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Запускаем скрипт
insertTestData();
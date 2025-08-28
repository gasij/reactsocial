// create-test-user.js
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

async function createTestUser() {
    try {
        const email = 'test@example.com';
        const password = 'password123'; // тот же пароль, что и во фронтенде
        const username = 'testuser';
        
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Вставляем пользователя
        const result = await pool.query(
            `INSERT INTO users (username, email, password) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) DO UPDATE SET password = $3
             RETURNING id, username, email`,
            [username, email, hashedPassword]
        );
        
        console.log('✅ Тестовый пользователь создан/обновлен:');
        console.log('👤 Username:', result.rows[0].username);
        console.log('📧 Email:', result.rows[0].email);
        console.log('🔑 Password (plain):', password);
        console.log('🔐 Password (hashed):', hashedPassword);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await pool.end();
    }
}

createTestUser();
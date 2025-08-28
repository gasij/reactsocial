// test-db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testConnection() {
    try {
        console.log('🔗 Testing database connection...');
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Database connected successfully!');
        console.log('🕒 Current time in DB:', result.rows[0].current_time);
        
        // Проверим таблицу users
        const usersResult = await pool.query('SELECT COUNT(*) FROM users');
        console.log(`👥 Users in database: ${usersResult.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    } finally {
        await pool.end();
    }
}

testConnection();
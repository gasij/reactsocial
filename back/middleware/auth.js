const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const auth = async (req, callback) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        
        if (!token) {
            return callback(new Error('Токен отсутствует'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Проверяем что пользователь существует
        const userResult = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [decoded.id]
        );
        
        if (userResult.rows.length === 0) {
            return callback(new Error('Пользователь не найден'));
        }

        callback(null, decoded.id);
        
    } catch (error) {
        callback(error);
    }
};

module.exports = auth;
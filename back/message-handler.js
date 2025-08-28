const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

class MessageHandler {
    constructor() {
        this.init();
    }

    async init() {
        await this.createTables();
        console.log('✅ Message handler initialized');
    }

    async createTables() {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS private_messages (
                    id SERIAL PRIMARY KEY,
                    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    message_text TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_private_messages_sender 
                ON private_messages(sender_id)
            `);
            
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_private_messages_receiver 
                ON private_messages(receiver_id)
            `);

            console.log('✅ Message tables created');
        } catch (error) {
            console.log('ℹ️ Message tables already exist');
        }
    }

    // Получить список пользователей (исключая текущего)
    async getUsers(currentUserId) {
        const result = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id != $1 ORDER BY username',
            [currentUserId]
        );
        return result.rows;
    }

    // Отправить сообщение
    async sendMessage(senderId, receiverId, messageText) {
        const result = await pool.query(
            `INSERT INTO private_messages (sender_id, receiver_id, message_text) 
             VALUES ($1, $2, $3) 
             RETURNING id, sender_id, receiver_id, message_text, created_at`,
            [senderId, receiverId, messageText]
        );
        return result.rows[0];
    }

    // Получить историю переписки
    async getConversation(userId1, userId2) {
        const result = await pool.query(
            `SELECT pm.*, u.username as sender_username 
             FROM private_messages pm
             JOIN users u ON pm.sender_id = u.id
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [userId1, userId2]
        );
        return result.rows;
    }
}

module.exports = MessageHandler;
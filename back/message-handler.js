const { Pool } = require('pg');

class MessageHandler {
    constructor(pool, io) {
        this.pool = pool;
        this.io = io;
    }

    async sendMessage(senderId, receiverId, messageText) {
        try {
            const result = await this.pool.query(
                `INSERT INTO messages (sender_id, receiver_id, message_text, timestamp) 
                 VALUES ($1, $2, $3, NOW()) 
                 RETURNING *`,
                [senderId, receiverId, messageText]
            );

            const message = result.rows[0];
            
            // Отправляем сообщение получателю через WebSocket
            if (this.io) {
                this.io.to(receiverId.toString()).emit('new_message', message);
            }
            
            return message;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }

    async getConversation(userId, otherUserId) {
        try {
            const result = await this.pool.query(
                `SELECT * FROM messages 
                 WHERE (sender_id = $1 AND receiver_id = $2) 
                 OR (sender_id = $2 AND receiver_id = $1) 
                 ORDER BY timestamp ASC`,
                [userId, otherUserId]
            );
            return result.rows;
        } catch (error) {
            console.error('Get conversation error:', error);
            throw error;
        }
    }

    async getUsers(currentUserId) {
        try {
            const result = await this.pool.query(
                `SELECT id, username, email, created_at 
                 FROM users 
                 WHERE id != $1 
                 ORDER BY username`,
                [currentUserId]
            );
            return result.rows;
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }
}

module.exports = MessageHandler;
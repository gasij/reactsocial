import React from 'react';
import './Chat.css';

const ChatWindow = ({ user, onLogout }) => {
  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <h3>{user.username}</h3>
              <span className="user-status">online</span>
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn">
            🚪
          </button>
        </div>
        
        <div className="chats-list">
          <div className="chat-item">
            <div className="chat-avatar">👥</div>
            <div className="chat-info">
              <h4>Общий чат</h4>
              <p>Последнее сообщение...</p>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h2>💬 Общий чат</h2>
        </div>
        
        <div className="messages-container">
          <div className="message received">
            <div className="message-content">
              <p>Добро пожаловать в Messenger!</p>
            </div>
            <span className="message-time">12:00</span>
          </div>
          
          <div className="message sent">
            <div className="message-content">
              <p>Привет! Как дела?</p>
            </div>
            <span className="message-time">12:01</span>
          </div>
        </div>

        <div className="message-input">
          <input 
            type="text" 
            placeholder="Введите сообщение..."
            className="input-field"
          />
          <button className="send-btn">📤</button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
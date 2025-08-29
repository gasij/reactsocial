import React, { useState, useEffect } from 'react';
import './ChatWindow.css';

const ChatWindow = ({ user, onLogout, newMessages, onClearMessages }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  // Правильное объявление константы
  const API_BASE_URL = 'http://localhost:3000';

  // Загрузка списка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users...');
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Users response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Users received:', data.users);
          setUsers(data.users);
        } else {
          console.error('Users fetch failed:', response.status);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user, API_BASE_URL]);

  // Обработка новых сообщений из WebSocket
  useEffect(() => {
    if (newMessages.length > 0) {
      console.log('New WebSocket messages:', newMessages);
      const updatedConversations = { ...conversations };
      
      newMessages.forEach(message => {
        // Преобразуем ID в числа для consistency
        const messageSenderId = parseInt(message.sender_id);
        const messageReceiverId = parseInt(message.receiver_id);
        const currentUserId = parseInt(user.id);
        
        const otherUserId = messageSenderId === currentUserId 
          ? messageReceiverId 
          : messageSenderId;
        
        console.log('Processing message for chat:', otherUserId);
        
        if (!updatedConversations[otherUserId]) {
          updatedConversations[otherUserId] = [];
        }
        
        // Проверяем, нет ли уже такого сообщения
        if (!updatedConversations[otherUserId].some(m => m.id === message.id)) {
          updatedConversations[otherUserId].push(message);
        }
      });
      
      setConversations(updatedConversations);
      onClearMessages();
    }
  }, [newMessages, user.id, onClearMessages, conversations]);

  // Загрузка истории сообщений при выборе чата
  useEffect(() => {
    const loadConversation = async () => {
      if (!activeChat) return;

      setLoading(true);
      try {
        console.log('Loading conversation with:', activeChat);
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/api/messages/${activeChat}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Conversation response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Messages received:', data.messages);
          
          setConversations(prev => ({
            ...prev,
            [activeChat]: data.messages
          }));
        } else {
          console.error('Conversation load failed:', response.status);
          const errorText = await response.text();
          console.error('Error details:', errorText);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [activeChat, API_BASE_URL]);

  // Отправка сообщения
  const sendMessage = async () => {
    if (!messageText.trim() || !activeChat) return;

    try {
      const token = localStorage.getItem('jwt_token');
      console.log('Sending message to:', activeChat);
      
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: parseInt(activeChat),
          message_text: messageText
        })
      });

      console.log('Send message response status:', response.status);
      
      if (response.ok) {
        setMessageText('');
        const result = await response.json();
        console.log('Message sent successfully:', result);
      } else {
        const errorText = await response.text();
        console.error('Send message failed:', errorText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Преобразуем activeChat в число для сравнения
  const numericActiveChat = activeChat ? parseInt(activeChat) : null;
  const numericUserId = user.id ? parseInt(user.id) : null;

  return (
    <div className="chat-container">
      {/* Боковая панель с пользователями */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Пользователи</h3>
          <button onClick={onLogout} className="logout-btn">
            Выйти
          </button>
        </div>
        <div className="users-list">
          {users.map(otherUser => {
            const numericOtherId = parseInt(otherUser.id);
            return (
              <div
                key={numericOtherId}
                className={`user-item ${numericActiveChat === numericOtherId ? 'active' : ''}`}
                onClick={() => setActiveChat(numericOtherId)}
              >
                <div className="user-avatar">
                  {otherUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="username">{otherUser.username}</div>
                  <div className="email">{otherUser.email}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Окно чата */}
      <div className="chat-area">
        {activeChat ? (
          <>
            <div className="chat-header">
              <h3>
                Чат с {users.find(u => parseInt(u.id) === numericActiveChat)?.username}
                {loading && ' (загрузка...)'}
              </h3>
            </div>
            
            <div className="messages-container">
              {conversations[activeChat]?.map(message => {
                const numericSenderId = parseInt(message.sender_id);
                return (
                  <div
                    key={message.id}
                    className={`message ${
                      numericSenderId === numericUserId ? 'sent' : 'received'
                    }`}
                  >
                    <div className="message-content">
                      {message.message_text}
                    </div>
                    <div className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
              
              {conversations[activeChat]?.length === 0 && !loading && (
                <div className="no-messages">
                  <p>Нет сообщений. Начните общение!</p>
                </div>
              )}
            </div>

            <div className="message-input">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите сообщение..."
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Выберите пользователя для начала общения</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
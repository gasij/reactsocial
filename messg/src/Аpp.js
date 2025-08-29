import React, { useState, useEffect } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatWindow from './components/Chat/ChatWindow';
import { webSocketService } from './services/websocket-service';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newMessages, setNewMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Подключаем WebSocket после авторизации
      webSocketService.connect(token);
      
      // Настраиваем обработчик новых сообщений
      webSocketService.onMessage((message) => {
        console.log('New message received:', message);
        setNewMessages(prev => [...prev, message]);
        
        // Можно добавить уведомление
        if (Notification.permission === 'granted' && message.sender_id !== userData.id) {
          new Notification('Новое сообщение', {
            body: message.message_text
          });
        }
      });
    }

    // Запрашиваем разрешение на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Очистка при размонтировании
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    // Подключаем WebSocket после логина
    const token = localStorage.getItem('jwt_token');
    if (token) {
      webSocketService.connect(token);
      
      webSocketService.onMessage((message) => {
        console.log('New message after login:', message);
        setNewMessages(prev => [...prev, message]);
      });
    }
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    // Подключаем WebSocket после регистрации
    const token = localStorage.getItem('jwt_token');
    if (token) {
      webSocketService.connect(token);
      
      webSocketService.onMessage((message) => {
        console.log('New message after register:', message);
        setNewMessages(prev => [...prev, message]);
      });
    }
  };

  const handleLogout = () => {
    // Отключаем WebSocket
    webSocketService.disconnect();
    
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentView('login');
    setNewMessages([]);
  };

  const switchToRegister = () => setCurrentView('register');
  const switchToLogin = () => setCurrentView('login');

  // Функция для очистки полученных сообщений
  const clearNewMessages = () => {
    setNewMessages([]);
  };

  if (isAuthenticated) {
    return (
      <ChatWindow 
        user={user} 
        onLogout={handleLogout}
        newMessages={newMessages}
        onClearMessages={clearNewMessages}
      />
    );
  }

  return (
    <div className="App">
      {currentView === 'login' ? (
        <Login 
          onLogin={handleLogin} 
          onSwitchToRegister={switchToRegister}
        />
      ) : (
        <Register 
          onRegister={handleRegister} 
          onSwitchToLogin={switchToLogin}
        />
      )}
    </div>
  );
}

export default App;
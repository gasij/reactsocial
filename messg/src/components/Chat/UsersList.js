import React, { useState, useEffect } from 'react';
import { messageService } from '../../services/messages';
import './Chat.css';

const UsersList = ({ onSelectUser, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await messageService.getUsers();
      setUsers(response.users);
    } catch (error) {
      setError('Ошибка загрузки пользователей');
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Загрузка пользователей...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="users-list">
      <h3>👥 Пользователи ({users.length})</h3>
      <div className="users-container">
        {users.length === 0 ? (
          <div className="empty-state">
            <p>Нет других пользователей</p>
            <small>Зарегистрируйтесь с другого аккаунта</small>
          </div>
        ) : (
          users.map(user => (
            <div
              key={user.id}
              className="user-item"
              onClick={() => onSelectUser(user)}
            >
              <div className="user-avatar">👤</div>
              <div className="user-info">
                <h4>{user.username}</h4>
                <p>{user.email}</p>
                <small>ID: {user.id}</small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersList;
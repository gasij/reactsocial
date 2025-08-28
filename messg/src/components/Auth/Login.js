import React, { useState } from 'react';
import { authService } from '../../services/auth';
import './Auth.css';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData);
      const { token, user } = response;
      
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">💬</div>
          <h1>Messenger</h1>
          <p>Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Вход...' : 'Войти в аккаунт'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Нет аккаунта?{' '}
            <span className="auth-link" onClick={onSwitchToRegister}>
              Создать аккаунт
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
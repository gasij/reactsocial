const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// Генерация JWT токена
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Пользователь с таким email или username уже существует'
      });
    }

    // Создаем нового пользователя
    const user = await User.create({ username, email, password });

    // Генерируем токен
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Пользователь успешно создан',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // Проверяем пароль
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    // Генерируем токен
    const token = generateToken(user.id);

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Получение текущего пользователя
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: req.user.toSafeObject()
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновление токена
router.post('/refresh', auth, async (req, res) => {
  try {
    const token = generateToken(req.user.id);
    res.json({ token });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;
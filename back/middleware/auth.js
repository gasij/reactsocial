const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    // Получаем токен из заголовка
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Токен отсутствует' });
    }

    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Находим пользователя
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    // Добавляем пользователя в запрос
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Неверный токен' });
  }
};

module.exports = auth;
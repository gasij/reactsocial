const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    dialectOptions: config.dialectOptions
  }
);

// Импортируем модели
const User = require('./User')(sequelize, DataTypes);

// Синхронизация с базой данных
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL established successfully.');
    
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Database synchronization error:', error);
    process.exit(1);
  }
};

// Экспортируем модели и sequelize
const db = {
  sequelize,
  Sequelize,
  User
};

module.exports = db;
module.exports.syncDatabase = syncDatabase;
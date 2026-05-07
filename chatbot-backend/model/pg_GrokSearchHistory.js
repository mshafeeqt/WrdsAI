const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connectPG');

const GrokSearchHistory = sequelize.define('GrokSearchHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  query: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  summary: {
    type: DataTypes.TEXT,
  },
  tokenUsage: {
    type: DataTypes.JSONB,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general',
  },
  resultsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  raw: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [{ fields: ['email'] }]
});

module.exports = GrokSearchHistory;

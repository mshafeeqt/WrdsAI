const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connectPG');

const SearchHistory = sequelize.define('SearchHistory', {
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
  summaryWordCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  summaryTokenCount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  summary: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
  indexes: [{ fields: ['email'] }]
});

module.exports = SearchHistory;

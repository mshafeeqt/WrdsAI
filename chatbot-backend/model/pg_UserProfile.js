const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connectPG');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  keyFacts: {
    type: DataTypes.JSONB,
    comment: 'Stores key facts about the user, e.g., name, grade, favorite subject.',
  },
  preferences: {
    type: DataTypes.JSONB,
    comment: 'Stores user preferences, e.g., prefers concise answers, likes examples.',
  },
  currentGoals: {
    type: DataTypes.TEXT,
    comment: 'Stores the user\'s current learning or usage goals.',
  },
  longTermSummary: {
    type: DataTypes.TEXT,
    comment: 'A running summary of all past conversations to provide long-term context.',
  }
}, {
  timestamps: true,
});

module.exports = UserProfile;

import { DataTypes } from 'sequelize';
import { sequelize } from '../postgres/connect.js';

const ChatSession = sequelize.define('ChatSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING, // To link back during migration
    allowNull: false,
  },
  history: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  grandTotalTokens: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'chat',
  },
}, {
  timestamps: true,
  indexes: [{ fields: ['sessionId'] }, { fields: ['email'] }]
});

export default ChatSession;

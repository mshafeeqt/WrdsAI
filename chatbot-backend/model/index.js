const { sequelize } = require('../db/connectPG');
const User = require('./pg_User');
const ChatSession = require('./pg_ChatSession');
const SearchHistory = require('./pg_SearchHistory');
const GrokSearchHistory = require('./pg_GrokSearchHistory');
const UserProfile = require('./pg_UserProfile');

// Define relationships
User.hasMany(ChatSession, { foreignKey: 'userId' });
ChatSession.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(SearchHistory, { foreignKey: 'userId' });
SearchHistory.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(GrokSearchHistory, { foreignKey: 'userId' });
GrokSearchHistory.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(UserProfile, { foreignKey: 'userId' });
UserProfile.belongsTo(User, { foreignKey: 'userId' });


const db = {
  sequelize,
  User,
  ChatSession,
  SearchHistory,
  GrokSearchHistory,
  UserProfile
};

module.exports = db;

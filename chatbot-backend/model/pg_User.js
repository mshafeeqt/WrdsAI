import { DataTypes } from 'sequelize';
import { sequelize } from '../postgres/connect.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  mobile: {
    type: DataTypes.STRING,
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  ageGroup: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  className: {
    type: DataTypes.STRING,
  },
  parentName: {
    type: DataTypes.STRING,
  },
  parentEmail: {
    type: DataTypes.STRING,
  },
  parentMobile: {
    type: DataTypes.STRING,
  },
  subscriptionPlan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  childPlan: {
    type: DataTypes.STRING,
  },
  subscriptionType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
  },
  remainingTokens: {
    type: DataTypes.FLOAT,
  },
  planStartDate: {
    type: DataTypes.DATE,
  },
  planExpiryDate: {
    type: DataTypes.DATE,
  },
  planExpiryEmailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: true,
});

export default User;

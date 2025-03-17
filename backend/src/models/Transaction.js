const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Token = require('./Token');

const Transaction = sequelize.define('Transaction', {
  txHash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  from: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  to: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

Transaction.belongsTo(Token, { foreignKey: 'tokenId' });

module.exports = Transaction;